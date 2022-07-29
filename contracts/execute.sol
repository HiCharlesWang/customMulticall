pragma solidity >= 0.8.0;

contract Execute{
    function returnOne(uint256 _number) external view returns(uint256){
        return _number;
    }

    function returnTwo() external view returns(uint256){
        return 2;
    }

    function returnCustom(uint256 _number) external view returns(uint256){
        return _number;
    }
}