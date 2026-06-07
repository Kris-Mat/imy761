// app.js
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const cors = require("cors");

const app = express();
const port = 3000;

const corsOptions = {
  origin: ["http://localhost:4000"],
};

app.use(cors(corsOptions));

// Swagger definition
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'My API',
            version: '1.0.0',
            description: 'API documentation using Swagger',
        },
        servers: [
            {
                url: `http://localhost:${port}`,
            },
        ],
  components: {
    securitySchemes: {
        bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT', 
        },
    },
},
    },
    apis: ['./routes/*.js'], // Path to your API docs
};

// using the routes in the app 
const swaggerDocs = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const userRoutes = require('./routes/user');
app.use('/api', userRoutes);


// starting the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});