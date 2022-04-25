# 💻 ZkPad - API

Backend of the ZkPad, 1st launchpad on Starknet.

## Project Setup

```
npm install
```

## Compile

```
npm run start / npm run dev (nodemon)
```

#### .env file sample

```
JWT_SECRET=
DB_URL=
UPLOAD_PATH="/tmp/" -> For Heroku
PINATA_API_KEY=
PINATA_SECRET_API_KEY=
WETH_ADDRESS=""
NETWORK_CHAINID=1
NETWORK_RPC=
```

#### Docs

You can find swagger docs at `/doc`
Run the doc generation with `npm run swagger-autogen`
