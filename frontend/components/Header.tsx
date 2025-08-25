'use client';

import { useWebSocket } from '@/contexts/WebSocketContext';
import { Mail, Wifi, WifiOff, Clock } from 'lucide-react';

export const Header = () => {
  const { isConnected, gmailStatus } = useWebSocket();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Mail className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Lucid Growth Email Analyzer
              </h1>
              <p className="text-gray-600">
                Real-time Gmail receiving chain analysis
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Test Email Info */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">Test Configuration</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Send to:</span>
                  <span className="font-mono text-primary-600">krisppy0@gmail.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Subject:</span>
                  <span className="font-mono text-primary-600">Lucid Growth Test Subject</span>
                </div>
              </div>
            </div>

            {/* Connection Status */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <Wifi className="w-4 h-4 text-success-500" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-500" />
                  )}
                  <span className={isConnected ? 'text-success-600' : 'text-red-600'}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                {gmailStatus && (
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      gmailStatus.isActive ? 'bg-success-500' : 'bg-red-500'
                    }`} />
                    <span className="text-gray-600">
                      Gmail Watch: {gmailStatus.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
