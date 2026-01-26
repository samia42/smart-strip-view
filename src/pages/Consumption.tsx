import { useMemo, useState } from "react";
import { Card, Col, Container, Form, Row } from "react-bootstrap";
import ConsumptionChart from "@/components/Dashboard/ConsumptionChart";
import { usePowerStrip } from "@/context/PowerStripContext";
import { TimeRange } from "@/data/powerRetention";

const graphRanges = [
  { value: "graph_60min", label: "Last 60 min" },
  { value: "graph_24h", label: "Last 24 hours" },
  { value: "graph_30d", label: "Last 30 days" },
  { value: "graph_months", label: "Last 12 months" },
];

const mapGraphRange = (rangeKey: string): TimeRange => {
  switch (rangeKey) {
    case "graph_60min":
      return "last_hour";
    case "graph_24h":
      return "last_day";
    case "graph_30d":
      return "last_month";
    case "graph_months":
      return "last_year";
    default:
      return "last_day";
  }
};

const Consumption = () => {
  const { sockets, getConsumptionSeries } = usePowerStrip();
  const [selectedOutlet, setSelectedOutlet] = useState<number | "all">("all");
  const [rangeKey, setRangeKey] = useState("graph_24h");

  const outletOptions = useMemo(() => {
    return [
      { value: "all", label: "All outlets" },
      ...sockets.slice(0, 3).map((socket) => ({
        value: socket.id.toString(),
        label: `Outlet ${socket.id}`,
      })),
    ];
  }, [sockets]);

  const range = mapGraphRange(rangeKey);
  const series = getConsumptionSeries(selectedOutlet, range);
  const chartData = series.map((point) => {
    const date = new Date(point.timestamp);
    let label = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (range === "last_week" || range === "last_month") {
      label = date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
    if (range === "last_year") {
      label = date.toLocaleDateString([], { month: "short" });
    }
    return { label, value: point.value };
  });

  return (
    <Container fluid>
      <div className="mb-4">
        <h1 className="text-white fw-bold mb-2 mt-4">Consumption</h1>
        <p className="text-slate-400">
          Explore power usage across outlets and time ranges
        </p>
      </div>

      <Card className="border-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-[0_30px_80px_rgba(15,23,42,0.55)] mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={6} lg={4}>
              <Form.Group>
                <Form.Label className="text-white">Outlet</Form.Label>
                <Form.Select
                  value={
                    selectedOutlet === "all" ? "all" : selectedOutlet.toString()
                  }
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedOutlet(value === "all" ? "all" : Number(value));
                  }}
                  className="bg-slate-900 border-slate-700 text-white"
                >
                  {outletOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6} lg={4}>
              <Form.Group>
                <Form.Label className="text-white">Time Range</Form.Label>
                <Form.Select
                  value={rangeKey}
                  onChange={(event) => setRangeKey(event.target.value)}
                  className="bg-slate-900 border-slate-700 text-white"
                >
                  {graphRanges.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <ConsumptionChart
        title="Consumption Over Time"
        data={chartData}
        unit="W"
      />
    </Container>
  );
};

export default Consumption;
