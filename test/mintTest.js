const Mint = artifacts.require("Mint");

contract("Mint", (accounts) => {
  it("should mint a token and store its metadata", async () => {
    const mintInstance = await Mint.deployed();
    const tx = await mintInstance.mint(accounts[0], "Small World Coffee", { from: accounts[0] });
    // TokenId from event log (assuming first log is our TokenMinted event)
    const tokenId = tx.logs[0].args.tokenId.toNumber();
    const metadata = await mintInstance.getTokenMetadata(tokenId);
    assert.equal(metadata, "Small World Coffee", "Metadata should match the minted token");
  });
});
