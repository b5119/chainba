import React, { useState, useEffect } from 'react';
import './Notifications.css';

function Notifications({ onNavigate, account }) {
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tabs configuration
  const tabs = [
    { id: 'all', label: 'All', icon: 'notifications' },
    { id: 'circles', label: 'Circles', icon: 'groups' },
    { id: 'payments', label: 'Payments', icon: 'payments' },
    { id: 'system', label: 'System', icon: 'info' }
  ];

  // Mock notifications - In production, fetch from backend/blockchain
  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockNotifications = [
        {
          id: 1,
          type: 'payment_received',
          category: 'payments',
          title: 'Payout Received',
          message: 'You received your payout of 500 USDC from Family Savings Circle',
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
          read: false,
          icon: 'account_balance',
          color: 'success',
          actionText: 'View Transaction',
          actionPage: 'transactions'
        },
        {
          id: 2,
          type: 'contribution_due',
          category: 'payments',
          title: 'Contribution Due Soon',
          message: 'Your contribution of 50 USDC is due in 2 days for Monthly Bills Circle',
          timestamp: new Date(Date.now() - 7200000), // 2 hours ago
          read: false,
          icon: 'schedule',
          color: 'warning',
          actionText: 'Pay Now',
          actionPage: 'dashboard'
        },
        {
          id: 3,
          type: 'member_joined',
          category: 'circles',
          title: 'New Member Joined',
          message: 'Jane Mwansa joined your Business Savings Circle',
          timestamp: new Date(Date.now() - 14400000), // 4 hours ago
          read: true,
          icon: 'person_add',
          color: 'primary',
          actionText: 'View Circle',
          actionPage: 'dashboard'
        },
        {
          id: 4,
          type: 'payout_order',
          category: 'circles',
          title: 'Payout Order Updated',
          message: 'You are now 3rd in line for payout in Weekend Warriors Circle',
          timestamp: new Date(Date.now() - 86400000), // 1 day ago
          read: true,
          icon: 'swap_vert',
          color: 'info',
          actionText: 'View Details',
          actionPage: 'dashboard'
        },
        {
          id: 5,
          type: 'reputation_increase',
          category: 'system',
          title: 'Reputation Increased',
          message: 'Your reputation score increased to 95 for consistent on-time payments!',
          timestamp: new Date(Date.now() - 172800000), // 2 days ago
          read: true,
          icon: 'trending_up',
          color: 'success',
          actionText: 'View Profile',
          actionPage: 'profile'
        },
        {
          id: 6,
          type: 'contribution_received',
          category: 'payments',
          title: 'Contribution Confirmed',
          message: 'Your contribution of 100 USDC to Family Savings Circle has been confirmed on-chain',
          timestamp: new Date(Date.now() - 259200000), // 3 days ago
          read: true,
          icon: 'check_circle',
          color: 'success',
          actionText: 'View Transaction',
          actionPage: 'transactions'
        },
        {
          id: 7,
          type: 'circle_full',
          category: 'circles',
          title: 'Circle Complete',
          message: 'Monthly Bills Circle is now full and will start next week!',
          timestamp: new Date(Date.now() - 345600000), // 4 days ago
          read: true,
          icon: 'groups',
          color: 'primary',
          actionText: 'View Circle',
          actionPage: 'dashboard'
        },
        {
          id: 8,
          type: 'security_alert',
          category: 'system',
          title: 'New Login Detected',
          message: 'A new device logged into your account from Lusaka, Zambia',
          timestamp: new Date(Date.now() - 432000000), // 5 days ago
          read: true,
          icon: 'security',
          color: 'warning',
          actionText: 'Review Activity',
          actionPage: 'profile'
        }
      ];
      
      setNotifications(mockNotifications);
      setLoading(false);
    };

    fetchNotifications();
  }, []);

  // Filter notifications by active tab
  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(notif => notif.category === activeTab);

  // Mark notification as read
  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  // Handle notification action
  const handleNotificationAction = (notification) => {
    markAsRead(notification.id);
    if (notification.actionPage) {
      onNavigate(notification.actionPage);
    }
  };

  // Format timestamp
  const formatTimestamp = (date) => {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notifications-page">
      {/* Header */}
      <header className="notifications-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => onNavigate('dashboard')}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="notifications-title">Notifications</h1>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount} unread</span>
            )}
          </div>
        </div>
        
        {unreadCount > 0 && (
          <button className="mark-all-read-btn" onClick={markAllAsRead}>
            <span className="material-symbols-outlined">done_all</span>
            Mark all read
          </button>
        )}
      </header>

      {/* Kente Divider */}
      <div className="kente-divider"></div>

      {/* Tabs */}
      <div className="notifications-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`notif-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="material-symbols-outlined">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
            {tab.id !== 'all' && (
              <span className="tab-count">
                {notifications.filter(n => n.category === tab.id).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="notifications-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <span className="material-symbols-outlined">notifications_off</span>
            <h3>No notifications</h3>
            <p>You're all caught up! Check back later for updates.</p>
          </div>
        ) : (
          <div className="notifications-list">
            {filteredNotifications.map(notification => (
              <div 
                key={notification.id} 
                className={`notification-item ${notification.read ? 'read' : 'unread'} ${notification.color}`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="notification-icon">
                  <span className="material-symbols-outlined">{notification.icon}</span>
                </div>
                
                <div className="notification-content">
                  <div className="notification-header">
                    <h4 className="notification-title">{notification.title}</h4>
                    <span className="notification-time">{formatTimestamp(notification.timestamp)}</span>
                  </div>
                  
                  <p className="notification-message">{notification.message}</p>
                  
                  {notification.actionText && (
                    <button 
                      className="notification-action"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNotificationAction(notification);
                      }}
                    >
                      {notification.actionText}
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                  )}
                </div>
                
                {!notification.read && (
                  <div className="unread-indicator"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;
