// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract NFTsInTown is ERC1155, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // Event IDs for your NFT events
    uint256 public constant SMALL_WORLD_SEASONAL_DRINK = 0;
    uint256 public constant GARDEN_THEATRE_MOVIE_PREMIER = 1;
    uint256 public constant OLIVES_CHRISTMAS_SANDWICH_SPECIAL = 2;
    uint256 public constant BENT_SPOON_ICE_CREAM_FLAVOUR_OF_THE_WEEK = 3;

    // Mapping for token-specific URIs (metadata) for each event NFT
    mapping(uint256 => string) private _tokenURIs;

    constructor() ERC1155("") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);

        // Initialize default URIs (these can be updated later via setTokenURI)
        _tokenURIs[SMALL_WORLD_SEASONAL_DRINK] = "https://ipfs.io/ipfs/bafybeihc6ofiqm5656ovskfduolez7nxdrmdor5d7dvnd6qsixa4pklhpy";
        _tokenURIs[GARDEN_THEATRE_MOVIE_PREMIER] = "https://ipfs.io/ipfs/bafybeicqisz6bl6ckvgvyfaivnlumtc2ib5eqcyr5hwdzzxnhgsdtqfg3m";
        _tokenURIs[OLIVES_CHRISTMAS_SANDWICH_SPECIAL] = "https://ipfs.io/ipfs/bafybeieio2kkulwo5lvngkmotfxlkph2bnndenvogdd6abcrixun7vrvly";
        _tokenURIs[BENT_SPOON_ICE_CREAM_FLAVOUR_OF_THE_WEEK] = "https://ipfs.io/ipfs/bafybeierbidntmol37jekyr4brgqenisltakodi6mymnhgywf37arnl5di";
    }

    /// @notice Update the metadata URI for a given NFT event.
    function setTokenURI(uint256 tokenId, string memory newuri) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _tokenURIs[tokenId] = newuri;
    }

    /// @notice Override the uri function to return token-specific metadata.
    function uri(uint256 tokenId) public view override returns (string memory) {
        return _tokenURIs[tokenId];
    }

    /// @notice Mint a specified amount of an NFT (event token) to a target account.
    /// @param account The recipient address.
    /// @param id The NFT event ID (0 to 3).
    /// @param amount The number of NFTs to mint.
    function mintNFT(address account, uint256 id, uint256 amount, bytes memory data) public onlyRole(MINTER_ROLE) {
        _mint(account, id, amount, data);
    }

    /// @notice Override supportsInterface to resolve multiple base class implementations.
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
