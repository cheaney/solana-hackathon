import React from 'react';
import {Select} from "antd";
import {Option} from "antd/es/mentions";
import {pythMap} from "../api/storage/pyth";

export default function SymbolSelect(props) {
    return (
        <Select
            showSearch={true}
            defaultValue={props.default}
            value={props.value}
            style={props.style}
            onSelect={props.onSelect}
            disabled={props.disabled}
            allowClear={props.allowClear || false}
            onClear={props.onClear}
        >
            {Object.keys(pythMap).map(symbol => <Option key={symbol} value={symbol}>{symbol}</Option>)}
        </Select>
    );
}