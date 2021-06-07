import React, {useEffect, useRef, useState} from "react";
import {Button, Statistic} from "antd";
import {Connection} from "@solana/web3.js";
import {pythMap} from "../api/storage/pyth";
import {parsePriceData} from "@pythnetwork/client";
import {formatUSD} from "../api/numberFormatter";
import BN from 'bn.js';
import {InfoCircleOutlined, EllipsisOutlined} from "@ant-design/icons";

export default function PythPrice(props) {
    const [price, setPrice] = useState<number | undefined>(undefined);
    const mountedRef = useRef(true);

    const splitSymbol = props.symbol.split("/")
    const oracleUrl = `https://pyth.network/markets/#${splitSymbol[0]}/${splitSymbol[1]}`

    const priceKey = pythMap[props.symbol].priceAccount;
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    const fetchFirstTime = async () => {
        try {
            const accountInfo = await connection.getAccountInfo(priceKey, "confirmed");
            if (accountInfo != null && mountedRef.current) {
                const { price }  = parsePriceData(accountInfo.data);
                setPrice(price);
            }
        } catch (err) {
            //no-op
        }

        return () => {
            mountedRef.current = false;
        };
    }

    useEffect(() => {
        fetchFirstTime();
        const subscriptionId = connection.onAccountChange(priceKey, (accountInfo) => {
            const { price }  = parsePriceData(accountInfo.data);
            if (mountedRef.current) {
                setPrice(price);
            }
        });

        return () => {
            connection.removeAccountChangeListener(subscriptionId);
            mountedRef.current = false;
        };
    }, []);

    if (price === undefined) {
        return <></>
    } else {
        return (
            <>
                <Statistic
                    value={price}
                    precision={2}
                    prefix={"$"}
                />
                <Button type="text" href={oracleUrl} target="_blank" icon={<InfoCircleOutlined />} />
            </>
        );
    }
}