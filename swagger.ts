import swaggerUi from "swagger-ui-express";
import type { Express } from "express";
import { resolve } from "path";
import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const swaggerDocument = {
  "swagger": "2.0",
  "info": {
    "version": "1.0.0",
    "title": "Kolective Management API",
    "description": "API documentation for managing KOL data, token trading, and statistics"
  },
  "host": "kolective-backend.vercel.app",
  "basePath": "/api",
  "schemes": ["https"],
  "paths": {
    "/kol/check": {
      "get": {
        "summary": "Check if KOL data and tokens exist",
        "tags": ["KOL"],
        "responses": {
          "200": {
            "description": "KOL data checked successfully"
          }
        }
      }
    },
    "/kol/init": {
      "get": {
        "summary": "Init or update KOL data",
        "tags": ["KOL"],
        "responses": {
          "200": {
            "description": "KOL data initialized or updated successfully"
          }
        }
      }
    },
    "/kol/data": {
      "get": {
        "summary": "Retrieve all KOL data with trading history",
        "tags": ["KOL"],
        "responses": {
          "200": {
            "description": "List of KOL data"
          }
        }
      }
    },
    "/kol/fill": {
      "get": {
        "summary": "Fill empty KOL data fields with random values",
        "tags": ["KOL"],
        "responses": {
          "200": {
            "description": "KOL data fields filled successfully"
          }
        }
      }
    },
    "/kol/username/{username}": {
      "get": {
        "summary": "Retrieve KOL data by Twitter username",
        "tags": ["KOL"],
        "parameters": [
          {
            "in": "path",
            "name": "username",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Twitter username of the KOL"
          }
        ],
        "responses": {
          "200": {
            "description": "KOL data retrieved successfully"
          }
        }
      }
    },
    "/kol/id/{id}": {
      "get": {
        "summary": "Retrieve KOL data by ID",
        "tags": ["KOL"],
        "parameters": [
          {
            "in": "path",
            "name": "id",
            "required": true,
            "schema": {
              "type": "integer"
            },
            "description": "ID of the KOL"
          }
        ],
        "responses": {
          "200": {
            "description": "KOL data retrieved successfully"
          }
        }
      }
    },
    "/kol/update": {
      "post": {
        "summary": "Update trading data for a specific KOL",
        "tags": ["KOL"],
        "responses": {
          "200": {
            "description": "KOL trading data updated successfully"
          }
        }
      }
    },
    "/kol/update-all": {
      "post": {
        "summary": "Update all KOL data",
        "tags": ["KOL"],
        "responses": {
          "200": {
            "description": "All KOL data updated successfully"
          }
        }
      }
    },
    "/token/data": {
      "get": {
        "summary": "Retrieve a list of tokens",
        "description": "Returns an array of tokens with their metadata.",
        "tags": ["Tokens"],
        "responses": {
          "200": {
            "description": "A list of tokens.",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "name": { "type": "string" },
                      "symbol": { "type": "string" },
                      "address": { "type": "string" },
                      "chain": { "type": "string" },
                      "decimals": { "type": "integer" },
                      "logoURI": { "type": "string" },
                      "price": { "type": "number" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/token/init": {
      "get": {
        "summary": "Initialize token data",
        "tags": ["Tokens"],
        "responses": {
          "200": {
            "description": "Token initialization successful"
          }
        }
      }
    },
    "/token/address/{address}": {
      "get": {
        "summary": "Retrieve token data by address",
        "tags": ["Tokens"],
        "parameters": [
          {
            "in": "path",
            "name": "address",
            "required": true,
            "schema": {
              "type": "string"
            },
            "description": "Token address"
          }
        ],
        "responses": {
          "200": {
            "description": "Token data retrieved successfully"
          }
        }
      }
    }
  }
}

export function setupSwagger(app: Express) {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.use("/docs/static", express.static(resolve(__dirname, "node_modules/swagger-ui-dist")));

  app.get("/docs", (req, res) => {
    res.redirect("/docs/");
  });
}