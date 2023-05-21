/*
* @chinhnd7
*/
const {run} = require("hardhat")

const verify = async function verify(contractAddress, args) {
    console.log("Verifying contract...")
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArgument: args,
        })
    } catch (e) {
        if (e.message.toLowerCase().includes("already verifyed")) {
            console.log("Already Verifed!")
        } else {
            console.log(e)
        }
    }
}

module.exports = {verify}