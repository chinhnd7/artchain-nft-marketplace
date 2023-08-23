/*
 * @chinhnd7
 */
const { run } = require("hardhat")

const verify = async function verify(contractAddress, args) {
    console.log("Verifying contract...")
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        })
    } catch (e) {
        if (e.message.toLowerCase().includes("already verifyed")) {
            console.log("Already Verifyed!")
        } else {
            console.log(e)
        }
    }
}

module.exports = { verify }
