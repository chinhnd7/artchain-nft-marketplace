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

          it("lists and can be bought", async () => {})

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
          describe("buyItem", () => {
              it("buy an item successful", async () => {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  nftMarketplace = nftMarketplaceContract.connect(ethers.provider.getSigner(user))
                  expect(
                      await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                          value: PRICE,
                      })
                  ).to.emit("ItemBought")
                  const newOwner = await basicNft.ownerOf(TOKEN_ID)
                  const deployerProceeds = await nftMarketplace.getProceeds(deployer)
                  assert(newOwner.toString() == user)
                  assert(deployerProceeds.toString() == PRICE.toString())
              })

              it("price not met", async () => {
                  const zeroPrice = ethers.utils.parseEther("0")
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await expect(
                      nftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                          value: zeroPrice,
                      })
                  ).to.be.revertedWith("NftMarketplace__PriceNotMet")
              })

              it("not listed", async () => {
                  await expect(
                      nftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                          value: PRICE,
                      })
                  ).to.be.revertedWith("NftMarketplace__NotListed")
              })
          })

          describe("cancelListing", () => {
              it("not owner", async () => {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  nftMarketplace = nftMarketplaceContract.connect(ethers.provider.getSigner(user))
                  await expect(
                      nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NftMarketplace__NotOwner")
              })

              it("not listed", async () => {
                  await expect(
                      nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NftMarketplace__NotListed")
              })

              it("emit item canceled", async () => {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)

                  expect(await nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)).to.emit(
                      "NftMarketplace__ItemCanceled"
                  )
                  const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
                  assert(listing.price.toString(), "0")
              })
          })

          describe("updateListing", () => {
              const newPrice = ethers.utils.parseEther("0.2")

              it("not owner", async () => {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  nftMarketplace = nftMarketplaceContract.connect(ethers.provider.getSigner(user))
                  await expect(
                      nftMarketplace.updateListing(basicNft.address, TOKEN_ID, newPrice)
                  ).to.be.revertedWith("NftMarketplace__NotOwner")
              })

              it("not listed", async () => {
                  await expect(
                      nftMarketplace.updateListing(basicNft.address, TOKEN_ID, newPrice)
                  ).to.be.revertedWith("NftMarketplace__NotListed")
              })

              it("emit item listed", async () => {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  expect(
                      await nftMarketplace.updateListing(basicNft.address, TOKEN_ID, newPrice)
                  ).to.emit("NftMarketplace__ItemListed")
                  const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
                  assert(listing.price, newPrice)
              })
          })
          describe("withdrawProceeds", () => {
              it("no proceeds", async () => {
                  await expect(nftMarketplace.withdrawProceeds()).to.be.revertedWith(
                      "NftMarketplace__NoProceeds"
                  )
              })

              it("withdraw proceeds successfully", async () => {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  nftMarketplace = nftMarketplaceContract.connect(ethers.provider.getSigner(user))
                  await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                      value: PRICE,
                  })
                  nftMarketplace = nftMarketplaceContract.connect(
                      ethers.provider.getSigner(deployer)
                  )
                  const deployerProceedsBefore = await nftMarketplace.getProceeds(deployer) // 0.1 ETH Big Number
                  //   console.log(deployerProceedsBefore.toString()) // 100000000000000000 (WEI)
                  const deployerBalanceBefore = await ethers.provider
                      .getSigner(deployer)
                      .getBalance()

                  const txResponse = await nftMarketplace.withdrawProceeds()
                  const txReceipt = await txResponse.wait(1)

                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const deployerBalanceAfter = await ethers.provider
                      .getSigner(deployer)
                      .getBalance()

                  console.log(deployerBalanceAfter.toString())
                  assert(
                      deployerBalanceAfter.add(gasCost),
                      deployerBalanceBefore.add(deployerProceedsBefore)
                  )
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
