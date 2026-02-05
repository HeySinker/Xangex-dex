import { useState } from 'react';
import './Header.css';

interface HeaderProps {
    onNavigate: (page: string) => void;
    currentPage: string;
}

const Header = ({ onNavigate, currentPage }: HeaderProps) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const navItems = [
        { id: 'exchange', label: 'Exchange', icon: 'fa-solid fa-right-left' },
        { id: 'transactions', label: 'History', icon: 'fa-solid fa-clock-rotate-left' },
    ];

    return (
        <header className="header">
            <div className="header-container">
                {/* Logo */}
                <div className="header-logo" onClick={() => onNavigate('exchange')}>
                    <span className="logo-text">
                        <span className="logo-gradient-animated">xangex</span>
                    </span>
                    <span className="dex-badge">DEX</span>
                </div>

                {/* Desktop Navigation */}
                <nav className="header-nav">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                            onClick={() => onNavigate(item.id)}
                        >
                            <i className={`nav-icon ${item.icon}`}></i>
                            <span className="nav-label">{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* Mobile Menu Button */}
                <button
                    className="mobile-menu-btn"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </span>
                </button>
            </div>

            {/* Mobile Navigation */}
            <nav className={`mobile-nav ${mobileMenuOpen ? 'open' : ''}`}>
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        className={`mobile-nav-item ${currentPage === item.id ? 'active' : ''}`}
                        onClick={() => {
                            onNavigate(item.id);
                            setMobileMenuOpen(false);
                        }}
                    >
                        <i className={`nav-icon ${item.icon}`}></i>
                        <span className="nav-label">{item.label}</span>
                    </button>
                ))}
            </nav>
        </header>
    );
};

export default Header;
