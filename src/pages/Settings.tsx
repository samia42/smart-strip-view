import { useState } from "react";
import { Button, Card, Container, Form } from "react-bootstrap";
import { DollarSign, Save } from "lucide-react";
import { toast } from "sonner";
import { currencyOptions, usePowerStrip } from "@/context/PowerStripContext";

const Settings = () => {
  const { costConfig, setCostConfig } = usePowerStrip();
  const [rate, setRate] = useState(costConfig.rate);
  const [currency, setCurrency] = useState(costConfig.currency);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setCostConfig({ rate, currency });
    toast.success("Energy cost settings saved");
  };

  return (
    <Container fluid>
      <div className="mb-4">
        <h1 className="text-white fw-bold mb-2">Settings</h1>
        <p className="text-muted">Configure your energy cost preferences</p>
      </div>

      <Card bg="dark" text="white" className="border-secondary" style={{ maxWidth: "520px" }}>
        <Card.Body>
          <Card.Title className="mb-4 d-flex align-items-center gap-2">
            <DollarSign className="text-primary" size={24} />
            Energy Cost Configuration
          </Card.Title>
          <Form onSubmit={handleSave}>
            <Form.Group className="mb-3">
              <Form.Label>Cost per kWh</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                value={rate}
                onChange={(event) => setRate(Number(event.target.value))}
                className="bg-secondary border-secondary text-white"
              />
              <Form.Text className="text-muted">
                Average electricity rate is around 0.15 per kWh
              </Form.Text>
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Currency</Form.Label>
              <Form.Select
                value={currency}
                onChange={(event) => setCurrency(event.target.value as "USD" | "EUR" | "GBP")}
                className="bg-secondary border-secondary text-white"
              >
                {currencyOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Button variant="primary" type="submit">
              <Save size={16} className="me-2" />
              Save Settings
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Settings;
