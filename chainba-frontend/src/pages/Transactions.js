import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import './Transactions.css';
import { GROUP_ABI, FACTORY_ADDRESS, FACTORY_ABI } from '../contracts/config';

function Transactions({ onNavigate, account, signer }) {
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // all, contributions, payouts
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (account && signer) {
      fetchTransactions();
    }
  }, [account, signer, fetchTransactions]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);

    try {
      // Get Factory contract to retrieve user's circles
      const factoryContract = new ethers.Contract(
        FACTORY_ADDRESS,
        FACTORY_ABI,
        signer
      );

      // Get all groups
      const allGroups = await factoryContract.getAllGroups();
      
      let allTransactions = [];

      // Iterate through each circle to get transactions
      for (const groupAddress of allGroups) {
        try {
          const groupContract = new ethers.Contract(groupAddress, GROUP_ABI, signer);
          
          // Check if user is a member
          const isMember = await groupContract.isMember(account);
          if (!isMember) continue;

          // Get circle name
          const circleName = await groupContract.name();

          // Get Contribution events
          const contributionFilter = groupContract.filters.ContributionMade(account);
          const contributionEvents = await groupContract.queryFilter(contributionFilter);
          
          for (const event of contributionEvents) {
            const block = await event.getBlock();
            const txReceipt = await event.getTransactionReceipt();
            
            allTransactions.push({
              id: event.transactionHash,
              type: 'contribution',
              circleName,
              circleAddress: groupAddress,
              amount: parseFloat(ethers.utils.formatUnits(event.args.amount, 6)),
              timestamp: block.timestamp * 1000,
              txHash: event.transactionHash,
              status: 'confirmed',
              gasUsed: txReceipt.gasUsed.toString(),
              from: event.args.member,
              to: groupAddress
            });
          }

          // Get Payout events
          const payoutFilter = groupContract.filters.PayoutDistributed(account);
          const payoutEvents = await groupContract.queryFilter(payoutFilter);
          
          for (const event of payoutEvents) {
            const block = await event.getBlock();
            const txReceipt = await event.getTransactionReceipt();
            
            allTransactions.push({
              id: event.transactionHash,
              type: 'payout',
              circleName,
              circleAddress: groupAddress,
              amount: parseFloat(ethers.utils.formatUnits(event.args.amount, 6)),
              timestamp: block.timestamp * 1000,
              txHash: event.transactionHash,
              status: 'confirmed',
              gasUsed: txReceipt.gasUsed.toString(),
              from: groupAddress,
              to: event.args.recipient
            });
          }

        } catch (err) {
          console.log('Error processing group transactions:', groupAddress, err);
        }
      }

      // Sort by timestamp (newest first)
      allTransactions.sort((a, b) => b.timestamp - a.timestamp);

      setTransactions(allTransactions);

    } catch (error) {
      console.error('Error fetching transactions:', error);
      
      // Set mock data for development
      const mockTransactions = [
        {
          id: '0x1a2b3c4d5e6f',
          type: 'payout',
          circleName: 'Family Savings Circle',
          circleAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          amount: 500.00,
          timestamp: Date.now() - 3600000,
          txHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
          status: 'confirmed',
          gasUsed: '84532',
          from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          to: account
        },
        {
          id: '0x2b3c4d5e6f7a',
          type: 'contribution',
          circleName: 'Monthly Bills Circle',
          circleAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
          amount: 50.00,
          timestamp: Date.now() - 86400000,
          txHash: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3',
          status: 'confirmed',
          gasUsed: '62184',
          from: account,
          to: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'
        },
        {
          id: '0x3c4d5e6f7a8b',
          type: 'contribution',
          circleName: 'Business Growth Fund',
          circleAddress: '0x6B3595068778DD592e39A122f4f5a5cF09C90fE2',
          amount: 100.00,
          timestamp: Date.now() - 172800000,
          txHash: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4',
          status: 'confirmed',
          gasUsed: '71293',
          from: account,
          to: '0x6B3595068778DD592e39A122f4f5a5cF09C90fE2'
        },
        {
          id: '0x4d5e6f7a8b9c',
          type: 'payout',
          circleName: 'Weekend Warriors Circle',
          circleAddress: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
          amount: 750.00,
          timestamp: Date.now() - 604800000,
          txHash: '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5',
          status: 'confirmed',
          gasUsed: '89456',
          from: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
          to: account
        },
        {
          id: '0x5e6f7a8b9c0d',
          type: 'contribution',
          circleName: 'Family Savings Circle',
          circleAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          amount: 100.00,
          timestamp: Date.now() - 1209600000,
          txHash: '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6',
          status: 'confirmed',
          gasUsed: '65872',
          from: account,
          to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
        }
      ];

      setTransactions(mockTransactions);
    }

    setLoading(false);
  }, [account, signer]);

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesSearch = searchQuery === '' || 
      tx.circleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.txHash.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Format timestamp
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format address
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  // View on block explorer
  const viewOnExplorer = (txHash) => {
    // Assuming Ethereum mainnet - adjust for your network
    window.open(`https://etherscan.io/tx/${txHash}`, '_blank');
  };

  // Calculate totals
  const totals = filteredTransactions.reduce((acc, tx) => {
    if (tx.type === 'contribution') {
      acc.totalContributed += tx.amount;
    } else if (tx.type === 'payout') {
      acc.totalReceived += tx.amount;
    }
    return acc;
  }, { totalContributed: 0, totalReceived: 0 });

  return (
    <div className="transactions-page">
      {/* Header */}
      <header className="transactions-header">
        <button className="back-btn" onClick={() => onNavigate('dashboard')}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="transactions-title">Transaction History</h1>
      </header>

      {/* Kente Divider */}
      <div className="kente-divider"></div>

      {/* Summary Cards */}
      <section className="summary-section">
        <div className="summary-card">
          <span className="material-symbols-outlined">trending_down</span>
          <div className="summary-content">
            <span className="summary-label">Total Contributed</span>
            <span className="summary-value">${totals.totalContributed.toFixed(2)}</span>
          </div>
        </div>
        <div className="summary-card">
          <span className="material-symbols-outlined">trending_up</span>
          <div className="summary-content">
            <span className="summary-label">Total Received</span>
            <span className="summary-value success">${totals.totalReceived.toFixed(2)}</span>
          </div>
        </div>
        <div className="summary-card">
          <span className="material-symbols-outlined">receipt_long</span>
          <div className="summary-content">
            <span className="summary-label">Total Transactions</span>
            <span className="summary-value">{filteredTransactions.length}</span>
          </div>
        </div>
      </section>

      {/* Filters and Search */}
      <section className="filters-section">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${filterType === 'contribution' ? 'active' : ''}`}
            onClick={() => setFilterType('contribution')}
          >
            <span className="material-symbols-outlined">arrow_upward</span>
            Contributions
          </button>
          <button
            className={`filter-btn ${filterType === 'payout' ? 'active' : ''}`}
            onClick={() => setFilterType('payout')}
          >
            <span className="material-symbols-outlined">arrow_downward</span>
            Payouts
          </button>
        </div>

        <div className="search-container">
          <span className="material-symbols-outlined">search</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search by circle or transaction hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </section>

      {/* Transactions List */}
      <section className="transactions-list-section">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading transactions...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <span className="material-symbols-outlined">receipt_long</span>
            <h3>No transactions found</h3>
            <p>You haven't made any transactions yet or no results match your filters.</p>
          </div>
        ) : (
          <div className="transactions-list">
            {filteredTransactions.map((tx) => (
              <div key={tx.id} className={`transaction-item ${tx.type}`}>
                <div className="tx-icon">
                  <span className="material-symbols-outlined">
                    {tx.type === 'contribution' ? 'arrow_upward' : 'arrow_downward'}
                  </span>
                </div>

                <div className="tx-main">
                  <div className="tx-header">
                    <h4 className="tx-circle">{tx.circleName}</h4>
                    <span className={`tx-amount ${tx.type}`}>
                      {tx.type === 'contribution' ? '-' : '+'}${tx.amount.toFixed(2)}
                    </span>
                  </div>

                  <div className="tx-details">
                    <span className="tx-type">
                      {tx.type === 'contribution' ? 'Contribution' : 'Payout Received'}
                    </span>
                    <span className="tx-separator">•</span>
                    <span className="tx-date">{formatDate(tx.timestamp)}</span>
                  </div>

                  <div className="tx-addresses">
                    <div className="address-item">
                      <span className="address-label">From:</span>
                      <button 
                        className="address-value"
                        onClick={() => copyToClipboard(tx.from)}
                        title="Click to copy"
                      >
                        {formatAddress(tx.from)}
                        <span className="material-symbols-outlined">content_copy</span>
                      </button>
                    </div>
                    <span className="material-symbols-outlined arrow">arrow_forward</span>
                    <div className="address-item">
                      <span className="address-label">To:</span>
                      <button 
                        className="address-value"
                        onClick={() => copyToClipboard(tx.to)}
                        title="Click to copy"
                      >
                        {formatAddress(tx.to)}
                        <span className="material-symbols-outlined">content_copy</span>
                      </button>
                    </div>
                  </div>

                  <div className="tx-footer">
                    <div className="tx-meta">
                      <span className="status-badge">{tx.status}</span>
                      <span className="gas-info">
                        <span className="material-symbols-outlined">local_gas_station</span>
                        {(parseInt(tx.gasUsed) / 1000).toFixed(1)}k gas
                      </span>
                    </div>
                    <button 
                      className="view-explorer-btn"
                      onClick={() => viewOnExplorer(tx.txHash)}
                    >
                      View on Explorer
                      <span className="material-symbols-outlined">open_in_new</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Transactions;
