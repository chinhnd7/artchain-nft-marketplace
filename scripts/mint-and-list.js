const { ethers } = require("hardhat")

const PRICE = ethers.parseEther("0.05") // for listing on marketplace

async function mintAndList() {
    const nftMarketplace = await ethers.getContract("NftMarketplace")

    const {deployer} = await getNamedAccounts()

    // Random IPFS NFT
    const randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer)
    const mintFee = await randomIpfsNft.getMintFee()
    const randomIpfsNftMintTx = await randomIpfsNft.requestNft({ value: mintFee.toString() })
    const randomIpfsNftMintTxReceipt = await randomIpfsNftMintTx.wait(1)
    const tokenCounter = await randomIpfsNft.getTokenCounter()
    // Need to listen for response
    await new Promise(async (resolve, reject) => {
        setTimeout(() => reject("Timeout: 'NFTMinted' event did not fire"), 300000) // 5 minute timeout time
        // setup listener for our event
        randomIpfsNft.once("NftMinted", async () => {
            console.log(`Random IPFS NFT index ${tokenCounter.toString()} tokenURI: ${await randomIpfsNft.tokenURI(tokenCounter.toString())}`)
            resolve()
        })
    })

    const tokenId = tokenCounter

    console.log("Approving Nft...")
    const approvalTx = await randomIpfsNft.approve(nftMarketplace.getAddress(), tokenId)
    await approvalTx.wait(1)

    console.log("Listing NFT...")
    const tx = await nftMarketplace.listItem(randomIpfsNft.getAddress(), tokenId, PRICE)
    await tx.wait(1)
    console.log("Listed!")
}

mintAndList()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
