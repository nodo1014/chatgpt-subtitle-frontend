'use client';

import { useState } from 'react';
import PrimarySidebar from './PrimarySidebar';
import SecondarySidebar from './SecondarySidebar';

interface HistoryItem {
  title: string;
  count: number;
  timestamp: string;
}

interface SidebarProps {
  isCollapsed: boolean;
  searchHistory: HistoryItem[];
  onToggle: () => void;
}

export default function Sidebar({ isCollapsed, searchHistory, onToggle }: SidebarProps) {
  const [activeMenu, setActiveMenu] = useState('production');

  const handleMenuChange = (menu: string) => {
    setActiveMenu(menu);
  };

  return (
    <div className="flex">
      <PrimarySidebar 
        activeMenu={activeMenu}
        onMenuChange={handleMenuChange}
        isCollapsed={isCollapsed}
      />
      <SecondarySidebar 
        activeMenu={activeMenu}
        isCollapsed={isCollapsed}
      />
    </div>
  );
}
