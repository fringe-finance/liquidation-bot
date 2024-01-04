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
| `PLP_CONTRACT_ADDRESS` | **REQUIRED** The address of the Primary Lending Platform smart contract |
| `PLP_LIQUIDATION_CONTRACT_ADDRESS` | **REQUIRED** The address of the Primary Lending Platform Liquidation contract |
| `PLP_SUBGRAPH_URL` | **REQUIRED** The Subgraph URL that returns Fringe liquidatable positions, needed to perform liquidations |
| `LIQUIDATOR_PRIVATE_KEY` | **REQUIRED** Ethereum private key the Fringe account owner that will do the liquidations. Make sure that "0x" is at the start of it (MetaMask exports private keys without it) |
| `LIQUIDATION_BOT_ADDRESS` | **REQUIRED** The address of the liquidation bot smart contract that perform liquidations on the Fringe Primary Lending contract |
| `EXPLORER_SCAN_API_URL` | **REQUIRED** The API URL of the explorer scan to get gas price. Ex: `https://api-testnet.polygonscan.com/api` |
| `EXPLORER_SCAN_API_KEY` | **REQUIRED** The API Key of the explorer scan to use `EXPLORER_SCAN_API_URL` |
| `COIN_MARKETCAP_NATIVE_COIN_ID` | **REQUIRED** The identifier for the native coin on CoinMarketCap. This ID is essential for fetching data related to the native coin on CoinMarketCap. Ex: MATIC: `3890`|
| `COIN_MARKETCAP_CONVERT_ID` | **REQUIRED** The identifier for the conversion currency on CoinMarketCap. This ID is crucial for converting prices to a specific currency when fetching data from CoinMarketCap. Ex: USD: `2781`|
| `COIN_MARKETCAP_API_KEY` | **REQUIRED** The API Key for accessing the CoinMarketCap API. This key is required to interact with CoinMarketCap's services and retrieve relevant information|
| `PRICE_AGGREGATOR_CONTRACT_ADDRESS` | **REQUIRED** The address of the price aggregator contract|
| `PYTH_PRICE_PROVIDER_CONTRACT_ADDRESS` | **REQUIRED** The address of the Pyth price provider contract|
| `TIME_BEFORE_EXPIRATION` | **REQUIRED** Time before expiration. Ex: 15s: `15`|
| `PYTHNET_PRICE_FEED_ENDPOINT` | **REQUIRED** The endpoint to the PythNet price feed. Ex: `https://hermes.pyth.network`|
| `CACHE_TTL` | Time to live the bot should store the price of native coin, to be used to measure the economic value of performing a liquidation. Defaults to `300000` millis |
| `CRON_EXPRESSION` | **REQUIRED** How frequently the bot should use current account, price, and market index data to check for liquidatable accounts and, if necessary, commit any liquidations on-chain. Ex: 45s: `45 * * * * *` |
| `ENABLE_CHECK_PROFIT` | If it should check have profit to liquidate. Default `true` |


Example for Polygon Mumbai testnet:
  ```
LOG_DIR=./logs

NETWORK_ID=80001
NETWORK_RPC=https://polygon-mumbai.infura.io/v3/bb79babf0666......ee9fdd6a4f7953
PLP_CONTRACT_ADDRESS=0x36DB89F2b2602D488f91FfB172A4B156F6b997a2
PLP_LIQUIDATION_CONTRACT_ADDRESS=0xAd4dA77A7dCFA676F00fc328a927e2a6aa52C1bA
PLP_SUBGRAPH_URL=https://api.studio.thegraph.com/query/37579/test-subgraph-liquidate-bot/version/latest

LIQUIDATOR_PRIVATE_KEY=e5fdde82360d1b2274..................cea21d768565ed7440123
LIQUIDATION_BOT_ADDRESS=0x2DaE912Ab1F6c20f3c0bCefeCc92E9c62BE3960B
EXPLORER_SCAN_API_URL=https://api-testnet.polygonscan.com/api
EXPLORER_SCAN_API_KEY=QZJV2VBK4C6XHK......VZCK4X25VR3
COIN_MARKETCAP_NATIVE_COIN_ID=3890 # MATIC
COIN_MARKETCAP_CONVERT_ID=2781 # USD
COIN_MARKETCAP_API_KEY=cdfb0384............2f665d39be1e

PRICE_AGGREGATOR_CONTRACT_ADDRESS=0x595B8ac57BD1D2c48cE2020984E681AA8aCA9695
PYTH_PRICE_PROVIDER_CONTRACT_ADDRESS=0xC81F2D31b349BD030298E12e6CC9aaF9c0Ea47bF
TIME_BEFORE_EXPIRATION=15
PYTHNET_PRICE_FEED_ENDPOINT=https://hermes.pyth.network

CACHE_TTL = 300000 # optional default 5p=300000ms 
CRON_EXPRESSION = "45 * * * * *"
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