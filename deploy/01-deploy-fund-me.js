const { network } = require("hardhat")
const { developmentChains, networkConfig, LOCK_TIME, CONFIRMATIONS } = require("../helper-hardhat-config")

module.exports = async({getNamedAccounts, deployments}) => {
    console.log(`this is a deploy function`)
    // const firstAccount = (await getNamedAccounts()).firstAccount
    //使用花括号的意思是有多个属性，我们要使用的是这个，如果不用花括号，可以使用上面的写法
    const {firstAccount} = await getNamedAccounts() 
    console.log(`first account is ${firstAccount}`)
    const {deploy} = await deployments

    let dataFeedAddr
    let confirmations
    if(developmentChains.includes(network.name)){
        dataFeedAddr = (await deployments.get("MockV3Aggregator")).address
        confirmations = 0
    } else {
        dataFeedAddr = networkConfig[network.config.chainId].ethUsdDataFeed
        confirmations = CONFIRMATIONS
    }

    const fundMe = await deploy("FundMe", {
        from: firstAccount,
        args: [LOCK_TIME, dataFeedAddr],
        log: true,
        waitConfirmations: confirmations
    })

    // remove deployments directory or add --reset flag if you redeploy contract

    if(hre.network.config.chainId == 11155111 && process.env.ETHERSCAN_API_KEY) {
        // await fundMe.deploymentTransaction().wait(5)
        await hre.run("verify:verify", {
            address: fundMe.address,
            constructorArguments: [LOCK_TIME, dataFeedAddr],
        });
    } else {
        console.log("Network is not sepolia, verification skepped..")
    }
}

module.exports.tags = ["all", "fundme"]