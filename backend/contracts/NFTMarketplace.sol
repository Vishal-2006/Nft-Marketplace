// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract NFTMarketplace is ERC721URIStorage, Ownable {
    uint256 private _tokenIds;
    uint256 private _itemsSold;
    uint256 public listingPrice = 0.0000005 ether; // Keeping it free for testing

    constructor() ERC721("MetaMarket", "MMT") Ownable(msg.sender) {}

    struct MarketItem {
        uint256 tokenId;
        uint256 price;
        address seller;
        address owner;
        bool sold;
    }

    mapping(uint256 => MarketItem) private idToMarketItem;

    event MarketItemCreated(
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold
    );

    /* 1. MINT & LIST NFT */
    function createToken(string memory tokenURI, uint256 price) external payable returns (uint256) {
        require(price > 0, "Price must be at least 1 wei");
        require(msg.value == listingPrice, "Price must be equal to listing price");

        unchecked {
            _tokenIds++;
        }
        uint256 newTokenId = _tokenIds;

        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        idToMarketItem[newTokenId] = MarketItem({
            tokenId: newTokenId,
            price: price,
            seller: msg.sender,
            owner: address(this),
            sold: false
        });

        _transfer(msg.sender, address(this), newTokenId);

        emit MarketItemCreated(
            newTokenId,
            msg.sender,
            address(this),
            price,
            false
        );
        
        return newTokenId;
    }

    /* 2. BUY NFT */
    function createMarketSale(uint256 tokenId) external payable {
        MarketItem storage item = idToMarketItem[tokenId];
        uint256 price = item.price;
        address seller = item.seller;

        require(msg.value == price, "Please submit the asking price");
        require(!item.sold, "Item already sold");

        item.sold = true;
        item.seller = address(0); // Clear seller
        item.owner = msg.sender;  // Update owner in struct
        
        unchecked {
            _itemsSold++;
        }

        _transfer(address(this), msg.sender, tokenId);
        
        // Transfer payment to seller using safe call
        Address.sendValue(payable(seller), msg.value);
        // Transfer listing fee to contract owner
        Address.sendValue(payable(owner()), listingPrice);
    }

    /* 3. RESELL NFT (New Feature) */
    function resellToken(uint256 tokenId, uint256 price) public payable {
        require(ownerOf(tokenId) == msg.sender, "Only item owner can perform this operation");
        require(msg.value == listingPrice, "Price must be equal to listing price");

        idToMarketItem[tokenId].sold = false;
        idToMarketItem[tokenId].price = price;
        idToMarketItem[tokenId].seller = msg.sender;
        idToMarketItem[tokenId].owner = address(this);
        
        unchecked {
            _itemsSold--; 
        }

        _transfer(msg.sender, address(this), tokenId);
    }

    /* 4. FETCH UNSOLD ITEMS (Explorer) */
    function fetchMarketItems() external view returns (MarketItem[] memory items) {
        uint256 totalItems = _tokenIds;
        uint256 unsoldCount = totalItems - _itemsSold;
        uint256 currentIndex = 0;

        items = new MarketItem[](unsoldCount);

        for (uint256 i = 1; i <= totalItems;) {
            if (idToMarketItem[i].sold == false) {
                uint256 currentId = idToMarketItem[i].tokenId;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                unchecked { currentIndex++; }
            }
            unchecked { i++; }
        }
    }
    
    /* 5. FETCH MY NFTS (Dashboard) */
    function fetchMyNFTs() external view returns (MarketItem[] memory items) {
        uint256 totalItems = _tokenIds;
        uint256 itemCount = 0;
        uint256 currentIndex = 0;

        // First loop: count items to create array with correct size
        for (uint256 i = 1; i <= totalItems;) {
            if (ownerOf(i) == msg.sender) {
                unchecked { itemCount++; }
            }
            unchecked { i++; }
        }

        items = new MarketItem[](itemCount);

        // Second loop: populate array
        for (uint256 i = 1; i <= totalItems;) {
            if (ownerOf(i) == msg.sender) {
                uint256 currentId = idToMarketItem[i].tokenId;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                unchecked { currentIndex++; }
            }
            unchecked { i++; }
        }
    }

    function updateListingPrice(uint256 _listingPrice) external onlyOwner {
        listingPrice = _listingPrice;
    }
}   