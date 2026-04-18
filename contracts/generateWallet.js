// generateWallet.js — Generate a fresh Holesky wallet
// Run: node contracts/generateWallet.js

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const wallet = ethers.Wallet.createRandom();

console.log("\n╔══════════════════════════════════════════════════════╗");
console.log("║           GasSafe — New Wallet Generated             ║");
console.log("╠══════════════════════════════════════════════════════╣");
console.log(`║ Address:      ${wallet.address} ║`);
console.log(`║ Private Key:  ${wallet.privateKey} ║`);
console.log(`║ Mnemonic:     ${wallet.mnemonic.phrase.substring(0, 50)}... ║`);
console.log("╠══════════════════════════════════════════════════════╣");
console.log("║  GET TESTNET ETH (Holesky):                          ║");
console.log("║  1. https://holesky-faucet.pk910.de/ (PoW, easiest) ║");
console.log("║  2. https://faucet.quicknode.com/ethereum/holesky    ║");
console.log("║  3. https://www.alchemy.com/faucets/ethereum-holesky ║");
console.log("╚══════════════════════════════════════════════════════╝\n");

// Save .env template
const envContent = `# GasSafe Environment Config
PRIVATE_KEY=${wallet.privateKey}
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
PORT=3001
CONTRACT_ADDRESS=  # fill after deploy
`;

const envPath = path.join(__dirname, "../.env");
if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envContent);
  console.log("✅ .env file created with your private key");
} else {
  console.log("⚠️  .env already exists — add your key manually");
}

// Save wallet info (WITHOUT private key) for reference
const walletInfo = {
  address: wallet.address,
  network: "holesky",
  generatedAt: new Date().toISOString(),
  faucets: [
    "https://holesky-faucet.pk910.de/",
    "https://faucet.quicknode.com/ethereum/holesky",
    "https://www.alchemy.com/faucets/ethereum-holesky"
  ]
};
fs.mkdirSync(path.join(__dirname, "../backend/data"), { recursive: true });
fs.writeFileSync(
  path.join(__dirname, "../backend/data/wallet_info.json"),
  JSON.stringify(walletInfo, null, 2)
);

console.log("🔐 IMPORTANT: Save your private key and mnemonic securely!");
console.log("📁 Wallet address saved to backend/data/wallet_info.json");
