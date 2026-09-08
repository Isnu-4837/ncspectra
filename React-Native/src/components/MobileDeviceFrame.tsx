import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ScreenType } from '../types';

interface MobileDeviceFrameProps {
  children: React.ReactNode;
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  isDark: boolean;
  onToggleTheme: (dark: boolean) => void;
  toast: {
    isOpen: boolean;
    title: string;
    desc: string;
    icon?: string;
    color?: string;
  };
  onCloseToast: () => void;
}

export const MobileDeviceFrame: React.FC<MobileDeviceFrameProps> = ({
  children,
  currentScreen,
  onNavigate,
  isDark,
  onToggleTheme,
  toast,
  onCloseToast,
}) => {
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'fullscreen'>('mobile');
  const [currentTime, setCurrentTime] = useState('14:22');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const screensList: { id: ScreenType; label: string; icon: string }[] = [
    { id: 'login', label: 'Auth Screen', icon: 'lock' },
    { id: 'dashboard', label: 'Field Dashboard', icon: 'dashboard' },
    { id: 'reagents', label: 'Reagent Select', icon: 'science' },
    { id: 'scan', label: 'Live HUD Scan', icon: 'photo_camera' },
    { id: 'capture', label: 'Capture Verify', icon: 'check_circle' },
    { id: 'results', label: 'Custody Log', icon: 'history_edu' },
    { id: 'sync', label: 'Vault Sync', icon: 'cloud_sync' },
    { id: 'profile', label: 'Officer Profile', icon: 'shield' },
  ];

  return (
    <View className={`min-h-screen w-full flex-col items-center justify-start transition-colors duration-200 ${isDark ? 'dark bg-[#030c17]' : 'bg-[#0b1726]'}`}>
      
      {/* Top Quick-Access Tactical Toolbar (for easy demo testing of all Expo screens) */}
      <View className="w-full bg-[#051424] text-white border-b border-blue-950/80 px-3 py-2 flex-row flex-wrap items-center justify-between gap-2 z-50 text-xs shadow-md">
        <View className="flex-row items-center gap-2">
          <View className="flex-row items-center gap-1.5 font-bold font-mono text-emerald-400">
            <View className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Text className="text-emerald-400 font-mono font-bold">EXPO REACT NATIVE SIMULATOR</Text>
          </View>
          <Text className="text-slate-500">•</Text>
          <Text className="text-slate-300 font-mono hidden md:inline">NCB TACTICAL FIELD v2.4</Text>
        </View>

        {/* Screen Quick-Jump Dropdown / Chips */}
        <View className="flex-row items-center gap-1 overflow-x-auto py-0.5">
          <Text className="text-slate-400 text-[11px] uppercase tracking-wider font-bold mr-1 hidden sm:inline">
            Screen:
          </Text>
          <View className="flex-row items-center gap-1 bg-slate-900/80 p-0.5 rounded-lg border border-slate-700/60">
            {screensList.map((s) => (
              <TouchableOpacity
                key={s.id}
                onPress={() => onNavigate(s.id)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-all whitespace-nowrap flex-row items-center gap-1 cursor-pointer ${
                  currentScreen === s.id
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title={s.label}
              >
                <span className="material-symbols-outlined text-[13px]">{s.icon}</span>
                <Text className="hidden lg:inline text-inherit font-inherit">{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Device Frame / Fullscreen Toggle */}
          <TouchableOpacity
            onPress={() => setDeviceMode(deviceMode === 'mobile' ? 'fullscreen' : 'mobile')}
            className="ml-2 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono flex-row items-center gap-1 border border-slate-700 cursor-pointer"
            title="Toggle Device Frame"
          >
            <span className="material-symbols-outlined text-[14px]">
              {deviceMode === 'mobile' ? 'fullscreen' : 'smartphone'}
            </span>
            <Text className="hidden sm:inline text-inherit font-inherit">
              {deviceMode === 'mobile' ? 'Expand' : 'Phone Frame'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Container: Device Shell or Edge-to-Edge */}
      <View className={`w-full items-center justify-center p-0 ${deviceMode === 'mobile' ? 'sm:py-6 sm:px-4' : 'h-full'}`}>
        
        <View
          className={`w-full transition-all duration-300 flex-col relative overflow-hidden ${
            deviceMode === 'mobile'
              ? 'max-w-[430px] min-h-[884px] sm:rounded-[44px] sm:shadow-[0_25px_70px_rgba(0,0,0,0.85)] sm:border-[8px] sm:border-slate-800/90 sm:ring-1 sm:ring-white/10'
              : 'max-w-xl min-h-screen'
          } bg-surface text-on-surface`}
        >
          {/* Simulated Mobile Status Bar */}
          <View className="w-full bg-surface/90 backdrop-blur-md pt-2 px-5 pb-1 flex-row items-center justify-between text-on-surface select-none z-50 text-[12px] font-semibold border-b border-surface-container-highest/30">
            <Text className="font-mono tracking-tight font-semibold">{currentTime} IST</Text>

            {/* Simulated Dynamic Camera Island / Punch Hole */}
            <View className="w-24 h-4 bg-black rounded-full flex-row items-center justify-center gap-2 px-2 shadow-inner">
              <View className="w-2 h-2 rounded-full bg-blue-950/80 border border-slate-800" />
              <View className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
            </View>

            <View className="flex-row items-center gap-1.5 text-on-surface-variant font-mono text-[11px]">
              <span className="material-symbols-outlined text-[14px] text-primary">signal_cellular_4_bar</span>
              <Text className="text-[10px] font-bold font-mono">5G</Text>
              <span className="material-symbols-outlined text-[14px]">wifi</span>
              <View className="flex-row items-center gap-0.5">
                <Text className="text-[10px] font-mono">84%</Text>
                <span className="material-symbols-outlined text-[14px] text-primary">battery_5_bar</span>
              </View>
            </View>
          </View>

          {/* Actual Screen Viewport */}
          <View className="flex-1 flex-col w-full overflow-y-auto relative bg-surface">
            {children}
          </View>

          {/* Simulated iOS/Android Home Indicator Bar */}
          <View className="w-full py-1.5 bg-surface items-center justify-center pointer-events-none select-none z-50">
            <View className="w-32 h-1 bg-on-surface-variant/40 rounded-full" />
          </View>

          {/* Interactive Floating Toast Notification */}
          <View
            className={`fixed bottom-6 left-4 right-4 max-w-sm mx-auto p-space-sm bg-surface-container-highest text-on-surface rounded-xl shadow-2xl flex-row items-center justify-between z-50 border border-surface-container-highest/80 transition-all duration-300 transform ${
              toast.isOpen
                ? 'opacity-100 pointer-events-auto translate-y-0'
                : 'opacity-0 pointer-events-none translate-y-4'
            }`}
          >
            <View className="flex-row items-center gap-space-xs min-w-0">
              <span className={`material-symbols-outlined text-[22px] flex-shrink-0 ${toast.color || 'text-primary'}`}>
                {toast.icon || 'check_circle'}
              </span>
              <View className="flex-col min-w-0">
                <Text className="font-headline-sm text-headline-sm text-on-surface font-bold truncate">
                  {toast.title}
                </Text>
                <Text className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  {toast.desc}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onCloseToast}
              className="p-1 text-on-surface-variant hover:text-on-surface ml-2 shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};
