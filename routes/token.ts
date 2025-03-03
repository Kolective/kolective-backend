import { Router } from "express";
import {
  initializeTokens,
  getTokenByAddress,
} from "../index";
import { TOKEN_DATA } from "../data/token.js";

const router = Router();

/**
 * @swagger
 * /api/tokens/data:
 *   get:
 *     summary: Retrieve a list of tokens
 *     description: Returns an array of tokens with their metadata.
 *     tags: [Tokens]
 *     responses:
 *       200:
 *         description: A list of tokens.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   symbol:
 *                     type: string
 *                   address:
 *                     type: string
 *                   chain:
 *                     type: string
 *                   decimals:
 *                     type: integer
 *                   logoURI:
 *                     type: string
 *                   price:
 *                     type: number
 */
router.get("/api/tokens/data", (req: any, res: any) => { res.json(TOKEN_DATA) });

/**
 * @swagger
 * /api/tokens/init:
 *   get:
 *     summary: Initialize token data
 *     tags: [Tokens]
 *     responses:
 *       200:
 *         description: Token initialization successful
 */
router.get("/api/tokens/init", initializeTokens);

/**
 * @swagger
 * /api/token/address/{address}:
 *   get:
 *     summary: Retrieve token data by address
 *     tags: [Tokens]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Token address
 *     responses:
 *       200:
 *         description: Token data retrieved successfully
 */
router.get("/api/token/address/:address", getTokenByAddress);