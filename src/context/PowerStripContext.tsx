import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { alertsData, socketsData, AlertData, SocketData } from "@/data/mockData";
import {
  buildSocketHistory,
  getSeriesForRange,
  sumSeries,
  type ConsumptionPoint,
  type TimeRange,
} from "@/data/powerRetention";

interface CurrencyOption {
  code: "USD" | "EUR" | "GBP";
  symbol: string;
  label: string;
}

export const currencyOptions: CurrencyOption[] = [
  { code: "USD", symbol: "$", label: "USD ($)" },
  { code: "EUR", symbol: "EUR", label: "EUR (EUR)" },
  { code: "GBP", symbol: "GBP", label: "GBP (GBP)" },
];

interface CostConfig {
  rate: number;
  currency: CurrencyOption["code"];
}

interface PowerStripContextValue {
  sockets: SocketData[];
  alerts: AlertData[];
  costConfig: CostConfig;
  setCostConfig: (config: CostConfig) => void;
  toggleSocket: (socketId: number) => void;
  renameSocket: (socketId: number, name: string) => void;
  currentAlert: AlertData | null;
  getTotalConsumption: () => number;
  getTotalCost: () => number;
  getTopConsumers: (count?: number) => SocketData[];
  getConsumptionSeries: (
    outletId: number | "all",
    range: TimeRange
  ) => ConsumptionPoint[];
  getCurrencySymbol: () => string;
}

const PowerStripContext = createContext<PowerStripContextValue | undefined>(undefined);

export const PowerStripProvider = ({ children }: { children: React.ReactNode }) => {
  const [sockets, setSockets] = useState<SocketData[]>(socketsData);
  const [alerts] = useState<AlertData[]>(alertsData);
  const [costConfig, setCostConfig] = useState<CostConfig>({
    rate: 0.15,
    currency: "USD",
  });

  const basePowerRef = useRef(new Map(socketsData.map((socket) => [socket.id, socket.currentPower])));
  const historyMap = useMemo(() => {
    const now = Date.now();
    const entries = socketsData.map((socket) => [socket.id, buildSocketHistory(socket.currentPower, now)]);
    return new Map<number, ReturnType<typeof buildSocketHistory>>(entries);
  }, []);

  const currentAlert = useMemo(() => {
    const activeAlerts = alerts.filter((alert) => !alert.resolved);
    if (activeAlerts.length === 0) {
      return null;
    }
    return activeAlerts.sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
  }, [alerts]);

  useEffect(() => {
    if (!currentAlert) {
      return;
    }
    setSockets((prev) =>
      prev.map((socket) =>
        socket.id === currentAlert.socketId && (socket.status !== "off" || socket.currentPower !== 0)
          ? { ...socket, status: "off", currentPower: 0 }
          : socket
      )
    );
  }, [currentAlert]);

  const toggleSocket = (socketId: number) => {
    if (currentAlert?.socketId === socketId) {
      return;
    }
    setSockets((prev) =>
      prev.map((socket) => {
        if (socket.id !== socketId) {
          return socket;
        }
        const nextStatus = socket.status === "on" ? "off" : "on";
        const basePower = basePowerRef.current.get(socketId) ?? socket.currentPower;
        return {
          ...socket,
          status: nextStatus,
          currentPower: nextStatus === "on" ? basePower : 0,
        };
      })
    );
  };

  const renameSocket = (socketId: number, name: string) => {
    setSockets((prev) =>
      prev.map((socket) => (socket.id === socketId ? { ...socket, name } : socket))
    );
  };

  const getTotalConsumption = () => {
    return Number(sockets.reduce((acc, socket) => acc + socket.currentPower, 0).toFixed(2));
  };

  const getTotalCost = () => {
    return Number(
      sockets.reduce((acc, socket) => acc + socket.monthlyConsumption * costConfig.rate, 0).toFixed(2)
    );
  };

  const getTopConsumers = (count: number = 3) => {
    return [...sockets]
      .sort((a, b) => b.monthlyConsumption - a.monthlyConsumption)
      .slice(0, count);
  };

  const getConsumptionSeries = (outletId: number | "all", range: TimeRange) => {
    if (outletId === "all") {
      const allSeries = sockets
        .map((socket) => historyMap.get(socket.id))
        .filter(Boolean)
        .map((history) => getSeriesForRange(history!, range));
      return sumSeries(allSeries);
    }
    const history = historyMap.get(outletId);
    if (!history) {
      return [];
    }
    return getSeriesForRange(history, range);
  };

  const getCurrencySymbol = () => {
    return currencyOptions.find((option) => option.code === costConfig.currency)?.symbol ?? "$";
  };

  const value: PowerStripContextValue = {
    sockets,
    alerts,
    costConfig,
    setCostConfig,
    toggleSocket,
    renameSocket,
    currentAlert,
    getTotalConsumption,
    getTotalCost,
    getTopConsumers,
    getConsumptionSeries,
    getCurrencySymbol,
  };

  return <PowerStripContext.Provider value={value}>{children}</PowerStripContext.Provider>;
};

export const usePowerStrip = () => {
  const context = useContext(PowerStripContext);
  if (!context) {
    throw new Error("usePowerStrip must be used within PowerStripProvider");
  }
  return context;
};
