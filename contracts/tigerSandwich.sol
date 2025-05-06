pragma solidity >=0.8.0 <0.9.0;
//SPDX-License-Identifier: MIT

import "./tigerToken.sol";

contract tigerSandwich is tigerToken {
    
    constructor(uint256 initialSupply) tigerToken('Olives Sandwich', 'tigerSandwich', initialSupply) {
    }
}