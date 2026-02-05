import type { CryptoInfo, USDTNetwork } from '../types';

// Cryptocurrency Information with real logos
export const CRYPTO_DATA: Record<string, CryptoInfo> = {
    XMR: {
        type: 'XMR',
        name: 'Monero',
        symbol: 'XMR',
        icon: 'https://cryptologos.cc/logos/monero-xmr-logo.png?v=040',
        color: '#ff6600',
        fee: 0.0001,
        confirmations: 10,
        minDeposit: 0.001,
        minWithdraw: 0.01,
    },
    XTM: {
        type: 'XTM',
        name: 'MinoTari',
        symbol: 'XTM',
        icon: 'https://s2.coinmarketcap.com/static/img/coins/200x200/4258.png',
        color: '#9330FF',
        fee: 0.001,
        confirmations: 12,
        minDeposit: 1,
        minWithdraw: 10,
    },
    USDT: {
        type: 'USDT',
        name: 'Tether USD',
        symbol: 'USDT',
        icon: 'https://cryptologos.cc/logos/tether-usdt-logo.png?v=040',
        color: '#26a17b',
        networks: [
            {
                network: 'ERC20' as USDTNetwork,
                name: 'Ethereum (ERC20)',
                fee: 15,
                confirmations: 12,
                minDeposit: 20,
                minWithdraw: 30,
            },
            {
                network: 'TRC20' as USDTNetwork,
                name: 'Tron (TRC20)',
                fee: 1,
                confirmations: 20,
                minDeposit: 1,
                minWithdraw: 5,
            },
            {
                network: 'BEP20' as USDTNetwork,
                name: 'BNB Smart Chain (BEP20)',
                fee: 0.5,
                confirmations: 15,
                minDeposit: 5,
                minWithdraw: 10,
            },
            {
                network: 'SOL' as USDTNetwork,
                name: 'Solana',
                fee: 0.1,
                confirmations: 32,
                minDeposit: 1,
                minWithdraw: 5,
            },
            {
                network: 'POLYGON' as USDTNetwork,
                name: 'Polygon',
                fee: 0.5,
                confirmations: 128,
                minDeposit: 1,
                minWithdraw: 5,
            },
            {
                network: 'AVAX' as USDTNetwork,
                name: 'Avalanche C-Chain',
                fee: 0.5,
                confirmations: 12,
                minDeposit: 5,
                minWithdraw: 10,
            },
            {
                network: 'ARBITRUM' as USDTNetwork,
                name: 'Arbitrum One',
                fee: 0.5,
                confirmations: 12,
                minDeposit: 5,
                minWithdraw: 10,
            },
            {
                network: 'OPTIMISM' as USDTNetwork,
                name: 'Optimism',
                fee: 0.5,
                confirmations: 12,
                minDeposit: 5,
                minWithdraw: 10,
            },
        ],
    },
};

// Get network info for USDT
export const getUSDTNetworkInfo = (network: USDTNetwork) => {
    return CRYPTO_DATA.USDT.networks?.find((n) => n.network === network);
};

// Get crypto display name
export const getCryptoDisplayName = (crypto: string, network?: USDTNetwork): string => {
    if (crypto === 'USDT' && network) {
        const networkInfo = getUSDTNetworkInfo(network);
        return networkInfo ? `USDT (${networkInfo.name})` : `USDT (${network})`;
    }
    return CRYPTO_DATA[crypto]?.name || crypto;
};

// Available crypto types for deposits
export const DEPOSIT_CRYPTOS = ['XMR', 'USDT', 'XTM'] as const;

// USDT Networks list
export const USDT_NETWORKS: USDTNetwork[] = [
    'ERC20',
    'TRC20',
    'BEP20',
    'SOL',
    'POLYGON',
    'AVAX',
    'ARBITRUM',
    'OPTIMISM',
];
