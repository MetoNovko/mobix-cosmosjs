# mobix-cosmosjs
Cosmosjs extension and adaptation for the purposes of the Mobix project on Fetch.ai

## Install

```
npm install mobix-cosmosjs
```

## Usage

```js
import { Cosmos, Wallet } from 'mobix-cosmosjs';

const chainId = "andromeda-1";
const restEndpoint = "https://rest-andromeda.fetch.ai:443";

const cosmos = new Cosmos(restEndpoint, chainId);
cosmos.setBech32MainPrefix("fetch");
cosmos.setPath("m/44'/118'/0'/0"); //"m/44'/118'/0'/0/0"

const wallet = new Wallet(cosmos);

console.log(wallet)
```

## Important

You might need to use these options when calling your main script:
```
node --es-module-specifier-resolution=node --experimental-modules index.js
```

and ``"type": "module"`` in your ``package.json`` file, because of ES modules.