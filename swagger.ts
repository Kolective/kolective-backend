import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import type { Express } from "express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "KOL Management API",
      version: "1.0.0",
      description: "API documentation for managing KOL data, token trading, and statistics",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local development server",
      },
      {
        url: "https://kolective-backend.vercel.app",
        description: "Production server",
      },
    ],
    schemes: ["http", "https"],
  },
  apis: ["./routes/*.ts", "./routes/*.js"], 
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(specs));
}