import { Card, Col, Container, ListGroup, Row, Badge } from "react-bootstrap";
import { DollarSign, Zap } from "lucide-react";
import { useState } from "react";
import MetricCard from "@/components/Dashboard/MetricCard";
import ConsumptionChart from "@/components/Dashboard/ConsumptionChart";
import { usePowerStrip } from "@/context/PowerStripContext";
import { TimeRange } from "@/data/powerRetention";

const DashboardOverview = () => {
  const {
    getTotalConsumption,
    getTotalCost,
    getConsumptionSeries,
    getTopConsumers,
    getCurrencySymbol,
    costConfig,
    wsConnected,
    liveData,
  } = usePowerStrip();
  const totalPower = getTotalConsumption();
  const totalCost = getTotalCost();
  const currencySymbol = getCurrencySymbol();
  const topConsumers = getTopConsumers(3);

  const [overviewRangeKey, setOverviewRangeKey] = useState("graph_24h");
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

  const chartSeries = getConsumptionSeries(
    "all",
    mapGraphRange(overviewRangeKey)
  );
  const chartData = chartSeries.map((point) => {
    const date = new Date(point.timestamp);
    return {
      label: date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      value: point.value,
    };
  });
  const overviewRangeOptions = [
    { value: "graph_60min", label: "Last 60 min" },
    { value: "graph_24h", label: "Last 24 hours" },
    { value: "graph_30d", label: "Last 30 days" },
    { value: "graph_months", label: "Last 12 months" },
  ];

  return (
    <Container fluid>
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h1 className="text-white fw-bold mb-2 mt-4">Overview</h1>
          <p className="text-slate-400">
            Real-time energy monitoring for your smart power strip
          </p>
        </div>
        <Badge bg={wsConnected ? "success" : "secondary"} className="px-3 py-2">
          {wsConnected ? "Live" : "Offline"}
        </Badge>
      </div>

      <Row className="g-4 mb-4">
        <Col md={6} lg={6}>
          <MetricCard
            title="Total SmartPowerStrip Consumption"
            value={`${totalPower}W`}
            subtitle="Current usage across all outlets"
            icon={Zap}
            variant="primary"
          />
        </Col>
        <Col md={6} lg={6}>
          <MetricCard
            title="Total Price"
            value={`${currencySymbol}${totalCost.toFixed(2)}`}
            subtitle="Estimated cost for the last 30 days"
            icon={DollarSign}
            variant="success"
          />
        </Col>
      </Row>

      <Row className="g-4">
        <Col lg={8}>
          <ConsumptionChart
            title="Total Consumption (Last 24 Hours)"
            data={chartData}
            unit="W"
            rangeValue={overviewRangeKey}
            rangeOptions={overviewRangeOptions}
            onRangeChange={setOverviewRangeKey}
          />
        </Col>
        <Col lg={4}>
          <Card className="h-100 border-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-[0_30px_80px_rgba(15,23,42,0.55)]">
            <Card.Body>
              <Card.Title className="mb-3 text-white">Top Consuming Devices</Card.Title>
              <ListGroup variant="flush">
                {topConsumers.map((socket) => {
                  const estimatedCost =
                    socket.monthlyConsumption * costConfig.rate;
                  return (
                    <ListGroup.Item
                      key={socket.id}
                      className="bg-transparent border-slate-800 text-white px-0"
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="fw-bold">{socket.name}</div>
                          <small className="text-slate-400">
                            {socket.monthlyConsumption.toFixed(1)} kWh / month
                          </small>
                        </div>
                        <div className="text-primary fw-bold">
                          {currencySymbol}
                          {estimatedCost.toFixed(2)}
                        </div>
                      </div>
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DashboardOverview;
