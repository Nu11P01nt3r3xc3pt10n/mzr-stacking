// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "./interfaces/IStacking.sol";

contract Stacking is Initializable, AccessControlUpgradeable, PausableUpgradeable, IStacking {

    using SafeERC20Upgradeable for IERC20Upgradeable;

    // Info of each user.
    struct UserInfo {
        uint256 stackedAmount;         
        uint256 withdrawableAmount;
        uint256 requestedWithdrawalTimestamp;    // Requested Withdrawal timestamp
    }

    // Info of each pool.
    struct PoolInfo {
        IERC20Upgradeable lpToken;  // Address of LP token contract. 
        uint256 totalDeposited;     //total tokens deposited in address of a pool. [totalDeposited]=lpToken
    }
   
    // Info of each pool.
    PoolInfo[] public poolInfo;
    
    // Info of each user that stakes LP tokens.
    mapping (uint16 => mapping (address => UserInfo)) public userInfo;

    event PoolAdded(uint256 indexed pid);
    event Deposit(address indexed user, uint256 indexed pid, uint256 amountLiquidity);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amountLiquidity);

    function initialize(
        address _admin
    ) public initializer {
        __AccessControl_init();
        __Pausable_init_unchained();
        _setupRole(DEFAULT_ADMIN_ROLE, _admin);
    }

    function version() public pure returns (uint32){
        //version in format aaa.bbb.ccc => aaa*1E6+bbb*1E3+ccc;
        return uint32(100100100);
    }

    /**
    * @dev Throws if called by any account other than the one with the Admin role granted.
    */
    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Caller is not the Admin");
        _;
    }
   
    // Add a new lp to the pool. Can only be called by the owner.
    // XXX DO NOT add the same LP token more than once. Rewards will be messed up if you do.
    function addPool(address _lpTokenAddress) public onlyAdmin {
        IERC20Upgradeable _lpToken = IERC20Upgradeable(_lpTokenAddress);
    
        poolInfo.push(PoolInfo({
            lpToken: _lpToken,
            totalDeposited: 0
        }));
        emit PoolAdded(poolInfo.length-1);
    }

    //************* ADMIN FUNCTIONS ********************************
    function pause() onlyAdmin public {
        super._pause();
    }
   
    function unpause() onlyAdmin public {
        super._unpause();
    }
    
    //************* PUBLIC FUNCTIONS ********************************    
    function deposit(uint16 _pid, uint256 _amount) public override whenNotPaused {
        depositTo(_pid, _amount, msg.sender);
    }

    function depositTo(uint16 _pid, uint256 _amount, address _beneficiary) public override whenNotPaused {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_beneficiary];
        if(_amount > 0) {
            pool.lpToken.safeTransferFrom(address(msg.sender), address(this), _amount);
            user.amount += _amount;
            user.withdrawableAmount = 0;
            pool.totalDeposited += _amount;
        }
        emit Deposit(_beneficiary, _pid, _amount);
    }

    function requestWithdrawal(uint16 _pid, uint256 _amount) public override whenNotPaused {

        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.stackedAmount <= _amount, "You cannot withdraw more than what you stacked");
        user.stackedAmount -= _amount;
        user.withdrawableAmount = _amount;
        user.requestedWithdrawalTimestamp = block.timestamp;

    }
    
    function withdraw(uint16 _pid, uint256 _amount) public override whenNotPaused {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.withdrawableAmount >= _amount, "Withdrawal amount is greater than withdrawable");                
        require(block.timestamp >= user.requestedWithdrawalTimestamp + 604800, "Withdrawal is not active yet"); // 7 days
        if(_amount > 0) {
            user.withdrawableAmount -= _amount;
            user.requestedWithdrawalTimestamp = 0;
            pool.totalDeposited -= _amount;
            pool.lpToken.safeTransfer(msg.sender, _amount);
            emit Withdraw(msg.sender, _pid, _amount);
        }
    }
    
    //************* VIEW FUNCTIONS ********************************

    function getPoolLength() external override view returns (uint256) {
        return poolInfo.length;
    }

    function getPool(uint16 _index) external override view returns (address, uint256) {
        require (_index < poolInfo.length, "index incorrect");
        PoolInfo memory pool = poolInfo[_index];
        return (address(pool.lpToken), pool.totalDeposited);
    }   
    
    function getUserInfo(uint16 _pid, address _user) external override view returns (uint256, uint256, uint256 ) {        
        UserInfo storage user = userInfo[_pid][_user];        
        return (
            user.stackedAmount,
            user.withdrawableAmount,
            user.requestedWithdrawalTimestamp
        );
    }    

}