import { useMemo, useState, useEffect, useRef } from "react";
import { Card, Col, Container, Form, Row, Badge } from "react-bootstrap";
import { Wifi, WifiOff } from "lucide-react";
import ConsumptionChart from "@/components/Dashboard/ConsumptionChart";
import { usePowerStrip } from "@/context/PowerStripContext";

const Consumption = () => {
  const { sockets } = usePowerStrip();
  
  const [selectedOutlet, setSelectedOutlet] = useState<number | "all">("all");
  const [rangeKey, setRangeKey] = useState("graph_24h");
  const [chartData, setChartData] = useState<{ label: string; value: number }[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  
  const [rawData, setRawData] = useState<any>({});

  const socketRef = useRef<WebSocket | null>(null);
  const rangeKeyRef = useRef(rangeKey);

  const mapRangeToRequestType = (range: string) => {
    switch (range) {
      case "graph_60min": return "1h";
      case "graph_24h": return "24h";
      case "graph_30d": return "30d";
      case "graph_months": return "1y";
      default: return "24h";
    }
  };

  const mapRangeToJsonKey = (range: string) => {
    switch (range) {
      case "graph_60min": return "history_1h";
      case "graph_24h": return "history_24h";
      case "graph_30d": return "history_30d";
      case "graph_months": return "history_1y";
      default: return "history_24h";
    }
  };

  const getHoursMultiplier = (range: string) => {
    switch (range) {
      case "graph_60min": return 1 / 60;
      case "graph_24h": return 15 / 60;
      case "graph_30d": return 24;
      case "graph_months": return 24 * 30;
      default: return 1;
    }
  };

  const getTimeIntervalMs = (range: string) => {
    switch (range) {
      case "graph_60min": return 60 * 1000;
      case "graph_24h": return 15 * 60 * 1000;
      case "graph_30d": return 24 * 60 * 60 * 1000;
      case "graph_months": return 30 * 24 * 60 * 60 * 1000;
      default: return 60 * 1000;
    }
  };

  const getLabelFormat = (range: string, date: Date) => {
    switch (range) {
      case "graph_60min":
      case "graph_24h":
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case "graph_30d":
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      case "graph_months":
        return date.toLocaleDateString([], { month: 'short', year: '2-digit' });
      default:
        return date.toLocaleString();
    }
  };

  useEffect(() => {
    rangeKeyRef.current = rangeKey;
    
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const type = mapRangeToRequestType(rangeKey);
      socketRef.current.send(`GET_HISTORY TYPE=${type}`);
    } else {
      const ws = new WebSocket("ws://SmartPowerStrip.local:81");
      socketRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        const type = mapRangeToRequestType(rangeKeyRef.current);
        ws.send(`GET_HISTORY TYPE=${type}`);
      };

      ws.onclose = () => setWsConnected(false);

      ws.onmessage = (event) => {
        try {
          const json = JSON.parse(event.data);
          setRawData((prev: any) => ({ ...prev, ...json }));
        } catch (e) {
        }
      };
    }
  }, [rangeKey]);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!rawData) return;

    const jsonKey = mapRangeToJsonKey(rangeKey);
    const data = rawData[jsonKey];

    if (data) {
      const plug1 = data.plug_1 || [];
      const plug2 = data.plug_2 || [];
      const plug3 = data.plug_3 || [];

      const maxLength = Math.max(plug1.length, plug2.length, plug3.length);
      const processedData = [];
      const now = new Date();
      
      const hoursMultiplier = getHoursMultiplier(rangeKey);
      const intervalMs = getTimeIntervalMs(rangeKey);

      for (let i = 0; i < maxLength; i++) {
        const val1 = plug1[i] || 0;
        const val2 = plug2[i] || 0;
        const val3 = plug3[i] || 0;

        let wattsToProcess = 0;

        const target = selectedOutlet === "all" ? "all" : Number(selectedOutlet);

        if (target === "all") {
          wattsToProcess = val1 + val2 + val3;
        } else if (target === 1) {
          wattsToProcess = val1;
        } else if (target === 2) {
          wattsToProcess = val2;
        } else if (target === 3) {
          wattsToProcess = val3;
        }

        const kwhValue = (wattsToProcess / 1000) * hoursMultiplier;

        const timeOffset = (maxLength - 1 - i) * intervalMs;
        const timestamp = new Date(now.getTime() - timeOffset);

        processedData.push({
          label: getLabelFormat(rangeKey, timestamp),
          value: kwhValue
        });
      }

      setChartData(processedData);
    }
  }, [rawData, rangeKey, selectedOutlet]);

  const graphRanges = [
    { value: "graph_60min", label: "Last 60 min" },
    { value: "graph_24h", label: "Last 24 hours" },
    { value: "graph_30d", label: "Last 30 days" },
    { value: "graph_months", label: "Last 12 months" },
  ];

  const outletOptions = useMemo(() => {
    return [
      { value: "all", label: "All outlets" },
      ...sockets.slice(0, 3).map((socket) => ({
        value: socket.id.toString(),
        label: socket.name,
      })),
    ];
  }, [sockets]);

  return (
    <Container fluid>
      <div className="mb-4 d-flex justify-content-between align-items-end">
        <div>
          <h1 className="text-white fw-bold mb-2 mt-4">Consumption</h1>
          <p className="text-slate-400 mb-0">
            Explore power usage across outlets and time ranges
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

      <Card className="rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-[0_30px_80px_rgba(15,23,42,0.55)] mb-4">
        <Card.Body className="p-4">
          <Row className="g-3">
            <Col md={6} lg={4}>
              <Form.Group>
                <Form.Label className="text-white">Outlet</Form.Label>
                <Form.Select
                  value={selectedOutlet === "all" ? "all" : selectedOutlet.toString()}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedOutlet(value === "all" ? "all" : Number(value));
                  }}
                  className="bg-slate-900 border-slate-700 text-white shadow-none"
                  style={{ cursor: "pointer" }}
                >
                  {outletOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6} lg={4}>
              <Form.Group>
                <Form.Label className="text-white">Time Range</Form.Label>
                <Form.Select
                  value={rangeKey}
                  onChange={(event) => setRangeKey(event.target.value)}
                  className="bg-slate-900 border-slate-700 text-white shadow-none"
                  style={{ cursor: "pointer" }}
                >
                  {graphRanges.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <div style={{ height: '600px', width: '100%' }}>
        <ConsumptionChart
          title="Consumption Over Time"
          data={chartData}
          unit="kWh"
          hideControls={true}
        />
      </div>
    </Container>
  );
};

export default Consumption;