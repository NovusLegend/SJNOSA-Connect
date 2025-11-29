import React from 'react';
import { ViewState } from '../types';
import { Home, Calendar, MessageCircle, User } from 'lucide-react';

interface BottomNavProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, setView }) => {
  const navItems = [
    { view: 'HOME', icon: Home, label: 'Home' },
    { view: 'EVENTS', icon: Calendar, label: 'Events' },
    { view: 'CHAT', icon: MessageCircle, label: 'Connect' },
    { view: 'PROFILE', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 w-full bg-white border-t border-gray-200 pb-safe pt-2 px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
      <div className="flex justify-between items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => setView(item.view as ViewState)}
              className={`flex flex-col items-center justify-center space-y-1 w-16 transition-colors duration-200 ${
                isActive ? 'text-school-700' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};