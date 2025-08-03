import React from 'react';
import { useLocation } from 'react-router-dom';
import { useUrlState } from '../../hooks/useUrlState';

const Navigation = ({ currentBook }) => {
  const { navigateToPage } = useUrlState();
  const location = useLocation();

  const isActiveTab = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/sources', label: 'Sources' },
    { path: '/cards', label: 'Cards' },
    { path: '/organize', label: 'Organize' },
    { path: '/details', label: 'Details' }
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Book Title */}
        <div className="text-right">
          <h1 className="text-xl font-semibold text-gray-800">
            {currentBook?.title || 'No Book Selected'}
          </h1>
        </div>
        <div className="flex items-center space-x-8">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigateToPage(item.path)}
              className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                isActiveTab(item.path)
                  ? 'text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 