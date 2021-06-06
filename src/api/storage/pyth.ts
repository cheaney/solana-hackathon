import {PublicKey} from "@solana/web3.js";

interface pythMapEntry {
    exponent: number,
    priceAccount: PublicKey,
    productAccount: PublicKey,
    defaultPrice: number,
}

const pythPriceAccountToSymbol = {
    "7wt56aT2kZ2ZPKvnchxFENRj3sZihDBBbZCHp3oGHxTU": "ETH/USD",
    "FCLf9N8xcN9HBA9Cw68FfEZoSBr4bYYJtyRxosNzswMH": "BTC/USD",
    "5bhAxoiWRCNyt8AWHB46U8yWWj7FigtMD4TQ6CL7aS5a": "DOGE/USD",
    "CeLD8TC7Ktv2o57EHP7rddh6TZBHXkAhTyfWgxsTYs21": "AAPL/USD",
    "3DYL9vB4dEywe7qQq4qRJ6Eo4vZbS4MkEZz28uNvtUxM": "AMC/USD",
    "HD7grYi13isumjWDvEbNMwiahEEYJMXXch9AHnvf27oE": "AMZN/USD",
    "5Xz8sHxmo74yMTrFa5sv2EqirFK8dmLfmz4HjCssikWF": "BNB/USD",
    "9XcdPTBmhn1RQMGQ5kcyWY7ifbTCfHrwMVpRs1ycxywS": "EUR/USD",
    "CGvcyjNcoqc7ogUuZN5TJfx7EyBMR4ndP7iLbjAXBNZB": "GBP/USD",
    "8SW7UdXTjxJC25FFqizUyBHZu9NUTKsSdXNoVbejKBNe": "GME/USD",
    "AMGjTwxFPUVRz62E3SG1jUxyugW87jZLJ8AyNnNfcJz5": "GOOG/USD",
    "GrsGs2akT2z5co5QUaY4bpAE96dbgyymu5FNQr1YTyV8": "LUNA/USD",
    "GzLdZLXyjp6QQFmwPDVQhnktcnVF95rcCbz4jR3wqh2C": "NFLX/USD",
    "73bbbWHnzCAh2Mze86k9sGrbWtvgConqLwnSjnyTioHc": "QQQ/USD",
    "BdgHsXrH1mXqhdosXavYxZgX6bGqTdj5mh2sxDhF8bJy": "SOL/USD",
    "9NraYDDeXGq8p7nPHXSZ6gEiwb2sVA1WmiicP2CmUWcY": "SPY/USD",
    "2Mt2wcRXpCAbTRp2VjFqGa8SbJVzjJvyK4Tx7aqbRtBJ": "SRM/USD",
    "BZFbPsyvgps7LcaG8rAfaUiEgj2nag1RsXwhymJkgEVu": "TSLA/USD",
    "ELRxuFThqnE4BdjCPKk7mFh4fJFkpNCvKSjhufoCChYK": "USDC/USD",
    "7c36iVwQx8Tyzp1926NTjjiyVqKeuLT8MPUoJy4cAH8u": "USDT/USD",
    "5uQaFgybruzJh6y1NyiQECgiBJjtpy9m4bQBq1jSf9BK": "XAU/USD",
}

const pythMap : {[key: string]: pythMapEntry} = {
    "ETH/USD": {
        "exponent": 9,
        "priceAccount": new PublicKey("7wt56aT2kZ2ZPKvnchxFENRj3sZihDBBbZCHp3oGHxTU"),
        "productAccount": new PublicKey("HtwD2SutRJVatzAsnvRRjSujQFNdQodzF1FKo54NEzrs"),
        "defaultPrice": 3000,
    },
    "BTC/USD": {
        "exponent": 9,
        "priceAccount": new PublicKey("FCLf9N8xcN9HBA9Cw68FfEZoSBr4bYYJtyRxosNzswMH"),
        "productAccount": new PublicKey("9BQ2WKSVbfzpSJYyLCJuxVuiUFxHmQvkhhez94AdffEZ"),
        "defaultPrice": 40000,
    },
    "DOGE/USD": {
        "exponent": 9,
        "priceAccount": new PublicKey("5bhAxoiWRCNyt8AWHB46U8yWWj7FigtMD4TQ6CL7aS5a"),
        "productAccount": new PublicKey("48bifbcdwBcnLRGD8zDctEF2CUWi1Ag6ePnyCBnEvBcy"),
        "defaultPrice": 1,
    },
    "AAPL/USD": {
        "exponent": 5,
        "priceAccount": new PublicKey("CeLD8TC7Ktv2o57EHP7rddh6TZBHXkAhTyfWgxsTYs21"),
        "productAccount": new PublicKey("4SxmcsbJWVBWvuP2cRQDjFtAgdqzWWLbHESnUTH4CegT"),
        "defaultPrice": 200,
    },
    "AMC/USD": {
        "exponent": 5,
        "priceAccount": new PublicKey("3DYL9vB4dEywe7qQq4qRJ6Eo4vZbS4MkEZz28uNvtUxM"),
        "productAccount": new PublicKey("8EBkA7k8fAftbBgFQL8SAuUU6N6HzpRRBBSDXcJwnSJ3"),
        "defaultPrice": 50,
    },
    "AMZN/USD": {
        "exponent": 5,
        "priceAccount": new PublicKey("HD7grYi13isumjWDvEbNMwiahEEYJMXXch9AHnvf27oE"),
        "productAccount": new PublicKey("93k4i5Rfhvvqkb7fvW4PJYHuEmPvcKDzrR3wBXJ3AgF9"),
        "defaultPrice": 3500,
    },
    "BNB/USD": {
        "exponent": 9,
        "priceAccount": new PublicKey("5Xz8sHxmo74yMTrFa5sv2EqirFK8dmLfmz4HjCssikWF"),
        "productAccount": new PublicKey("75rD84EnSqhymcWfTu8capTdgi7frUU4XJXEmPEtvASa"),
        "defaultPrice": 500,
    },
    "EUR/USD": {
        "exponent": 9,
        "priceAccount": new PublicKey("9XcdPTBmhn1RQMGQ5kcyWY7ifbTCfHrwMVpRs1ycxywS"),
        "productAccount": new PublicKey("CCKHwYYXqxjhyHgHdJz7TsJWU5JLJELDWEkb6wpCiBjd"),
        "defaultPrice": 1.3,
    },
    "GBP/USD": {
        "exponent": 9,
        "priceAccount": new PublicKey("CGvcyjNcoqc7ogUuZN5TJfx7EyBMR4ndP7iLbjAXBNZB"),
        "productAccount": new PublicKey("6ZwfRuz6Bqb6dCmgCEThy2Yuw7K99VGoyq2LGe5oy9Hi"),
        "defaultPrice": 1.5,
    },
    "GME/USD": {
        "exponent": 5,
        "priceAccount": new PublicKey("8SW7UdXTjxJC25FFqizUyBHZu9NUTKsSdXNoVbejKBNe"),
        "productAccount": new PublicKey("Baepf3XcJRs4vVDjgYwbMQJZdD9j2nYCGE1VxBb2jQbY"),
        "defaultPrice": 300,
    },
    "GOOG/USD": {
        "exponent": 5,
        "priceAccount": new PublicKey("AMGjTwxFPUVRz62E3SG1jUxyugW87jZLJ8AyNnNfcJz5"),
        "productAccount": new PublicKey("6XK34harsnbkgfYqzReZfk2aaaKGdu1cp75Urx8uMqzf"),
        "defaultPrice": 3000,
    },
    "LUNA/USD": {
        "exponent": 5,
        "priceAccount": new PublicKey("GrsGs2akT2z5co5QUaY4bpAE96dbgyymu5FNQr1YTyV8"),
        "productAccount": new PublicKey("ED1yfL6hQaYKu3MK6MXG7bMQkHB7WAZiij3Qj3LznQTu"),
        "defaultPrice": 10,
    },
    "NFLX/USD": {
        "exponent": 5,
        "priceAccount": new PublicKey("GzLdZLXyjp6QQFmwPDVQhnktcnVF95rcCbz4jR3wqh2C"),
        "productAccount": new PublicKey("5BeETmg8gc4SdsrbrSiUy8JKtAvoEPN4jwh7mULxGaUw"),
        "defaultPrice": 500,
    },
    "QQQ/USD": {
        "exponent": 5,
        "priceAccount": new PublicKey("73bbbWHnzCAh2Mze86k9sGrbWtvgConqLwnSjnyTioHc"),
        "productAccount": new PublicKey("F7qAw1etjCocMmgLgcXQo62N18CycuBKWLV59cXHq6wz"),
        "defaultPrice": 400,
    },
    "SOL/USD": {
        "exponent": 9,
        "priceAccount": new PublicKey("BdgHsXrH1mXqhdosXavYxZgX6bGqTdj5mh2sxDhF8bJy"),
        "productAccount": new PublicKey("8yrQMUyJRnCJ72NWwMiPV9dNGw465Z8bKUvnUC8P5L6F"),
        "defaultPrice": 50,
    },
    "SPY/USD": {
        "exponent": 5,
        "priceAccount": new PublicKey("9NraYDDeXGq8p7nPHXSZ6gEiwb2sVA1WmiicP2CmUWcY"),
        "productAccount": new PublicKey("2xvdQpZZTvuPCqTBaqJwv69jDeNcwipFTtvhdeDjFU7V"),
        "defaultPrice": 500,
    },
    "SRM/USD": {
        "exponent": 9,
        "priceAccount": new PublicKey("2Mt2wcRXpCAbTRp2VjFqGa8SbJVzjJvyK4Tx7aqbRtBJ"),
        "productAccount": new PublicKey("5agdsn3jogTt8F537GW3g8BuLaBGrg9Q2gPKUNqBV6Dh"),
        "defaultPrice": 5,
    },
    "TSLA/USD": {
        "exponent": 5,
        "priceAccount": new PublicKey("BZFbPsyvgps7LcaG8rAfaUiEgj2nag1RsXwhymJkgEVu"),
        "productAccount": new PublicKey("8zgZyDdQ1mResxKYbEFu741SHvKEBv7esrADANVooZXE"),
        "defaultPrice": 600,
    },
    "USDC/USD": {
        "exponent": 9,
        "priceAccount": new PublicKey("ELRxuFThqnE4BdjCPKk7mFh4fJFkpNCvKSjhufoCChYK"),
        "productAccount": new PublicKey("3P3yEgE9TGxAuangJA5RMCj3cJdUhytAQVNfeT4DJT8k"),
        "defaultPrice": 1,
    },
    "USDT/USD": {
        "exponent": 9,
        "priceAccount": new PublicKey("7c36iVwQx8Tyzp1926NTjjiyVqKeuLT8MPUoJy4cAH8u"),
        "productAccount": new PublicKey("8sftjPb3QJb2YsPs54jBfY3nL7qDjunQkg2QEiQVb4As"),
        "defaultPrice": 1,
    },
    "XAU/USD": {
        "exponent": 9,
        "priceAccount": new PublicKey("5uQaFgybruzJh6y1NyiQECgiBJjtpy9m4bQBq1jSf9BK"),
        "productAccount": new PublicKey("3ZorfRfXD3pak5mKby5Cg45qPsEKD8vExcy1JfMiEdk9"),
        "defaultPrice": 2000,
    }
};

export { pythMap, pythPriceAccountToSymbol };