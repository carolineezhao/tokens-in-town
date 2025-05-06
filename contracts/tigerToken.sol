// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract tigerToken is ERC20, AccessControl {
    // Create a new role identifier for the minter / burner role
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");    
    /**
     * @dev Constructor that gives msg.sender all of existing tokens.
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply * (10 ** uint256(decimals())));
        // Grant the contract deployer the default admin role: it will be able
        // to grant and revoke any roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        }

    event mintToken(address to, uint256 amount);
    event burnToken(address from, uint256 amount);

    function grantMint(address minter) external {
        _grantRole(MINTER_ROLE, minter);
    }

    function grantBurn(address burner) external {
        _grantRole(BURNER_ROLE, burner);
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {        
        _mint(to, amount);
        emit mintToken(to, amount);
    }

    function burn(address from, uint256 amount) public onlyRole(BURNER_ROLE) {        
        _burn(from, amount);
        emit burnToken(from, amount);
    }

    function scaleMint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {        
        _mint(to, amount / 10**8);
        emit mintToken(to, amount/10**8);
    }

    function purchase(address to) external onlyRole(MINTER_ROLE) {
        mint(to, 100000000);
    }

    function redeem(address from) external onlyRole(BURNER_ROLE) {
        burn(from, 1000000000);
    }

    function decimals() public view virtual override returns (uint8) {
        return 8;
    }
}