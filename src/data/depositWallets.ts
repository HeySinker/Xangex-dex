import type { USDTNetwork } from '../types';

// Deposit wallet addresses for each crypto
export const DEPOSIT_WALLETS: Record<string, string> = {
    // XMR (Monero)
    XMR: '42t6cfVM1PR7LZTS4hampTAai5kT1rLzddNkKKAiTAg1cg3GHB8zVkv8pBjQ9uzWpwQMZgxn99BDtR3Fy5HRGKURJ39be59',

    // XTM (MinoTari)
    XTM: '12M9inQdua2FENjEvtDwTevM5YZQEaNeZ5uD1ZKQu5AtH8DJR2ozeSkaUFi1kTRDMNH2nBhp5Xw7xviXvDpGgjjy8pw',
};

// USDT Network-specific addresses
export const USDT_WALLETS: Record<USDTNetwork, string> = {
    ERC20: '0x350eF9e5139071bF09548A8702dE5f505A0F4422',
    TRC20: 'TJ634Td5cNS1RDKwhAmgKMyJp58ZyAtKHd',
    BEP20: '0x73dbf32b6289be78266b034c1bd5e45b9e501b60',
    SOL: 'GBokbpAmDB4caPVf7AayZQZ3eGfjGeUyZFQgRwZM5DvS',
    POLYGON: '0x73dbf32b6289be78266b034c1bd5e45b9e501b60',
    AVAX: '0x73dbf32b6289be78266b034c1bd5e45b9e501b60',
    ARBITRUM: '0x73dbf32b6289be78266b034c1bd5e45b9e501b60',
    OPTIMISM: '0x73dbf32b6289be78266b034c1bd5e45b9e501b60',
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
