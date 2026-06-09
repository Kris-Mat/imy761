// app.js
import express, { Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import cors from 'cors';
import dotenv from "dotenv";
import path from "path";
import userRoutes from './src/routes/user.ts';

const app: Application = express();

dotenv.config({ path: path.resolve(__dirname) });
const serverPort = process.env.PORT_SERVER || 3000;
const clientPort = process.env.PORT_CLIENT;

const corsOptions = {
  origin: [`http://localhost:${clientPort}`]
};

app.use(cors(corsOptions));

// Swagger definition
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'My API',
      version: '1.0.0',
      description: 'API documentation using Swagger'
    },
    servers: [
      {
        url: `http://localhost:${serverPort}`
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT' 
        }
      }
    }
  },
  apis: ['./routes/*.js'] // Path to your API docs
};

// using the routes in the app 
const swaggerDocs = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use('/api', userRoutes);


// starting the server
app.listen(serverPort, () => {
  console.log(`Server running at http://localhost:${serverPort}`);
});