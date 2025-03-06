import { Router } from "express";
import {
  getAllTweet,
  addTweetByKOLId,
  getTweetById,
  getTweetByKOLId
} from "../index.js";

const router = Router();

/**
 * @swagger
 * /api/tweet:
 *   get:
 *     summary: Retrieve all tweets
 *     tags: [Tweet]
 *     responses:
 *       200:
 *         description: List of all tweets retrieved successfully
 */
router.get("/api/tweet", getAllTweet);

/**
 * @swagger
 * /api/tweet/kol/{id}:
 *   get:
 *     summary: Retrieve tweets by KOL ID
 *     tags: [Tweet]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the KOL
 *     responses:
 *       200:
 *         description: Tweets retrieved successfully
 */
router.get("/api/tweet/kol/:id", getTweetByKOLId);

/**
 * @swagger
 * /api/tweet/{id}:
 *   get:
 *     summary: Retrieve tweet by ID
 *     tags: [Tweet]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the tweet
 *     responses:
 *       200:
 *         description: Tweet retrieved successfully
 */
router.get("/api/tweet/:id", getTweetById);

/**
 * @swagger
 * /api/tweet/add:
 *   post:
 *     summary: Add a new tweet for a KOL
 *     tags: [Tweet]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               kolId:
 *                 type: integer
 *               content:
 *                 type: string
 *               signal:
 *                 type: string
 *                 enum: [BUY, SELL]
 *               risk:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *               timestamp:
 *                 type: integer
 *               expired:
 *                 type: boolean
 *               valid:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tweet added successfully
 */
router.post("/api/tweet/add", addTweetByKOLId);

export default router;