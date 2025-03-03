import express from "express";
import type { Request, Response } from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import { Prisma, PrismaClient } from "@prisma/client";
import { setupSwagger } from "./swagger.js";
import { TOKEN_DATA } from "./data/token.js";
import { KOL_DATA } from "./data/kol.js";
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

interface UpdateRequest {
  twitter_username: string;
  tokenIndex: number;
  changeStatus?: 'profit' | 'loss';
}

export async function ensureTokensExist() {
  for (const token of TOKEN_DATA) {
    await prisma.token.upsert({
      where: { address: token.address },
      update: {
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        logo: token.logoURI,
        token_address: token.address,
        price_change_6h: "0.0",
        is_show_alert: false,
        is_honeypot: null
      },
      create: {
        address: token.address,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        logo: token.logoURI,
        token_address: token.address,
        price_change_6h: "0.0",
        is_show_alert: false,
        is_honeypot: null
      }
    });
  }
}

export const updateCustomKOLTradeData = async (req: any, res: any) => {
  try {
    const { twitter_username, tokenIndex, changeStatus } = req.body as UpdateRequest;

    if (!twitter_username || tokenIndex === undefined) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    await ensureTokensExist();

    const tokenData = TOKEN_DATA[tokenIndex % TOKEN_DATA.length];

    if (!tokenData) {
      return res.status(404).json({ error: "Token not found" });
    }

    const tokenRecord = await prisma.token.findUnique({
      where: { address: tokenData.address }
    });

    if (!tokenRecord) {
      return res.status(404).json({ error: "Token not found in database" });
    }

    const existingKol = await prisma.kol.findUnique({
      where: { twitter_username },
      include: { trades: true }
    });

    if (!existingKol) {
      const kolData = KOL_DATA.find(kol => kol.twitter_username === twitter_username);

      if (!kolData) {
        return res.status(404).json({ error: "KOL not found in sample data" });
      }

      const createdKol = await prisma.kol.create({
        data: {
          twitter_bind: kolData.twitter_bind,
          twitter_url: kolData.twitter_url,
          twitter_fans_num: kolData.twitter_fans_num,
          twitter_username: kolData.twitter_username,
          twitter_name: kolData.twitter_name,
          ens: kolData.ens,
          avatar: kolData.avatar,
          name: kolData.name,
          balance: kolData.balance,
          total_value: 0,
          unrealized_profit: 0,
          unrealized_pnl: 0,
          realized_profit: 0,
          pnl: 0,
          tags: kolData.tags || [],
          tag_rank: kolData.tag_rank || {},
          updated_at: Math.floor(Date.now() / 1000)
        }
      });

      const newTradeData = {
        kolId: createdKol.id,
        tokenId: tokenRecord.id,
        balance: "10000",
        usd_value: (10000 * tokenData.price).toString(),
        realized_profit_30d: "0",
        realized_profit: "0",
        realized_pnl: "0",
        realized_pnl_30d: "0",
        unrealized_profit: "0",
        unrealized_pnl: "0",
        total_profit: "0",
        total_profit_pnl: "0",
        avg_cost: tokenData.price.toString(),
        avg_sold: "0",
        buy_30d: 1,
        sell_30d: 0,
        sells: 0,
        price: tokenData.price.toString(),
        cost: (10000 * tokenData.price).toString(),
        position_percent: "1",
        last_active_timestamp: Math.floor(Date.now() / 1000),
        history_sold_income: "0",
        history_bought_cost: (10000 * tokenData.price).toString(),
        start_holding_at: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
        end_holding_at: null,
        liquidity: (100000 * tokenData.price).toString(),
        wallet_token_tags: Prisma.JsonNull
      };

      const createdTrade = await prisma.trade.create({
        data: newTradeData
      });

      await updateKolStatistics(createdKol.id);

      const updatedKol = await prisma.kol.findUnique({
        where: { id: createdKol.id },
        include: {
          trades: {
            include: {
              token: true
            }
          }
        }
      });

      return res.json({
        message: `Created KOL data for ${twitter_username} with token ${tokenData.symbol}`,
        kolData: updatedKol
      });
    }

    const existingTrade = existingKol.trades.find(trade => trade.tokenId === tokenRecord.id);

    if (!existingTrade) {
      await prisma.trade.create({
        data: {
          kolId: existingKol.id,
          tokenId: tokenRecord.id,
          balance: "10000",
          usd_value: (10000 * tokenData.price).toString(),
          realized_profit_30d: "0",
          realized_profit: "0",
          realized_pnl: "0",
          realized_pnl_30d: "0",
          unrealized_profit: "0",
          unrealized_pnl: "0",
          total_profit: "0",
          total_profit_pnl: "0",
          avg_cost: tokenData.price.toString(),
          avg_sold: "0",
          buy_30d: 1,
          sell_30d: 0,
          sells: 0,
          price: tokenData.price.toString(),
          cost: (10000 * tokenData.price).toString(),
          position_percent: "1",
          last_active_timestamp: Math.floor(Date.now() / 1000),
          history_sold_income: "0",
          history_bought_cost: (10000 * tokenData.price).toString(),
          start_holding_at: Math.floor(Date.now() / 1000) - 86400,
          end_holding_at: null,
          liquidity: (100000 * tokenData.price).toString(),
          wallet_token_tags: Prisma.JsonNull
        }
      });
    } else {
      const balance = parseFloat(existingTrade.balance || "0");
      const cost = parseFloat(existingTrade.cost || "0");
      const newValue = balance * tokenData.price;

      let unrealizedProfit = existingTrade.unrealized_profit;
      let unrealizedPnl = existingTrade.unrealized_pnl;
      let totalProfit = existingTrade.total_profit;
      let totalProfitPnl = existingTrade.total_profit_pnl;

      if (changeStatus) {
        if (changeStatus === 'profit') {
          const profitAmount = cost * 0.2;
          unrealizedProfit = profitAmount.toString();
          unrealizedPnl = "0.2";
          totalProfit = profitAmount.toString();
          totalProfitPnl = "0.2";
        } else if (changeStatus === 'loss') {
          const lossAmount = (-cost * 0.15).toString();
          unrealizedProfit = lossAmount;
          unrealizedPnl = "-0.15";
          totalProfit = lossAmount;
          totalProfitPnl = "-0.15";
        }
      }

      await prisma.trade.update({
        where: { id: existingTrade.id },
        data: {
          price: tokenData.price.toString(),
          usd_value: newValue.toString(),
          unrealized_profit: unrealizedProfit,
          unrealized_pnl: unrealizedPnl,
          total_profit: totalProfit,
          total_profit_pnl: totalProfitPnl,
          last_active_timestamp: Math.floor(Date.now() / 1000)
        }
      });
    }

    await updateKolStatistics(existingKol.id);

    const updatedKol = await prisma.kol.findUnique({
      where: { id: existingKol.id },
      include: {
        trades: {
          include: {
            token: true
          }
        }
      }
    });

    res.json({
      message: `Updated KOL data for ${twitter_username} with token ${tokenData.symbol}`,
      kolData: updatedKol
    });
  } catch (error) {
    console.error(`Error updating KOL data:`, error);
    res.status(500).json({ error: "Failed to update KOL data" });
  }
};

const getRandomValue = (min: number, max: number) => Math.random() * (max - min) + min;

export async function updateKolStatistics(kolId: number) {
  const kolWithTrades = await prisma.kol.findUnique({
    where: { id: kolId },
    include: { trades: true }
  });

  if (!kolWithTrades) {
    console.log(`⚠️ KOL ${kolId} not found.`);
    return;
  }

  let totalValue = 0;
  let unrealizedProfit = 0;
  let realizedProfit = 0;

  kolWithTrades.trades.forEach(trade => {
    totalValue += parseFloat(trade.usd_value || "0");
    unrealizedProfit += parseFloat(trade.unrealized_profit || "0");
    realizedProfit += parseFloat(trade.realized_profit || "0");
  });

  const totalProfit = realizedProfit + unrealizedProfit;
  const pnl = totalValue > 0 ? unrealizedProfit / totalValue : 0;
  const allPnl = totalValue > 0 ? totalProfit / totalValue : 0;

  await prisma.kol.update({
    where: { id: kolId },
    data: {
      total_value: totalValue,
      unrealized_profit: unrealizedProfit,
      realized_profit: realizedProfit,
      total_profit: totalProfit,
      pnl: pnl,
      all_pnl: allPnl,
      updated_at: Math.floor(Date.now() / 1000)
    }
  });

  console.log(`✅ KOL ${kolId} statistics updated.`);
}

export async function processKolTrades(kol: any) {
  console.log(`🔄 Processing trades for KOL ${kol.id}...`);

  const existingTrades = await prisma.trade.findMany({
    where: { kolId: kol.id }
  });

  if (existingTrades.length === 0) {
    console.log(`⚠️ No trades found for KOL ${kol.id}, skipping.`);
    return;
  }

  const updates = existingTrades.map(async (trade) => {
    const tokenData = TOKEN_DATA[Math.floor(Math.random() * TOKEN_DATA.length)];
    let balance = parseFloat(trade.balance || "0");

    if (trade.balance === "0") {
      balance = Math.floor(randomFactor(50000, 500000));
    }

    const newValue = balance * tokenData.price;
    const cost = parseFloat(trade.cost || "0") || balance * tokenData.price;
    const changeStatus = Math.random() > 0.5 ? "profit" : "loss";

    function randomFactor(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    let unrealizedProfit, unrealizedPnl, totalProfit, totalProfitPnl;
    let realizedProfit30d, realizedProfit, realizedPnl, realizedPnl30d;
    let avgSold, sell30d, buy30d, sells;

    if (changeStatus === "profit") {
      const profitPercentage = randomFactor(0.15, 0.25);
      const profitAmount = cost * profitPercentage;
      unrealizedProfit = profitAmount.toString();
      unrealizedPnl = profitPercentage.toFixed(2);
      totalProfit = profitAmount.toString();
      totalProfitPnl = profitPercentage.toFixed(2);
      realizedProfit30d = (profitAmount * 0.5).toString();
      realizedProfit = (profitAmount * 0.8).toString();
      realizedPnl = (profitPercentage * 0.8).toFixed(2);
      realizedPnl30d = (profitPercentage * 0.5).toFixed(2);
      avgSold = (parseFloat(trade.avg_cost || "0") * (1 + profitPercentage)).toFixed(2);
      sell30d = Math.floor(randomFactor(11, 40));
      buy30d = Math.floor(randomFactor(sell30d, sell30d + 10));
      sells = Math.floor(randomFactor(1, 10));

    } else {
      const lossPercentage = randomFactor(0.10, 0.20);
      const lossAmount = (-cost * lossPercentage).toString();
      unrealizedProfit = lossAmount;
      unrealizedPnl = (-lossPercentage).toFixed(2);
      totalProfit = lossAmount;
      totalProfitPnl = (-lossPercentage).toFixed(2);
      realizedProfit30d = (parseFloat(lossAmount) * 0.5).toString();
      realizedProfit = (parseFloat(lossAmount) * 0.8).toString();
      realizedPnl = (-lossPercentage * 0.8).toFixed(2);
      realizedPnl30d = (-lossPercentage * 0.5).toFixed(2);
      avgSold = (parseFloat(trade.avg_cost || "0") * (1 - lossPercentage)).toFixed(2);
      sell30d = Math.floor(randomFactor(6, 25));
      buy30d = Math.floor(randomFactor(sell30d, sell30d + 10));
      sells = Math.floor(randomFactor(0, 5));
    }

    await prisma.trade.update({
      where: { id: trade.id },
      data: {
        cost: cost.toString(),
        price: tokenData.price.toString(),
        usd_value: newValue.toString(),
        unrealized_profit: unrealizedProfit,
        unrealized_pnl: unrealizedPnl,
        total_profit: totalProfit,
        total_profit_pnl: totalProfitPnl,
        realized_profit_30d: realizedProfit30d,
        realized_profit: realizedProfit,
        realized_pnl: realizedPnl,
        realized_pnl_30d: realizedPnl30d,
        avg_cost: (trade.avg_cost ?? 0).toString(),
        avg_sold: avgSold,
        buy_30d: trade.buy_30d,
        sell_30d: sell30d,
        sells: sells,
        last_active_timestamp: Math.floor(Date.now() / 1000)
      }
    });

    console.log(`✅ Trade ${trade.id} updated for KOL ${kol.id}.`);
  });

  await Promise.all(updates);
}

export const updateAllKOLData = async (req: any, res: any) => {
  try {
    await ensureTokensExist();
    const allKOLs = await prisma.kol.findMany();

    if (allKOLs.length === 0) {
      return res.status(404).json({ error: "No KOL data found" });
    }

    for (const kol of allKOLs) {
      await processKolTrades(kol);
      await updateKolStatistics(kol.id);
    }

    res.json({ message: "✅ All KOL data updated successfully" });
  } catch (error) {
    console.error("❌ Error updating KOL data:", error);
    res.status(500).json({ error: "Failed to update KOL data" });
  }
};

export const getKOLData = async (req: Request, res: Response) => {
  try {
    const kolData = await prisma.kol.findMany({
      include: {
        trades: {
          include: {
            token: true
          }
        }
      }
    });
    res.json(kolData);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
};

export const getKOLByUsername = async (req: any, res: any) => {
  try {
    const { username } = req.params;
    const kol = await prisma.kol.findUnique({
      where: { twitter_username: username },
      include: {
        trades: {
          include: {
            token: true
          }
        }
      }
    });
    if (!kol) return res.status(404).json({ error: "KOL not found" });
    res.json(kol);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
};

export const getKOLById = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const kol = await prisma.kol.findUnique({
      where: { id: Number(id) },
      include: {
        trades: {
          include: {
            token: true
          }
        }
      }
    });
    if (!kol) return res.status(404).json({ error: "KOL not found" });
    res.json(kol);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
};

export const initKOLData = async (req: any, res: any) => {
  try {
    await ensureTokensExist();

    const tokens = await prisma.token.findMany();

    for (const kolData of KOL_DATA) {
      const createdKol = await prisma.kol.upsert({
        where: {
          twitter_username: kolData.twitter_username || `auto_${Math.random().toString(36).substring(2, 11)}`
        },
        update: {
          twitter_bind: kolData.twitter_bind,
          twitter_url: kolData.twitter_url,
          twitter_fans_num: kolData.twitter_fans_num,
          twitter_name: kolData.twitter_name,
          ens: kolData.ens,
          avatar: kolData.avatar,
          name: kolData.name,
          balance: kolData.balance,
          tags: kolData.tags || [],
          tag_rank: kolData.tag_rank || {},
          followers_count: kolData.followers_count,
          is_contract: kolData.is_contract,
          updated_at: Math.floor(Date.now() / 1000),
          refresh_requested_at: kolData.refresh_requested_at
        },
        create: {
          twitter_bind: kolData.twitter_bind,
          twitter_url: kolData.twitter_url,
          twitter_fans_num: kolData.twitter_fans_num,
          twitter_username: kolData.twitter_username,
          twitter_name: kolData.twitter_name,
          ens: kolData.ens,
          avatar: kolData.avatar,
          name: kolData.name,
          balance: kolData.balance,
          tags: kolData.tags || [],
          tag_rank: kolData.tag_rank || {},
          followers_count: kolData.followers_count,
          is_contract: kolData.is_contract,
          updated_at: Math.floor(Date.now() / 1000),
          refresh_requested_at: kolData.refresh_requested_at
        }
      });

      if (kolData.trade && Array.isArray(kolData.trade) && kolData.trade.length > 0) {
        for (const tradeData of kolData.trade) {
          let tokenId;

          if (tradeData.token && tradeData.token.address) {
            const tokenRecord = await prisma.token.findUnique({
              where: { address: tradeData.token.address }
            });

            if (tokenRecord) {
              tokenId = tokenRecord.id;
            } else {
              const randomToken = tokens[Math.floor(Math.random() * tokens.length)];
              tokenId = randomToken.id;
            }
          } else {
            const randomToken = tokens[Math.floor(Math.random() * tokens.length)];
            tokenId = randomToken.id;
          }

          await prisma.trade.create({
            data: {
              kolId: createdKol.id,
              tokenId: tokenId,
              balance: tradeData.balance,
              usd_value: tradeData.usd_value,
              realized_profit_30d: tradeData.realized_profit_30d,
              realized_profit: tradeData.realized_profit,
              realized_pnl: tradeData.realized_pnl,
              realized_pnl_30d: tradeData.realized_pnl_30d,
              unrealized_profit: tradeData.unrealized_profit,
              unrealized_pnl: tradeData.unrealized_pnl,
              total_profit: tradeData.total_profit,
              total_profit_pnl: tradeData.total_profit_pnl,
              avg_cost: tradeData.avg_cost,
              avg_sold: tradeData.avg_sold,
              buy_30d: tradeData.buy_30d,
              sell_30d: tradeData.sell_30d,
              sells: tradeData.sells,
              price: tradeData.price,
              cost: tradeData.cost,
              position_percent: tradeData.position_percent,
              last_active_timestamp: tradeData.last_active_timestamp,
              history_sold_income: tradeData.history_sold_income,
              history_bought_cost: tradeData.history_bought_cost,
              start_holding_at: tradeData.start_holding_at,
              end_holding_at: tradeData.end_holding_at,
              liquidity: tradeData.liquidity,
              wallet_token_tags: tradeData.wallet_token_tags ?? Prisma.JsonNull
            }
          });
        }
      }

      await updateKolStatistics(createdKol.id);
    }

    res.json({ message: "All KOL data created successfully" });
  } catch (error) {
    console.error("Error creating all KOL data:", error);
    res.status(500).json({ error: "Failed to create all data" });
  }
};

export const autoFillKolNullData = async (req: any, res: any) => {
  try {
    const kols = await prisma.kol.findMany();
    let updatedCount = 0;

    for (const kol of kols) {
      const updateData: Prisma.KolUpdateInput = {};

      if (kol.buy === null || kol.buy === 0) updateData.buy = getRandomValue(0, 500);
      if (kol.sell === null || kol.sell === 0) updateData.sell = getRandomValue(0, 500);
      if (kol.buy_1d === null || kol.buy_1d === 0) updateData.buy_1d = getRandomValue(0, 10);
      if (kol.sell_1d === null || kol.sell_1d === 0) updateData.sell_1d = getRandomValue(0, 10);
      if (kol.buy_7d === null || kol.buy_7d === 0) updateData.buy_7d = getRandomValue(0, 50);
      if (kol.sell_7d === null || kol.sell_7d === 0) updateData.sell_7d = getRandomValue(0, 50);
      if (kol.buy_30d === null || kol.buy_30d === 0) updateData.buy_30d = getRandomValue(0, 100);
      if (kol.sell_30d === null || kol.sell_30d === 0) updateData.sell_30d = getRandomValue(0, 100);

      if (kol.pnl_1d === null || kol.pnl_1d === 0) updateData.pnl_1d = getRandomValue(-0.05, 0.05);
      if (kol.pnl_7d === null || kol.pnl_7d === 0) updateData.pnl_7d = getRandomValue(-0.1, 0.1);
      if (kol.pnl_30d === null || kol.pnl_30d === 0) updateData.pnl_30d = getRandomValue(-0.2, 0.2);

      if (kol.realized_profit_1d === null || kol.realized_profit_1d === 0) updateData.realized_profit_1d = getRandomValue(-100, 100);
      if (kol.realized_profit_7d === null || kol.realized_profit_7d === 0) updateData.realized_profit_7d = getRandomValue(-500, 500);
      if (kol.realized_profit_30d === null || kol.realized_profit_30d === 0) updateData.realized_profit_30d = getRandomValue(-2000, 2000);

      if ((kol.unrealized_pnl === null || kol.unrealized_pnl === 0) && kol.unrealized_profit !== null && kol.total_value !== null) {
        updateData.unrealized_pnl = kol.total_value > 0 ? (kol.unrealized_profit ?? 0) / kol.total_value : getRandomValue(-0.1, 0.1);
      }

      const trades = await prisma.trade.findMany({ where: { kolId: kol.id } });

      if ((kol.winrate === null || kol.winrate === 0) && trades.length > 0) {
        const profitableTrades = trades.filter(trade => parseFloat(trade.total_profit || "0") > 0).length;
        updateData.winrate = (profitableTrades / trades.length) * 100;
      } else if (kol.winrate === null || kol.winrate === 0) {
        updateData.winrate = getRandomValue(30, 70);
      }

      if ((kol.total_profit_pnl === null || kol.total_profit_pnl === 0) && kol.total_profit !== null && kol.total_value !== null) {
        updateData.total_profit_pnl = kol.total_value > 0 ? (kol.total_profit ?? 0) / kol.total_value : getRandomValue(-0.1, 0.1);
      }

      if (kol.history_bought_cost === null || kol.history_bought_cost === 0) {
        const totalCost = trades.reduce((sum, trade) => sum + parseFloat(trade.history_bought_cost || "0"), 0);
        updateData.history_bought_cost = totalCost || getRandomValue(1000, 5000);
      }

      if (kol.token_num === null || kol.token_num === 0) updateData.token_num = trades.length || Math.floor(getRandomValue(1, 20));
      if (kol.profit_num === null || kol.profit_num === 0) updateData.profit_num = trades.filter(trade => parseFloat(trade.total_profit || "0") > 0).length || Math.floor(getRandomValue(1, 10));

      const getTradeCount = (min: number, max: number) =>
        trades.filter(trade => {
          const pnl = parseFloat(trade.total_profit_pnl || "0");
          return pnl >= min && pnl < max;
        }).length || Math.floor(getRandomValue(0, 5));

      if (kol.pnl_lt_minus_dot5_num === null || kol.pnl_lt_minus_dot5_num === 0) updateData.pnl_lt_minus_dot5_num = getTradeCount(-Infinity, -0.5);
      if (kol.pnl_minus_dot5_0x_num === null || kol.pnl_minus_dot5_0x_num === 0) updateData.pnl_minus_dot5_0x_num = getTradeCount(-0.5, 0);
      if (kol.pnl_lt_2x_num === null || kol.pnl_lt_2x_num === 0) updateData.pnl_lt_2x_num = getTradeCount(0, 2);
      if (kol.pnl_2x_5x_num === null || kol.pnl_2x_5x_num === 0) updateData.pnl_2x_5x_num = getTradeCount(2, 5);
      if (kol.pnl_gt_5x_num === null || kol.pnl_gt_5x_num === 0) updateData.pnl_gt_5x_num = getTradeCount(5, Infinity);

      if (kol.last_active_timestamp === null || kol.last_active_timestamp === 0) {
        updateData.last_active_timestamp = Math.floor(Date.now() / 1000) - Math.floor(getRandomValue(0, 31536000));
      }

      if ((kol.token_avg_cost === null || kol.token_avg_cost === 0) && trades.length > 0) {
        const totalCost = trades.reduce((sum, trade) => sum + parseFloat(trade.cost || "0"), 0);
        updateData.token_avg_cost = trades.length > 0 ? totalCost / trades.length : getRandomValue(10, 500);
      }

      if (kol.avg_holding_peroid === null || kol.avg_holding_peroid === 0) {
        updateData.avg_holding_peroid = getRandomValue(1, 30);
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.kol.update({
          where: { id: kol.id },
          data: updateData
        });
        updatedCount++;
      }
    }

    return res.json({
      message: `Auto-filled null data for ${updatedCount} KOL profiles`,
      updated_count: updatedCount,
      total_kols: kols.length
    });

  } catch (error) {
    console.error("Error auto-filling KOL null data:", error);
    return res.status(500).json({ error: "Failed to auto-fill KOL data", details: error instanceof Error ? error.message : String(error) });
  }
};

export const initializeTokens = async (req: any, res: any) => {
  try {
    await ensureTokensExist();
    res.json({ message: "Token data initialized successfully" });
  } catch (error) {
    console.error("Error initializing token data:", error);
    res.status(500).json({ error: "Failed to initialize token data" });
  }
};

export const checkKOLDataExists = async (req: any, res: any) => {
  try {
    const allKOLs = await prisma.kol.findMany({
      include: {
        trades: {
          include: {
            token: true
          }
        }
      }
    });

    const allTokens = await prisma.token.findMany();

    res.json({
      kols: {
        count: allKOLs.length,
        data: allKOLs
      },
      tokens: {
        count: allTokens.length,
        data: allTokens
      }
    });
  } catch (error) {
    console.error("Error checking data:", error);
    res.status(500).json({ error: "Failed to check data" });
  }
};

export const getTokenByAddress = async (req: any, res: any) => {
  try {
    const { address } = req.params;
    const token = await prisma.token.findUnique({
      where: { address }
    });
    if (!token) return res.status(404).json({ error: "Token not found" });
    res.json(token);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
}

app.use(express.json());
setupSwagger(app);
app.get("/api/token/data", (req: any, res: any) => { res.json(TOKEN_DATA) });
app.get("/api/token/init", initializeTokens);
app.get("/api/token/address/:address", getTokenByAddress);
app.get("/api/kol/check", checkKOLDataExists);
app.get("/api/kol/init", initKOLData);
app.get("/api/kol/data", getKOLData);
app.get("/api/kol/fill", autoFillKolNullData);
app.get("/api/kol/username/:username", getKOLByUsername);
app.get("/api/kol/id/:id", getKOLById);
app.post("/api/kol/update", updateCustomKOLTradeData);
app.post("/api/kol/update-all", updateAllKOLData);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;