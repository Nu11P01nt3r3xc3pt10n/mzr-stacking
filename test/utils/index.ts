import { ethers } from "hardhat";


export async function prepare(thisObject, contracts) {

    for (let i in contracts) {
      let contract = contracts[i]
      thisObject[contract] = await ethers.getContractFactory(contract)
    }
    thisObject.signers = await ethers.getSigners()
    thisObject.manager = thisObject.signers[0]
    thisObject.bob = thisObject.signers[1]
}


export async function deploy(thisObject, contracts) {
    for (let i in contracts) {
      let contract = contracts[i]
      thisObject[contract[0]] = await thisObject[contract[1]].deploy()
      await thisObject[contract[0]].deployed()
    }
}



export * from "./time"