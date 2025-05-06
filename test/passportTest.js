const Passport = artifacts.require("Passport");

contract("Passport", (accounts) => {
  const requiredTokens = 3; // Use a small number for testing
  let passportInstance;

  before(async () => {
    passportInstance = await Passport.new(requiredTokens);
  });

  it("should add tokens and track collection progress", async () => {
    await passportInstance.addToken(accounts[0], 1);
    let collected = await passportInstance.tokensCollected(accounts[0]);
    assert.equal(collected.toNumber(), 1, "Should have collected 1 token");
    let isComplete = await passportInstance.checkCompletion(accounts[0]);
    assert.equal(isComplete, false, "Passport should not be complete yet");

    // Add additional tokens
    await passportInstance.addToken(accounts[0], 2);
    await passportInstance.addToken(accounts[0], 3);
    collected = await passportInstance.tokensCollected(accounts[0]);
    assert.equal(collected.toNumber(), 3, "Should have collected 3 tokens now");
    isComplete = await passportInstance.checkCompletion(accounts[0]);
    assert.equal(isComplete, true, "Passport should be marked as complete");
  });
});
