import React from 'react';
import Sidebar from './SidebarNew';
import ImpersonationBanner from './ImpersonationBanner';
import NotificationBell from './NotificationBell';

export default function DashboardLayout({ children, title, subtitle }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <ImpersonationBanner />

        {/* Header - SUSTAIN Style */}
        <header className="bg-white border-b border-gray-100">
          <div className="px-8 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-serif text-[#31543A]">{title}</h1>
              {subtitle && <p className="text-sm text-[#2A2A2A]/60 font-light mt-1">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-[#F9FAFA] p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
