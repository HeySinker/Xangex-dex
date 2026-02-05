import type { USDTNetwork } from '../types';

// Deposit wallet addresses for each crypto
export const DEPOSIT_WALLETS: Record<string, string> = {
    // XMR (Monero)
    XMR: 'YOUR_MONERO_ADDRESS',

    // XTM (MinoTari)
    XTM: 'YOUR_XTM_ADDRESS',
};

// USDT Network-specific addresses
export const USDT_WALLETS: Record<USDTNetwork, string> = {
ERC20: 'YOUR_ERC20',
TRC20: 'YOUR_TRC20',
BEP20: 'YOUR_BEP20',
SOL: 'YOUR_SOL',
POLYGON: 'YOUR_POLYGON',
AVAX: 'YOUR_AVAX',
ARBITRUM: 'YOUR_ARBITRUM',
OPTIMISM: 'YOUR_OPTIMISM',
};

// Get deposit address for a crypto
export const getDepositAddress = (crypto: string, network?: USDTNetwork): string => {
    if (crypto === 'USDT' && network) {
        return USDT_WALLETS[network] || '';
    }
    return DEPOSIT_WALLETS[crypto] || '';
};

// Get network display name
export const getNetworkDisplayName = (network: USDTNetwork): string => {
    const names: Record<USDTNetwork, string> = {
        ERC20: 'Ethereum (ERC20)',
        TRC20: 'Tron (TRC20)',
        BEP20: 'BNB Smart Chain (BEP20)',
        SOL: 'Solana',
        POLYGON: 'Polygon',
        AVAX: 'Avalanche C-Chain',
        ARBITRUM: 'Arbitrum One',
        OPTIMISM: 'Optimism',
    };
    return names[network] || network;
};
