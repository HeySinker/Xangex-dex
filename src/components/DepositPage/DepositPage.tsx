import { useState, useEffect } from 'react';
import type { CryptoType, USDTNetwork, Transaction } from '../../types';
import { CRYPTO_DATA, getUSDTNetworkInfo } from '../../data/cryptoData';
import walletPool from '../../data/walletPool';
import CryptoSelector from '../CryptoSelector';
import CryptoIcon from '../CryptoIcon';
import './DepositPage.css';

interface DepositPageProps {
    userId?: string;
}

const DepositPage = ({ userId = 'demo-user-1' }: DepositPageProps) => {
    const [selectedCrypto, setSelectedCrypto] = useState<CryptoType>('USDT');
    const [selectedNetwork, setSelectedNetwork] = useState<USDTNetwork>('TRC20');
    const [amount, setAmount] = useState<string>('');
    const [depositAddress, setDepositAddress] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [showAddress, setShowAddress] = useState(false);
    const [copied, setCopied] = useState(false);
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(30 * 60); // 30 minutes

    // Get crypto info
    const cryptoInfo = CRYPTO_DATA[selectedCrypto];
    const networkInfo = selectedCrypto === 'USDT' ? getUSDTNetworkInfo(selectedNetwork) : null;
    const minDeposit = networkInfo?.minDeposit || cryptoInfo?.minDeposit || 0;
    const confirmations = networkInfo?.confirmations || cryptoInfo?.confirmations || 0;

    // Timer countdown
    useEffect(() => {
        if (!showAddress || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleExpire();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [showAddress, timeLeft]);

    // Format time
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Handle deposit request
    const handleGenerateAddress = async () => {
        setIsLoading(true);

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Get available wallet from pool
        const wallet = walletPool.getAvailableWallet(
            selectedCrypto,
            selectedCrypto === 'USDT' ? selectedNetwork : undefined
        );

        if (!wallet) {
            alert('Sorry, no wallets available at the moment. Please try again later.');
            setIsLoading(false);
            return;
        }

        // Assign wallet to user
        walletPool.assignWallet(wallet.id, userId);

        // Create transaction record
        const newTransaction: Transaction = {
            id: `tx-${Date.now()}`,
            userId,
            type: 'deposit',
            status: 'pending',
            fromCrypto: selectedCrypto,
            fromNetwork: selectedCrypto === 'USDT' ? selectedNetwork : undefined,
            amount: parseFloat(amount) || 0,
            fee: networkInfo?.fee || cryptoInfo?.fee || 0,
            walletAddress: wallet.address,
            createdAt: new Date(),
            updatedAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
            confirmations: 0,
            requiredConfirmations: confirmations,
        };

        setTransaction(newTransaction);
        setDepositAddress(wallet.address);
        setShowAddress(true);
        setTimeLeft(30 * 60);
        setIsLoading(false);
    };

    // Handle address expiration
    const handleExpire = () => {
        setShowAddress(false);
        setDepositAddress('');
        setTransaction(null);
        alert('Address expired. Please generate a new one.');
    };

    // Copy address to clipboard
    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(depositAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Reset form
    const handleReset = () => {
        setShowAddress(false);
        setDepositAddress('');
        setAmount('');
        setTransaction(null);
        setTimeLeft(30 * 60);
    };

    return (
        <div className="deposit-page">
            <div className="deposit-container">
                {/* Header */}
                <div className="deposit-header">
                    <h1 className="deposit-title">
                        <i className="fa-solid fa-arrow-down title-icon"></i>
                        Deposit Crypto
                    </h1>
                    <p className="deposit-subtitle">
                        Deposit cryptocurrency to your account using the assigned address
                    </p>
                </div>

                {/* Main Content */}
                <div className="deposit-content">
                    {!showAddress ? (
                        /* Step 1: Select Crypto & Amount */
                        <div className="deposit-form card animate-fade-in">
                            <div className="card-body">
                                <CryptoSelector
                                    selectedCrypto={selectedCrypto}
                                    selectedNetwork={selectedNetwork}
                                    onCryptoChange={setSelectedCrypto}
                                    onNetworkChange={setSelectedNetwork}
                                    label="Select deposit currency"
                                />

                                <div className="input-group mt-lg">
                                    <label className="input-label">Amount (optional)</label>
                                    <div className="amount-input-wrapper">
                                        <input
                                            type="number"
                                            className="input amount-input"
                                            placeholder={`Minimum: ${minDeposit}`}
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            min={minDeposit}
                                        />
                                        <span className="amount-suffix">{selectedCrypto}</span>
                                    </div>
                                    <span className="input-hint">
                                        * You can deposit any amount above the minimum ({minDeposit} {selectedCrypto})
                                    </span>
                                </div>

                                {/* Info Cards */}
                                <div className="deposit-info-cards mt-lg">
                                    <div className="info-card">
                                        <i className="fa-solid fa-check-double info-icon"></i>
                                        <div className="info-content">
                                            <span className="info-title">Required Confirmations</span>
                                            <span className="info-value">{confirmations}</span>
                                        </div>
                                    </div>
                                    <div className="info-card">
                                        <i className="fa-solid fa-clock info-icon"></i>
                                        <div className="info-content">
                                            <span className="info-title">Address Validity</span>
                                            <span className="info-value">30 minutes</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    className="btn btn-primary btn-lg w-full mt-xl generate-btn"
                                    onClick={handleGenerateAddress}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <i className="fa-solid fa-spinner fa-spin"></i>
                                            Generating Address...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-key"></i>
                                            Generate Deposit Address
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Step 2: Show Deposit Address */
                        <div className="deposit-address card animate-slide-up">
                            <div className="card-body">
                                {/* Timer */}
                                <div className={`deposit-timer ${timeLeft < 300 ? 'warning' : ''}`}>
                                    <i className="fa-solid fa-stopwatch timer-icon"></i>
                                    <span className="timer-label">Time remaining:</span>
                                    <span className="timer-value">{formatTime(timeLeft)}</span>
                                </div>

                                {/* Crypto Badge */}
                                <div className="deposit-crypto-badge">
                                    <CryptoIcon
                                        icon={cryptoInfo?.icon || ''}
                                        symbol={selectedCrypto}
                                        size="lg"
                                    />
                                    <span className="crypto-label">
                                        {selectedCrypto}
                                        {selectedCrypto === 'USDT' && ` (${selectedNetwork})`}
                                    </span>
                                </div>

                                {/* QR Placeholder */}
                                <div className="qr-code-container">
                                    <div className="qr-code-placeholder">
                                        <i className="fa-solid fa-qrcode qr-icon"></i>
                                        <span className="qr-text">QR Code</span>
                                    </div>
                                </div>

                                {/* Address Display */}
                                <div className="address-container">
                                    <label className="address-label">Deposit Address</label>
                                    <div className="address-box">
                                        <code className="address-text">{depositAddress}</code>
                                        <button
                                            className={`copy-btn ${copied ? 'copied' : ''}`}
                                            onClick={copyToClipboard}
                                        >
                                            <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                                            {copied ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>
                                </div>

                                {/* Warning */}
                                <div className="deposit-warning">
                                    <i className="fa-solid fa-triangle-exclamation warning-icon"></i>
                                    <div className="warning-content">
                                        <strong>Important Warning:</strong>
                                        <ul>
                                            <li>
                                                Only send {selectedCrypto}
                                                {selectedCrypto === 'USDT' && ` on ${selectedNetwork} network`} to this address
                                            </li>
                                            <li>Sending other coins may result in permanent loss</li>
                                            <li>Balance will be credited after {confirmations} confirmation(s)</li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Transaction Status */}
                                {transaction && (
                                    <div className="transaction-status">
                                        <div className="status-header">
                                            <i className="fa-solid fa-hourglass-half status-icon animate-pulse"></i>
                                            <span className="status-text">Waiting for deposit...</span>
                                        </div>
                                        <div className="status-progress">
                                            <div className="progress-bar">
                                                <div
                                                    className="progress-fill"
                                                    style={{ width: `${(transaction.confirmations / confirmations) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="progress-text">
                                                {transaction.confirmations} / {confirmations} confirmations
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="deposit-actions">
                                    <button className="btn btn-secondary" onClick={handleReset}>
                                        <i className="fa-solid fa-rotate"></i>
                                        New Address
                                    </button>
                                    <button className="btn btn-primary">
                                        <i className="fa-solid fa-list"></i>
                                        View Transactions
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Instructions */}
                <div className="deposit-instructions card">
                    <div className="card-header">
                        <h3><i className="fa-solid fa-book"></i> How to Deposit</h3>
                    </div>
                    <div className="card-body">
                        <div className="instructions-steps">
                            <div className="step">
                                <div className="step-number">1</div>
                                <div className="step-content">
                                    <h4>Select Currency</h4>
                                    <p>Choose the cryptocurrency and network</p>
                                </div>
                            </div>
                            <div className="step">
                                <div className="step-number">2</div>
                                <div className="step-content">
                                    <h4>Copy Address</h4>
                                    <p>Get your unique deposit address</p>
                                </div>
                            </div>
                            <div className="step">
                                <div className="step-number">3</div>
                                <div className="step-content">
                                    <h4>Send Crypto</h4>
                                    <p>Transfer from your external wallet</p>
                                </div>
                            </div>
                            <div className="step">
                                <div className="step-number">4</div>
                                <div className="step-content">
                                    <h4>Wait for Confirmation</h4>
                                    <p>Balance credited after confirmation</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DepositPage;
