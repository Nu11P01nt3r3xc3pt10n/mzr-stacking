import { ethers } from "hardhat";
import { expect } from "chai";
import { prepare, deploy, currentDateManipulation } from "./utils"

describe("mzrFarming owner functionalities", () => {

    before(async function () {

        await ethers.provider.send("hardhat_reset", [])
        await prepare(this, ["Farming", "ERC20Mock"])

    })

    beforeEach(async function () {

        await deploy(this, [["mzrFarming", "Farming"], ["mzrToken", "ERC20Mock"]])
        await this.mzrFarming.initialize(
            this.manager.address,
            this.mzrToken.address,
            100,
            Math.trunc(currentDateManipulation({ days: 1 }) / 1000),
            Math.trunc(currentDateManipulation({days: 60}) / 1000)
        )

    })

    it("only manager should set setTokenPerBlock ", async function () {

        await this.mzrFarming.connect(this.manager).setTokenPerBlock(10)
        let tokensFarmedPerBlock = await this.mzrFarming.tokensFarmedPerBlock()
        expect(tokensFarmedPerBlock).to.be.equal(10)

        await expect(this.mzrFarming.connect(this.bob).setTokenPerBlock(10)).to.be.revertedWith('Caller is not the Manager')

    });

    it("only manager should set setNoRewardClaimsUntil ", async function () {

        let timestamp = currentDateManipulation({ days: 7 })

        await this.mzrFarming.connect(this.manager).setNoRewardClaimsUntil(Math.trunc(timestamp / 1000))
        let noRewardClaimsUntil = await this.mzrFarming.noRewardClaimsUntil()
        expect(noRewardClaimsUntil).to.be.equal(Math.trunc(timestamp / 1000))

        await expect(this.mzrFarming.connect(this.bob).setNoRewardClaimsUntil(Math.trunc(timestamp / 1000)))
            .to.be.revertedWith('Caller is not the Manager')

    });

    it("only this.manager should set pause and upause", async function () {

        await expect(this.mzrFarming.connect(this.manager).pause()).to.emit(this.mzrFarming, "Paused").withArgs(this.manager.address)
        await expect(this.mzrFarming.connect(this.bob).pause()).to.be.revertedWith('Caller is not the Admin')
        await expect(this.mzrFarming.connect(this.manager).unpause()).to.emit(this.mzrFarming, "Unpaused").withArgs(this.manager.address)
        await expect(this.mzrFarming.connect(this.bob).unpause()).to.be.revertedWith('Caller is not the Admin')

    });

    it("unpause fails when contract not paused", async function () {

        await expect(this.mzrFarming.connect(this.manager).unpause()).to.be.revertedWith('Pausable: not paused')

    });

    it("create NOT AMENDABLE pool successfully", async function () {

        const startBlock = await ethers.provider.getBlockNumber()

        expect(await this.mzrFarming.getPoolLength()).to.be.equal(0)
        await this.mzrFarming.connect(this.manager).addPool(10, this.mzrToken.address, startBlock, startBlock + 100, false)
        expect(await this.mzrFarming.getPoolLength()).to.be.equal(1)

    })

    it("create NOT AMENDABLE pool fails when user is not manager", async function () {

        const startBlock = await ethers.provider.getBlockNumber()

        expect(await this.mzrFarming.getPoolLength()).to.be.equal(0)
        await expect(this.mzrFarming.connect(this.bob).addPool(10, this.mzrToken.address, startBlock, startBlock + 100, false))
            .to.be.revertedWith('Caller is not the Manager')

        expect(await this.mzrFarming.getPoolLength()).to.be.equal(0)

    })

    it("create NOT AMENDABLE pool fails because of blockNumber", async function () {

        const startBlock = await ethers.provider.getBlockNumber()
        expect(await this.mzrFarming.getPoolLength()).to.be.equal(0)
        await expect(this.mzrFarming.connect(this.manager).addPool(10, this.mzrToken.address, startBlock, 0, false))
            .to.be.revertedWith("Incorrect endblock number")

        expect(await this.mzrFarming.getPoolLength()).to.be.equal(0)

    })

});
