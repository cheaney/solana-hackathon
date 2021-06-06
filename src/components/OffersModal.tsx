import React, { useState } from 'react';
import {Button, Modal, Select} from "antd";
import OfferTable from "./OfferTable";
import Title from "antd/es/typography/Title";
import {Market} from "../api/model/Market";
import {formatUSD} from "../api/numberFormatter";
import MakeOfferDialog from "./MakeOfferDialog";
import {formatMarketTitle} from "../api/marketFormatter";

export default function OffersModal(props) {
    let [showMakeOfferModal, setShowMakerOfferModal] = useState(false);

    return (
        <Modal
            title={formatMarketTitle(props.market)}
            visible={props.show}
            onCancel={props.onCancel}
            footer={null}
        >
            <Button
                style={{marginBottom: "1vh"}}
                onClick={() => setShowMakerOfferModal(true)}
                type={"primary"}
            >
                Make Offer
            </Button>
            <MakeOfferDialog
                show={showMakeOfferModal}
                setShowMakerOfferModal={setShowMakerOfferModal}
                market={props.market}
                onMakeOffer={props.onMakeOffer}
            />
            <OfferTable
                key={props.market.key.toString()}
                market={props.market}
                offers={props.market.offers}
                onTakeOffer={props.onTakeOffer}
            />
        </Modal>
    );
}
