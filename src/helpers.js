import message from "./messages/proto";

export function getAuthInfo(pubKeyAny, sequence, feeAmount, gas_limit=220000){
    const signerInfo = new message.cosmos.tx.v1beta1.SignerInfo({
        public_key: pubKeyAny,
        mode_info: { single: { mode: message.cosmos.tx.signing.v1beta1.SignMode.SIGN_MODE_DIRECT } },
        sequence: sequence || 0
    });

    const feeValue = new message.cosmos.tx.v1beta1.Fee({
        amount: [{ denom: "atestfet", amount: feeAmount }],
        gas_limit: gas_limit
    });

    const authInfo = new message.cosmos.tx.v1beta1.AuthInfo({ signer_infos: [signerInfo], fee: feeValue });
    return authInfo;
}

export function getSendTxBody(denom, from, to, amount){
    const msgSend = new message.cosmos.bank.v1beta1.MsgSend({
        from_address: from,
        to_address: to,
        // amount: [{ denom: "atestfet", amount: String(100000) }]		// 6 decimal places (1000000 uatom = 1 ATOM)
        amount: [{ denom: denom, amount: amount }]
    });

    const msgSendAny = new message.google.protobuf.Any({
        type_url: "/cosmos.bank.v1beta1.MsgSend",
        value: message.cosmos.bank.v1beta1.MsgSend.encode(msgSend).finish()
    });

    const txBody = new message.cosmos.tx.v1beta1.TxBody({ messages: [msgSendAny], memo: "" });
    return txBody;
}

export function getDelegateTxBody(denom, delegatorAddress, validatorAddress, amount){
    const msgDelegate = new message.cosmos.staking.v1beta1.MsgDelegate({
        delegator_address: delegatorAddress,
        validator_address: validatorAddress,
        amount: new message.cosmos.base.v1beta1.Coin({ denom: denom, amount: amount })
    });
    
    const msgDelegateAny = new message.google.protobuf.Any({
        type_url: "/cosmos.staking.v1beta1.MsgDelegate",
        value: message.cosmos.staking.v1beta1.MsgDelegate.encode(msgDelegate).finish()
    });

    const txBody = new message.cosmos.tx.v1beta1.TxBody({ messages: [msgDelegateAny], memo: "" });
    return txBody;
}

export function getUndelegateTxBody(denom, delegatorAddress, validatorAddress, amount){
    const msgUndelegate = new message.cosmos.staking.v1beta1.MsgUndelegate({
        delegator_address: delegatorAddress,
        validator_address: validatorAddress,
        amount: new message.cosmos.base.v1beta1.Coin({ denom: denom, amount: amount })
    });
    
    const msgUndelegateAny = new message.google.protobuf.Any({
        type_url: "/cosmos.staking.v1beta1.MsgUndelegate",
        value: message.cosmos.staking.v1beta1.MsgUndelegate.encode(msgUndelegate).finish()
    });

    const txBody = new message.cosmos.tx.v1beta1.TxBody({ messages: [msgUndelegateAny], memo: "" });
    return txBody;
}

export function getRedelegateTxBody(denom, delegatorAddress, srcValidatorAddress, dstValidatorAddress, amount){
    const msgRedelegate = new message.cosmos.staking.v1beta1.MsgBeginRedelegate({
        delegator_address: delegatorAddress,
        validator_src_address: srcValidatorAddress,
        validator_dst_address: dstValidatorAddress,
        amount: new message.cosmos.base.v1beta1.Coin({ denom: denom, amount: amount })
    });
    
    const msgRedelegateAny = new message.google.protobuf.Any({
        type_url: "/cosmos.staking.v1beta1.MsgBeginRedelegate",
        value: message.cosmos.staking.v1beta1.MsgBeginRedelegate.encode(msgRedelegate).finish()
    });

    const txBody = new message.cosmos.tx.v1beta1.TxBody({ messages: [msgRedelegateAny], memo: "" });
    return txBody;
}

export function getWithdrawRewardsTxBody(delegatorAddress, validatorAddress){
    const msgWithdrawRewards = new message.cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward({
        delegator_address: delegatorAddress,
        validator_address: validatorAddress
    })
    
    const msgWithdrawRewardsAny = new message.google.protobuf.Any({
        type_url: "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
        value: message.cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward.encode(msgWithdrawRewards).finish()
        });
    
    const txBody = new message.cosmos.tx.v1beta1.TxBody({ messages: [msgWithdrawRewardsAny], memo: "" });
    return txBody;
}