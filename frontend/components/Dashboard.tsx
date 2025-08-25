'use client';

import { useState } from 'react';
import { useEmail } from '@/contexts/EmailContext';
import { StatsCards } from './StatsCards';
import { EmailList } from './EmailList';
import { RefreshCw, Filter, BarChart3, Mail } from 'lucide-react';

export const Dashboard = () => {
  const { loading, refreshData } = useEmail();
  const [activeTab, setActiveTab] = useState<'overview' | 'emails'>('overview');

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold gradient-text mb-2">Email Analytics Dashboard</h1>
        <p className="text-gray-600 text-lg">Monitor and analyze your email delivery performance</p>
      </div>

      <div className="flex justify-center">
        <div className="bg-white/20 backdrop-blur-sm p-2 rounded-2xl shadow-lg border border-white/20">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('emails')}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'emails'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <Mail className="w-4 h-4" />
              Emails
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {activeTab === 'overview' ? 'Email Analytics Overview' : 'Email Management'}
          </h2>
          <p className="text-gray-600">
            {activeTab === 'overview' 
              ? 'Real-time insights into your email delivery performance' 
              : 'View and manage your processed emails'
            }
          </p>
        </div>
        <button
          onClick={refreshData}
          disabled={loading}
          className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      <div className="animate-scale-in">
        {activeTab === 'overview' ? (
          <StatsCards />
        ) : (
          <EmailList />
        )}
      </div>
    </div>
  );
};
