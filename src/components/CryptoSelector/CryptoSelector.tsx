import { useState } from 'react';
import type { CryptoType, USDTNetwork } from '../../types';
import { CRYPTO_DATA, USDT_NETWORKS, getUSDTNetworkInfo } from '../../data/cryptoData';
import CryptoIcon from '../CryptoIcon';
import './CryptoSelector.css';

interface CryptoSelectorProps {
    selectedCrypto: CryptoType;
    selectedNetwork?: USDTNetwork;
    onCryptoChange: (crypto: CryptoType) => void;
    onNetworkChange?: (network: USDTNetwork) => void;
    label?: string;
}

const CryptoSelector = ({
    selectedCrypto,
    selectedNetwork,
    onCryptoChange,
    onNetworkChange,
    label = 'Select Currency',
}: CryptoSelectorProps) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const cryptoOptions: CryptoType[] = ['XMR', 'USDT', 'XTM'];
    const selectedCryptoData = CRYPTO_DATA[selectedCrypto];

    const handleCryptoSelect = (crypto: CryptoType) => {
        onCryptoChange(crypto);
        setIsDropdownOpen(false);
        // Default network for USDT
        if (crypto === 'USDT' && onNetworkChange) {
            onNetworkChange('TRC20');
        }
    };

    return (
        <div className="crypto-selector">
            <label className="selector-label">{label}</label>

            {/* Crypto Dropdown */}
            <div className="selector-dropdown">
                <button
                    className="selector-button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    style={{ '--crypto-color': selectedCryptoData?.color } as React.CSSProperties}
                >
                    <div className="selected-crypto">
                        <CryptoIcon
                            icon={selectedCryptoData?.icon || ''}
                            symbol={selectedCrypto}
                            size="lg"
                        />
                        <div className="crypto-info">
                            <span className="crypto-symbol">{selectedCrypto}</span>
                            <span className="crypto-name">{selectedCryptoData?.name}</span>
                        </div>
                    </div>
                    <i className={`fa-solid fa-chevron-down dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}></i>
                </button>

                {isDropdownOpen && (
                    <div className="dropdown-menu">
                        {cryptoOptions.map((crypto) => {
                            const cryptoData = CRYPTO_DATA[crypto];
                            return (
                                <button
                                    key={crypto}
                                    className={`dropdown-item ${selectedCrypto === crypto ? 'selected' : ''}`}
                                    onClick={() => handleCryptoSelect(crypto)}
                                    style={{ '--crypto-color': cryptoData?.color } as React.CSSProperties}
                                >
                                    <CryptoIcon
                                        icon={cryptoData?.icon || ''}
                                        symbol={crypto}
                                        size="lg"
                                    />
                                    <div className="crypto-info">
                                        <span className="crypto-symbol">{crypto}</span>
                                        <span className="crypto-name">{cryptoData?.name}</span>
                                    </div>
                                    {selectedCrypto === crypto && <i className="fa-solid fa-check check-icon"></i>}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Network Selector for USDT */}
            {selectedCrypto === 'USDT' && onNetworkChange && (
                <div className="network-selector">
                    <label className="network-label">Network</label>
                    <div className="network-grid">
                        {USDT_NETWORKS.map((network) => {
                            return (
                                <button
                                    key={network}
                                    className={`network-button ${selectedNetwork === network ? 'selected' : ''}`}
                                    onClick={() => onNetworkChange(network)}
                                >
                                    <span className="network-name">{network}</span>
                                    {selectedNetwork === network && (
                                        <i className="fa-solid fa-check network-check"></i>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    {selectedNetwork && (
                        <div className="network-info">
                            <div className="info-item">
                                <i className="fa-solid fa-money-bill-wave info-icon"></i>
                                <span>Fee: ${getUSDTNetworkInfo(selectedNetwork)?.fee}</span>
                            </div>
                            <div className="info-item">
                                <i className="fa-solid fa-check-double info-icon"></i>
                                <span>Confirmations: {getUSDTNetworkInfo(selectedNetwork)?.confirmations}</span>
                            </div>
                            <div className="info-item">
                                <i className="fa-solid fa-arrow-down info-icon"></i>
                                <span>Min Deposit: ${getUSDTNetworkInfo(selectedNetwork)?.minDeposit}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CryptoSelector;
