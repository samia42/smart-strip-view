import { Card, Form } from "react-bootstrap";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ConsumptionChartProps {
  title: string;
  data: { label: string; value: number }[];
  unit: string;
  rangeValue?: string;
  rangeOptions?: { value: string; label: string }[];
  onRangeChange?: (value: string) => void;
  hideControls?: boolean;
}

const ConsumptionChart = ({
  title,
  data,
  unit,
  rangeValue,
  rangeOptions,
  onRangeChange,
  hideControls = false,
}: ConsumptionChartProps) => {

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.95)",
            border: "1px solid rgba(51, 65, 85, 0.5)",
            padding: "12px",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.5)",
            color: "#fff",
          }}
        >
          <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#94a3b8" }}>
            {label}
          </p>
          <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold", color: "#60a5fa" }}>
            {typeof value === "number" ? value.toFixed(6) : value} {unit}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-100 rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-[0_30px_80px_rgba(15,23,42,0.55)]">
      <Card.Body className="p-4 d-flex flex-column h-100">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <Card.Title className="text-white mb-0">{title}</Card.Title>

          {!hideControls && rangeOptions && rangeOptions.length > 0 && (
            <Form.Select
              size="sm"
              value={rangeValue}
              onChange={(e) => {
                onRangeChange && onRangeChange(e.target.value);
              }}
              className="bg-slate-900 border-slate-700 text-white w-auto shadow-sm"
              style={{ minWidth: "140px", cursor: "pointer" }}
            >
              {rangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
          )}
        </div>

        <div style={{ flex: 1, minHeight: "400px", width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#334155"
              />
              <XAxis
                dataKey="label"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                minTickGap={30}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => val.toFixed(3)}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#475569", strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorValue)"
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ConsumptionChart;