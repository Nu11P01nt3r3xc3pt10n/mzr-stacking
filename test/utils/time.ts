
import { ethers } from "hardhat";
import { addMinutes, addDays, addHours } from "date-fns";


export async function advanceTimeAndBlock(blocksCount, blockTime) {
    for (let i = 0; i < blocksCount; i++) {
        await ethers.provider.send("evm_increaseTime", [blockTime])
    }
}

export async function advanceTime(blockTime) {

    await ethers.provider.send("evm_increaseTime", [blockTime])

}
export async function advanceBlock(blocksCount) {
    for (let i = 0; i < blocksCount; i++) {
        await ethers.provider.send("evm_mine", [])
    }
}


export function currentDateManipulation({ days = 0, hours = 0, minutes = 0 }: NamedParameters) {

    let currentDate = new Date()

    currentDate = addDays(currentDate, days)
    currentDate = addHours(currentDate, hours)
    currentDate = addMinutes(currentDate, minutes)

    return currentDate.getTime()
}

interface NamedParameters {
    days?: number,
    hours?: number,
    minutes?: number
}