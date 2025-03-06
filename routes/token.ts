import { Router } from "express";
import {
  initTokens,
  getTokens
} from "../index.js";

const router = Router();

/**
 * @swagger
 * /api/token/init:
 *   get:
 *     summary: Initialize tokens
 *     tags: [Token]
 *     responses:
 *       200:
 *         description: Tokens initialized successfully
 */
router.get("/api/token/init", initTokens);

/**
 * @swagger
 * /api/token/data:
 *   get:
 *     summary: Retrieve all tokens
 *     tags: [Token]
 *     responses:
 *       200:
 *         description: List of all tokens retrieved successfully
 */
router.get("/api/token/data", getTokens);

export default router;