import { Container, Row, Col, Card, Badge, ListGroup } from "react-bootstrap";
import { Zap, DollarSign, AlertTriangle, TrendingUp } from "lucide-react";
import MetricCard from "@/components/Dashboard/MetricCard";
import SimpleChart from "@/components/Dashboard/SimpleChart";
import { getTotalConsumption, getTotalMonthlyCost, getActiveAlerts, socketsData } from "@/data/mockData";

const DashboardOverview = () => {
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
        <Col md={6} lg={3}>
          <MetricCard
            title="Total Power Consumption"
            value={`${totalPower}W`}
            subtitle="Current usage across all sockets"
            icon={Zap}
            variant="primary"
            trend={{ value: "12% vs yesterday", isPositive: false }}
          />
        </Col>
        <Col md={6} lg={3}>
          <MetricCard
            title="Estimated Monthly Cost"
            value={`$${totalCost.toFixed(2)}`}
            subtitle="Based on current usage"
            icon={DollarSign}
            variant="success"
          />
        </Col>
        <Col md={6} lg={3}>
          <MetricCard
            title="Active Alerts"
            value={activeAlerts.length}
            subtitle="Requiring attention"
            icon={AlertTriangle}
            variant={activeAlerts.length > 0 ? "warning" : "success"}
          />
        </Col>
        <Col md={6} lg={3}>
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
        <Col lg={8}>
          <SimpleChart title="Real-time Power Consumption by Device" data={chartData} unit="W" />
        </Col>
        <Col lg={4}>
          <Card bg="dark" text="white" className="border-secondary h-100">
            <Card.Body>
              <Card.Title className="mb-3 d-flex align-items-center gap-2">
                <AlertTriangle className="text-warning" size={24} />
                Active Alerts
              </Card.Title>
              {activeAlerts.length === 0 ? (
                <p className="text-muted text-center py-4">No active alerts. All systems normal.</p>
              ) : (
                <ListGroup variant="flush">
                  {activeAlerts.map((alert) => (
                    <ListGroup.Item
                      key={alert.id}
                      className="bg-transparent border-secondary text-white px-0"
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <Badge
                            bg={alert.type === "critical" ? "danger" : "warning"}
                            className="mb-2"
                          >
                            {alert.type.toUpperCase()}
                          </Badge>
                          <h6 className="mb-1">{alert.title}</h6>
                          <small className="text-muted">{alert.message}</small>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col lg={6}>
          <Card bg="dark" text="white" className="border-secondary">
            <Card.Body>
              <Card.Title className="mb-3">Key Insights</Card.Title>
              <ListGroup variant="flush">
                <ListGroup.Item className="bg-transparent border-secondary text-white">
                  <div className="d-flex gap-3 align-items-start">
                    <div className="text-success">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <strong>Energy Savings Opportunity</strong>
                      <p className="mb-0 small text-muted mt-1">
                        Your Gaming Console is wasting $0.86/month in standby mode. Consider using
                        auto-shutdown.
                      </p>
                    </div>
                  </div>
                </ListGroup.Item>
                <ListGroup.Item className="bg-transparent border-secondary text-white">
                  <div className="d-flex gap-3 align-items-start">
                    <div className="text-primary">
                      <Zap size={20} />
                    </div>
                    <div>
                      <strong>Peak Usage Pattern</strong>
                      <p className="mb-0 small text-muted mt-1">
                        Highest consumption occurs between 7-10 PM. Average: 245W during this period.
                      </p>
                    </div>
                  </div>
                </ListGroup.Item>
                <ListGroup.Item className="bg-transparent border-secondary text-white">
                  <div className="d-flex gap-3 align-items-start">
                    <div className="text-warning">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <strong>Safety Check</strong>
                      <p className="mb-0 small text-muted mt-1">
                        Socket 4 temperature elevated. Monitor for overheating risks.
                      </p>
                    </div>
                  </div>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6}>
          <Card bg="dark" text="white" className="border-secondary">
            <Card.Body>
              <Card.Title className="mb-3">Energy Cost Breakdown</Card.Title>
              <div className="mb-3">
                {socketsData.map((socket) => {
                  const percentage = (socket.monthlyCost / totalCost) * 100;
                  return (
                    <div key={socket.id} className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <small>{socket.name}</small>
                        <small className="text-muted">${socket.monthlyCost.toFixed(2)}/mo</small>
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
                  <strong className="text-primary">${totalCost.toFixed(2)}</strong>
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
