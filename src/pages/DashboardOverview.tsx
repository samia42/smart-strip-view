import { Alert, Badge, Card, Col, Container, ListGroup, Row } from "react-bootstrap";
import { DollarSign, Zap } from "lucide-react";
import MetricCard from "@/components/Dashboard/MetricCard";
import ConsumptionChart from "@/components/Dashboard/ConsumptionChart";
import { usePowerStrip } from "@/context/PowerStripContext";

const DashboardOverview = () => {
  const {
    getTotalConsumption,
    getTotalCost,
    getConsumptionSeries,
    getTopConsumers,
    getCurrencySymbol,
    currentAlert,
    costConfig,
  } = usePowerStrip();
  const totalPower = getTotalConsumption();
  const totalCost = getTotalCost();
  const currencySymbol = getCurrencySymbol();
  const topConsumers = getTopConsumers(3);

  const chartSeries = getConsumptionSeries("all", "last_day");
  const chartData = chartSeries.map((point) => {
    const date = new Date(point.timestamp);
    return {
      label: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      value: point.value,
    };
  });

  return (
    <Container fluid>
      {currentAlert && (
        <Alert
          variant={currentAlert.type === "critical" ? "danger" : "warning"}
          className="mb-4"
        >
          <div className="d-flex justify-content-between align-items-start gap-3">
            <div>
              <div className="fw-bold">{currentAlert.title}</div>
              <div className="small">{currentAlert.message}</div>
            </div>
            <Badge bg={currentAlert.type === "critical" ? "danger" : "warning"}>
              {currentAlert.type.toUpperCase()}
            </Badge>
          </div>
        </Alert>
      )}

      <div className="mb-4">
        <h1 className="text-white fw-bold mb-2">Overview</h1>
        <p className="text-muted">Real-time energy monitoring for your smart power strip</p>
      </div>

      <Row className="g-4 mb-4">
        <Col md={6} lg={4}>
          <MetricCard
            title="Total SmartPowerStrip Consumption"
            value={`${totalPower}W`}
            subtitle="Current usage across all outlets"
            icon={Zap}
            variant="primary"
          />
        </Col>
        <Col md={6} lg={4}>
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
          <ConsumptionChart title="Total Consumption (Last 24 Hours)" data={chartData} unit="W" />
        </Col>
        <Col lg={4}>
          <Card bg="dark" text="white" className="border-secondary h-100">
            <Card.Body>
              <Card.Title className="mb-3">Top Consuming Devices</Card.Title>
              <ListGroup variant="flush">
                {topConsumers.map((socket) => {
                  const estimatedCost = socket.monthlyConsumption * costConfig.rate;
                  return (
                    <ListGroup.Item
                      key={socket.id}
                      className="bg-transparent border-secondary text-white px-0"
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="fw-bold">{socket.name}</div>
                          <small className="text-muted">
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
