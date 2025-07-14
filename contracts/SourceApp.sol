// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SourceApp {
    event MessagePosted(address indexed sender, string message);
    event ContextSent(address to, bytes data, uint256 nonce);

    uint256 public nonce;

    /// @notice Gửi context (ctx) từ SC đến một address cụ thể (relay)
    /// @param to - Địa chỉ dự định nhận (relay hoặc DC)
    /// @param data - Payload dữ liệu cần gửi
    function sendContext(address to, bytes calldata data) external {
        emit ContextSent(to, data, nonce);
        nonce++;
    }

    function postMessage(string calldata message) external {
        emit MessagePosted(msg.sender, message);
    }
}
