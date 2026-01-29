import { useMemo, useState, useEffect, useRef } from "react";
import { Button, Card, Col, Container, Form, Row, Badge } from "react-bootstrap";
import { Edit2, Save, Zap, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { usePowerStrip } from "@/context/PowerStripContext";

type LiveData = {
  live1: number;
  live2: number;
  live3: number;
  relay: number; 
  relay2: number;
  relay3: number;
};

const DeviceMonitoring = () => {
  const { sockets, renameSocket } = usePowerStrip();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftName, setDraftName] = useState("");
  
  const [wsConnected, setWsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  
  const [liveData, setLiveData] = useState<LiveData>({ 
    live1: 0, live2: 0, live3: 0, 
    relay: 0, relay2: 0, relay3: 0 
  });

  useEffect(() => {
    const ws = new WebSocket("ws://SmartPowerStrip.local:81");
    socketRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const json = JSON.parse(event.data);
        if (json.hasOwnProperty("live1")) {
          setLiveData(json as LiveData);
        }
      } catch (e) {
        // Ignored
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleToggle = (socketId: number) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      let command = "";
      if (socketId === 1) command = liveData.relay === 1 ? "RELAY1_OFF" : "RELAY1_ON";
      if (socketId === 2) command = liveData.relay2 === 1 ? "RELAY2_OFF" : "RELAY2_ON";
      if (socketId === 3) command = liveData.relay3 === 1 ? "RELAY3_OFF" : "RELAY3_ON";
      
      socketRef.current.send(command);
    } else {
      toast.error("Not connected to device");
    }
  };

  const mergedSockets = useMemo(() => {
    return sockets.slice(0, 3).map(socket => {
      let livePower = 0;
      let liveStatus = "off";

      if (socket.id === 1) {
        livePower = liveData.live1;
        liveStatus = liveData.relay === 1 ? "on" : "off";
      } else if (socket.id === 2) {
        livePower = liveData.live2;
        liveStatus = liveData.relay2 === 1 ? "on" : "off";
      } else if (socket.id === 3) {
        livePower = liveData.live3;
        liveStatus = liveData.relay3 === 1 ? "on" : "off";
      }

      return {
        ...socket,
        currentPower: livePower,
        status: liveStatus
      };
    });
  }, [sockets, liveData]);

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

  return (
    <Container fluid>
      <div className="mb-4 d-flex justify-content-between align-items-end">
        <div>
          <h1 className="text-white fw-bold mb-2 mt-4">Device Monitoring</h1>
          <p className="text-slate-400 mb-0">
            Control each outlet with live power readings
          </p>
        </div>
        <Badge 
          bg={wsConnected ? "success" : "danger"} 
          className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
        >
          {wsConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
          {wsConnected ? "Connected" : "Disconnected"}
        </Badge>
      </div>

      <Row className="g-4">
        {mergedSockets.map((socket) => {
          const isEditing = editingId === socket.id;
          return (
            <Col key={socket.id} md={6} lg={4}>
              <Card className="h-100 rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-[0_30px_80px_rgba(15,23,42,0.55)]">
                <Card.Body className="d-flex flex-column gap-3 p-4">
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
                    <div
                      className={`display-6 fw-bold transition-colors duration-300 ${socket.status === "on"
                          ? "text-primary"
                          : "text-slate-600 opacity-50"
                        }`}
                    >
                      {socket.status === "on" ? socket.currentPower.toFixed(2) : 0}W
                    </div>
                  </div>

                  <div className="mt-auto d-flex align-items-center justify-content-between">
                    <span className="text-slate-400 small">Power</span>
                    <Form.Check
                      type="switch"
                      id={`socket-${socket.id}-toggle`}
                      checked={socket.status === "on"}
                      onChange={() => handleToggle(socket.id)}
                      disabled={!wsConnected}
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