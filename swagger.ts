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
  // "host": "localhost:5000",
  "basePath": "/api",
  "schemes": ["https"],
  // "schemes": ["http"],
  "paths": {
    "/kol/seed": {
      "get": {
        "summary": "Seed KOL data into the database",
        "tags": ["KOL"],
        "responses": {
          "200": { "description": "KOLs and tweets seeded successfully" }
        }
      }
    },
    "/kol": {
      "get": {
        "summary": "Retrieve all KOLs",
        "tags": ["KOL"],
        "responses": {
          "200": { "description": "List of all KOLs retrieved successfully" }
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
            "schema": { "type": "string" },
            "description": "Twitter username of the KOL"
          }
        ],
        "responses": {
          "200": { "description": "KOL data retrieved successfully" },
          "404": { "description": "KOL not found" }
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
            "schema": { "type": "integer" },
            "description": "ID of the KOL"
          }
        ],
        "responses": {
          "200": {
            "description": "KOL data retrieved successfully"
          },
          "404": {
            "description": "KOL not found"
          }
        }
      }
    },
    "/kol/add": {
      "post": {
        "summary": "Add a new KOL",
        "tags": ["KOL"],
        "parameters": [
          {
            "in": "body",
            "name": "body",
            "required": true,
            "schema": {
              "type": "object",
              "required": ["name", "username", "avatar", "followersTwitter", "followersKOL", "avgProfitD"],
              "properties": {
                "name": { "type": "string", "example": "John Doe" },
                "username": { "type": "string", "example": "johndoe" },
                "avatar": { "type": "string", "example": "https://example.com/avatar.jpg" },
                "followersTwitter": { "type": "integer", "example": 10000 },
                "followersKOL": { "type": "integer", "example": 5000 },
                "avgProfitD": { "type": "integer", "example": 200 }
              }
            }
          }
        ],
        "responses": {
          "201": { "description": "KOL added successfully" },
          "400": { "description": "Invalid request data" }
        }
      }
    },
    "/kol/update/{id}": {
      "put": {
        "summary": "Update KOL data",
        "tags": ["KOL"],
        "parameters": [
          {
            "in": "path",
            "name": "id",
            "required": true,
            "type": "integer",
            "description": "ID of the KOL"
          },
          {
            "in": "body",
            "name": "body",
            "required": true,
            "schema": {
              "type": "object",
              "properties": {
                "name": { "type": "string" },
                "username": { "type": "string" },
                "avatar": { "type": "string" },
                "followersTwitter": { "type": "integer" },
                "followersKOL": { "type": "integer" },
                "avgProfitD": { "type": "integer" }
              }
            }
          }
        ],
        "responses": {
          "200": { "description": "KOL updated successfully" },
          "400": { "description": "Invalid request data" }
        }
      }
    },
    "/kol/delete/{id}": {
      "delete": {
        "summary": "Delete a KOL",
        "tags": ["KOL"],
        "parameters": [
          {
            "in": "path",
            "name": "id",
            "required": true,
            "schema": { "type": "integer" },
            "description": "ID of the KOL"
          }
        ],
        "responses": {
          "200": {
            "description": "KOL deleted successfully"
          },
          "404": {
            "description": "KOL not found"
          }
        }
      }
    },
    "/kol/deleteAll": {
      "delete": {
        "summary": "Delete all KOLs",
        "tags": ["KOL"],
        "responses": {
          "200": {
            "description": "All KOLs deleted successfully"
          }
        }
      }
    },
    "/kol/follow": {
      "post": {
        "summary": "Follow a KOL",
        "tags": ["KOL"],
        "parameters": [
          {
            "in": "body",
            "name": "body",
            "required": true,
            "schema": {
              "type": "object",
              "required": ["kolId", "userAddress"],
              "properties": {
                "kolId": { "type": "integer", "example": 1 },
                "userAddress": { "type": "string", "example": "0x1234567890abcdef" }
              }
            }
          }
        ],
        "responses": {
          "200": { "description": "KOL followed successfully" },
          "400": { "description": "Invalid request data" }
        }
      }
    },
    "/kol/unfollow": {
      "delete": {
        "summary": "Unfollow a KOL",
        "tags": ["KOL"],
        "parameters": [
          {
            "in": "body",
            "name": "body",
            "required": true,
            "schema": {
              "type": "object",
              "required": ["kolId", "userAddress"],
              "properties": {
                "kolId": { "type": "integer", "example": 1 },
                "userAddress": { "type": "string", "example": "0x1234567890abcdef" }
              }
            }
          }
        ],
        "responses": {
          "200": { "description": "KOL unfollowed successfully" },
          "400": { "description": "Invalid request data" }
        }
      }
    },
    "/kol/followed/{userAddress}": {
      "get": {
        "summary": "Retrieve KOLs followed by a user",
        "tags": ["KOL"],
        "parameters": [
          {
            "in": "path",
            "name": "userAddress",
            "required": true,
            "schema": { "type": "string" },
            "description": "User address of the follower"
          }
        ],
        "responses": {
          "200": { "description": "List of KOLs followed by the user retrieved successfully" },
          "404": { "description": "No KOLs found for the given user address" }
        }
      }
    },
    "/tweet": {
      "get": {
        "summary": "Retrieve all tweets",
        "tags": ["Tweet"],
        "responses": {
          "200": {
            "description": "List of all tweets retrieved successfully"
          }
        }
      }
    },
    "/tweet/id/{id}": {
      "get": {
        "summary": "Retrieve tweet by ID",
        "tags": ["Tweet"],
        "parameters": [
          {
            "in": "path",
            "name": "id",
            "required": true,
            "schema": { "type": "integer" },
            "description": "ID of the tweet"
          }
        ],
        "responses": {
          "200": {
            "description": "Tweet retrieved successfully"
          },
          "404": {
            "description": "Tweet not found"
          }
        }
      }
    },
    "/tweet/kol/{id}": {
      "get": {
        "summary": "Retrieve tweets by KOL ID",
        "tags": ["Tweet"],
        "parameters": [
          {
            "in": "path",
            "name": "id",
            "required": true,
            "schema": { "type": "integer" },
            "description": "ID of the KOL"
          }
        ],
        "responses": {
          "200": {
            "description": "Tweets retrieved successfully"
          },
          "404": {
            "description": "No tweets found for the given KOL ID"
          }
        }
      }
    },
    "/tweet/add": {
      "post": {
        "summary": "Add a new tweet for a KOL",
        "tags": ["Tweet"],
        "parameters": [
          {
            "in": "body",
            "name": "body",
            "required": true,
            "schema": {
              "type": "object",
              "required": ["kolId", "tokenId", "content", "signal", "risk", "timestamp"],
              "properties": {
                "kolId": { "type": "integer", "example": 1 },
                "tokenId": { "type": "integer", "example": 42 },
                "content": { "type": "string", "example": "🚀 Bitcoin is pumping! Buy now!" },
                "signal": { "type": "string", "enum": ["BUY", "SELL"], "example": "BUY" },
                "risk": { "type": "string", "enum": ["CONSERVATIVE", "BALANCED", "AGGRESSIVE"], "example": "AGGRESSIVE" },
                "timestamp": { "type": "integer", "format": "int64", "example": 1719710400000 },
                "expired": { "type": "boolean", "example": false },
                "valid": { "type": "boolean", "example": true }
              }
            }
          }
        ],
        "responses": {
          "201": {
            "description": "Tweet added successfully",
            "content": {
              "application/json": {
                "example": {
                  "tweetId": 123,
                  "message": "Tweet added successfully"
                }
              }
            }
          },
          "400": {
            "description": "Invalid request data",
            "content": {
              "application/json": {
                "example": { "error": "kolId and tokenId are required" }
              }
            }
          },
          "404": {
            "description": "KOL or Token not found",
            "content": {
              "application/json": {
                "example": { "error": "KOL not found" }
              }
            }
          },
          "500": {
            "description": "Server error",
            "content": {
              "application/json": {
                "example": { "error": "Failed to add tweet" }
              }
            }
          }
        }
      }
    },
    "/tweet/update/{id}": {
      "put": {
        "summary": "Update tweet EXPIRED AND VALID status",
        "tags": ["Tweet"],
        "parameters": [
          {
            "in": "path",
            "name": "id",
            "required": true,
            "type": "integer",
            "description": "ID of the tweet"
          },
          {
            "in": "body",
            "name": "body",
            "required": true,
            "schema": {
              "type": "object",
              "properties": {
                "expired": { "type": "boolean", "example": false },
                "valid": { "type": "boolean", "example": true }
              }
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Tweet updated successfully"
          },
          "400": {
            "description": "Invalid request data"
          },
          "404": {
            "description": "Tweet not found"
          }
        }
      }
    },
    "/token/init": {
      "get": {
        "summary": "Initialize tokens",
        "tags": ["Token"],
        "responses": {
          "200": {
            "description": "Tokens initialized successfully"
          }
        }
      }
    },
    "/token/data": {
      "get": {
        "summary": "Retrieve all tokens",
        "tags": ["Token"],
        "responses": {
          "200": {
            "description": "List of all tokens retrieved successfully"
          }
        }
      }
    },
    "/token/update/{id}": {
      "put": {
        "summary": "Update token PRICE CHANGE 24H",
        "tags": ["Token"],
        "parameters": [
          {
            "in": "path",
            "name": "id",
            "required": true,
            "type": "integer",
            "description": "ID of the token"
          },
          {
            "in": "body",
            "name": "body",
            "required": true,
            "schema": {
              "type": "object",
              "properties": {
                "priceChange24H": { "type": "number", "example": 0.05 },
              }
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Token updated successfully"
          },
          "400": {
            "description": "Invalid request data"
          },
          "404": {
            "description": "Token not found"
          }
        }
      }
    },
    "/token/deleteAll": {
      "delete": {
        "summary": "Delete all tokens",
        "tags": ["Token"],
        "responses": {
          "200": {
            "description": "All tokens deleted successfully"
          }
        }
      }
    },
  }
}

export function setupSwagger(app: Express) {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.use("/docs/static", express.static(resolve(__dirname, "node_modules/swagger-ui-dist")));

  app.get("/docs", (req, res) => {
    res.redirect("/docs/");
  });
}