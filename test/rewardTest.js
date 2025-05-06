const Reward = artifacts.require("Reward");

contract("Reward", (accounts) => {
  it("should verify eligibility and redeem a reward", async () => {
    const rewardInstance = await Reward.deployed();
    const tokensCollected = 10;
    const requiredTokens = 10;

    const eligible = await rewardInstance.checkRedemptionEligibility(accounts[0], tokensCollected, requiredTokens);
    assert.equal(eligible, true, "User should be eligible for redemption");

    await rewardInstance.redeemReward(accounts[0], 1, tokensCollected, requiredTokens, { from: accounts[0] });
    const redeemed = await rewardInstance.redeemedRewards(accounts[0], 1);
    assert.equal(redeemed, true, "Reward should be marked as redeemed for the user");
  });
});
