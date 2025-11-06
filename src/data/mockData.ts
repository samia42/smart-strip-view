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

// Mock data for 4 sockets
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
    currentPower: 8,
    dailyConsumption: 0.19,
    monthlyConsumption: 5.7,
    dailyCost: 0.03,
    monthlyCost: 0.86,
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
  {
    id: 4,
    name: "Phone Charger",
    status: "on",
    currentPower: 65,
    dailyConsumption: 0.52,
    monthlyConsumption: 15.6,
    dailyCost: 0.08,
    monthlyCost: 2.34,
    deviceType: "Charger",
    safetyStatus: "critical",
    temperature: 58,
    lastUpdated: new Date().toISOString(),
  },
];

export const alertsData: AlertData[] = [
  {
    id: "alert-1",
    socketId: 4,
    type: "critical",
    title: "High Temperature Alert",
    message: "Socket 4 (Phone Charger) temperature exceeded 55°C. Immediate attention required.",
    timestamp: new Date(Date.now() - 300000).toISOString(),
    resolved: false,
  },
  {
    id: "alert-2",
    socketId: 2,
    type: "warning",
    title: "Standby Power Waste",
    message: "Gaming Console consuming 8W in standby mode. Wasting ~$0.86/month.",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    resolved: false,
  },
  {
    id: "alert-3",
    socketId: 1,
    type: "info",
    title: "Device Recognized",
    message: "Successfully identified device as Samsung Smart TV.",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
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
