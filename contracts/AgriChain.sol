// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/// @title  AgriChain — Decentralized Agriculture DApp
/// @author AgriChain Team
/// @notice Crop registration, marketplace & supply chain tracking on Ethereum
contract AgriChain is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // ─── Enums ───────────────────────────────────────────────────────────────

    enum CropStatus    { Registered, Listed, Sold, InTransit, Delivered }
    enum Certification { Standard, Organic, NonGMO, FairTrade }

    // ─── Structs ─────────────────────────────────────────────────────────────

    struct Crop {
        uint256       id;
        string        name;
        string        cropType;
        uint256       quantity;      // in grams
        uint256       pricePerKg;   // in wei
        uint256       harvestDate;  // unix timestamp
        string        location;
        string        ipfsHash;     // IPFS CID for metadata/photo
        Certification cert;
        CropStatus    status;
        address       farmer;
        address       buyer;
    }

    struct ShipmentEvent {
        string  eventType;
        string  location;
        uint256 timestamp;
        address actor;
    }

    // ─── State ───────────────────────────────────────────────────────────────

    mapping(uint256 => Crop)             public crops;
    mapping(uint256 => ShipmentEvent[])  public supplyChain;
    mapping(address => bool)             public verifiedFarmers;
    mapping(address => uint256[])        public farmerCrops;

    uint256 public platformFee = 200; // 2% in basis points
    uint256 public totalVolume;       // cumulative ETH traded (in wei)

    // ─── Events ──────────────────────────────────────────────────────────────

    event CropRegistered   (uint256 indexed id, address farmer,  string name);
    event CropPurchased    (uint256 indexed id, address buyer,   uint256 amount);
    event ShipmentUpdated  (uint256 indexed id, string eventType, string location);
    event DeliveryConfirmed(uint256 indexed id, address buyer);
    event FarmerVerified   (address indexed farmer);

    // ─── Modifiers ───────────────────────────────────────────────────────────

    modifier onlyFarmer() {
        require(verifiedFarmers[msg.sender], "AgriChain: not a verified farmer");
        _;
    }

    modifier cropExists(uint256 cropId) {
        require(crops[cropId].farmer != address(0), "AgriChain: crop does not exist");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor() ERC721("AgriChainCrop", "AGRC") Ownable(msg.sender) {}

    // ─── Admin ───────────────────────────────────────────────────────────────

    /// @notice Owner verifies a farmer wallet address
    function verifyFarmer(address farmer) external onlyOwner {
        require(farmer != address(0), "AgriChain: zero address");
        verifiedFarmers[farmer] = true;
        emit FarmerVerified(farmer);
    }

    /// @notice Owner sets platform fee (max 5%)
    function setPlatformFee(uint256 bps) external onlyOwner {
        require(bps <= 500, "AgriChain: max 5%");
        platformFee = bps;
    }

    // ─── Core Functions ──────────────────────────────────────────────────────

    /// @notice Register a new crop batch as an ERC-721 NFT
    /// @param  name        Human-readable crop name (e.g. "Wheat")
    /// @param  cropType    Category (e.g. "Grain", "Vegetable")
    /// @param  quantity    Total amount in grams
    /// @param  pricePerKg  Price per kilogram in wei
    /// @param  harvestDate Unix timestamp of harvest
    /// @param  location    GPS coordinates or region name
    /// @param  ipfsHash    IPFS CID for off-chain metadata/photo
    /// @param  cert        Certification level
    /// @return newId       The minted token ID
    function registerCrop(
        string    calldata name,
        string    calldata cropType,
        uint256            quantity,
        uint256            pricePerKg,
        uint256            harvestDate,
        string    calldata location,
        string    calldata ipfsHash,
        Certification      cert
    ) external onlyFarmer returns (uint256) {
        require(bytes(name).length     > 0, "AgriChain: empty name");
        require(quantity               > 0, "AgriChain: zero quantity");
        require(pricePerKg             > 0, "AgriChain: zero price");

        _tokenIds.increment();
        uint256 newId = _tokenIds.current();
        _safeMint(msg.sender, newId);

        crops[newId] = Crop({
            id:          newId,
            name:        name,
            cropType:    cropType,
            quantity:    quantity,
            pricePerKg:  pricePerKg,
            harvestDate: harvestDate,
            location:    location,
            ipfsHash:    ipfsHash,
            cert:        cert,
            status:      CropStatus.Listed,
            farmer:      msg.sender,
            buyer:       address(0)
        });

        farmerCrops[msg.sender].push(newId);
        emit CropRegistered(newId, msg.sender, name);
        return newId;
    }

    /// @notice Buyer purchases an entire crop batch
    /// @param  cropId  Token ID of the crop to purchase
    function purchaseCrop(uint256 cropId) external payable cropExists(cropId) {
        Crop storage c = crops[cropId];
        require(c.status == CropStatus.Listed, "AgriChain: not available for sale");
        require(msg.sender != c.farmer,        "AgriChain: farmer cannot buy own crop");

        uint256 total = (c.quantity * c.pricePerKg) / 1_000_000; // grams → kg
        require(msg.value >= total, "AgriChain: insufficient ETH");

        uint256 fee       = (total * platformFee) / 10_000;
        uint256 farmerAmt = total - fee;

        c.status = CropStatus.Sold;
        c.buyer  = msg.sender;
        totalVolume += total;

        _transfer(c.farmer, msg.sender, cropId);

        payable(c.farmer).transfer(farmerAmt);
        payable(owner()).transfer(fee);

        // Refund excess ETH
        if (msg.value > total) {
            payable(msg.sender).transfer(msg.value - total);
        }

        emit CropPurchased(cropId, msg.sender, total);
    }

    /// @notice Add a supply chain / logistics event for a crop
    /// @param  cropId     Token ID
    /// @param  eventType  E.g. "Packed", "Shipped", "Customs"
    /// @param  location   Current location of shipment
    function addShipmentEvent(
        uint256        cropId,
        string calldata eventType,
        string calldata location
    ) external cropExists(cropId) {
        Crop storage c = crops[cropId];
        require(
            msg.sender == c.farmer || msg.sender == c.buyer,
            "AgriChain: unauthorized"
        );
        require(
            c.status == CropStatus.Sold || c.status == CropStatus.InTransit,
            "AgriChain: invalid status"
        );

        supplyChain[cropId].push(ShipmentEvent({
            eventType: eventType,
            location:  location,
            timestamp: block.timestamp,
            actor:     msg.sender
        }));

        c.status = CropStatus.InTransit;
        emit ShipmentUpdated(cropId, eventType, location);
    }

    /// @notice Buyer confirms final delivery — closes the trade lifecycle
    function confirmDelivery(uint256 cropId) external cropExists(cropId) {
        Crop storage c = crops[cropId];
        require(msg.sender == c.buyer,           "AgriChain: only buyer can confirm");
        require(c.status == CropStatus.InTransit, "AgriChain: not in transit");

        c.status = CropStatus.Delivered;
        emit DeliveryConfirmed(cropId, msg.sender);
    }

    // ─── View Functions ──────────────────────────────────────────────────────

    /// @notice Returns the full supply chain event log for a crop
    function getSupplyChain(uint256 cropId)
        external view cropExists(cropId)
        returns (ShipmentEvent[] memory)
    {
        return supplyChain[cropId];
    }

    /// @notice Returns all crop token IDs registered by a farmer
    function getFarmerCrops(address farmer)
        external view
        returns (uint256[] memory)
    {
        return farmerCrops[farmer];
    }

    /// @notice Total number of crops registered
    function totalCrops() external view returns (uint256) {
        return _tokenIds.current();
    }

    /// @notice Compute the full purchase price for a crop (in wei)
    function getCropPrice(uint256 cropId)
        external view cropExists(cropId)
        returns (uint256)
    {
        Crop storage c = crops[cropId];
        return (c.quantity * c.pricePerKg) / 1_000_000;
    }
}
