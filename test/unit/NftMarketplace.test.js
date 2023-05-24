const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

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

          describe("listItem", () => {
              it("emits an event after listing an item", async () => {
                  expect(await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)).to.emit(
                      "ItemListed"
                  )
              })

              it("price must be above zero", async () => {
                  const zeroPrice = ethers.utils.parseEther("0")
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, zeroPrice)
                  ).to.be.revertedWith("NftMarketplace__PriceMustBeAboveZero")
              })

              it("already listed", async () => {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)

                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NftMarketplace__AlreadyListed")
              })

              it("not owner", async () => {
                  nftMarketplace = nftMarketplaceContract.connect(ethers.provider.getSigner(user))

                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NftMarketplace__NotOwner")
              })

              it("not approved for marketplace", async () => {
                  await basicNft.approve(ethers.constants.AddressZero, TOKEN_ID)

                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NftMarketplace__NotApprovedForMarketplace")
              })

              it("check seller and price after listing nft", async () => {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
                  assert(listing.price, PRICE)
                  assert(listing.seller, deployer.address)
              })
          })
      })

// const { assert, expect } = require("chai")
// const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
// const { developmentChains } = require("../../helper-hardhat-config")

// !developmentChains.includes(network.name)
//     ? describe.skip
//     : describe("Nft Marketplace Tests", () => {
//           let nftMarketplace, basicNft, deployer, user
//           const PRICE = ethers.utils.parseEther("0.1")
//           const TOKEN_ID = 0
//           beforeEach(async () => {
//               //   accounts = await ethers.getSigners()
//               //   deployer = accounts[0]
//               //   user = accounts[1]
//               // Khi sử dụng cách này deployer và user không dùng được trong phương thức connect
//               deployer = (await getNamedAccounts()).deployer
//               user = (await getNamedAccounts()).user

//               await deployments.fixture(["all"])
//               nftMarketplace = await ethers.getContract("NftMarketplace")
//               basicNft = await ethers.getContract("BasicNft")
//               await basicNft.mintNft()
//               await basicNft.approve(nftMarketplace.address, TOKEN_ID)
//           })

//           it("lists and can be bought", async () => {
//               await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
//               nftMarketplaceConnectedUser = nftMarketplace.connect(ethers.provider.getSigner(user))
//               await nftMarketplaceConnectedUser.buyItem(basicNft.address, TOKEN_ID, {
//                   value: PRICE,
//               })
//               const newOwner = await basicNft.ownerOf(TOKEN_ID)
//               const deployerProceeds = await nftMarketplace.getProceeds(deployer)
//               assert(newOwner.toString() == user)
//               assert(deployerProceeds.toString() == PRICE.toString())
//           })
//       })
