const {DECIMAL, INITIAL_ANSWER, developmentChains} = require("../helper-hardhat-config")

module.exports = async({getNamedAccounts, deployments}) => {
    console.log(`this is a deploy function`)
    if(developmentChains.includes(network.name)){
        // const firstAccount = (await getNamedAccounts()).firstAccount
        //使用花括号的意思是有多个属性，我们要使用的是这个，如果不用花括号，可以使用上面的写法
        const {firstAccount} = await getNamedAccounts() 
        console.log(`first account is ${firstAccount}`)
        const {deploy} = await deployments
        await deploy("MockV3Aggregator", {
            from: firstAccount,
            args: [DECIMAL, INITIAL_ANSWER],
            log: true
        })
    } else {
        console.log("enviroment is not local, mock contract deployment is skepped..")
    }
}

module.exports.tags = ["all", "mock"]