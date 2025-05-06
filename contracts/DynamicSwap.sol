// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;
import "./tigerToken.sol";
import "./interfaces/ISwap.sol";
contract DynamicSwap is ISwap {

    address public token0;
    address public token1;
    uint public reserve0;
    uint public reserve1;

    // Constructor that sets fixed reserves at the time of deployment
    constructor(address addr0, address addr1) {
        token0 = addr0;
        token1 = addr1;
        // Set fixed reserves when the contract is deployed
        reserve0 = 0;
        reserve1 = 0;

    }

    function init(uint token0Amount, uint token1Amount) external override {
        
        tigerToken(token0).mint(address(this), token0Amount);
        tigerToken(token1).mint(address(this), token1Amount);

        reserve0 = token0Amount;
        reserve1 = token1Amount;
    }


    // View the reserves
    function getReserves() external override view returns (uint, uint) {
        return (reserve0, reserve1);
    }

    // View the tokens
    function getTokens() external override view returns (address, address) {
        return (token0, token1);
    }

    // Swap token0 for token1
    function token0To1(uint token0Amount) external override {
        require(token0Amount > 0, "Invalid number of tokens to trade");
        
        // Calculate how much token1 the user will get
        uint token1Amount = getToken1AmountOut(token0Amount);
        require(token1Amount <= reserve1, "Not enough liquidity for the trade");

        // Transfer tokens from user to contract
        require(tigerToken(token0).transferFrom(msg.sender, address(this), token0Amount));
        // Transfer output token1 to the user
        require(tigerToken(token1).transfer(msg.sender, token1Amount));

        // Update reserves
        reserve0 += token0Amount;
        reserve1 -= token1Amount;
    }

    // Swap token1 for token0
    function token1To0(uint token1Amount) external override {
        require(token1Amount > 0, "Invalid number of tokens to trade");
        
        // Calculate how much token0 the user will get
        uint token0Amount = getToken0AmountOut(token1Amount);
        require(token0Amount <= reserve0, "Not enough liquidity for the trade");

        // Transfer tokens from user to contract
        require(tigerToken(token1).transferFrom(msg.sender, address(this), token1Amount));
        // Transfer output token0 to the user
        require(tigerToken(token0).transfer(msg.sender, token0Amount));

        // Update reserves
        reserve0 -= token0Amount;
        reserve1 += token1Amount;
    }

    // Calculate token1 out using constant product formula
    function getToken1AmountOut(uint token0Amount) override public view returns (uint) {
        uint token1Amount = (token0Amount * reserve1) / (reserve0 + token0Amount);
        return token1Amount;
    }

    // Calculate token0 out using constant product formula
    function getToken0AmountOut(uint token1Amount) override public view returns (uint) {
        uint token0Amount = (token1Amount * reserve0) / (reserve1 + token1Amount);
        return token0Amount;
    }
}
