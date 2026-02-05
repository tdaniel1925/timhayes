import React from 'react';
import Sidebar from './Sidebar';
import ImpersonationBanner from './ImpersonationBanner';
import NotificationBell from './NotificationBell';

export default function DashboardLayout({ children, title, subtitle }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <ImpersonationBanner />

        {/* Header */}
        <header className="bg-white border-b">
          <div className="px-8 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
