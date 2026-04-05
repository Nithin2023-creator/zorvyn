import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Zorvyn NGO Fund Management API',
            version: '1.0.0',
            description: 'API documentation for the Zorvyn NGO Fund Management System',
        },
        servers: [
            {
                url: '/api',
                description: 'Development Server',
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
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    // Automatically collect swagger annotations across the app
    apis: ['./src/routes/*.ts', './src/controllers/*.ts', './src/app.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
