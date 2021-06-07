import React, { useState} from 'react';
import {Button, Popconfirm, Table} from "antd";
import {formatSOL} from "../api/numberFormatter";
import {calculateToWinAmount} from "../api/offersMath";
import {useBinaryOptionsProgram} from "../api/BinaryOptionsProgramProvider";
import {useWallet} from "../utils/wallet";
import {useConnection} from "../utils/connection";
import {notify} from "../utils/notifications";
import {takeOffer} from "../api/BinaryOptionController";
import {Offer} from "../api/model/Offer";
import {formatConfirmationMessage} from "../api/offerFormatter";
import {Market} from "../api/model/Market";
import {notifyError} from "./errorNotification";
import BN from 'bn.js';

export default function OfferTable(props: {key: string, market: Market, offers: {[key:string]: Offer}, onTakeOffer: any}) {
    const [selectedOffer, setSelectedOffer] = React.useState("");
    const [loading, setLoading] = React.useState(false);

    const filteredOffers = Object.values(props.offers).filter(offer => offer.status === 'open');
    const sortedOffers = filteredOffers.sort((a: Offer, b: Offer) => (b.totalAmount.sub(b.betAmount)).sub(a.totalAmount.sub(a.betAmount)).toNumber());

    const program = useBinaryOptionsProgram();
    const wallet = useWallet();
    const connection = useConnection();

    const onTake = async (offer: Offer) => {
        if (wallet.wallet === undefined || !wallet.connected) {
            notify({
                "message": "Connect Wallet",
                "description": "Need to connect wallet to take offer",
                "type": "error",
            })
            return;
        }
        setLoading(true);
        const userBalance = await connection.getBalance(wallet.wallet.publicKey, 'confirmed');
        if (offer.totalAmount.sub(offer.betAmount).gt(new BN(userBalance.toString()))) {
            notify({
                "message": "Insufficient funds",
                "description": "You don't have enough SOL to take offer",
                "type": "error",
            })
            setSelectedOffer("");
            setLoading(false);
            return;
        }

        try {
            const takeOfferIx = await takeOffer(program, wallet.wallet, connection, props.market, offer);
            await props.onTakeOffer(takeOfferIx, offer);
        } catch (err) {
            notifyError();
        }
    }

    const offersTableColumns = [
        {
            title: 'Outcome',
            dataIndex: 'outcome',
            key: 'outcome',
            render: (text, record) => record.outcome === 'Yes' ? 'No' : 'Yes',
            filters: [
                {
                    "text": "Yes",
                    "value": "No"
                },
                {
                    "text": "No",
                    "value": "Yes"
                }
            ],
            onFilter: (value, record) => record.outcome === value,
        },
        {
            title: 'Bet',
            dataIndex: 'bet',
            key: 'bet',
            render: (text, record) => formatSOL(calculateToWinAmount(record.betAmount)),
            sorter: (a: Offer, b: Offer) => a.betAmount.lt(b.betAmount) ? -1 : 1,
        },
        {
            title: 'Win',
            dataIndex: 'win',
            key: 'win',
            render: (text, record) => formatSOL(record.betAmount),
            sorter: (a: Offer, b: Offer) => a.totalAmount.sub(a.betAmount).gt(b.totalAmount.sub(b.betAmount)) ? 1 : -1,
        },
        {
            title: '',
            dataIndex: 'action',
            key: 'action',
            render: (text, record) => {
                return (
                    <Popconfirm
                        title={formatConfirmationMessage(record, props.market)}
                        icon={false}
                        visible={selectedOffer === record.key.toString() && !loading}
                        onConfirm={() => onTake(record)}
                        okButtonProps={{ loading: loading }}
                        onCancel={() => setSelectedOffer("")}
                    >
                        <Button
                            type="link"
                            onClick={() => setSelectedOffer(record.key.toString())}
                        >
                            Take
                        </Button>
                    </Popconfirm>
                );
            }
        },
    ];

    return (
        <Table
            columns={offersTableColumns}
            dataSource={sortedOffers}
            size={"small"}
            loading={loading}
            pagination={false}
            locale={{emptyText: "No Offers"}}
        />
    );
}