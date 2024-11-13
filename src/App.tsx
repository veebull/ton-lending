import React, { useEffect, useState } from 'react';
import { TonConnectButton } from '@tonconnect/ui-react';
import { Coins, ArrowRightLeft, Landmark, LogOut } from 'lucide-react';
import SwapInterface from './components/SwapInterface';
import { useTonConnect } from './hooks/useTonConnect';

function App() {
  const { connected, balances, disconnect } = useTonConnect();
  
  return (
    <div className='min-h-screen bg-gradient-to-b from-blue-900 to-blue-950 text-white'>
      {/* Header with Greek-inspired design */}
      <header className='border-b border-gold/20 bg-gradient-to-r from-blue-900/50 to-blue-800/50 backdrop-blur-sm'>
        <div className='container mx-auto px-4 py-6 flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <Landmark className='w-8 h-8 text-gold' />
            <h1 className='text-2xl font-serif text-gold'>Olympus Exchange</h1>
          </div>
          <div className='flex items-center space-x-4'>
            {connected && (
              <>
                <div className="text-sm text-blue-200 flex items-center gap-4">
                  <div>
                    <span className="text-gold">{balances.ton}</span> TON
                  </div>
                  <div>
                    <span className="text-gold">{balances.usdt}</span> USDT
                  </div>
                </div>
                <button
                  onClick={disconnect}
                  className="p-2 rounded-full hover:bg-blue-800/50 transition-colors"
                  title="Disconnect wallet"
                >
                  <LogOut className="w-5 h-5 text-blue-200 hover:text-gold transition-colors" />
                </button>
              </>
            )}
            <TonConnectButton />
          </div>
        </div>
      </header>

      <main className='container mx-auto px-4 py-12'>
        {/* Hero Section */}
        <div className='text-center mb-12'>
          <h2 className='text-4xl font-serif mb-4 text-gold'>
            Decentralized Currency Exchange
          </h2>
          <p className='text-blue-200 max-w-2xl mx-auto'>
            Exchange TON for USDT with the wisdom of ancient Greek economics and
            the power of modern blockchain technology
          </p>
        </div>

        {/* Main Swap Interface */}
        {connected ? (
          <div className='max-w-xl mx-auto'>
            <SwapInterface />
          </div>
        ) : (
          <div className='text-center'>
            <div className='bg-blue-800/30 backdrop-blur-sm p-8 rounded-lg border border-gold/20 max-w-md mx-auto'>
              <Coins className='w-16 h-16 text-gold mx-auto mb-4' />
              <h3 className='text-xl font-serif mb-4'>Connect Your Wallet</h3>
              <p className='text-blue-200 mb-6'>
                Connect your TON wallet to access the exchange interface
              </p>
              <TonConnectButton />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className='border-t border-gold/20 py-8 mt-auto'>
        <div className='container mx-auto px-4 text-center text-blue-400'>
          <p>Powered by TON Blockchain</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
