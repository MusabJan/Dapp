# 🌾 AgriChain — Decentralized Agriculture DApp

> A full-stack Ethereum DApp for on-chain crop registration, trustless trading, and immutable supply chain tracking.

[![CI/CD](https://github.com/YOUR_USERNAME/agrichain/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/agrichain/actions)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.20-blue)](https://soliditylang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📸 Live Demo

> **[https://YOUR_USERNAME.github.io/agrichain](https://YOUR_USERNAME.github.io/agrichain)**

---

## 🏗 Architecture

```
agrichain/
├── contracts/
│   └── AgriChain.sol          # ERC-721 smart contract
├── scripts/
│   └── deploy.js              # Hardhat deploy script
├── test/
│   └── AgriChain.test.js      # Full test suite (Mocha/Chai)
├── frontend/
│   ├── src/
│   │   ├── App.js             # React app + ethers.js integration
│   │   ├── App.css            # Styling
│   │   └── config/            # ABI + deployment address (auto-generated)
│   └── public/
│       └── index.html
├── .github/
│   └── workflows/ci.yml       # GitHub Actions CI/CD
├── hardhat.config.js
├── package.json
└── .env.example
```

---

## ✨ Features

| Feature | Description |
|---|---|
| **Crop NFTs** | Each crop batch minted as ERC-721 token |
| **Farmer Verification** | Owner-verified farmer whitelist |
| **Trustless Marketplace** | ETH payments with auto fee split (2%) |
| **Supply Chain Tracking** | Immutable on-chain logistics log |
| **Delivery Confirmation** | Buyer-signed delivery receipt |
| **IPFS Metadata** | Off-chain photo/metadata via IPFS hash |
| **Gas Optimized** | Optimizer enabled, 200 runs |

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/agrichain.git
cd agrichain

# Install contract dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your RPC URL, private key, and Etherscan API key
```

### 3. Compile & Test

```bash
npm run compile
npm run test
```

### 4. Run Locally

```bash
# Terminal 1 — start local Hardhat node
npm run node

# Terminal 2 — deploy to local node
npm run deploy:local

# Terminal 3 — start React frontend
npm run frontend
```

---

## 🌐 Deploy to Sepolia Testnet

```bash
# Get Sepolia ETH from: https://sepoliafaucet.com
npm run deploy:sepolia
```

After deployment, the contract address is auto-saved to `frontend/src/config/deployment.json`.

---

## 📦 Deploy Frontend to GitHub Pages

Push to `main` and GitHub Actions will automatically:
1. Run Solidity tests
2. Build the React frontend
3. Deploy to GitHub Pages

```bash
git add .
git commit -m "feat: initial AgriChain DApp"
git push origin main
```

Then enable GitHub Pages in your repo:
> Settings → Pages → Source: **gh-pages branch**

---

## 🔐 Smart Contract — Key Functions

```solidity
// Verify a farmer wallet (owner only)
verifyFarmer(address farmer)

// Register crop batch → mints ERC-721 NFT
registerCrop(name, cropType, quantity, pricePerKg, harvestDate, location, ipfsHash, cert)

// Purchase a listed crop (payable)
purchaseCrop(uint256 cropId)

// Add logistics event to supply chain
addShipmentEvent(uint256 cropId, string eventType, string location)

// Buyer confirms final delivery
confirmDelivery(uint256 cropId)

// Read the full supply chain log
getSupplyChain(uint256 cropId) → ShipmentEvent[]
```

---

## 🧪 Test Coverage

```
AgriChain
  Farmer verification
    ✔ owner can verify a farmer
    ✔ non-owner cannot verify a farmer
  Crop registration
    ✔ verified farmer can register a crop
    ✔ unverified farmer cannot register
    ✔ mints an ERC-721 token to the farmer
  Purchasing a crop
    ✔ buyer can purchase a listed crop
    ✔ NFT ownership transfers to buyer
    ✔ farmer cannot buy their own crop
    ✔ reverts if insufficient ETH sent
  Supply chain
    ✔ farmer can add a shipment event
    ✔ supply chain log is retrievable
    ✔ buyer can confirm delivery
    ✔ non-buyer cannot confirm delivery
  Platform fee
    ✔ owner can update platform fee
    ✔ fee cannot exceed 5%
```

---

## 🛠 Tech Stack

- **Solidity ^0.8.20** — Smart contract
- **OpenZeppelin** — ERC-721, Ownable
- **Hardhat** — Compile, test, deploy
- **Ethers.js v6** — Frontend blockchain interaction
- **React 18** — Frontend UI
- **GitHub Actions** — CI/CD pipeline
- **GitHub Pages** — Frontend hosting

---

## 📄 License

MIT © 2024 AgriChain
