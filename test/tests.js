const { expect } = require('chai');
const { ethers } = require('hardhat');


describe("Multicall", () =>{
    beforeEach(async() =>{
        [owner, addr1, addr2, addr3] = await ethers.getSigners();
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
        it("Should execute a multicall",async() =>{
            await multicallDeployed.call([executeDeployed.address,executeDeployed.address ], ["0x5d029f870000000000000000000000000000000000000000000000000000000000000002", "0x5d029f870000000000000000000000000000000000000000000000000000000000000003"])
        })
    })
    describe("Multisig", () =>{
        it("Should set owner to auth during deployment", async() =>{
            expect(await multicallDeployed.viewMultisigAddress(owner.address)).to.equal(true);
        })
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
            await multicallDeployed.proposeTransaction(executeDeployed.address, "0x5d029f870000000000000000000000000000000000000000000000000000000000000002");
            const txhash = await multicallDeployed.txhashIndex(0)
            expect(await multicallDeployed.txHashContains(txhash)).to.equal(true);
            data = await multicallDeployed.getData(txhash)
            contract = await multicallDeployed.getContract(txhash);
        })
        it("Should revert if the same transaction gets proposed twice", async() =>{
            await multicallDeployed.proposeTransaction(executeDeployed.address, "0x5d029f870000000000000000000000000000000000000000000000000000000000000002");
            await expect(multicallDeployed.proposeTransaction(executeDeployed.address, "0x5d029f870000000000000000000000000000000000000000000000000000000000000002")).to.be.revertedWith("Is already added")
        })
        it("Propose transaction, sign it with 3 wallets, execute it", async() =>{
            await multicallDeployed.proposeTransaction(executeDeployed.address, "0x5d029f870000000000000000000000000000000000000000000000000000000000000002");
            const txhash = await multicallDeployed.txhashIndex(0)
            await multicallDeployed.addToMultisig(addr1.address);
            await multicallDeployed.addToMultisig(addr2.address);
            expect(await multicallDeployed.multisigLength()).to.equal(3);
            expect(await multicallDeployed.signs(txhash)).to.equal(0)
            await multicallDeployed.signTransactionHash(txhash)
            await multicallDeployed.connect(addr1).signTransactionHash(txhash)
            await multicallDeployed.connect(addr2).signTransactionHash(txhash)
            await expect(multicallDeployed.connect(addr3).signTransactionHash(txhash)).to.be.revertedWith("Address is not auth")
            expect(await multicallDeployed.multisigLength()).to.equal(3);
            const tx = await multicallDeployed.executeMultisig(txhash);
            const wait = await tx.wait();
            const args = wait.events[0].args
            expect(parseInt(args)).to.equal(2);
        })
        it("Propose transaction, sign it, revert for double sign", async() =>{
            await multicallDeployed.proposeTransaction(executeDeployed.address, "0x5d029f870000000000000000000000000000000000000000000000000000000000000002");
            const txhash = await multicallDeployed.txhashIndex(0)
            await multicallDeployed.addToMultisig(addr1.address);
            await multicallDeployed.addToMultisig(addr2.address);
            await multicallDeployed.signTransactionHash(txhash)
            await multicallDeployed.connect(addr1).signTransactionHash(txhash)
            await multicallDeployed.connect(addr2).signTransactionHash(txhash)         
            await expect(multicallDeployed.connect(addr2).signTransactionHash(txhash)).to.be.revertedWith("only allowed to sign once")
        })
        it("Propose transaction, sign, remove sign, remove unsigned sign", async() =>{
            await multicallDeployed.proposeTransaction(executeDeployed.address, "0x5d029f870000000000000000000000000000000000000000000000000000000000000002");
            const txhash = await multicallDeployed.txhashIndex(0)
            await multicallDeployed.addToMultisig(addr1.address);
            await multicallDeployed.addToMultisig(addr2.address);
            await multicallDeployed.signTransactionHash(txhash)
            await expect(multicallDeployed.signTransactionHash(txhash)).to.be.revertedWith("only allowed to sign once")
            expect (await multicallDeployed.signs(txhash)).to.equal(1)
        })
    
})
})