import { useEffect, useState } from "react";
import { Container, Card, Badge, Button } from "react-bootstrap";

type LiveData = {
  live: number;
  relay: number; // 0 = OFF, 1 = ON
};

type HistoryData = {
  graph_60m: number[];
  graph_24h: number[];
  graph_30d: number[];
  graph_months: number[];
};

const WebSocketPage = () => {
  const [liveData, setLiveData] = useState<LiveData>({ live: 0, relay: 0 });
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  // WebSocket Connection Logic
  useEffect(() => {
    const ws = new WebSocket("ws://SmartPowerStrip.local:81");
    setSocket(ws);

    ws.onopen = () => {
      setWsConnected(true);
      console.log("Connected. Requesting full data...");
      ws.send("GET_FULL_DATA");
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const json = JSON.parse(event.data);

        // Logic to distinguish between Live data and History data
        if (json.hasOwnProperty("live")) {
          setLiveData(json as LiveData);
        } else if (json.hasOwnProperty("graph_24h")) {
          setHistoryData(json as HistoryData);
        }
      } catch (e) {
        console.warn("Non-JSON received:", event.data);
      }
    };

    ws.onerror = () => {
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  // Handle Relay Button
  const handleRelayToggle = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const command = liveData.relay === 1 ? "RELAY_OFF" : "RELAY_ON";
      socket.send(command);
    }
  };

  // Helper to format JSON (adds a newline after every comma separating keys)
  const formatJson = (data: HistoryData | null) => {
    if (!data) return "Waiting for data...";
    const jsonString = JSON.stringify(data);
    return jsonString.replace(/,"/g, ',\n"');
  };

  return (
    <Container fluid className="py-4 bg-dark min-vh-100 text-white">
      {/* Header & Status */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold m-0">⚡ Smart Monitor</h2>
        <Badge bg={wsConnected ? "success" : "danger"} className="px-3 py-2">
          {wsConnected ? "Connected" : "Disconnected"}
        </Badge>
      </div>

      {/* Live Control Card */}
      <Card bg="secondary" text="white" className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <div className="row align-items-center">
            <div className="col-6">
              <h6 className="text-uppercase text-light opacity-75">Current Consumption</h6>
              <div className="display-4 fw-bold">{liveData.live.toFixed(2)} A</div>
            </div>
            <div className="col-6 text-end">
              <Button
                variant={liveData.relay === 1 ? "danger" : "success"}
                size="lg"
                onClick={handleRelayToggle}
                disabled={!wsConnected}
                className="fw-bold px-4"
              >
                {liveData.relay === 1 ? "TURN OFF" : "TURN ON"}
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* RAW JSON DISPLAY BLOCK */}
      <Card bg="dark" text="white" className="border border-secondary">
        <Card.Header className="bg-black border-bottom border-secondary">
          Raw JSON Output
        </Card.Header>
        <Card.Body className="p-0">
          <pre
            style={{
              backgroundColor: "#0d0d0d",
              color: "#cccccc",
              padding: "15px",
              margin: 0,
              border: "none",
              borderRadius: "0 0 4px 4px",
              fontFamily: "Consolas, Monaco, 'Courier New', monospace",
              fontSize: "0.9rem",
              lineHeight: "1.5",
              whiteSpace: "pre",
              overflowX: "auto"
            }}
          >
            {formatJson(historyData)}
          </pre>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default WebSocketPage;