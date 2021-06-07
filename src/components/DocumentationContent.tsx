import React from "react";
import Title from "antd/es/typography/Title";

export default function DocumentationContent() {
    return (
      <div>
          <p>
              One user must create a market for a binary option. The market specifies the underlying asset, the condition (above or below),
              the price and the date. Once the market is created, other users can make and take offers on bets with various sizes. While different
              sets of users can enter contracts with different odds, the market ultimately keeps track of ownership of contracts with the same SPL token mint.
              This means there can be a secondary market for them on Serum, although that isn't implemented currently. To incentivize users to create markets,
              the creator of a market receives 1% of all SOL sent to the market escrow e.g. if there are 1000 SOL worth of options created, the creator gets 10 SOL.
          </p>
          <p>
              2. Users make offers to enter a binary option contract. They specify which side of the option they want (Yes/No) and how much SOL they'd like to bet. When
              they make an offer the corresponding amount of SOL is placed in a market escrow account controlled by the B.Options Program. The user can cancel
              their offer as long as it hasn't been taken by another user.
          </p>
          <p>
              3. Users take the other side of open offers. If the first user bet 40 SOL to win 60 SOL that Doge is above $1000 on 12/31, the second user
              bets 60 SOL to win 40 SOL that this doesn't happen. The second user similarly sends their SOL to an escrow account controlled by the B.Options
              program. Once an offer is taken, it can no longer be canceled by the first user who made the initial offer.
          </p>
          <p>
              4. Binary options are settled using data from the Pyth oracle (https://pyth.network/). Because Pyth Programs only record an asset's current price, a subset of users
              monitors the open binary option markets and their underlying asset prices. When Pyth reports a price that affirms an options outcome condition, a user
              settles the outcome of the option. E.g. if Pyth reports Doge at $1001 on 12/31, a user settles the outcome of the option market as Yes. If the exercise date of an option
              passes without being settled (Doge never crosses $1000 on 12/31), a user settles the option outcome as No. For a settling a market, the settler is reward 1% of the SOL in the market escrow.
              Settlers thus function in a similar role to liquidators in Compound or SRM nodes in Serum.
          </p>
          <p>
             5. Users withdraw their SOL from the market escrow. The winning user withdraws 98% of the SOL (total escrow sans creator/settler fees) while the losing user withdraws a zero amount.
          </p>
      </div>
    );
}