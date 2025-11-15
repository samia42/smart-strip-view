import { useEffect, useState } from "react";
import { Container, Card } from "react-bootstrap";

type EspData = {
  c1: number;
  c2: number;
};

const WebSocketPage = () => {
  const [data, setData] = useState<EspData>({ c1: 0, c2: 0 });
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [ledOn, setLedOn] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket("ws://192.168.8.184:81");
    setSocket(ws);

    ws.onopen = () => {
      setWsConnected(true);
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const json = JSON.parse(event.data) as EspData;
        setData(json);
      } catch (e) {
        // Ignore non-JSON messages
      }
    };

    ws.onerror = () => {
      setWsConnected(false);
      console.error("WebSocket error!");
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleLedToggle = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const command = ledOn ? "LED_OFF" : "LED_ON";
      socket.send(command);
      setLedOn((prev) => !prev);
    }
  };

  return (
    <Container fluid className="py-4">
      <h1 className="text-white fw-bold mb-4">WebSocket Live Data</h1>

      <div className="mb-3">
        <span
          style={{
            display: 'inline-block',
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: wsConnected ? '#22c55e' : '#6b7280',
            marginRight: 8,
            verticalAlign: 'middle',
          }}
        ></span>
        <span style={{ color: wsConnected ? '#22c55e' : '#6b7280', fontWeight: 600 }}>
          {wsConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      <Card bg="dark" text="white" className="border-secondary">
        <Card.Body>
          <Card.Title className="mb-3">ESP32 Current Readings</Card.Title>

          <p className="fs-4">
            <strong>Current 1:</strong> {data.c1} A
          </p>
          <p className="fs-4">
            <strong>Current 2:</strong> {data.c2} A
          </p>

          <button
            className="btn btn-primary mt-3"
            onClick={handleLedToggle}
            disabled={!socket || socket.readyState !== WebSocket.OPEN}
          >
            {ledOn ? "Turn LED Off" : "Turn LED On"}
          </button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default WebSocketPage;
