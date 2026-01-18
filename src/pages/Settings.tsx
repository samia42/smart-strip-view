import { useState, useEffect } from "react";
import { Save, Coins, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const Settings = () => {
  const [currency, setCurrency] = useState("€");
  const [energyCost, setEnergyCost] = useState("0.15");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedCurrency = localStorage.getItem("app_currency");
    const savedCost = localStorage.getItem("app_energy_cost");

    if (savedCurrency) setCurrency(savedCurrency);
    if (savedCost) setEnergyCost(savedCost);

    setIsLoaded(true);
  }, []);

  const handleSave = () => {
    localStorage.setItem("app_currency", currency);
    localStorage.setItem("app_energy_cost", energyCost);

    window.dispatchEvent(new Event("storage"));

    toast.success("Settings saved successfully");
  };

  if (!isLoaded) return null;

  return (
    <div className="p-6 bg-slate-900 min-h-screen font-sans text-slate-100">

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-slate-400">Configure your application preferences</p>
      </div>

      <div className="max-w-2xl">
        <div className="rounded-lg border bg-slate-950 border-slate-800 text-slate-100 shadow-xl overflow-hidden">

          <div className="p-6 border-b border-slate-800">
            <h3 className="text-xl font-medium flex items-center gap-2">
              <Coins size={20} className="text-blue-500" />
              General Configuration
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Manage currency symbols and electricity costs used for calculations.
            </p>
          </div>

          <div className="p-6 space-y-8">

            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300">Currency Symbol</label>
              <div className="grid grid-cols-3 gap-4">
                {["€", "$", "£"].map((symbol) => (
                  <button
                    key={symbol}
                    onClick={() => setCurrency(symbol)}
                    className={cn(
                      "flex items-center justify-center py-3 px-4 rounded-md border transition-all",
                      currency === symbol
                        ? "bg-blue-500/10 border-blue-500 text-blue-500 font-bold"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800"
                    )}
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-300 flex items-center justify-between">
                <span>Energy Cost (per kWh)</span>
                <span className="text-xs text-slate-500 font-normal">Used to estimate monthly costs</span>
              </label>

              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <Zap size={16} />
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={energyCost}
                  onChange={(e) => setEnergyCost(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 rounded-md py-2.5 pl-10 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
                  placeholder="0.15"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                  {currency}/kWh
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Current average price: <span className="text-slate-300">0.15 - 0.25 {currency}</span> depending on your region.
              </p>
            </div>

          </div>

          <div className="p-6 bg-slate-900/50 border-t border-slate-800 flex justify-end">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-md font-medium transition-colors shadow-lg shadow-blue-900/20"
            >
              <Save size={18} />
              Save Changes
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;