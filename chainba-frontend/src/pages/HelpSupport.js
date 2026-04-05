import React, { useState } from 'react';
import './HelpSupport.css';

function HelpSupport({ onNavigate }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    category: 'general',
    subject: '',
    message: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const categories = [
    { id: 'all', label: 'All Topics', icon: 'apps' },
    { id: 'account', label: 'Account', icon: 'account_circle' },
    { id: 'circles', label: 'Circles', icon: 'groups' },
    { id: 'payments', label: 'Payments', icon: 'payments' },
    { id: 'security', label: 'Security', icon: 'shield' }
  ];

  const faqs = [
    {
      category: 'account',
      question: 'How do I create an account on ChainBa?',
      answer: 'You can create an account by registering with your phone number and National Registration Card (NRC) number. Alternatively, you can connect your Ethereum wallet (MetaMask) for instant access.'
    },
    {
      category: 'account',
      question: 'Can I change my phone number after registration?',
      answer: 'Yes, you can update your phone number in the Profile & Settings page under the General tab. You\'ll need to verify the new number via SMS.'
    },
    {
      category: 'circles',
      question: 'What is a savings circle?',
      answer: 'A savings circle (Chilimba) is a traditional rotating savings and credit association built on blockchain. Members contribute regularly, and each member receives a payout in turn based on the circle\'s schedule.'
    },
    {
      category: 'circles',
      question: 'How do I join a circle?',
      answer: 'Browse available circles in the Explore page, review the circle details (contribution amount, frequency, member count), and click "Join Circle". You\'ll need to have sufficient funds in your wallet to cover the first contribution.'
    },
    {
      category: 'circles',
      question: 'Can I create my own circle?',
      answer: 'Yes! Click "Create Circle" from your Dashboard and follow the 3-step wizard to set up your circle with custom contribution amounts, frequency, and member limits.'
    },
    {
      category: 'circles',
      question: 'What happens if someone misses a contribution?',
      answer: 'Missed contributions affect the member\'s reputation score and may result in penalties or removal from the circle, depending on the circle\'s rules set by the creator.'
    },
    {
      category: 'payments',
      question: 'What currencies are supported?',
      answer: 'ChainBa supports ETH (Ethereum) and stablecoins like USDC. Contributions can be made in cash equivalent (converted to crypto) or goods/services based on the circle type.'
    },
    {
      category: 'payments',
      question: 'How do I make a contribution?',
      answer: 'Navigate to your circle\'s page and click "Contribute". Connect your wallet, confirm the transaction amount, and approve it in MetaMask. The transaction will be recorded on the blockchain.'
    },
    {
      category: 'payments',
      question: 'When do I receive my payout?',
      answer: 'Payouts are distributed according to the circle\'s payout order, which is determined by the circle creator. You can view your position in the payout queue on the circle\'s page.'
    },
    {
      category: 'payments',
      question: 'Are there any transaction fees?',
      answer: 'You\'ll pay standard Ethereum gas fees for blockchain transactions. ChainBa charges a small platform fee (typically 1-2%) to maintain the smart contracts and platform infrastructure.'
    },
    {
      category: 'security',
      question: 'How secure is my money?',
      answer: 'All funds are stored in audited smart contracts on the Ethereum blockchain. ChainBa never holds your funds directly - they\'re locked in trustless contracts that execute automatically.'
    },
    {
      category: 'security',
      question: 'What is the reputation system?',
      answer: 'The reputation system tracks your contribution history, on-time payments, and circle participation. Higher reputation scores (0-100) give you access to larger circles and better positions in payout queues.'
    },
    {
      category: 'security',
      question: 'Can I enable two-factor authentication?',
      answer: 'Yes! Enable 2FA in Profile & Settings under the Security tab. We recommend using an authenticator app like Google Authenticator or Authy for maximum security.'
    },
    {
      category: 'security',
      question: 'What if I lose access to my wallet?',
      answer: 'Always keep your wallet seed phrase safe and secure. If you lose access to your wallet, we cannot recover your funds. Consider using a hardware wallet for large amounts.'
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    
    // TODO: Implement backend API call to save support ticket
    console.log('Support ticket submitted:', contactForm);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setFormSubmitted(true);
    setContactForm({
      name: '',
      email: '',
      category: 'general',
      subject: '',
      message: ''
    });
    
    setTimeout(() => setFormSubmitted(false), 5000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="help-support-page">
      {/* Header */}
      <header className="help-header">
        <button className="back-btn" onClick={() => onNavigate('dashboard')}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="help-title">Help & Support</h1>
      </header>

      {/* Kente Divider */}
      <div className="kente-divider"></div>

      {/* Hero Section with Search */}
      <section className="help-hero">
        <div className="help-hero-content">
          <h2 className="help-hero-title">How can we help you?</h2>
          <p className="help-hero-subtitle">Search our knowledge base or browse by category</p>
          
          <div className="help-search-container">
            <span className="material-symbols-outlined search-icon">search</span>
            <input 
              type="text" 
              className="help-search-input" 
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Category Pills */}
      <section className="category-section">
        <div className="category-pills">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <span className="material-symbols-outlined">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="help-content-grid">
        
        {/* FAQ Section */}
        <section className="faq-section">
          <h3 className="section-title">Frequently Asked Questions</h3>
          
          {filteredFaqs.length === 0 ? (
            <div className="empty-state">
              <span className="material-symbols-outlined">search_off</span>
              <p>No FAQs found matching your criteria</p>
            </div>
          ) : (
            <div className="faq-list">
              {filteredFaqs.map((faq, index) => (
                <details key={index} className="faq-item">
                  <summary className="faq-question">
                    <span className="material-symbols-outlined category-icon">
                      {categories.find(c => c.id === faq.category)?.icon || 'help'}
                    </span>
                    <span className="question-text">{faq.question}</span>
                    <span className="material-symbols-outlined expand-icon">expand_more</span>
                  </summary>
                  <div className="faq-answer">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>

        {/* Contact Form Section */}
        <aside className="contact-section">
          <div className="contact-card">
            <h3 className="contact-title">Still need help?</h3>
            <p className="contact-subtitle">Send us a message and we'll get back to you within 24 hours</p>

            {formSubmitted ? (
              <div className="success-message">
                <span className="material-symbols-outlined">check_circle</span>
                <h4>Message sent successfully!</h4>
                <p>We'll respond to your inquiry soon.</p>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleContactSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={contactForm.name}
                    onChange={handleInputChange}
                    required
                    placeholder="John Banda"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={contactForm.email}
                    onChange={handleInputChange}
                    required
                    placeholder="john@example.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <select
                    id="category"
                    name="category"
                    value={contactForm.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="general">General Inquiry</option>
                    <option value="account">Account Issues</option>
                    <option value="circles">Circle Management</option>
                    <option value="payments">Payment Problems</option>
                    <option value="security">Security Concerns</option>
                    <option value="technical">Technical Support</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={contactForm.subject}
                    onChange={handleInputChange}
                    required
                    placeholder="Brief description of your issue"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={contactForm.message}
                    onChange={handleInputChange}
                    required
                    rows="5"
                    placeholder="Please provide details about your question or issue..."
                  ></textarea>
                </div>

                <button type="submit" className="submit-btn">
                  <span className="material-symbols-outlined">send</span>
                  Send Message
                </button>
              </form>
            )}
          </div>

          {/* Quick Contact Options */}
          <div className="quick-contact">
            <h4 className="quick-contact-title">Other ways to reach us</h4>
            
            <a href="mailto:support@chainba.com" className="contact-option">
              <span className="material-symbols-outlined">email</span>
              <div>
                <div className="option-label">Email</div>
                <div className="option-value">support@chainba.com</div>
              </div>
            </a>

            <a href="tel:+260123456789" className="contact-option">
              <span className="material-symbols-outlined">call</span>
              <div>
                <div className="option-label">Phone</div>
                <div className="option-value">+260 123 456 789</div>
              </div>
            </a>

            <div className="contact-option">
              <span className="material-symbols-outlined">schedule</span>
              <div>
                <div className="option-label">Support Hours</div>
                <div className="option-value">Mon-Fri, 8AM-6PM CAT</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default HelpSupport;
