const { assert, expect } = require("chai")
const { deployments, getNamedAccounts, ethers } = require("hardhat")
const helpers = require("@nomicfoundation/hardhat-network-helpers")
const {developmentChains} = require("../../helper-hardhat-config")

developmentChains.includes(network.name) 
? describe.skip 
: describe("test fundme contract", async function() {
    let fundMe
    let firstAccount
    beforeEach(async function () {
        await deployments.fixture(["all"])
        firstAccount = (await getNamedAccounts()).firstAccount
        const fundMeDeployment = await deployments.get("FundMe")
        fundMe = await ethers.getContractAt("FundMe", fundMeDeployment.address)
    })

    // test fund and getfund successfully
    // it("fund and getfund successfully", 
    //     async function() {
    //         // make sure target reached
    //         await fundMe.fund({value: ethers.parseEther("0.11")})
    //         // make sure window closed
    //         await new Promise(resolve => setTimeout(resolve, 181 * 1000))
    //         // make sure we can get receipt
    //         const getFundTx = await fundMe.getFund()
    //         const getFundReceipt = await getFundTx.wait();
    //         expect(getFundReceipt)
    //             .to.emit(fundMe, "FundWithDrawByOwner")
    //             .withArgs(ethers.parseEther("0.11"))
    //     }
    // )

    // test fund and refund successfully
    it("fund and refund successfully", 
        async function() {
            // make sure target reached
            await fundMe.fund({value: ethers.parseEther("0.0005")})
            // make sure window closed
            await new Promise(resolve => setTimeout(resolve, 181 * 1000))
            // make sure we can get receipt
            const reFundTx = await fundMe.reFund()
            const reFundReceipt = await reFundTx.wait();
            expect(reFundReceipt)
                .to.emit(fundMe, "ReFundByFunder")
                .withArgs(firstAccount, ethers.parseEther("0.0005"))
        }
    )

})

