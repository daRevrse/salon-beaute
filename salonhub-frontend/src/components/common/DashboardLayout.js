/**
 * DashboardLayout - Layout principal pour toutes les pages admin
 * Inclut la navbar et structure commune
 */

import React from 'react';
import Navbar from './Navbar';

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>{children}</main>
    </div>
  );
};

export default DashboardLayout;
