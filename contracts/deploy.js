// deploy.js — Deploy GasSafe.sol to HeLa testnet
// Run: node contracts/deploy.js

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Load ABI and Bytecode from compiled files (solc output)
// Make sure you have run: npx solc --abi --bin contracts/GasSafe.sol -o contracts/compiled/
const COMPILED_DIR = path.join(__dirname, "compiled");
const ABI_PATH  = path.join(COMPILED_DIR, "contracts_GasSafe_sol_GasSafe.abi");
const BIN_PATH  = path.join(COMPILED_DIR, "contracts_GasSafe_sol_GasSafe.bin");

if (!fs.existsSync(ABI_PATH) || !fs.existsSync(BIN_PATH)) {
  console.error("❌ Compiled files not found. Run:");
  console.error("   npx solc --abi --bin contracts/GasSafe.sol -o contracts/compiled/");
  process.exit(1);
}

const ABI      = JSON.parse(fs.readFileSync(ABI_PATH, "utf8"));
const BYTECODE = "0x" + fs.readFileSync(BIN_PATH, "utf8").trim();

async function deploy() {
  // Use HELA_RPC_URL from .env or fall back to HeLa testnet
  const RPC_URL =
    process.env.HELA_RPC_URL ||
    "https://testnet-rpc.helachain.com";

  const PRIVATE_KEY = process.env.PRIVATE_KEY;

  if (!PRIVATE_KEY) {
    console.error("❌ No PRIVATE_KEY found in .env");
    console.log("\n📋 Setup instructions:");
    console.log("1. Get testnet HLUSD from https://testnet-faucet.helachain.com");
    console.log("2. Add to .env:  PRIVATE_KEY=0x...   HELA_RPC_URL=https://testnet-rpc.helachain.com");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet   = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log(`🔑 Deploying from: ${wallet.address}`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance < ethers.parseEther("0.01")) {
    console.error("❌ Insufficient balance (need ≥ 0.01 ETH). Get testnet ETH first.");
    process.exit(1);
  }

  const factory  = new ethers.ContractFactory(ABI, BYTECODE, wallet);
  console.log("📤 Deploying GasSafe.sol...");

  const contract = await factory.deploy();
  console.log(`⏳ Tx sent: ${contract.deploymentTransaction().hash}`);
  console.log("   Waiting for confirmation...");

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`✅ GasSafe deployed at: ${address}`);

  // Persist config so backend picks it up automatically
  const outDir = path.join(__dirname, "../backend/data");
  fs.mkdirSync(outDir, { recursive: true });

  const config = {
    contractAddress: address,
    ownerAddress:    wallet.address,
    network:         RPC_URL.includes("testnet-rpc.helachain") ? "hela-testnet" : "hela-mainnet",
    deployedAt:      new Date().toISOString(),
    abi:             ABI,
  };

  const configPath = path.join(outDir, "contract.json");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`💾 Config saved to ${configPath}`);

  const explorer = RPC_URL.includes("testnet-rpc.helachain")
    ? `https://testnet-blockexplorer.helachain.com/address/${address}`
    : `https://helascan.io/address/${address}`;

  console.log("\n🎉 Deployment complete!");
  console.log(`🔗 View on explorer: ${explorer}`);
}

deploy().catch((err) => {
  console.error("❌ Deployment failed:", err.message || err);
  process.exit(1);
});