/*
    Developed / Developing by Cosmostation
	Forked from @Cosmostation/cosmosjs
	Adapted and extended for Mobix and Fetch 
    [WARNING] CosmosJS and this extension is under ACTIVE DEVELOPMENT and should be treated as alpha version. We will remove this warning when we have a release that is stable, secure, and propoerly tested.
*/
import fetch from 'node-fetch';
import request from "request";
import * as bip32 from "bip32";
import * as bip39 from "bip39";
import * as bech32 from "bech32";
import secp256k1 from "secp256k1";
import crypto from "crypto";
// import bitcoinjs from "bitcoinjs-lib";
import btcaddr from "./btcaddr.js";
import message from "./messages/proto.js";
import { getAuthInfo, getSendTxBody, getDelegateTxBody, getWithdrawRewardsTxBody, getUndelegateTxBody, getRedelegateTxBody } from './helpers.js';

export class Cosmos {
	constructor(url, chainId) {
		this.url = url;
		this.chainId = chainId;
		this.path = "m/44'/118'/0'/0/0"; //"m/44'/118'/0'/0" // both work
		this.bech32MainPrefix = "fetch"; //"cosmos"
	}

	// get a deterministic HD wallet from an unique entropy
	getMnemonicFromEntropy(entropy) {
		return bip39.default.entropyToMnemonic(entropy);
	}

	// strength(128): 12 words, strength(256): 24 words
	getRandomMnemonic(strength = 256) {
		return bip39.default.generateMnemonic(strength);
	}

	setBech32MainPrefix(value) {
		this.bech32MainPrefix = value;
		if (!this.bech32MainPrefix) throw new Error("bech32MainPrefix object was not set or invalid");
	}

	setPath(value) {
		this.path = value;
		if (!this.path) throw new Error("path object was not set or invalid");
	}

	getAddress(mnemonic, checkSum = true) {
		if (typeof mnemonic !== "string") {
		    throw new Error("mnemonic expects a string")
		}
		if (checkSum) {
			if (!bip39.default.validateMnemonic(mnemonic)) throw new Error("mnemonic phrases have invalid checksums");
		}
		const seed = bip39.default.mnemonicToSeed(mnemonic);
		const node = bip32.default.fromSeed(seed)
		const child = node.derivePath(this.path)
		const words = bech32.default.toWords(child.identifier);
		return bech32.default.encode(this.bech32MainPrefix, words);
	}

	getAddressFromPubKey(publicKey){	
		if (publicKey.length > 33) {
            publicKey = publicKey.slice(5, publicKey.length);
        }
		
        return bech32.encode(this.bech32MainPrefix, bech32.toWords(btcaddr(publicKey)));
	}

	getECPairPriv(mnemonic) {
		if (typeof mnemonic !== "string") {
		    throw new Error("mnemonic expects a string")
		}
		const seed = bip39.default.mnemonicToSeed(mnemonic);
		const node = bip32.default.fromSeed(seed);
		const child = node.derivePath(this.path);
		return child.privateKey;
	}

	getPubKey(privKey) {
		const pubKeyByte = secp256k1.publicKeyCreate(privKey);
		return pubKeyByte;
	}

	getPubKeyAny(privKey) {
		const pubKeyByte = secp256k1.publicKeyCreate(privKey);
		var buf1 = new Buffer.from([10]);
		var buf2 = new Buffer.from([pubKeyByte.length]);
		var buf3 = new Buffer.from(pubKeyByte);
		const pubKey = Buffer.concat([buf1, buf2, buf3]);
		const pubKeyAny = new message.google.protobuf.Any({
			type_url: "/cosmos.crypto.secp256k1.PubKey",
			value: pubKey
		});
		return pubKeyAny;
	}
	
	getAccounts(address) {
		let accountsApi = "/cosmos/auth/v1beta1/accounts/";
		return fetch(this.url + accountsApi + address).then(response => response.json())
	}

	sign(txBody, authInfo, accountNumber, privKey) {
		const bodyBytes = message.cosmos.tx.v1beta1.TxBody.encode(txBody).finish();
		const authInfoBytes = message.cosmos.tx.v1beta1.AuthInfo.encode(authInfo).finish();
		const signDoc = new message.cosmos.tx.v1beta1.SignDoc({
			body_bytes: bodyBytes,
			auth_info_bytes: authInfoBytes,
			chain_id: this.chainId,
			account_number: Number(accountNumber)
		});
		let signMessage = message.cosmos.tx.v1beta1.SignDoc.encode(signDoc).finish();
		const hash = crypto.createHash("sha256").update(signMessage).digest();
		const sig = secp256k1.sign(hash, Buffer.from(privKey));
		const txRaw = new message.cosmos.tx.v1beta1.TxRaw({
		    body_bytes: bodyBytes,
		    auth_info_bytes: authInfoBytes,
		    signatures: [sig.signature],
		});
		const txBytes = message.cosmos.tx.v1beta1.TxRaw.encode(txRaw).finish();
		// const txBytesBase64 = Buffer.from(txBytes, 'binary').toString('base64');
		return txBytes;
	}

	// "BROADCAST_MODE_UNSPECIFIED", "BROADCAST_MODE_BLOCK", "BROADCAST_MODE_SYNC", "BROADCAST_MODE_ASYNC"
	broadcast(signedTxBytes, broadCastMode = "BROADCAST_MODE_SYNC") {
		const txBytesBase64 = Buffer.from(signedTxBytes, 'binary').toString('base64');

		var options = { 
			method: 'POST',
			url: this.url + '/cosmos/tx/v1beta1/txs',
			headers: 
			{ 'Content-Type': 'application/json' },
			body: { tx_bytes: txBytesBase64, mode: broadCastMode },
			json: true 
		};

		return new Promise(function(resolve, reject){
	        request(options, function (error, response, body) {
	            if (error) return reject(error);
	            try {
	                resolve(body);
	            } catch(e) {
	                reject(e);
	            }
	        });
	    });
	}
}

export class Wallet {
	constructor(cosmos, mnemonic=null, privKey=null){
		this.cosmos = cosmos;
		if(mnemonic){
			this.mnemonic = mnemonic;
			this.privKey = cosmos.getECPairPriv(this.mnemonic);
			this.pubKeyAny = cosmos.getPubKeyAny(this.privKey);
			this.address = cosmos.getAddress(this.mnemonic);
		} else if (privKey){
			this.mnemonic = "";
			this.privKey = privKey;
			this.pubKeyAny = cosmos.getPubKeyAny(this.privKey);
			this.pubKey = cosmos.getPubKey(this.privKey);
			this.address = cosmos.getAddressFromPubKey(this.pubKey);
		} else {
			this.mnemonic = cosmos.getRandomMnemonic();
			this.privKey = cosmos.getECPairPriv(this.mnemonic);
			this.pubKeyAny = cosmos.getPubKeyAny(this.privKey);
			this.address = cosmos.getAddress(this.mnemonic);
		}
	}

	getBalance(){
		return fetch(`${this.cosmos.url}/cosmos/bank/v1beta1/balances/` + this.address)
		.then(response => response.json())
		.then(data => data);
	}

	getStakingRewards(){
		return fetch(`${this.cosmos.url}/distribution/delegators/${this.address}/rewards`)
		.then(response => response.json())
		.then(data => data.result);  
	}

	getDelegations(){
		return fetch(`${this.cosmos.url}/staking/delegators/${this.address}/delegations`)
		.then(response => response.json())
		.then(data => data.result);  
	}

	send(denom, to, amount){
		return this.cosmos.getAccounts(this.address).then(async data => {
		
			const txBody = getSendTxBody(denom, this.address, to, amount);
		
			const authInfo = getAuthInfo(this.pubKeyAny, data.account.sequence, String(1));
		
			// -------------------------------- sign --------------------------------
			const signedTxBytes = this.cosmos.sign(txBody, authInfo, data.account.account_number, this.privKey);
			return this.cosmos.broadcast(signedTxBytes); 
	
		}).then(response => response.tx_response);
	}

	delegate(denom, validatorAddress, amount){
		return this.cosmos.getAccounts(this.address).then(async data => {
		
			const txBody = getDelegateTxBody(denom, this.address, validatorAddress, amount);
		
			const authInfo = getAuthInfo(this.pubKeyAny, data.account.sequence, String(1));
		
			// -------------------------------- sign --------------------------------
			const signedTxBytes = this.cosmos.sign(txBody, authInfo, data.account.account_number, this.privKey);
			return this.cosmos.broadcast(signedTxBytes); 
	
		}).then(response => response.tx_response);
	}

	undelegate(denom, validatorAddress, amount){
		return this.cosmos.getAccounts(this.address).then(async data => {
		
			const txBody = getUndelegateTxBody(denom, this.address, validatorAddress, amount);
		
			const authInfo = getAuthInfo(this.pubKeyAny, data.account.sequence, String(1));
		
			// -------------------------------- sign --------------------------------
			const signedTxBytes = this.cosmos.sign(txBody, authInfo, data.account.account_number, this.privKey);
			return this.cosmos.broadcast(signedTxBytes); 
	
		}).then(response => response.tx_response);
	}

	undelegateAll(denom, validatorAddress){
		return this.cosmos.getAccounts(this.address).then(async data => {
			const amount = await this.getDelegations().then(tx_response => tx_response[0].balance.amount);
		
			const txBody = getUndelegateTxBody(denom, this.address, validatorAddress, amount);
		
			const authInfo = getAuthInfo(this.pubKeyAny, data.account.sequence, String(1));
		
			// -------------------------------- sign --------------------------------
			const signedTxBytes = this.cosmos.sign(txBody, authInfo, data.account.account_number, this.privKey);
			return this.cosmos.broadcast(signedTxBytes); 
	
		}).then(response => response.tx_response);
	}

	redelegate(denom, srcValidatorAddress, dstValidatorAddress, amount){
		return this.cosmos.getAccounts(this.address).then(async data => {
		
			const txBody = getRedelegateTxBody(denom, this.address, srcValidatorAddress, dstValidatorAddress, amount);
		
			const authInfo = getAuthInfo(this.pubKeyAny, data.account.sequence, String(1));
		
			// -------------------------------- sign --------------------------------
			const signedTxBytes = this.cosmos.sign(txBody, authInfo, data.account.account_number, this.privKey);
			return this.cosmos.broadcast(signedTxBytes); 
	
		}).then(response => response.tx_response);
	}

	redelegateAll(denom, srcValidatorAddress, dstValidatorAddress){
		return this.cosmos.getAccounts(this.address).then(async data => {
			const amount = await this.getDelegations().then(tx_response => tx_response.filter(delegation => delegation.delegation.validator_address === srcValidatorAddress)[0].balance.amount);
		
			const txBody = getRedelegateTxBody(denom, this.address, srcValidatorAddress, dstValidatorAddress, amount);
		
			const authInfo = getAuthInfo(this.pubKeyAny, data.account.sequence, String(1));
		
			// -------------------------------- sign --------------------------------
			const signedTxBytes = this.cosmos.sign(txBody, authInfo, data.account.account_number, this.privKey);
			return this.cosmos.broadcast(signedTxBytes); 
	
		}).then(response => response.tx_response);
	}

	withdrawStakingRewards(validatorAddress){
		return this.cosmos.getAccounts(this.address).then(async data => {
			
			const txBody = getWithdrawRewardsTxBody(this.address, validatorAddress);
		
			const authInfo = getAuthInfo(this.pubKeyAny, data.account.sequence, String(1));
		
			// -------------------------------- sign --------------------------------
			const signedTxBytes = this.cosmos.sign(txBody, authInfo, data.account.account_number, this.privKey);
			return this.cosmos.broadcast(signedTxBytes); 
	
		}).then(response => response.tx_response);
	}
}
