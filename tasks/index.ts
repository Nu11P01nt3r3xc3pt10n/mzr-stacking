import { task } from 'hardhat/config';

task("deploy", "deploy contract").setAction(async (from) => {
  console.log("triggered deploy task",from)
  
  /**
   * 
   * 
   * understand what is the purpose of thsese tasks 
   * cannot be used for deployment using the following approach. 
   * at this point hardhat is being still initialised and cannot execute the following instructions 
   */

  
  
  //--------------------------- ESPECIALLY THIS INSTRUCTION --------------------------
  // We get the contract to deploy
  // const networkConfig = hre.config.networks["localhost"]





  // const accounts = normalizeHardhatNetworkAccountsConfig(networkConfig.accounts)
  // const address = bufferToHex(privateToAddress(toBuffer(accounts[0].privateKey)))
  // const privateKey = bufferToHex(toBuffer(accounts[0].privateKey))
  // const balance = new BN(accounts[0].balance).div(new BN(10).pow(new BN(18))).toString(10)
  // console.log(`Account #0: ${address} (${balance} ETH) Private Key: ${privateKey}`)

 
  // const MZR = await ethers.getContractFactory("ERC20Mock");
  // const mzr = await MZR.deploy();
  // await mzr.deployed();
  // console.log("mzr deployed to:", mzr.address);


  // const Farming = await ethers.getContractFactory("Farming");
  // const farming = await Farming.deploy();
  // await farming.deployed();
  // console.log("farming deployed to:", farming.address);

  // let currentDate = addDays(new Date(), 1)
  // await farming.initialize(address, mzr.address, 100, Math.trunc(currentDate.getTime() / 1000))

});

module.exports = {};