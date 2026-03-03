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
      case "graph_31d": return "31d";
      case "graph_months": return "months";
      default: return "24h";
    }
  };

  const mapRangeToJsonKey = (range: string) => {
    switch (range) {
      case "graph_60min": return "history_1h";
      case "graph_24h": return "history_24h";
      case "graph_31d": return "history_31d";
      case "graph_months": return "history_months";
      default: return "history_24h";
    }
  };

  const getHoursMultiplier = (range: string) => {
    switch (range) {
      case "graph_60min": return 1 / 60;
      case "graph_24h": return 15 / 60;
      case "graph_31d": return 24;
      case "graph_months": return 24 * 30;
      default: return 1;
    }
  };

  const getTimeIntervalMs = (range: string) => {
    switch (range) {
      case "graph_60min": return 60 * 1000;
      case "graph_24h": return 15 * 60 * 1000;
      case "graph_31d": return 24 * 60 * 60 * 1000;
      case "graph_months": return 30 * 24 * 60 * 60 * 1000;
      default: return 60 * 1000;
    }
  };

  const getFallbackLength = (range: string) => {
    switch (range) {
      case "graph_60min": return 60;
      case "graph_24h": return 96;
      case "graph_31d": return 31;
      case "graph_months": return 60;
      default: return 60;
    }
  };

  const getLabelFormat = (range: string, date: Date) => {
    switch (range) {
      case "graph_60min":
      case "graph_24h":
        return date.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
      case "graph_31d":
        return date.toLocaleDateString("en-US", { month: 'short', day: 'numeric' });
      case "graph_months":
        return date.toLocaleDateString("en-US", { month: 'short', year: '2-digit' });
      default:
        return date.toLocaleString("en-US");
    }
  };

  useEffect(() => {
    rangeKeyRef.current = rangeKey;

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const type = mapRangeToRequestType(rangeKey);
      socketRef.current.send(`GET_HISTORY TYPE=${type}`);
    }
  }, [rangeKey]);

  useEffect(() => {
    const ws = new WebSocket("ws://SmartPowerStrip.local:81");
    socketRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      ws.send("GET_HISTORY TYPE=24h");
      ws.send("GET_HISTORY TYPE=31d");
      
      const type = mapRangeToRequestType(rangeKeyRef.current);
      if (type !== "24h" && type !== "31d") {
        ws.send(`GET_HISTORY TYPE=${type}`);
      }
    };

    ws.onclose = () => setWsConnected(false);

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        setRawData((prev: any) => ({ ...prev, ...parsed }));
      } catch (e) {
      }
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    const jsonKey = mapRangeToJsonKey(rangeKey);
    const data = rawData ? rawData[jsonKey] : null;

    let plug1: number[] = [];
    let plug2: number[] = [];
    let plug3: number[] = [];
    let maxLength = 0;

    if (data) {
      plug1 = Array.isArray(data.plug_1) ? data.plug_1 : [];
      plug2 = Array.isArray(data.plug_2) ? data.plug_2 : [];
      plug3 = Array.isArray(data.plug_3) ? data.plug_3 : [];
      maxLength = Math.max(plug1.length, plug2.length, plug3.length);
    }

    if (!maxLength || Number.isNaN(maxLength)) {
      maxLength = getFallbackLength(rangeKey);
    }

    const processedData = [];
    const now = new Date();

    const hoursMultiplier = getHoursMultiplier(rangeKey);
    const intervalMs = getTimeIntervalMs(rangeKey);

    for (let i = 0; i < maxLength; i++) {
      let val1 = Number(plug1[i]) || 0;
      let val2 = Number(plug2[i]) || 0;
      let val3 = Number(plug3[i]) || 0;

      if (i === maxLength - 1) {
        if (rangeKey === "graph_31d" && rawData && rawData.history_24h) {
          const data24h = rawData.history_24h;
          const p1_24h = Array.isArray(data24h.plug_1) ? data24h.plug_1 : [];
          const p2_24h = Array.isArray(data24h.plug_2) ? data24h.plug_2 : [];
          const p3_24h = Array.isArray(data24h.plug_3) ? data24h.plug_3 : [];
          const len24h = Math.max(p1_24h.length, p2_24h.length, p3_24h.length) || 0;
          
          let sum1 = 0, sum2 = 0, sum3 = 0;
          for (let j = 0; j < len24h; j++) {
            sum1 += Number(p1_24h[j]) || 0;
            sum2 += Number(p2_24h[j]) || 0;
            sum3 += Number(p3_24h[j]) || 0;
          }
          val1 = len24h > 0 ? sum1 / len24h : 0;
          val2 = len24h > 0 ? sum2 / len24h : 0;
          val3 = len24h > 0 ? sum3 / len24h : 0;
        } else if (rangeKey === "graph_months" && rawData && rawData.history_31d) {
          const data31d = rawData.history_31d;
          const p1_31d = Array.isArray(data31d.plug_1) ? data31d.plug_1 : [];
          const p2_31d = Array.isArray(data31d.plug_2) ? data31d.plug_2 : [];
          const p3_31d = Array.isArray(data31d.plug_3) ? data31d.plug_3 : [];
          const len31d = Math.max(p1_31d.length, p2_31d.length, p3_31d.length) || 0;

          let sum1 = 0, sum2 = 0, sum3 = 0;
          for (let j = 0; j < len31d; j++) {
            sum1 += Number(p1_31d[j]) || 0;
            sum2 += Number(p2_31d[j]) || 0;
            sum3 += Number(p3_31d[j]) || 0;
          }
          val1 = len31d > 0 ? sum1 / len31d : 0;
          val2 = len31d > 0 ? sum2 / len31d : 0;
          val3 = len31d > 0 ? sum3 / len31d : 0;
        }
      }

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

      const kwhValue = Number.isNaN(wattsToProcess) ? 0 : (wattsToProcess / 1000) * hoursMultiplier;

      const timeOffset = i * intervalMs;
      const timestamp = new Date(now.getTime() - (maxLength - 1) * intervalMs + timeOffset);

      processedData.push({
        label: getLabelFormat(rangeKey, timestamp),
        value: kwhValue
      });
    }

    setChartData(processedData);
  }, [rawData, rangeKey, selectedOutlet]);

  const graphRanges = [
    { value: "graph_60min", label: "Last 60 min" },
    { value: "graph_24h", label: "Last 24 hours" },
    { value: "graph_31d", label: "Last 31 days" },
    { value: "graph_months", label: "Last 5 years" },
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