import React, {useContext, useEffect, useRef} from "react";
import {Program, Provider, Wallet} from "@project-serum/anchor";
import {useWallet} from "../utils/wallet";
import {useConnection} from "../utils/connection";
import idl from "./binary_options.json";
import {PublicKey, Keypair} from "@solana/web3.js";
import {getProgramState} from "./ProgramStateProvider";

const idlJSON = JSON.parse(JSON.stringify(idl));
export const BINARY_OPTIONS_PROGRAM = new PublicKey("86gFWuvuGe2AzHzEw7xw5CEEshtpw2fj1Q7JB9gSsZsr");

let BinaryOptionsProgramContext: React.Context<Program>;

export function BinaryOptionsProgramProvider({ children }) {
    const connection = useConnection();
    const wallet = useWallet();
    const providerWallet = wallet.wallet !== undefined ? wallet.wallet : new Wallet(new Keypair());
    const provider = new Provider(connection, providerWallet, {
        skipPreflight: false,
        commitment: 'max',
        preflightCommitment: 'max',
    });
    let program = new Program(idlJSON, BINARY_OPTIONS_PROGRAM, provider);
    BinaryOptionsProgramContext = React.createContext(program);

    const earlyFetchProgramState = async () => {
        await getProgramState(program);
    };

    useEffect(() => {
        earlyFetchProgramState();
    })

    return (
        <BinaryOptionsProgramContext.Provider value={program}>
            {children}
        </BinaryOptionsProgramContext.Provider>
    );
}

export function useBinaryOptionsProgram() {
    if (BinaryOptionsProgramContext === undefined) {
        throw Error("Called useBinaryOptionProvider outside of BinaryOptionsProgramProvider");
    }
    return useContext<Program>(BinaryOptionsProgramContext);
}