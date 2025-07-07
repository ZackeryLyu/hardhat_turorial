// import ethers.js
// create main function
// execute main function

const { ethers } = require("hardhat")

async function main() {
    // create factory
    const fundMeFactory = await ethers.getContractFactory("FundMe")
    console.log("contract deploying")
    // deploy contract from factory
    const fundMe = await fundMeFactory.deploy(300)
    await fundMe.waitForDeployment()
    console.log(`contract has been deployed successfully, contract address is ${fundMe.target}`)

    if(hre.network.config.chainId == 11155111 && process.env.ETHERSCAN_API_KEY) {
        console.log("waiting for 5 confirmations")
        await fundMe.deploymentTransaction().wait(5);
        await verifyFundMe(fundMe.target, [300])
    }else{
        console.log("verification skipped..")
    }

    // init 2 accounts
    const [firstAccount, secondAccount] = await ethers.getSigners()

    // fund contract with first account
    const fundTx = await fundMe.fund({value: ethers.parseEther("0.005")})
    await fundTx.wait()
    // check balance of contract
    const balanceOfContract = await ethers.provider.getBalance(fundMe.target)
    console.log(`Balance of fundme contract is: ${balanceOfContract}`)

    // fund contract with second account
    const fundTxWithSecondAccount = await fundMe.connect(secondAccount).fund({value: ethers.parseEther("0.005")})
    await fundTxWithSecondAccount.wait()

    // check balance of contract
    const balanceOfContractAfterSecondFund = await ethers.provider.getBalance(fundMe.target)
    console.log(`Balance of fundme contract is: ${balanceOfContractAfterSecondFund}`)

    // check mapping funderToAmount
    const firstAccountBalanceInAtract = await fundMe.funderToAmount(firstAccount)
    const secondAccountBalanceInAtract = await fundMe.funderToAmount(secondAccount)
    console.log(`Balance of first account ${firstAccount.address} is ${firstAccountBalanceInAtract}`)
    console.log(`Balance of second account ${secondAccount.address} is ${secondAccountBalanceInAtract}`)
    
}

async function verifyFundMe(fundMeAddress, inputArgs) {
    await hre.run("verify:verify", {
        address: fundMeAddress,
        constructorArguments: inputArgs,
    });
}

main().then().catch((error) => {
    console.error(error)
    process.exit(1)
})