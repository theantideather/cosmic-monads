// Scripts to deploy the RocketGame contract to Monad Testnet
const hre = require("hardhat");

async function main() {
  console.log("Deploying RocketGame contract to Monad Testnet...");

  // Get the contract factory
  const RocketGame = await hre.ethers.getContractFactory("RocketGame");
  
  // Deploy the contract
  const rocketGame = await RocketGame.deploy();

  // Wait for deployment to complete
  await rocketGame.deployed();

  console.log(`RocketGame contract deployed to: ${rocketGame.address}`);
  console.log("Update the CONTRACT_ADDRESS in js/config.js with this address");
  
  // Verify the contract if on a supported network
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    
    // Wait for 6 block confirmations
    await rocketGame.deployTransaction.wait(6);
    
    console.log("Verifying contract...");
    
    try {
      await hre.run("verify:verify", {
        address: rocketGame.address,
        constructorArguments: [],
      });
      console.log("Contract verification successful");
    } catch (error) {
      console.error("Error verifying contract:", error);
    }
  }
}

// Run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 