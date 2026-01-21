require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: "../.env" }); // Load .env file from parent directory

// DEBUG: Print the keys to the console to check if they are loaded
console.log("Debugging Keys...");
console.log("SEPOLIA_URL:", process.env.SEPOLIA_URL ? "Loaded ✅" : "NOT LOADED ❌");
console.log("PRIVATE_KEY:", process.env.PRIVATE_KEY ? "Loaded ✅" : "NOT LOADED ❌");

const SEPOLIA_URL = process.env.SEPOLIA_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: SEPOLIA_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};