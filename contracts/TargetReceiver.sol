// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TargetReceiver {
    event MessageReceived(address indexed sender, string message);

    string public lastMessage;
    address public lastSender;

    function receiveMessage(string calldata message) external {
        lastMessage = message;
        lastSender = msg.sender;
        emit MessageReceived(msg.sender, message);
    }
}
