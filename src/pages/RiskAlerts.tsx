import { Container, Row, Col, Card, Badge, ListGroup, Button } from "react-bootstrap";
import { AlertTriangle, CheckCircle, Info, XCircle, Clock } from "lucide-react";
import { alertsData, AlertData } from "@/data/mockData";
import { useState } from "react";
import { toast } from "sonner";

const RiskAlerts = () => {
  const [alerts, setAlerts] = useState<AlertData[]>(alertsData);

  const resolveAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) => (alert.id === alertId ? { ...alert, resolved: true } : alert))
    );
    toast.success("Alert marked as resolved");
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <XCircle className="text-danger" size={20} />;
      case "warning":
        return <AlertTriangle className="text-warning" size={20} />;
      case "info":
        return <Info className="text-primary" size={20} />;
      default:
        return <Info className="text-primary" size={20} />;
    }
  };

  const getAlertBadge = (type: string) => {
    const variants: Record<string, string> = {
      critical: "danger",
      warning: "warning",
      info: "info",
    };
    return <Badge bg={variants[type]}>{type.toUpperCase()}</Badge>;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return date.toLocaleDateString();
  };

  const activeAlerts = alerts.filter((a) => !a.resolved);
  const resolvedAlerts = alerts.filter((a) => a.resolved);
  const criticalCount = activeAlerts.filter((a) => a.type === "critical").length;
  const warningCount = activeAlerts.filter((a) => a.type === "warning").length;

  return (
    <Container fluid>
      <div className="mb-4">
        <h1 className="text-white fw-bold mb-2">Risk & Alerts</h1>
        <p className="text-muted">Monitor safety status and electrical anomalies</p>
      </div>

      <Row className="g-4 mb-4">
        <Col md={4}>
          <Card bg="dark" text="white" className="border-danger h-100">
            <Card.Body className="text-center">
              <XCircle className="text-danger mb-3" size={48} />
              <h2 className="display-4 fw-bold text-danger mb-2">{criticalCount}</h2>
              <p className="text-muted mb-0">Critical Alerts</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card bg="dark" text="white" className="border-warning h-100">
            <Card.Body className="text-center">
              <AlertTriangle className="text-warning mb-3" size={48} />
              <h2 className="display-4 fw-bold text-warning mb-2">{warningCount}</h2>
              <p className="text-muted mb-0">Warning Alerts</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card bg="dark" text="white" className="border-success h-100">
            <Card.Body className="text-center">
              <CheckCircle className="text-success mb-3" size={48} />
              <h2 className="display-4 fw-bold text-success mb-2">{resolvedAlerts.length}</h2>
              <p className="text-muted mb-0">Resolved Today</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col lg={8}>
          <Card bg="dark" text="white" className="border-secondary">
            <Card.Body>
              <Card.Title className="mb-4">Active Alerts</Card.Title>
              {activeAlerts.length === 0 ? (
                <div className="text-center py-5">
                  <CheckCircle className="text-success mb-3" size={64} />
                  <h4 className="text-success">All Clear!</h4>
                  <p className="text-muted">No active alerts. All systems operating normally.</p>
                </div>
              ) : (
                <ListGroup variant="flush">
                  {activeAlerts.map((alert) => (
                    <ListGroup.Item
                      key={alert.id}
                      className="bg-transparent border-secondary text-white px-0"
                    >
                      <div className="d-flex gap-3">
                        <div className="mt-1">{getAlertIcon(alert.type)}</div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              {getAlertBadge(alert.type)}
                              <span className="text-muted ms-2 small">Socket {alert.socketId}</span>
                            </div>
                            <div className="d-flex align-items-center gap-2 text-muted small">
                              <Clock size={14} />
                              {formatTimestamp(alert.timestamp)}
                            </div>
                          </div>
                          <h6 className="mb-2">{alert.title}</h6>
                          <p className="mb-3 text-muted small">{alert.message}</p>
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            <CheckCircle size={16} className="me-2" />
                            Mark as Resolved
                          </Button>
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card bg="dark" text="white" className="border-secondary mb-4">
            <Card.Body>
              <Card.Title className="mb-4">Safety Guidelines</Card.Title>
              <ListGroup variant="flush">
                <ListGroup.Item className="bg-transparent border-secondary text-white px-0 py-3">
                  <div className="d-flex align-items-start gap-2">
                    <div className="text-danger">🔥</div>
                    <div className="small">
                      <strong>Critical Alert</strong>
                      <p className="mb-0 text-muted mt-1">
                        Immediately unplug devices showing critical temperature warnings
                      </p>
                    </div>
                  </div>
                </ListGroup.Item>
                <ListGroup.Item className="bg-transparent border-secondary text-white px-0 py-3">
                  <div className="d-flex align-items-start gap-2">
                    <div className="text-warning">⚡</div>
                    <div className="small">
                      <strong>Warning Alert</strong>
                      <p className="mb-0 text-muted mt-1">
                        Monitor devices with elevated temperatures or unusual consumption
                      </p>
                    </div>
                  </div>
                </ListGroup.Item>
                <ListGroup.Item className="bg-transparent border-secondary text-white px-0 py-3">
                  <div className="d-flex align-items-start gap-2">
                    <div className="text-primary">💡</div>
                    <div className="small">
                      <strong>Best Practice</strong>
                      <p className="mb-0 text-muted mt-1">
                        Turn off devices when not in use to prevent standby power waste
                      </p>
                    </div>
                  </div>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>

          <Card bg="dark" text="white" className="border-secondary">
            <Card.Body>
              <Card.Title className="mb-3">Recently Resolved</Card.Title>
              {resolvedAlerts.length === 0 ? (
                <p className="text-muted text-center py-3 small">No resolved alerts</p>
              ) : (
                <ListGroup variant="flush">
                  {resolvedAlerts.map((alert) => (
                    <ListGroup.Item
                      key={alert.id}
                      className="bg-transparent border-secondary text-white px-0"
                    >
                      <div className="d-flex gap-2 align-items-start">
                        <CheckCircle className="text-success mt-1" size={16} />
                        <div className="small">
                          <div className="fw-bold">{alert.title}</div>
                          <div className="text-muted">{formatTimestamp(alert.timestamp)}</div>
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
    </Container>
  );
};

export default RiskAlerts;
