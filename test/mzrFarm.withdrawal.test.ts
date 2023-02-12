import {ethers} from "hardhat";
import {advanceTimeAndBlock, prepare, deploy, currentDateManipulation} from "./utils";
import {expect} from "chai";
import {BigNumber} from "ethers"

const BASE_TEN = 10

describe("MZRFarm withdrawal functionalities", () => {

    before(async function () {

        await ethers.provider.send("hardhat_reset", [])
        await prepare(this, ["Farming", "ERC20Mock"])
        await deploy(this, [["mzrFarming", "Farming"], ["mzrToken", "ERC20Mock"]])
        
        await this.mzrFarming.initialize(
            this.manager.address,
            this.mzrToken.address,
            
        )
        await ethers.provider.send("evm_mine", [])

    })

    it("withdrawal LP larger amount than available ", async function () {


        // setting up default values for farming contract
        const startBlock = await ethers.provider.getBlockNumber()
        await this.mzrFarming.connect(this.manager).setTokenPerBlock(100)
        let timestamp = currentDateManipulation({minutes: 10})
        await this.mzrFarming.connect(this.manager).setNoRewardClaimsUntil(Math.trunc(timestamp / 1000))


        // creating a farming pool
        expect(await this.mzrFarming.getPoolLength()).to.be.equal(0)
        await this.mzrFarming.connect(this.manager).addPool(10, this.mzrToken.address, startBlock, startBlock + 100, false)
        expect(await this.mzrFarming.getPoolLength()).to.be.equal(1)

        //bob attempts to deposits this.mzrToken when balance is 0
        await expect(this.mzrFarming.connect(this.bob).depositTo(0, 100, this.bob.address)).to.be.revertedWith("ERC20: transfer amount exceeds balance")

        // owner of this.mzrToken sends to bob some mzr
        await this.mzrToken.connect(this.manager).transfer(this.bob.address, BigNumber.from(20000).mul(BigNumber.from(BASE_TEN).pow(1)));

        // bob approves future transfers of his this.mzrToken to mzrFamr contract
        await this.mzrToken.connect(this.bob).approve(this.mzrFarming.address, BigNumber.from(20000).mul(BigNumber.from(BASE_TEN).pow(1)));

        // bob deposits the this.mzrToken, knowing that mzrFarm and this.mzrToken contracts are enabled to do so
        await this.mzrFarming.connect(this.bob).depositTo(0, BigNumber.from(10000).mul(BigNumber.from(BASE_TEN).pow(1)), this.bob.address)

        //getting user info for the pool
        const [deposited, totalRewarded, pendigReward, requestedWithdrawalTimestamp, isPrivateInvestor] = await this.mzrFarming.connect(this.bob).getUserInfo(0, this.bob.address)

        expect(deposited).to.be.equal(BigNumber.from(10000).mul(BigNumber.from(BASE_TEN).pow(1)))

        // checking that total reward is 0 given that no block has been mined since deposit and
        // no reward has been claim
        expect(totalRewarded).to.be.equal(0)

        // checking that total pending reward is 0 given that no block has been mined since deposit
        expect(pendigReward).to.be.equal(0)

        expect(requestedWithdrawalTimestamp).to.be.equal(0)

        await this.mzrToken.connect(this.manager).transfer(this.mzrFarming.address, BigNumber.from(20).mul(BigNumber.from(BASE_TEN).pow(18)));

        // bob is trying to withdraw without having the permissions to do so - no request was sent
        await expect(this.mzrFarming.connect(this.bob).withdraw(0, BigNumber.from(100000).mul(BigNumber.from(BASE_TEN).pow(1)))).to.be.revertedWith("Withdrawal amount is greater than available");

    })

    it("withdrawal more LP than available ", async function () {
        const [deposited, totalRewarded, pendingReward, requestedWithdrawalTimestamp, isPrivateInvestor] = await this.mzrFarming.connect(this.bob).getUserInfo(0, this.bob.address)
        expect(requestedWithdrawalTimestamp).to.be.equal(0)

        // bob is trying to withdraw after sending a withdrawal request with an amount larger than the one available
        await expect(this.mzrFarming.connect(this.bob).withdraw(0, BigNumber.from(10000).mul(BigNumber.from(BASE_TEN).pow(1)))).to.be.revertedWith("Request withdrawal first");
    })

    it("withdrawal LP after request but not enough time has yet elapsed ", async function () {
        await this.mzrFarming.connect(this.bob).requestWithdrawal(0)
        const [deposited, totalRewarded, pendigReward, requestedWithdrawalTimestamp, isPrivateInvestor] = await this.mzrFarming.connect(this.bob).getUserInfo(0, this.bob.address)
        expect(requestedWithdrawalTimestamp.toNumber()).to.be.greaterThan(0)

        // bob is trying to withdraw after sending a withdrawal request, but without having waited for the withdrawal to be activated
        await expect(this.mzrFarming.connect(this.bob).withdraw(0, BigNumber.from(10000).mul(BigNumber.from(BASE_TEN).pow(1)))).to.be.revertedWith("Withdrawal is not active yet");
        // blocks are mined up until 2 hours before the withdrawal is allowed
        await advanceTimeAndBlock(166, 60 * 60)
        // withdrawal is not yet available
        await expect(this.mzrFarming.connect(this.bob).withdraw(0, BigNumber.from(10000).mul(BigNumber.from(BASE_TEN).pow(1)))).to.be.revertedWith("Withdrawal is not active yet");

    })

    it("successful withdrawal LP after request", async function () {
        await advanceTimeAndBlock(2, 60*60)
        const [depositedBeforeWithdrawal, totalRewardedBeforeWithdrawal, pendingRewardBeforeWithdrawal, requestedWithdrawalTimestampBeforeWithdrawal, isPrivateInvestorBeforeWithdrawal] = await this.mzrFarming.connect(this.bob).getUserInfo(0, this.bob.address)

        // bob has successfully withdrawn LP tokens
        await this.mzrFarming.connect(this.bob).withdraw(0, BigNumber.from(5000).mul(BigNumber.from(BASE_TEN).pow(1)))

        const [depositedAfterWithdrawal, totalRewardedAfterWithdrawal, pendigRewardAfterWithdrawal, requestedWithdrawalTimestampAfterWithdrawal, isPrivateInvestorAfterWithdrawal] = await this.mzrFarming.connect(this.bob).getUserInfo(0, this.bob.address)
        expect(depositedAfterWithdrawal).to.be.equal(depositedBeforeWithdrawal-50000)
    })

    it("withdrawal LP after expiration", async function () {
        await advanceTimeAndBlock(168, 60 * 60)
        const [depositedBeforeWithdrawal, totalRewardedBeforeWithdrawal, pendingRewardBeforeWithdrawal, requestedWithdrawalTimestampBeforeWithdrawal, isPrivateInvestor] = await this.mzrFarming.connect(this.bob).getUserInfo(0, this.bob.address)

        // withdrawal period is expired hence he is now allowed to withdraw anymore
        await expect(this.mzrFarming.connect(this.bob).withdraw(0, BigNumber.from(5000).mul(BigNumber.from(BASE_TEN).pow(1)))).to.be.revertedWith("Withdrawal is expired");
    })

});
