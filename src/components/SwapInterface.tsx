import React, { useState, useEffect, useCallback } from 'react';
import { ArrowDownUp, Coins, Loader2 } from 'lucide-react';
import { useTonConnect } from '../hooks/useTonConnect';

const SwapInterface = () => {
  const { connected, wallet, balances } = useTonConnect();
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tonPrice, setTonPrice] = useState<number>(0);
  const [usdtPrice] = useState<number>(1); // USDT is pegged to USD
  const [isFromTON, setIsFromTON] = useState(true);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);

  // Fetch TON price
  const fetchTONPrice = useCallback(async () => {
    setIsLoadingPrice(true);
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd'
      );
      const data = await response.json();
      setTonPrice(Number(data['the-open-network'].usd));
    } catch (error) {
      console.error('Error fetching TON price:', error);
      setTonPrice(2); // Fallback price
    } finally {
      setIsLoadingPrice(false);
    }
  }, []);

  useEffect(() => {
    fetchTONPrice();
    const interval = setInterval(fetchTONPrice, 60000); // Update price every minute
    return () => clearInterval(interval);
  }, [fetchTONPrice]);

  // Handle amount changes
  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    if (value === '') {
      setToAmount('');
      return;
    }

    const fromValue = parseFloat(value);
    if (isFromTON) {
      // TON to USDT
      const usdtAmount = ((fromValue * tonPrice) / usdtPrice).toFixed(2);
      setToAmount(usdtAmount);
    } else {
      // USDT to TON
      const tonAmount = ((fromValue * usdtPrice) / tonPrice).toFixed(6);
      setToAmount(tonAmount);
    }
  };

  const handleToAmountChange = (value: string) => {
    setToAmount(value);
    if (value === '') {
      setFromAmount('');
      return;
    }

    const toValue = parseFloat(value);
    if (isFromTON) {
      // USDT to TON (reverse calculation)
      const tonAmount = ((toValue * usdtPrice) / tonPrice).toFixed(6);
      setFromAmount(tonAmount);
    } else {
      // TON to USDT (reverse calculation)
      const usdtAmount = ((toValue * tonPrice) / usdtPrice).toFixed(2);
      setFromAmount(usdtAmount);
    }
  };

  // Handle token swap direction
  const handleSwapDirection = () => {
    setIsFromTON(!isFromTON);
    // Swap amounts and recalculate
    const tempFrom = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempFrom);
  };

  const handleSwap = async () => {
    if (!connected || !fromAmount || !wallet) return;
    setIsLoading(true);
    try {
      const amount = parseFloat(fromAmount);
      const message = {
        address: 'EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA', // Replace with your contract address
        amount: isFromTON ? amount * 1e9 : amount * 1e6, // Convert to nanoTON or microUSDT
        payload: {
          abi: 'swap',
          method: 'swap',
          params: {
            fromToken: isFromTON ? 'TON' : 'USDT',
            toToken: isFromTON ? 'USDT' : 'TON',
            amount: amount.toString(),
            minReceived: toAmount,
          },
        },
      };

      await wallet.sendTransaction({
        messages: [message],
        validUntil: Date.now() + 5 * 60 * 1000, // 5 minutes from now
      });
      // Clear inputs after successful swap
      setFromAmount('');
      setToAmount('');
    } catch (error) {
      console.error('Swap failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add this helper function
  const getAvailableBalance = useCallback(() => {
    if (!connected) return '0';
    return isFromTON ? balances.ton : balances.usdt;
  }, [connected, isFromTON, balances]);

  if (!connected) {
    return null;
  }

  return (
    <div className='bg-blue-800/30 backdrop-blur-sm p-8 rounded-lg border border-gold/20'>
      <div className='space-y-6'>
        {/* From Token */}
        <div className='space-y-2'>
          <label className='block text-sm font-medium text-blue-200'>
            From
          </label>
          <div className='relative'>
            <input
              type='number'
              value={fromAmount}
              onChange={(e) => handleFromAmountChange(e.target.value)}
              className='w-full bg-blue-900/50 border border-gold/20 rounded-lg px-4 py-3 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-gold/50'
              placeholder='0.0'
              min='0'
            />
            <div className='absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2'>
              <Coins className='w-5 h-5 text-gold' />
              <span className='text-gold'>{isFromTON ? 'TON' : 'USDT'}</span>
            </div>
          </div>
        </div>

        {/* Swap Icon */}
        <div className='flex justify-center'>
          <button
            onClick={handleSwapDirection}
            className='p-2 rounded-full bg-blue-700/50 hover:bg-blue-600/50 transition-colors'
          >
            <ArrowDownUp className='w-6 h-6 text-gold' />
          </button>
        </div>

        {/* To Token */}
        <div className='space-y-2'>
          <label className='block text-sm font-medium text-blue-200'>To</label>
          <div className='relative'>
            <input
              type='number'
              value={toAmount}
              onChange={(e) => handleToAmountChange(e.target.value)}
              className='w-full bg-blue-900/50 border border-gold/20 rounded-lg px-4 py-3 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-gold/50'
              placeholder='0.0'
              min='0'
            />
            <div className='absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2'>
              <Coins className='w-5 h-5 text-gold' />
              <span className='text-gold'>{isFromTON ? 'USDT' : 'TON'}</span>
            </div>
          </div>
        </div>

        {/* Exchange Rate Display */}
        <div className='text-sm text-blue-200 text-center'>
          {isLoadingPrice ? (
            <div className='flex items-center justify-center gap-2'>
              <Loader2 className='w-4 h-4 animate-spin' />
              <span>Loading rate...</span>
            </div>
          ) : (
            <p>1 TON = ${Number(tonPrice).toFixed(2)} USD</p>
          )}
        </div>

        {/* Available Balance Display */}
        <div className='text-sm text-blue-200 mt-2'>
          Available: {Number(getAvailableBalance()).toFixed(2)}{' '}
          {isFromTON ? 'TON' : 'USDT'}
          {parseFloat(balances.lendedTon) > 0 ||
            (parseFloat(balances.lendedUsdt) > 0 && (
              <div className='mt-1'>
                Lending Position: {balances.lendedTon} TON /{' '}
                {balances.lendedUsdt} USDT
              </div>
            ))}
        </div>

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={!connected || !fromAmount || isLoading}
          className='w-full bg-gradient-to-r from-yellow-600 to-yellow-500 text-white py-3 px-4 rounded-lg font-medium hover:from-yellow-500 hover:to-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
        >
          {isLoading ? (
            <>
              <Loader2 className='w-5 h-5 animate-spin' />
              Swapping...
            </>
          ) : (
            'Swap'
          )}
        </button>
      </div>
    </div>
  );
};

export default SwapInterface;
