import { Cosmos, Wallet } from '../src'

const chainId = "andromeda-1";
const restEndpoint = "https://rest-andromeda.fetch.ai:443";

const cosmos = new Cosmos(restEndpoint, chainId);
cosmos.setBech32MainPrefix("fetch");
cosmos.setPath("m/44'/118'/0'/0");

const wallet = new Wallet(cosmos);

console.log(wallet)

// Usage:
// wallet.send(denom, toAddress, amount)
// wallet.delegate(denom, validatorAddress, amount)
// Check Wallet class for more...