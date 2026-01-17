/**
 * DashboardLayout - Premium Purple Dynasty Theme
 * Layout principal pour toutes les pages admin
 */

import React from 'react';
import Navbar from './Navbar';

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <main className="relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-pattern-dots opacity-[0.03] pointer-events-none" />
        <div className="relative">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
