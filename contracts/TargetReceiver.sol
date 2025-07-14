// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TargetReceiver {
    event ReceivedFromRelay(address indexed from, bytes data, bytes32 proofHash);
    event VerifiedAndExecuted(address indexed from, bytes data);
    event DebugProof(bytes32 proofHash, bytes32 computed);

    mapping(bytes32 => bool) public receivedProofs;

    /// @notice Nhận dữ liệu từ RC kèm theo proof
    function receiveRelay(address from, bytes calldata data, bytes32 proofHash) external {
        require(data.length > 0, "Empty data");

        bytes32 expected = keccak256(abi.encodePacked(from, data));
        emit DebugProof(proofHash, expected);

        require(proofHash == expected, "Proof mismatch");
        require(!receivedProofs[proofHash], "Replay detected");

        receivedProofs[proofHash] = true;

        emit ReceivedFromRelay(from, data, proofHash);

        // Giả lập xử lý
        emit VerifiedAndExecuted(from, data);
    }
}
