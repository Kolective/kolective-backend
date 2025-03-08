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

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"]
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Custom middleware to handle BigInt serialization
app.use((req, res, next) => {
  // Override the default res.json method
  const originalJson = res.json;
  res.json = function (obj) {
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
    await Promise.all(
      TOKEN_DATA.map((token) =>
        prisma.token.upsert({
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
            tags: Array.isArray(token.tags) ? token.tags : [],
          },
        })
      )
    );

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

export const updateTokenPrice = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid ID format" });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({ error: "Request body is required" });
    }

    const existingToken = await prisma.token.findUnique({ where: { id } });
    if (!existingToken) {
      res.status(404).json({ error: "Token not found" });
    }

    const token = await prisma.token.update({
      where: { id },
      data: {
        priceChange24H: req.body.priceChange24H,
      }
    });

    res.json({ token: serializeData(token) });
  } catch (error) {
    console.error("Error updating token:", error);
    res.status(500).json({ error: "Failed to update token" });
  }
};

export const deleteAllTokens = async (req: Request, res: Response) => {
  try {
    const result = await prisma.token.deleteMany();
    res.json({ message: "All tokens deleted", count: result.count });
  }
  catch (error) {
    console.error("Error deleting all tokens:", error);
    res.status(500).json({ error: "Failed to delete all tokens" });
  }
};

type SignalType = "BUY" | "SELL";

const generateTweetContent = (
  tokenSymbol: string,
  risk: "CONSERVATIVE" | "BALANCED" | "AGGRESSIVE",
  signal: SignalType
): string => {
  const bullishPhrases = [
    `🚀 $${tokenSymbol} is heating up! Bulls stepping in strong! 🔥`,
    `FOMO kicking in? $${tokenSymbol} looks primed for a move! 📈`,
    `$${tokenSymbol} just broke resistance! Next stop: 🚀🚀🚀`,
    `Whales are quietly stacking $${tokenSymbol}... Something big incoming? 🐳`,
    `Looks like $${tokenSymbol} is waking up! Don't miss the train! 🚂`,
    `Market sentiment shifting—$${tokenSymbol} showing strength! 👀`,
  ];

  const bearishPhrases = [
    `⚠️ $${tokenSymbol} struggling at key levels. Breakout or breakdown? 🤔`,
    `Sell pressure increasing on $${tokenSymbol}… Is this a fake pump? 😬`,
    `$${tokenSymbol} just hit resistance hard. Reversal incoming? 📉`,
    `Smart money exiting? Seeing big outflows from $${tokenSymbol}... 🚨`,
    `Weak hands getting shaken out of $${tokenSymbol}. Panic or opportunity? 🧐`,
    `$${tokenSymbol} showing signs of exhaustion. Bulls running out of steam? ❄️`,
  ];

  const generalPhrases = [
    `$${tokenSymbol} catching attention—big move incoming? 👀`,
    `Something is happening with $${tokenSymbol}… Do you see it too? 🤯`,
    `Crypto market wild as always! $${tokenSymbol} making moves. 🔥`,
    `$${tokenSymbol} traders on edge today. What's next? 📊`,
    `Some interesting action on $${tokenSymbol} lately. Accumulation or distribution?`,
    `Devs dropping hints about $${tokenSymbol}… What's cooking? 🍳`,
  ];

  const memePhrases = [
    `$${tokenSymbol} to the moon? 🌕 Or just another trap? 😂`,
    `$${tokenSymbol} believers right now: "We are so back!" vs. "We are so doomed" 🤡`,
    `Crypto Twitter says $${tokenSymbol} is 100x… But they also said that about Luna 💀`,
    `Bagholders watching $${tokenSymbol} dip be like: "It's a long-term hold" 😭`,
    `$${tokenSymbol} - is this finally the moment? Or another fakeout? 🚨`,
    `Every cycle someone says $${tokenSymbol} is dead… and then 🚀`,
  ];

  // Assign weights based on risk level
  let phrasePool = [...generalPhrases]; // Default

  if (risk === "CONSERVATIVE") {
    phrasePool.push(...bullishPhrases);
  } else if (risk === "BALANCED") {
    phrasePool.push(...bullishPhrases, ...bearishPhrases);
  } else if (risk === "AGGRESSIVE") {
    phrasePool.push(...bullishPhrases, ...bearishPhrases, ...memePhrases);
  }

  // Pick a random phrase
  let tweet = phrasePool[Math.floor(Math.random() * phrasePool.length)];

  // Add BUY or SELL context
  if (signal === "BUY") {
    const buyPhrases = [
      `🔥 Time to load up? $${tokenSymbol} looking bullish! #HODL`,
      `🚀 All aboard! $${tokenSymbol} is ready to take off! #Bullish`,
      `📈 Accumulation mode ON! $${tokenSymbol} showing strength. #Crypto`,
      `👀 Smart money is watching $${tokenSymbol}. Are you? #DYOR`,
      `🐂 Bulls taking charge—$${tokenSymbol} might be the next mover! #LFG`,
    ];
    tweet = `🚀 ${tweet} ${buyPhrases[Math.floor(Math.random() * buyPhrases.length)]}`;
  } else {
    const sellPhrases = [
      `⚠️ Caution! $${tokenSymbol} showing signs of weakness. #CryptoWarning`,
      `📉 Could be a trap! Watch out for $${tokenSymbol} price action. #Bearish`,
      `🚨 Risk management is key! $${tokenSymbol} looking shaky. #StaySafe`,
      `💨 Exit liquidity forming? Be careful with $${tokenSymbol}. #CryptoMarket`,
      `🧐 Smart money taking profits? $${tokenSymbol} looking suspicious. #WatchClosely`,
    ];
    tweet = `⚠️ ${tweet} ${sellPhrases[Math.floor(Math.random() * sellPhrases.length)]}`;
  }

  return tweet;
};

export const seedKOL = async (req: Request, res: Response) => {
  try {
    const tokens = await prisma.token.findMany({
      select: { id: true, symbol: true, tags: true },
    });

    if (tokens.length === 0) {
      res.status(400).json({ error: "No tokens found. Please initialize tokens first." });
    }

    const getTimestamp = (daysAgo: number) => Math.floor(Date.now() / 1000) - daysAgo * 86400;

    const filterTokensByRisk = (risk: "CONSERVATIVE" | "BALANCED" | "AGGRESSIVE") => {
      return tokens.filter(token => {
        const tags = token.tags || [];
        if (risk === "CONSERVATIVE") return tags.includes("TOP TIER");
        if (risk === "BALANCED") return tags.includes("TOP 10 MARKET") || tags.includes("TOP TIER");
        if (risk === "AGGRESSIVE") return !tags.includes("WRAPPED TOKEN") && !tags.includes("NATIVE TOKEN");
        return false;
      });
    };

    const createTweets = async (kolId: number, risk: "CONSERVATIVE" | "BALANCED" | "AGGRESSIVE") => {
      const selectRisk = () => {
        const rand = Math.random();
        if (risk === "CONSERVATIVE") return rand < 0.7 ? "CONSERVATIVE" : rand < 0.9 ? "BALANCED" : "AGGRESSIVE";
        if (risk === "BALANCED") return rand < 0.7 ? "BALANCED" : rand < 0.9 ? "CONSERVATIVE" : "AGGRESSIVE";
        return rand < 0.7 ? "AGGRESSIVE" : rand < 0.9 ? "BALANCED" : "CONSERVATIVE";
      };

      const filterTokensForAggressive = () => {
        return tokens.filter(token => !(token.tags && token.tags.length > 0));
      };

      const tweets = [];
      let lastTimestamp = getTimestamp(14);

      // Generate Buy tweets
      const buyCount = Math.floor(Math.random() * (15 - 13 + 1)) + 13; // 13-15 buys
      for (let i = 0; i < buyCount; i++) {
        let tweetRisk: any = selectRisk();
        let validTokens = tweetRisk === "AGGRESSIVE" ? filterTokensForAggressive() : filterTokensByRisk(tweetRisk);
        if (validTokens.length === 0) continue;
        const expired = lastTimestamp < getTimestamp(7);

        const token = validTokens[Math.floor(Math.random() * validTokens.length)];
        tweets.push({
          kolId,
          tokenId: token.id,
          content: generateTweetContent(token.symbol, tweetRisk, "BUY"),
          signal: "BUY" as SignalType,
          risk: tweetRisk,
          timestamp: lastTimestamp,
          expired: expired,
          valid: expired || Math.random() > 0.7,
        });

        if (Math.random() > 0.5) {
          const sellTimestamp = lastTimestamp + Math.floor(Math.random() * (40 - 1 + 1)) * 3600;
          let sellRisk: any = selectRisk();
          let sellTokens = sellRisk === "AGGRESSIVE" ? filterTokensForAggressive() : filterTokensByRisk(sellRisk);
          const expired = sellTimestamp < getTimestamp(7);
          if (sellTokens.length > 0) {
            const sellToken = sellTokens[Math.floor(Math.random() * sellTokens.length)];
            tweets.push({
              kolId,
              tokenId: sellToken.id,
              content: generateTweetContent(sellToken.symbol, sellRisk, "SELL"),
              signal: "SELL" as SignalType,
              risk: sellRisk,
              timestamp: sellTimestamp,
              expired: expired,
              valid: expired || Math.random() > 0.7,
            });
          }
        }

        lastTimestamp += Math.floor(Math.random() * (24 - 1 + 1)) * 3600;
      }

      // Create the tweets in the database
      await prisma.tweet.createMany({
        data: tweets,
        skipDuplicates: true,
      });

      return tweets;
    };

    const createKOLs = async (recommendation: "CONSERVATIVE" | "BALANCED" | "AGGRESSIVE") => {
      const count = Math.floor(Math.random() * (5 - 3 + 1)) + 3;
      const kolsData = Array.from({ length: count }).map((_, i) => ({
        name: `KOL ${recommendation} ${i + 1}`,
        username: `kol_${recommendation.toLowerCase()}_${i + 1}`,
        avatar: `https://picsum.photos/200/200?random=${i + 1}`,
        followersTwitter: Math.floor(Math.random() * 1000000),
        followersKOL: Math.floor(Math.random() * 10000),
        avgProfitD: Math.floor(Math.random() * 50),
        riskRecommendation: recommendation,
      }));

      const createdKOLs = await prisma.kOL.createMany({
        data: kolsData,
        skipDuplicates: true,
      });

      const kols = await prisma.kOL.findMany({
        where: { riskRecommendation: recommendation },
        select: { id: true, followersKOL: true, avgProfitD: true },
      });

      const tweetResults = await Promise.all(
        kols.map((kol) => createTweets(kol.id, recommendation))
      );

      return { kols, totalTweets: tweetResults.reduce((acc, tweets) => acc + tweets.length, 0) };
    };

    const [conservative, balanced, aggressive] = await Promise.all([
      createKOLs("CONSERVATIVE"),
      createKOLs("BALANCED"),
      createKOLs("AGGRESSIVE"),
    ]);

    const allKOLs = [...conservative.kols, ...balanced.kols, ...aggressive.kols];
    const totalTweets = conservative.totalTweets + balanced.totalTweets + aggressive.totalTweets;

    const sortedByFollowers = [...allKOLs].sort((a, b) => b.followersKOL - a.followersKOL);
    const sortedByProfit = [...allKOLs].sort((a, b) => b.avgProfitD - a.avgProfitD);

    await Promise.all([
      ...sortedByFollowers.map((kol, i) =>
        prisma.kOL.update({
          where: { id: kol.id },
          data: { rankFollowersKOL: i + 1 },
        })
      ),
      ...sortedByProfit.map((kol, i) =>
        prisma.kOL.update({
          where: { id: kol.id },
          data: { rankAvgProfitD: i + 1 },
        })
      ),
    ]);

    res.json({
      message: "KOLs and tweets seeded successfully with ranking data",
      totalKOLs: allKOLs.length,
      totalTweets,
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

    const tweet = await prisma.tweet.create({
      data: {
        content: req.body.content,
        kolId: kolId,
        tokenId: tokenId,
        signal: req.body.signal,
        risk: req.body.risk,
        timestamp: req.body.timestamp,
        expired: req.body.expired,
        valid: req.body.valid
      }
    });

    // Use the serialization helper to handle BigInt values
    res.status(201).json({ tweet: serializeData(tweet) });
  } catch (error) {
    console.error("Error adding tweet:", error);
    res.status(500).json({ error: "Failed to add tweet" });
  }
};

export const updateTweetExpiredAndValid = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid tweet ID format" });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      res.status(400).json({ error: "Request body is required" });
    }

    const existingTweet = await prisma.tweet.findUnique({ where: { id } });
    if (!existingTweet) {
      res.status(404).json({ error: "Tweet not found" });
    }

    const tweet = await prisma.tweet.update({
      where: { id },
      data: {
        expired: req.body.expired,
        valid: req.body.valid
      }
    });

    res.json({ tweet: serializeData(tweet) });
  } catch (error) {
    console.error("Error updating tweet:", error);
    res.status(500).json({ error: "Failed to update tweet" });
  }
};

export const followKOL = async (req: Request, res: Response) => {
  const { kolId, userAddress } = req.body;

  try {
    const existingFollow = await prisma.kOLFollowed.findFirst({
      where: { userAddress },
    });

    if (existingFollow) {
      res.status(400).json({ error: "User can only follow one KOL at a time" });
    }

    const follow = await prisma.kOLFollowed.create({
      data: { kolId, userAddress },
    });

    res.json({ message: "Followed successfully", follow });
  } catch (error) {
    console.error("Error following KOL:", error);
    res.status(500).json({ error: "Failed to follow KOL" });
  }
};

export const unfollowKOL = async (req: Request, res: Response) => {
  const { kolId, userAddress } = req.body;

  try {
    const follow = await prisma.kOLFollowed.deleteMany({
      where: { kolId, userAddress },
    });
    res.json({ message: 'Unfollowed successfully', follow });
  } catch (error) {
    console.error("Error unfollowing kol:", error);
    res.status(500).json({ error: "Failed to unfollow kol" });
  }
}

export const getFollowedKOLByUserAddress = async (req: Request, res: Response) => {
  const { userAddress } = req.params;

  try {
    const followedKOL = await prisma.kOLFollowed.findUnique({
      where: { userAddress },
      include: {
        kol: {
          include: {
            tweets: {
              include: {
                token: true
              }
            }
          }
        }
      }
    });

    if (!followedKOL) {
      res.status(404).json({ error: "Followed KOL not found for this user" });
    }

    res.json({ followedKOL });
  } catch (error) {
    console.error("Error retrieving followed KOL:", error);
    res.status(500).json({ error: "Failed to retrieve followed KOL" });
  }
};

app.use(express.json());
setupSwagger(app);

// TOKEN
app.get("/api/token/init", initTokens);
app.get("/api/token/data", getTokens);
app.put("/api/token/update/:id", updateTokenPrice);
app.delete("/api/token/deleteAll", deleteAllTokens);

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
app.get("/api/tweet/id/:id", getTweetById);
app.post("/api/tweet/add", addTweetByKOLId);
app.put("/api/tweet/update/:id", updateTweetExpiredAndValid);

// KOL FOLLOWED
app.post("/api/kol/follow", followKOL);
app.delete("/api/kol/unfollow", unfollowKOL);
app.get("/api/kol/followed/:userAddress", getFollowedKOLByUserAddress);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;