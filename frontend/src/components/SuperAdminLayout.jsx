import React from 'react';
import SuperAdminSidebar from './SuperAdminSidebar';

export default function SuperAdminLayout({ children, title, subtitle }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <SuperAdminSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-100">
          <div className="px-8 py-4">
            <div>
              <h1 className="text-2xl font-serif text-[#31543A]">{title}</h1>
              {subtitle && <p className="text-sm font-light text-[#2A2A2A]/60 mt-1">{subtitle}</p>}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-[#F9FAFA]">
          {children}
        </main>
      </div>
    </div>
  );
}
