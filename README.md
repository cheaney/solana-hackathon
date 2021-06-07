# B.Options

B.Options is a peer-to-peer binary option protocol on Solana's Devnet. A binary option is an option that pays a fixed
amount if the price of the underlying is above or below some threshold price on some pre-specified date.
E.g. it pays out 60 SOL if Doge is above $1000 on 12/31/21 and pays 0 SOL if it's not. B.Options enables two users to create a binary option
directly. One user bets 40 SOL that Doge will be above $1000 on 12/31 and another bets 60 SOL that it will not.
The user that is correct wins 100 SOL.

### Demo

https://master.d3l9kxlod1f7fu.amplifyapp.com/#/

### How It Works

1. One user must create a market for a binary option. The market specifies the underlying asset, the condition (above or below),
   the price and the date. Once the market is created, other users can make and take offers on bets with various sizes. While different
   sets of users can enter contracts with different odds, the market ultimately keeps track of ownership of contracts with the same SPL token mint.
   This means that the binary options are fungible and thus there can be a secondary market for them on Serum. To incentivize users to create markets,
   the creator of a market receives 1% of all SOL sent to the market escrow e.g. if there are 1000 SOL worth of options created, the creator gets 10 SOL.
2. Users make offers to enter a binary option contract. They specify which side of the option they want (Yes/No) and how much SOL they'd like to bet. When
   they make an offer the corresponding amount of SOL is placed in a market escrow account controlled by the B.Options Program. The user can cancel
   their offer as long as it hasn't been taken by another user.
3. Users take the other side of open offers. If the first user bet 40 SOL to win 60 SOL that Doge is above $1000 on 12/31, the second user
   bets 60 SOL to win 40 SOL that this doesn't happen. The second user similarly sends their SOL to an escrow account controlled by the B.Options
   program. Once an offer is taken, it can no longer be canceled by the first user who made the initial offer.
4. Binary options are settled using data from the Pyth oracle (https://pyth.network/). Because Pyth Programs only record an asset's current price, a subset of users
   monitors the open binary option markets and their underlying asset prices. When Pyth reports a price that affirms an options outcome condition, a user
   settles the outcome of the option. E.g. if Pyth reports Doge at $1001 on 12/31, a user settles the outcome of the option market as Yes. If the exercise date of an option
   passes without being settled (Doge never crosses $1000 on 12/31), a user settles the option outcome as No. For a settling a market, the settler is reward 1% of the SOL in the market escrow.
   Settlers thus function in a similar role to liquidators in Compound or SRM nodes in Serum.
5. Users withdraw their SOL from the market escrow. The winning user withdraws 98% of the SOL (total escrow sans creator/settler fees) while the losing user withdraws a zero amount.

### Running the UI

Run `yarn` to install dependencies, then run `yarn start` to start a development server or `yarn build` to create a production build that can be served by a static file server.
