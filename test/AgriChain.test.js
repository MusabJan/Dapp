const { expect } = require("chai");
const { ethers }  = require("hardhat");

describe("AgriChain", function () {
  let agrichain, owner, farmer, buyer, other;

  const CROP = {
    name:        "Wheat",
    cropType:    "Grain",
    quantity:    500_000,      // 500 kg in grams
    pricePerKg:  ethers.parseEther("0.004"),
    harvestDate: Math.floor(Date.now() / 1000),
    location:    "Punjab, PK",
    ipfsHash:    "QmTestHash123",
    cert:        1,             // Organic
  };

  beforeEach(async () => {
    [owner, farmer, buyer, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("AgriChain");
    agrichain = await Factory.deploy();
    await agrichain.waitForDeployment();
  });

  // ── Farmer Verification ───────────────────────────────────────────────────
  describe("Farmer verification", () => {
    it("owner can verify a farmer", async () => {
      await agrichain.verifyFarmer(farmer.address);
      expect(await agrichain.verifiedFarmers(farmer.address)).to.be.true;
    });

    it("non-owner cannot verify a farmer", async () => {
      await expect(
        agrichain.connect(other).verifyFarmer(farmer.address)
      ).to.be.reverted;
    });
  });

  // ── Crop Registration ─────────────────────────────────────────────────────
  describe("Crop registration", () => {
    beforeEach(async () => {
      await agrichain.verifyFarmer(farmer.address);
    });

    it("verified farmer can register a crop", async () => {
      const tx = await agrichain.connect(farmer).registerCrop(...Object.values(CROP));
      await expect(tx).to.emit(agrichain, "CropRegistered").withArgs(1, farmer.address, "Wheat");
      expect(await agrichain.totalCrops()).to.equal(1);
    });

    it("unverified farmer cannot register", async () => {
      await expect(
        agrichain.connect(other).registerCrop(...Object.values(CROP))
      ).to.be.revertedWith("AgriChain: not a verified farmer");
    });

    it("mints an ERC-721 token to the farmer", async () => {
      await agrichain.connect(farmer).registerCrop(...Object.values(CROP));
      expect(await agrichain.ownerOf(1)).to.equal(farmer.address);
    });
  });

  // ── Purchase ──────────────────────────────────────────────────────────────
  describe("Purchasing a crop", () => {
    let cropPrice;

    beforeEach(async () => {
      await agrichain.verifyFarmer(farmer.address);
      await agrichain.connect(farmer).registerCrop(...Object.values(CROP));
      cropPrice = await agrichain.getCropPrice(1);
    });

    it("buyer can purchase a listed crop", async () => {
      const tx = await agrichain.connect(buyer).purchaseCrop(1, { value: cropPrice });
      await expect(tx).to.emit(agrichain, "CropPurchased").withArgs(1, buyer.address, cropPrice);
    });

    it("NFT ownership transfers to buyer", async () => {
      await agrichain.connect(buyer).purchaseCrop(1, { value: cropPrice });
      expect(await agrichain.ownerOf(1)).to.equal(buyer.address);
    });

    it("farmer cannot buy their own crop", async () => {
      await expect(
        agrichain.connect(farmer).purchaseCrop(1, { value: cropPrice })
      ).to.be.revertedWith("AgriChain: farmer cannot buy own crop");
    });

    it("reverts if insufficient ETH sent", async () => {
      await expect(
        agrichain.connect(buyer).purchaseCrop(1, { value: ethers.parseEther("0.001") })
      ).to.be.revertedWith("AgriChain: insufficient ETH");
    });
  });

  // ── Supply Chain ──────────────────────────────────────────────────────────
  describe("Supply chain", () => {
    beforeEach(async () => {
      await agrichain.verifyFarmer(farmer.address);
      await agrichain.connect(farmer).registerCrop(...Object.values(CROP));
      const price = await agrichain.getCropPrice(1);
      await agrichain.connect(buyer).purchaseCrop(1, { value: price });
    });

    it("farmer can add a shipment event", async () => {
      const tx = await agrichain.connect(farmer).addShipmentEvent(1, "Packed", "Lahore");
      await expect(tx).to.emit(agrichain, "ShipmentUpdated").withArgs(1, "Packed", "Lahore");
    });

    it("supply chain log is retrievable", async () => {
      await agrichain.connect(farmer).addShipmentEvent(1, "Packed",   "Lahore");
      await agrichain.connect(farmer).addShipmentEvent(1, "Shipped",  "Karachi Port");
      const log = await agrichain.getSupplyChain(1);
      expect(log.length).to.equal(2);
      expect(log[0].eventType).to.equal("Packed");
      expect(log[1].location).to.equal("Karachi Port");
    });

    it("buyer can confirm delivery", async () => {
      await agrichain.connect(farmer).addShipmentEvent(1, "Shipped", "Karachi Port");
      const tx = await agrichain.connect(buyer).confirmDelivery(1);
      await expect(tx).to.emit(agrichain, "DeliveryConfirmed").withArgs(1, buyer.address);
    });

    it("non-buyer cannot confirm delivery", async () => {
      await agrichain.connect(farmer).addShipmentEvent(1, "Shipped", "Karachi Port");
      await expect(
        agrichain.connect(other).confirmDelivery(1)
      ).to.be.revertedWith("AgriChain: only buyer can confirm");
    });
  });

  // ── Platform Fee ──────────────────────────────────────────────────────────
  describe("Platform fee", () => {
    it("owner can update platform fee", async () => {
      await agrichain.setPlatformFee(300); // 3%
      expect(await agrichain.platformFee()).to.equal(300);
    });

    it("fee cannot exceed 5%", async () => {
      await expect(agrichain.setPlatformFee(600)).to.be.revertedWith("AgriChain: max 5%");
    });
  });
});
