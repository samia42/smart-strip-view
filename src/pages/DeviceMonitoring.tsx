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


    </Container>
  );
};

export default DeviceMonitoring;
