const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("BasicNft Tests", () => {
          let basicNft, deployer

          beforeEach(async () => {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(["basicnft"])
              basicNft = await ethers.getContract("BasicNft")
          })

          describe("constructor", () => {
              it("check token counter", async () => {
                  const name = await basicNft.name()
                  const symbol = await basicNft.symbol()
                  const tokenCounter = await basicNft.getTokenCounter()
                  assert.equal(name, "Dogie")
                  assert.equal(symbol, "DOG")
                  assert("0", tokenCounter.toString())
              })
          })

          describe("mint nft", () => {
              const TOKEN_URI =
                  "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json"
              it("emit Dog Minted", async () => {
                  await expect(basicNft.mintNft()).to.emit(basicNft, "DogMinted")
                  const tokenCounter = await basicNft.getTokenCounter()
                  const tokenURI = await basicNft.tokenURI(tokenCounter - 1)
                  const deployerAddress = deployer.address
                  const deployerBalance = await basicNft.balanceOf(deployerAddress)
                  // số token được lưu trong 1 mapping _balances
                  // thay đổi khi mint, burn, transfer, __unsafe_increaseBalance
                  const owner = await basicNft.ownerOf("0")

                  assert("1", tokenCounter.toString())
                  assert(TOKEN_URI, tokenURI)
                  assert(deployerBalance, "1")
                  assert(owner, deployerAddress)
              })
          })
      })
