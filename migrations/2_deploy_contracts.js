const tigerCoffee = artifacts.require("tigerCoffee");
const tigerSandwich = artifacts.require("tigerSandwich");
const DynamicSwap = artifacts.require("DynamicSwap");
const tigerTicket = artifacts.require("tigerTicket");
const tigerIceCream = artifacts.require("tigerIceCream");
const NFTsInTown = artifacts.require("NFTsInTown");

module.exports = async function (deployer) {
  await deployer.deploy(tigerCoffee, 10);
  const coffee = await tigerCoffee.deployed();
  await deployer.deploy(tigerSandwich, 10);
  const sandwich = await tigerSandwich.deployed();
  await deployer.deploy(tigerTicket, 10);
  const ticket = await tigerTicket.deployed();
  await deployer.deploy(tigerIceCream, 10);
  const icecream = await tigerIceCream.deployed();
  await deployer.deploy(DynamicSwap, coffee.address, sandwich.address);
  await deployer.deploy(NFTsInTown);
};
