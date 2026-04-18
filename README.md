# ⛽ GasSafe — AAEP Protocol Proof of Concept

**Problem Statement 4: Agentic Protocol for Auditability and Explainability**

GasSafe is a blockchain-powered LPG subsidy fraud prevention system built as a proof-of-concept 
for the **AAEP (Autonomous Agent Execution Protocol)** — a standardized protocol for 
deploying, auditing, and governing autonomous onchain agents.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   AAEP Protocol v1.0                 │
│  ┌─────────────────┐    IAMF     ┌────────────────┐ │
│  │  Booking Agent  │ ──────────► │ Scoring Agent  │ │
│  │  (Agent 1)      │ ◄────────── │  (Agent 2)     │ │
│  │                 │  SCORE_RESP │                │ │
│  │ • Mock ZKP      │             │ • DBSCAN Sybil │ │
│  │ • SBT Issue     │             │ • Isolation    │ │
│  │ • Escrow Lock   │             │   Forest       │ │
│  │ • Subsidy Rel.  │             │ • GPS Check    │ │
│  └────────┬────────┘             └────────────────┘ │
│           │                                          │
│           ▼                                          │
│  ┌─────────────────┐   ┌──────────────────────────┐ │
│  │  Holesky Chain  │   │  AAEP Audit Log (DLE)    │ │
│  │  GasSafe.sol    │   │  append-only JSON + hash │ │
│  │  SBT + Escrow   │   │  Merkle root anchored    │ │
│  └─────────────────┘   └──────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
cd frontend && npm install && cd ..
```

### 2. Generate wallet + get testnet ETH
```bash
node contracts/generateWallet.js
```
This creates your `.env` file with a fresh wallet.

**Get testnet ETH (Holesky) from any of:**
- https://holesky-faucet.pk910.de/ ← easiest, no Twitter
- https://faucet.quicknode.com/ethereum/holesky
- https://www.alchemy.com/faucets/ethereum-holesky

### 3. Deploy the smart contract
```bash
node contracts/deploy.js
```
This deploys `GasSafe.sol` to Holesky and saves the contract address to `backend/data/contract.json`.

Update your `.env` with the contract address shown after deploy.

### 4. Build frontend
```bash
cd frontend && npm run build && cd ..
```

### 5. Run the server
```bash
node server.js
```
Open http://localhost:3001

---

## 🖥️ UI Screens

| Screen | URL | Purpose |
|--------|-----|---------|
| Customer | `/` | Register, book gas, view booking history |
| Delivery Agent | `/delivery` | View pending deliveries, submit proof |
| Admin Audit | `/admin` | View all DLEs, override decisions, anchor Merkle root |

---

## 🔗 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/register` | Register user (ZKP + SBT) |
| POST | `/api/book` | Book gas cylinder |
| POST | `/api/deliver` | Confirm delivery with proof |
| GET | `/api/bookings/:wallet` | Get user's bookings |
| GET | `/api/user/:wallet` | Get user info |
| GET | `/api/deliveries/pending` | All pending deliveries |
| GET | `/api/audit` | Full audit log (all DLEs) |
| GET | `/api/audit/:traceId` | Trace a specific workflow |
| POST | `/api/override/:dleId` | Override an agent decision |
| POST | `/api/audit/anchor` | Anchor Merkle root onchain |
| GET | `/api/stats` | Dashboard stats |

---

## 📋 AAEP Protocol

The protocol spec is in `protocol/AAEP_PROTOCOL.md`.

**Key concepts:**
- **DLE (Decision Log Entry):** Every agent decision is logged with inputs, reasoning, and output
- **IAMF (Inter-Agent Message Format):** Standardized envelope for agent-to-agent communication
- **Merkle Anchoring:** DLE hashes are committed onchain for tamper-proof auditability
- **Override Mechanism:** Any DLE can be challenged by admin or DAO

**Implementing AAEP in a new system:**
1. Define agent manifests
2. Use IAMF for all agent communication
3. Every decision must emit a DLE via `auditLogger.logDecision()`
4. Expose `/audit` and `/override` endpoints
5. Periodically anchor Merkle root onchain

---

## ⛓️ Smart Contract

`contracts/GasSafe.sol` — Deployed on Holesky testnet

**Functions:**
- `issueSBT()` — Mint non-transferable Soulbound Token
- `lockSubsidy()` — Lock Rs.300 equivalent in escrow
- `releaseSubsidy()` — Release escrow on valid proof
- `overrideBooking()` — Admin override
- `anchorAuditRoot()` — Commit AAEP Merkle root

---

## 🛠️ Tech Stack

- **Frontend:** React + Vite + React Router
- **Backend:** Express.js (Node.js)
- **Blockchain:** Solidity on Holesky testnet (ethers.js v6)
- **DB:** JSON flat files (append-only audit log)
- **ZKP:** Mocked (real structure, fake proof)
- **ML Models:** DBSCAN + Isolation Forest (pure JS)
- **Protocol:** AAEP v1.0

---

## 📁 Project Structure

```
gassafe/
├── protocol/
│   └── AAEP_PROTOCOL.md          # The protocol spec (PS-4 deliverable)
├── contracts/
│   ├── GasSafe.sol               # Smart contract
│   ├── deploy.js                 # Deployment script
│   └── generateWallet.js         # Wallet generator
├── backend/
│   ├── agents/
│   │   ├── bookingAgent.js       # Agent 1: ZKP, SBT, Escrow
│   │   ├── scoringAgent.js       # Agent 2: DBSCAN, Isolation Forest
│   │   ├── chainService.js       # Ethers.js wrapper
│   │   └── auditLogger.js        # AAEP DLE store
│   ├── routes/
│   │   └── api.js                # Express routes
│   └── data/
│       ├── db.json               # Users + bookings
│       └── audit_log.json        # AAEP audit log
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── CustomerUI.jsx    # Customer booking UI
│       │   ├── DeliveryUI.jsx    # Delivery agent UI
│       │   └── AdminUI.jsx       # Admin audit dashboard
│       └── App.jsx
├── server.js                     # Express entry point
└── .env                          # Your keys (git-ignored)
```
