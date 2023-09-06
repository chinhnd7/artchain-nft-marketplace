// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error RandomIpfsNft__RangeOutOfBounds();
error RandomIpfsNft__NeedMoreETHSent();
error RandomIpfsNft__TransferFailed();

contract RandomIpfsNft is VRFConsumerBaseV2, ERC721URIStorage, Ownable {

    // when we mint and NFT, we will trigger a Chainlink VRF call to get us a random number
    // using that number, we will get a random NFT
    // Pug, Shiba Inu, St. Bernard
    // Pug: super rare (siêu hiếm)
    // Shiba Inu: sort of rare (hiếm)
    // St. Bernard: common (thường)

    // users have to pay to mint an NFT
    // the owner of the contract can withdraw the ETH

    // Type Declaration
    enum Rank {
        NOVICE,
        ADEPT,
        LOREKEEPER,
        ENIGMA,
        SERAPH
    }

    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subcriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 2;

    // VRF Helpers
    mapping(uint256 => address) public s_requestIdToSender;

    // NFT Variables
    uint256 public s_tokenCounter;
    uint256 internal constant MAX_CHANCE_VALUE = 100;
    mapping (uint256 => string[]) internal s_nftTokenURIs;
    uint256 internal immutable i_mintFree;

    // Events
    event NftRequested(uint256 indexed requestId, address requester);
    event NftMinted(Rank nftRank, address minter);

    constructor(
        address vrfCoordinatorV2,
        uint64 subcriptionId,
        bytes32 gasLane,
        uint32 callbackGasLimit,
        string[][5] memory nftTokenURIs,
        uint256 mintFee
        ) VRFConsumerBaseV2(vrfCoordinatorV2) ERC721("Random IPFS NFT", "RIN"){
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_subcriptionId = subcriptionId;
        i_gasLane = gasLane;
        i_callbackGasLimit = callbackGasLimit;
        s_nftTokenURIs[0] = nftTokenURIs[0];
        s_nftTokenURIs[1] = nftTokenURIs[1];
        s_nftTokenURIs[2] = nftTokenURIs[2];
        s_nftTokenURIs[3] = nftTokenURIs[3];
        s_nftTokenURIs[4] = nftTokenURIs[4];
        i_mintFree = mintFee;
        s_tokenCounter = 0;
    }

    function requestNft() public payable returns (uint256 requestId) {
        if (msg.value < i_mintFree) {
            revert RandomIpfsNft__NeedMoreETHSent();
        }
        requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subcriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        s_requestIdToSender[requestId] = msg.sender;
        emit NftRequested(requestId, msg.sender);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) 
    internal 
    override
    {
        address nftOwner = s_requestIdToSender[requestId];
        uint256 newTokenId = s_tokenCounter; // 1,2,3...
        s_tokenCounter = s_tokenCounter + 1;

        // What does this token look like?
        uint256 moddedRng = randomWords[0] % MAX_CHANCE_VALUE;

        Rank nftRank = getRankFromModdedRng(moddedRng);

        uint256 nftIndex = randomWords[1] % (s_nftTokenURIs[uint256(nftRank)].length);
        
        _safeMint(nftOwner, newTokenId);
        _setTokenURI(newTokenId, /* that rank's tokenURI */s_nftTokenURIs[uint256(nftRank)][nftIndex]);
        emit NftMinted(nftRank, nftOwner);
    }

    // extend Ownable contract
    function withDraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if(!success) {
            revert RandomIpfsNft__TransferFailed();
        }
    }

    function getRankFromModdedRng(uint256 moddedRng) public pure returns (Rank) {
        uint256 cumulativeSum = 0;
        uint256[5] memory chanceArray = getChanceArray();
        // moddedRng = 25
        // i = 2
        // cumulativeSum = 14
        // => Rank(2) : LOREKEEPER
        for(uint256 i=0; i < chanceArray.length; i++) {
            if (moddedRng >= cumulativeSum && moddedRng < chanceArray[i]) {
                return Rank(chanceArray.length - 1 - i);
            }
            cumulativeSum = chanceArray[i];
        }
        revert RandomIpfsNft__RangeOutOfBounds();
    }

    function getChanceArray() public pure returns(uint256[5] memory) {
        return [4, 14, 29, 49, MAX_CHANCE_VALUE];
        // SERAPH: 4% [0-3]
        // ENIGMA: 10% [4-13]
        // LOREKEEPER: 15% [14-28]
        // ADEPT: 20% [29-48]
        // NOVICE: 51% [49-99]
    }

    function getMintFee() public view returns(uint256) {
        return i_mintFree;
    }

    function getNftTokenUris(uint256 rankNumber, uint256 index) public view returns (string memory) {
        return s_nftTokenURIs[rankNumber][index];
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }
}