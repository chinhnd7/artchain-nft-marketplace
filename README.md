1. Create a decentralized NFT Marketplace
    1. `listItem`: List NFTs on the marketplace
    2. `buyItem`: Buy the NFTs
    3. `cancelItem`: Cancel a listing
    4. `updateListing`: Update Price
    5. `withdrawProceeds`: Withdraw payment for my bought NFTs

# Overview
## Mapping vs. Array in Solidity
https://www.devtwins.com/blog/understanding-mapping-vs-array-in-solidity

## Re-Entrancy
https://solidity-by-example.org/hacks/re-entrancy/
In `buyItem` function (NftMarketplace.sol file), 
- change all state first, and then we transfer NFT or token...
- if we send NFT first, this is actually a huge security vulnerability (lỗ hổng bảo mật lớn)
In sublesson, we learn about re-entrancy attack.

Rekt is a leaderboard which keeps track of many of top attacks that have ever happened in the defi space.

##