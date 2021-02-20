![As you wish.](https://imagesvc.meredithcorp.io/v3/mm/gif?url=https%3A%2F%2Fstatic.onecms.io%2Fwp-content%2Fuploads%2Fsites%2F13%2F2016%2F05%2F02%2FAsYouWish1.gif)

# TODOs

- add fallback option for unknown contracts that can't be simulated but adhere to a valid variant

- add some kind of integration testing for known contracts - important for contracts that can't be simulated (e.g. USDC)
  - https://hardhat.org/guides/mainnet-forking.html
  - https://github.com/trufflesuite/ganache-cli#options

- add bytecode lookup for simulation purposes
  - https://api.etherscan.io/api?module=proxy&action=eth_getCode&address=0xB7277a6e95992041568D9391D09d0122023778A2&tag=latest&apikey=YourApiKeyToken
  - https://eth.wiki/json-rpc/API

- add support for other tokens
  - DAI
  - CHAI
  - Radicle

- add support for token factories
  - UNI-V2 LP shares
