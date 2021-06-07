import React, { useState } from 'react';
import {Modal, Select} from "antd";
import { Form, DatePicker, InputNumber } from 'antd';
import SymbolSelect from "./SymbolSelect";
import {Option} from "antd/es/mentions";
import {useBinaryOptionsProgram} from "../api/BinaryOptionsProgramProvider";
import {useWallet} from "../utils/wallet";
import moment from "moment";
import {isNumber} from "util";
import {createMarket} from "../api/BinaryOptionController";
import {useConnection} from "../utils/connection";
import { pythMap } from "../api/storage/pyth";
import {CreateMarketRequest} from "../api/model/CreateMarketRequest";
import BN from "bn.js";
import {notify} from "../utils/notifications";
import {formatUSDNum} from "../api/numberFormatter";
import {notifyError} from "./errorNotification";

export default function MakeMarketDialog(props) {
    let [symbol, setSymbol] = useState<string>(props.symbol);
    let [date, setDate] = useState(moment());
    let [condition, setCondition] = useState("Above");
    let [value, setValue] = useState(pythMap[symbol].defaultPrice);
    let [isLoading, setIsLoading] = useState(false);
    const program = useBinaryOptionsProgram();
    const wallet = useWallet();
    const connection = useConnection();

    const onSubmit = async () => {
        if (wallet.wallet === undefined || !wallet.connected) {
            notify({
                "message": "Connect Wallet",
                "description": "Need to connect wallet to create market",
                "type": "error",
            })
            return;
        }
        setIsLoading(true);
        const createMarketResult : CreateMarketRequest = {
            symbol: symbol,
            date,
            value: new BN(value),
            condition,
        }
        try {
            const [createMarketTx, marketPubKey] = await createMarket(program, wallet.wallet, connection, createMarketResult);
            props.onMarketCreated(createMarketTx, marketPubKey);
        } catch (err) {
            notifyError();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            title={'Make Market'}
            onCancel={() => props.setCreateMarketModel(false)}
            visible={props.show}
            okText={'Make'}
            onOk={onSubmit}
            confirmLoading={isLoading}
        >
            <Form layout="vertical">
                <Form.Item label="Pair">
                    <SymbolSelect
                        value={symbol}
                        style={{}}
                        onSelect={val => {
                            setValue(pythMap[val].defaultPrice)
                            setSymbol(val)
                        }}
                    />
                </Form.Item>
                <Form.Item label="Date (UTC)">
                    <DatePicker defaultValue={date} onSelect={val => setDate(val)}/>
                </Form.Item>
                <Form.Item label="Condition">
                    <Select defaultValue={condition} onSelect={val => setCondition(val)}>
                        <Option value="Above">Above</Option>
                        <Option value="Below">Below</Option>
                    </Select>
                </Form.Item>
                <Form.Item label="Price">
                    <InputNumber
                        value={value}
                        onChange={val => isNumber(val) ? setValue(val) : ''} />
                </Form.Item>
            </Form>
        </Modal>
    );
}
