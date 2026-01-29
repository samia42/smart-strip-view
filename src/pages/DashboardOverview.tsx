import { Card, Col, Container, ListGroup, Row, Badge } from "react-bootstrap";
import { DollarSign, Zap, Wifi, WifiOff, Euro, PoundSterling } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import MetricCard from "@/components/Dashboard/MetricCard";
import ConsumptionChart from "@/components/Dashboard/ConsumptionChart";
import { usePowerStrip } from "@/context/PowerStripContext";

const DashboardOverview = () => {
  const {
    getTotalCost,
    getTopConsumers,
    getCurrencySymbol,
    costConfig,
  } = usePowerStrip();

  const [wsConnected, setWsConnected] = useState(false);
  const [chartData, setChartData] = useState<{ label: string; value: number }[]>([]);
  const [fixedTotal24h, setFixedTotal24h] = useState(0);
  const [overviewRangeKey, setOverviewRangeKey] = useState("graph_24h");

  const socketRef = useRef<WebSocket | null>(null);
  const rangeKeyRef = useRef(overviewRangeKey);

  const getStoredCurrencyCode = () => {
    return localStorage.getItem("app_currency") || "USD";
  };

  const [currencyCode, setCurrencyCode] = useState(getStoredCurrencyCode());

  useEffect(() => {
    setCurrencyCode(getStoredCurrencyCode());
  }, [costConfig.currency]);

  useEffect(() => {
    rangeKeyRef.current = overviewRangeKey;
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const type = mapRangeToType(overviewRangeKey);
      socketRef.current.send(`GET_HISTORY TYPE=${type}`);
    }
  }, [overviewRangeKey]);

  const currencySymbol = useMemo(() => {
    switch (currencyCode) {
      case "EUR": return "€";
      case "GBP": return "£";
      case "USD": return "$";
      default: return getCurrencySymbol();
    }
  }, [currencyCode, getCurrencySymbol]);

  const CurrencyIcon = useMemo(() => {
    switch (currencyCode) {
      case "EUR": return Euro;
      case "GBP": return PoundSterling;
      default: return DollarSign;
    }
  }, [currencyCode]);

  const mapRangeToType = (range: string) => {
    switch (range) {
      case "graph_60min": return "1h";
      case "graph_24h": return "24h";
      case "graph_30d": return "30d";
      case "graph_months": return "1y";
      default: return "24h";
    }
  };

  const getResolutionInHours = (type: string) => {
    switch (type) {
      case "1h": return 1 / 60;
      case "24h": return 15 / 60;
      case "30d": return 24;
      case "1y": return 24 * 30;
      default: return 1;
    }
  };

  const getLabelFormat = (type: string, date: Date) => {
    switch (type) {
      case "1h":
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case "24h":
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case "30d":
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      case "1y":
        return date.toLocaleDateString([], { month: 'short', year: '2-digit' });
      default:
        return date.toLocaleString();
    }
  };

  useEffect(() => {
    const ws = new WebSocket("ws://SmartPowerStrip.local:81");
    socketRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      ws.send("GET_HISTORY TYPE=24h");

      const currentType = mapRangeToType(rangeKeyRef.current);
      if (currentType !== "24h") {
        ws.send(`GET_HISTORY TYPE=${currentType}`);
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const json = JSON.parse(event.data);
        const now = new Date();

        if (json.history_24h) {
          const data24h = json.history_24h;
          const p1 = data24h.plug_1 || [];
          const p2 = data24h.plug_2 || [];
          const p3 = data24h.plug_3 || [];
          const maxLen = Math.max(p1.length, p2.length, p3.length);

          let totalWattsSum = 0;

          for (let i = 0; i < maxLen; i++) {
            const watts = (p1[i] || 0) + (p2[i] || 0) + (p3[i] || 0);
            totalWattsSum += watts;
          }

          const avgWatts = maxLen > 0 ? totalWattsSum / maxLen : 0;
          const calculatedKWh = (avgWatts * 24) / 1000;

          setFixedTotal24h(calculatedKWh);
        }

        const currentRangeType = mapRangeToType(rangeKeyRef.current);
        const chartKey = `history_${currentRangeType}`;

        if (json[chartKey]) {
          const data = json[chartKey];
          const plug1 = data.plug_1 || [];
          const plug2 = data.plug_2 || [];
          const plug3 = data.plug_3 || [];

          const maxLength = Math.max(plug1.length, plug2.length, plug3.length);
          const processedData = [];
          const resolution = getResolutionInHours(currentRangeType);

          for (let i = 0; i < maxLength; i++) {
            const val1 = plug1[i] || 0;
            const val2 = plug2[i] || 0;
            const val3 = plug3[i] || 0;
            const totalWatts = val1 + val2 + val3;

            const timeOffset = (maxLength - 1 - i) * (resolution * 60 * 60 * 1000);
            const timestamp = new Date(now.getTime() - timeOffset);

            processedData.push({
              label: getLabelFormat(currentRangeType, timestamp),
              value: totalWatts / 1000
            });
          }

          setChartData(processedData);
        }
      } catch (e) {
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const totalCost = getTotalCost();
  const topConsumers = getTopConsumers(3);

  const overviewRangeOptions = [
    { value: "graph_60min", label: "Last 60 min" },
    { value: "graph_24h", label: "Last 24 hours" },
    { value: "graph_30d", label: "Last 30 days" },
    { value: "graph_months", label: "Last 12 months" },
  ];

  const getRangeLabel = () => {
    return overviewRangeOptions.find(o => o.value === overviewRangeKey)?.label || "Selected period";
  };

  return (
    <Container fluid>
      <div className="mb-4 d-flex justify-content-between align-items-end">
        <div>
          <h1 className="text-white fw-bold mb-2 mt-4">Overview</h1>
          <p className="text-slate-400 mb-0">
            Real-time energy monitoring for your smart power strip
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

      <Row className="g-4 mb-4">
        <Col md={6} lg={6}>
          <MetricCard
            title="Total Consumption (24h)"
            value={`${fixedTotal24h.toFixed(3)} kWh`}
            subtitle="Total consumption for the last 24h"
            icon={Zap}
            variant="primary"
          />
        </Col>
        <Col md={6} lg={6}>
          <MetricCard
            title="Total Price"
            value={`${currencySymbol}${totalCost.toFixed(2)}`}
            subtitle="Estimated cost for the last 30 days"
            icon={CurrencyIcon}
            variant="success"
          />
        </Col>
      </Row>

      <Row className="g-4">
        <Col lg={8}>
          <div style={{ position: "relative", height: "100%" }}>
            {!wsConnected && (
              <div
                className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                style={{
                  backgroundColor: "rgba(15, 23, 42, 0.7)",
                  zIndex: 10,
                  backdropFilter: "blur(2px)",
                  borderRadius: "1.5rem"
                }}
              >
                <div className="d-flex align-items-center gap-2 text-white bg-danger px-4 py-2 rounded-pill shadow-lg">
                  <WifiOff size={20} />
                  <span className="fw-bold">Disconnected</span>
                </div>
              </div>
            )}
            <ConsumptionChart
              title={`Total Consumption (${getRangeLabel()})`}
              data={chartData}
              unit="kWh"
              rangeValue={overviewRangeKey}
              rangeOptions={overviewRangeOptions}
              onRangeChange={setOverviewRangeKey}
            />
          </div>
        </Col>
        <Col lg={4}>
          <Card className="h-100 rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-[0_30px_80px_rgba(15,23,42,0.55)]">
            <Card.Body className="p-4">
              <Card.Title className="mb-3 text-white">Top Consuming Devices</Card.Title>
              <ListGroup variant="flush">
                {topConsumers.map((socket) => {
                  const estimatedCost =
                    socket.monthlyConsumption * costConfig.rate;
                  return (
                    <ListGroup.Item
                      key={socket.id}
                      className="bg-transparent border-slate-800 text-white px-0"
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="fw-bold">{socket.name}</div>
                          <small className="text-slate-400">
                            {socket.monthlyConsumption.toFixed(1)} kWh / month
                          </small>
                        </div>
                        <div className="text-primary fw-bold">
                          {currencySymbol}
                          {estimatedCost.toFixed(2)}
                        </div>
                      </div>
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DashboardOverview;