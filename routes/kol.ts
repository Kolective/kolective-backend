import { Router } from "express";
import {
  checkKOLDataExists,
  initKOLData,
  getKOLData,
  autoFillKolNullData,
  getKOLByUsername,
  getKOLById,
  updateCustomKOLTradeData,
  updateAllKOLData,
} from "../index.js";

const router = Router();


/**
 * @swagger
 * /api/kol/check:
 *   get:
 *     summary: Check if KOL data and tokens exist
 *     tags: [KOL]
 *     responses:
 *       200:
 *         description: KOL data checked successfully
 */
router.get("/api/kol/check", checkKOLDataExists);

/**
 * @swagger
 * /api/kol/init:
 *   get:
 *     summary: Init or update KOL data
 *     tags: [KOL]
 *     responses:
 *       200:
 *         description: KOL data initd or updated successfully
 */
router.get("/api/kol/init", initKOLData);

/**
 * @swagger
 * /api/kol/data:
 *   get:
 *     summary: Retrieve all KOL data with trading history
 *     tags: [KOL]
 *     responses:
 *       200:
 *         description: List of KOL data
 */
router.get("/api/kol/data", getKOLData);

/**
 * @swagger
 * /api/kol/fill:
 *   get:
 *     summary: Fill empty KOL data fields with random values
 *     tags: [KOL]
 *     responses:
 *       200:
 *         description: KOL data fields filled successfully
 */
router.get("/api/kol/fill", autoFillKolNullData);

/**
 * @swagger
 * /api/kol/username/{username}:
 *   get:
 *     summary: Retrieve KOL data by Twitter username
 *     tags: [KOL]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Twitter username of the KOL
 *     responses:
 *       200:
 *         description: KOL data retrieved successfully
 */
router.get("/api/kol/username/:username", getKOLByUsername);

/**
 * @swagger
 * /api/kol/id/{id}:
 *   get:
 *     summary: Retrieve KOL data by ID
 *     tags: [KOL]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the KOL
 *     responses:
 *       200:
 *         description: KOL data retrieved successfully
 */
router.get("/api/kol/id/:id", getKOLById);

/**
 * @swagger
 * /api/kol/update:
 *   post:
 *     summary: Update trading data for a specific KOL
 *     tags: [KOL]
 *     responses:
 *       200:
 *         description: KOL trading data updated successfully
 */
router.post("/api/kol/update", updateCustomKOLTradeData);

/**
 * @swagger
 * /api/kol/update-all:
 *   post:
 *     summary: Update all KOL data
 *     tags: [KOL]
 *     responses:
 *       200:
 *         description: All KOL data updated successfully
 */
router.post("/api/kol/update-all", updateAllKOLData);

export default router;
