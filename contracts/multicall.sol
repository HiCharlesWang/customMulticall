pragma solidity >= 0.8.0;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Multicall is Ownable {

    ////////////// MULTICALL-FUNCTIONS ////////////////////////////////
    function call(address[] calldata contracts, bytes[] calldata data) external payable returns(bytes[] memory){ // test done 
        require(contracts.length == data.length, "Unmatched parameters");
        bytes[] memory results = new bytes[](data.length);
        for(uint i = 0; i < contracts.length; i++){
            (bool success, bytes memory result ) = contracts[i].staticcall(data[i]);
            require(success, "Call failed");
            results[i] = result;
        }
        return results;
    }

    function callOne(address _contract, bytes memory _data) external payable returns(bytes memory){ // test done
        (bool success, bytes memory result) = _contract.staticcall(_data);
        require(success, "Call failed");
        return result;
    }

    function returnSelector(string calldata _func) external view returns (bytes4) { // test done
        return bytes4(keccak256(bytes(_func))); 
    }   

    //////////////////MULTISIG-FUNCTIONS//////////////////////
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    EnumerableSet.AddressSet private auth;
    EnumerableSet.Bytes32Set private txHashes;

    mapping(address => mapping(bytes32 => bool)) public hasSigned;
    mapping(bytes32 => uint256) public signs;
    mapping(bytes32 => address) public getContract;
    mapping(bytes32 => bytes) public getData;

    event txSent(bytes returnData, bytes32 txHash);

    constructor() { // test done
        auth.add(msg.sender);
    }

    modifier onlyAuth{ // test done
        require(auth.contains(msg.sender) == true, "Address is not auth");
        _;
    }

    function signTransactionHash(bytes32 _txhash) external onlyAuth { // test done 
        require(txHashes.contains(_txhash) == true, "This hash was not proposed yet");
        require(!hasSigned[msg.sender][_txhash], "only allowed to sign once");
        hasSigned[msg.sender][_txhash] = true;
        signs[_txhash] += 1;
    }

    function removeSignTransactionHash(bytes32 _txhash) external onlyAuth { // test done
        require(txHashes.contains(_txhash) == true, "This hash was not proposed yet");
        require(hasSigned[msg.sender][_txhash], "was not signed");
         hasSigned[msg.sender][_txhash] = false;
         signs[_txhash] -= 1;

    }

    function proposeTransaction(address _contract, bytes memory _data) external onlyAuth returns(bytes32){ // test done
        bytes32 txhash = keccak256(abi.encodePacked(_contract, _data));
        require(txHashes.add(txhash) == true, "Is already added");
        getData[txhash] = _data;
        getContract[txhash] = _contract;
        return txhash;

    }

    function executeMultisig(bytes32 _txHash) external onlyAuth returns(bytes memory){ // test done
        require(signs[_txHash] >= 3, "At least 3 signers needed");
        require(txHashes.remove(_txHash) == true, "Was not possible to remove the txHash");
        address _contract = getContract[_txHash];
        bytes memory _data = getData[_txHash];
        (bool success, bytes memory returnData) = _contract.call(_data);
        require(success);
        emit txSent(returnData, _txHash); // returnData is the result of the call in hex
        return returnData;
    }
    ///////// Multisig signers ////////////////////
    function addToMultisig(address _addr) external onlyOwner{ // test done
        require(auth.add(_addr) == true, 'Address was already added');
    }

    function removeFromMultisig(address _addr) external onlyOwner{ // test done
        require(auth.remove(_addr) == true, 'Address is not in the set');
    }

    function viewMultisigIndex(uint256 _index) external view returns (address) { // test done 
        return auth.at(_index);
    }

    function viewMultisigAddress(address _addr) external view returns (bool) { // test done
        return auth.contains(_addr);
    }

    function multisigLength() external view returns(uint256) { // test done
        return auth.length();
    }

    //////////Multisig signers end///////////////////////

    function txhashIndex(uint256 _index) external view returns(bytes32) { // test done
       return txHashes.at(_index);
    }

    function txHashContains(bytes32 _txhash) external view returns(bool) { // test done
        return txHashes.contains(_txhash);
    }

    function getCallData(string memory _func, uint256 _arg) external view returns(bytes memory) { // test done
        bytes memory txHash = abi.encodeWithSignature(_func, _arg);
        return txHash;
    }


}