'use client';

import { useState } from 'react';
import { useEmail } from '@/contexts/EmailContext';
import { Email, EmailStatus } from '@/types/email';
import { EmailCard } from './EmailCard';
import { Search, Filter, ChevronLeft, ChevronRight, Trash2, CheckSquare, Square, Sparkles } from 'lucide-react';
import React from 'react';

export const EmailList = () => {
  const { emails, loading, deleteEmail } = useEmail();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmailStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter emails based on search and status
  const filteredEmails = emails.filter((email) => {
    const matchesSearch = 
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.espType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || email.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredEmails.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmails = filteredEmails.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'a') {
        e.preventDefault();
        handleSelectAll();
      }
    }
  };

  // Add keyboard event listener
  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedEmails, paginatedEmails]);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedEmails.size === paginatedEmails.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(paginatedEmails.map(email => email.emailId)));
    }
  };

  const handleSelectEmail = (emailId: string) => {
    const newSelected = new Set(selectedEmails);
    if (newSelected.has(emailId)) {
      newSelected.delete(emailId);
    } else {
      newSelected.add(emailId);
    }
    setSelectedEmails(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedEmails.size === 0) return;
    
    const confirmMessage = `Are you sure you want to delete ${selectedEmails.size} email${selectedEmails.size !== 1 ? 's' : ''}? This action cannot be undone.`;
    if (!confirm(confirmMessage)) return;
    
    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedEmails).map(emailId => deleteEmail(emailId));
      await Promise.all(deletePromises);
      setSelectedEmails(new Set());
    } catch (error) {
      console.error('Failed to delete emails:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 animate-pulse">
            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-1/4 mb-3"></div>
            <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-1/2 mb-4"></div>
            <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Enhanced Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-1">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
              <input
                type="text"
                placeholder="Search emails by subject, sender, or ESP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 placeholder:text-gray-400"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as EmailStatus | 'all')}
              className="px-4 py-3 bg-gray-50/50 border border-gray-200/50 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            >
              <option value="all">All Status</option>
              <option value={EmailStatus.PENDING}>Pending</option>
              <option value={EmailStatus.DONE}>Done</option>
            </select>
          </div>
        </div>
      </div>

      {/* Enhanced Bulk Actions */}
      {selectedEmails.size > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-blue-200/50 animate-slide-down">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span className="text-lg font-semibold text-blue-900">
                  {selectedEmails.size} email{selectedEmails.size !== 1 ? 's' : ''} selected
                </span>
              </div>
            </div>
            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Trash2 className="w-5 h-5" />
              {isDeleting ? 'Deleting...' : `Delete ${selectedEmails.size} email${selectedEmails.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Email Count */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full shadow-sm border border-white/20">
          <span className="text-sm font-medium text-gray-700">
            Showing {filteredEmails.length} of {emails.length} emails
          </span>
        </div>
      </div>

      {/* Enhanced Email List */}
      {paginatedEmails.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center shadow-lg border border-white/20">
          <div className="text-gray-500 text-lg">
            {searchTerm || statusFilter !== 'all' ? 'No emails match your filters' : 'No emails found'}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Enhanced Select All Header */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-gray-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-3 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200 group"
                  title="Select all emails (Ctrl+A)"
                >
                  <div className="p-1 rounded-lg group-hover:bg-white/50 transition-colors duration-200">
                    {selectedEmails.size === paginatedEmails.length ? (
                      <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </div>
                  {selectedEmails.size === paginatedEmails.length ? 'Deselect All' : 'Select All'}
                </button>
                {selectedEmails.size > 0 && (
                  <span className="text-sm text-gray-500 bg-white/50 px-3 py-1 rounded-full">
                    {selectedEmails.size} of {paginatedEmails.length} selected
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400 bg-white/30 px-3 py-1 rounded-full">
                Press Ctrl+A to select all
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {paginatedEmails.map((email, index) => (
              <div
                key={email.emailId}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <EmailCard 
                  email={email}
                  isSelected={selectedEmails.has(email.emailId)}
                  onSelect={() => handleSelectEmail(email.emailId)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  page === currentPage
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
