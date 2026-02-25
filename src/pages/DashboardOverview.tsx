import { Card, Col, Container, Row, Badge, ProgressBar } from "react-bootstrap";
import { DollarSign, Zap, Wifi, WifiOff, Euro, PoundSterling } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import MetricCard from "@/components/Dashboard/MetricCard";
import ConsumptionChart from "@/components/Dashboard/ConsumptionChart";
import { usePowerStrip } from "@/context/PowerStripContext";

import { toast } from "sonner";

interface ConsumerData {
  id: number;
  name: string;
  kwh: number;
  cost: number;
  percent: number;
}

const DashboardOverview = () => {
  const {
    getCurrencySymbol,
    costConfig,
    sockets,
  } = usePowerStrip();

  const [wsConnected, setWsConnected] = useState(false);
  const [chartData, setChartData] = useState<{ label: string; value: number }[]>([]);

  const [fixedTotal24h, setFixedTotal24h] = useState(0);
  const [monthlyConsumption, setMonthlyConsumption] = useState(0);

  const [topConsumersData, setTopConsumersData] = useState<ConsumerData[]>([]);

  const [overviewRangeKey, setOverviewRangeKey] = useState("graph_24h");

  const [rawData, setRawData] = useState<any>({});

  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const type = mapRangeToRequestType(overviewRangeKey);
      socketRef.current.send(`GET_HISTORY TYPE=${type}`);
    }
  }, [overviewRangeKey]);

  const currencySymbol = useMemo(() => {
    switch (costConfig.currency) {
      case "EUR": return "€";
      case "GBP": return "£";
      case "USD": return "$";
      default: return getCurrencySymbol();
    }
  }, [costConfig.currency, getCurrencySymbol]);

  const CurrencyIcon = useMemo(() => {
    switch (costConfig.currency) {
      case "EUR": return Euro;
      case "GBP": return PoundSterling;
      default: return DollarSign;
    }
  }, [costConfig.currency]);

  const realTotalCost = monthlyConsumption * costConfig.rate;

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
        return date.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
      case "graph_30d":
        return date.toLocaleDateString("en-US", { month: 'short', day: 'numeric' });
      case "graph_months":
        return date.toLocaleDateString("en-US", { month: 'short', year: '2-digit' });
      default:
        return date.toLocaleString("en-US");
    }
  };

  const getFallbackLength = (range: string) => {
    switch (range) {
      case "graph_60min": return 60;
      case "graph_24h": return 96;
      case "graph_30d": return 30;
      case "graph_months": return 60;
      default: return 60;
    }
  };

  useEffect(() => {
    const ws = new WebSocket("ws://SmartPowerStrip.local:81");
    socketRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      ws.send("GET_HISTORY TYPE=24h");
      ws.send("GET_HISTORY TYPE=30d");

      const currentType = mapRangeToRequestType(overviewRangeKey);
      if (currentType !== "24h" && currentType !== "30d") {
        ws.send(`GET_HISTORY TYPE=${currentType}`);
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        setRawData((prev: any) => ({ ...prev, ...parsed }));
      } catch (e) {
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    if (!rawData) return;

    if (rawData.history_24h) {
      const data24h = rawData.history_24h;
      const p1 = data24h.plug_1 || [];
      const p2 = data24h.plug_2 || [];
      const p3 = data24h.plug_3 || [];
      const maxLen = Math.max(p1.length, p2.length, p3.length);

      let totalKWhSum = 0;
      const hoursFactor = 15 / 60;

      for (let i = 0; i < maxLen; i++) {
        const watts = (p1[i] || 0) + (p2[i] || 0) + (p3[i] || 0);
        totalKWhSum += (watts / 1000) * hoursFactor;
      }
      setFixedTotal24h(totalKWhSum);
    }

    if (rawData.history_30d) {
      const data30d = rawData.history_30d;
      const p1 = data30d.plug_1 || [];
      const p2 = data30d.plug_2 || [];
      const p3 = data30d.plug_3 || [];
      const maxLen = Math.max(p1.length, p2.length, p3.length);

      let totalMonthlyKWh = 0;
      let sumKWhP1 = 0;
      let sumKWhP2 = 0;
      let sumKWhP3 = 0;

      const hoursFactor = 24;

      for (let i = 0; i < maxLen; i++) {
        const val1 = p1[i] || 0;
        const val2 = p2[i] || 0;
        const val3 = p3[i] || 0;

        sumKWhP1 += (val1 / 1000) * hoursFactor;
        sumKWhP2 += (val2 / 1000) * hoursFactor;
        sumKWhP3 += (val3 / 1000) * hoursFactor;

        totalMonthlyKWh += ((val1 + val2 + val3) / 1000) * hoursFactor;
      }

      setMonthlyConsumption(totalMonthlyKWh);

      const rawConsumers = [
        { id: 1, kwh: sumKWhP1 },
        { id: 2, kwh: sumKWhP2 },
        { id: 3, kwh: sumKWhP3 },
      ];

      const maxVal = Math.max(sumKWhP1, sumKWhP2, sumKWhP3) || 1;

      const processedConsumers = rawConsumers.map(c => {
        const socketInfo = sockets.find(s => s.id === c.id);
        return {
          id: c.id,
          name: socketInfo ? socketInfo.name : `Outlet ${c.id}`,
          kwh: c.kwh,
          cost: c.kwh * costConfig.rate,
          percent: (c.kwh / maxVal) * 100
        };
      }).sort((a, b) => b.kwh - a.kwh);

      setTopConsumersData(processedConsumers);
    }

    const jsonKey = mapRangeToJsonKey(overviewRangeKey);
    const data = rawData[jsonKey];

    let plug1: number[] = [];
    let plug2: number[] = [];
    let plug3: number[] = [];
    let maxLength = 0;

    if (data) {
      plug1 = data.plug_1 || [];
      plug2 = data.plug_2 || [];
      plug3 = data.plug_3 || [];
      maxLength = Math.max(plug1.length, plug2.length, plug3.length);
    }

    if (maxLength === 0) {
      maxLength = getFallbackLength(overviewRangeKey);
    }

    const processedData = [];
    const now = new Date();
    const hoursMultiplier = getHoursMultiplier(overviewRangeKey);
    const intervalMs = getTimeIntervalMs(overviewRangeKey);

    for (let i = 0; i < maxLength; i++) {
      const val1 = plug1[i] || 0;
      const val2 = plug2[i] || 0;
      const val3 = plug3[i] || 0;
      const totalAvgWatts = val1 + val2 + val3;

      const totalKWh = (totalAvgWatts / 1000) * hoursMultiplier;

      const timeOffset = i * intervalMs;
      const timestamp = new Date(now.getTime() - (maxLength - 1) * intervalMs + timeOffset);

      processedData.push({
        label: getLabelFormat(overviewRangeKey, timestamp),
        value: totalKWh
      });
    }

    setChartData(processedData);

  }, [rawData, overviewRangeKey, costConfig.rate, sockets]);

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
            value={`${currencySymbol}${realTotalCost.toFixed(2)}`}
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
              <Card.Title className="mb-4 text-white">Top Consumers (Last 30 days)</Card.Title>
              <div className="d-flex flex-column gap-4">
                {topConsumersData.map((item, index) => {
                  return (
                    <div key={item.id} className="w-100">
                      <div className="d-flex justify-content-between align-items-end mb-1">
                        <div>
                          <div className="fw-bold text-white mb-0" style={{ fontSize: '1rem' }}>
                            {item.name}
                          </div>
                          <small className="text-slate-400" style={{ fontSize: '0.8rem' }}>
                            {item.kwh.toFixed(1)} kWh
                          </small>
                        </div>
                        <div className="text-end">
                          <div className="fw-bold text-primary">
                            {currencySymbol}{item.cost.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <ProgressBar
                        now={item.percent}
                        className="bg-slate-800"
                        style={{ height: '6px', borderRadius: '4px' }}
                      >
                        <ProgressBar
                          now={item.percent}
                          style={{
                            backgroundColor: '#3b82f6',
                            borderRadius: '4px'
                          }}
                        />
                      </ProgressBar>
                    </div>
                  );
                })}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DashboardOverview;