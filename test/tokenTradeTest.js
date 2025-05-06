const TokenTrade = artifacts.require("TokenTrade");

contract("TokenTrade", (accounts) => {
  it("should return an exchange rate", async () => {
    const tradeInstance = await TokenTrade.deployed();
    const rate = await tradeInstance.getExchangeRate("Olives", "Bent Spoon");
    assert.equal(rate.toNumber(), 2, "Exchange rate should be 2");
  });

  it("should simulate a token trade", async () => {
    const tradeInstance = await TokenTrade.deployed();
    // Simulate approving and completing a trade.
    await tradeInstance.approveTrade(accounts[0], accounts[1], 1, { from: accounts[0] });
    await tradeInstance.completeTrade(accounts[0], accounts[1], 1, { from: accounts[0] });

    // Verify that tokenOwnership mapping has been updated.
    const ownership = await tradeInstance.tokenOwnership(accounts[1], 1);
    assert.equal(ownership, true, "Token should be owned by account[1] after the trade");
  });
});
