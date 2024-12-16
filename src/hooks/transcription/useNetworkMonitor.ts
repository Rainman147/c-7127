import { useState, useEffect } from 'react';
import { getNetworkInfo } from '@/utils/networkUtils';

export const useNetworkMonitor = () => {
  const [networkType, setNetworkType] = useState<string>('unknown');

  useEffect(() => {
    const checkNetwork = async () => {
      const network = await getNetworkInfo();
      setNetworkType(network.effectiveType);
      console.log('Current network conditions:', network);
    };

    checkNetwork();

    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', checkNetwork);
      return () => connection.removeEventListener('change', checkNetwork);
    }
  }, []);

  return networkType;
};