// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import "openzeppelin-solidity/contracts/token/ERC20/extensions/ERC20Burnable.sol";


contract ERC20Mock is ERC20, ERC20Burnable {
    constructor() ERC20('MZR_FAKE', 'MZR FAKE2') {
		_mint(msg.sender, 10_000_000_000 * 10 ** 18);
	}
}