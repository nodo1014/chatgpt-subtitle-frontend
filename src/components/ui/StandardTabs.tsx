'use client';

import { ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  icon: string;
  badge?: string | number;
  content?: ReactNode;
}

interface StandardTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

const getTabColors = (tabId: string, index: number) => {
  const colorSchemes = [
    { active: 'border-blue-500 text-blue-600 bg-blue-50', bar: 'bg-blue-500' },
    { active: 'border-green-500 text-green-600 bg-green-50', bar: 'bg-green-500' },
    { active: 'border-purple-500 text-purple-600 bg-purple-50', bar: 'bg-purple-500' },
    { active: 'border-orange-500 text-orange-600 bg-orange-50', bar: 'bg-orange-500' },
    { active: 'border-red-500 text-red-600 bg-red-50', bar: 'bg-red-500' },
    { active: 'border-indigo-500 text-indigo-600 bg-indigo-50', bar: 'bg-indigo-500' },
  ];
  
  return colorSchemes[index % colorSchemes.length];
};

export default function StandardTabs({ 
  tabs, 
  activeTab, 
  onTabChange, 
  className = '' 
}: StandardTabsProps) {
  return (
    <div className={`bg-white border-b-2 border-gray-100 shadow-sm ${className}`}>
      <nav className="flex space-x-1 px-6">
        {tabs.map((tab, index) => {
          const colors = getTabColors(tab.id, index);
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative py-4 px-6 font-medium text-sm transition-all duration-200 border-b-2 ${
                isActive
                  ? colors.active
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`ml-1 px-2 py-0.5 text-xs rounded-full border ${
                    isActive 
                      ? 'bg-white/80 text-gray-700 border-gray-300' 
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </div>
              {isActive && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${colors.bar}`}></div>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
