import { useState } from 'react';
import Header from './components/Header';
import ExchangePage from './components/ExchangePage';
import TransactionsPage from './components/TransactionsPage';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('exchange');

  const renderPage = () => {
    switch (currentPage) {
      case 'exchange':
        return <ExchangePage />;
      case 'transactions':
        return <TransactionsPage />;
      default:
        return <ExchangePage />;
    }
  };

  return (
    <div className="app">
      <Header onNavigate={setCurrentPage} currentPage={currentPage} />
      <main className="main-content">
        {renderPage()}
      </main>
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-brand">
            <span className="footer-logo">X</span>
            <span className="footer-name">XANGEX</span>
            <span className="footer-dex">DEX</span>
          </div>
          <div className="footer-info">
            <p>100% Automated & Decentralized Exchange • 0.05% Fee Only • No Registration No KYC • Instant Transactions</p>
          </div>
          <div className="footer-copy">
            © {new Date().getFullYear()} XANGEX. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
