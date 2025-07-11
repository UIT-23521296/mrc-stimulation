// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract RelayRegistry {
    mapping(string => address[]) private relayChains;
    address public owner;

    event RelayRegistered(string sourceChainId, address relayChainAddress);

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
}
