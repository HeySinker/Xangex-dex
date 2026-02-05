import { useState, useEffect } from 'react';
import type { Transaction } from '../../types';
import { CRYPTO_DATA } from '../../data/cryptoData';
import CryptoIcon from '../CryptoIcon';
import './TransactionsPage.css';

// LocalStorage key for transactions
const TRANSACTIONS_KEY = 'xangex_transactions';

const TransactionsPage = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    // Load transactions from localStorage
    useEffect(() => {
        const loadTransactions = () => {
            try {
                const stored = localStorage.getItem(TRANSACTIONS_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    // Convert date strings back to Date objects
                    const txs = parsed.map((tx: Transaction) => ({
                        ...tx,
                        createdAt: new Date(tx.createdAt),
                        updatedAt: new Date(tx.updatedAt),
                    }));
                    setTransactions(txs);
                }
            } catch (error) {
                console.error('Error loading transactions:', error);
            }
        };

        loadTransactions();

        // Listen for storage changes
        window.addEventListener('storage', loadTransactions);
        return () => window.removeEventListener('storage', loadTransactions);
    }, []);

    // Format date
    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    // Format relative time
    const getRelativeTime = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    // Clear history
    const clearHistory = () => {
        if (confirm('Are you sure you want to clear all transaction history?')) {
            localStorage.removeItem(TRANSACTIONS_KEY);
            setTransactions([]);
        }
    };

    return (
        <div className="transactions-page">
            <div className="transactions-container">
                {/* Header */}
                <div className="page-header">
                    <div className="header-content">
                        <h1 className="page-title">
                            <i className="fa-solid fa-clock-rotate-left"></i>
                            Transaction History
                        </h1>
                        <p className="page-subtitle">
                            Your recent exchange transactions
                        </p>
                    </div>
                    {transactions.length > 0 && (
                        <button className="clear-btn" onClick={clearHistory}>
                            <i className="fa-solid fa-trash"></i>
                            Clear
                        </button>
                    )}
                </div>

                {/* Transactions List */}
                <div className="transactions-list">
                    {transactions.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">
                                <i className="fa-solid fa-inbox"></i>
                            </div>
                            <h3>No Transactions Yet</h3>
                            <p>Your exchange history will appear here</p>
                        </div>
                    ) : (
                        transactions.map((tx) => (
                            <div key={tx.id} className="transaction-card">
                                <div className="tx-main">
                                    <div className="tx-pair">
                                        <div className="tx-from">
                                            <CryptoIcon
                                                icon={CRYPTO_DATA[tx.fromCrypto]?.icon || ''}
                                                symbol={tx.fromCrypto}
                                                size="md"
                                            />
                                            <div className="tx-amount">
                                                <span className="amount">-{tx.amount}</span>
                                                <span className="symbol">{tx.fromCrypto}</span>
                                            </div>
                                        </div>
                                        <div className="tx-arrow">
                                            <i className="fa-solid fa-arrow-right"></i>
                                        </div>
                                        <div className="tx-to">
                                            <CryptoIcon
                                                icon={CRYPTO_DATA[tx.toCrypto || '']?.icon || ''}
                                                symbol={tx.toCrypto || ''}
                                                size="md"
                                            />
                                            <div className="tx-amount">
                                                <span className="amount received">+{tx.receivedAmount?.toFixed(8)}</span>
                                                <span className="symbol">{tx.toCrypto}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="tx-meta">
                                        <span className="tx-time" title={formatDate(tx.createdAt)}>
                                            {getRelativeTime(tx.createdAt)}
                                        </span>
                                        <span className={`tx-status ${tx.status}`}>
                                            <i className={`fa-solid ${tx.status === 'completed' ? 'fa-check' : 'fa-clock'}`}></i>
                                            {tx.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="tx-details">
                                    <span className="tx-id">
                                        <i className="fa-solid fa-fingerprint"></i>
                                        {tx.id}
                                    </span>
                                    <span className="tx-fee">
                                        Fee: {tx.fee?.toFixed(8)} {tx.toCrypto}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Stats */}
                {transactions.length > 0 && (
                    <div className="transactions-stats">
                        <div className="stat">
                            <span className="stat-value">{transactions.length}</span>
                            <span className="stat-label">Total Exchanges</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">
                                {transactions.filter(tx => tx.status === 'completed').length}
                            </span>
                            <span className="stat-label">Completed</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TransactionsPage;
