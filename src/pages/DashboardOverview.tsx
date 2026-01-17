import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Badge, ListGroup } from "react-bootstrap";
import { Zap, DollarSign, AlertTriangle, TrendingUp } from "lucide-react";
import MetricCard from "@/components/Dashboard/MetricCard";
import SimpleChart from "@/components/Dashboard/SimpleChart";
import { getTotalConsumption, getTotalMonthlyCost, getActiveAlerts, socketsData } from "@/data/mockData";

const DashboardOverview = () => {
  const [currency, setCurrency] = useState("€");
  useEffect(() => {
    // 3. Récupération de la monnaie stockée par la page paramètres
    const savedCurrency = localStorage.getItem("app_currency");
    if (savedCurrency) {
      setCurrency(savedCurrency);
    }
  }, []);

  const totalPower = getTotalConsumption();
  const totalCost = getTotalMonthlyCost();
  const activeAlerts = getActiveAlerts();

  const chartData = socketsData.map((socket) => ({
    label: socket.name.split(" ")[0],
    value: socket.currentPower,
  }));

  return (
    <Container fluid>
      <div className="mb-4">
        <h1 className="text-white fw-bold mb-2">Dashboard Overview</h1>
        <p className="text-muted">Real-time energy monitoring and insights for your smart power strip</p>
      </div>

      <Row className="g-4 mb-4">
        <Col md={6} lg={4}>
          <MetricCard
            title="Total Power Consumption"
            value={`${totalPower}W`}
            subtitle="Current usage across all sockets"
            icon={Zap}
            variant="primary"
            trend={{ value: "12% vs yesterday", isPositive: false }}
          />
        </Col>
        <Col md={6} lg={4}>
          <MetricCard
            title="Estimated Monthly Cost"
            value={`${totalCost.toFixed(2)} ${currency}`}
            subtitle="Based on current usage"
            icon={DollarSign}
            variant="success"
          />
        </Col>

        <Col md={6} lg={4}>
          <MetricCard
            title="Efficiency Score"
            value="78%"
            subtitle="Good energy management"
            icon={TrendingUp}
            variant="success"
            trend={{ value: "5% improvement", isPositive: true }}
          />
        </Col>
      </Row>

      <Row className="g-4 mb-4">
        <Col lg={12}>
          <SimpleChart title="Real-time Power Consumption by Device" data={chartData} unit="W" />
        </Col>
      </Row>

      <Row className="g-4">

        <Col lg={6}>
          <Card bg="dark" text="white" className="border-secondary">
            <Card.Body>
              <Card.Title className="mb-3">Most costly devices</Card.Title>
              <div className="mb-3">
                {socketsData.map((socket) => {
                  const percentage = (socket.monthlyCost / totalCost) * 100;
                  return (
                    <div key={socket.id} className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <small>{socket.name}</small>
                        <small className="text-muted">${currency}{socket.monthlyCost.toFixed(2)}/mo</small>
                      </div>
                      <div className="progress" style={{ height: "8px" }}>
                        <div
                          className="progress-bar bg-primary"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-top border-secondary pt-3 mt-3">
                <div className="d-flex justify-content-between">
                  <strong>Total Monthly Cost</strong>
                  <strong className="text-primary">{currency}{totalCost.toFixed(2)}</strong>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DashboardOverview;
