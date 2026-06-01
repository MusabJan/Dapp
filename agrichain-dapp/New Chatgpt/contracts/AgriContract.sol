// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgriContract {

    struct Crop {
        uint id;
        string name;
        string farmer;
        uint price;
        bool sold;
    }

    uint public cropCount;

    mapping(uint => Crop) public crops;

    event CropListed(uint id, string name, uint price);
    event CropSold(uint id, string buyer);

    function listCrop(string memory _name, string memory _farmer, uint _price) public {
        cropCount++;

        crops[cropCount] = Crop(
            cropCount,
            _name,
            _farmer,
            _price,
            false
        );

        emit CropListed(cropCount, _name, _price);
    }

    function buyCrop(uint _id, string memory _buyer) public payable {
        Crop storage crop = crops[_id];

        require(!crop.sold, "Already sold");
        require(msg.value >= crop.price, "Not enough ETH");

        crop.sold = true;

        emit CropSold(_id, _buyer);
    }

    function getCrop(uint _id) public view returns (
        uint, string memory, string memory, uint, bool
    ) {
        Crop memory c = crops[_id];
        return (c.id, c.name, c.farmer, c.price, c.sold);
    }
}