'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWebSocket } from './WebSocketContext';
import { Email, EmailStatus } from '@/types/email';
import { api } from '@/lib/api';

interface EmailContextType {
  emails: Email[];
  loading: boolean;
  stats: {
    total: number;
    pending: number;
    done: number;
    recentCount: number;
  } | null;
  fetchEmails: (page?: number, limit?: number) => Promise<void>;
  fetchStats: () => Promise<void>;
  deleteEmail: (emailId: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const EmailContext = createContext<EmailContextType>({
  emails: [],
  loading: false,
  stats: null,
  fetchEmails: async () => {},
  fetchStats: async () => {},
  deleteEmail: async () => {},
  refreshData: async () => {},
});

export const useEmail = () => useContext(EmailContext);

export const EmailProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<EmailContextType['stats']>(null);
  const { socket } = useWebSocket();

  const fetchEmails = async (page: number = 1, limit: number = 50) => {
    try {
      setLoading(true);
      const response = await api.get(`/emails?page=${page}&limit=${limit}`);
      setEmails(response.data.emails);
    } catch (error) {
      console.error('Failed to fetch emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/emails/stats/overview');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const deleteEmail = async (emailId: string) => {
    try {
      await api.delete(`/emails/${emailId}`);
      setEmails(prev => prev.filter(email => email.emailId !== emailId));
      await fetchStats();
    } catch (error) {
      console.error('Failed to delete email:', error);
    }
  };

  const refreshData = async () => {
    await Promise.all([fetchEmails(), fetchStats()]);
  };

  useEffect(() => {
    fetchEmails();
    fetchStats();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleEmailCreated = (email: Email) => {
      setEmails(prev => [email, ...prev]);
      fetchStats();
    };

    const handleEmailUpdated = (email: Email) => {
      setEmails(prev => prev.map(e => e.emailId === email.emailId ? email : e));
    };

    const handleEmailDeleted = (data: { emailId: string }) => {
      setEmails(prev => prev.filter(email => email.emailId !== data.emailId));
      fetchStats();
    };

    const handleEmailProcessed = (data: { emailId: string }) => {
      setEmails(prev => prev.map(email => 
        email.emailId === data.emailId 
          ? { ...email, status: EmailStatus.DONE }
          : email
      ));
    };

    socket.on('email:created', handleEmailCreated);
    socket.on('email:updated', handleEmailUpdated);
    socket.on('email:deleted', handleEmailDeleted);
    socket.on('email:processed', handleEmailProcessed);

    return () => {
      socket.off('email:created', handleEmailCreated);
      socket.off('email:updated', handleEmailUpdated);
      socket.off('email:deleted', handleEmailDeleted);
      socket.off('email:processed', handleEmailProcessed);
    };
  }, [socket]);

  const value: EmailContextType = {
    emails,
    loading,
    stats,
    fetchEmails,
    fetchStats,
    deleteEmail,
    refreshData,
  };

  return (
    <EmailContext.Provider value={value}>
      {children}
    </EmailContext.Provider>
  );
};
