import React, {useEffect, useRef, useState} from 'react';
import {Button, Col, Row, Select, Space, Table, Tabs} from "antd";
import styled from 'styled-components';
import MakeMarketDialog from "./MakeMarketDialog";
import SymbolSelect from "./SymbolSelect";
import {useBinaryOptionsProgram} from "../api/BinaryOptionsProgramProvider";
import {Market} from "../api/model/Market";
import {notify} from "../utils/notifications";
import {PublicKey} from "@solana/web3.js";
import {cachedProgramState, getEmptyProgramState, getProgramState} from "../api/ProgramStateProvider";
import {ProgramState} from "../api/model/ProgramState";
import MarketsTable from "./MarketsTables";
import {Offer} from "../api/model/Offer";
import {formatMakeOfferSuccessMessage, formatTakeOfferSuccessMessage} from "../api/offerFormatter";
import OpenOfferTable from "./OpenOffersTable";
import PositionsTable from "./PositionsTable";
import PythPrice from "./PythPrice";
import CreatedMarketsTable from "./CreatedMarketsTable";
import SettledMarketsTable from "./SettledMarketsTable";

const { TabPane } = Tabs;

const Wrapper = styled.div`
  padding: 1%;
`;

export default function BinaryOptionsContent() {
    let [symbol, setSymbol] = useState("BTC/USD");
    let [showCreateMarketModal, setCreateMarketModal] = useState(false);
    let [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
    let [programState, setProgramState] = useState<ProgramState>(Object.assign({}, cachedProgramState));
    const mountedRef = useRef(true);

    const program = useBinaryOptionsProgram();
    const fetchProgramState = async () => {
        if (programState.key !== -1) return;
        const newProgramState = await getProgramState(program)
        if (mountedRef.current) {
            setProgramState(newProgramState);
        }
        return () => (mountedRef.current = false);
    }

    useEffect(() => {
        fetchProgramState();
    }, [programState.key]);

    const onMarketCreated = async (createMarketTx: string, marketPubKey: PublicKey) => {
        setCreateMarketModal(false);
        setProgramState(await getProgramState(program, true));
        notify({
            message: "Success!",
            description: `Created market for ${symbol}`,
            txid: createMarketTx,
            type: "success",
        });
        return () => (mountedRef.current = false);
    }

    const onMakeOffer = async (makeOfferTx: string, offerPublicKey: PublicKey, marketPublicKey: PublicKey) => {
        const newProgramState = await getProgramState(program, true);
        const market = newProgramState.markets[marketPublicKey.toString()];
        const offer = market.offers[offerPublicKey.toString()];
        setSelectedMarket(market);
        setProgramState(newProgramState);
        notify({
            message: "Success!",
            description: formatMakeOfferSuccessMessage(offer, market),
            type: "success",
        });
    }

    const onTakeOffer = async (takeOfferTx: string, offer: Offer) => {
        const newProgramState = await getProgramState(program, true)
        const updatedMarket = newProgramState.markets[offer.market.toString()];
        setSelectedMarket(updatedMarket);
        setProgramState(newProgramState);
        notify({
            message: "Success!",
            description: formatTakeOfferSuccessMessage(offer, programState.markets[offer.market.toString()]),
            type: "success",
        });
    }

    const onCancelOffer = async () => {
        setProgramState(await getProgramState(program, true));
        notify({
            message: "Success!",
            description: "Offer canceled!",
            type: "success",
        });
    }

    const onSettleMarket = async () => {
        setProgramState(await getProgramState(program, true));
        notify({
            message: "Success!",
            description: "Settled Market!",
            type: "success",
        });
    }

    const onWithdrawCreatorFee = async () => {
        setProgramState(await getProgramState(program, true));
        notify({
            message: "Success!",
            description: "Withdrew Creator Fee!",
            type: "success",
        });
    }

    const onWithdrawFromMarket = async () => {
        setProgramState(await getProgramState(program, true));
        notify({
            message: "Success!",
            description: "Withdrew from Market!",
            type: "success",
        });
    }

    const onWithdrawSettlerFee = async () => {
        setProgramState(await getProgramState(program, true));
        notify({
            message: "Success!",
            description: "Withdrew Settler Fee!",
            type: "success",
        });
    }

    const filteredMarkets = Object.values(programState.markets).filter(market => market.status === 'Open');
    const sortedMarkets = filteredMarkets.sort((a: Market, b: Market) => a.date.unix() - b.date.unix());

    return (
        <Wrapper>
            <MakeMarketDialog
                key={symbol}
                show={showCreateMarketModal}
                onMarketCreated={onMarketCreated}
                setCreateMarketModel={setCreateMarketModal}
                symbol={symbol}
            />
            <Row>
                <Button
                    style={{marginRight: "1vw"}}
                    onClick={() => setCreateMarketModal(true)}
                    type={"primary"}
                >
                    Make Market
                </Button>
                <SymbolSelect
                    default={symbol}
                    style={{ marginBottom: "1vw", marginRight: "1vw"}}
                    onSelect={setSymbol}
                    disabled={false}
                />
                <PythPrice key={symbol} symbol={symbol}/>
            </Row>
            <Row>
                <Col flex="auto" >
                    <Tabs defaultActiveKey="0">
                        <TabPane tab="Open Markets" key="0">
                            <Row>
                                <Col flex="auto">
                                    <MarketsTable
                                        key={programState.key}
                                        symbol={symbol}
                                        markets={sortedMarkets}
                                        onMakeOffer={onMakeOffer}
                                        onTakeOffer={onTakeOffer}
                                        selectedMarket={selectedMarket}
                                        setSelectedMarket={setSelectedMarket}
                                    />
                                </Col>
                            </Row>
                        </TabPane>
                        <TabPane tab="Offers" key="1">
                            <OpenOfferTable
                                symbol={symbol}
                                offers={programState.offers}
                                markets={programState.markets}
                                onCancelOffer={onCancelOffer}
                            />
                        </TabPane>
                        <TabPane tab="Positions" key="2">
                            <PositionsTable
                                key={programState.key}
                                symbol={symbol}
                                markets={programState.markets}
                                positions={programState.positions}
                                onSettleMarket={onSettleMarket}
                                onWithdrawFromMarket={onWithdrawFromMarket}
                            />
                        </TabPane>
                        <TabPane tab="Markets Created" key="3">
                            <CreatedMarketsTable
                                key={programState.key}
                                symbol={symbol}
                                markets={Object.values(programState.markets)}
                                onSettleMarket={onSettleMarket}
                                onWithdrawCreatorFee={onWithdrawCreatorFee}
                            />
                        </TabPane>
                        <TabPane tab="Markets Settled" key="4">
                            <SettledMarketsTable
                                key={programState.key}
                                symbol={symbol}
                                markets={Object.values(programState.markets)}
                                onWithdrawSettlerFee={onWithdrawSettlerFee}
                            />
                        </TabPane>
                    </Tabs>
                </Col>
            </Row>
        </Wrapper>
    );
}