# ChainBa — Blockchain-Powered Chilimba Platform

A decentralized web application that digitizes **Chilimba** — traditional rotating savings
groups — on the Ethereum blockchain. Funds are held by smart-contract code rather than an
organiser, and every contribution, penalty, and payout is enforced automatically and recorded
immutably on-chain.

> **Note:** This is prototype / educational software. It runs on a local Hardhat blockchain
> using test ETH. Do not use it with real funds or deploy it to a public network without a
> professional security audit.

---

## Problem

Traditional Zambian Chilimba (rotating savings groups) operate entirely on trust, with no
contracts, payment records, or fraud protection. Common failure modes include:

- Organisers disappearing with pooled funds
- Members disputing payment records
- No way to verify a member's past behaviour
- Early recipients facing no enforced obligation to keep paying
- No transparent audit trail

## Solution

ChainBa moves the rules of a Chilimba into Ethereum smart contracts:

- Funds are held by code, not people — nobody can run away with the pool
- All contributions, penalties, and payouts are immutably recorded on-chain
- Group rules are enforced automatically — no human arbitration needed
- Every member builds a permanent reputation score visible to future groups

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity 0.8.19 |
| Blockchain Dev | Hardhat (local Ethereum network) |
| Security Libraries | OpenZeppelin 4.9.3 |
| Blockchain Connection | ethers.js v6 (Hardhat) / v5 (React) |
| Frontend | React.js |
| Wallet | MetaMask |
| Backend | Node.js + Express.js |
| Database | MongoDB 7.0 |
| Authentication | JWT + bcrypt |
| Rate Limiting | express-rate-limit |

---

## Project Structure

```
chainba/
├── contracts/
│   ├── MemberReputation.sol      # Global reputation scoring (Ownable + Pausable)
│   ├── ChilimbaGroup.sol         # Core group logic (ReentrancyGuard + Pausable)
│   └── ChilimbaFactory.sol       # Deploys and tracks group contracts
├── scripts/
│   └── deploy.js                 # Deployment script — saves addresses automatically
├── test/
│   └── ChainBa.test.js           # Full test suite — 23 passing
├── chainba-frontend/
│   └── src/
│       ├── pages/
│       │   ├── Landing.js        # Home page with Register/Login/MetaMask
│       │   ├── Dashboard.js      # User dashboard with balance + reputation
│       │   ├── CreateGroup.js    # 3-step group creation wizard
│       │   ├── GroupView.js      # Group detail + pay contribution
│       │   ├── Register.js       # User registration (auto wallet creation)
│       │   ├── Login.js          # Phone + password login
│       │   ├── Profile.js        # User profile + ETH balance + identity hash
│       │   └── Admin.js          # Admin panel (password protected)
│       ├── contracts/
│       │   ├── config.js         # ABIs + contract addresses
│       │   └── addresses.json    # Deployed addresses (auto-generated)
│       ├── api.js                # Dynamic base URL config
│       └── App.js                # Routing + session management + MetaMask listener
├── chainba-backend/
│   ├── models/
│   │   └── User.js               # MongoDB schema — fullName, phone, NRC, wallet
│   ├── routes/
│   │   ├── auth.js               # POST /api/auth/register, POST /api/auth/login
│   │   ├── profile.js            # GET /api/profile/me (JWT protected)
│   │   └── admin.js              # GET /api/admin/users (admin key protected)
│   ├── middleware/
│   │   └── auth.js               # JWT verification middleware
│   ├── index.js                  # Express server entry point
│   └── .env                      # Environment variables (gitignored — see .env.example)
├── .env.example                  # Template for required environment variables
├── .gitignore
├── hardhat.config.js
├── package.json
└── README.md
```

---

## Prerequisites

### 1. Node.js via NVM
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
nvm alias default 22
node --version   # must show v22.x.x
```

### 2. Google Chrome
Download from https://www.google.com/chrome

### 3. MetaMask Browser Extension
1. Open Chrome and go to https://metamask.io/download
2. Click **Add to Chrome**
3. Create a new wallet and set a strong password
4. Write down your 12-word seed phrase safely offline

### 4. MongoDB
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update && sudo apt-get install -y mongodb-org
sudo systemctl start mongod && sudo systemctl enable mongod
```

### 5. VS Code (Recommended)
Download from https://code.visualstudio.com

Recommended extensions: Solidity (Juan Blanco), Prettier, ES7 React Snippets, GitLens.

---

## Setup Guide

### Step 1 — Clone the Repository
```bash
cd ~
git clone https://github.com/b5119/chainba.git
cd chainba
```

### Step 2 — Install All Dependencies
```bash
# Hardhat + contract dependencies
cd ~/chainba
npm install --legacy-peer-deps

# Frontend dependencies
cd ~/chainba/chainba-frontend
npm install

# Backend dependencies
cd ~/chainba/chainba-backend
npm install
```

### Step 3 — Create Backend Environment File

Copy the example file and fill in your own values:

```bash
cp ~/chainba/.env.example ~/chainba/chainba-backend/.env
```

Then open `chainba-backend/.env` and set a strong `JWT_SECRET`. See `.env.example` for all required variables.

> **Warning:** Never commit your `.env` file. It is already listed in `.gitignore`.

### Step 4 — Start the Local Blockchain
Open a dedicated terminal and keep it running:
```bash
cd ~/chainba
npx hardhat node
```

You will see 20 test accounts each with 10,000 ETH. These accounts are for local development only — never send real ETH to these addresses.

### Step 5 — Deploy Smart Contracts
Open a new terminal tab:
```bash
cd ~/chainba
npx hardhat run scripts/deploy.js --network localhost
```

Expected output:
```
Deploying with account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
MemberReputation deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
ChilimbaFactory deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
Addresses saved.
```

### Step 6 — Configure MetaMask

Add the Hardhat local network:
```
Network Name:    Hardhat Local
RPC URL:         http://127.0.0.1:8545
Chain ID:        31337
Currency Symbol: ETH
```

Import a test account: when you run `npx hardhat node`, the terminal prints 20 accounts with their addresses and private keys. Import any of these into MetaMask via:

```
MetaMask -> account icon -> Import account -> Private Key
-> paste the private key from your terminal output
-> switch to the Hardhat Local network -> you should see 10,000 ETH
```

> **Warning:** These are test-only accounts generated by Hardhat. The private keys are the same for everyone running Hardhat locally and hold no real value. Never use them on any real network.

### Step 7 — Start the Backend
```bash
cd ~/chainba/chainba-backend
node index.js
```

Expected output:
```
MongoDB connected
ChainBa backend running on port 5000
```

### Step 8 — Start the React Frontend
```bash
cd ~/chainba/chainba-frontend
npm start
```

Open Chrome at the IP address shown in the terminal on port 3000. Always use the IP address shown, not localhost.

---

## Restarting the Stack

```bash
# Terminal 1 — restart blockchain
cd ~/chainba && npx hardhat node

# Terminal 2 — redeploy contracts
cd ~/chainba && npx hardhat run scripts/deploy.js --network localhost

# Terminal 3 — restart backend
cd ~/chainba/chainba-backend && node index.js

# Terminal 4 — restart frontend
cd ~/chainba/chainba-frontend && npm start

# MetaMask — clear nonce data (required after redeploy)
MetaMask -> Settings -> Advanced -> Clear activity and nonce data -> Clear

# Browser — hard refresh
Ctrl + Shift + R
```

---

## Smart Contracts

### MemberReputation.sol
Stores permanent on-chain reputation scores for every member across all groups. Inherits OpenZeppelin `Ownable` and `Pausable`.

| Function | Description |
|---|---|
| `registerMember(address)` | Creates member with starting score of 100 |
| `recordOnTimePayment(address)` | +10 score |
| `recordLatePayment(address)` | -3 score |
| `recordDefault(address)` | -15 score |
| `recordEjection(address)` | -50 score |
| `getScore(address)` | Returns current score (min 0) |

### ChilimbaGroup.sol
Core group logic — handles the complete lifecycle of a Chilimba group. Protected with OpenZeppelin `ReentrancyGuard` and `Pausable`. Uses the checks-effects-interactions pattern for all ETH transfers.

| Function | Description |
|---|---|
| `joinGroup(name, nrc, phone)` | Join group and pay stake — hashes identity with keccak256 |
| `payContribution()` | Pay current cycle contribution |
| `flagDefault(address)` | Leader marks a defaulting member after deadline |
| `getCurrentBeneficiary()` | Returns who receives this cycle's payout |
| `getCycleInfo(cycle)` | Returns details about a specific cycle |
| `getMemberCount()` | Returns number of joined members |
| `hasPaid(address, cycle)` | Returns whether member paid a given cycle |
| `pause() / unpause()` | Emergency stop — leader only |

### ChilimbaFactory.sol
Deploys and tracks individual group contracts. Entry point for all group creation.

| Function | Description |
|---|---|
| `createGroup(...)` | Deploys a new ChilimbaGroup contract |
| `getAllGroups()` | Returns all group contract addresses |
| `getLeaderGroups(address)` | Returns groups led by a specific address |
| `getTotalGroups()` | Returns total number of groups created |

---

## Security Architecture

```
Layer 1 — Identity Hashing (On-Chain):
  keccak256(fullName + nationalID + phone)
  Stored on blockchain — irreversible and tamper-proof
  Cannot be reverse-engineered

Layer 2 — Wallet Security:
  Private keys never leave MetaMask
  All transactions require explicit user approval in MetaMask
  Auto-created wallets encrypted with AES-256 using user password
  Encrypted key stored in MongoDB — never plaintext

Layer 3 — Smart Contract Security:
  ReentrancyGuard (OpenZeppelin) on payContribution() and _releasePayout()
  Checks-Effects-Interactions pattern — state updated BEFORE ETH transfer
  Pausable emergency stop mechanism — leader only
  Integer overflow protection built into Solidity 0.8+
  OpenZeppelin battle-tested and audited libraries

Layer 4 — Backend Security:
  Passwords hashed with bcrypt (12 salt rounds)
  JWT tokens for session management (30-day expiry)
  Rate limiting — max 10 auth requests per 15 minutes
  Input validation on all endpoints
  Specific duplicate error messages (phone vs NRC number)
  SHA-256 identity hashing on backend mirrors on-chain approach
```

### Known Limitations

- Block timestamp can be manipulated by miners (±15 seconds)
- Beneficiary selection uses pseudo-random keccak256 — not true randomness
- The admin panel is protected by a password stored in the frontend and is not suitable for production. In a real deployment this must be replaced with proper role-based authentication on the backend.

---

## Running Tests

```bash
cd ~/chainba
npx hardhat test
```

Current test results:
```
  ChainBa — Full Test Suite
    MemberReputation
      ✔ Should register a member with score 100
      ✔ Should keep score at 100 max on on-time payment
      ✔ Should decrease score on late payment
      ✔ Should decrease score on default
      ✔ Should not allow score to go below zero
    ChilimbaFactory
      ✔ Should create a new group
      ✔ Should track leader groups separately
      ✔ Should increment total groups count
    ChilimbaGroup — Joining
      ✔ Should allow member to join with correct stake
      ✔ Should reject joining with wrong stake
      ✔ Should reject duplicate member joining
      ✔ Should activate group when member limit reached
      ✔ Should store member data correctly on joining
    ChilimbaGroup — Contributions
      ✔ Should allow active member to pay contribution
      ✔ Should reject double payment in same cycle
      ✔ Should reject wrong contribution amount
      ✔ Should release payout when all members pay
      ✔ Should advance to cycle 2 after cycle 1 completes
    ChilimbaGroup — Security
      ✔ Should reject stranger trying to pay
      ✔ Should reject non-leader flagging default
      ✔ Should pause and reject contributions when paused
      ✔ Should resume contributions after unpause
      ✔ Should reject joining when group is already active

  23 passing (3s)
```

---

## Backend API Endpoints

Base URL: `http://<your-ip>:5000`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Register user — auto-creates Ethereum wallet |
| POST | `/api/auth/login` | None | Login with phone + password — returns JWT |
| GET | `/api/profile/me` | JWT Bearer | Get profile + ETH balance |
| GET | `/api/admin/users` | x-admin-key header | List all registered users |

Register request body:
```json
{
  "fullName": "Jane Banda",
  "phone": "0974831002",
  "nrcNumber": "123456/78/1",
  "password": "yourpassword"
}
```

Login request body:
```json
{
  "phone": "0974831002",
  "password": "yourpassword"
}
```

---

## Frontend Pages

| Page | Route | Description |
|---|---|---|
| Landing | `/` | Home page — MetaMask connect, Register, Login |
| Register | `/register` | New user signup with NRC validation |
| Login | `/login` | Phone + password authentication |
| Dashboard | `/dashboard` | ETH balance, reputation score, all groups |
| Create Group | `/create` | 3-step group creation wizard |
| Group View | `/group/:address` | Group details, members, pay contribution |
| Profile | `/profile` | Personal info, wallet address, identity hash |
| Admin | `/admin` | All registered users (demo only — see Known Limitations) |

---

## Hardhat Test Accounts

When you run `npx hardhat node`, Hardhat generates 20 deterministic test accounts. The addresses and private keys are printed directly in your terminal at startup — use those to import accounts into MetaMask.

> **Warning:** These accounts use publicly known private keys that are the same for everyone running Hardhat. They only hold test ETH on your local network and have no real-world value. Never send real ETH to these addresses and never use these keys on any other network.

---

## Completed Features

- [x] Local Ethereum blockchain via Hardhat
- [x] MemberReputation smart contract (Ownable + Pausable)
- [x] ChilimbaGroup smart contract (ReentrancyGuard + Pausable)
- [x] ChilimbaFactory smart contract
- [x] OpenZeppelin 4.9.3 security libraries integrated
- [x] Checks-effects-interactions pattern on all ETH transfers
- [x] Contract compilation and deployment with auto address saving
- [x] Full test suite — 23 tests passing
- [x] React frontend with session persistence (localStorage)
- [x] MetaMask auto-connection on page load
- [x] MetaMask account change listener
- [x] Landing page with Register / Login / MetaMask options
- [x] User registration with automatic blockchain wallet creation
- [x] Phone + password login with JWT
- [x] Dashboard with ETH balance and reputation score
- [x] 3-step group creation wizard
- [x] Group view page with live cycle information
- [x] Member joining with stake payment
- [x] Contribution payment via MetaMask
- [x] Automatic payout when all members pay
- [x] Reputation score updates after every payment
- [x] Cycle progression (Cycle 1 -> Cycle 2 -> ...)
- [x] Profile page with identity hash display
- [x] Admin panel with registered user management
- [x] Rate limiting — 10 auth requests per 15 minutes
- [x] Specific error messages for duplicate phone / NRC
- [x] NRC format validation (`123456/78/1`)
- [x] MongoDB database with encrypted wallet storage
- [x] bcrypt password hashing (12 rounds)
- [x] JWT authentication (30-day tokens)
- [x] Clipboard copy fallback for HTTP environments

---

## Production Roadmap

For real-world deployment in Zambia:

1. Deploy on the Polygon network — gas fees roughly $0.001 versus Ethereum's $5–50
2. Integrate mobile-money payment gateways (e.g. AirtelMoney) for ZMW deposits
3. Replace ETH with the USDC stablecoin so users never interact with crypto directly
4. Obtain a Bank of Zambia Payment Service Provider licence
5. Add USSD support (`*123#`) for feature-phone users
6. Build a React Native mobile app
7. Replace the frontend-only admin panel with proper role-based backend auth
8. Commission a professional smart contract security audit before any mainnet deployment

---

## Useful Commands

```bash
# Compile contracts
cd ~/chainba && npx hardhat compile

# Deploy contracts
cd ~/chainba && npx hardhat run scripts/deploy.js --network localhost

# Run full test suite
cd ~/chainba && npx hardhat test

# Start local blockchain
cd ~/chainba && npx hardhat node

# Start backend server
cd ~/chainba/chainba-backend && node index.js

# Start React frontend
cd ~/chainba/chainba-frontend && npm start

# Check MongoDB users
mongosh chainba --eval "db.users.find().pretty()"
```

---

## License

Released under the terms in [LICENSE](LICENSE).
