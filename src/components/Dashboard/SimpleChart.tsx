import { cn } from "@/lib/utils";

interface DataPoint {
  label: string;
  value: number;
}

interface SimpleChartProps {
  title: string;
  data: DataPoint[];
  unit?: string;
}

const SimpleChart = ({ title, data, unit = "W" }: SimpleChartProps) => {
  if (!data || data.length === 0) return null;

  const values = data.map(d => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  
  const range = maxVal - minVal || 1; 
  const padding = range * 0.2; 
  const yMin = Math.max(0, minVal - padding);
  const yMax = maxVal + padding;

  const width = 100;
  const height = 100;

  const getX = (index: number) => (index / (data.length - 1)) * width;
  const getY = (value: number) => height - ((value - yMin) / (yMax - yMin)) * height;

  const points = data.map((d, i) => [getX(i), getY(d.value)]);

  const getControlPoint = (current: number[], previous: number[], next: number[], reverse?: boolean) => {
    const p = previous || current;
    const n = next || current;
    const smoothing = 0.2;
    
    const lengthX = n[0] - p[0];
    const lengthY = n[1] - p[1];
    
    const o = {
        length: Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)),
        angle: Math.atan2(lengthY, lengthX)
    };

    const angle = o.angle + (reverse ? Math.PI : 0);
    const length = o.length * smoothing;
    
    const x = current[0] + Math.cos(angle) * length;
    const y = current[1] + Math.sin(angle) * length;
    
    return [x, y];
  };

  const createSmoothPath = (points: number[][]) => {
    const d = points.reduce((acc, point, i, a) => {
        if (i === 0) return `M ${point[0]},${point[1]}`;
        
        const [cpsX, cpsY] = getControlPoint(a[i - 1], a[i - 2], point);
        const [cpeX, cpeY] = getControlPoint(point, a[i - 1], a[i + 1], true);
        
        return `${acc} C ${cpsX},${cpsY} ${cpeX},${cpeY} ${point[0]},${point[1]}`;
    }, "");
    return d;
  };

  const linePath = createSmoothPath(points);
  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

  return (
    <div className="h-full rounded-lg border bg-slate-950 border-slate-800 text-slate-100 shadow-xl p-6">
      <div className="flex justify-between items-end mb-6">
        <h3 className="text-lg font-medium text-slate-100">{title}</h3>
        <div className="text-right">
            <span className="text-2xl font-bold text-blue-500">{data[data.length - 1]?.value}</span>
            <span className="text-sm text-slate-500 ml-1">{unit}</span>
        </div>
      </div>
      
      <div className="relative w-full mb-8" style={{ height: "240px" }}>
        
        <svg 
            viewBox={`0 0 ${width} ${height}`} 
            preserveAspectRatio="none" 
            className="w-full h-full overflow-visible"
        >
            <path d={areaPath} className="fill-blue-500/10" />
            <path 
                d={linePath} 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                className="text-blue-500"
            />
        </svg>

        <div className="absolute top-full left-0 w-full mt-3 h-6">
            {data.map((d, i) => {
                if (!d.label) return null;
                
                return (
                    <span 
                        key={i} 
                        className="absolute text-xs text-slate-500 font-medium transform -translate-x-1/2 whitespace-nowrap"
                        style={{ left: `${getX(i)}%` }}
                    >
                        {d.label}
                    </span>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default SimpleChart;