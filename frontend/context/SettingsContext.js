import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsContext = createContext({
    autoRefresh: true,
    setAutoRefresh: () => { },
    temperatureUnit: 'C',
    setTemperatureUnit: () => { },
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [temperatureUnit, setTemperatureUnit] = useState('C');

    useEffect(() => {
        const loadSettings = async () => {
            const storedUnit = await AsyncStorage.getItem('temperatureUnit');
            if (storedUnit) {
                setTemperatureUnit(storedUnit);
            }
        };
        loadSettings();
    }, []);

    const handleSetTemperatureUnit = async (unit) => {
        setTemperatureUnit(unit);
        await AsyncStorage.setItem('temperatureUnit', unit);
    };

    return (
        <SettingsContext.Provider value={{ autoRefresh, setAutoRefresh, temperatureUnit, setTemperatureUnit: handleSetTemperatureUnit }}>
            {children}
        </SettingsContext.Provider>
    );
};
