import { useMemo, useState } from "react";
import { Card, Col, Container, Form, Row } from "react-bootstrap";
import ConsumptionChart from "@/components/Dashboard/ConsumptionChart";
import { usePowerStrip } from "@/context/PowerStripContext";
import { TimeRange } from "@/data/powerRetention";

const timeRanges: { value: TimeRange; label: string }[] = [
  { value: "last_hour", label: "Last hour" },
  { value: "last_day", label: "Last day" },
  { value: "last_week", label: "Last week" },
  { value: "last_month", label: "Last month" },
  { value: "last_year", label: "Last year" },
];

const Consumption = () => {
  const { sockets, getConsumptionSeries } = usePowerStrip();
  const [selectedOutlet, setSelectedOutlet] = useState<number | "all">("all");
  const [range, setRange] = useState<TimeRange>("last_day");

  const outletOptions = useMemo(() => {
    return [
      { value: "all", label: "All outlets" },
      ...sockets.slice(0, 3).map((socket) => ({
        value: socket.id.toString(),
        label: `Outlet ${socket.id}`,
      })),
    ];
  }, [sockets]);

  const series = getConsumptionSeries(selectedOutlet, range);
  const chartData = series.map((point) => {
    const date = new Date(point.timestamp);
    let label = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
        <h1 className="text-white fw-bold mb-2">Consumption</h1>
        <p className="text-muted">Explore power usage across outlets and time ranges</p>
      </div>

      <Card bg="dark" text="white" className="border-secondary mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={6} lg={4}>
              <Form.Group>
                <Form.Label>Outlet</Form.Label>
                <Form.Select
                  value={selectedOutlet === "all" ? "all" : selectedOutlet.toString()}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedOutlet(value === "all" ? "all" : Number(value));
                  }}
                  className="bg-secondary border-secondary text-white"
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
                <Form.Label>Time Range</Form.Label>
                <Form.Select
                  value={range}
                  onChange={(event) => setRange(event.target.value as TimeRange)}
                  className="bg-secondary border-secondary text-white"
                >
                  {timeRanges.map((option) => (
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

      <ConsumptionChart title="Consumption Over Time" data={chartData} unit="W" />
    </Container>
  );
};

export default Consumption;
