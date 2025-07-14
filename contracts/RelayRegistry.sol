// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;


interface ITargetReceiver {
    function receiveRelay(address from, bytes calldata data, bytes32 proofHash) external;
}

contract RelayRegistry {
    mapping(string => address[]) private relayChains;
    address public owner;

    event RelayRegistered(string sourceChainId, address relayChainAddress);
    event RelayedFromSource(address indexed from, address indexed target, bytes data, bytes32 proofHash);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    function registerRelay(string calldata sourceChainId, address relayChainAddress) public onlyOwner {
        relayChains[sourceChainId].push(relayChainAddress);
        emit RelayRegistered(sourceChainId, relayChainAddress);
    }

    function getRelaysForSource(string calldata sourceChainId) public view returns (address[] memory) {
        return relayChains[sourceChainId];
    }

    function relayFromSource(address targetReceiver, bytes calldata data, bytes32 proofHash) external {
        emit RelayedFromSource(msg.sender, targetReceiver, data, proofHash);

        // Gọi đến TargetReceiver trên DC
        ITargetReceiver(targetReceiver).receiveRelay(msg.sender, data, proofHash);
    }
}
