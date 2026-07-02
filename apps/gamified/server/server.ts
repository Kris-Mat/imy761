import express, { Application, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import cors from 'cors';
import dotenv from "dotenv";
import path from "path";
import { RegisterRoutes } from './src/swagger/routes';

const app: Application = express();

dotenv.config({ path: path.resolve(__dirname, '.env') });
const serverPort = process.env.PORT_SERVER || 3000;
const clientPort = process.env.PORT_CLIENT;

const corsOptions = {
  origin: [`http://localhost:${clientPort}`]
};

app.use(cors(corsOptions));

// 1. Serve the freshly generated Swagger UI spec file
app.use('/docs', swaggerUi.serve, async (_req: Request, res: Response) => {
  const swaggerDocument = await import('./src/swagger/swagger.json');
  return res.send(swaggerUi.generateHTML(swaggerDocument));
});

// 2. Register the tsoa engine routes
RegisterRoutes(app); 

// starting the server
app.listen(serverPort, () => {
  console.log(`Server running at http://localhost:${serverPort}`);
});