import { useTonConnectUI } from '@tonconnect/ui-react';
import { useCallback, useEffect, useState } from 'react';
import { CHAIN } from '@tonconnect/protocol';

// USDT Jetton master contract on mainnet
const USDT_MASTER_ADDRESS = 'EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA';

// Add this near the top of the file
const TONAPI_KEY = import.meta.env.VITE_TONAPI_KEY || 'YOUR_TONAPI_KEY';
const TONAPI_BASE_URL = 'https://tonapi.io/v2';

// Add these constants at the top
const INITIAL_RETRY_DELAY = 2000; // 2 seconds
const MAX_RETRY_DELAY = 60000; // 60 seconds
const UPDATE_INTERVAL = 60000; // 60 seconds
const MAX_RETRIES = 3;

// Add a custom error type
class ApiError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface TokenBalance {
  ton: string;
  usdt: string;
  lendedTon: string;
  lendedUsdt: string;
}

export function useTonConnect() {
  const [tonConnectUI] = useTonConnectUI();
  const [balances, setBalances] = useState<TokenBalance>({
    ton: '0',
    usdt: '0',
    lendedTon: '0',
    lendedUsdt: '0'
  });
  const [isConnected, setIsConnected] = useState(false);
  const [retryDelay, setRetryDelay] = useState(INITIAL_RETRY_DELAY);

  const fetchBalances = useCallback(async () => {
    if (!tonConnectUI.wallet) {
      setBalances({ ton: '0', usdt: '0', lendedTon: '0', lendedUsdt: '0' });
      return;
    }

    try {
      const address = tonConnectUI.wallet.account.address;
      const headers = {
        'Authorization': `Bearer ${TONAPI_KEY}`,
        'Accept': 'application/json',
      };

      // Helper function for fetching with retry
      const fetchWithRetry = async (url: string, retryCount = 0): Promise<any> => {
        try {
          const response = await fetch(url, { headers });
          
          if (response.status === 429) { // Too Many Requests
            if (retryCount < MAX_RETRIES) {
              const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, retryCount), MAX_RETRY_DELAY);
              console.log(`Rate limited, waiting ${delay/1000} seconds before retry ${retryCount + 1}/${MAX_RETRIES}`);
              await new Promise(resolve => setTimeout(resolve, delay));
              return fetchWithRetry(url, retryCount + 1);
            }
            throw new ApiError('Rate limit exceeded', 429);
          }
          
          if (!response.ok) {
            throw new ApiError(`Request failed: ${response.status} ${response.statusText}`, response.status);
          }
          
          const data = await response.json();
          return data;
        } catch (error) {
          if (error instanceof ApiError) {
            throw error;
          }
          // For network errors or other unknown errors
          if (retryCount < MAX_RETRIES) {
            const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, retryCount), MAX_RETRY_DELAY);
            console.log(`Network error, retrying in ${delay/1000} seconds (${retryCount + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWithRetry(url, retryCount + 1);
          }
          throw new ApiError(error instanceof Error ? error.message : 'Network error');
        }
      };

      // Fetch account info first
      const accountData = await fetchWithRetry(`${TONAPI_BASE_URL}/accounts/${address}`);
      const tonBalance = (parseFloat(accountData.balance) / 1e9).toFixed(2);

      // Wait a second before fetching jettons to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Then fetch USDT balance
      const jettonsData = await fetchWithRetry(`${TONAPI_BASE_URL}/accounts/${address}/jettons/balances`);
      const usdtJetton = jettonsData.balances?.find(
        (j: any) => j.jetton_address.toLowerCase() === USDT_MASTER_ADDRESS.toLowerCase()
      );
      const usdtBalance = usdtJetton ? (parseFloat(usdtJetton.balance) / 1e6).toFixed(2) : '0';

      setBalances({
        ton: tonBalance,
        usdt: usdtBalance,
        lendedTon: '0',
        lendedUsdt: '0'
      });
    } catch (error) {
      if (error instanceof ApiError) {
        console.error(`API Error: ${error.message}${error.status ? ` (${error.status})` : ''}`);
      } else {
        console.error('Error fetching balances:', error instanceof Error ? error.message : 'Unknown error');
      }
      // Keep existing balances on error
    }
  }, [tonConnectUI.wallet]);

  const checkConnection = useCallback(() => {
    const connected = !!tonConnectUI.connected;
    setIsConnected(connected);
    
    if (connected) {
      fetchBalances();
    }
  }, [tonConnectUI, fetchBalances]);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  useEffect(() => {
    const interval = setInterval(fetchBalances, UPDATE_INTERVAL); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [fetchBalances]);

  useEffect(() => {
    const unsubscribe = tonConnectUI.onStatusChange(checkConnection);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [tonConnectUI, checkConnection]);

  const disconnect = useCallback(async () => {
    if (tonConnectUI) {
      await tonConnectUI.disconnect();
      setBalances({ ton: '0', usdt: '0', lendedTon: '0', lendedUsdt: '0' });
      setIsConnected(false);
    }
  }, [tonConnectUI]);

  return {
    connected: isConnected,
    wallet: tonConnectUI.wallet,
    network: tonConnectUI.wallet?.account.chain || CHAIN.MAINNET,
    balances,
    refreshBalances: fetchBalances,
    disconnect,
  };
}