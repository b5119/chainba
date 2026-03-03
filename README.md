# 🪙 ChainBa — Blockchain-Powered Chilimba Platform

> **CCS4711 — Cryptography & Applications**
> Lecturer: Mr Victor Neene | Due: 6 April 2026
> Group Name: **Chain Keepers**

---

## 👥 Group Members & Roles

| Student | Role | Responsibility |
|---|---|---|
| Student 1 | Smart Contracts | Solidity contracts, identity hashing, reputation system |
| Student 2 | User Interaction & Wallet | Registration, login, wallet creation, backend API |
| Student 3 | Blockchain Infrastructure | Hardhat, deployment scripts, test suite |
| Student 4 | User Interface | React frontend, all pages and screens |

---

## 🧠 Problem Statement

Traditional Zambian Chilimba (rotating savings groups) operate entirely on trust with no contracts, payment records, or fraud protection. Common problems include:

- Organizers disappearing with pooled funds
- Members disputing payment records
- No verification of a member's past behaviour
- Early recipients facing no enforced obligation to continue paying
- No transparent audit trail

## ✅ Our Solution

**ChainBa** is a decentralised web application built on Ethereum blockchain that digitises and automates Chilimba through smart contracts:

- Money is held by **code, not people** — nobody can run away with funds
- All contributions, penalties and payouts are **immutably recorded on-chain**
- Rules are enforced **automatically** — no human arbitration needed
- Every member builds a **permanent reputation score** visible to future groups

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity 0.8.19 |
| Blockchain Dev | Hardhat (local) |
| Security Libraries | OpenZeppelin |
| Blockchain Connection | ethers.js v5 |
| Frontend | React.js |
| Wallet | MetaMask |
| Backend | Node.js + Express.js |
| Database | MongoDB |
| Auth | JWT + bcrypt |
| File Storage | IPFS (planned) |

---

## 📁 Project Structure

```
chainba/
├── contracts/
│   ├── MemberReputation.sol      # Global reputation scoring
│   ├── ChilimbaGroup.sol         # Core group logic
│   └── ChilimbaFactory.sol       # Deploys group contracts
├── scripts/
│   └── deploy.js                 # Deployment script
├── test/
│   └── (test files go here)      # Student 3
├── chainba-frontend/
│   └── src/
│       ├── pages/
│       │   ├── Landing.js        # Home page
│       │   ├── Dashboard.js      # User dashboard
│       │   ├── CreateGroup.js    # Group creation wizard
│       │   └── GroupView.js      # Group detail + pay
│       ├── contracts/
│       │   ├── config.js         # ABIs + contract addresses
│       │   └── addresses.json    # Deployed addresses (auto-generated)
│       └── App.js                # Main app + routing
├── chainba-backend/
│   └── (backend files go here)   # Student 2
├── hardhat.config.js
├── package.json
└── README.md
```

---

## ⚙️ Prerequisites — Install These First

Before cloning the repo every team member needs:

### 1. Node.js via NVM
```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

# Install Node 22
nvm install 22
nvm use 22
nvm alias default 22

# Verify
node --version   # must show v22.x.x
```

### 2. Google Chrome
Download from https://www.google.com/chrome

### 3. MetaMask Browser Extension
1. Open Chrome
2. Go to https://metamask.io/download
3. Click **Add to Chrome**
4. Click **Create a new wallet**
5. Set a strong password
6. **Write down your 12-word seed phrase safely offline**

### 4. VS Code (Recommended)
Download from https://code.visualstudio.com

Recommended extensions:
- Solidity (Juan Blanco)
- Prettier
- ES7 React Snippets
- GitLens

### 5. MongoDB
```bash
# Install MongoDB on Ubuntu
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Verify
mongosh   # should open MongoDB shell
```

---

## 🚀 Setup Guide — Step by Step

### Step 1 — Clone the Repository
```bash
cd ~
git clone https://github.com/YOURUSERNAME/chainba.git
cd chainba
```

### Step 2 — Install Hardhat Dependencies
```bash
cd ~/chainba
npm install --legacy-peer-deps
```

If you get errors run:
```bash
npm install --save-dev "@nomicfoundation/hardhat-ignition@^0.15.16" "@nomicfoundation/ignition-core@^0.15.15" --legacy-peer-deps
```

### Step 3 — Install Frontend Dependencies
```bash
cd ~/chainba/chainba-frontend
npm install
```

### Step 4 — Start the Local Blockchain
Open a dedicated terminal for this — **keep it running always:**
```bash
cd ~/chainba
npx hardhat node
```

You should see 20 test accounts each with 10,000 ETH printed.

### Step 5 — Deploy Smart Contracts
Open a NEW terminal tab:
```bash
cd ~/chainba
npx hardhat run scripts/deploy.js --network localhost
```

You should see:
```
Deploying with account: 0xf39Fd6e5...
MemberReputation deployed to: 0x5FbDB2...
ChilimbaFactory deployed to: 0xe7f172...
✅ Addresses saved!
```

### Step 6 — Configure MetaMask

**Add Hardhat Local Network:**
```
Network Name:    Hardhat Local
RPC URL:         http://127.0.0.1:8545
Chain ID:        31337
Currency Symbol: ETH
```

**Import Test Account:**
```
MetaMask → Click account icon → Add account or hardware wallet
→ Import account → Private Key
→ Paste: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
→ Click Import
→ Switch to Hardhat Local network
→ You should see 10,000 ETH
```

### Step 7 — Start the React Frontend
```bash
cd ~/chainba/chainba-frontend
npm start
```

Open Chrome and go to: `http://172.16.141.86:3000`
(use the IP shown in terminal, NOT localhost)

### Step 8 — Start the Backend Server (when built)
```bash
cd ~/chainba/chainba-backend
node index.js
```

---

## ⚠️ IMPORTANT — Every Time You Restart

Every time your computer restarts or the Hardhat node stops you must:

```bash
# Terminal 1 — restart blockchain
cd ~/chainba
npx hardhat node

# Terminal 2 — redeploy contracts
cd ~/chainba
npx hardhat run scripts/deploy.js --network localhost

# MetaMask — clear nonce data
MetaMask → ☰ → Settings → Advanced → Clear activity and nonce data → Clear

# Browser — hard refresh
Ctrl + Shift + R
```

---

## 📜 Smart Contracts

### MemberReputation.sol
Stores permanent reputation scores for every member across all groups.

| Function | Description |
|---|---|
| `registerMember(address)` | Creates member with score 100 |
| `recordOnTimePayment(address)` | +10 score |
| `recordLatePayment(address)` | -3 score |
| `recordDefault(address)` | -15 score |
| `recordEjection(address)` | -50 score |
| `getScore(address)` | Returns current score |
| `getMember(address)` | Returns full stats |

### ChilimbaGroup.sol
Core group logic — handles the full lifecycle of a Chilimba group.

| Function | Description |
|---|---|
| `joinGroup(name, nrc, phone)` | Join and pay stake |
| `payContribution()` | Pay current cycle |
| `flagDefault(address)` | Leader marks defaulter |
| `getCurrentBeneficiary()` | Who receives this cycle |
| `getCycleInfo(cycle)` | Info about a specific cycle |

### ChilimbaFactory.sol
Deploys individual group contracts and tracks all groups.

| Function | Description |
|---|---|
| `createGroup(...)` | Deploy new group contract |
| `getAllGroups()` | List all groups |
| `getLeaderGroups(address)` | Groups led by an address |

---

## 🔐 Security Architecture

```
Layer 1 — Identity:
  keccak256(fullName + nationalID + phone)
  → Stored on blockchain — irreversible hash

Layer 2 — Wallet (MetaMask):
  Private key never leaves MetaMask
  All transactions require explicit approval

Layer 3 — Smart Contract:
  Rules immutable after deployment
  Re-entrancy guards (OpenZeppelin)
  Overflow protection (Solidity 0.8+)
  Only contract code controls funds

Layer 4 — Backend (planned):
  Passwords bcrypt hashed
  JWT authentication tokens
  AES-256 encrypted wallet storage
  MongoDB encrypted at rest
```

---

## ✅ What's Working (Completed)

- [x] Local Ethereum blockchain (Hardhat)
- [x] MemberReputation smart contract
- [x] ChilimbaGroup smart contract
- [x] ChilimbaFactory smart contract
- [x] Contract compilation and deployment
- [x] React frontend connected to blockchain
- [x] MetaMask wallet integration
- [x] Landing page
- [x] Dashboard with ETH balance and reputation
- [x] 3-step group creation wizard
- [x] Group view page
- [x] Member joining with stake payment
- [x] Contribution payment
- [x] Automatic payout when all members pay
- [x] Reputation score updates after payments
- [x] Cycle progression (Cycle 1 → Cycle 2)
- [x] Leader dashboard showing group status

---

## 🔧 What Still Needs Building

### Student 2 — Backend & Registration (HIGH PRIORITY)
- [ ] Express.js server setup (`chainba-backend/index.js`)
- [ ] MongoDB connection and user schema
- [ ] `POST /api/register` — creates user + auto-generates wallet
- [ ] `POST /api/login` — returns JWT token
- [ ] Wallet encryption with user password (ethers.js `wallet.encrypt()`)
- [ ] `GET /api/profile/:address` — user profile data
- [ ] `GET /api/notifications/:address` — payment reminders
- [ ] Replace MetaMask private key import with phone+password login

### Student 4 — Missing Frontend Pages
- [ ] Register page (name, phone, NRC, password)
- [ ] Login page (phone + password)
- [ ] Profile page (reputation history, transaction log)
- [ ] Notification bell with payment reminders
- [ ] Transaction history list

### Student 3 — Test Suite
- [ ] `test/MemberReputation.test.js`
- [ ] `test/ChilimbaGroup.test.js`
- [ ] `test/ChilimbaFactory.test.js`
- [ ] Edge cases: double payment, wrong amount, ejection
- [ ] Security tests: reentrancy, unauthorized access
- [ ] Run with: `npx hardhat test`

### All Students
- [ ] Gas optimization review
- [ ] Individual written reflections
- [ ] Final presentation demo preparation
- [ ] GitHub repository fully pushed and documented

---

## 🗺️ Recommended Next Steps (In Order)

### Week 1 (Now)
```
1. All members clone repo and complete setup
2. Student 3 writes test suite
3. Student 2 sets up Express backend + MongoDB
4. Student 4 builds Register + Login pages
```

### Week 2
```
5. Student 2 implements wallet auto-creation on register
6. Student 4 builds Profile page + notification bell
7. Student 1 reviews contracts for gas optimization
8. All students test the full flow end to end
```

### Week 3 (Final)
```
9. Full integration testing
10. Bug fixes
11. Written documentation and reflections
12. Demo preparation
13. Final GitHub push
14. Submit
```

---

## 🧪 Running Tests (Student 3)

```bash
cd ~/chainba
npx hardhat test
```

Write tests in `test/` folder using this format:

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ChilimbaGroup", function () {
  it("Should allow member to join with correct stake", async function () {
    // test code here
  });
});
```

---

## 💡 Useful Commands

```bash
# Compile contracts
npx hardhat compile

# Deploy contracts
npx hardhat run scripts/deploy.js --network localhost

# Run tests
npx hardhat test

# Start local blockchain
npx hardhat node

# Start React frontend
cd chainba-frontend && npm start

# Start backend
cd chainba-backend && node index.js

# Push to GitHub
git add .
git commit -m "your message"
git push origin main
```

---

## 📞 Contract Addresses (Local — Reset on Restart)

These are regenerated every time you run `deploy.js`. Current addresses saved in:
```
chainba-frontend/src/contracts/addresses.json
```

---

## 🌍 Production Roadmap (Beyond Assignment)

For real-world deployment in Zambia:

1. Deploy on **Polygon network** (cheaper gas than Ethereum)
2. Integrate **AirtelMoney** payment gateway
3. Use **USDC stablecoin** so users never touch crypto directly
4. Get **Bank of Zambia** Payment Service Provider license
5. Add **USSD support** (`*123#`) for feature phone users
6. **Mobile app** (React Native or Flutter)
7. Professional **smart contract security audit**

---

## 📄 Assignment Deliverables Checklist

- [ ] GitHub repository with all code
- [ ] Smart contracts (3 files) — Student 1
- [ ] Deployment scripts — Student 3
- [ ] Test suite — Student 3
- [ ] React frontend — Student 4
- [ ] Backend API — Student 2
- [ ] This README
- [ ] Individual written reflections (each student)
- [ ] Live demo during presentation

---

## 🤝 Git Workflow for Team

```bash
# Before starting work each day
git pull origin main

# After making changes
git add .
git commit -m "Student 2: Added login endpoint"
git push origin main

# If conflicts
git pull origin main
# resolve conflicts
git add .
git commit -m "Merged conflicts"
git push origin main
```

Each student should work on their own files to avoid conflicts:
- Student 1 → `contracts/` folder only
- Student 2 → `chainba-backend/` folder only
- Student 3 → `test/` and `scripts/` folders
- Student 4 → `chainba-frontend/` folder only

---

*ChainBa — Chain Keepers | CCS4711 Cryptography & Applications | Mr Victor Neene*
