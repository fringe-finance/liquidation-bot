# liquidation-bot 🤖
Lending platform liquidation bot - The bot automatically liquidate undercollateralized positions.

## Prerequisites 📋
**Node v16.x.x**

## Set up 🛠️
### Step 1: Update .env file ✨
 
Rename the `.env.example` file to `.env` and update the value of env variables :

| **Env variables**  | **Description** |
| :--- | :--- |
| `LOG_DIR` | The log directory path. Default `./logs` |
| `NETWORK_ID` | **REQUIRED** Ethereum Network ID. This must match the chain ID sent back from `ETHEREUM_NODE_URL` |
| `NETWORK_RPC` | **REQUIRED** The URL of the Blockchain node. Can use multiple RPC |
| `PIT_CONTRACT_ADDRESS` | **REQUIRED** The address of the Primary Index Token smart contract |
| `PIT_LIQUIDATION_CONTRACT_ADDRESS` | **REQUIRED** The address of the Primary Index Token Liquidation contract |
| `PIT_SUBGRAPH_URL` | **REQUIRED** The Subgraph URL that returns Fringe liquidatable positions, needed to perform liquidations |
| `LIQUIDATOR_PRIVATE_KEY` | **REQUIRED** Ethereum private key the Fringe account owner that will do the liquidations. Make sure that "0x" is at the start of it (MetaMask exports private keys without it) |
| `LIQUIDATION_BOT_ADDRESS` | **REQUIRED** The address of the liquidation bot smart contract that perform liquidations on the Fringe Primary Lending contract |
| `EXPLORER_SCAN_API_URL` | **REQUIRED** The API URL of the explorer scan to get gas price. Ex: `https://api-goerli.etherscan.io/api` |
| `EXPLORER_SCAN_API_KEY` | **REQUIRED** The API Key of the explorer scan to use `EXPLORER_SCAN_API_URL` |
| `COIN_GECKO_NATIVE_COIN_ID` | **REQUIRED** The ID of native coin get from coin list COIN GECKO API. This must match the chain ID `NETWORK_ID` |
| `CACHE_TTL` | Time to live the bot should store the price of native coin, to be used to measure the economic value of performing a liquidation. Defaults to `300000` millis |
| `CRON_EXPRESSION` | **REQUIRED** How frequently the bot should use current account, price, and market index data to check for liquidatable accounts and, if necessary, commit any liquidations on-chain. Ex: 10s: `*/10 * * * * *` |
| `ENABLE_CHECK_PROFIT` | If it should check have profit to liquidate. Default `true` |


Example for Goerli testnet:
  ```
LOG_DIR=./logs

NETWORK_ID=5
NETWORK_RPC='https://rpc.ankr.com/eth_goerli'
PIT_CONTRACT_ADDRESS='0x73769069b78a2D407865919414215Eb36f71D6Fb'
PIT_LIQUIDATION_CONTRACT_ADDRESS='0x1B07DDc28B1644d4b859226d26Cb90DC5Cd614Ae'
PIT_SUBGRAPH_URL='https://api.thegraph.com/subgraphs/name/locnguyenlotussoft/plp-goerli-test'

LIQUIDATOR_PRIVATE_KEY=0xe5fdde82...49824d93a1
LIQUIDATION_BOT_ADDRESS=0x731551Da0BdD04B17bE9980f289B5F1912BA0575
EXPLORER_SCAN_API_URL=https://api-goerli.etherscan.io/api
EXPLORER_SCAN_API_KEY=Y1HAJ...Q9JIDE66GARCN5
COIN_GECKO_NATIVE_COIN_ID=ethereum # coin gecko

CACHE_TTL = 300000 # optional default 5p=300000ms 
CRON_EXPRESSION = "*/10 * * * * *"
ENABLE_CHECK_PROFIT=true
  ```

### Step 2: Run liquidation bot 🚀
Install dependencies:
  ```
yarn install
  ```

Run liquidation bot in terminal:
  ```
yarn start:prod
  ```

Or run as background process with pm2:
  ```
pm2 start dist/main --name liquidation-bot
  ```

## Configuration for mainnet ⚙️

### Ethereum mainnet
  ```
NETWORK_RPC='https://mainnet.infura.io/v3/'
PIT_CONTRACT_ADDRESS=''
PIT_LIQUIDATION_CONTRACT_ADDRESS=''
PIT_SUBGRAPH_URL=''
  ```

### Arbitrum mainnet
  ```
NETWORK_RPC='https://arb1.arbitrum.io/rpc'
PIT_CONTRACT_ADDRESS=’0x5855F919E89c5cb5e0052Cb09addEFF62EB9339A’     
PIT_LIQUIDATION_CONTRACT_ADDRESS=’0x0438b74336E042BB596Be593cfF8D84FD0D8935B’
PIT_SUBGRAPH_URL=’https://api.studio.thegraph.com/query/57877/fringe-plpv2-arb-mainnet2/version/latest'
  ```

### Polygon mainnet
  ```
NETWORK_RPC='https://polygon-mainnet.infura.io'
PIT_CONTRACT_ADDRESS=’0x286475366f736fcEeB0480d7233ef169AE614Fe4’
PIT_LIQUIDATION_CONTRACT_ADDRESS=’0x4cc524E21222Ec40E586f7C6da21a4F4DD2B1D2f’
PIT_SUBGRAPH_URL='https://api.studio.thegraph.com/query/57877/fringe-plpv2-poly-mainnet/version/latest'
  ```

### Optimism mainnet
  ```
NETWORK_RPC='https://mainnet.optimism.io/'
PIT_CONTRACT_ADDRESS=’0x088F23ac0c07A3Ce008FB88c4bacFF06FECC6158’
PIT_LIQUIDATION_CONTRACT_ADDRESS=’0xfE56364C8157E7A459693FE481bB2d138949cB47’
PIT_SUBGRAPH_URL='https://api.thegraph.com/subgraphs/name/brainspacer/fringe-plpv2-opt-mainnet2'
  ```

### zkSync Era mainnet
  ```
NETWORK_RPC='https://mainnet.era.zksync.io'
PIT_CONTRACT_ADDRESS=’’
PIT_LIQUIDATION_CONTRACT_ADDRESS=’’
PIT_SUBGRAPH_URL=''
  ```

## Configuration for development testnet ⚙️

### Ethereum Goerli
  ```
NETWORK_RPC='https://rpc.ankr.com/eth_goerli'
PIT_CONTRACT_ADDRESS='0x73769069b78a2D407865919414215Eb36f71D6Fb'
PIT_LIQUIDATION_CONTRACT_ADDRESS='0x1B07DDc28B1644d4b859226d26Cb90DC5Cd614Ae'
PIT_SUBGRAPH_URL='https://api.thegraph.com/subgraphs/name/locnguyenlotussoft/plp-goerli-test'
  ```

### Polygon Mumbai
  ```
NETWORK_RPC='https://polygon-testnet.public.blastapi.io'
PIT_CONTRACT_ADDRESS='0x7f17feb4A90387A1D9b61CFDC62D3bdc7C47749e'
PIT_LIQUIDATION_CONTRACT_ADDRESS='0x7EB8DEd086815af432b215dBb46599A955aeF339'
PIT_SUBGRAPH_URL='https://api.thegraph.com/subgraphs/name/locnguyenlotussoft/plp-mumbai-test'
  ```

### Optimism Goerli
  ```
NETWORK_RPC='https://goerli.optimism.io'
PIT_CONTRACT_ADDRESS='0xB9435E797BCdDb5b4fC78a093c21a66Cc7589D7f'
PIT_LIQUIDATION_CONTRACT_ADDRESS='0xFDD7173A284E3f909fC4e290267ab0207a9549Fe'
PIT_SUBGRAPH_URL='https://api.thegraph.com/subgraphs/name/locnguyenlotussoft/plp-optimism-goerli-test'
  ```

### Arbitrum Goerli
  ```
NETWORK_RPC='https://arb-goerli.g.alchemy.com/v2/iUSHu7xZ3y6d7Kd8MV_qc-iyLu27kFcW'
PIT_CONTRACT_ADDRESS='0x51dBAB798353434Ab379cc06F79545a7Bc3528f5'
PIT_LIQUIDATION_CONTRACT_ADDRESS='0xD5035c1d4e2B3a15D7b90BAa36c306e77Fa7093A'
PIT_SUBGRAPH_URL='https://api.thegraph.com/subgraphs/name/locnguyenlotussoft/plp-arbitrum-goerli-test'
   ```
