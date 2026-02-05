import type { Wallet, WalletStatus, USDTNetwork, CryptoType } from '../types';

// Pre-generated wallet pool
// In production, these would be stored in a secure database
// Private keys should be encrypted and stored securely

// Generate a random wallet address (for demo purposes)
const generateAddress = (prefix: string, length: number = 40): string => {
    const chars = '0123456789abcdef';
    let result = prefix;
    for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
};

// Generate a random private key (for demo purposes)
const generatePrivateKey = (): string => {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < 64; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
};

// Create a wallet
const createWallet = (
    id: string,
    crypto: CryptoType,
    network?: USDTNetwork,
    status: WalletStatus = 'available'
): Wallet => {
    let address = '';

    switch (crypto) {
        case 'XMR':
            // Monero addresses start with 4 and are ~95 chars
            address = generateAddress('4', 94);
            break;
        case 'USDT':
            switch (network) {
                case 'ERC20':
                case 'BEP20':
                case 'POLYGON':
                case 'AVAX':
                case 'ARBITRUM':
                case 'OPTIMISM':
                    address = generateAddress('0x', 38);
                    break;
                case 'TRC20':
                    address = generateAddress('T', 33);
                    break;
                case 'SOL':
                    address = generateAddress('', 44);
                    break;
                default:
                    address = generateAddress('0x', 38);
            }
            break;
        case 'XTM':
            address = generateAddress('xtm', 40);
            break;
        default:
            address = generateAddress('0x', 38);
    }

    return {
        id,
        crypto,
        network,
        address,
        privateKey: generatePrivateKey(),
        status,
        createdAt: new Date(),
    };
};

// Initialize wallet pool with pre-generated wallets
const initializeWalletPool = (): Wallet[] => {
    const wallets: Wallet[] = [];

    // Generate XMR wallets (20 wallets)
    for (let i = 0; i < 20; i++) {
        wallets.push(createWallet(`xmr-${i + 1}`, 'XMR'));
    }

    // Generate XTM wallets (20 wallets)
    for (let i = 0; i < 20; i++) {
        wallets.push(createWallet(`xtm-${i + 1}`, 'XTM'));
    }

    // Generate USDT wallets for each network (10 wallets each)
    const usdtNetworks: USDTNetwork[] = ['ERC20', 'TRC20', 'BEP20', 'SOL', 'POLYGON', 'AVAX', 'ARBITRUM', 'OPTIMISM'];

    usdtNetworks.forEach(network => {
        for (let i = 0; i < 10; i++) {
            wallets.push(createWallet(`usdt-${network.toLowerCase()}-${i + 1}`, 'USDT', network));
        }
    });

    return wallets;
};

// Wallet Pool State
class WalletPool {
    private wallets: Wallet[];
    private storageKey = 'xangex_wallet_pool';

    constructor() {
        // Try to load from localStorage, otherwise initialize new pool
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            this.wallets = JSON.parse(stored).map((w: Wallet) => ({
                ...w,
                createdAt: new Date(w.createdAt),
                assignedAt: w.assignedAt ? new Date(w.assignedAt) : undefined,
            }));
        } else {
            this.wallets = initializeWalletPool();
            this.save();
        }
    }

    private save(): void {
        localStorage.setItem(this.storageKey, JSON.stringify(this.wallets));
    }

    // Get available wallet for a specific crypto and network
    getAvailableWallet(crypto: CryptoType, network?: USDTNetwork): Wallet | null {
        const wallet = this.wallets.find(
            (w) =>
                w.crypto === crypto &&
                w.status === 'available' &&
                (crypto !== 'USDT' || w.network === network)
        );
        return wallet || null;
    }

    // Assign wallet to a user
    assignWallet(walletId: string, userId: string): Wallet | null {
        const wallet = this.wallets.find((w) => w.id === walletId && w.status === 'available');
        if (wallet) {
            wallet.status = 'assigned';
            wallet.assignedTo = userId;
            wallet.assignedAt = new Date();
            this.save();
            return wallet;
        }
        return null;
    }

    // Mark wallet as used (after transaction is confirmed)
    markWalletAsUsed(walletId: string): boolean {
        const wallet = this.wallets.find((w) => w.id === walletId);
        if (wallet) {
            wallet.status = 'used';
            this.save();
            return true;
        }
        return false;
    }

    // Release wallet back to pool (if transaction expires/fails)
    releaseWallet(walletId: string): boolean {
        const wallet = this.wallets.find((w) => w.id === walletId);
        if (wallet) {
            wallet.status = 'available';
            wallet.assignedTo = undefined;
            wallet.assignedAt = undefined;
            this.save();
            return true;
        }
        return false;
    }

    // Get wallet by ID
    getWallet(walletId: string): Wallet | null {
        return this.wallets.find((w) => w.id === walletId) || null;
    }

    // Get all wallets assigned to a user
    getUserWallets(userId: string): Wallet[] {
        return this.wallets.filter((w) => w.assignedTo === userId);
    }

    // Get pool statistics
    getStats(): {
        total: number;
        available: number;
        assigned: number;
        used: number;
        byCrypto: Record<string, { total: number; available: number }>;
    } {
        const stats = {
            total: this.wallets.length,
            available: 0,
            assigned: 0,
            used: 0,
            byCrypto: {} as Record<string, { total: number; available: number }>,
        };

        this.wallets.forEach((w) => {
            // Count by status
            if (w.status === 'available') stats.available++;
            else if (w.status === 'assigned') stats.assigned++;
            else if (w.status === 'used') stats.used++;

            // Count by crypto
            const key = w.crypto === 'USDT' ? `USDT-${w.network}` : w.crypto;
            if (!stats.byCrypto[key]) {
                stats.byCrypto[key] = { total: 0, available: 0 };
            }
            stats.byCrypto[key].total++;
            if (w.status === 'available') {
                stats.byCrypto[key].available++;
            }
        });

        return stats;
    }

    // Get all wallets (for admin view)
    getAllWallets(): Wallet[] {
        return [...this.wallets];
    }

    // Add new wallets to the pool
    addWallets(crypto: CryptoType, count: number, network?: USDTNetwork): Wallet[] {
        const newWallets: Wallet[] = [];
        const existingCount = this.wallets.filter(
            (w) => w.crypto === crypto && w.network === network
        ).length;

        for (let i = 0; i < count; i++) {
            const id = `${crypto.toLowerCase()}${network ? `-${network.toLowerCase()}` : ''}-${existingCount + i + 1}`;
            const wallet = createWallet(id, crypto, network);
            newWallets.push(wallet);
            this.wallets.push(wallet);
        }

        this.save();
        return newWallets;
    }

    // Reset pool (for testing)
    reset(): void {
        this.wallets = initializeWalletPool();
        this.save();
    }
}

// Export singleton instance
export const walletPool = new WalletPool();

export default walletPool;
