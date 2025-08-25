'use client';

import { useState } from 'react';
import { Email, EmailStatus } from '@/types/email';
import { Mail, User, Server, Calendar, ChevronUp, ChevronDown, Trash2, Hash, CheckSquare, Square, Route } from 'lucide-react';
import { useEmail } from '@/contexts/EmailContext';

interface EmailCardProps {
  email: Email;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const EmailCard = ({ email, isSelected, onSelect }: EmailCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<'simple' | 'technical'>('simple');
  const [chainViewMode, setChainViewMode] = useState<'simple' | 'technical'>('simple');
  const { deleteEmail } = useEmail();

  const formatDate = (dateInput: Date | string) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleString();
  };

  const getStatusColor = (status: EmailStatus) => {
    switch (status) {
      case EmailStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case EmailStatus.DONE:
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this email?')) {
      setIsDeleting(true);
      try {
        await deleteEmail(email.emailId);
      } catch (error) {
        console.error('Failed to delete email:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] ${isSelected ? 'ring-2 ring-blue-500/50 bg-blue-50/80' : ''}`}>
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              {/* Selection Checkbox */}
              {onSelect && (
                <button
                  onClick={onSelect}
                  className="flex items-center justify-center w-6 h-6 text-blue-600 hover:text-blue-700 transition-all duration-200 hover:scale-110"
                >
                  {isSelected ? (
                    <CheckSquare className="w-6 h-6" />
                  ) : (
                    <Square className="w-6 h-6" />
                  )}
                </button>
              )}
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg">{email.subject}</h3>
              </div>
              
              <span className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${getStatusColor(email.status)}`}>
                {email.status}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl">
                <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-gray-600 text-xs uppercase tracking-wide">From</span>
                  <div className="font-medium text-gray-900">{email.from}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                  <Server className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-gray-600 text-xs uppercase tracking-wide">ESP</span>
                  <div className="font-medium text-gray-900">{email.espType}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-gray-600 text-xs uppercase tracking-wide">Time</span>
                  <div className="font-medium text-gray-900">{formatDate(email.timestamp)}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-3 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105 group"
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
              )}
            </button>
            
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-3 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 group"
            >
              <Trash2 className="w-5 h-5 text-red-500 group-hover:text-red-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200/50 p-6 bg-gradient-to-br from-gray-50/50 to-white/50 animate-slide-down">
          {/* Email Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Basic Info */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                  <Hash className="w-4 h-4 text-white" />
                </div>
                Email Metadata
              </h4>
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/20 space-y-4">
                {email.messageId && (
                  <div className="flex justify-between items-center p-3 bg-gray-50/50 rounded-xl">
                    <span className="text-sm font-medium text-gray-700">Message ID:</span>
                    <span className="text-sm font-mono text-gray-900 bg-white/50 px-3 py-1 rounded-lg">{email.messageId}</span>
                  </div>
                )}
                {email.deliveredTo && (
                  <div className="flex justify-between items-center p-3 bg-gray-50/50 rounded-xl">
                    <span className="text-sm font-medium text-gray-700">Delivered To:</span>
                    <span className="text-sm font-mono text-gray-900 bg-white/50 px-3 py-1 rounded-lg">{email.deliveredTo}</span>
                  </div>
                )}
                {email.returnPath && (
                  <div className="flex justify-between items-center p-3 bg-gray-50/50 rounded-xl">
                    <span className="text-sm font-medium text-gray-700">Return Path:</span>
                    <span className="text-sm font-mono text-gray-900 bg-white/50 px-3 py-1 rounded-lg">{email.returnPath}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Delivery Timeline */}
          {email.deliveryTimeline && email.deliveryTimeline.length > 0 && (
            <div className="mb-8">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                  <Route className="w-4 h-4 text-white" />
                </div>
                Email Journey Timeline
              </h4>
              <p className="text-sm text-gray-600 mb-6">
                This shows the path your email took from sender to recipient, including all the servers it passed through.
              </p>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Step</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Time</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">From</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">To</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200/50">
                      {email.deliveryTimeline?.map((hop, index) => {
                        // Show in chronological order (oldest first)
                        const hopData = hop;
                        const totalSteps = email.deliveryTimeline?.length || 0;
                        
                        return (
                          <tr key={index} className="hover:bg-gray-50/50 transition-colors duration-200">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                                  <span className="text-xs font-bold text-white">{index + 1}</span>
                                </div>
                                <span className="text-sm font-medium text-gray-700">
                                  {index === 0 ? 'Step 1: Initial Processing' :
                                   index === totalSteps - 1 ? `Step ${totalSteps}: Final Delivery` :
                                   index === 1 ? 'Step 2: Internal Routing' :
                                   index === 2 ? 'Step 3: External Transfer' :
                                   `Step ${index + 1}: Intermediate Transfer`}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {hopData.delay && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-green-200 text-green-800 shadow-sm">
                                  {hopData.delay}
                                </span>
                              )}
                              <div className="text-xs text-gray-500 mt-2">
                                {new Date(hopData.timeReceived).toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {hopData.from ? (
                                <div>
                                  <div className="font-medium text-gray-800">
                                    {hopData.from.includes('google.com') || hopData.from.includes('gmail.com') ? (
                                      <span className="text-green-600 font-semibold">Google Server</span>
                                    ) : hopData.from.includes('outlook.com') || hopData.from.includes('hotmail.com') ? (
                                      <span className="text-blue-600 font-semibold">Microsoft Server</span>
                                    ) : hopData.from.includes('yahoo.com') ? (
                                      <span className="text-purple-600 font-semibold">Yahoo Server</span>
                                    ) : hopData.from.includes('2002:') || hopData.from.includes('2603:') ? (
                                      <span className="text-gray-600 font-semibold">Internal Server</span>
                                    ) : (
                                      hopData.from
                                    )}
                                  </div>
                                  <div className="font-mono text-xs text-gray-500 mt-1 bg-gray-50/50 px-2 py-1 rounded">
                                    {hopData.from}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs">→</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <div className="font-medium text-gray-800">
                                  {hopData.to.includes('google.com') || hopData.to.includes('gmail.com') || hopData.to.includes('mx.google.com') ? (
                                    <span className="text-green-600 font-semibold">Google Mail Server</span>
                                  ) : hopData.to.includes('outlook.com') || hopData.to.includes('hotmail.com') ? (
                                    <span className="text-blue-600 font-semibold">Microsoft Mail Server</span>
                                  ) : hopData.to.includes('yahoo.com') ? (
                                    <span className="text-purple-600 font-semibold">Yahoo Mail Server</span>
                                  ) : hopData.to.includes('2002:') || hopData.to.includes('2603:') ? (
                                    <span className="text-gray-600 font-semibold">Internal Server</span>
                                  ) : (
                                    hopData.to
                                  )}
                                </div>
                                <div className="font-mono text-xs text-gray-500 mt-1 bg-gray-50/50 px-2 py-1 rounded">
                                  {hopData.to}
                                </div>
                                <div className="text-xs text-blue-600 mt-1 font-medium">
                                  Protocol: {hopData.protocol}
                                  {hopData.protocol === 'SMTPS' && ' (Google Transport Security)'}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-xs">
                                {hopData.additionalInfo && hopData.additionalInfo.includes('Originated at Gmail') ? (
                                  <span className="text-green-600 font-semibold bg-green-50 px-2 py-1 rounded">✓ Email originated from Gmail</span>
                                ) : hopData.additionalInfo && hopData.additionalInfo.includes('Google Transport Security') ? (
                                  <span className="text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded">✓ Secure connection</span>
                                ) : hopData.additionalInfo && hopData.additionalInfo.includes('Microsoft SMTP Server') ? (
                                  <span className="text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded">✓ Microsoft mail server</span>
                                ) : hopData.additionalInfo && hopData.additionalInfo.includes('id ') ? (
                                  <span className="text-gray-600 bg-gray-50 px-2 py-1 rounded">Header id: {hopData.additionalInfo.split('id ')[1]?.split(' ')[0]}</span>
                                ) : hopData.additionalInfo ? (
                                  <span className="text-gray-600 bg-gray-50 px-2 py-1 rounded">{hopData.additionalInfo}</span>
                                ) : (
                                  <span className="text-gray-400 bg-gray-50 px-2 py-1 rounded">Standard delivery</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Summary for non-technical users */}
              <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/50 shadow-lg">
                <h5 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  Email Journey Summary
                </h5>
                <div className="text-sm text-blue-800 space-y-2">
                  <p>• Your email passed through <strong>{email.deliveryTimeline?.length || 0} servers</strong> to reach its destination</p>
                  <p>• Total delivery time: <strong>{(() => {
                    const totalSeconds = email.deliveryTimeline.reduce((sum, hop) => {
                      if (hop.delay) {
                        const match = hop.delay.match(/(\d+)/);
                        return sum + (match ? parseInt(match[1]) : 0);
                      }
                      return sum;
                    }, 0);
                    return totalSeconds > 0 ? `${totalSeconds} seconds` : '~1 second';
                  })()}</strong></p>
                  <p>• Email was processed by <strong>secure mail servers</strong></p>
                  <p>• All authentication checks <strong>passed successfully</strong> ✓</p>
                </div>
              </div>
            </div>
          )}

          {/* Visual Email Flow */}
          {email.deliveryTimeline && email.deliveryTimeline.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Route className="w-4 h-4" />
                  Email Flow Diagram
                </h4>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">View Mode:</span>
                  <button 
                    onClick={() => setViewMode('simple')}
                    className={`px-2 py-1 rounded ${viewMode === 'simple' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                  >
                    Simple
                  </button>
                  <button 
                    onClick={() => setViewMode('technical')}
                    className={`px-2 py-1 rounded ${viewMode === 'technical' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                  >
                    Technical
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {viewMode === 'simple' 
                  ? "Visual representation of your email's journey from sender to recipient."
                  : "Detailed technical flow showing servers, protocols, and routing information."
                }
              </p>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="space-y-4">
                  {/* Sender */}
                  <div className="text-center">
                    <div className="inline-block bg-blue-100 px-4 py-2 rounded-lg">
                      <div className="text-sm font-medium text-blue-800">You: MUA - send action</div>
                      <div className="text-xs text-blue-600 font-mono">{email.from}</div>
                    </div>
                  </div>
                  
                  {/* Flow arrows and servers */}
                  {email.deliveryTimeline.map((hop, index) => {
                    // Show in chronological order (oldest first)
                    const hopData = hop;
                    
                    return (
                      <div key={index} className="flex flex-col items-center">
                        {/* Arrow */}
                        <div className="text-gray-400 mb-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v10.586l3.293-3.293a1 1 0 111.414 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 111.414-1.414L9 14.586V4a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        
                        {/* Server */}
                        <div className="text-center">
                          <div className="inline-block bg-gray-100 px-4 py-2 rounded-lg max-w-xs">
                            <div className="text-sm font-medium text-gray-800">
                              {viewMode === 'simple' ? (
                                index === 0 ? 'Step 1: Initial Processing' :
                                index === (email.deliveryTimeline?.length || 0) - 1 ? `Step ${email.deliveryTimeline?.length || 0}: Final Delivery` :
                                index === 1 ? 'Step 2: Internal Routing' :
                                index === 2 ? 'Step 3: External Transfer' :
                                `Step ${index + 1}: Intermediate Transfer`
                              ) : (
                                `Server ${index + 1}`
                              )}
                            </div>
                            <div className="text-xs text-gray-600 font-mono break-all">
                              {viewMode === 'simple' ? (
                                hopData.to.includes('2002:') ? 
                                  `${hopData.to.substring(0, 20)}...` : 
                                  hopData.to
                              ) : (
                                hopData.to
                              )}
                            </div>
                            {viewMode === 'technical' && hopData.protocol && (
                              <div className="text-xs text-blue-600 mt-1">
                                Protocol: {hopData.protocol}
                                {hopData.protocol === 'SMTPS' && ' (Google Transport Security)'}
                              </div>
                            )}
                            {viewMode === 'technical' && hopData.additionalInfo && (
                              <div className="text-xs text-gray-500 mt-1 max-w-xs break-all">
                                {hopData.additionalInfo.includes('id ') ? 
                                  `Header id: ${hopData.additionalInfo.split('id ')[1]?.split(' ')[0]}` :
                                  hopData.additionalInfo
                                }
                              </div>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                              Time: {new Date(hopData.timeReceived).toISOString().replace('T', ' ').replace('Z', 'Z')} / {new Date(hopData.timeReceived).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Final destination */}
                  <div className="flex flex-col items-center">
                    <div className="text-gray-400 mb-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v10.586l3.293-3.293a1 1 0 111.414 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 111.414-1.414L9 14.586V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="inline-block bg-green-100 px-4 py-2 rounded-lg">
                      <div className="text-sm font-medium text-green-800">Recipient mailbox: {email.deliveredTo || 'krisppy0@gmail.com'} — message available in Inbox</div>
                    </div>
                  </div>
                </div>
                
                {/* Summary stats */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-blue-600">{email.deliveryTimeline?.length || 0}</div>
                      <div className="text-xs text-gray-500">Servers</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        {(() => {
                          const totalSeconds = email.deliveryTimeline.reduce((sum, hop) => {
                            if (hop.delay) {
                              const match = hop.delay.match(/(\d+)/);
                              return sum + (match ? parseInt(match[1]) : 0);
                            }
                            return sum;
                          }, 0);
                          return totalSeconds > 0 ? `${totalSeconds}s` : '~1s';
                        })()}
                      </div>
                      <div className="text-xs text-gray-500">Total Time</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-purple-600">
                        {email.authenticationResults?.spf === 'pass' && 
                         email.authenticationResults?.dkim === 'pass' && 
                         email.authenticationResults?.dmarc === 'pass' ? '✓' : '⚠'}
                      </div>
                      <div className="text-xs text-gray-500">Security</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Receiving Chain */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Receiving Chain</h4>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500">View Mode:</span>
                <button 
                  onClick={() => setChainViewMode('simple')}
                  className={`px-2 py-1 rounded ${chainViewMode === 'simple' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                >
                  Simple
                </button>
                <button 
                  onClick={() => setChainViewMode('technical')}
                  className={`px-2 py-1 rounded ${chainViewMode === 'technical' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                >
                  Technical
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {chainViewMode === 'simple' 
                ? "Step-by-step explanation of how your email was processed and delivered."
                : "Raw technical headers showing the complete email routing information."
              }
            </p>
            <div className="space-y-3">
              {email.receivedChain.slice().reverse().map((chain, index) => {
                // Reverse the order to show oldest first (chronological order)
                const originalIndex = email.receivedChain.length - 1 - index;
                const totalSteps = email.receivedChain.length;
                
                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                    </div>
                    <div className="flex-1 bg-white p-3 rounded-lg border border-gray-200">
                      {chainViewMode === 'simple' ? (
                        <div>
                          <div className="text-sm font-medium text-gray-800 mb-1">
                            {index === 0 ? 'Step 1: Initial Processing' :
                             index === totalSteps - 1 ? `Step ${totalSteps}: Final Delivery` :
                             index === 1 ? 'Step 2: Internal Routing' :
                             index === 2 ? 'Step 3: External Transfer' :
                             `Step ${index + 1}: Intermediate Transfer`}
                          </div>
                          <div className="text-xs text-gray-600">
                            {index === 0 ? 'Email was first processed by the sender\'s mail server.' :
                             index === totalSteps - 1 ? 'Email was finally delivered to the recipient\'s inbox.' :
                             index === 1 ? 'Email was routed internally within the sender\'s network.' :
                             index === 2 ? 'Email was transferred between different mail servers.' :
                             'Email was transferred between intermediate mail servers.'}
                          </div>
                          <div className="text-xs text-gray-500 mt-2 font-mono bg-gray-50 p-2 rounded">
                            {chain}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm text-gray-800 break-all font-mono">{chain}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {index === 0 ? 'Step 1: Initial Processing' :
                             index === totalSteps - 1 ? `Step ${totalSteps}: Final Delivery` :
                             index === 1 ? 'Step 2: Internal Routing' :
                             index === 2 ? 'Step 3: External Transfer' :
                             `Step ${index + 1}: Intermediate Transfer`}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Raw Email Preview */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Raw Email Preview</h4>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto max-h-40">
                {email.rawEmail.substring(0, 500)}
                {email.rawEmail.length > 500 && '...'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

