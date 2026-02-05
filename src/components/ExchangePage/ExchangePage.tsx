import { useState, useEffect, useRef } from 'react';
import type { CryptoType, USDTNetwork, Transaction } from '../../types';
import { CRYPTO_DATA } from '../../data/cryptoData';
import { getDepositAddress, getNetworkDisplayName } from '../../data/depositWallets';
import CryptoIcon from '../CryptoIcon';
import {
    subscribeToPrices,
    formatPrice,
    formatPercentage,
    COMMISSION_RATE,
    type PriceData
} from '../../services/priceService';
import { sendTelegramNotification } from '../../services/telegramService';
import './ExchangePage.css';

// LocalStorage key for transactions
const TRANSACTIONS_KEY = 'xangex_transactions';

// Save transaction to localStorage
const saveTransaction = (tx: Transaction) => {
    const existing = JSON.parse(localStorage.getItem(TRANSACTIONS_KEY) || '[]');
    existing.unshift(tx);
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(existing.slice(0, 50)));
};

const ExchangePage = () => {
    const [fromCrypto, setFromCrypto] = useState<CryptoType>('USDT');
    const [toCrypto, setToCrypto] = useState<CryptoType>('XMR');
    const [fromNetwork, setFromNetwork] = useState<USDTNetwork>('TRC20');
    const [toNetwork, setToNetwork] = useState<USDTNetwork>('TRC20');
    const [fromAmount, setFromAmount] = useState<string>('');
    const [toAmount, setToAmount] = useState<string>('');
    const [isSwapping, setIsSwapping] = useState(false);
    const [prices, setPrices] = useState<Record<string, PriceData>>({});
    const [isLoading, setIsLoading] = useState(true);

    // Modal States
    const [modalStep, setModalStep] = useState<'none' | 'confirm' | 'payment' | 'success' | 'expired'>('none');
    const [confirmCountdown, setConfirmCountdown] = useState(60);
    const [paymentCountdown, setPaymentCountdown] = useState(10 * 60); // 10 minutes
    const [copied, setCopied] = useState(false);

    // Address Confirmation State
    const [receiveAddress, setReceiveAddress] = useState('');
    const [isAddressConfirmed, setIsAddressConfirmed] = useState(false);

    // Dropdown states
    const [showFromDropdown, setShowFromDropdown] = useState(false);
    const [showToDropdown, setShowToDropdown] = useState(false);
    const [showFromNetworkDropdown, setShowFromNetworkDropdown] = useState(false);
    const [showToNetworkDropdown, setShowToNetworkDropdown] = useState(false);

    const fromDropdownRef = useRef<HTMLDivElement>(null);
    const toDropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (fromDropdownRef.current && !fromDropdownRef.current.contains(e.target as Node)) {
                setShowFromDropdown(false);
                setShowFromNetworkDropdown(false);
            }
            if (toDropdownRef.current && !toDropdownRef.current.contains(e.target as Node)) {
                setShowToDropdown(false);
                setShowToNetworkDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Subscribe to price updates
    useEffect(() => {
        const unsubscribe = subscribeToPrices((newPrices) => {
            setPrices(newPrices);
            setIsLoading(false);
        });
        return unsubscribe;
    }, []);

    // Confirmation countdown timer
    useEffect(() => {
        if (modalStep !== 'confirm' || isAddressConfirmed) return; // Stop if confirmed

        if (confirmCountdown <= 0) {
            setModalStep('none');
            return;
        }

        const timer = setInterval(() => {
            setConfirmCountdown(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [modalStep, confirmCountdown, isAddressConfirmed]);

    // Payment countdown timer
    useEffect(() => {
        if (modalStep !== 'payment') return;

        if (paymentCountdown <= 0) {
            setModalStep('expired');
            return;
        }

        const timer = setInterval(() => {
            setPaymentCountdown(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [modalStep, paymentCountdown]);

    // Format time MM:SS
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate exchange rate from real prices
    const getExchangeRate = (): number => {
        const fromPrice = prices[fromCrypto]?.current_price || 1;
        const toPrice = prices[toCrypto]?.current_price || 1;
        return fromPrice / toPrice;
    };

    const rate = getExchangeRate();
    const commissionPercent = COMMISSION_RATE * 100;

    // Update to amount when from amount or rate changes
    useEffect(() => {
        if (fromAmount && rate) {
            const calculated = parseFloat(fromAmount) * rate;
            const afterCommission = calculated * (1 - COMMISSION_RATE);
            setToAmount(afterCommission.toFixed(8));
        } else {
            setToAmount('');
        }
    }, [fromAmount, rate]);

    // Get deposit address
    const depositAddress = getDepositAddress(fromCrypto, fromCrypto === 'USDT' ? fromNetwork : undefined);

    // Handle exchange button click - show confirmation
    const handleExchangeClick = () => {
        if (!fromAmount || parseFloat(fromAmount) <= 0) return;
        setConfirmCountdown(60);
        setReceiveAddress('');
        setIsAddressConfirmed(false);
        setModalStep('confirm');
    };

    // Handle confirmation - proceed to payment
    const handleConfirmExchange = () => {
        setPaymentCountdown(10 * 60);
        setModalStep('payment');
    };

    // Handle payment sent confirmation
    const handlePaymentSent = () => {
        // Create transaction
        const tx: Transaction = {
            id: `tx-${Date.now()}`,
            userId: 'user',
            type: 'exchange',
            status: 'pending',
            fromCrypto,
            toCrypto,
            fromNetwork: fromCrypto === 'USDT' ? fromNetwork : undefined,
            toNetwork: toCrypto === 'USDT' ? toNetwork : undefined,
            amount: parseFloat(fromAmount),
            fee: parseFloat(fromAmount) * rate * COMMISSION_RATE,
            receivedAmount: parseFloat(toAmount),
            walletAddress: depositAddress,
            destinationAddress: receiveAddress,
            createdAt: new Date(),
            updatedAt: new Date(),
            confirmations: 0,
            requiredConfirmations: 10,
        };

        saveTransaction(tx);

        // Send Telegram Notification
        sendTelegramNotification(tx);

        setModalStep('success');
    };

    // Close modal and reset
    const handleCloseModal = () => {
        setModalStep('none');
        if (modalStep === 'success') {
            setFromAmount('');
            setToAmount('');
        }
    };

    // Copy address to clipboard
    const copyAddress = async () => {
        try {
            await navigator.clipboard.writeText(depositAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Swap currencies
    const handleSwap = () => {
        setIsSwapping(true);
        setTimeout(() => {
            const tempCrypto = fromCrypto;
            const tempNetwork = fromNetwork;
            setFromCrypto(toCrypto);
            setToCrypto(tempCrypto);
            setFromNetwork(toNetwork);
            setToNetwork(tempNetwork);
            setFromAmount('');
            setToAmount('');
            setIsSwapping(false);
        }, 300);
    };

    // Select crypto
    const selectFromCrypto = (crypto: CryptoType) => {
        if (crypto === toCrypto) {
            handleSwap();
        } else {
            setFromCrypto(crypto);
            if (crypto === 'USDT') setFromNetwork('TRC20');
        }
        setShowFromDropdown(false);
    };

    const selectToCrypto = (crypto: CryptoType) => {
        if (crypto === fromCrypto) {
            handleSwap();
        } else {
            setToCrypto(crypto);
            if (crypto === 'USDT') setToNetwork('TRC20');
        }
        setShowToDropdown(false);
    };

    // Get crypto info
    const fromCryptoData = CRYPTO_DATA[fromCrypto];
    const toCryptoData = CRYPTO_DATA[toCrypto];
    const cryptoList: CryptoType[] = ['XMR', 'USDT', 'XTM'];

    // Calculate amounts
    const fromAmountNum = parseFloat(fromAmount) || 0;
    const grossAmount = fromAmountNum * rate;
    const commission = grossAmount * COMMISSION_RATE;
    const netAmount = grossAmount - commission;

    return (
        <div className="exchange-page">
            {/* Hero Section with Prices */}
            <section className="exchange-hero">
                <div className="hero-content">
                    <h1 className="hero-title">
                        <span className="logo-gradient-animated">xangex</span>
                    </h1>
                    <p className="hero-subtitle">
                        100% Automated & Decentralized Exchange • 0.05% Fee Only • No Registration No KYC • Instant Transactions
                    </p>

                    {/* Live Prices Ticker - Horizontal */}
                    <div className="prices-ticker">
                        <div className="ticker-live">
                            <span className="live-dot"></span>
                            <span className="live-text">LIVE</span>
                        </div>
                        {isLoading ? (
                            <div className="ticker-loading">
                                <i className="fa-solid fa-spinner fa-spin"></i>
                            </div>
                        ) : (
                            <div className="ticker-track">
                                {Object.entries(prices).map(([symbol, data]) => (
                                    <div key={`${symbol}-1`} className="ticker-item">
                                        <CryptoIcon
                                            icon={CRYPTO_DATA[symbol]?.icon || ''}
                                            symbol={symbol}
                                            size="sm"
                                        />
                                        <span className="ticker-symbol">{symbol}</span>
                                        <span className="ticker-price">${formatPrice(data.current_price)}</span>
                                        <span className={`ticker-change ${data.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}`}>
                                            {formatPercentage(data.price_change_percentage_24h)}
                                        </span>
                                    </div>
                                ))}
                                {Object.entries(prices).map(([symbol, data]) => (
                                    <div key={`${symbol}-2`} className="ticker-item duplicate-item">
                                        <CryptoIcon
                                            icon={CRYPTO_DATA[symbol]?.icon || ''}
                                            symbol={symbol}
                                            size="sm"
                                        />
                                        <span className="ticker-symbol">{symbol}</span>
                                        <span className="ticker-price">${formatPrice(data.current_price)}</span>
                                        <span className={`ticker-change ${data.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}`}>
                                            {formatPercentage(data.price_change_percentage_24h)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Background */}
                <div className="hero-bg">
                    <div className="bg-orb orb-1"></div>
                    <div className="bg-orb orb-2"></div>
                </div>
            </section>

            {/* Exchange Card */}
            <section className="exchange-section">
                <div className="exchange-card">
                    {/* From Section */}
                    <div className="exchange-box">
                        <div className="box-header">
                            <span className="box-label">You Send</span>
                            {fromCrypto === 'USDT' && (
                                <div className="network-selector" ref={fromDropdownRef}>
                                    <button
                                        className="network-btn"
                                        onClick={() => setShowFromNetworkDropdown(!showFromNetworkDropdown)}
                                    >
                                        {fromNetwork}
                                        <i className="fa-solid fa-chevron-down"></i>
                                    </button>
                                    {showFromNetworkDropdown && (
                                        <div className="network-dropdown">
                                            {CRYPTO_DATA.USDT.networks?.map((n) => (
                                                <button
                                                    key={n.network}
                                                    className={`network-option ${fromNetwork === n.network ? 'active' : ''}`}
                                                    onClick={() => {
                                                        setFromNetwork(n.network);
                                                        setShowFromNetworkDropdown(false);
                                                    }}
                                                >
                                                    <span>{n.network}</span>
                                                    <span className="network-fee">Fee: ${n.fee}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="box-content">
                            <input
                                type="number"
                                className="amount-input"
                                placeholder="0.00"
                                value={fromAmount}
                                onChange={(e) => setFromAmount(e.target.value)}
                            />
                            <div className="crypto-selector" ref={fromDropdownRef}>
                                <button
                                    className="crypto-btn"
                                    onClick={() => setShowFromDropdown(!showFromDropdown)}
                                >
                                    <CryptoIcon
                                        icon={fromCryptoData?.icon || ''}
                                        symbol={fromCrypto}
                                        size="md"
                                    />
                                    <span className="crypto-name">{fromCrypto}</span>
                                    <i className="fa-solid fa-chevron-down"></i>
                                </button>
                                {showFromDropdown && (
                                    <div className="crypto-dropdown">
                                        {cryptoList.map((crypto) => (
                                            <button
                                                key={crypto}
                                                className={`crypto-option ${fromCrypto === crypto ? 'active' : ''}`}
                                                onClick={() => selectFromCrypto(crypto)}
                                            >
                                                <CryptoIcon
                                                    icon={CRYPTO_DATA[crypto]?.icon || ''}
                                                    symbol={crypto}
                                                    size="md"
                                                />
                                                <div className="crypto-info">
                                                    <span className="crypto-symbol">{crypto}</span>
                                                    <span className="crypto-fullname">{CRYPTO_DATA[crypto]?.name}</span>
                                                </div>
                                                {prices[crypto] && (
                                                    <span className="crypto-price">${formatPrice(prices[crypto].current_price)}</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Preset Amount Buttons (USDT values) */}
                        <div className="preset-amounts">
                            {[5000, 10000, 50000, 100000].map((usdtAmount) => {
                                const usdtPrice = prices['USDT']?.current_price || 1;
                                const cryptoPrice = prices[fromCrypto]?.current_price || 1;
                                const cryptoAmount = (usdtAmount * usdtPrice) / cryptoPrice;
                                return (
                                    <button
                                        key={usdtAmount}
                                        className={`preset-btn ${Math.abs(parseFloat(fromAmount) - cryptoAmount) < 0.0001 ? 'active' : ''}`}
                                        onClick={() => setFromAmount(cryptoAmount.toFixed(8))}
                                    >
                                        {usdtAmount >= 1000 ? `${usdtAmount / 1000}K` : usdtAmount} USDT
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Swap Button */}
                    <div className="swap-container">
                        <button
                            className={`swap-btn ${isSwapping ? 'swapping' : ''}`}
                            onClick={handleSwap}
                        >
                            <i className="fa-solid fa-arrow-down-up-across-line"></i>
                        </button>
                        <div className="rate-info">
                            1 {fromCrypto} ≈ {rate.toFixed(6)} {toCrypto}
                        </div>
                    </div>

                    {/* To Section */}
                    <div className="exchange-box">
                        <div className="box-header">
                            <span className="box-label">You Receive</span>
                            {toCrypto === 'USDT' && (
                                <div className="network-selector" ref={toDropdownRef}>
                                    <button
                                        className="network-btn"
                                        onClick={() => setShowToNetworkDropdown(!showToNetworkDropdown)}
                                    >
                                        {toNetwork}
                                        <i className="fa-solid fa-chevron-down"></i>
                                    </button>
                                    {showToNetworkDropdown && (
                                        <div className="network-dropdown">
                                            {CRYPTO_DATA.USDT.networks?.map((n) => (
                                                <button
                                                    key={n.network}
                                                    className={`network-option ${toNetwork === n.network ? 'active' : ''}`}
                                                    onClick={() => {
                                                        setToNetwork(n.network);
                                                        setShowToNetworkDropdown(false);
                                                    }}
                                                >
                                                    <span>{n.network}</span>
                                                    <span className="network-fee">Fee: ${n.fee}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="box-content">
                            <input
                                type="text"
                                className="amount-input"
                                placeholder="0.00"
                                value={toAmount}
                                readOnly
                            />
                            <div className="crypto-selector" ref={toDropdownRef}>
                                <button
                                    className="crypto-btn"
                                    onClick={() => setShowToDropdown(!showToDropdown)}
                                >
                                    <CryptoIcon
                                        icon={toCryptoData?.icon || ''}
                                        symbol={toCrypto}
                                        size="md"
                                    />
                                    <span className="crypto-name">{toCrypto}</span>
                                    <i className="fa-solid fa-chevron-down"></i>
                                </button>
                                {showToDropdown && (
                                    <div className="crypto-dropdown">
                                        {cryptoList.map((crypto) => (
                                            <button
                                                key={crypto}
                                                className={`crypto-option ${toCrypto === crypto ? 'active' : ''}`}
                                                onClick={() => selectToCrypto(crypto)}
                                            >
                                                <CryptoIcon
                                                    icon={CRYPTO_DATA[crypto]?.icon || ''}
                                                    symbol={crypto}
                                                    size="md"
                                                />
                                                <div className="crypto-info">
                                                    <span className="crypto-symbol">{crypto}</span>
                                                    <span className="crypto-fullname">{CRYPTO_DATA[crypto]?.name}</span>
                                                </div>
                                                {prices[crypto] && (
                                                    <span className="crypto-price">${formatPrice(prices[crypto].current_price)}</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    {fromAmountNum > 0 && (
                        <div className="exchange-summary">
                            <div className="summary-row">
                                <span>Exchange Rate</span>
                                <span>1 {fromCrypto} = {rate.toFixed(6)} {toCrypto}</span>
                            </div>
                            <div className="summary-row">
                                <span>Platform Fee ({commissionPercent}%)</span>
                                <span>-{commission.toFixed(8)} {toCrypto}</span>
                            </div>
                            <div className="summary-row total">
                                <span>You Receive</span>
                                <span>{netAmount.toFixed(8)} {toCrypto}</span>
                            </div>
                        </div>
                    )}

                    {/* Exchange Button */}
                    <button
                        className="exchange-btn"
                        onClick={handleExchangeClick}
                        disabled={!fromAmount || parseFloat(fromAmount) <= 0}
                    >
                        <i className="fa-solid fa-right-left"></i>
                        Exchange Now
                    </button>
                </div>
            </section>

            {/* Features */}
            <section className="features-section">
                <div className="features-grid">
                    <div className="feature">
                        <i className="fa-solid fa-shield-halved"></i>
                        <span>Secure</span>
                    </div>
                    <div className="feature">
                        <i className="fa-solid fa-bolt"></i>
                        <span>Fast</span>
                    </div>
                    <div className="feature">
                        <i className="fa-solid fa-lock"></i>
                        <span>Private</span>
                    </div>
                    <div className="feature">
                        <i className="fa-solid fa-percent"></i>
                        <span>Low Fees</span>
                    </div>
                </div>
            </section>

            {/* ============ MODALS ============ */}

            {/* Step 1: Confirmation Modal (60 seconds) */}
            {modalStep === 'confirm' && (
                <div className="modal-overlay">
                    <div className="payment-modal confirm-modal">
                        <div className="confirm-timer">
                            <div className={`timer-circle ${confirmCountdown <= 10 && !isAddressConfirmed ? 'urgent' : ''} ${isAddressConfirmed ? 'stopped' : ''}`}>
                                {isAddressConfirmed ? (
                                    <i className="fa-solid fa-check" style={{ fontSize: '2rem', color: 'var(--color-success-light)' }}></i>
                                ) : (
                                    <>
                                        <span className="timer-number">{confirmCountdown}</span>
                                        <span className="timer-label">sec</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <h2>Confirm Your Exchange</h2>
                        <p className="confirm-subtitle">Please obtain and verify your receiving address</p>

                        {/* Exchange Summary */}
                        <div className="modal-summary">
                            <div className="summary-item">
                                <div className="summary-crypto">
                                    <CryptoIcon icon={fromCryptoData?.icon || ''} symbol={fromCrypto} size="lg" />
                                    <div>
                                        <span className="crypto-amount">{parseFloat(fromAmount).toFixed(8)}</span>
                                        <span className="crypto-label">{fromCrypto}</span>
                                    </div>
                                </div>
                                <i className="fa-solid fa-arrow-right summary-arrow"></i>
                                <div className="summary-crypto">
                                    <CryptoIcon icon={toCryptoData?.icon || ''} symbol={toCrypto} size="lg" />
                                    <div>
                                        <span className="crypto-amount">{parseFloat(toAmount).toFixed(8)}</span>
                                        <span className="crypto-label">{toCrypto}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Address Input Section */}
                        <div className="address-confirmation-section">
                            <label className="input-label">
                                Your {toCrypto} {toCrypto === 'USDT' ? `(${toNetwork})` : ''} Wallet Address
                            </label>
                            <div className="address-input-group">
                                <input
                                    type="text"
                                    className={`address-input ${isAddressConfirmed ? 'confirmed' : ''}`}
                                    placeholder={`Paste your ${toCrypto} ${toCrypto === 'USDT' ? toNetwork : ''} address here`}
                                    value={receiveAddress}
                                    onChange={(e) => setReceiveAddress(e.target.value)}
                                    readOnly={isAddressConfirmed}
                                />
                                {!isAddressConfirmed ? (
                                    <button
                                        className="btn-verify"
                                        onClick={() => {
                                            if (receiveAddress.length > 5) {
                                                setIsAddressConfirmed(true);
                                            }
                                        }}
                                        disabled={receiveAddress.length <= 5}
                                        title="Verify Address"
                                    >
                                        <i className="fa-solid fa-check"></i>
                                    </button>
                                ) : (
                                    <button
                                        className="btn-edit"
                                        onClick={() => setIsAddressConfirmed(false)}
                                        title="Edit Address"
                                    >
                                        <i className="fa-solid fa-pen"></i>
                                    </button>
                                )}
                            </div>
                            {isAddressConfirmed && (
                                <div className="address-verified-msg">
                                    <i className="fa-solid fa-shield-check"></i>
                                    <span>Address confirmed!</span>
                                </div>
                            )}
                        </div>

                        <div className="confirm-rate">
                            <span>Rate: 1 {fromCrypto} = {rate.toFixed(6)} {toCrypto}</span>
                            <span>Fee: {commissionPercent}%</span>
                        </div>

                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={handleCloseModal}>
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleConfirmExchange}
                                disabled={!isAddressConfirmed}
                            >
                                <i className="fa-solid fa-check"></i>
                                Confirm Exchange
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2: Payment Modal (10 minutes) */}
            {modalStep === 'payment' && (
                <div className="modal-overlay">
                    <div className="payment-modal">
                        {/* Payment Timer */}
                        <div className={`payment-timer ${paymentCountdown < 120 ? 'urgent' : ''}`}>
                            <i className="fa-solid fa-stopwatch"></i>
                            <span className="timer-text">Time remaining: </span>
                            <span className="timer-value">{formatTime(paymentCountdown)}</span>
                        </div>

                        {/* Modal Header */}
                        <div className="modal-header">
                            <div className="modal-icon">
                                <i className="fa-solid fa-arrow-right-arrow-left"></i>
                            </div>
                            <h2>Complete Your Exchange</h2>
                            <p>Send {parseFloat(fromAmount).toFixed(8)} {fromCrypto} to the address below</p>
                        </div>

                        {/* Exchange Summary */}
                        <div className="modal-summary">
                            <div className="summary-item">
                                <div className="summary-crypto">
                                    <CryptoIcon icon={fromCryptoData?.icon || ''} symbol={fromCrypto} size="lg" />
                                    <div>
                                        <span className="crypto-amount">{parseFloat(fromAmount).toFixed(8)}</span>
                                        <span className="crypto-label">{fromCrypto}</span>
                                    </div>
                                </div>
                                <i className="fa-solid fa-arrow-right summary-arrow"></i>
                                <div className="summary-crypto">
                                    <CryptoIcon icon={toCryptoData?.icon || ''} symbol={toCrypto} size="lg" />
                                    <div>
                                        <span className="crypto-amount">{parseFloat(toAmount).toFixed(8)}</span>
                                        <span className="crypto-label">{toCrypto}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Deposit Address */}
                        <div className="deposit-section">
                            <div className="deposit-label">
                                <i className="fa-solid fa-wallet"></i>
                                Send {fromCrypto} {fromCrypto === 'USDT' ? `(${getNetworkDisplayName(fromNetwork)})` : ''} to:
                            </div>
                            <div className="deposit-address">
                                <code className="address-text">{depositAddress}</code>
                                <button
                                    className={`copy-btn ${copied ? 'copied' : ''}`}
                                    onClick={copyAddress}
                                >
                                    <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                                </button>
                            </div>
                        </div>

                        {/* Trust Badges */}
                        <div className="trust-badges">
                            <div className="badge">
                                <i className="fa-solid fa-shield-check"></i>
                                <span>Secure Transaction</span>
                            </div>
                            <div className="badge">
                                <i className="fa-solid fa-clock"></i>
                                <span>Fast Processing</span>
                            </div>
                            <div className="badge">
                                <i className="fa-solid fa-lock"></i>
                                <span>Privacy Protected</span>
                            </div>
                        </div>

                        {/* Warnings */}
                        <div className="modal-warnings">
                            <div className="warning-item success">
                                <i className="fa-solid fa-circle-check"></i>
                                <span>Your exchange will be processed automatically after blockchain confirmation</span>
                            </div>
                            <div className="warning-item info">
                                <i className="fa-solid fa-sliders"></i>
                                <span>Minor amount differences will be adjusted automatically - no worries!</span>
                            </div>
                            <div className="warning-item info">
                                <i className="fa-solid fa-clock"></i>
                                <span>Processing time: 10-30 minutes depending on network congestion</span>
                            </div>
                            <div className="warning-item caution">
                                <i className="fa-solid fa-triangle-exclamation"></i>
                                <span>If the amount differs by more than $50, the transaction will be considered invalid</span>
                            </div>
                            <div className="warning-item caution">
                                <i className="fa-solid fa-triangle-exclamation"></i>
                                <span>Only send {fromCrypto} {fromCrypto === 'USDT' ? `on ${fromNetwork} network` : ''} to this address</span>
                            </div>
                            <div className="warning-item caution">
                                <i className="fa-solid fa-ban"></i>
                                <span>If no payment is received within 10 minutes, this order will be cancelled</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={handleCloseModal}>
                                Cancel Order
                            </button>
                            <button className="btn-primary" onClick={handlePaymentSent}>
                                <i className="fa-solid fa-check"></i>
                                I've Sent the Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Success Modal */}
            {modalStep === 'success' && (
                <div className="modal-overlay">
                    <div className="payment-modal">
                        <div className="payment-success">
                            <div className="success-icon">
                                <i className="fa-solid fa-circle-check"></i>
                            </div>
                            <h2>Exchange Request Submitted!</h2>
                            <p>Your exchange is being processed. You will receive your {toCrypto} once we confirm your payment on the blockchain.</p>

                            <div className="success-details">
                                <div className="detail-row">
                                    <span>Transaction ID</span>
                                    <span className="mono">#{Date.now().toString(36).toUpperCase()}</span>
                                </div>
                                <div className="detail-row">
                                    <span>Status</span>
                                    <span className="status-pending">
                                        <i className="fa-solid fa-clock"></i> Awaiting Confirmation
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <span>Expected Time</span>
                                    <span>10-30 minutes</span>
                                </div>
                            </div>

                            <div className="success-notice">
                                <i className="fa-solid fa-bell"></i>
                                <span>You can track this transaction in your History</span>
                            </div>

                            <button className="btn-primary full-width" onClick={handleCloseModal}>
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Expired Modal */}
            {modalStep === 'expired' && (
                <div className="modal-overlay">
                    <div className="payment-modal">
                        <div className="payment-expired">
                            <div className="expired-icon">
                                <i className="fa-solid fa-clock-rotate-left"></i>
                            </div>
                            <h2>Order Expired</h2>
                            <p>The 10-minute payment window has passed. This order has been automatically cancelled.</p>

                            <div className="expired-info">
                                <i className="fa-solid fa-info-circle"></i>
                                <span>If you have already sent the payment, please contact support with your transaction details.</span>
                            </div>

                            <button className="btn-primary full-width" onClick={handleCloseModal}>
                                Start New Exchange
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExchangePage;
