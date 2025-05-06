pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT

import "./tigerToken.sol";

contract tigerCoffee is tigerToken {
    
    constructor(uint256 initialSupply) tigerToken('Small World Coffee', 'tigerCoffee', initialSupply) {
    }
}