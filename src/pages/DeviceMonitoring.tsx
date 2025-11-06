import { useState } from "react";
import { Container, Row, Col, Card, Badge, Button, Table } from "react-bootstrap";
import { Power, Zap, DollarSign, Thermometer, Activity } from "lucide-react";
import { socketsData, SocketData } from "@/data/mockData";
import { toast } from "sonner";

const DeviceMonitoring = () => {
  const [sockets, setSockets] = useState<SocketData[]>(socketsData);

  const toggleSocket = (socketId: number) => {
    setSockets((prev) =>
      prev.map((socket) =>
        socket.id === socketId
          ? { ...socket, status: socket.status === "on" ? "off" : "on" }
          : socket
      )
    );
    toast.success(`Socket ${socketId} turned ${sockets.find(s => s.id === socketId)?.status === "on" ? "off" : "on"}`);
  };

  const getStatusBadge = (status: string) => {
    return status === "on" ? (
      <Badge bg="success" className="d-flex align-items-center gap-1">
        <Power size={12} /> ON
      </Badge>
    ) : (
      <Badge bg="secondary" className="d-flex align-items-center gap-1">
        <Power size={12} /> OFF
      </Badge>
    );
  };

  const getSafetyBadge = (status: string) => {
    const variants: Record<string, string> = {
      normal: "success",
      warning: "warning",
      critical: "danger",
    };
    return (
      <Badge bg={variants[status]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Container fluid>
      <div className="mb-4">
        <h1 className="text-white fw-bold mb-2">Device Monitoring</h1>
        <p className="text-muted">Monitor and control individual socket consumption and status</p>
      </div>

      <Row className="g-4 mb-4">
        {sockets.map((socket) => (
          <Col key={socket.id} md={6} lg={3}>
            <Card bg="dark" text="white" className="h-100 border-secondary">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <small className="text-muted">Socket {socket.id}</small>
                    <Card.Title className="h5 mb-1">{socket.name}</Card.Title>
                    <small className="text-muted">{socket.deviceType}</small>
                  </div>
                  {getStatusBadge(socket.status)}
                </div>

                <div className="mb-3">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Zap size={16} className="text-primary" />
                    <span className="small text-muted">Current Power</span>
                  </div>
                  <div className="display-6 text-primary fw-bold">{socket.currentPower}W</div>
                </div>

                <div className="mb-3 small">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Daily Cost</span>
                    <span className="fw-bold">${socket.dailyCost.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Monthly Cost</span>
                    <span className="fw-bold">${socket.monthlyCost.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Temperature</span>
                    <span className={socket.temperature > 50 ? "text-danger fw-bold" : ""}>
                      {socket.temperature}°C
                    </span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Safety Status</span>
                    {getSafetyBadge(socket.safetyStatus)}
                  </div>
                </div>

                <Button
                  variant={socket.status === "on" ? "outline-danger" : "outline-success"}
                  size="sm"
                  className="w-100"
                  onClick={() => toggleSocket(socket.id)}
                >
                  <Power size={16} className="me-2" />
                  Turn {socket.status === "on" ? "Off" : "On"}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Row className="g-4">
        <Col>
          <Card bg="dark" text="white" className="border-secondary">
            <Card.Body>
              <Card.Title className="mb-4">Detailed Socket Information</Card.Title>
              <Table striped bordered hover variant="dark" responsive>
                <thead>
                  <tr>
                    <th>Socket</th>
                    <th>Device Name</th>
                    <th>Status</th>
                    <th>Current Power</th>
                    <th>Daily kWh</th>
                    <th>Monthly kWh</th>
                    <th>Monthly Cost</th>
                    <th>Temperature</th>
                    <th>Safety</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sockets.map((socket) => (
                    <tr key={socket.id}>
                      <td className="fw-bold">#{socket.id}</td>
                      <td>{socket.name}</td>
                      <td>{getStatusBadge(socket.status)}</td>
                      <td className="text-primary fw-bold">{socket.currentPower}W</td>
                      <td>{socket.dailyConsumption.toFixed(2)}</td>
                      <td>{socket.monthlyConsumption.toFixed(2)}</td>
                      <td className="fw-bold">${socket.monthlyCost.toFixed(2)}</td>
                      <td className={socket.temperature > 50 ? "text-danger fw-bold" : ""}>
                        {socket.temperature}°C
                      </td>
                      <td>{getSafetyBadge(socket.safetyStatus)}</td>
                      <td>
                        <Button
                          variant={socket.status === "on" ? "outline-danger" : "outline-success"}
                          size="sm"
                          onClick={() => toggleSocket(socket.id)}
                        >
                          {socket.status === "on" ? "Off" : "On"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mt-2">
        <Col lg={6}>
          <Card bg="dark" text="white" className="border-secondary">
            <Card.Body>
              <Card.Title className="mb-4">
                <Activity className="text-primary me-2" size={24} />
                Wasted Standby Power
              </Card.Title>
              <p className="text-muted mb-3">
                Devices consuming power while not in active use
              </p>
              {sockets
                .filter((s) => s.status === "on" && s.currentPower > 0 && s.currentPower < 20)
                .map((socket) => (
                  <div key={socket.id} className="border-bottom border-secondary pb-3 mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{socket.name}</strong>
                        <p className="mb-0 small text-muted">
                          Wasting {socket.currentPower}W in standby
                        </p>
                      </div>
                      <div className="text-end">
                        <div className="text-warning fw-bold">${socket.monthlyCost.toFixed(2)}/mo</div>
                        <small className="text-muted">wasted cost</small>
                      </div>
                    </div>
                  </div>
                ))}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6}>
          <Card bg="dark" text="white" className="border-secondary">
            <Card.Body>
              <Card.Title className="mb-4">
                <Thermometer className="text-danger me-2" size={24} />
                Temperature Monitoring
              </Card.Title>
              <p className="text-muted mb-3">
                Real-time temperature readings for fire risk detection
              </p>
              {sockets.map((socket) => (
                <div key={socket.id} className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <small>{socket.name}</small>
                    <small className={socket.temperature > 50 ? "text-danger fw-bold" : "text-muted"}>
                      {socket.temperature}°C
                    </small>
                  </div>
                  <div className="progress" style={{ height: "8px" }}>
                    <div
                      className={`progress-bar ${
                        socket.temperature > 50 ? "bg-danger" : socket.temperature > 40 ? "bg-warning" : "bg-success"
                      }`}
                      style={{ width: `${(socket.temperature / 70) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DeviceMonitoring;
