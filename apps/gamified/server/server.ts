import express, { Application, NextFunction, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import cors from 'cors';
import dotenv from "dotenv";
import path from "path";
import { HttpError } from '@shared/server/src/lib/http-error';
import { RegisterRoutes } from './src/swagger/routes';

const app: Application = express();

dotenv.config({ path: path.resolve(__dirname, '.env') });
const serverPort = process.env.PORT || process.env.PORT_SERVER || 3000;
const clientPort = process.env.PORT_CLIENT;
const clientOrigin = process.env.CLIENT_ORIGIN || `http://localhost:${clientPort}`;

const corsOptions = {
  origin: [clientOrigin]
};

app.use(cors(corsOptions));
app.use(express.json());

// 1. Serve the freshly generated Swagger UI spec file
app.use('/docs', swaggerUi.serve, async (_req: Request, res: Response) => {
  const swaggerDocument = await import('./src/swagger/swagger.json');
  return res.send(swaggerUi.generateHTML(swaggerDocument));
});

// 2. Register the tsoa engine routes
RegisterRoutes(app);

// 3. Map thrown HttpErrors (e.g. the admin role check) to their intended
// status code; tsoa's generated routes just call next(err) on any thrown
// error, which would otherwise always fall through to Express's default
// 500 handler.
// Express only recognises error-handling middleware by this exact 4-param
// arity; _next is required even though it's never called.
// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }
  console.error(err);
  return res.status(500).json({ message: 'Internal server error' });
});

// starting the server
app.listen(serverPort, () => {
  console.log(`Server running at http://localhost:${serverPort}`);
});