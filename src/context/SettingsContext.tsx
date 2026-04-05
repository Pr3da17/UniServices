import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsData {
  showTimetable: boolean;
  showMail: boolean;
  showTodo: boolean;
  showLibrary: boolean;
  showCrous: boolean;
  reduceMotion: boolean;
}

const defaultSettings: SettingsData = {
  showTimetable: true,
  showMail: true,
  showTodo: true,
  showLibrary: true,
  showCrous: true,
  reduceMotion: false,
};

interface SettingsContextType {
  settings: SettingsData;
  updateSetting: <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SettingsData>(() => {
    try {
      const saved = localStorage.getItem('moodle_user_settings');
      if (saved) {
        return { ...defaultSettings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn("Failed to load settings from localStorage", e);
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('moodle_user_settings', JSON.stringify(settings));
    
    // Apply reduceMotion to document body so CSS/Framer can read it
    if (settings.reduceMotion) {
      document.body.classList.add('reduce-motion');
    } else {
      document.body.classList.remove('reduce-motion');
    }
  }, [settings]);

  const updateSetting = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
