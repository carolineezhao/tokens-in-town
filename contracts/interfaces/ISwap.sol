// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

interface ISwap {

    function init(uint token0Amount, uint token1Amount) external;

    // Functions for getting the current reserves of tokens in the swap contract
    function getReserves() external view returns (uint, uint);

    // Functions for getting the token addresses used in the swap
    function getTokens() external view returns (address, address);

    // Function to swap token0 for token1
    function token0To1(uint token0Amount) external;

    // Function to swap token1 for token0
    function token1To0(uint token1Amount) external;

    // Helper function to calculate how much token1 will be returned for a given amount of token0
    function getToken1AmountOut(uint token0Amount) external view returns (uint);

    // Helper function to calculate how much token0 will be returned for a given amount of token1
    function getToken0AmountOut(uint token1Amount) external view returns (uint);
}
