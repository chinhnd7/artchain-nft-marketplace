const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { SignerWithAddress } = ethers

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Nft Marketplace Tests", () => {
          let nftMarketplace, nftMarketplaceContract, basicNft, basicNftContract, deployer, user
          const PRICE = ethers.utils.parseEther("0.1")
          const TOKEN_ID = 0
          beforeEach(async () => {
              //   accounts = await ethers.getSigners()
              //   deployer = accounts[0]
              //   user = accounts[1]
              // Khi sử dụng cách này deployer và user không dùng được trong phương thức connect
              deployer = (await getNamedAccounts()).deployer
              user = (await getNamedAccounts()).user

              await deployments.fixture(["all"])
              nftMarketplaceContract = await ethers.getContract("NftMarketplace")
              nftMarketplace = nftMarketplaceContract.connect(ethers.provider.getSigner(deployer))
              basicNftContract = await ethers.getContract("BasicNft")
              basicNft = basicNftContract.connect(ethers.provider.getSigner(deployer))
              await basicNft.mintNft()
              await basicNft.approve(nftMarketplace.address, TOKEN_ID)
          })

          it("lists and can be bought", async () => {
              await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
              nftMarketplace = nftMarketplaceContract.connect(ethers.provider.getSigner(user))
              await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                  value: PRICE,
              })
              const newOwner = await basicNft.ownerOf(TOKEN_ID)
              const deployerProceeds = await nftMarketplace.getProceeds(deployer)
              assert(newOwner.toString() == user)
              assert(deployerProceeds.toString() == PRICE.toString())
          })
      })
