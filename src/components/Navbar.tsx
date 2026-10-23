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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d0f17] border-t-4 border-[#18181b] outline-1 outline-[#334155] shadow-[0_-4px_0_0_#000000] pb-safe">
      <div className="max-w-xl mx-auto flex items-center justify-around py-2 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all ${
                isActive
                  ? 'text-amber-400 font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-4 h-4 transition-transform ${
                    isActive ? 'scale-110 drop-shadow-[2px_2px_0px_#000]' : ''
                  }`}
                />
                {tab.badge && (
                  <span
                    className={`absolute -top-2 -right-4 retro-badge font-pixel-title text-[6px] text-white ${tab.badgeColor} animate-pulse`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="font-pixel-title text-[7px] mt-1 tracking-tighter uppercase">{tab.label}</span>
              {isActive && (
                <div className="w-2.5 h-1 bg-amber-400 mt-1 shadow-[1px_1px_0px_#000]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
