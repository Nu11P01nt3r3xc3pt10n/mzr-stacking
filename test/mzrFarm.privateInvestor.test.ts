import {ethers} from "hardhat";
import {advanceTimeAndBlock, prepare, deploy, currentDateManipulation} from "./utils";
import {expect} from "chai";
import {addMinutes} from "date-fns";
import {BigNumber} from "ethers"


const BASE_TEN = 10

describe("MZRFarm investors vesting", () => {

    before(async function () {

        await ethers.provider.send("hardhat_reset", [])
        await prepare(this, ["Farming", "ERC20Mock"])
        await deploy(this, [["mzrFarming", "Farming"], ["mzrToken", "ERC20Mock"]])

        await this.mzrFarming.initialize(
            this.manager.address,
            this.mzrToken.address,
            100,
            Math.trunc(currentDateManipulation({minutes: 60}) / 1000),
            Math.trunc(currentDateManipulation({days: 60}) / 1000)
    )
        await ethers.provider.send("evm_mine", [])

    })

    it("bob is not a private investor", async function () {

        // setting up default values for farming contract
        const startBlock = await ethers.provider.getBlockNumber()
        await this.mzrFarming.connect(this.manager).setTokenPerBlock(100)
        let timestamp = currentDateManipulation({minutes: 10})
        await this.mzrFarming.connect(this.manager).setNoRewardClaimsUntil(Math.trunc(timestamp / 1000))

        // creating a farming pool
        expect(await this.mzrFarming.getPoolLength()).to.be.equal(0)
        await this.mzrFarming.connect(this.manager).addPool(10, this.mzrToken.address, startBlock, startBlock + 100, false)
        expect(await this.mzrFarming.getPoolLength()).to.be.equal(1)


        const [depositedBeforeWithdrawal, totalRewardedBeforeWithdrawal, pendingRewardBeforeWithdrawal, requestedWithdrawalTimestampBeforeWithdrawal, isPrivateInvestor] = await this.mzrFarming.connect(this.bob).getUserInfo(0, this.bob.address)

        expect(isPrivateInvestor).to.be.equal(false);
    })

    it("bob becomes private investor", async function () {
        await this.mzrFarming.connect(this.manager).addInvestorAddress(this.bob.address)
        const [depositedBeforeWithdrawal, totalRewardedBeforeWithdrawal, pendingRewardBeforeWithdrawal, requestedWithdrawalTimestampBeforeWithdrawal, isPrivateInvestor] = await this.mzrFarming.connect(this.bob).getUserInfo(0, this.bob.address)
        expect(isPrivateInvestor).to.be.equal(true);
    })

    it("bob request for withdrawal", async function () {
        await expect(this.mzrFarming.connect(this.bob).requestWithdrawal(0)).to.be.revertedWith("LP tokens are not yet unlocked for private investors")
    })


    it("bob successfully request for withdrawal", async function () {
        // await expect(this.mzrFarming.connect(this.bob).requestWithdrawal(0)).to.be.revertedWith("LP tokens are not yet unlocked for private investors")
        await advanceTimeAndBlock(60, 60 * 60 * 24)
        this.mzrFarming.connect(this.bob).requestWithdrawal(0)
        const [deposited, totalRewarded, pendigReward, requestedWithdrawalTimestamp, isPrivateInvestor] = await this.mzrFarming.connect(this.bob).getUserInfo(0, this.bob.address)
        expect(requestedWithdrawalTimestamp.toNumber()).to.be.greaterThan(0)

    })


    it("bob removed from private investor", async function () {
        await this.mzrFarming.connect(this.manager).removeInvestorAddress(this.bob.address)
        const [depositedBeforeWithdrawal, totalRewardedBeforeWithdrawal, pendingRewardBeforeWithdrawal, requestedWithdrawalTimestampBeforeWithdrawal, isPrivateInvestor] = await this.mzrFarming.connect(this.bob).getUserInfo(0, this.bob.address)
        expect(isPrivateInvestor).to.be.equal(false);
    })


});
