import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { socketsData, SocketData } from "@/data/mockData";
import {
  buildSocketHistory,
  getSeriesForRange,
  sumSeries,
  type ConsumptionPoint,
  type TimeRange,
} from "@/data/powerRetention";

type LiveData = {
  live: number;
  relay: number; // 0 = OFF, 1 = ON
};

type HistoryData = {
  graph_60m: number[];
  graph_24h: number[];
  graph_30d: number[];
  graph_months: number[];
};

interface CurrencyOption {
  code: "USD" | "EUR" | "GBP";
  symbol: string;
  label: string;
}

export const currencyOptions: CurrencyOption[] = [
  { code: "USD", symbol: "$", label: "USD ($)" },
  { code: "EUR", symbol: "€", label: "EUR (€)" },
  { code: "GBP", symbol: "£", label: "GBP (£)" },
];

interface CostConfig {
  rate: number;
  currency: CurrencyOption["code"];
}

interface PowerStripContextValue {
  sockets: SocketData[];
  costConfig: CostConfig;
  setCostConfig: (config: CostConfig) => void;
  toggleSocket: (socketId: number) => void;
  renameSocket: (socketId: number, name: string) => void;
  getTotalConsumption: () => number;
  getTotalCost: () => number;
  getTopConsumers: (count?: number) => SocketData[];
  getConsumptionSeries: (
    outletId: number | "all",
    range: TimeRange,
  ) => ConsumptionPoint[];
  getCurrencySymbol: () => string;
  liveData: LiveData;
  historyData: HistoryData | null;
  wsConnected: boolean;
  socket: WebSocket | null;
}

const PowerStripContext = createContext<PowerStripContextValue | undefined>(
  undefined,
);

export const PowerStripProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [sockets, setSockets] = useState<SocketData[]>(socketsData);
  const [costConfig, setCostConfig] = useState<CostConfig>({
    rate: 0.15,
    currency: "USD",
  });

  // WebSocket state
  const [liveData, setLiveData] = useState<LiveData>({ live: 0, relay: 0 });
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  // WebSocket Connection
  useEffect(() => {
    const ws = new WebSocket("ws://SmartPowerStrip.local:81");
    setSocket(ws);

    ws.onopen = () => {
      setWsConnected(true);
      console.log("Connected. Requesting full data...");
      ws.send("GET_FULL_DATA");
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const json = JSON.parse(event.data);

        // Distinguish between Live data and History data
        if (json.hasOwnProperty("live")) {
          setLiveData(json as LiveData);
        } else if (json.hasOwnProperty("graph_24h")) {
          setHistoryData(json as HistoryData);
        }
      } catch (e) {
        console.warn("Non-JSON received:", event.data);
      }
    };

    ws.onerror = () => {
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  const basePowerRef = useRef(
    new Map(socketsData.map((socket) => [socket.id, socket.currentPower])),
  );
  const historyMap = useMemo(() => {
    const now = Date.now();
    const entries = socketsData.map((socket) => [
      socket.id,
      buildSocketHistory(socket.currentPower, now),
    ]);
    return new Map<number, ReturnType<typeof buildSocketHistory>>(
      entries as [number, ReturnType<typeof buildSocketHistory>][],
    );
  }, []);

  const toggleSocket = (socketId: number) => {
    setSockets((prev) =>
      prev.map((socket) => {
        if (socket.id !== socketId) {
          return socket;
        }
        const nextStatus = socket.status === "on" ? "off" : "on";
        const basePower =
          basePowerRef.current.get(socketId) ?? socket.currentPower;
        return {
          ...socket,
          status: nextStatus,
          currentPower: nextStatus === "on" ? basePower : 0,
        };
      }),
    );
  };

  const renameSocket = (socketId: number, name: string) => {
    setSockets((prev) =>
      prev.map((socket) =>
        socket.id === socketId ? { ...socket, name } : socket,
      ),
    );
  };

  const getTotalConsumption = () => {
    return Number(
      sockets.reduce((acc, socket) => acc + socket.currentPower, 0).toFixed(2),
    );
  };

  const getTotalCost = () => {
    return Number(
      sockets
        .reduce(
          (acc, socket) => acc + socket.monthlyConsumption * costConfig.rate,
          0,
        )
        .toFixed(2),
    );
  };

  const getTopConsumers = (count: number = 3) => {
    return [...sockets]
      .sort((a, b) => b.monthlyConsumption - a.monthlyConsumption)
      .slice(0, count);
  };

  const getConsumptionSeries = (outletId: number | "all", range: TimeRange) => {
    // If we have WebSocket history data, use it instead of mock data
    if (historyData) {
      let dataArray: number[] = [];
      let timeStep = 60000; // 1 minute in milliseconds

      switch (range) {
        case "last_hour":
          dataArray = historyData.graph_60m || [];
          timeStep = 60000; // 1 minute
          break;
        case "last_day":
          dataArray = historyData.graph_24h || [];
          timeStep = 3600000; // 1 hour
          break;
        case "last_month":
          dataArray = historyData.graph_30d || [];
          timeStep = 86400000; // 1 day
          break;
        case "last_year":
          dataArray = historyData.graph_months || [];
          timeStep = 2592000000; // ~30 days
          break;
        default:
          dataArray = historyData.graph_24h || [];
          timeStep = 3600000;
      }

      // Convert array to ConsumptionPoint[]
      const now = Date.now();
      return dataArray.map((value, index) => ({
        timestamp: now - (dataArray.length - index - 1) * timeStep,
        value: value,
      }));
    }

    // Fallback to mock data if no WebSocket data available
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
    return (
      currencyOptions.find((option) => option.code === costConfig.currency)
        ?.symbol ?? "$"
    );
  };

  const value: PowerStripContextValue = {
    sockets,
    costConfig,
    setCostConfig,
    toggleSocket,
    renameSocket,
    getTotalConsumption,
    getTotalCost,
    getTopConsumers,
    getConsumptionSeries,
    getCurrencySymbol,
    liveData,
    historyData,
    wsConnected,
    socket,
  };

  return (
    <PowerStripContext.Provider value={value}>
      {children}
    </PowerStripContext.Provider>
  );
};

export const usePowerStrip = () => {
  const context = useContext(PowerStripContext);
  if (!context) {
    throw new Error("usePowerStrip must be used within PowerStripProvider");
  }
  return context;
};
