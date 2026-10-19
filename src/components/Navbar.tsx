import React from 'react';
import { Shield, CheckSquare, Sparkles, Castle, BarChart3 } from 'lucide-react';

export type TabType = 'character' | 'tasks' | 'skills' | 'dungeon' | 'stats';

interface NavbarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  pendingTasksCount: number;
  availableSp: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  pendingTasksCount,
  availableSp,
}) => {
  const tabs = [
    {
      id: 'tasks' as TabType,
      label: 'Misiones',
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? pendingTasksCount : null,
      badgeColor: 'bg-emerald-500',
    },
    {
      id: 'skills' as TabType,
      label: 'Skills',
      icon: Sparkles,
      badge: availableSp > 0 ? `${availableSp} SP` : null,
      badgeColor: 'bg-purple-600',
    },
    {
      id: 'dungeon' as TabType,
      label: 'Mazmorra',
      icon: Castle,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'character' as TabType,
      label: 'Héroe',
      icon: Shield,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'stats' as TabType,
      label: 'Logros',
      icon: BarChart3,
      badge: null,
      badgeColor: '',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d0f17]/95 backdrop-blur-md border-t-2 border-stone-800 pb-safe">
      <div className="max-w-xl mx-auto flex items-center justify-around py-2 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all rounded-xl ${
                isActive
                  ? 'text-amber-400 font-bold scale-105'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : ''
                  }`}
                />
                {tab.badge && (
                  <span
                    className={`absolute -top-1.5 -right-3.5 text-[9px] font-bold text-white px-1.5 py-0.2 rounded-full ${tab.badgeColor} shadow-sm animate-pulse`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">{tab.label}</span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-0.5 shadow-[0_0_6px_#fbbf24]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
