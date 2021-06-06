import React, { useState} from 'react';
import {Button, DatePicker, Table} from "antd";
import {formatSOL, formatUSD} from "../api/numberFormatter";
import {useWallet} from "../utils/wallet";
import {Market} from "../api/model/Market";
import {useBinaryOptionsProgram} from "../api/BinaryOptionsProgramProvider";
import {Position} from "../api/model/Position";
import {Offer} from "../api/model/Offer";
import moment from "moment";
import {settleMarket, withdrawFromMarket} from "../api/BinaryOptionController";
import {notify} from "../utils/notifications";
import BN from "bn.js";
import {calculateToWinAmount} from "../api/offersMath";
import {pythMap} from "../api/storage/pyth";
import SymbolSelect from "./SymbolSelect";

export default function PositionsTable(
    props: {
        symbol: string,
        markets: {[key: string]: Market},
        positions: {[key: string]: {[key: string]: Position}},
        onSettleMarket: any,
        onWithdrawFromMarket: any,
    }
) {
    const program = useBinaryOptionsProgram();
    const wallet = useWallet();
    const [isLoading, setIsLoading] = useState(false);
    const noDataMsg = wallet.connected ? "No Positions" : "Connect Wallet to see Positions";

    let filteredPositions = wallet.connected && wallet.wallet !== undefined
        ? Object.values(props.positions[wallet.wallet.publicKey.toString()] || {}) : [];

    const handleSettle = async (position: Position) => {
        if (wallet.wallet === undefined || !wallet.connected) {
            notify({
                "message": "Connect Wallet",
                "description": "Need to connect wallet to settle market",
                "type": "error",
            })
            return;
        }
        setIsLoading(true);
        await settleMarket(program, wallet.wallet, position.market);
        await props.onSettleMarket();
    }

    const handleWithdraw = async (position: Position) => {
        if (wallet.wallet === undefined || !wallet.connected) {
            notify({
                "message": "Connect Wallet",
                "description": "Need to connect wallet to withdraw position",
                "type": "error",
            })
            return;
        }
        setIsLoading(true);
        await withdrawFromMarket(program, wallet.wallet, position);
        await props.onWithdrawFromMarket();
    }

    const columns = [
        {
            title: 'Symbol',
            dataIndex: 'symbol',
            key: 'symbol',
            sorter: (a: Position, b: Position) => a.market.symbol > b.market.symbol ? 1 : -1,
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
            onFilter: (value, record: Position) => {
                return value === record.market.symbol
            },
            render: (text, record, index) => record.market.symbol,
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            sorter: (a: Position, b: Position) => a.market.date.unix() - b.market.date.unix(),
            render: (text, record, index) => record.market.date.format('MM/DD/YYYY'),
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
            onFilter: (value, record: Position) => {
                return value.startOf("day").unix() <= record.market.date.unix() &&
                    value.endOf("day").unix() >= record.market.date.unix();
            },
        },
        {
            title: 'Condition',
            dataIndex: 'condition',
            key: 'condition',
            sorter: (a: Position, b: Position) => a.market.condition === 'Above' ? 1 : -1,
            render: (text, record, index) => record.market.condition,
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
            sorter: (a: Position, b: Position) => a.market.value.gt(b.market.value) ? 1 : -1,
            render: (text, record) => formatUSD(record.market.value, new BN(10**pythMap[props.symbol].exponent)),
        },
        {
            title: 'Bet Outcome',
            dataIndex: 'outcome',
            key: 'outcome',
            render: (text, record: Position) => record.outcome,
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
            onFilter: (value, record: Position) => record.outcome === value,
        },
        {
            title: 'Bet Amount',
            dataIndex: 'bet',
            key: 'bet',
            render: (text, record: Position) => formatSOL(record.betAmount),
            sorter: (a: Position, b: Position) => a.betAmount.lt(b.betAmount) ? -1 : 1,
        },
        {
            title: 'Market Outcome',
            dataIndex: 'status',
            key: 'status',
            render: (text, record: Position) => record.market.outcome,
            filters: [
                {
                    "text": "Yes",
                    "value": "Yes"
                },
                {
                    "text": "No",
                    "value": "No"
                },
                {
                    "text": "Undecided",
                    "value": "Undecided"
                }
            ],
            onFilter: (value, record: Position) => record.market.outcome === value,
        },
        {
            title: 'Won',
            dataIndex: 'won',
            key: 'won',
            render: (text, record: Position) => {
                if (record.market.outcome === 'Undecided') {
                    return '—';
                } else if (record.market.outcome !== record.outcome) {
                    return {
                        props: {
                            style: { color: "#a8071a"}
                        },
                        children: <div>{formatSOL(new BN(0))}</div>
                    };
                } else {
                    return {
                        props: {
                            style: { color: "#237804"}
                        },
                        children: <div>{formatSOL(calculateToWinAmount(record.betAmount))}</div>
                    };
                }

            },
        },
        {
            title: '',
            dataIndex: 'action',
            key: 'action',
            render: (text, record: Position) => {
                const market = record.market;
                if (market.status === 'Open' && moment().unix() >= market.date.endOf("day").unix()) {
                    return (
                        <Button
                            type="link"
                            onClick={() => handleSettle(record)}
                        >
                            Settle
                        </Button>
                    )
                }
                if (market.status === 'Settled' && record.canWithdraw && record.market.outcome === record.outcome) {
                    return (
                        <Button
                            type="link"
                            onClick={() => handleWithdraw(record)}
                        >
                            Withdraw
                        </Button>
                    )
                }
                return <></>;
            }
        },
    ];

    return (
        <Table
            columns={columns}
            loading={isLoading}
            locale={{ emptyText: noDataMsg }}
            dataSource={filteredPositions}
            size={"small"}
        />
    );
}