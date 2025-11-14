import { useEffect, useState } from "react";
import { Container, Card } from "react-bootstrap";

type EspData = {
  c1: number;
  c2: number;
};

const WebSocketPage = () => {
  const [data, setData] = useState<EspData>({ c1: 0, c2: 0 });

  useEffect(() => {
    const socket = new WebSocket("ws://192.168.8.184:81");

    socket.onmessage = (event) => {
      const json = JSON.parse(event.data) as EspData;
      setData(json);
    };

    socket.onerror = () => {
      console.error("WebSocket error!");
    };
  }, []);

  return (
    <Container fluid className="py-4">
      <h1 className="text-white fw-bold mb-4">WebSocket Live Data</h1>

      <Card bg="dark" text="white" className="border-secondary">
        <Card.Body>
          <Card.Title className="mb-3">ESP32 Current Readings</Card.Title>

          <p className="fs-4">
            <strong>Current 1:</strong> {data.c1} A
          </p>
          <p className="fs-4">
            <strong>Current 2:</strong> {data.c2} A
          </p>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default WebSocketPage;
