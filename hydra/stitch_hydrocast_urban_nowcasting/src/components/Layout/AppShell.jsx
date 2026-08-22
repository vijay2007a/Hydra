import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopNavBar } from './TopNavBar';

export const AppShell = () => {
  return (
    <div className="bg-absolute-black text-on-surface min-h-screen w-full flex flex-col font-body-md selection:bg-primary-container selection:text-absolute-black">
      {/* Persistent Global TopNavBar */}
      <TopNavBar />

      {/* Main Page Viewport Container */}
      <div className="flex-1 w-full flex flex-col">
        <Outlet />
      </div>
    </div>
  );
};
