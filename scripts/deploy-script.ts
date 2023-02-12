// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const ethers = hre.ethers;
import { addDays } from "date-fns";
import { BN, bufferToHex, privateToAddress, toBuffer } from "ethereumjs-util"
import { normalizeHardhatNetworkAccountsConfig } from "hardhat/internal/core/providers/util"
import * as testUtils from "../test/utils"


async function main() {


  await hre.run('compile');


  // We get the contract to deploy

  console.log("DEPLOYING INTO: ", hre.network.name)
  const accounts = normalizeHardhatNetworkAccountsConfig(hre.network.config.accounts)
  const address = bufferToHex(privateToAddress(toBuffer(accounts[0].privateKey)))
  const privateKey = bufferToHex(toBuffer(accounts[0].privateKey))
  // const balance = new BN(accounts[0].balance).div(new BN(10).pow(new BN(18))).toString(10)
  console.log(`Account #0: ${address} Private Key: ${privateKey}`)


  const MZR = await ethers.getContractFactory("ERC20Mock");
  const mzr = await MZR.deploy();
  await mzr.deployed();

  /**
    * waiting x amount of time (localhost=10blocks) before triggering verify
    */
  if (hre.network.name == "localhost") {
    setInterval(function () {
      testUtils.advanceBlock(60)
    }, 100);
  }
  // await mzr.deployTransaction.wait(30)

  console.log("mzr deployed to:", mzr.address);

  /** 
    * verifying token contract
    */
  // try {
  //   await hre.run('verify:verify', {
  //     address: mzr.address,
  //     bytecode: mzr.bytecode,
  //     contract: "contracts/ERC20Mock.sol:ERC20Mock",
  //   });
  // } catch (e) {
  //   console.log("error with vefication")
  //   console.log(e.message)
  // }


  const Stacking = await ethers.getContractFactory("Stacking");
  const stacking = await Stacking.deploy();
  await stacking.deployed();

  /**
    * waiting x amount of time (localhost=10blocks) before triggering verify
    */
  // if (hre.network.name == "localhost") {
  //   setInterval(function () {
  //     testUtils.advanceBlock(60)
  //   }, 100);
  // }
  // await mzr.deployTransaction.wait(30)

  console.log("stacking deployed to:", stacking.address);

  /** 
    * verifying farming contract
    */
  // try {
  //   await hre.run('verify:verify', {
  //     address: stacking.address,
  //     bytecode: stacking.bytecode,
  //     contract: "contracts/stacking.sol:Stacking",
  //   });

  // } catch (e) {
  //   console.log("error with vefication")
  //   console.log(e.message)
  // }


  /** 
    * initialising farming contract
  */
  // let currentDate = addDays(new Date(), 1)
  await stacking.initialize(address)
  console.log("INITIALISED")

}
    // mzr.address
    // 100,
    // Math.trunc(currentDate.getTime() / 1000),
    // Math.trunc((currentDate.getTime() + (60 * 24 * 60 * 60)) / 1000))


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
module.exports = {};