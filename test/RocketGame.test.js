const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RocketGame Contract", function () {
  let RocketGame;
  let rocketGame;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    // Get contract factories
    RocketGame = await ethers.getContractFactory("RocketGame");
    
    // Get signers
    [owner, addr1, addr2] = await ethers.getSigners();
    
    // Deploy contract
    rocketGame = await RocketGame.deploy();
    await rocketGame.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await rocketGame.owner()).to.equal(owner.address);
    });

    it("Should initialize token counter to zero", async function () {
      expect(await rocketGame.tokenCounter()).to.equal(0);
    });
  });

  describe("Action Logging", function () {
    it("Should emit ActionLogged event when logging an action", async function () {
      const action = "MOVE_LEFT";
      
      await expect(rocketGame.connect(addr1).logAction(action))
        .to.emit(rocketGame, "ActionLogged")
        .withArgs(addr1.address, action, await ethers.provider.getBlock("latest").then(block => block.timestamp + 1));
    });

    it("Should log game over action with score", async function () {
      const action = "GAME_OVER_SCORE_1000";
      
      await expect(rocketGame.connect(addr1).logGameOver(action))
        .to.emit(rocketGame, "ActionLogged");
        
      // Check that high score was updated
      expect(await rocketGame.getHighScore(addr1.address)).to.equal(1000);
    });

    it("Should update high score if new score is higher", async function () {
      await rocketGame.connect(addr1).logGameOver("GAME_OVER_SCORE_1000");
      await rocketGame.connect(addr1).logGameOver("GAME_OVER_SCORE_500");
      await rocketGame.connect(addr1).logGameOver("GAME_OVER_SCORE_2000");
      
      expect(await rocketGame.getHighScore(addr1.address)).to.equal(2000);
    });
  });

  describe("NFT Minting", function () {
    it("Should mint a new NFT with the given URI", async function () {
      const recipient = addr1.address;
      const tokenURI = "https://example.com/metadata/1000";
      
      await expect(rocketGame.mintScoreNFT(recipient, tokenURI))
        .to.emit(rocketGame, "ScoreMinted")
        .withArgs(recipient, 0, tokenURI);
        
      expect(await rocketGame.ownerOf(0)).to.equal(recipient);
      expect(await rocketGame.tokenURI(0)).to.equal(tokenURI);
      expect(await rocketGame.tokenCounter()).to.equal(1);
    });

    it("Should allow any address to mint NFTs", async function () {
      const tokenURI = "https://example.com/metadata/1000";
      
      await rocketGame.connect(addr1).mintScoreNFT(addr2.address, tokenURI);
      
      expect(await rocketGame.ownerOf(0)).to.equal(addr2.address);
    });
  });

  describe("Utility Functions", function () {
    it("Should correctly extract score from action string", async function () {
      await rocketGame.connect(addr1).logGameOver("GAME_OVER_SCORE_12345");
      
      expect(await rocketGame.getHighScore(addr1.address)).to.equal(12345);
    });

    it("Should return total minted NFTs", async function () {
      await rocketGame.mintScoreNFT(addr1.address, "https://example.com/metadata/1");
      await rocketGame.mintScoreNFT(addr2.address, "https://example.com/metadata/2");
      
      expect(await rocketGame.getTotalMinted()).to.equal(2);
    });
  });
}); 