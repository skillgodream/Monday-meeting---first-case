import React from 'react';
import { Home, BookOpen, BarChart2, User, ShieldCheck, Users, GraduationCap } from 'lucide-react';
import { TabType } from '../types';
import { sounds } from '../utils/audio';
import { UserRole } from './RoleNavigationModal';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  role?: UserRole;
  onOpenRoleSwitcher?: () => void;
}

export default function BottomNav({ activeTab, onSelectTab, role = 'learn', onOpenRoleSwitcher }: BottomNavProps) {
  const items = role === 'learn'
    ? [
        { id: 'home' as TabType, label: 'Home', icon: Home },
        { id: 'library' as TabType, label: 'My Learning', icon: GraduationCap },
        { id: 'progress' as TabType, label: 'My Progress', icon: BarChart2 },
        { id: 'profile' as TabType, label: 'Profile', icon: User },
      ]
    : role === 'manager'
    ? [
        { id: 'home' as TabType, label: 'Manager Hub', icon: Users },
        { id: 'library' as TabType, label: 'SOPs', icon: BookOpen },
        { id: 'progress' as TabType, label: 'Scores', icon: BarChart2 },
        { id: 'profile' as TabType, label: 'Profile', icon: User },
      ]
    : [
        { id: 'home' as TabType, label: 'Admin Hub', icon: ShieldCheck },
        { id: 'library' as TabType, label: 'Repository', icon: BookOpen },
        { id: 'progress' as TabType, label: 'Reports', icon: BarChart2 },
        { id: 'profile' as TabType, label: 'Profile', icon: User },
      ];

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md h-[68px] rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex items-center justify-around px-3 z-40 bg-black/85 backdrop-blur-2xl border border-white/15 text-white transition-all duration-300">
      {items.map((item) => {
        const isActive = activeTab === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => {
              sounds.playTap();
              onSelectTab(item.id);
            }}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-full transition-all duration-150 active:scale-95 cursor-pointer ${
              isActive
                ? 'text-white'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-all ${
                isActive
                  ? 'bg-white/20 text-white border border-white/25 shadow-sm'
                  : 'bg-transparent'
              }`}
            >
              <Icon size={18} className={isActive ? 'stroke-[2.5]' : 'stroke-[2]'} />
            </div>
            <span
              className={`text-[10px] tracking-tight ${
                isActive ? 'font-bold text-white' : 'font-medium text-white/50'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
