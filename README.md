# Kolective - Web3 KOL Recommendation Platform

## Overview
Kolective is a Web3-powered platform that helps users discover and follow **Key Opinion Leaders (KOLs)** based on risk profiles and AI-generated insights. Users can assess KOLs based on metrics such as **followers, profitability, and risk preferences**, enabling smarter investment decisions in the decentralized space.

## 📌 Features
- **🏆 KOL Management:** Add, update, and delete KOL profiles.
- **📢 Tweets & Signals:** Manage tweets with risk-based buy/sell signals.
- **📊 Risk Profiling:** Classify users into Conservative, Balanced, or Aggressive.
- **🔗 Web3 Integration:** Connect wallets and track KOL-followed tokens.
- **📜 Swagger API Docs:** Available at /docs.

## Tech Stack
- **Backend:** Node.js, Express.js, Prisma ORM
- **Database:** PostgreSQL
- **Blockchain:** Web3.js, Smart Contracts (Solidity)
- **Frontend:** Next.js, React, TailwindCSS

## Database Schema
Kolective's backend is powered by **PostgreSQL** and uses **Prisma ORM** to manage data. Below is a summary of the core database models:

### 1. **KOL (Key Opinion Leader)**
```prisma
model KOL {
  id                 Int                 @id @default(autoincrement())
  name               String
  username           String              @unique
  avatar             String
  followersTwitter   Int
  followersKOL       Int
  riskRecommendation RiskRecommendation?
  tweets             Tweet[]
  avgProfitD         Int
  rankFollowersKOL   Int?
  rankAvgProfitD     Int?
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt
  KOLFollowed        KOLFollowed[]
}
```

### 2. **Tweet (Trading Signals)**
```prisma
model Tweet {
  id        Int        @id @default(autoincrement())
  tokenId   Int
  content   String
  signal    SignalType
  risk      RiskLevel
  timestamp BigInt
  expired   Boolean    @default(false)
  valid     Boolean    @default(true)
  kolId     Int
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  kol       KOL   @relation(fields: [kolId], references: [id], onDelete: Cascade)
  token     Token @relation(fields: [tokenId], references: [id])
}
```

### 3. **Token (Crypto Assets Tracked)**
```prisma
model Token {
  id             Int      @id @default(autoincrement())
  addressToken   String   @unique
  symbol         String
  name           String
  decimals       Int
  chain          String
  logo           String
  priceChange24H Float
  tags           String[]
  tweets         Tweet[]
}
```

### 4. **KOLFollowed (User-KOL Relationship)**
```prisma
model KOLFollowed {
  id          Int      @id @default(autoincrement())
  kolId       Int
  userAddress String   @unique
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  kol         KOL      @relation(fields: [kolId], references: [id])
}
```

## API Endpoints
### **KOL Management**
| Method | Endpoint | Description |
|--------|---------|-------------|
| `GET` | `/api/kol` | Get all KOLs |
| `GET` | `/api/kol/id/:id` | Get KOL by ID |
| `GET` | `/api/kol/username/:username` | Get KOL by username |
| `POST` | `/api/kol/add` | Add a new KOL |
| `PUT` | `/api/kol/update/:id` | Update a KOL |
| `DELETE` | `/api/kol/delete/:id` | Delete a KOL |

### **Tweet Management**
| Method | Endpoint | Description |
|--------|---------|-------------|
| `GET` | `/api/tweet` | Get all tweets |
| `GET` | `/api/tweet/kol/:id` | Get tweets by KOL ID |
| `POST` | `/api/tweet/add` | Add a tweet |
| `PUT` | `/api/tweet/update/:id` | Update tweet validity |

### **User-KOL Interaction**
| Method | Endpoint | Description |
|--------|---------|-------------|
| `POST` | `/api/kol/follow` | Follow a KOL |
| `DELETE` | `/api/kol/unfollow` | Unfollow a KOL |
| `GET` | `/api/kol/followed/:userAddress` | Get followed KOL |

## Setup Guide
### **1. Clone the Repository**
```sh
git clone https://github.com/Kolective/kolective-backend
cd kolective-backend
```

### **2. Install Dependencies**
```sh
npm install
```

### **3. Configure Environment Variables**
Create a `.env` file and add your database URL:
```sh
DATABASE_URL=
RPC_URL=
NODE_ENV=
```

### **4. Run Prisma Migrations**
```sh
npx prisma generate
npx prisma db push
```

### **5. Start the Server**
```sh
npm run dev
```

## Contributing
We welcome contributions! Please follow these steps:
1. Fork the repository.
2. Create a new branch.
3. Implement your changes.
4. Open a pull request.

## License
This project is licensed under the **MIT License**. Feel free to use and modify it as needed.

---
🚀 *Kolective is revolutionizing Web3 trading with AI-powered KOL recommendations.*