import { useMemo, useState } from "react";
import { Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import { Edit2, Save, Zap } from "lucide-react";
import { toast } from "sonner";
import { usePowerStrip } from "@/context/PowerStripContext";

const DeviceMonitoring = () => {
  const { sockets, toggleSocket, renameSocket, currentAlert } = usePowerStrip();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftName, setDraftName] = useState("");

  const visibleSockets = useMemo(() => sockets.slice(0, 3), [sockets]);

  const startEditing = (socketId: number, name: string) => {
    setEditingId(socketId);
    setDraftName(name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setDraftName("");
  };

  const saveName = (socketId: number) => {
    const trimmed = draftName.trim();
    if (!trimmed) {
      toast.error("Device name cannot be empty");
      return;
    }
    renameSocket(socketId, trimmed);
    toast.success("Device name updated");
    cancelEditing();
  };

  const handleToggle = (socketId: number, name: string) => {
    if (currentAlert?.socketId === socketId) {
      toast.error(`${name} is forced off due to an active alert`);
      return;
    }
    toggleSocket(socketId);
  };

  return (
    <Container fluid>
      <div className="mb-4">
        <h1 className="text-white fw-bold mb-2">Device Monitoring</h1>
        <p className="text-muted">Control each outlet with live power readings</p>
      </div>

      <Row className="g-4">
        {visibleSockets.map((socket) => {
          const isEditing = editingId === socket.id;
          const isAlerted = currentAlert?.socketId === socket.id;
          return (
            <Col key={socket.id} md={6} lg={4}>
              <Card bg="dark" text="white" className="h-100 border-secondary">
                <Card.Body className="d-flex flex-column gap-3">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div className="flex-grow-1">
                      <div className="text-muted small">Outlet {socket.id}</div>
                      {isEditing ? (
                        <Form.Control
                          value={draftName}
                          onChange={(event) => setDraftName(event.target.value)}
                          size="sm"
                          className="bg-secondary border-secondary text-white mt-1"
                        />
                      ) : (
                        <div className="fw-bold mt-1">{socket.name}</div>
                      )}
                    </div>
                    {isEditing ? (
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => saveName(socket.id)}
                      >
                        <Save size={14} className="me-1" />
                        Save
                      </Button>
                    ) : (
                      <Button
                        variant="outline-light"
                        size="sm"
                        onClick={() => startEditing(socket.id, socket.name)}
                      >
                        <Edit2 size={14} className="me-1" />
                        Edit
                      </Button>
                    )}
                  </div>

                  {isEditing && (
                    <div className="d-flex justify-content-end">
                      <Button variant="link" size="sm" className="text-muted" onClick={cancelEditing}>
                        Cancel
                      </Button>
                    </div>
                  )}

                  <div>
                    <div className="d-flex align-items-center gap-2 text-muted small mb-1">
                      <Zap size={14} />
                      Current Wattage
                    </div>
                    <div className="display-6 fw-bold text-primary">{socket.currentPower}W</div>
                    {isAlerted && (
                      <div className="text-warning small mt-1">Alert active - outlet forced off</div>
                    )}
                  </div>

                  <div className="mt-auto d-flex align-items-center justify-content-between">
                    <span className="text-muted small">Power</span>
                    <Form.Check
                      type="switch"
                      id={`socket-${socket.id}-toggle`}
                      checked={socket.status === "on"}
                      onChange={() => handleToggle(socket.id, socket.name)}
                      disabled={isAlerted}
                      className="text-white"
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </Container>
  );
};

export default DeviceMonitoring;
