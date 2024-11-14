"use client"

import React, { createContext, useContext, useState } from 'react';

interface ProgressType {
    websiteCount: number;
    setWebsiteCount: (websiteCount: number) => void;
    mailCount: number;
    setMailCount: (mailCount : number) => void;
}

const Progress = createContext<ProgressType | undefined>(undefined);

export const ProgressProvider = ({ children } : {children : React.ReactNode}) => {
    const [websiteCount, setWebsiteCount] = useState<number>(0);
    const [mailCount, setMailCount] = useState<number>(0);

    return (
        <Progress.Provider value={{ websiteCount, setWebsiteCount, mailCount, setMailCount}}>
            {children}
        </Progress.Provider>
    );
};

export const useProgress = () => {
    const context = useContext(Progress);
    if (!context) {
        throw new Error("useProgress must be used within a ProgressProvider");
    }
    return context;
};