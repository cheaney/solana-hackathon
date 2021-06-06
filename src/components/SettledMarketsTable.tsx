import {Market} from "../api/model/Market";
import {Button, DatePicker, Table} from "antd";
import React, {useState} from "react";
import OffersModal from "./OffersModal";
import {formatSOL, formatUSD} from "../api/numberFormatter";
import moment from "moment";
import {pythMap} from "../api/storage/pyth";
import BN from "bn.js";
import {Position} from "../api/model/Position";
import {useWallet} from "../utils/wallet";
import {notify} from "../utils/notifications";
import {withdrawSettlerFee} from "../api/BinaryOptionController";
import {useBinaryOptionsProgram} from "../api/BinaryOptionsProgramProvider";
import SymbolSelect from "./SymbolSelect";

export default function SettledMarketsTable(
    props: {
        key: number,
        symbol: string,
        markets: Market[],
        onWithdrawSettlerFee: any,
    }
) {
    const program = useBinaryOptionsProgram();
    const wallet = useWallet();
    const [isLoading, setIsLoading] = useState(false);
    const noDataMsg = wallet.connected ? "You haven't settled any markets" : "Connect Wallet to see markets settled";
    let filteredMarkets = new Array<Market>();
    if (wallet.wallet !== undefined && wallet.wallet.publicKey !== undefined && wallet.connected) {
        filteredMarkets = props.markets.filter(market => {
            return market.settler.toString() === wallet.wallet?.publicKey.toString();
        });
    }
    const sortedMarkets = filteredMarkets.sort((a: Market, b: Market) => a.date.isBefore(b.date) ? -1: 1);

    const handleWithdrawSettlerFee = async (market: Market) => {
        if (wallet.wallet === undefined || !wallet.connected) {
            notify({
                "message": "Connect Wallet",
                "description": "Need to connect wallet to withdraw settler fee",
                "type": "error",
            })
            return;
        }
        setIsLoading(true);
        await withdrawSettlerFee(program, wallet.wallet, market);
        await props.onWithdrawSettlerFee();
    }

    const columns = [
        {
            title: 'Symbol',
            dataIndex: 'symbol',
            key: 'symbol',
            sorter: (a: Market, b: Market) => a.symbol > b.symbol ? 1 : -1,
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
            onFilter: (value, record: Market) => {
                return value === record.symbol
            },
            render: (text, record, index) => record.symbol,
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            sorter: (a: Market, b: Market) => a.date.unix() - b.date.unix(),
            render: (text, record, index) => record.date.format('MM/DD/YYYY'),
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
            onFilter: (value, record: Market) => {
                return value.startOf("day").unix() <= record.date.unix() &&
                    value.endOf("day").unix() >= record.date.unix();
            },
        },
        {
            title: 'Condition',
            dataIndex: 'condition',
            key: 'condition',
            sorter: (a: Market, b: Market) => a.condition === 'Above' ? 1 : -1,
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
            onFilter: (value, record) => record.condition === value,
        },
        {
            title: 'Value',
            dataIndex: 'value',
            key: 'value',
            sorter: (a: Market, b: Market) => a.value.gt(b.value) ? 1 : -1,
            render: (text, record, index) => formatUSD(record.value, new BN(10**pythMap[record.symbol].exponent))
        },
        {
            title: 'Market Outcome',
            dataIndex: 'status',
            key: 'status',
            render: (text, record: Market) => record.outcome,
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
            onFilter: (value, record: Market) => record.outcome === value,
        },
        {
            title: '',
            dataIndex: 'action',
            key: 'action',
            render: (text, record) => {
                if (!record.settlerWithdrew) {
                    return (
                        <Button
                            type="link"
                            onClick={() => handleWithdrawSettlerFee(record)}
                        >
                            Withdraw
                        </Button>
                    )
                } else if (record.creatorWithdrew) {
                    return "Already Withdrew"
                }
            }
        },
    ];

    return (
        <>
            <Table
                columns={columns}
                pagination={{ pageSize: 10 }}
                dataSource={sortedMarkets}
                locale={{ emptyText: noDataMsg}}
                size={"small"}
                loading={isLoading}
            />
        </>
    )
}