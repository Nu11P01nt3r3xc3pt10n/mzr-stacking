# Mizar protocol

Usefull commands 

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
node scripts/<script-name.ts>
npx hardhat help
```

# deploy script
start an hardhat node locally 

```shell
npx hardhat node
```

the following command will be deploying the smart contracts on your local node

```shell
npx hardhat run scripts/deploy-script.ts --network localhost
```

## How to setup the farm

1. Deploy smart contract on BSC
2. Initialize smart contract (set admin address, mzr token contract address, tokens per block with correct decimals, no
   rewards claim until timestamp)
3. Deposit MZR to farm smart contract
