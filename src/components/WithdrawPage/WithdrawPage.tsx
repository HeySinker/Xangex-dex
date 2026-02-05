import { useState } from 'react';
import type { CryptoType, USDTNetwork } from '../../types';
import { CRYPTO_DATA, getUSDTNetworkInfo } from '../../data/cryptoData';
import CryptoSelector from '../CryptoSelector';
import CryptoIcon from '../CryptoIcon';
import './WithdrawPage.css';

const WithdrawPage = () => {
    const [selectedCrypto, setSelectedCrypto] = useState<CryptoType>('USDT');
    const [selectedNetwork, setSelectedNetwork] = useState<USDTNetwork>('TRC20');
    const [amount, setAmount] = useState<string>('');
    const [address, setAddress] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');

    // Simulated balances
    const balances: Record<string, number> = {
        XMR: 2.5,
        USDT: 1250.00,
        XTM: 15000,
    };

    // Get crypto info
    const cryptoInfo = CRYPTO_DATA[selectedCrypto];
    const networkInfo = selectedCrypto === 'USDT' ? getUSDTNetworkInfo(selectedNetwork) : null;
    const minWithdraw = networkInfo?.minWithdraw || cryptoInfo?.minWithdraw || 0;
    const fee = networkInfo?.fee || cryptoInfo?.fee || 0;
    const balance = balances[selectedCrypto] || 0;

    // Calculate amounts
    const amountNum = parseFloat(amount) || 0;
    const totalAmount = amountNum + fee;
    const receiveAmount = amountNum;
    const isValidAmount = amountNum >= minWithdraw && totalAmount <= balance;
    const isValidAddress = address.length > 10;

    const handleSubmit = async () => {
        if (!isValidAmount || !isValidAddress) return;
        setStep('confirm');
    };

    const handleConfirm = async () => {
        setIsProcessing(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setIsProcessing(false);
        setStep('success');
    };

    const handleReset = () => {
        setAmount('');
        setAddress('');
        setStep('form');
    };

    const handleMax = () => {
        const maxAmount = Math.max(0, balance - fee);
        setAmount(maxAmount.toString());
    };

    return (
        <div className="withdraw-page">
            <div className="withdraw-container">
                {/* Header */}
                <div className="withdraw-header">
                    <h1 className="page-title">
                        <i className="fa-solid fa-arrow-up title-icon"></i>
                        Withdraw Crypto
                    </h1>
                    <p className="page-subtitle">
                        Withdraw your cryptocurrency to an external wallet
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="progress-steps">
                    <div className={`step ${step === 'form' ? 'active' : (step === 'confirm' || step === 'success') ? 'completed' : ''}`}>
                        <span className="step-number">1</span>
                        <span className="step-label">Details</span>
                    </div>
                    <div className="step-line"></div>
                    <div className={`step ${step === 'confirm' ? 'active' : step === 'success' ? 'completed' : ''}`}>
                        <span className="step-number">2</span>
                        <span className="step-label">Confirm</span>
                    </div>
                    <div className="step-line"></div>
                    <div className={`step ${step === 'success' ? 'active' : ''}`}>
                        <span className="step-number">3</span>
                        <span className="step-label">Complete</span>
                    </div>
                </div>

                {/* Form Step */}
                {step === 'form' && (
                    <div className="withdraw-form card animate-fade-in">
                        <div className="card-body">
                            {/* Crypto Selection */}
                            <CryptoSelector
                                selectedCrypto={selectedCrypto}
                                selectedNetwork={selectedNetwork}
                                onCryptoChange={setSelectedCrypto}
                                onNetworkChange={setSelectedNetwork}
                                label="Select withdrawal currency"
                            />

                            {/* Balance Display */}
                            <div className="balance-display mt-lg">
                                <span className="balance-label">Available Balance:</span>
                                <span className="balance-value">
                                    {balance.toLocaleString()} {selectedCrypto}
                                </span>
                            </div>

                            {/* Amount Input */}
                            <div className="input-group mt-lg">
                                <label className="input-label">Amount</label>
                                <div className="amount-input-wrapper">
                                    <input
                                        type="number"
                                        className="input amount-input"
                                        placeholder={`Minimum: ${minWithdraw}`}
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        min={minWithdraw}
                                        max={balance - fee}
                                    />
                                    <button className="max-btn" onClick={handleMax}>
                                        MAX
                                    </button>
                                    <span className="amount-suffix">{selectedCrypto}</span>
                                </div>
                                {amountNum > 0 && amountNum < minWithdraw && (
                                    <span className="input-error">
                                        Minimum withdrawal is {minWithdraw} {selectedCrypto}
                                    </span>
                                )}
                                {totalAmount > balance && (
                                    <span className="input-error">
                                        Insufficient balance (Required: {totalAmount} including fees)
                                    </span>
                                )}
                            </div>

                            {/* Address Input */}
                            <div className="input-group mt-lg">
                                <label className="input-label">
                                    External Wallet Address
                                    {selectedCrypto === 'USDT' && selectedNetwork && (
                                        <span className="network-hint"> ({selectedNetwork})</span>
                                    )}
                                </label>
                                <input
                                    type="text"
                                    className="input input-mono"
                                    placeholder={`Enter ${selectedCrypto} wallet address`}
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                />
                                {address && address.length <= 10 && (
                                    <span className="input-error">Invalid wallet address</span>
                                )}
                            </div>

                            {/* Fee Info */}
                            <div className="fee-info mt-lg">
                                <div className="fee-row">
                                    <span className="fee-label">Withdrawal Amount:</span>
                                    <span className="fee-value">{amountNum || 0} {selectedCrypto}</span>
                                </div>
                                <div className="fee-row">
                                    <span className="fee-label">Network Fee:</span>
                                    <span className="fee-value">
                                        {selectedCrypto === 'USDT' ? `$${fee}` : `${fee} ${selectedCrypto}`}
                                    </span>
                                </div>
                                <div className="fee-row total">
                                    <span className="fee-label">You will receive:</span>
                                    <span className="fee-value success">{receiveAmount || 0} {selectedCrypto}</span>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                className="btn btn-primary btn-lg w-full mt-xl"
                                onClick={handleSubmit}
                                disabled={!isValidAmount || !isValidAddress}
                            >
                                <i className="fa-solid fa-arrow-right"></i>
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {/* Confirm Step */}
                {step === 'confirm' && (
                    <div className="withdraw-confirm card animate-slide-up">
                        <div className="card-body">
                            <div className="confirm-header">
                                <i className="fa-solid fa-shield-halved confirm-icon"></i>
                                <h2>Confirm Withdrawal</h2>
                                <p>Please review the withdrawal details before confirming</p>
                            </div>

                            <div className="confirm-details">
                                <div className="detail-row">
                                    <span className="detail-label">Currency:</span>
                                    <span className="detail-value">
                                        <CryptoIcon
                                            icon={cryptoInfo?.icon || ''}
                                            symbol={selectedCrypto}
                                            size="sm"
                                        /> {selectedCrypto}
                                        {selectedCrypto === 'USDT' && ` (${selectedNetwork})`}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Amount:</span>
                                    <span className="detail-value">{amountNum} {selectedCrypto}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Fee:</span>
                                    <span className="detail-value">
                                        {selectedCrypto === 'USDT' ? `$${fee}` : `${fee} ${selectedCrypto}`}
                                    </span>
                                </div>
                                <div className="detail-row highlight">
                                    <span className="detail-label">You will receive:</span>
                                    <span className="detail-value success">{receiveAmount} {selectedCrypto}</span>
                                </div>
                                <div className="detail-row address">
                                    <span className="detail-label">To Address:</span>
                                    <code className="detail-value address-value">{address}</code>
                                </div>
                            </div>

                            <div className="confirm-warning">
                                <i className="fa-solid fa-triangle-exclamation warning-icon"></i>
                                <p>
                                    Ensure the address and network are correct. Blockchain transactions cannot be reversed.
                                </p>
                            </div>

                            <div className="confirm-actions">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setStep('form')}
                                    disabled={isProcessing}
                                >
                                    <i className="fa-solid fa-arrow-left"></i>
                                    Back
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleConfirm}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? (
                                        <>
                                            <i className="fa-solid fa-spinner fa-spin"></i>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-check"></i>
                                            Confirm Withdrawal
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success Step */}
                {step === 'success' && (
                    <div className="withdraw-success card animate-slide-up">
                        <div className="card-body">
                            <div className="success-animation">
                                <i className="fa-solid fa-check success-icon"></i>
                            </div>
                            <h2>Withdrawal Request Submitted!</h2>
                            <p>
                                Your withdrawal request will be processed within minutes.
                                You can track the transaction status in the History page.
                            </p>

                            <div className="success-details">
                                <div className="detail-row">
                                    <span className="detail-label">Transaction ID:</span>
                                    <span className="detail-value font-mono">#WD-{Date.now().toString(36).toUpperCase()}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Amount:</span>
                                    <span className="detail-value">{receiveAmount} {selectedCrypto}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Status:</span>
                                    <span className="badge badge-warning">Processing</span>
                                </div>
                            </div>

                            <div className="success-actions">
                                <button className="btn btn-secondary" onClick={handleReset}>
                                    <i className="fa-solid fa-plus"></i>
                                    New Withdrawal
                                </button>
                                <button className="btn btn-primary">
                                    <i className="fa-solid fa-list"></i>
                                    View History
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WithdrawPage;
