import { useMemo, useState } from "react";
import { Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import { Edit2, Save, Zap } from "lucide-react";
import { toast } from "sonner";
import { usePowerStrip } from "@/context/PowerStripContext";

const DeviceMonitoring = () => {
  const { sockets, liveData, toggleSocket, renameSocket } = usePowerStrip();
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

  const handleToggle = (socketId: number) => {
    toggleSocket(socketId);
  };

  return (
    <Container fluid>
      <div className="mb-4">
        <h1 className="text-white fw-bold mb-2 mt-4">Device Monitoring</h1>
        <p className="text-slate-400">
          Control each outlet with live power readings
        </p>
      </div>

      <Row className="g-4">
        {visibleSockets.map((socket) => {
          const isEditing = editingId === socket.id;
          return (
            <Col key={socket.id} md={6} lg={4}>
              <Card className="h-100 border-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-[0_30px_80px_rgba(15,23,42,0.55)]">
                <Card.Body className="d-flex flex-column gap-3">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div className="flex-grow-1">
                      <div className="text-slate-400 small">
                        Outlet {socket.id}
                      </div>
                      {isEditing ? (
                        <Form.Control
                          value={draftName}
                          onChange={(event) => setDraftName(event.target.value)}
                          size="sm"
                          className="bg-slate-900 border-slate-700 text-white mt-1"
                        />
                      ) : (
                        <div className="fw-bold mt-1 text-white">
                          {socket.name}
                        </div>
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
                      <Button
                        variant="link"
                        size="sm"
                        className="text-slate-400"
                        onClick={cancelEditing}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  <div>
                    <div className="d-flex align-items-center gap-2 text-slate-400 small mb-1">
                      <Zap size={14} />
                      Current Wattage
                    </div>
                    <div className="display-6 fw-bold text-primary">
                      {socket.id === 1
                        ? liveData.live.toFixed(2)
                        : socket.currentPower}{" "}
                      Wh
                    </div>
                  </div>

                  <div className="mt-auto d-flex align-items-center justify-content-between">
                    <span className="text-slate-400 small">Power</span>
                    <Form.Check
                      type="switch"
                      id={`socket-${socket.id}-toggle`}
                      checked={socket.status === "on"}
                      onChange={() => handleToggle(socket.id)}
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
