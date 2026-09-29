import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  MessageSquare,
  Wand2,
  FolderGit2,
  Files,
  Bot,
  Box,
  Key,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  X
} from 'lucide-react';
import { ActiveTab } from '../../types';

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isSidebarCollapsed,
    toggleSidebar,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    providers
  } = useApp();

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'build', label: 'AI Builder', icon: Wand2, badge: 'Live' },
    { id: 'projects', label: 'Projects', icon: FolderGit2 },
    { id: 'files', label: 'Files', icon: Files },
    { id: 'agents', label: 'Agents', icon: Bot },
    { id: 'models', label: 'Models', icon: Box },
    { id: 'apikeys', label: 'AI Providers', icon: Key },
    { id: 'usage', label: 'Usage & Cost', icon: BarChart3 }
  ];

  const connectedCount = providers.filter((p) => p.isConnected && p.apiKey.trim()).length;

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileDrawerOpen(false);
  };

  const content = (
    <div className="flex flex-col h-full bg-neutral-950 border-r border-neutral-800 text-neutral-300 select-none">
      {/* Brand header in drawer if mobile */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
            A
          </div>
          <span className="font-bold text-white tracking-wider">AURA DEV</span>
        </div>
        <button
          onClick={() => setIsMobileDrawerOpen(false)}
          className="p-1 rounded-lg text-neutral-400 hover:text-white"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Primary Navigation List */}
      <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer group ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent'
              }`}
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition ${
                  isActive ? 'text-indigo-400' : 'text-neutral-400 group-hover:text-neutral-200'
                }`}
              />
              {!isSidebarCollapsed && (
                <div className="flex-1 flex items-center justify-between truncate">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Provider Status Widget */}
      <div className="p-3 border-t border-neutral-800 bg-neutral-950/60">
        {!isSidebarCollapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-neutral-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Providers Active</span>
              </div>
              <span className="font-mono text-white font-semibold">
                {connectedCount} / {providers.length}
              </span>
            </div>

            <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.max(8, (connectedCount / providers.length) * 100)}%` }}
              />
            </div>

            <button
              onClick={() => handleNavClick('apikeys')}
              className="w-full py-1.5 px-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-neutral-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Configure Keys</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => handleNavClick('apikeys')}
              className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300"
              title={`${connectedCount} connected providers`}
            >
              <Key className="w-4 h-4 text-indigo-400" />
            </button>
          </div>
        )}
      </div>

      {/* Desktop Collapse / Expand toggle */}
      <div className="hidden md:flex p-2 border-t border-neutral-800 justify-end">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900 transition"
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside
        className={`hidden md:block shrink-0 transition-all duration-200 z-30 ${
          isSidebarCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
