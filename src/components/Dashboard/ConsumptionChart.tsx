import { Card, Form } from "react-bootstrap";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ConsumptionPoint {
  label: string;
  value: number;
}

interface ConsumptionChartProps {
  title: string;
  data: ConsumptionPoint[];
  unit?: string;
  rangeValue?: string;
  rangeOptions?: { value: string; label: string }[];
  onRangeChange?: (value: string) => void;
}

const ConsumptionChart = ({
  title,
  data,
  unit = "W",
  rangeValue,
  rangeOptions,
  onRangeChange,
}: ConsumptionChartProps) => {
  return (
    <Card className="h-100 border-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-[0_30px_80px_rgba(15,23,42,0.55)]">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <Card.Title className="mb-0 text-white">{title}</Card.Title>
          {rangeOptions && rangeOptions.length > 0 && (
            <Form.Select
              value={rangeValue}
              onChange={(event) => onRangeChange?.(event.target.value)}
              className="bg-slate-900 border-slate-700 text-white"
              style={{ maxWidth: "200px" }}
            >
              {rangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
          )}
        </div>
        <div className="px-2" style={{ height: "280px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 12, right: 16, left: 4, bottom: 8 }}>
              <XAxis
                dataKey="label"
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                axisLine={{ stroke: "#334155" }}
                tickLine={{ stroke: "#334155" }}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                axisLine={{ stroke: "#334155" }}
                tickLine={{ stroke: "#334155" }}
                width={40}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}
                itemStyle={{ color: "#e2e8f0" }}
                labelStyle={{ color: "#94a3b8" }}
                formatter={(value: number) => [`${value}${unit}`, "Consumption"]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ConsumptionChart;
