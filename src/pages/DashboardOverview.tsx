import { useState, useEffect } from "react";
import { Zap, DollarSign, TrendingUp } from "lucide-react";
import MetricCard from "@/components/Dashboard/MetricCard";
import SimpleChart from "@/components/Dashboard/SimpleChart";
import { socketsData, SocketData } from "@/data/mockData";
import { cn } from "@/lib/utils";

const DashboardCard = ({ className, children }: { className?: string, children: React.ReactNode }) => (
  <div className={cn("rounded-lg border bg-slate-950 border-slate-800 text-slate-100 shadow-xl", className)}>
    {children}
  </div>
);

const generateHistoryData = () => {
  const data = [];
  const minutes = 60;
  let baseValue = 200;

  for (let i = 0; i <= minutes; i++) {
    const noise = Math.floor(Math.random() * 40) - 20;
    baseValue = Math.max(50, Math.min(400, baseValue + noise));

    let label = "";
    const minutesFromEnd = minutes - i;

    if (minutesFromEnd === 0) {
      label = "now";
    } else if (minutesFromEnd === 60) {
      label = "-1h";
    } else if (minutesFromEnd % 10 === 0) {
      label = `-${minutesFromEnd}min`;
    }

    data.push({
      label: label,
      value: baseValue,
    });
  }
  return data;
};

const historyData = generateHistoryData();

const DashboardOverview = () => {
  const [currency, setCurrency] = useState("€");
  
  const [currentSockets, setCurrentSockets] = useState<SocketData[]>(() => {
    const saved = localStorage.getItem("app_sockets_data");
    return saved ? JSON.parse(saved) : socketsData;
  });

  useEffect(() => {
    const savedCurrency = localStorage.getItem("app_currency");
    if (savedCurrency) {
      setCurrency(savedCurrency);
    }
  }, []);

  const totalPower = currentSockets.reduce((acc, socket) => {
    return acc + (socket.status === "on" ? socket.currentPower : 0);
  }, 0);

  const totalCost = currentSockets.reduce((acc, socket) => acc + socket.monthlyCost, 0);

  return (
    <div className="p-6 bg-slate-900 min-h-screen font-sans text-slate-100">
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
        <p className="text-slate-400">Real-time energy monitoring and insights for your smart power strip</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="Total Power Consumption"
          value={`${totalPower}W`}
          subtitle="Current usage across all sockets"
          icon={Zap}
          variant="primary"
          trend={{ value: "12% vs yesterday", isPositive: false }}
        />
        <MetricCard
          title="Estimated Monthly Cost"
          value={`${totalCost.toFixed(2)} ${currency}`}
          subtitle="Based on current usage"
          icon={DollarSign}
          variant="success"
        />
        <MetricCard
          title="Efficiency Score"
          value="78%"
          subtitle="Good energy management"
          icon={TrendingUp}
          variant="success"
          trend={{ value: "5% improvement", isPositive: true }}
        />
      </div>

      <div className="mb-8">
        <SimpleChart 
            title="Total Power Consumption (Last Hour)" 
            data={historyData} 
            unit="W" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard className="p-6">
            <h3 className="text-xl font-semibold mb-6 text-slate-100">Most costly devices</h3>
            
            <div className="space-y-6">
              {currentSockets.map((socket) => {
                const percentage = totalCost > 0 ? (socket.monthlyCost / totalCost) * 100 : 0;
                
                return (
                  <div key={socket.id}>
                    <div className="flex justify-between mb-2 text-sm">
                      <span className="font-medium text-slate-200">{socket.name}</span>
                      <span className="text-slate-400 font-mono">
                        {currency}{socket.monthlyCost.toFixed(2)}<span className="text-slate-600 text-xs">/mo</span>
                      </span>
                    </div>
                    
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-800 pt-5 mt-6">
              <div className="flex justify-between items-center">
                <span className="font-medium text-slate-300">Total Monthly Cost</span>
                <span className="text-xl font-bold text-blue-500">{currency}{totalCost.toFixed(2)}</span>
              </div>
            </div>
        </DashboardCard>
      </div>

    </div>
  );
};

export default DashboardOverview;