import { useMemo, useState, useEffect, useRef } from "react";
import { Card, Col, Container, Form, Row, Badge } from "react-bootstrap";
import { Zap, Wifi, WifiOff, Edit3 } from "lucide-react";
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

// --- COMPOSANT MODIFIÉ ---
const EditableName = ({ 
  initialName, 
  onSave 
}: { 
  initialName: string; 
  onSave: (newName: string) => void;
}) => {
  const [name, setName] = useState(initialName);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  const handleBlur = () => {
    setIsFocused(false);
    const trimmed = name.trim();
    if (trimmed && trimmed !== initialName) {
      onSave(trimmed);
      toast.success("Device name updated");
    } else if (!trimmed) {
      setName(initialName);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div className="position-relative">
      <Form.Control
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={handleBlur}
        onFocus={() => setIsFocused(true)}
        onKeyDown={handleKeyDown}
        className={`
          fw-bold text-white transition-all
          ${isFocused 
            ? "border-blue-500" 
            : "border-slate-700 hover:border-slate-500"
          }
        `}
        style={{ 
          fontSize: '1.1rem',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderRadius: '6px',
          padding: '4px 8px',
          paddingRight: '30px',
          // C'est ici qu'on force la couleur pour éviter le fond blanc de Bootstrap
          backgroundColor: isFocused ? '#0f172a' : 'rgba(30, 41, 59, 0.5)', // Slate-900 vs Slate-800/50
          color: 'white',
          boxShadow: 'none' // Retire la lueur bleue standard de Bootstrap
        }}
      />
      {!isFocused && (
        <Edit3 
          size={14} 
          className="position-absolute text-slate-500" 
          style={{ right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} 
        />
      )}
    </div>
  );
};
// -------------------------

const DeviceMonitoring = () => {
  const { sockets, renameSocket } = usePowerStrip();
  
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
          return (
            <Col key={socket.id} md={6} lg={4}>
              <Card className="h-100 rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-[0_30px_80px_rgba(15,23,42,0.55)]">
                <Card.Body className="d-flex flex-column gap-3 p-4">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <div className="flex-grow-1">
                      <div className="text-slate-400 small mb-2">
                        Outlet {socket.id}
                      </div>
                      <EditableName 
                        initialName={socket.name}
                        onSave={(newName) => renameSocket(socket.id, newName)}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="d-flex align-items-center gap-2 text-slate-400 small mb-1 mt-2">
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