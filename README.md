# KOL Management API

## 📌 Description
This API is used to manage KOL (Key Opinion Leaders) data, including token trading and related statistics. It is built using **Node.js**, **Express**, and **Prisma** as the ORM for database access.

## 🚀 Key Features
- **KOL Management**: Add, update, and retrieve KOL data.
- **Statistics & Trading**: Update KOL statistics based on their trading activity.
- **Token Initialization**: Ensure all required tokens exist in the database.
- **KOL Data Enhancement**: Fill empty KOL data fields with relevant random values.
- **API Documentation**: Integrated with **Swagger** for easier API exploration.

## 🛠️ Technologies Used
- **Node.js** + **Express** (Backend API)
- **Prisma** (ORM for database management)
- **PostgreSQL** (Database management)
- **Swagger** (API Documentation)

## 👅 Swagger Documentation
After running the server, you can access Swagger UI at:
```
http://localhost:5000/docs
```

## 📥 Installation
1. Clone this repository:
   ```sh
   git clone https://github.com/username/repository.git
   cd repository
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Configure **.env**:
   ```sh
   DATABASE_URL="postgresql://user:password@localhost:5432/db_name"
   ```
4. Run Prisma migration:
   ```sh
   npx prisma migrate dev
   ```
5. Start the server:
   ```sh
   npm start
   ```

## 📡 API Endpoints
### ✅ KOL Endpoints
| Method | Endpoint | Function |
|--------|----------|---------|
| `GET`  | `/api/kol/check` | Check if KOL data and tokens exist |
| `GET`  | `/api/kol/data` | Retrieve all KOL data with trading history |
| `GET`  | `/api/kol/username/:username` | Retrieve KOL data by Twitter username |
| `GET`  | `/api/kol/id/:id` | Retrieve KOL data by ID |
| `GET`  | `/api/kol/init` | Init or update KOL data from an external source |
| `GET`  | `/api/kol/fill` | Fill empty KOL data fields with random values |
| `POST` | `/api/kol/update` | Update trading data for a specific KOL |
| `POST` | `/api/kol/update-all` | Update all KOL data |

### 🔗 Token Endpoints
| Method | Endpoint | Function |
|--------|----------|---------|
| `GET`  | `/api/token/init` | Initialize token data |
| `GET`  | `/api/token/data` | Retrieve a list of tokens with metadata |
| `GET`  | `/api/token/address/:address` | Retrieve token data by token address |

## 🏗️ Functions & Purposes
Below is a list of main functions in the code and their purposes:

### 1. `updateAllKOLData`
   - **Purpose**: Updates all KOL data by processing their trading activity and statistics.

### 2. `getKOLData`
   - **Purpose**: Retrieves all KOL data along with their trading history.

### 3. `getKOLByUsername`
   - **Purpose**: Retrieves KOL data by their Twitter username.

### 4. `getKOLById`
   - **Purpose**: Retrieves KOL data by their unique ID.

### 5. `createKOLData`
   - **Purpose**: Creates or updates KOL data from an external source.

### 6. `autoFillKolNullData`
   - **Purpose**: Fills empty KOL data fields with relevant random values.

### 7. `initializeTokens`
   - **Purpose**: Ensures that all necessary tokens exist in the database.

### 8. `checkKOLDataExists`
   - **Purpose**: Checks if KOL data and tokens exist in the database.

### 9. `getAllTokens`
   - **Purpose**: Retrieves all token data from the database.

## 📌 How to Run
1. Start the server with the following command:
   ```sh
   npm start
   ```
2. Access endpoints using **Postman** or directly via **browser**.

## 🤝 Contribution
If you wish to contribute, please fork this repository and create a **pull request** with your proposed changes.

## 📜 License
This project is licensed under the **MIT** license.

---

🔥 Happy coding! 🚀