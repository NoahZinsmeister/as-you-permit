![As you wish.](https://imagesvc.meredithcorp.io/v3/mm/gif?url=https%3A%2F%2Fstatic.onecms.io%2Fwp-content%2Fuploads%2Fsites%2F13%2F2016%2F05%2F02%2FAsYouWish1.gif)

[EIP-2612](https://eips.ethereum.org/EIPS/eip-2612)

# Development

1. `cp .env.example .env`
2. Populate `.env` with a valid `URL_MAINNET`
3. `yarn`
4. `yarn start`
5. `yarn test`

# TODOs

- add support for other tokens
  - DAI
  - CHAI
  - Radicle
  - Stake (?)

- add bytecode fetching wrappers for simulation purposes
  - https://api.etherscan.io/api?module=proxy&action=eth_getCode&address=0xB7277a6e95992041568D9391D09d0122023778A2&tag=latest&apikey=YourApiKeyToken
  - https://eth.wiki/json-rpc/API
  - test that returned bytecode matches that which was supplied

- add support for token factories?
  - UNI-V2 LP shares

- directly expose functionality to gather signatures against a known variant?
