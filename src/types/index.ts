// ================================================
// XANGEX - Type Definitions
// ================================================

// Supported Cryptocurrencies
export type CryptoType = 'XMR' | 'USDT' | 'XTM';

// USDT Network Types
export type USDTNetwork = 'ERC20' | 'TRC20' | 'BEP20' | 'SOL' | 'POLYGON' | 'AVAX' | 'ARBITRUM' | 'OPTIMISM';

// Wallet Status
export type WalletStatus = 'available' | 'assigned' | 'used';

// Transaction Status
export type TransactionStatus = 'pending' | 'confirmed' | 'completed' | 'failed' | 'expired';

// Transaction Type
export type TransactionType = 'deposit' | 'withdraw' | 'exchange';

// Pre-generated Wallet Interface
export interface Wallet {
  id: string;
  crypto: CryptoType;
  network?: USDTNetwork; // Only for USDT
  address: string;
  privateKey: string; // In production, this should be encrypted/secured
  status: WalletStatus;
  assignedTo?: string; // User ID
  assignedAt?: Date;
  createdAt: Date;
}

// User Interface
export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
  wallets: UserWallet[];
  kycVerified: boolean;
}

// User's Assigned Wallet
export interface UserWallet {
  walletId: string;
  crypto: CryptoType;
  network?: USDTNetwork;
  address: string;
  balance: number;
  lastUpdated: Date;
}

// Transaction Interface
export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  status: TransactionStatus;
  fromCrypto: CryptoType;
  toCrypto?: CryptoType; // For exchange transactions
  fromNetwork?: USDTNetwork;
  toNetwork?: USDTNetwork;
  amount: number;
  fee: number;
  receivedAmount?: number;
  walletAddress: string;
  destinationAddress?: string; // User's receiving address
  txHash?: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  confirmations: number;
  requiredConfirmations: number;
}

// Exchange Rate
export interface ExchangeRate {
  from: CryptoType;
  to: CryptoType;
  rate: number;
  lastUpdated: Date;
}

// Deposit Request
export interface DepositRequest {
  crypto: CryptoType;
  network?: USDTNetwork;
  amount: number;
}

// Withdraw Request
export interface WithdrawRequest {
  crypto: CryptoType;
  network?: USDTNetwork;
  amount: number;
  destinationAddress: string;
}

// Exchange Request  
export interface ExchangeRequest {
  fromCrypto: CryptoType;
  toCrypto: CryptoType;
  fromNetwork?: USDTNetwork;
  toNetwork?: USDTNetwork;
  amount: number;
}

// Crypto Info
export interface CryptoInfo {
  type: CryptoType;
  name: string;
  symbol: string;
  icon: string;
  color: string;
  networks?: {
    network: USDTNetwork;
    name: string;
    fee: number;
    confirmations: number;
    minDeposit: number;
    minWithdraw: number;
  }[];
  fee?: number;
  confirmations?: number;
  minDeposit?: number;
  minWithdraw?: number;
}

// Wallet Pool Stats
export interface WalletPoolStats {
  crypto: CryptoType;
  network?: USDTNetwork;
  total: number;
  available: number;
  assigned: number;
  used: number;
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Paginated Response
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination;
}
