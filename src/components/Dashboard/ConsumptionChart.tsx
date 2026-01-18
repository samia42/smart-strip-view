import { Card } from "react-bootstrap";
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
}

const ConsumptionChart = ({ title, data, unit = "W" }: ConsumptionChartProps) => {
  return (
    <Card bg="dark" text="white" className="border-secondary h-100">
      <Card.Body>
        <Card.Title className="mb-4">{title}</Card.Title>
        <div style={{ height: "280px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
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
