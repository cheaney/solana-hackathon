import {Market} from "../api/model/Market";
import {Button, DatePicker, Table} from "antd";
import React, {useState} from "react";
import OffersModal from "./OffersModal";
import {formatSOL, formatUSD} from "../api/numberFormatter";
import moment from "moment";
import {pythMap} from "../api/storage/pyth";
import BN from "bn.js";
import SymbolSelect from "./SymbolSelect";

export default function MarketsTable(
    props: {
        key: number,
        symbol: string,
        markets: Market[],
        onMakeOffer: any,
        onTakeOffer: any,
        selectedMarket: Market | null,
        setSelectedMarket: any,
    }
) {
    let [selectedMarket, setSelectedMarket] = useState<Market | null>(props.selectedMarket);

    const marketTableColumns = [
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
            title: 'Open Interest',
            dataIndex: 'collateral',
            key: 'collateral',
            sorter: (a: Market, b: Market) => a.collateral.gt(b.collateral) ? 1 : -1,
            render: (text, record, index) => formatSOL(record.collateral)
        },
        {
            title: 'Yes',
            dataIndex: 'yes',
            key: 'yes',
            sorter: (a: Market, b: Market) => a.yesTokens.gt(b.yesTokens) ? 1 : -1,
            render: (text, record, index) => formatSOL(record.yesTokens),
        },
        {
            title: 'No',
            dataIndex: 'no',
            key: 'no',
            sorter: (a: Market, b: Market) => a.noTokens.gt(b.noTokens) ? 1 : -1,
            render: (text, record, index) => formatSOL(record.noTokens),
        },
        {
            title: '',
            dataIndex: 'action',
            key: 'action',
            render: (text, record) => (<Button type="link" onClick={() => setSelectedMarket(record)}>Offers</Button>)
        },
    ];

    const onCancel = () => {
        setSelectedMarket(null);
        props.setSelectedMarket(null);
    }

    const offerModal = () => {
        if (selectedMarket !== null) {
            return (
                <OffersModal
                    market={selectedMarket}
                    onMakeOffer={props.onMakeOffer}
                    onTakeOffer={props.onTakeOffer}
                    onCancel={onCancel}
                    show={true}
                />
            );
        }
        return <></>;
    }

    return (
        <>
            {offerModal()}
            <Table
                columns={marketTableColumns}
                pagination={{ pageSize: 10 }}
                dataSource={props.markets}
                locale={{ emptyText: "No Markets"}}
                size={"small"}
            />
        </>
    )
}