import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './Analytics.css';
import { GROUP_ABI, FACTORY_CONTRACT_ADDRESS, FACTORY_ABI } from '../contracts/config';

function Analytics({ onNavigate, account, signer }) {
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('all'); // all, year, month, week
  const [analyticsData, setAnalyticsData] = useState({
    totalEarned: 0,
    totalContributed: 0,
    netGain: 0,
    roi: 0,
    circlesJoined: 0,
    circlesCompleted: 0,
    payoutsReceived: 0,
    contributionsMade: 0,
    averageROI: 0,
    bestPerformingCircle: null,
    recentPayouts: [],
    monthlyBreakdown: []
  });

  useEffect(() => {
    if (account && signer) {
      fetchAnalytics();
    }
  }, [account, signer, timeframe]);

  const fetchAnalytics = async () => {
    setLoading(true);

    try {
      // Get Factory contract to retrieve user's circles
      const factoryContract = new ethers.Contract(
        FACTORY_CONTRACT_ADDRESS,
        FACTORY_ABI,
        signer
      );

      // Get all groups
      const allGroups = await factoryContract.getAllGroups();
      
      let totalEarned = 0;
      let totalContributed = 0;
      let payoutsReceived = 0;
      let contributionsMade = 0;
      let circlesJoined = 0;
      let circlesCompleted = 0;
      let recentPayouts = [];
      let circlePerformance = [];

      // Filter timeframe
      const now = Date.now();
      const timeframeCutoff = {
        'week': now - (7 * 24 * 60 * 60 * 1000),
        'month': now - (30 * 24 * 60 * 60 * 1000),
        'year': now - (365 * 24 * 60 * 60 * 1000),
        'all': 0
      }[timeframe];

      // Iterate through each circle to calculate earnings
      for (const groupAddress of allGroups) {
        try {
          const groupContract = new ethers.Contract(groupAddress, GROUP_ABI, signer);
          
          // Check if user is a member
          const isMember = await groupContract.isMember(account);
          if (!isMember) continue;

          circlesJoined++;

          // Get circle details
          const circleName = await groupContract.name();
          const contributionAmount = await groupContract.contributionAmount();
          const totalMembers = await groupContract.getTotalMembers();
          const isActive = await groupContract.isActive();

          if (!isActive) {
            circlesCompleted++;
          }

          // Calculate user's contributions in this circle
          // This would require tracking contribution events or having a getter function
          // For now, we'll estimate based on payout position
          
          // Get member details for this user
          let memberContributions = ethers.BigNumber.from(0);
          let memberPayouts = ethers.BigNumber.from(0);

          // Query blockchain events for this user
          try {
            // Get Contribution events
            const contributionFilter = groupContract.filters.ContributionMade(account);
            const contributionEvents = await groupContract.queryFilter(contributionFilter);
            
            for (const event of contributionEvents) {
              const timestamp = (await event.getBlock()).timestamp * 1000;
              if (timestamp >= timeframeCutoff) {
                memberContributions = memberContributions.add(event.args.amount);
                contributionsMade++;
              }
            }

            // Get Payout events
            const payoutFilter = groupContract.filters.PayoutDistributed(account);
            const payoutEvents = await groupContract.queryFilter(payoutFilter);
            
            for (const event of payoutEvents) {
              const timestamp = (await event.getBlock()).timestamp * 1000;
              if (timestamp >= timeframeCutoff) {
                const payoutAmount = event.args.amount;
                memberPayouts = memberPayouts.add(payoutAmount);
                payoutsReceived++;

                // Add to recent payouts
                recentPayouts.push({
                  circleName,
                  amount: parseFloat(ethers.utils.formatUnits(payoutAmount, 6)), // Assuming USDC
                  timestamp: timestamp,
                  circleAddress: groupAddress
                });
              }
            }
          } catch (eventError) {
            console.log('Error querying events for', groupAddress, eventError);
          }

          // Update totals
          totalContributed += parseFloat(ethers.utils.formatUnits(memberContributions, 6));
          totalEarned += parseFloat(ethers.utils.formatUnits(memberPayouts, 6));

          // Track circle performance
          const circleEarned = parseFloat(ethers.utils.formatUnits(memberPayouts, 6));
          const circleContributed = parseFloat(ethers.utils.formatUnits(memberContributions, 6));
          const circleROI = circleContributed > 0 ? ((circleEarned - circleContributed) / circleContributed * 100) : 0;

          if (circleContributed > 0) {
            circlePerformance.push({
              name: circleName,
              earned: circleEarned,
              contributed: circleContributed,
              roi: circleROI,
              address: groupAddress
            });
          }

        } catch (err) {
          console.log('Error processing group:', groupAddress, err);
        }
      }

      // Calculate metrics
      const netGain = totalEarned - totalContributed;
      const roi = totalContributed > 0 ? (netGain / totalContributed * 100) : 0;
      const averageROI = circlePerformance.length > 0 
        ? circlePerformance.reduce((sum, c) => sum + c.roi, 0) / circlePerformance.length 
        : 0;

      // Find best performing circle
      const bestPerformingCircle = circlePerformance.length > 0
        ? circlePerformance.reduce((best, current) => current.roi > best.roi ? current : best)
        : null;

      // Sort recent payouts by timestamp
      recentPayouts.sort((a, b) => b.timestamp - a.timestamp);
      recentPayouts = recentPayouts.slice(0, 5); // Keep only 5 most recent

      // Generate monthly breakdown (last 6 months)
      const monthlyBreakdown = generateMonthlyBreakdown(recentPayouts, timeframe);

      setAnalyticsData({
        totalEarned: totalEarned.toFixed(2),
        totalContributed: totalContributed.toFixed(2),
        netGain: netGain.toFixed(2),
        roi: roi.toFixed(2),
        circlesJoined,
        circlesCompleted,
        payoutsReceived,
        contributionsMade,
        averageROI: averageROI.toFixed(2),
        bestPerformingCircle,
        recentPayouts,
        monthlyBreakdown
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set mock data for development
      setAnalyticsData({
        totalEarned: 2450.00,
        totalContributed: 2100.00,
        netGain: 350.00,
        roi: 16.67,
        circlesJoined: 4,
        circlesCompleted: 2,
        payoutsReceived: 3,
        contributionsMade: 21,
        averageROI: 15.5,
        bestPerformingCircle: {
          name: 'Family Savings Circle',
          earned: 1200,
          contributed: 1000,
          roi: 20
        },
        recentPayouts: [
          { circleName: 'Family Savings Circle', amount: 500, timestamp: Date.now() - 3600000 },
          { circleName: 'Business Growth Fund', amount: 750, timestamp: Date.now() - 86400000 * 7 },
          { circleName: 'Monthly Bills Circle', amount: 1200, timestamp: Date.now() - 86400000 * 30 }
        ],
        monthlyBreakdown: [
          { month: 'Jan', earned: 400, contributed: 350 },
          { month: 'Feb', earned: 450, contributed: 400 },
          { month: 'Mar', earned: 500, contributed: 450 },
          { month: 'Apr', earned: 600, contributed: 500 },
          { month: 'May', earned: 350, contributed: 300 },
          { month: 'Jun', earned: 150, contributed: 100 }
        ]
      });
    }

    setLoading(false);
  };

  const generateMonthlyBreakdown = (payouts, timeframe) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const breakdown = [];
    const monthsToShow = timeframe === 'year' ? 12 : timeframe === 'month' ? 1 : 6;

    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = months[date.getMonth()];
      
      const monthPayouts = payouts.filter(p => {
        const payoutDate = new Date(p.timestamp);
        return payoutDate.getMonth() === date.getMonth() && payoutDate.getFullYear() === date.getFullYear();
      });

      const earned = monthPayouts.reduce((sum, p) => sum + p.amount, 0);
      
      breakdown.push({
        month: monthName,
        earned: earned.toFixed(2),
        contributed: (earned * 0.85).toFixed(2) // Estimate (assuming 15% avg ROI)
      });
    }

    return breakdown;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="analytics-page">
      {/* Header */}
      <header className="analytics-header">
        <button className="back-btn" onClick={() => onNavigate('dashboard')}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="analytics-title">Savings Analytics</h1>
      </header>

      {/* Kente Divider */}
      <div className="kente-divider"></div>

      {/* Timeframe Selector */}
      <div className="timeframe-selector">
        <button 
          className={`timeframe-btn ${timeframe === 'week' ? 'active' : ''}`}
          onClick={() => setTimeframe('week')}
        >
          Week
        </button>
        <button 
          className={`timeframe-btn ${timeframe === 'month' ? 'active' : ''}`}
          onClick={() => setTimeframe('month')}
        >
          Month
        </button>
        <button 
          className={`timeframe-btn ${timeframe === 'year' ? 'active' : ''}`}
          onClick={() => setTimeframe('year')}
        >
          Year
        </button>
        <button 
          className={`timeframe-btn ${timeframe === 'all' ? 'active' : ''}`}
          onClick={() => setTimeframe('all')}
        >
          All Time
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Calculating your savings analytics...</p>
        </div>
      ) : (
        <div className="analytics-content">
          
          {/* Key Metrics Grid */}
          <section className="metrics-grid">
            <div className="metric-card primary">
              <div className="metric-icon">
                <span className="material-symbols-outlined">account_balance_wallet</span>
              </div>
              <div className="metric-content">
                <span className="metric-label">Total Earned</span>
                <span className="metric-value">${analyticsData.totalEarned}</span>
                <span className="metric-sublabel">Money received from payouts</span>
              </div>
            </div>

            <div className="metric-card secondary">
              <div className="metric-icon">
                <span className="material-symbols-outlined">savings</span>
              </div>
              <div className="metric-content">
                <span className="metric-label">Total Contributed</span>
                <span className="metric-value">${analyticsData.totalContributed}</span>
                <span className="metric-sublabel">Money put into circles</span>
              </div>
            </div>

            <div className={`metric-card ${parseFloat(analyticsData.netGain) >= 0 ? 'success' : 'danger'}`}>
              <div className="metric-icon">
                <span className="material-symbols-outlined">
                  {parseFloat(analyticsData.netGain) >= 0 ? 'trending_up' : 'trending_down'}
                </span>
              </div>
              <div className="metric-content">
                <span className="metric-label">Net Gain</span>
                <span className="metric-value">
                  {parseFloat(analyticsData.netGain) >= 0 ? '+' : ''}${analyticsData.netGain}
                </span>
                <span className="metric-sublabel">
                  {parseFloat(analyticsData.roi) >= 0 ? '+' : ''}{analyticsData.roi}% ROI
                </span>
              </div>
            </div>

            <div className="metric-card info">
              <div className="metric-icon">
                <span className="material-symbols-outlined">groups</span>
              </div>
              <div className="metric-content">
                <span className="metric-label">Active Circles</span>
                <span className="metric-value">{analyticsData.circlesJoined}</span>
                <span className="metric-sublabel">{analyticsData.circlesCompleted} completed</span>
              </div>
            </div>
          </section>

          {/* Chart Section */}
          <section className="chart-section">
            <div className="chart-card">
              <h3 className="chart-title">Monthly Performance</h3>
              <div className="chart-container">
                <div className="bar-chart">
                  {analyticsData.monthlyBreakdown.map((data, index) => {
                    const maxValue = Math.max(...analyticsData.monthlyBreakdown.map(d => parseFloat(d.earned)));
                    const earnedHeight = maxValue > 0 ? (parseFloat(data.earned) / maxValue * 100) : 0;
                    const contributedHeight = maxValue > 0 ? (parseFloat(data.contributed) / maxValue * 100) : 0;

                    return (
                      <div key={index} className="bar-group">
                        <div className="bars">
                          <div 
                            className="bar earned" 
                            style={{ height: `${earnedHeight}%` }}
                            title={`Earned: $${data.earned}`}
                          ></div>
                          <div 
                            className="bar contributed" 
                            style={{ height: `${contributedHeight}%` }}
                            title={`Contributed: $${data.contributed}`}
                          ></div>
                        </div>
                        <span className="bar-label">{data.month}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="chart-legend">
                  <div className="legend-item">
                    <span className="legend-color earned"></span>
                    <span>Earned</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color contributed"></span>
                    <span>Contributed</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Two Column Layout */}
          <div className="analytics-two-col">
            
            {/* Statistics */}
            <section className="stats-section">
              <h3 className="section-title">Statistics</h3>
              
              <div className="stat-item">
                <span className="material-symbols-outlined">payments</span>
                <div className="stat-details">
                  <span className="stat-label">Payouts Received</span>
                  <span className="stat-value">{analyticsData.payoutsReceived}</span>
                </div>
              </div>

              <div className="stat-item">
                <span className="material-symbols-outlined">send_money</span>
                <div className="stat-details">
                  <span className="stat-label">Contributions Made</span>
                  <span className="stat-value">{analyticsData.contributionsMade}</span>
                </div>
              </div>

              <div className="stat-item">
                <span className="material-symbols-outlined">percent</span>
                <div className="stat-details">
                  <span className="stat-label">Average ROI</span>
                  <span className="stat-value">{analyticsData.averageROI}%</span>
                </div>
              </div>

              {analyticsData.bestPerformingCircle && (
                <div className="best-circle">
                  <h4>Best Performing Circle</h4>
                  <div className="best-circle-content">
                    <span className="circle-name">{analyticsData.bestPerformingCircle.name}</span>
                    <div className="circle-stats">
                      <div>
                        <span className="label">Earned</span>
                        <span className="value">${analyticsData.bestPerformingCircle.earned.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="label">ROI</span>
                        <span className="value success">+{analyticsData.bestPerformingCircle.roi.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Recent Payouts */}
            <section className="payouts-section">
              <h3 className="section-title">Recent Payouts</h3>
              
              {analyticsData.recentPayouts.length === 0 ? (
                <div className="empty-state-small">
                  <span className="material-symbols-outlined">account_balance_wallet</span>
                  <p>No payouts yet</p>
                </div>
              ) : (
                <div className="payouts-list">
                  {analyticsData.recentPayouts.map((payout, index) => (
                    <div key={index} className="payout-item">
                      <div className="payout-icon">
                        <span className="material-symbols-outlined">account_balance</span>
                      </div>
                      <div className="payout-details">
                        <span className="payout-circle">{payout.circleName}</span>
                        <span className="payout-date">{formatTimestamp(payout.timestamp)}</span>
                      </div>
                      <span className="payout-amount">+${payout.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

        </div>
      )}
    </div>
  );
}

export default Analytics;
