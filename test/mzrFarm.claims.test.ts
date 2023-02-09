import { ethers } from "hardhat";
import { expect } from "chai";
import {
    prepare, deploy, advanceBlock,
    currentDateManipulation, advanceTime
} from "./utils"


describe("MZRFarm claims reward functionalities", () => {

    const rewardsPerBlock = 100
    const depositingAmount = 10000
    const bobMZRCoins = 100000

    before(async function () {

        await ethers.provider.send("hardhat_reset", [])
        await prepare(this, ["Farming", "ERC20Mock"])
        await deploy(this, [["mzrFarming", "Farming"], ["mzrToken", "ERC20Mock"]])
        await this.mzrFarming.initialize(
            this.manager.address, 
            this.mzrToken.address, 
            rewardsPerBlock, 
            Math.trunc(currentDateManipulation({ hours: 1 }) / 1000),
            Math.trunc(currentDateManipulation({days: 60}) / 1000))

    })

    it("create NOT AMENDABLE pool", async function () {

        // setting up default values for farming contract
        const startBlock = await ethers.provider.getBlockNumber()

        // creating a farming pool
        expect(await this.mzrFarming.getPoolLength()).to.be.equal(0)
        await this.mzrFarming.connect(this.manager).addPool(10, this.mzrToken.address, startBlock, startBlock + 100, false)
        expect(await this.mzrFarming.getPoolLength()).to.be.equal(1)
    })


    it("bob attempts deposting funds when no mzrToken is available in his wallet", async function () {
        await expect(this.mzrFarming.connect(this.bob).depositTo(0, depositingAmount, this.bob.address)).to.be.revertedWith("ERC20: transfer amount exceeds balance")
    })

    it("funds are transfered to bob's wallet", async function () {

        await this.mzrToken.connect(this.manager).transfer(this.bob.address, bobMZRCoins);
        let availableMZRs = await this.mzrToken.balanceOf(this.bob.address)
        expect(availableMZRs).to.be.equal(bobMZRCoins)

    })

    it("bob provides to mzrFarm contract a smaller allowance than depositing", async function () {

        // bob approves future transfers of his mzrToken to mzrFamr contract
        await this.mzrToken.connect(this.bob).approve(this.mzrFarming.address, 1000);

        // bob deposits the mzrToken, knowing that mzrFarm and mzrToken contracts are enabled to do so
        await expect(this.mzrFarming.connect(this.bob).depositTo(0, depositingAmount, this.bob.address)).to.be.revertedWith("ERC20: transfer amount exceeds allowance")

    })

    it("bob matches approved allowance with depositing amount in mzrFarm contract ", async function () {

        // bob approves future transfers of his mzrToken to mzrFamr contract
        await this.mzrToken.connect(this.bob).approve(this.mzrFarming.address, depositingAmount);

        // bob deposits the mzrToken, knowing that mzrFarm and mzrToken contracts are enabled to do so
        await this.mzrFarming.connect(this.bob).depositTo(0, depositingAmount, this.bob.address)

        const [deposited, totalRewarded, pendigReward, requestedWithdrawalTimestamp, isPrivateInvestor] = await this.mzrFarming.connect(this.bob).getUserInfo(0, this.bob.address)

        expect(deposited).to.be.equal(depositingAmount)
        expect(totalRewarded).to.be.equal(0)
        expect(pendigReward).to.be.equal(0)
    })

    it("bob claims before claimable time is reached", async function () {

        await expect(this.mzrFarming.connect(this.bob).claimReward(0)).to.be.revertedWith("Claiming reward is not available yet")

    })

    it("bob claims when claimable time is mature", async function () {

        await advanceTime(2 * 60 * 60) // moving blockchain time 2 hours in the future
        await this.mzrFarming.connect(this.bob).claimReward(0)

    })

    it("checking that accrued amount is in line with block generation", async function () {

        await advanceBlock(1)
        let bobBalance = await this.mzrToken.balanceOf(this.bob.address)
        const [
            depositedAmount,
            totalRewarded,
            pendingReward,
            requestedWithdrawalTimestamp,
            isPrivateInvestor
        ] = await this.mzrFarming.connect(this.bob).getUserInfo(0, this.bob.address)

        expect(pendingReward).to.be.equal(rewardsPerBlock)


        //redundant checks
        expect(totalRewarded).to.be.equal((bobBalance.toNumber() + depositingAmount ) - bobMZRCoins )
        expect(depositedAmount).to.be.equal(depositingAmount)
        expect(requestedWithdrawalTimestamp).to.be.equal(0)
    })

});
