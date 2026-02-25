import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from "sonner";

export const currencyOptions = [
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
];

interface CostConfig {
  rate: number;
  currency: "USD" | "EUR" | "GBP";
}

export interface Socket {
  id: number;
  name: string;
  status: 'on' | 'off';
  monthlyConsumption: number;
}

interface PowerStripContextType {
  costConfig: CostConfig;
  setCostConfig: (config: CostConfig) => void;
  getTotalCost: () => number;
  getCurrencySymbol: () => string;
  sockets: Socket[];
  renameSocket: (id: number, newName: string) => void;
  getTopConsumers: (limit: number) => Socket[];
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

  const [sockets, setSockets] = useState<Socket[]>(() => {
    const savedNames = localStorage.getItem("sockets_config");
    if (savedNames) {
      return JSON.parse(savedNames);
    }
    return [
      { id: 1, name: "Outlet 1", status: "off", monthlyConsumption: 45.5 },
      { id: 2, name: "Outlet 2", status: "off", monthlyConsumption: 12.2 },
      { id: 3, name: "Outlet 3", status: "off", monthlyConsumption: 2.1 },
    ];
  });

  const renameSocket = (id: number, newName: string) => {
    const updatedSockets = sockets.map(socket =>
      socket.id === id ? { ...socket, name: newName } : socket
    );
    setSockets(updatedSockets);
    localStorage.setItem("sockets_config", JSON.stringify(updatedSockets));
  };

  const getTopConsumers = (limit: number) => {
    return [...sockets]
      .sort((a, b) => b.monthlyConsumption - a.monthlyConsumption)
      .slice(0, limit);
  };

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: NodeJS.Timeout;

    const connect = () => {
      ws = new WebSocket("ws://SmartPowerStrip.local:81");

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.event && data.event.startsWith("overcurrent")) {
            let alertMessage = "";

            if (data.event === "overcurrent_total") {
              alertMessage = "Cutoff: Total current limit exceeded!";
            } else if (data.event === "overcurrent_socket1") {
              alertMessage = "Cutoff: Current limit exceeded on Outlet 1!";
            } else if (data.event === "overcurrent_socket2") {
              alertMessage = "Cutoff: Current limit exceeded on Outlet 2!";
            } else if (data.event === "overcurrent_socket3") {
              alertMessage = "Cutoff: Current limit exceeded on Outlet 3!";
            }

            if (alertMessage) {
              toast.error(alertMessage, {
                duration: 10000,
                id: data.event,
                action: {
                  label: "Fix it",
                  onClick: () => window.location.href = "/devices"
                }
              });
            }
          }
        } catch (e) {
        }
      };

      ws.onclose = () => {
        reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, []);

  return (
    <PowerStripContext.Provider value={{
      costConfig,
      setCostConfig,
      getTotalCost,
      getCurrencySymbol,
      sockets,
      renameSocket,
      getTopConsumers
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