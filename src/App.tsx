import React, { Suspense } from 'react';
import './App.less';
import { ConnectionProvider } from './utils/connection';
import { WalletProvider } from './utils/wallet';
import { GlobalStyle } from './global_style';
import { Spin } from 'antd';
import ErrorBoundary from './components/ErrorBoundary';
import { Routes } from './routes';
import { PreferencesProvider } from './utils/preferences';
import { BinaryOptionsProgramProvider } from "./api/BinaryOptionsProgramProvider";

export default function App() {
  return (
    <Suspense fallback={() => <Spin size="large" />}>
      <GlobalStyle />
      <ErrorBoundary>
        <ConnectionProvider>
          <WalletProvider>
              <BinaryOptionsProgramProvider>
                  <PreferencesProvider>
                      <Suspense fallback={() => <Spin size="large" />}>
                          <Routes />
                      </Suspense>
                  </PreferencesProvider>
              </BinaryOptionsProgramProvider>
          </WalletProvider>
        </ConnectionProvider>
      </ErrorBoundary>
    </Suspense>
  );
}
