import { useState, useEffect } from 'react';
import walletPool from '../../data/walletPool';
import './WalletsPage.css';

const WalletsPage = () => {
    const [stats, setStats] = useState(walletPool.getStats());
    const [wallets, setWallets] = useState(walletPool.getAllWallets());

    useEffect(() => {
        // Refresh stats periodically
        const interval = setInterval(() => {
            setStats(walletPool.getStats());
            setWallets(walletPool.getAllWallets());
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Handle reset pool
    const handleResetPool = () => {
        if (confirm('Are you sure you want to reset the wallet pool? This action cannot be undone.')) {
            walletPool.reset();
            setStats(walletPool.getStats());
            setWallets(walletPool.getAllWallets());
        }
    };

    // Get wallet groups
    const walletGroups = Object.entries(stats.byCrypto).map(([key, value]) => ({
        key,
        ...value,
        usagePercent: ((value.total - value.available) / value.total) * 100,
    }));

    // Get recent wallets
    const recentWallets = wallets
        .filter((w) => w.status !== 'available')
        .slice(0, 10);

    return (
        <div className="wallets-page">
            <div className="wallets-container">
                {/* Header */}
                <div className="wallets-header">
                    <h1 className="page-title">
                        <i className="fa-solid fa-wallet title-icon"></i>
                        Wallet Pool Management
                    </h1>
                    <p className="page-subtitle">
                        Monitor and manage pre-generated wallets
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card total">
                        <div className="stat-icon">
                            <i className="fa-solid fa-database"></i>
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{stats.total}</span>
                            <span className="stat-label">Total Wallets</span>
                        </div>
                    </div>
                    <div className="stat-card available">
                        <div className="stat-icon">
                            <i className="fa-solid fa-circle-check"></i>
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{stats.available}</span>
                            <span className="stat-label">Available</span>
                        </div>
                    </div>
                    <div className="stat-card assigned">
                        <div className="stat-icon">
                            <i className="fa-solid fa-user-tag"></i>
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{stats.assigned}</span>
                            <span className="stat-label">Assigned</span>
                        </div>
                    </div>
                    <div className="stat-card used">
                        <div className="stat-icon">
                            <i className="fa-solid fa-check-double"></i>
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{stats.used}</span>
                            <span className="stat-label">Used</span>
                        </div>
                    </div>
                </div>

                {/* Wallet Groups */}
                <div className="wallet-groups-section">
                    <h2 className="section-title">
                        <i className="fa-solid fa-layer-group"></i>
                        Wallet Groups
                    </h2>
                    <div className="wallet-groups-grid">
                        {walletGroups.map((group) => (
                            <div key={group.key} className="wallet-group-card card">
                                <div className="card-body">
                                    <div className="group-header">
                                        <span className="group-name">{group.key}</span>
                                        <span className="group-count">
                                            {group.available} / {group.total}
                                        </span>
                                    </div>
                                    <div className="group-usage">
                                        <div className="usage-bar">
                                            <div
                                                className="usage-fill"
                                                style={{
                                                    width: `${group.usagePercent}%`,
                                                    backgroundColor:
                                                        group.usagePercent > 80
                                                            ? 'var(--color-error)'
                                                            : group.usagePercent > 50
                                                                ? 'var(--color-warning)'
                                                                : 'var(--color-success)',
                                                }}
                                            ></div>
                                        </div>
                                        <span className="usage-text">
                                            {group.usagePercent.toFixed(0)}% used
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Assigned Wallets */}
                <div className="recent-wallets-section">
                    <h2 className="section-title">
                        <i className="fa-solid fa-clock"></i>
                        Recent Activity
                    </h2>
                    {recentWallets.length === 0 ? (
                        <div className="empty-state card">
                            <div className="card-body">
                                <i className="fa-solid fa-wallet empty-icon"></i>
                                <h3>No Activity</h3>
                                <p>No wallets have been assigned yet</p>
                            </div>
                        </div>
                    ) : (
                        <div className="wallets-table card">
                            <div className="card-body">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Wallet ID</th>
                                            <th>Crypto</th>
                                            <th>Status</th>
                                            <th>Address</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentWallets.map((wallet) => (
                                            <tr key={wallet.id}>
                                                <td className="font-mono">{wallet.id}</td>
                                                <td>
                                                    <span className="crypto-badge">
                                                        {wallet.crypto}
                                                        {wallet.network && `-${wallet.network}`}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`badge badge-${wallet.status === 'assigned' ? 'warning' : 'success'}`}>
                                                        {wallet.status}
                                                    </span>
                                                </td>
                                                <td className="address-cell">
                                                    <code>{wallet.address.substring(0, 20)}...</code>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="actions-section">
                    <button className="btn btn-primary">
                        <i className="fa-solid fa-plus"></i>
                        Add New Wallets
                    </button>
                    <button className="btn btn-secondary" onClick={handleResetPool}>
                        <i className="fa-solid fa-rotate"></i>
                        Reset Pool
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WalletsPage;
