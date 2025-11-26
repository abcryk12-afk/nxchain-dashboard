import React, { useState, useEffect } from 'react';
import { 
  ChatBubbleLeftRightIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  QuestionMarkCircleIcon,
  LifebuoyIcon,
  DocumentTextIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { support } from '../services/api';
import { SupportTicket } from '../types';

const SupportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tickets');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    category: 'general'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const data = await support.getTickets();
      setTickets(data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      // Mock data for demo
      setTickets([
        {
          _id: '1',
          userId: '',
          subject: 'Deposit not showing',
          message: 'I deposited $100 USDT 2 hours ago but it\'s not showing in my account.',
          status: 'open',
          response: null,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: '2',
          userId: '',
          subject: 'Staking rewards question',
          message: 'How are staking rewards calculated and when are they paid?',
          status: 'resolved',
          response: 'Staking rewards are calculated based on your package and paid daily. Bronze: 1% daily, Silver: 1.5% daily, Gold: 2% daily.',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString()
        }
      ]);
    }
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject || !formData.message) {
      setMessage('Please fill in all fields');
      return;
    }

    setLoading(true);
    
    try {
      const response = await support.createTicket(formData);
      setTickets([response.ticket, ...tickets]);
      setFormData({ subject: '', message: '', category: 'general' });
      setShowNewTicket(false);
      setMessage('Ticket submitted successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      console.error('Failed to submit ticket:', error);
      setMessage(error.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'text-green-400 bg-green-400/20';
      case 'in_progress': return 'text-blue-400 bg-blue-400/20';
      case 'open': return 'text-yellow-400 bg-yellow-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircleIcon className="w-4 h-4" />;
      case 'in_progress': return <LifebuoyIcon className="w-4 h-4" />;
      case 'open': return <ClockIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  const tabs = [
    { id: 'tickets', label: 'My Tickets', icon: ChatBubbleLeftRightIcon },
    { id: 'faq', label: 'FAQ', icon: QuestionMarkCircleIcon }
  ];

  const faqCategories = [
    {
      title: 'Account & Security',
      questions: [
        {
          q: 'How do I reset my password?',
          a: 'Click on "Forgot Password" on the login page and follow the instructions sent to your email.'
        },
        {
          q: 'How do I enable 2FA?',
          a: 'Go to Profile > Security > Two-Factor Authentication and click "Enable 2FA".'
        },
        {
          q: 'Is my account secure?',
          a: 'Yes, we use industry-standard encryption and security measures to protect your account.'
        }
      ]
    },
    {
      title: 'Deposits & Withdrawals',
      questions: [
        {
          q: 'What is the minimum deposit amount?',
          a: 'The minimum deposit amount is $10 USDT.'
        },
        {
          q: 'How long do withdrawals take?',
          a: 'Withdrawals are typically processed within 24-48 hours.'
        },
        {
          q: 'What networks are supported?',
          a: 'We currently support BEP-20 (BSC) and ERC-20 (Ethereum) networks.'
        }
      ]
    },
    {
      title: 'Staking & Rewards',
      questions: [
        {
          q: 'What are the staking packages?',
          a: 'Bronze: 30 days, 1% daily. Silver: 90 days, 1.5% daily. Gold: 365 days, 2% daily.'
        },
        {
          q: 'When are staking rewards paid?',
          a: 'Rewards are calculated and paid daily to your account balance.'
        },
        {
          q: 'Can I withdraw my staked amount early?',
          a: 'Early withdrawals are subject to penalties and loss of pending rewards.'
        }
      ]
    },
    {
      title: 'Referral Program',
      questions: [
        {
          q: 'How much commission do I earn?',
          a: 'You earn 10% commission on all deposits made by your referred users.'
        },
        {
          q: 'When are referral commissions paid?',
          a: 'Commissions are credited to your account when your referral\'s deposit is confirmed.'
        },
        {
          q: 'How do I get my referral code?',
          a: 'Your referral code is available in the dashboard under the referral section.'
        }
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="glass-effect rounded-xl p-6">
        <h1 className="text-2xl font-bold gradient-text mb-2">Support Center</h1>
        <p className="text-gray-400">
          Get help with your account and find answers to common questions
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-effect rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-gray-400 text-sm">Open Tickets</p>
            <p className="text-2xl font-bold text-white">
              {tickets.filter(t => t.status === 'open').length}
            </p>
          </div>
        </div>

        <div className="glass-effect rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
              <LifebuoyIcon className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-gray-400 text-sm">In Progress</p>
            <p className="text-2xl font-bold text-white">
              {tickets.filter(t => t.status === 'in_progress').length}
            </p>
          </div>
        </div>

        <div className="glass-effect rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-gray-400 text-sm">Resolved</p>
            <p className="text-2xl font-bold text-white">
              {tickets.filter(t => t.status === 'resolved').length}
            </p>
          </div>
        </div>

        <div className="glass-effect rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-gray-400 text-sm">Total Tickets</p>
            <p className="text-2xl font-bold text-white">{tickets.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-effect rounded-xl p-2">
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-nx-blue/20 text-nx-blue'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tickets Tab */}
      {activeTab === 'tickets' && (
        <div className="space-y-6">
          {/* New Ticket Button */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Support Tickets</h2>
            <button
              onClick={() => setShowNewTicket(true)}
              className="btn-primary py-2 px-4 rounded-lg font-medium flex items-center space-x-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>New Ticket</span>
            </button>
          </div>

          {/* New Ticket Form */}
          {showNewTicket && (
            <div className="glass-effect rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Create New Ticket</h3>
              
              {message && (
                <div className={`p-3 rounded-lg mb-4 ${
                  message.includes('success') 
                    ? 'bg-green-400/10 border border-green-400/20 text-green-400' 
                    : 'bg-red-400/10 border border-red-400/20 text-red-400'
                }`}>
                  <p className="text-sm">{message}</p>
                </div>
              )}

              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-nx-blue focus:border-transparent"
                  >
                    <option value="general">General</option>
                    <option value="deposit">Deposit Issue</option>
                    <option value="withdrawal">Withdrawal Issue</option>
                    <option value="staking">Staking Issue</option>
                    <option value="referral">Referral Issue</option>
                    <option value="security">Security Issue</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Brief description of your issue"
                    className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nx-blue focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Detailed description of your issue"
                    rows={6}
                    className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-nx-blue focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 btn-primary py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewTicket(false)}
                    className="flex-1 btn-secondary py-3 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tickets List */}
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div key={ticket._id} className="glass-effect rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{ticket.subject}</h3>
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {getStatusIcon(ticket.status)}
                        <span>{ticket.status.replace('_', ' ')}</span>
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Created: {new Date(ticket.createdAt).toLocaleDateString()} • 
                      Updated: {new Date(ticket.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <UserIcon className="w-4 h-4 text-nx-blue" />
                      <span className="text-sm font-medium text-nx-blue">Your Message</span>
                    </div>
                    <p className="text-gray-300 text-sm">{ticket.message}</p>
                  </div>

                  {ticket.response && (
                    <div className="bg-nx-blue/10 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <LifebuoyIcon className="w-4 h-4 text-nx-blue" />
                        <span className="text-sm font-medium text-nx-blue">Support Response</span>
                      </div>
                      <p className="text-gray-300 text-sm">{ticket.response}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {tickets.length === 0 && (
              <div className="text-center py-12">
                <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No support tickets yet</p>
                <p className="text-gray-500 text-sm mt-1">Create your first ticket to get help</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white">Frequently Asked Questions</h2>

          {faqCategories.map((category, index) => (
            <div key={index} className="glass-effect rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">{category.title}</h3>
              <div className="space-y-4">
                {category.questions.map((faq, faqIndex) => (
                  <details key={faqIndex} className="group">
                    <summary className="flex items-center justify-between cursor-pointer p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                      <span className="text-white font-medium">{faq.q}</span>
                      <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="p-4 text-gray-300 text-sm">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}

          {/* Contact Support */}
          <div className="glass-effect rounded-xl p-6 text-center">
            <LifebuoyIcon className="w-16 h-16 text-nx-blue mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Still Need Help?</h3>
            <p className="text-gray-400 mb-6">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <button
              onClick={() => {
                setActiveTab('tickets');
                setShowNewTicket(true);
              }}
              className="btn-primary py-3 px-6 rounded-lg font-medium"
            >
              Contact Support
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportPage;
