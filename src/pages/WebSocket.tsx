import { useEffect, useState } from "react";
import { Container, Card, Badge, Button, ButtonGroup } from "react-bootstrap";

type LiveData = {
  live1: number;
  live2: number;
  live3: number;
  relay: number;  // 0 = OFF, 1 = ON
  relay2: number;
  relay3: number;
};

// Helper type for the plug arrays inside a time period
type PlugData = {
  plug_1?: number[];
  plug_2?: number[];
  plug_3?: number[];
}

// Updated History Structure
type HistoryData = {
  history_1h?: PlugData;
  history_24h?: PlugData;
  history_30d?: PlugData;
  history_1y?: PlugData;
};

const WebSocketPage = () => {
  const [liveData, setLiveData] = useState<LiveData>({ 
    live1: 0, live2: 0, live3: 0, 
    relay: 0, relay2: 0, relay3: 0 
  });
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  // New State for Filters
  const [selectedPlug, setSelectedPlug] = useState<number>(0); // 0 = All
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all"); // "all", "1h", "24h", "30d", "1y"

  // WebSocket Connection Logic
  useEffect(() => {
    const ws = new WebSocket("ws://SmartPowerStrip.local:81");
    setSocket(ws);

    ws.onopen = () => {
      setWsConnected(true);
      console.log("Connected.");
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const json = JSON.parse(event.data);

        // Logic to distinguish between Live data and History data
        if (json.hasOwnProperty("live1")) {
          setLiveData(json as LiveData);
        } else {
          // Assume it is history data if it's not live data
          // We merge with existing history so partial updates (e.g. just PLUG=1) don't wipe other data
          setHistoryData(prev => ({ ...prev, ...json }));
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
  const handleRelayToggle = (outlet: number) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      let command = "";
      if (outlet === 1) command = liveData.relay === 1 ? "RELAY1_OFF" : "RELAY1_ON";
      if (outlet === 2) command = liveData.relay2 === 1 ? "RELAY2_OFF" : "RELAY2_ON";
      if (outlet === 3) command = liveData.relay3 === 1 ? "RELAY3_OFF" : "RELAY3_ON";
      socket.send(command);
    }
  };

  // Centralized function to send current filter state
  const sendCurrentCommand = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      let cmd = "GET_HISTORY";
      if (selectedPlug !== 0) cmd += ` PLUG=${selectedPlug}`;
      if (selectedPeriod !== "all") cmd += ` TYPE=${selectedPeriod}`;
      
      // Clear data to give visual feedback of refresh
      setHistoryData(null); 
      socket.send(cmd);
    }
  };

  // Effect: Auto-fetch when filters change or connection is established
  useEffect(() => {
    if (wsConnected) {
        sendCurrentCommand();
    }
  }, [selectedPlug, selectedPeriod, wsConnected]);

  // Manual Refresh Handler
  const handleRefresh = () => {
      sendCurrentCommand();
  };

  // Helper to format JSON for display
  const formatJson = (data: HistoryData | null) => {
    if (!data) return "Waiting for data...";
    // 1. Pretty print first (expands everything)
    const jsonStr = JSON.stringify(data, null, 2);
    
    // 2. Collapse number arrays back to single lines using Regex
    // Matches: [ followed by newlines/numbers/commas followed by ]
    return jsonStr.replace(/\[\s+([\d.,\s-]+?)\s+\]/g, (match, content) => {
      // Replace internal whitespace newlines with single spaces
      return `[ ${content.replace(/\s+/g, ' ').trim()} ]`;
    });
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

      {/* Live Control Cards */}
      <div className="row">
         {/* Outlet 1 */}
        <div className="col-md-4">
            <Card bg="secondary" text="white" className="mb-3 border-0 shadow-sm">
                <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 className="text-uppercase text-light opacity-75">Outlet 1</h6>
                        <div className="display-6 fw-bold">{liveData.live1.toFixed(2)} A</div>
                    </div>
                    <Button
                        variant={liveData.relay === 1 ? "danger" : "light"}
                        onClick={() => handleRelayToggle(1)}
                        disabled={!wsConnected}
                    >
                        {liveData.relay === 1 ? "OFF" : "ON"}
                    </Button>
                </div>
                </Card.Body>
            </Card>
        </div>
        {/* Outlet 2 */}
        <div className="col-md-4">
            <Card bg="secondary" text="white" className="mb-3 border-0 shadow-sm">
                <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 className="text-uppercase text-light opacity-75">Outlet 2</h6>
                        <div className="display-6 fw-bold">{liveData.live2.toFixed(2)} A</div>
                    </div>
                    <Button
                        variant={liveData.relay2 === 1 ? "danger" : "light"}
                        onClick={() => handleRelayToggle(2)}
                        disabled={!wsConnected}
                    >
                        {liveData.relay2 === 1 ? "OFF" : "ON"}
                    </Button>
                </div>
                </Card.Body>
            </Card>
        </div>
        {/* Outlet 3 */}
        <div className="col-md-4">
            <Card bg="secondary" text="white" className="mb-3 border-0 shadow-sm">
                <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 className="text-uppercase text-light opacity-75">Outlet 3</h6>
                        <div className="display-6 fw-bold">{liveData.live3.toFixed(2)} A</div>
                    </div>
                    <Button
                        variant={liveData.relay3 === 1 ? "danger" : "light"}
                        onClick={() => handleRelayToggle(3)}
                        disabled={!wsConnected}
                    >
                        {liveData.relay3 === 1 ? "OFF" : "ON"}
                    </Button>
                </div>
                </Card.Body>
            </Card>
        </div>
      </div>

      {/* History Request Controls */}
      <Card bg="dark" text="white" className="mb-3 border border-secondary">
        <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="text-white m-0">Response Filters</h5>
                <Button variant="outline-light" size="sm" onClick={handleRefresh} disabled={!wsConnected}>
                    ⟳ Refresh
                </Button>
            </div>
            
            <div className="row g-3">
                {/* Plug Selector */}
                <div className="col-md-5">
                    <label className="text-muted mb-2 d-block">Select Plug</label>
                    <ButtonGroup className="w-100">
                        <Button variant={selectedPlug === 0 ? "primary" : "outline-secondary"} onClick={() => setSelectedPlug(0)}>ALL</Button>
                        <Button variant={selectedPlug === 1 ? "primary" : "outline-secondary"} onClick={() => setSelectedPlug(1)}>Plug 1</Button>
                        <Button variant={selectedPlug === 2 ? "primary" : "outline-secondary"} onClick={() => setSelectedPlug(2)}>Plug 2</Button>
                        <Button variant={selectedPlug === 3 ? "primary" : "outline-secondary"} onClick={() => setSelectedPlug(3)}>Plug 3</Button>
                    </ButtonGroup>
                </div>

                {/* Period Selector */}
                <div className="col-md-7">
                    <label className="text-muted mb-2 d-block">Select Time Period</label>
                    <ButtonGroup className="w-100">
                        <Button variant={selectedPeriod === "all" ? "warning" : "outline-secondary"} onClick={() => setSelectedPeriod("all")}>All</Button>
                        <Button variant={selectedPeriod === "1h" ? "warning" : "outline-secondary"} onClick={() => setSelectedPeriod("1h")}>1h</Button>
                        <Button variant={selectedPeriod === "24h" ? "warning" : "outline-secondary"} onClick={() => setSelectedPeriod("24h")}>24h</Button>
                        <Button variant={selectedPeriod === "30d" ? "warning" : "outline-secondary"} onClick={() => setSelectedPeriod("30d")}>30d</Button>
                        <Button variant={selectedPeriod === "1y" ? "warning" : "outline-secondary"} onClick={() => setSelectedPeriod("1y")}>1y</Button>
                    </ButtonGroup>
                </div>
            </div>
        </Card.Body>
      </Card>

      {/* RAW JSON DISPLAY BLOCK */}
      <Card bg="dark" text="white" className="border border-secondary">
        <Card.Header className="bg-black border-bottom border-secondary d-flex justify-content-between align-items-center">
          <span>Received JSON Data</span>
          <Badge bg="secondary">{historyData ? Object.keys(historyData).length : 0} keys</Badge>
        </Card.Header>
        <Card.Body className="p-0">
          <pre
            style={{
              backgroundColor: "#1e1e1e",
              color: "#ce9178", // VS Code JSON string colorish
              padding: "15px",
              margin: 0,
              border: "none",
              borderRadius: "0 0 4px 4px",
              fontFamily: "Consolas, 'Courier New', monospace",
              fontSize: "0.85rem",
              lineHeight: "1.5",
              whiteSpace: "pre-wrap",       // Allows wrapping of the long array lines
              wordBreak: "break-word",      // Breaks at words/numbers
              maxHeight: "600px",
              overflowY: "auto"
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