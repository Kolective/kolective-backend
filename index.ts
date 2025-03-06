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
    res.status(500).json({ error: "Failed to initialize tokens" });
  }
};

export const getTokens = async (req: Request, res: Response) => {
  try {
    const tokens = await prisma.token.findMany();
    res.json(tokens);
  } catch (error) {
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

    const createTweets = (kolId: number) => {
      return Array.from({ length: 5 }).map(() => {
        const token = getRandomToken();
        const timestamp = getTimestamp(Math.floor(Math.random() * 14));
        return {
          tokenId: token.id,
          content: `Tweet about ${token.symbol}`,
          signal: Math.random() > 0.5 ? "BUY" as const : "SELL" as const,
          risk: ["LOW" as const, "MEDIUM" as const, "HIGH" as const][Math.floor(Math.random() * 3)],
          timestamp: timestamp,
          expired: timestamp < getTimestamp(7),
          valid: Math.random() > 0.7,
        };
      });
    };

    const createKOLs = async (count: any, recommendation: any) => {
      for (let i = 0; i < count; i++) {
        const kol = await prisma.kOL.create({
          data: {
            name: `KOL ${recommendation} ${i + 1}`,
            username: `kol_${recommendation.toLowerCase()}_${i + 1}`,
            avatar: `https://picsum.photos/200/200?random=${i + 1}`,
            followersTwitter: Math.floor(Math.random() * 100000),
            followersKOL: Math.floor(Math.random() * 10000),
            avgProfitD: Math.floor(Math.random() * 100),
          },
        });
        const tweets = createTweets(kol.id);
        await prisma.tweet.createMany({ data: tweets.map(t => ({ ...t, kolId: kol.id })) });
      }
    };

    await Promise.all([
      createKOLs(4, "CONSERVATIVE"),
      createKOLs(3, "BALANCED"),
      createKOLs(5, "AGGRESSIVE"),
    ]);

    res.json({ message: "KOLs and tweets seeded successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to seed KOLs and tweets" });
  }
};

export const getAllKOL = async (req: Request, res: Response) => {
  try {
    const kols = await prisma.kOL.findMany();
    res.json(kols);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve KOLs" });
  }
};

export const getKOLByUsername = async (req: Request, res: Response) => {
  try {
    const kol = await prisma.kOL.findUnique({ where: { username: req.params.username } });
    kol ? res.json(kol) : res.status(404).json({ error: "KOL not found" });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve KOL" });
  }
};

export const getKOLById = async (req: Request, res: Response) => {
  try {
    const kol = await prisma.kOL.findUnique({ where: { id: Number(req.params.id) } });
    kol ? res.json(kol) : res.status(404).json({ error: "KOL not found" });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve KOL" });
  }
};

export const addKOL = async (req: Request, res: Response) => {
  try {
    const kol = await prisma.kOL.create({ data: req.body });
    res.json(kol);
  } catch (error) {
    res.status(500).json({ error: "Failed to add KOL" });
  }
};

export const updateKOL = async (req: Request, res: Response) => {
  try {
    const kol = await prisma.kOL.update({ where: { id: req.body.id }, data: req.body });
    res.json(kol);
  } catch (error) {
    res.status(500).json({ error: "Failed to update KOL" });
  }
};

export const deleteKOL = async (req: Request, res: Response) => {
  try {
    await prisma.kOL.delete({ where: { id: req.body.id } });
    res.json({ message: "KOL deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete KOL" });
  }
};

export const getAllTweet = async (req: Request, res: Response) => {
  try {
    const tweets = await prisma.tweet.findMany();
    res.json(tweets);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve tweets" });
  }
}

export const getTweetByKOLId = async (req: Request, res: Response) => {
  try {
    const tweets = await prisma.tweet.findMany({ where: { kolId: Number(req.params.id) } });
    res.json(tweets);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve tweets" });
  }
}

export const getTweetById = async (req: Request, res: Response) => {
  try {
    const tweet = await prisma.tweet.findUnique({ where: { id: Number(req.params.id) } });
    tweet ? res.json(tweet) : res.status(404).json({ error: "Tweet not found" });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve tweet" });
  }
}

export const addTweetByKOLId = async (req: Request, res: Response) => {
  try {
    const tweet = await prisma.tweet.create({ data: req.body });
    res.json(tweet);
  } catch (error) {
    res.status(500).json({ error: "Failed to add tweet" });
  }
}

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
app.put("/api/kol/update", updateKOL);
app.delete("/api/kol/delete", deleteKOL);

// TWEET
app.get("/api/tweet", getAllTweet);
app.get("/api/tweet/kol/:id", getTweetByKOLId);
app.get("/api/tweet/:id", getTweetById);
app.post("/api/tweet/add", addTweetByKOLId);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;