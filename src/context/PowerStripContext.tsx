import React, { createContext, useContext, useState, ReactNode } from 'react';

export const currencyOptions = [
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
];

interface CostConfig {
  rate: number;
  currency: "USD" | "EUR" | "GBP";
}

interface SocketData {
  id: string;
  name: string;
  monthlyConsumption: number;
}

interface PowerStripContextType {
  costConfig: CostConfig;
  setCostConfig: (config: CostConfig) => void;
  getTotalCost: () => number;
  getTopConsumers: (limit: number) => SocketData[];
  getCurrencySymbol: () => string;
}

const PowerStripContext = createContext<PowerStripContextType | undefined>(undefined);

export const PowerStripProvider = ({ children }: { children: ReactNode }) => {
  const [costConfig, setCostConfigState] = useState<CostConfig>(() => {
    const savedRate = localStorage.getItem("energy_cost");
    const savedCurrency = localStorage.getItem("app_currency");
    return {
      rate: savedRate ? parseFloat(savedRate) : 0.15,
      currency: (savedCurrency as "USD" | "EUR" | "GBP") || "USD"
    };
  });

  const setCostConfig = (config: CostConfig) => {
    setCostConfigState(config);
    localStorage.setItem("energy_cost", config.rate.toString());
    localStorage.setItem("app_currency", config.currency);
  };

  const getCurrencySymbol = () => {
    return currencyOptions.find(o => o.code === costConfig.currency)?.symbol || "$";
  };

  const getTotalCost = () => {
    return 145.20 * costConfig.rate; 
  };

  const getTopConsumers = (limit: number) => {
    const dummyData: SocketData[] = [
      { id: "1", name: "Gaming PC", monthlyConsumption: 45.5 },
      { id: "2", name: "Monitor 4K", monthlyConsumption: 12.2 },
      { id: "3", name: "Desk Lamp", monthlyConsumption: 2.1 },
    ];
    return dummyData.slice(0, limit);
  };

  return (
    <PowerStripContext.Provider value={{ 
      costConfig, 
      setCostConfig, 
      getTotalCost, 
      getTopConsumers, 
      getCurrencySymbol
    }}>
      {children}
    </PowerStripContext.Provider>
  );
};

export const usePowerStrip = () => {
  const context = useContext(PowerStripContext);
  if (context === undefined) {
    throw new Error('usePowerStrip must be used within a PowerStripProvider');
  }
  return context;
};