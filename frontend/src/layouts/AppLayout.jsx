import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import Sidebar from './Sidebar';
import HackathonDemoGuide from '../components/HackathonDemoGuide';
import { useAuth } from '../context/AuthContext';

const AppLayout = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const isDashboardRoute =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/worker') ||
    location.pathname.startsWith('/citizen');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-blue-600 selection:text-white relative">
      <Navbar />

      <div className="flex-1 flex">
        {isAuthenticated && isDashboardRoute && (
          <div className="hidden md:block">
            <Sidebar />
          </div>
        )}

        <main className={`flex-1 ${isDashboardRoute ? 'p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full' : ''}`}>
          <Outlet />
        </main>
      </div>

      <Footer />

      {/* Floating Interactive Hackathon Demo Navigator */}
      <HackathonDemoGuide />
    </div>
  );
};

export default AppLayout;

