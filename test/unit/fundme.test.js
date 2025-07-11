const { assert, expect } = require("chai")
const { deployments, getNamedAccounts, ethers, network } = require("hardhat")
const helpers = require("@nomicfoundation/hardhat-network-helpers")
const {developmentChains} = require("../../helper-hardhat-config")

!developmentChains.includes(network.name) 
? describe.skip 
: describe("test fundme contract", async function() {
    let fundMe
    let firstAccount
    let secondAccount
    let mockV3Aggregator
    beforeEach(async function () {
        await deployments.fixture(["all"])
        firstAccount = (await getNamedAccounts()).firstAccount
        secondAccount = (await getNamedAccounts()).secondAccount
        const fundMeDeployment = await deployments.get("FundMe")
        mockV3Aggregator = await deployments.get("MockV3Aggregator")
        fundMe = await ethers.getContractAt("FundMe", fundMeDeployment.address)
    })

    it("test if the owner is msg.sender", async function() {
        // const [firstAccount] = await ethers.getSigners()
        // const fundMeFactory = await ethers.getContractFactory("FundMe")
        // const fundMe = await fundMeFactory.deploy(300)
        await fundMe.waitForDeployment()
        assert.equal((await fundMe.owner()),firstAccount)
    })

    it("test if the datafeed is assigned correctly", async function() {
        // const fundMeFactory = await ethers.getContractFactory("FundMe")
        // const fundMe = await fundMeFactory.deploy(300)
        await fundMe.waitForDeployment()
        assert.equal((await fundMe.dataFeed()), mockV3Aggregator.address)
    })



    // fund, getFund, refund
    // unit test for fund
    // window open, value greater then minimum value, funder balance
    it("window closed, value grater than minimum, fund failed",  
        async function() {
            // make sure the window is closed
            await helpers.time.increase(400)
            await helpers.mine()
            expect(fundMe.fund({value: ethers.parseEther("0.1")}))
                .to.be.revertedWith("window is closed")
            const balance = await fundMe.funderToAmount(firstAccount)
            console.log(`the balance of address ${firstAccount} is ${balance}`)
        }
    )

    it("window is open, value is less than minimum, fund failed",
        async function () {
            expect(fundMe.fund({value: ethers.parseEther("0.001")}))
                .to.be.revertedWith("send more ETH")
        }
    )

    it("window is open, value grater than minimum, fund success",
        async function () {
            await fundMe.fund({value: ethers.parseEther("0.11")})
            const balance = await fundMe.funderToAmount(firstAccount)
            console.log(`the balance of address ${firstAccount} is ${balance}`)
            expect(balance).to.equal(ethers.parseEther("0.11"))
        }
    )

    // unit test for getFund
    // window closed, owner, grater than target
    it("window open, owner, grater than target",
        async function () {
            await fundMe.fund({value: ethers.parseEther("0.11")})
            expect(fundMe.getFund())
                .to.be.revertedWith("window is not closed")
        }
    )

    it("window closed, not owner, grater than target",
        async function () {
            await fundMe.fund({value: ethers.parseEther("0.11")})
            await helpers.time.increase(400)
            await helpers.mine()
            expect(fundMe.connect(secondAccount).getFund())
                .to.be.revertedWith("This function can only be called by owner")
        }
    )

    it("window closed, owner, less than target",
        async function () {
            await fundMe.fund({value: ethers.parseEther("0.1")})
            await helpers.time.increase(400)
            await helpers.mine()
            expect(fundMe.getFund())
                .to.be.revertedWith("target is not reached")
        }
    )

    it("window closed, owner, grater than target, getFund successful",
        async function () {
            await fundMe.fund({value: ethers.parseEther("0.2")})
            await helpers.time.increase(400)
            await helpers.mine()
            expect(fundMe.getFund())
                .to.emit(fundMe, "FundWithDrawByOwner")
                .withArgs(ethers.parseEther("0.2"))
        }
    )

    // unit test for reFund
    // window closed, less than target, mapping(addr)>0
    it("window is open, less than target, mapping(addr)>0", 
        async function() {
            await fundMe.fund({value: ethers.parseEther("0.04")})
            expect(fundMe.reFund())
                .to.be.revertedWith("window is not closed")
        }
    )

    it("window is closed, grater than target, mapping(addr)>0", 
        async function() {
            await fundMe.fund({value: ethers.parseEther("0.14")})
            await helpers.time.increase(400)
            await helpers.mine()
            expect(fundMe.reFund())
                .to.be.revertedWith("target is reached")
        }
    )

    it("window is closed, less than target, mapping(addr)==0", 
        async function() {
            await fundMe.fund({value: ethers.parseEther("0.04")})
            await helpers.time.increase(400)
            await helpers.mine()
            expect(fundMe.connect(secondAccount).reFund())
                .to.be.revertedWith("No Ether to refund")
        }
    )

    it("window is closed, less than target, mapping(addr)>0, refund success", 
        async function() {
            await fundMe.fund({value: ethers.parseEther("0.04")})
            await helpers.time.increase(400)
            await helpers.mine()
            expect(fundMe.reFund())
                .to.emit(fundMe, "ReFundByFunder")
                .withArgs(firstAccount,ethers.parseEther("0.04"))
        }
    )

})

