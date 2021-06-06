import { HashRouter, Route, Switch, Redirect } from 'react-router-dom';
// import TradePage from './pages/TradePage';
import OpenOrdersPage from './pages/OpenOrdersPage';
import React from 'react';
import BalancesPage from './pages/BalancesPage';
import ConvertPage from './pages/ConvertPage';
import BasicLayout from './components/BasicLayout';
import { getTradePageUrl } from './utils/markets';
import BinaryOptionsContent from "./components/BinaryOptionsContent";

export function Routes() {
  return (
    <>
      <HashRouter basename={'/'}>
        <BasicLayout>
          <Switch>
            <Route exact path="/">
              <BinaryOptionsContent />
            </Route>
            <Route exact path="/testMarketPage">
              <Redirect to={getTradePageUrl()} />
            </Route>
            {/*<Route exact path="/market/:marketAddress">*/}
            {/*  /!*<TradePage />*!/*/}
            {/*</Route>*/}
            {/*<Route exact path="/orders" component={OpenOrdersPage} />*/}
            {/*<Route exact path="/balances" component={BalancesPage} />*/}
            {/*<Route exact path="/convert" component={ConvertPage} />*/}
            {/*<Route*/}
            {/*  exact*/}
            {/*  path="/list-new-market"*/}
            {/*  component={ListNewMarketPage}*/}
            {/*/>*/}
            {/*<Route exact path="/pools">*/}
            {/*  <PoolListPage />*/}
            {/*</Route>*/}
            {/*<Route exact path="/pools/new">*/}
            {/*  <NewPoolPage />*/}
            {/*</Route>*/}
            {/*<Route exact path="/pools/:poolAddress">*/}
            {/*  <PoolPage />*/}
            {/*</Route>*/}
          </Switch>
        </BasicLayout>
      </HashRouter>
    </>
  );
}
