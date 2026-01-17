import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";
import { Save, DollarSign, Zap, Bell, Shield } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

const Settings = () => {
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem("app_currency") || "€";
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Settings saved successfully");

    localStorage.setItem("app_currency", currency);

    toast.success(`Settings saved: Currency set to ${currency}`);
  };


  return (
    <Container fluid>
      <div className="mb-4">
        <h1 className="text-white fw-bold mb-2">Settings</h1>
        <p className="text-muted">Configure your smart power strip preferences</p>
      </div>

      <Row className="g-4">
        <Col lg={6}>
          <Card bg="dark" text="white" className="border-secondary mb-4">
            <Card.Body>
              <Card.Title className="mb-4 d-flex align-items-center gap-2">
                <DollarSign className="text-primary" size={24} />
                Energy Cost Configuration
              </Card.Title>
              <Form onSubmit={handleSave}>
                <Form.Group className="mb-3">
                  <Form.Label>Cost per kWh (EUR)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    defaultValue="0.15"
                    className="bg-secondary border-secondary text-white"
                  />
                  <Form.Text className="text-muted">
                    Average US electricity rate is $0.15 per kWh
                  </Form.Text>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Currency</Form.Label>
                  <Form.Select 
                    className="bg-secondary border-secondary text-white" 
                    value={currency} 
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    <option value="€">EUR (€)</option>
                    <option value="$">USD ($)</option>
                    <option value="£">GBP (£)</option>
                  </Form.Select>
                </Form.Group>
                <Button variant="primary" type="submit">
                  <Save size={16} className="me-2" />
                  Save Settings
                </Button>
              </Form>
            </Card.Body>
          </Card>

          <Card bg="dark" text="white" className="border-secondary">
            <Card.Body>
              <Card.Title className="mb-4 d-flex align-items-center gap-2">
                <Bell className="text-warning" size={24} />
                Notification Preferences
              </Card.Title>
              <Form>
                <Form.Check
                  type="switch"
                  id="critical-alerts"
                  label="Critical Temperature Alerts"
                  defaultChecked
                  className="mb-3 text-white"
                />
                <Form.Check
                  type="switch"
                  id="cost-alerts"
                  label="High Cost Notifications"
                  defaultChecked
                  className="mb-3 text-white"
                />
                <Form.Check
                  type="switch"
                  id="efficiency-tips"
                  label="Energy Efficiency Tips"
                  defaultChecked
                  className="mb-3 text-white"
                />
                <Form.Check
                  type="switch"
                  id="daily-summary"
                  label="Daily Usage Summary"
                  className="mb-3 text-white"
                />
                <Button variant="primary" onClick={handleSave}>
                  <Save size={16} className="me-2" />
                  Save Preferences
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card bg="dark" text="white" className="border-secondary mb-4">
            <Card.Body>
              <Card.Title className="mb-4 d-flex align-items-center gap-2">
                <Zap className="text-primary" size={24} />
                Device Configuration
              </Card.Title>
              <Form onSubmit={handleSave}>
                <Form.Group className="mb-3">
                  <Form.Label>Socket 1 Device Name</Form.Label>
                  <Form.Control
                    type="text"
                    defaultValue="Living Room TV"
                    className="bg-secondary border-secondary text-white"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Socket 2 Device Name</Form.Label>
                  <Form.Control
                    type="text"
                    defaultValue="Gaming Console"
                    className="bg-secondary border-secondary text-white"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Socket 3 Device Name</Form.Label>
                  <Form.Control
                    type="text"
                    defaultValue="Sound System"
                    className="bg-secondary border-secondary text-white"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Socket 4 Device Name</Form.Label>
                  <Form.Control
                    type="text"
                    defaultValue="Phone Charger"
                    className="bg-secondary border-secondary text-white"
                  />
                </Form.Group>
                <Button variant="primary" type="submit">
                  <Save size={16} className="me-2" />
                  Update Device Names
                </Button>
              </Form>
            </Card.Body>
          </Card>

          <Card bg="dark" text="white" className="border-secondary">
            <Card.Body>
              <Card.Title className="mb-4 d-flex align-items-center gap-2">
                <Shield className="text-success" size={24} />
                Safety Thresholds
              </Card.Title>
              <Form onSubmit={handleSave}>
                <Form.Group className="mb-3">
                  <Form.Label>Critical Temperature (°C)</Form.Label>
                  <Form.Control
                    type="number"
                    defaultValue="55"
                    className="bg-secondary border-secondary text-white"
                  />
                  <Form.Text className="text-muted">
                    Alert triggered when temperature exceeds this value
                  </Form.Text>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Warning Temperature (°C)</Form.Label>
                  <Form.Control
                    type="number"
                    defaultValue="45"
                    className="bg-secondary border-secondary text-white"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Maximum Power per Socket (W)</Form.Label>
                  <Form.Control
                    type="number"
                    defaultValue="1800"
                    className="bg-secondary border-secondary text-white"
                  />
                </Form.Group>
                <Button variant="primary" type="submit">
                  <Save size={16} className="me-2" />
                  Update Thresholds
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Settings;
