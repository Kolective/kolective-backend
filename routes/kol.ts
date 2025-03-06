import { Router } from "express";
import {
  seedKOL,
  getAllKOL,
  addKOL,
  deleteKOL,
  updateKOL,
  getKOLById,
  getKOLByUsername,
} from "../index.js";

const router = Router();

/**
 * @swagger
 * /api/kol/seed:
 *   get:
 *     summary: Seed KOL data into the database
 *     tags: [KOL]
 *     responses:
 *       200:
 *         description: KOLs and tweets seeded successfully
 */
router.get("/api/kol/seed", seedKOL);

/**
 * @swagger
 * /api/kol:
 *   get:
 *     summary: Retrieve all KOLs
 *     tags: [KOL]
 *     responses:
 *       200:
 *         description: List of all KOLs retrieved successfully
 */
router.get("/api/kol", getAllKOL);

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
 * /api/kol/add:
 *   post:
 *     summary: Add a new KOL
 *     tags: [KOL]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               username:
 *                 type: string
 *               avatar:
 *                 type: string
 *               followersTwitter:
 *                 type: integer
 *               followersKOL:
 *                 type: integer
 *               avgProfitD:
 *                 type: integer
 *     responses:
 *       200:
 *         description: KOL added successfully
 */
router.post("/api/kol/add", addKOL);

/**
 * @swagger
 * /api/kol/update:
 *   put:
 *     summary: Update KOL data
 *     tags: [KOL]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               name:
 *                 type: string
 *               username:
 *                 type: string
 *               avatar:
 *                 type: string
 *               followersTwitter:
 *                 type: integer
 *               followersKOL:
 *                 type: integer
 *               avgProfitD:
 *                 type: integer
 *     responses:
 *       200:
 *         description: KOL updated successfully
 */
router.put("/api/kol/update", updateKOL);

/**
 * @swagger
 * /api/kol/delete:
 *   delete:
 *     summary: Delete a KOL
 *     tags: [KOL]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: KOL deleted successfully
 */
router.delete("/api/kol/delete", deleteKOL);

export default router;