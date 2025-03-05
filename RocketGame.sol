// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RocketGame {
    event ActionLogged(address indexed player, string action, uint256 timestamp);

    function logAction(string memory action) public {
        emit ActionLogged(msg.sender, action, block.timestamp);
    }
} 