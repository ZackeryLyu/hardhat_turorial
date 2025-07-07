// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

//1.创建一个收款函数
//2.记录投资人并且查看
//3.在锁定期内，达到目标值，生产商可以提款
//4.在锁定期内，没有达到目标值，投资人在锁定期以后退款

contract FundMe{

    mapping (address => uint256) public funderToAmount;
    address owner; // 设置合约的拥有者
    AggregatorV3Interface dataFeed;//定义价格接收器
    uint256 constant TARGET = 10 * 10 ** 18;
    uint256 constant MIMIMUM_VALUE = 3 * 10 ** 18; // 定义最小资金池
    uint256 deploymentTimestamp;
    uint256 lockTime;
    address erc20Addr;
    bool public getFundSuccess = false;

    constructor(uint256 _lockTime) { // 构造函数，参数为地址
        // selolia testnet
        dataFeed = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);
        owner = msg.sender; // 设置合约的拥有者
        deploymentTimestamp = block.timestamp;
        lockTime = _lockTime;
    }

    // 设置一个收款函数
    function fund() public payable {
        require(convertEthToUsd(msg.value) >= MIMIMUM_VALUE, "send more ETH");// 保证资金池不低于最小资金池
        require(block.timestamp < lockTime + deploymentTimestamp, "window is closed");
        funderToAmount[msg.sender] += msg.value;    
    }

    /**
     * Returns the latest answer.
     */
    function getChainlinkDataFeedLatestAnswer() public view returns (int) {
        // prettier-ignore
        (
            /* uint80 roundId */,
            int256 answer,
            /*uint256 startedAt*/,
            /*uint256 updatedAt*/,
            /*uint80 answeredInRound*/
        ) = dataFeed.latestRoundData();
        return answer;
    }

    function convertEthToUsd(uint256 ethAmount) internal view returns (uint256) {
        uint256 ethPrice = uint256(getChainlinkDataFeedLatestAnswer());
        return ethAmount * ethPrice / (10**8);
    }

    function transferOwnerShip(address newOwner) public onlyOwner {
        owner = newOwner;
    }

    function getFund() external windowClosed onlyOwner {
        require(convertEthToUsd(address(this).balance) >= TARGET, "target is not reached");
        // transfer
        // payable(msg.sender).transfer(address(this).balance);

        // send
        // bool success = payable(msg.sender).send(address(this).balance);
        // require(success, "Transmission failed");

        // call
        bool success;
        (success, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(success, "Transmission failed");
        funderToAmount[msg.sender] = 0;
        getFundSuccess = true;
    }

    function refund() external windowClosed {
        require(convertEthToUsd(address(this).balance) < TARGET, "target is reached");
        require(address(this).balance > 0, "No Ether to refund"); // 检查是否有资金池
        require(funderToAmount[msg.sender] > 0, "No Ether to refund");
        bool success;
        (success, ) = payable(msg.sender).call{value: funderToAmount[msg.sender]}("");
        require(success, "Transmission failed");
        funderToAmount[msg.sender] = 0;//清零
    }

    function setFunderToAmount(address funder, uint256 amountToUpdate) public {
        require(msg.sender == erc20Addr, "you do not have permision to call this function");
        funderToAmount[funder] = amountToUpdate;
    }

    function setErc20Addr(address _erc20Addr) public onlyOwner {
        erc20Addr = _erc20Addr;
    }

    modifier windowClosed() {
        require(block.timestamp >= lockTime + deploymentTimestamp, "window is not closed");
        _;
    }

    modifier onlyOwner() {
        require(owner == msg.sender, "This function can only be called by owner"); // 只有owner才能转回合约
        _;
    }

}