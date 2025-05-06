const LimitedEditionNFT = artifacts.require("LimitedEditionNFT");

contract("LimitedEditionNFT", (accounts) => {
  it("should mint a limited edition NFT and store metadata", async () => {
    const nftInstance = await LimitedEditionNFT.deployed();
    const tx = await nftInstance.mintLimitedEditionNFT(accounts[0], "Special Drop", { from: accounts[0] });
    const tokenId = tx.logs[0].args.tokenId.toNumber();
    const meta = await nftInstance.getMetadata(tokenId);
    assert.equal(meta, "Special Drop", "Metadata should match the minted limited edition NFT");
  });
});
