import React, { useState } from 'react';
import {Modal, Select} from "antd";
import { Form, DatePicker, InputNumber } from 'antd';
import SymbolSelect from "./SymbolSelect";
import {Option} from "antd/es/mentions";
import {useBinaryOptionsProgram} from "../api/BinaryOptionsProgramProvider";
import {useWallet} from "../utils/wallet";
import {createMarket, makeOffer} from "../api/BinaryOptionController";
import {useConnection} from "../utils/connection";
import BN from "bn.js";
import {notify} from "../utils/notifications";
import {MakeOfferRequest} from "../api/model/MakeOfferRequest";
import moment from "moment";
import {Market} from "../api/model/Market";
import {formatUSD, SOL_EXP} from "../api/numberFormatter";
import {calculateTotalAmount, calculateToWinAmount} from "../api/offersMath";
import {isNumber} from "util";
import {formatMarketTitle} from "../api/marketFormatter";
import {notifyError} from "./errorNotification";

export default function MakeOfferDialog(props) {
    let [outcome, setOutcome] = useState('Yes');
    let [amount, setAmount] = useState(5);
    let [isLoading, setIsLoading] = useState(false);
    const program = useBinaryOptionsProgram();
    const wallet = useWallet();
    const connection = useConnection();

    const onSubmit = async () => {
        if (program === null ||wallet.wallet === undefined || !wallet.connected) {
            notify({
                "message": "Connect Wallet",
                "description": "Need to connect wallet to make offer",
                "type": "error",
            })
            return;
        }
        setIsLoading(true);
        const userBalance = await connection.getBalance(wallet.wallet.publicKey, 'confirmed');
        if ((new BN(amount)).mul(new BN(10**9)).gt(new BN(userBalance.toString()))) {
            notify({
                "message": "Insufficient funds",
                "description": "You don't have enough SOL to make offer",
                "type": "error",
            })
            setIsLoading(false);
            return;
        }

        const makeOfferRequest : MakeOfferRequest = {
            market: props.market,
            outcome,
            amount: new BN(amount),
        }
        try {
            const [makeOfferTx, offerPublicKey] = await makeOffer(program, wallet.wallet, connection, makeOfferRequest);
            await props.onMakeOffer(makeOfferTx, offerPublicKey, props.market.key);
        } catch (err) {
            setIsLoading(false);
            notifyError();
        }
    };

    return (
        <Modal
            title={formatMarketTitle(props.market)}
            onCancel={() => props.setShowMakerOfferModal(false)}
            visible={props.show}
            okText={'Make Offer'}
            onOk={onSubmit}
            confirmLoading={isLoading}
        >
            <Form layout="vertical">
                <Form.Item label="Outcome">
                    <Select value={outcome} onSelect={val => setOutcome(val)}>
                        <Option value="Yes">Yes</Option>
                        <Option value="No">No</Option>
                    </Select>
                </Form.Item>
                <Form.Item label="Bet (SOL)">
                    <InputNumber
                        defaultValue={amount}
                        onChange={val => isNumber(val) ? setAmount(val) : ''}
                    />
                </Form.Item>
                <Form.Item label="Win (SOL)">
                    <InputNumber value={calculateToWinAmount(new BN(amount)).toNumber()} disabled={true}/>
                </Form.Item>
            </Form>
        </Modal>
    );
}
