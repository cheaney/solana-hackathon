import React, { useState} from 'react';
import {Button, DatePicker, Popconfirm, Table} from "antd";
import {formatSOL, formatUSD} from "../api/numberFormatter";
import {calculateToWinAmount} from "../api/offersMath";
import {useWallet} from "../utils/wallet";
import {Offer} from "../api/model/Offer";
import {Market} from "../api/model/Market";
import {cancelOffer} from "../api/BinaryOptionController";
import {useBinaryOptionsProgram} from "../api/BinaryOptionsProgramProvider";
import moment from "moment";
import BN from "bn.js";
import {pythMap} from "../api/storage/pyth";
import SymbolSelect from "./SymbolSelect";

export default function OpenOfferTable(
    props: {
        symbol: string,
        offers: {[key: string]: Offer},
        markets: {[key: string]: Market},
        onCancelOffer: any,
    }
) {
    const program = useBinaryOptionsProgram();
    const wallet = useWallet();
    const [isLoading, setIsLoading] = useState(false);
    const userKey = wallet.connected ? wallet.wallet?.publicKey.toString() : "";
    const noDataMsg = wallet.connected ? "No Offers" : "Connect Wallet to see Offers";
    const filteredOffers = Object.values(props.offers).filter(offer => offer.creator.toString() === userKey && offer.status === 'open');


    const handleCancel = async (offer: Offer) => {
        setIsLoading(true);
        await cancelOffer(program, offer, props.markets[offer.market.toString()]);
        await props.onCancelOffer();
        setIsLoading(false);
    }

    const columns = [
        {
            title: 'Symbol',
            dataIndex: 'symbol',
            key: 'symbol',
            sorter: (a: Offer, b: Offer) => props.markets[a.market.toString()].symbol > props.markets[b.market.toString()].symbol ? 1 : -1,
            filterDropdown: ({setSelectedKeys, selectedKeys, confirm, clearFilters}) => {
                return <div style={{ padding: 8 }}>
                    <SymbolSelect
                        allowClear={true}
                        onClear={() => {
                            clearFilters();
                        }}
                        value={selectedKeys[0]}
                        style={{minWidth: "10vw"}}
                        onSelect={val => {
                            setSelectedKeys([val]);
                            confirm();
                        }}
                    />
                </div>
            },
            onFilter: (value, record: Offer) => {
                return value === props.markets[record.market.toString()].symbol
            },
            render: (text, record, index) => props.markets[record.market.toString()].symbol,
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            sorter: (a: Offer, b: Offer) => props.markets[a.market.toString()].date.unix() - props.markets[b.market.toString()].date.unix(),
            render: (text, record, index) => props.markets[record.market.toString()].date.format('MM/DD/YYYY'),
            filterDropdown: ({setSelectedKeys, selectedKeys, confirm, clearFilters}) => {
                return <div style={{ padding: 8 }}>
                    <DatePicker
                        style={{ marginRight: "10px" }}
                        format="MM/DD/YYYY"
                        value={selectedKeys[0] ? moment(selectedKeys[0]) : null}
                        onChange={e => {
                            setSelectedKeys(e !== null ? [e] : []);
                            confirm();
                        }}
                    />
                    <Button
                        onClick={() => {
                            clearFilters();
                        }}
                        size="small"
                    >
                        Reset
                    </Button>
                </div>
            },
            onFilter: (value, record: Offer) => {
                return value.startOf("day").unix() <= props.markets[record.market.toString()].date.unix() &&
                    value.endOf("day").unix() >= props.markets[record.market.toString()].date.unix();
            },
        },
        {
            title: 'Condition',
            dataIndex: 'condition',
            key: 'condition',
            sorter: (a: Offer, b: Offer) => props.markets[a.market.toString()].condition === 'Above' ? 1 : -1,
            render: (text, record, index) => props.markets[record.market.toString()].condition,
            filters: [
                {
                    "text": "Above",
                    "value": "Above"
                },
                {
                    "text": "Below",
                    "value": "Below"
                }
            ],
            onFilter: (value, record) => props.markets[record.market.toString()].condition === value,
        },
        {
            title: 'Value',
            dataIndex: 'value',
            key: 'value',
            sorter: (a: Offer, b: Offer) => props.markets[a.market.toString()].value.gt(props.markets[b.market.toString()].value) ? 1 : -1,
            render: (text, record) => formatUSD(props.markets[record.market.toString()].value, new BN(10**pythMap[props.symbol].exponent))
        },
        {
            title: 'Outcome',
            dataIndex: 'outcome',
            key: 'outcome',
            render: (text, record) => record.outcome,
            filters: [
                {
                    "text": "Yes",
                    "value": "Yes"
                },
                {
                    "text": "No",
                    "value": "No"
                }
            ],
            onFilter: (value, record) => record.outcome === value,
        },
        {
            title: 'Bet',
            dataIndex: 'bet',
            key: 'bet',
            render: (text, record) => formatSOL(record.betAmount),
            sorter: (a: Offer, b: Offer) => a.betAmount.lt(b.betAmount) ? -1 : 1,
        },
        {
            title: 'Win',
            dataIndex: 'win',
            key: 'win',
            render: (text, record) => formatSOL(calculateToWinAmount(record.betAmount)),
            sorter: (a: Offer, b: Offer) => a.totalAmount.sub(a.betAmount).gt(b.totalAmount.sub(b.betAmount)) ? 1 : -1,
        },
        {
            title: '',
            dataIndex: 'action',
            key: 'action',
            render: (text, record: Offer) => {
                return (
                    <Button
                        type="link"
                        onClick={() => handleCancel(record)}
                    >
                        Cancel
                    </Button>
                )
            }
        },
    ];

    return (
        <Table
            columns={columns}
            loading={isLoading}
            locale={{ emptyText: noDataMsg }}
            dataSource={filteredOffers}
            size={"small"}
        />
    );
}