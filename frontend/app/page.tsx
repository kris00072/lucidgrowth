'use client';

import { useState, useEffect } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { Header } from '@/components/Header';
import { EmailProvider } from '@/contexts/EmailContext';
import { WebSocketProvider } from '@/contexts/WebSocketContext';

export default function HomePage() {
  return (
    <WebSocketProvider>
      <EmailProvider>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <Dashboard />
          </main>
        </div>
      </EmailProvider>
    </WebSocketProvider>
  );
}
