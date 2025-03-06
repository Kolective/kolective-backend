import express from "express";
import type { Request, Response } from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import { Prisma, PrismaClient } from "@prisma/client";
import { setupSwagger } from "./swagger.js";
import { TOKEN_DATA } from "./data/token.js";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Custom middleware to handle BigInt serialization
app.use((req, res, next) => {
  // Override the default res.json method
  const originalJson = res.json;
  res.json = function(obj) {
    return originalJson.call(this, JSON.parse(JSON.stringify(obj, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value
    )));
  };
  next();
});

// Helper function to safely serialize data with BigInt values
const serializeData = (data: any) => {
  return JSON.parse(JSON.stringify(data, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value
  ));
};

export const initTokens = async (req: Request, res: Response) => {
  try {
    for (const token of TOKEN_DATA) {
      await prisma.token.upsert({
        where: { addressToken: token.address },
        update: {},
        create: {
          name: token.name,
          symbol: token.symbol,
          addressToken: token.address,
          chain: token.chain,
          decimals: token.decimals,
          logo: token.logoURI,
          priceChange24H: token.price,
          tags: token.tags,
        },
      });
    }
    res.json({ message: "Tokens initialized" });
  } catch (error) {
    console.error("Token initialization error:", error);
    res.status(500).json({ error: "Failed to initialize tokens" });
  }
};

export const getTokens = async (req: Request, res: Response) => {
  try {
    const tokens = await prisma.token.findMany();
    if (!tokens || tokens.length === 0) {
      res.status(404).json({ message: "No tokens found" });
    }
    res.json({ tokens: serializeData(tokens) });
  } catch (error) {
    console.error("Error retrieving tokens:", error);
    res.status(500).json({ error: "Failed to retrieve tokens" });
  }
};

export const seedKOL = async (req: Request, res: Response) => {
  try {
    const tokens = await prisma.token.findMany();
    if (tokens.length === 0) {
      res.status(400).json({ error: "No tokens found. Please initialize tokens first." });
    }

    const getRandomToken = () => tokens[Math.floor(Math.random() * tokens.length)];
    const getTimestamp = (daysAgo: number) => Math.floor(Date.now() / 1000) - daysAgo * 86400;

    const createTweets = async (kolId: number) => {
      const tweetData = Array.from({ length: 5 }).map(() => {
        const token = getRandomToken();
        const timestamp = getTimestamp(Math.floor(Math.random() * 14));
        return {
          kolId: kolId,
          tokenId: token.id,
          content: `Tweet about ${token.symbol}`,
          signal: Math.random() > 0.5 ? "BUY" as const : "SELL" as const,
          risk: ["LOW", "MEDIUM", "HIGH"][Math.floor(Math.random() * 3)] as any,
          timestamp: timestamp,
          expired: timestamp < getTimestamp(7),
          valid: Math.random() > 0.7,
        };
      });
      
      for (const tweet of tweetData) {
        await prisma.tweet.create({ data: tweet });
      }
      
      return tweetData.length;
    };

    const createKOLs = async (recommendation: "CONSERVATIVE" | "BALANCED" | "AGGRESSIVE") => {
      const count = Math.floor(Math.random() * (5 - 3 + 1)) + 3; 
      const kols = [];
      let totalTweets = 0;
      
      for (let i = 0; i < count; i++) {
        const kol = await prisma.kOL.create({
          data: {
            name: `KOL ${recommendation} ${i + 1}`,
            username: `kol_${recommendation.toLowerCase()}_${i + 1}`,
            avatar: `https://picsum.photos/200/200?random=${i + 1}`,
            followersTwitter: Math.floor(Math.random() * 1000000),
            followersKOL: Math.floor(Math.random() * 10000),
            avgProfitD: Math.floor(Math.random() * 50),
            riskRecommendation: recommendation,
          },
        });
        
        kols.push(kol);

        const tweetCount = await createTweets(kol.id);
        totalTweets += tweetCount;
      }
      
      return { kols, totalTweets };
    };

    const conservative = await createKOLs("CONSERVATIVE");
    const balanced = await createKOLs("BALANCED");
    const aggressive = await createKOLs("AGGRESSIVE");
    
    const allKOLs = [
      ...conservative.kols,
      ...balanced.kols, 
      ...aggressive.kols
    ];
    
    const totalTweets = conservative.totalTweets + balanced.totalTweets + aggressive.totalTweets;
    
    const sortedByFollowers = [...allKOLs].sort((a, b) => b.followersKOL - a.followersKOL);
    
    const sortedByProfit = [...allKOLs].sort((a, b) => b.avgProfitD - a.avgProfitD);
    
    for (let i = 0; i < sortedByFollowers.length; i++) {
      const kol = sortedByFollowers[i];
      await prisma.kOL.update({
        where: { id: kol.id },
        data: { rankFollowersKOL: i + 1 }
      });
    }
    
    for (let i = 0; i < sortedByProfit.length; i++) {
      const kol = sortedByProfit[i];
      await prisma.kOL.update({
        where: { id: kol.id },
        data: { rankAvgProfitD: i + 1 }
      });
    }

    res.json({
      message: "KOLs and tweets seeded successfully with ranking data",
      totalKOLs: allKOLs.length,
      totalTweets: totalTweets
    });
  } catch (error) {
    console.error("Error seeding KOLs and tweets:", error);
    res.status(500).json({ error: "Failed to seed KOLs and tweets" });
  }
};

export const getAllKOL = async (req: Request, res: Response) => {
  try {
    const kols = await prisma.kOL.findMany({ 
      include: { 
        tweets: {
          include: {
            token: true
          }
        } 
      } 
    });
    
    if (!kols || kols.length === 0) {
      res.status(404).json({ message: "No KOLs found" });
    }
    
    // Use the serialization helper to handle BigInt values
    res.json({ kols: serializeData(kols) });
  } catch (error) {
    console.error("Error retrieving KOLs:", error);
    res.status(500).json({ error: "Failed to retrieve KOLs" });
  }
};

export const getKOLByUsername = async (req: Request, res: Response) => {
  try {
    const username = req.params.username;
    if (!username) {
      res.status(400).json({ error: "Username parameter is required" });
    }
    
    const kol = await prisma.kOL.findUnique({ 
      where: { username },
      include: {
        tweets: {
          include: {
            token: true
          }
        }
      }
    });
    
    if (!kol) {
      res.status(404).json({ error: "KOL not found" });
    }
    
    // Use the serialization helper to handle BigInt values
    res.json({ kol: serializeData(kol) });
  } catch (error) {
    console.error("Error retrieving KOL by username:", error);
    res.status(500).json({ error: "Failed to retrieve KOL" });
  }
};

export const getKOLById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID format" });
    }
    
    const kol = await prisma.kOL.findUnique({ 
      where: { id },
      include: {
        tweets: {
          include: {
            token: true
          }
        }
      }
    });
    
    if (!kol) {
      res.status(404).json({ error: "KOL not found" });
    }
    
    // Use the serialization helper to handle BigInt values
    res.json({ kol: serializeData(kol) });
  } catch (error) {
    console.error("Error retrieving KOL by ID:", error);
    res.status(500).json({ error: "Failed to retrieve KOL" });
  }
};

export const addKOL = async (req: Request, res: Response) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({ error: "Request body is required" });
    }
    
    const kol = await prisma.kOL.create({ data: req.body });
    // Use the serialization helper to handle BigInt values
    res.status(201).json({ kol: serializeData(kol) });
  } catch (error) {
    console.error("Error adding KOL:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        res.status(409).json({ error: "A KOL with this username already exists" });
      }
    }
    res.status(500).json({ error: "Failed to add KOL" });
  }
};

export const updateKOL = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID format" });
    }
    
    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({ error: "Request body is required" });
    }
    
    const existingKOL = await prisma.kOL.findUnique({ where: { id } });
    if (!existingKOL) {
      res.status(404).json({ error: "KOL not found" });
    }
    
    const kol = await prisma.kOL.update({ 
      where: { id }, 
      data: req.body 
    });
    
    // Use the serialization helper to handle BigInt values
    res.json({ kol: serializeData(kol) });
  } catch (error) {
    console.error("Error updating KOL:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        res.status(409).json({ error: "A KOL with this username already exists" });
      }
    }
    res.status(500).json({ error: "Failed to update KOL" });
  }
};

export const deleteKOL = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID format" });
    }
    
    const existingKOL = await prisma.kOL.findUnique({ where: { id } });
    if (!existingKOL) {
      res.status(404).json({ error: "KOL not found" });
    }
    
    // First delete associated tweets
    await prisma.tweet.deleteMany({ where: { kolId: id } });
    
    // Then delete the KOL
    await prisma.kOL.delete({ where: { id } });
    
    res.json({ message: "KOL and associated tweets deleted successfully" });
  } catch (error) {
    console.error("Error deleting KOL:", error);
    res.status(500).json({ error: "Failed to delete KOL" });
  }
};

export const deleteAllKOL = async (req: Request, res: Response) => {
  try {
    // First delete all tweets as they depend on KOLs
    await prisma.tweet.deleteMany();
    
    // Then delete all KOLs
    const result = await prisma.kOL.deleteMany();
    
    res.json({ 
      message: "All KOLs and associated tweets deleted successfully",
      count: result.count
    });
  } catch (error) {
    console.error("Error deleting all KOLs:", error);
    res.status(500).json({ error: "Failed to delete all KOLs" });
  }
};

export const getAllTweet = async (req: Request, res: Response) => {
  try {
    const tweets = await prisma.tweet.findMany({
      include: {
        kol: true,
        token: true
      }
    });
    
    if (!tweets || tweets.length === 0) {
      res.status(404).json({ message: "No tweets found" });
    }
    
    // Use the serialization helper to handle BigInt values
    res.json({ tweets: serializeData(tweets) });
  } catch (error) {
    console.error("Error retrieving tweets:", error);
    res.status(500).json({ error: "Failed to retrieve tweets" });
  }
};

export const getTweetByKOLId = async (req: Request, res: Response) => {
  try {
    const kolId = Number(req.params.id);
    if (isNaN(kolId)) {
      res.status(400).json({ error: "Invalid KOL ID format" });
    }
    
    // Check if KOL exists
    const kolExists = await prisma.kOL.findUnique({ where: { id: kolId } });
    if (!kolExists) {
      res.status(404).json({ error: "KOL not found" });
    }
    
    const tweets = await prisma.tweet.findMany({ 
      where: { kolId },
      include: {
        token: true
      }
    });
    
    if (tweets.length === 0) {
      res.json({ message: "No tweets found for this KOL", tweets: [] });
    }
    
    // Use the serialization helper to handle BigInt values
    res.json({ tweets: serializeData(tweets) });
  } catch (error) {
    console.error("Error retrieving tweets by KOL ID:", error);
    res.status(500).json({ error: "Failed to retrieve tweets" });
  }
};

export const getTweetById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid tweet ID format" });
    }
    
    const tweet = await prisma.tweet.findUnique({ 
      where: { id },
      include: {
        kol: true,
        token: true
      }
    });
    
    if (!tweet) {
      res.status(404).json({ error: "Tweet not found" });
    }
    
    // Use the serialization helper to handle BigInt values
    res.json({ tweet: serializeData(tweet) });
  } catch (error) {
    console.error("Error retrieving tweet by ID:", error);
    res.status(500).json({ error: "Failed to retrieve tweet" });
  }
};

export const addTweetByKOLId = async (req: Request, res: Response) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({ error: "Request body is required" });
    }
    
    const { kolId, tokenId } = req.body;
    
    if (!kolId || !tokenId) {
      res.status(400).json({ error: "kolId and tokenId are required" });
    }
    
    // Check if KOL exists
    const kolExists = await prisma.kOL.findUnique({ where: { id: kolId } });
    if (!kolExists) {
      res.status(404).json({ error: "KOL not found" });
    }
    
    // Check if token exists
    const tokenExists = await prisma.token.findUnique({ where: { id: tokenId } });
    if (!tokenExists) {
      res.status(404).json({ error: "Token not found" });
    }
    
    const tweet = await prisma.tweet.create({ data: req.body });
    
    // Use the serialization helper to handle BigInt values
    res.status(201).json({ tweet: serializeData(tweet) });
  } catch (error) {
    console.error("Error adding tweet:", error);
    res.status(500).json({ error: "Failed to add tweet" });
  }
};

app.use(express.json());
setupSwagger(app);

// TOKEN
app.get("/api/token/init", initTokens);
app.get("/api/token/data", getTokens);

// KOL
app.get("/api/kol/seed", seedKOL);
app.get("/api/kol", getAllKOL);
app.get("/api/kol/username/:username", getKOLByUsername);
app.get("/api/kol/id/:id", getKOLById);
app.post("/api/kol/add", addKOL);
app.put("/api/kol/update/:id", updateKOL);
app.delete("/api/kol/delete/:id", deleteKOL);
app.delete("/api/kol/deleteAll", deleteAllKOL);

// TWEET
app.get("/api/tweet", getAllTweet);
app.get("/api/tweet/kol/:id", getTweetByKOLId);
app.get("/api/tweet/:id", getTweetById);
app.post("/api/tweet/add", addTweetByKOLId);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;