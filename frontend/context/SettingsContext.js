import React, { createContext, useState, useContext } from 'react';

const SettingsContext = createContext({
    autoRefresh: true,
    setAutoRefresh: () => { },
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
    const [autoRefresh, setAutoRefresh] = useState(true);

    return (
        <SettingsContext.Provider value={{ autoRefresh, setAutoRefresh }}>
            {children}
        </SettingsContext.Provider>
    );
};
