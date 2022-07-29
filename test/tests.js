const { expect } = require('chai');
const { ethers } = require('hardhat');


describe("Multicall", () =>{
    beforeEach(async() =>{
        [owner, addr1] = await ethers.getSigners();
        executeFactory = await ethers.getContractFactory("Execute");
        executeDeployed = await executeFactory.deploy();
        multicallFactory = await ethers.getContractFactory("Multicall");
        multicallDeployed = await multicallFactory.deploy();
    })
    describe("Multicall", () =>{
        it("Should return function selectors", async() =>{
            console.log(await multicallDeployed.returnSelector("returnCustom(uint256)"))
            console.log(await multicallDeployed.returnSelector("returnOne(uint256)"))
            console.log(await multicallDeployed.returnSelector("returnTwo()"))
        })
        it("Should call returnCustom",async () =>{
            await multicallDeployed.callOne(executeDeployed.address, "0x5d029f870000000000000000000000000000000000000000000000000000000000000002")
        })
        it("Should call returnOne", async() =>{
            await multicallDeployed.callOne(executeDeployed.address, "0x932531020000000000000000000000000000000000000000000000000000000000000002")
        })
        it("Should call returnTwo", async() =>{
            await multicallDeployed.callOne(executeDeployed.address, "0x946e182c")
        })
    })
    describe("Multisig", () =>{
        it("Should add, remove and display the enumerableSet.AddressSet", async() =>{
            expect(await multicallDeployed.viewMultisigAddress(owner.address)).to.equal(true);
            expect(await multicallDeployed.viewMultisigIndex(0)).to.equal(owner.address);
            await expect(multicallDeployed.connect(addr1).addToMultisig(addr1.address)).to.be.revertedWith("Ownable: caller is not the owner")
            await multicallDeployed.removeFromMultisig(owner.address)
            expect(await multicallDeployed.viewMultisigAddress(owner.address)).to.equal(false);
        })
        it("Should not be able do add and remove addresses twice", async() =>{
            await multicallDeployed.addToMultisig(addr1.address);
            await expect(multicallDeployed.addToMultisig(addr1.address)).to.be.revertedWith('Address was already added');
            await multicallDeployed.removeFromMultisig(addr1.address);
            await expect(multicallDeployed.removeFromMultisig(addr1.address)).to.be.revertedWith('Address is not in the set');
        })
        it("Propose transaction, include hash, set contract and data in mapping", async() =>{
            const txhash = await multicallDeployed.proposeTransaction(executeDeployed.address, "0x5d029f870000000000000000000000000000000000000000000000000000000000000002");
            console.log(await multicallDeployed.getContract(txhash))
            console.log(await multicallDeployed.getData(txhash))
        })
    
})
})