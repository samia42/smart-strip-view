export interface SocketData {
  id: number;
  name: string;
  status: "on" | "off";
  currentPower: number; // Watts
  dailyConsumption: number; // kWh
  monthlyConsumption: number; // kWh
  dailyCost: number; // USD
  monthlyCost: number; // USD
  deviceType: string;
  safetyStatus: "normal" | "warning" | "critical";
  temperature: number; // Celsius
  lastUpdated: string;
}

export interface AlertData {
  id: string;
  socketId: number;
  type: "warning" | "critical" | "info";
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

// Mock data for 3 sockets
export const socketsData: SocketData[] = [
  {
    id: 1,
    name: "Living Room TV",
    status: "on",
    currentPower: 125,
    dailyConsumption: 2.4,
    monthlyConsumption: 72,
    dailyCost: 0.36,
    monthlyCost: 10.8,
    deviceType: "Television",
    safetyStatus: "normal",
    temperature: 42,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Gaming Console",
    status: "on",
    currentPower: 18,
    dailyConsumption: 0.48,
    monthlyConsumption: 14.4,
    dailyCost: 0.07,
    monthlyCost: 2.16,
    deviceType: "Gaming Device",
    safetyStatus: "warning",
    temperature: 38,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 3,
    name: "Sound System",
    status: "off",
    currentPower: 0,
    dailyConsumption: 0.6,
    monthlyConsumption: 18,
    dailyCost: 0.09,
    monthlyCost: 2.7,
    deviceType: "Audio Device",
    safetyStatus: "normal",
    temperature: 28,
    lastUpdated: new Date().toISOString(),
  },
];

export const alertsData: AlertData[] = [
  {
    id: "alert-1",
    socketId: 2,
    type: "critical",
    title: "High Temperature Alert",
    message: "Socket 2 (Gaming Console) temperature exceeded 55°C. Outlet disabled for safety.",
    timestamp: new Date(Date.now() - 300000).toISOString(),
    resolved: false,
  },
  {
    id: "alert-2",
    socketId: 3,
    type: "info",
    title: "Device Identified",
    message: "Socket 3 recognized as a Bose Sound System.",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    resolved: true,
  },
];

export const getTotalConsumption = () => {
  return socketsData.reduce((acc, socket) => acc + socket.currentPower, 0);
};

export const getTotalMonthlyCost = () => {
  return socketsData.reduce((acc, socket) => acc + socket.monthlyCost, 0);
};

export const getActiveAlerts = () => {
  return alertsData.filter((alert) => !alert.resolved);
};

export const getSocketById = (id: number) => {
  return socketsData.find((socket) => socket.id === id);
};
