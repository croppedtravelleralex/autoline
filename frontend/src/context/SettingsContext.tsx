import React, { createContext, useState, useEffect, useContext } from 'react';
import type { SystemSettings, Recipe } from '../types/settings';
import { SettingsService } from '../services/settingsService';


export interface SimulationConfig {
    timeMultiplier: number;
    noiseEnabled: boolean;
    activeFaults: any[];
}

interface SettingsContextType {
    settings: SystemSettings;
    recipes: Recipe[];
    simulationConfig: SimulationConfig;
    isLoading: boolean;
    updateSettings: (newSettings: SystemSettings) => Promise<void>;
    reloadRecipes: () => Promise<void>;
    updateSimulationConfig: (config: SimulationConfig) => Promise<void>;
}

const defaultSettings: SystemSettings = {
    theme: 'dark',
    notifications: {
        enableBrowserNotifications: true,
        notifyOnWarning: true,
        notifyOnError: true
    },
    thresholds: {
        anodeBakeHighTemp: 400,
        anodeBakeLowTemp: 20,
        cathodeBakeHighTemp: 430,
        cathodeBakeLowTemp: 20,
        growthHighTemp: 250,
        growthLowTemp: 20,
        vacuumAlertThreshold: 0.001,
        processVacuumThreshold: 0.0005
    },
    hardware: {
        protocol: 'simulation',
        ipAddress: '127.0.0.1',
        port: 502,
        slaveId: 1,
        pollingInterval: 1000
    },
    data: {
        retentionDays: 30,
        autoBackup: false,
        backupPath: './backups'
    }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [simulationConfig, setSimulationConfig] = useState<SimulationConfig>({
        timeMultiplier: 1.0,
        noiseEnabled: true,
        activeFaults: []
    });
    const [isLoading, setIsLoading] = useState(true);

    // Apply theme to document
    useEffect(() => {
        const root = window.document.documentElement;

        // Remove both potentials first
        root.classList.remove('light', 'dark');

        if (settings.theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.add('light');
        }
    }, [settings.theme]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [fetchedSettings, fetchedRecipes] = await Promise.all([
                SettingsService.getSettings(),
                SettingsService.getRecipes()
            ]);


            // Ensure compatibility with old settings (merge defaults if missing)
            setSettings({
                ...defaultSettings,
                ...fetchedSettings,
                // Explicitly valid nested objects if they are missing/null in fetched data
                // This protects against backend returning partial objects
                hardware: fetchedSettings.hardware || defaultSettings.hardware,
                data: fetchedSettings.data || defaultSettings.data,
                notifications: fetchedSettings.notifications || defaultSettings.notifications,
                thresholds: fetchedSettings.thresholds || defaultSettings.thresholds
            });

            setRecipes(fetchedRecipes);

            // Try fetching simulation config
            try {
                const response = await fetch('http://127.0.0.1:8001/api/settings/simulation');
                if (response.ok) {
                    const simData = await response.json();
                    setSimulationConfig(simData);
                }
            } catch (e) {
                console.warn("Failed to load simulation config", e);
            }

        } catch (error) {
            console.error("Failed to load settings:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleUpdateSettings = async (newSettings: SystemSettings) => {
        try {
            const updated = await SettingsService.updateSettings(newSettings);
            setSettings(updated);
        } catch (error) {
            console.error("Failed to update settings:", error);
            throw error;
        }
    };

    const reloadRecipes = async () => {
        try {
            const fetchedRecipes = await SettingsService.getRecipes();
            setRecipes(fetchedRecipes);
        } catch (error) {
            console.error("Failed to reload recipes", error);
        }
    }

    const updateSimulationConfig = async (config: SimulationConfig) => {
        try {
            const response = await fetch('http://127.0.0.1:8001/api/settings/simulation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            if (response.ok) {
                const updated = await response.json();
                setSimulationConfig(updated);
            }
        } catch (error) {
            console.error('Failed to update simulation config:', error);
        }
    };

    return (
        <SettingsContext.Provider value={{
            settings,
            recipes,
            simulationConfig,
            isLoading,
            updateSettings: handleUpdateSettings,
            reloadRecipes,
            updateSimulationConfig
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
