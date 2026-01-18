import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils"; 

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "primary" | "success" | "warning" | "danger";
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const MetricCard = ({ title, value, subtitle, icon: Icon, variant = "primary", trend }: MetricCardProps) => {
  
  const variantStyles = {
    primary: "text-blue-500 bg-blue-500/10", 
    success: "text-green-500 bg-green-500/10", 
    warning: "text-yellow-500 bg-yellow-500/10", 
    danger: "text-red-500 bg-red-500/10", 
  };

  return (
    <div className="h-full rounded-lg border bg-slate-950 border-slate-800 text-slate-100 shadow-xl p-6 transition-all hover:border-slate-700">
      
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <h3 className="text-3xl font-bold text-slate-100 mt-2">{value}</h3>
        </div>
        
        <div className={cn("p-3 rounded-xl", variantStyles[variant])}>
          <Icon size={24} />
        </div>
      </div>

      {(trend || subtitle) && (
        <div className="mt-4 flex items-center text-sm">
          {trend && (
            <span className={cn(
              "font-medium flex items-center mr-2", 
              trend.isPositive ? "text-green-500" : "text-red-500"
            )}>
              {trend.isPositive ? "↑" : "↓"} {trend.value}
            </span>
          )}
          
          {subtitle && (
            <span className="text-slate-500 truncate">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default MetricCard;