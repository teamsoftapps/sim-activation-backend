// swaggerOptions.js
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "My API",
      version: "1.0.0",
      description: "API Documentation for my Node.js project",
    },
    servers: [
      {
        url: "http://localhost:3000", // Adjust if you're deploying
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },

        apiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
        },
      },
    },
    // Optional: Global security (if many endpoints require auth)
    security: [
      {
        bearerAuth: [],
        apiKeyAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js"], // ✅ Corrected path to your actual route files
};

export default options;
