const NFTPassport = artifacts.require("NFTPassport");

contract("NFTPassport", (accounts) => {
  const requiredNFTs = 2;
  let nftPassportInstance;

  before(async () => {
    nftPassportInstance = await NFTPassport.new(requiredNFTs);
  });

  it("should add NFTs and check for completion", async () => {
    await nftPassportInstance.addNFT(accounts[0], 1);
    let collected = await nftPassportInstance.nftsCollected(accounts[0]);
    assert.equal(collected.toNumber(), 1, "Should have collected 1 NFT");
    let complete = await nftPassportInstance.checkCompletion(accounts[0]);
    assert.equal(complete, false, "NFT Passport should not be complete yet");

    await nftPassportInstance.addNFT(accounts[0], 2);
    collected = await nftPassportInstance.nftsCollected(accounts[0]);
    assert.equal(collected.toNumber(), 2, "Should have collected 2 NFTs");
    complete = await nftPassportInstance.checkCompletion(accounts[0]);
    assert.equal(complete, true, "NFT Passport should be marked as complete");
  });
});
