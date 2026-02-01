import { useMemo, useState, useEffect } from "react";
import { Button, Container, Form, Row, Col } from "react-bootstrap";
import { DollarSign, Save, Sparkles, Shield, Zap, Euro, PoundSterling } from "lucide-react";
import { toast } from "sonner";
import { currencyOptions, usePowerStrip } from "@/context/PowerStripContext";

const Settings = () => {
  const { costConfig, setCostConfig } = usePowerStrip();

  const [rate, setRate] = useState(costConfig.rate);
  const [currency, setCurrency] = useState(costConfig.currency);

  const [savedSafety, setSavedSafety] = useState(() => {
    const savedTotal = localStorage.getItem("safety_max_total");
    const savedSocket = localStorage.getItem("safety_max_socket");
    return {
      maxTotal: savedTotal ? parseFloat(savedTotal) : 16,
      maxSocket: savedSocket ? parseFloat(savedSocket) : 16
    };
  });
  
  const [maxTotalCurrent, setMaxTotalCurrent] = useState(savedSafety.maxTotal);
  const [maxSocketCurrent, setMaxSocketCurrent] = useState(savedSafety.maxSocket);

  useEffect(() => {
    setRate(costConfig.rate);
    setCurrency(costConfig.currency);
  }, [costConfig]);

  const isGeneralDirty = rate !== costConfig.rate || currency !== costConfig.currency;
  const isSafetyDirty = maxTotalCurrent !== savedSafety.maxTotal || maxSocketCurrent !== savedSafety.maxSocket;

  const selectedSymbol = useMemo(() => {
    return (
      currencyOptions.find((option) => option.code === currency)?.symbol ?? "$"
    );
  }, [currency]);

  const CurrencyIcon = useMemo(() => {
    switch (currency) {
      case "EUR": return Euro;
      case "GBP": return PoundSterling;
      default: return DollarSign;
    }
  }, [currency]);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    setCostConfig({ rate, currency });
    toast.success("General settings saved and applied");
  };

  const handleSaveSafety = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("safety_max_total", maxTotalCurrent.toString());
    localStorage.setItem("safety_max_socket", maxSocketCurrent.toString());
    setSavedSafety({ maxTotal: maxTotalCurrent, maxSocket: maxSocketCurrent });
    toast.success("Safety thresholds saved successfully");
  };

  return (
    <Container fluid>
      <div className="mb-4">
        <h1 className="text-white fw-bold mb-2 mt-4">Settings</h1>
        <p className="text-slate-400">Configure your application preferences</p>
      </div>

      <Row className="g-4">
        <Col lg={6} className="d-flex">
          <div className="w-100 rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-[0_30px_80px_rgba(15,23,42,0.55)] d-flex flex-column">
            <div className="border-b border-slate-800/60 px-6 py-5">
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex h-10 w-10 align-items-center justify-content-center rounded-full bg-blue-500/10 text-blue-400">
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="text-white fw-semibold">
                    General Configuration
                  </div>
                  <div className="text-slate-400 small">
                    Manage currency symbols and electricity costs used for
                    calculations.
                  </div>
                </div>
              </div>
            </div>

            <Form onSubmit={handleSaveGeneral} className="px-6 py-5 d-flex flex-column flex-grow-1">
              <div className="flex-grow-1">
                <div className="mb-4">
                  <div className="text-slate-300 small fw-semibold mb-2">
                    Currency Symbol
                  </div>
                  <div className="d-flex flex-wrap gap-3">
                    {currencyOptions.map((option) => {
                      const isActive = option.code === currency;
                      return (
                        <button
                          key={option.code}
                          type="button"
                          onClick={() => setCurrency(option.code as "USD" | "EUR" | "GBP")}
                          className={
                            "flex-grow-1 rounded-3 border px-4 py-3 text-center fw-semibold transition-all " +
                            (isActive
                              ? "border-blue-500 bg-blue-500/15 text-blue-300 shadow-[0_0_24px_rgba(59,130,246,0.35)]"
                              : "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500 hover:text-white")
                          }
                          style={{ minWidth: "110px" }}
                        >
                          {option.symbol}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="text-slate-300 small fw-semibold">
                      Energy Cost (per kWh)
                    </div>
                    <div className="text-slate-500 small">
                      Used to estimate monthly costs
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3 rounded-3 border border-slate-700 bg-slate-900/60 px-4 py-3">
                    <CurrencyIcon className="text-blue-400" size={16} />
                    <Form.Control
                      type="number"
                      step="0.01"
                      value={rate}
                      onChange={(event) => setRate(Number(event.target.value))}
                      className="bg-transparent border-0 text-white p-0"
                      style={{ maxWidth: "120px" }}
                    />
                    <div className="ms-auto text-slate-400">
                      {selectedSymbol}/kWh
                    </div>
                  </div>
                  <div className="text-slate-500 small mt-2">
                    Current average price: 0.15 - 0.25 {selectedSymbol} depending on
                    your region.
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <Button
                  variant={isGeneralDirty ? "primary" : "secondary"}
                  type="submit"
                  disabled={!isGeneralDirty}
                  className={`w-100 py-2 fw-semibold shadow-lg transition-all ${!isGeneralDirty ? 'opacity-50 border-slate-700 bg-slate-800 text-slate-400' : ''}`}
                >
                  <Save size={16} className="me-2" />
                  {isGeneralDirty ? "Save General Settings" : "Save General Settings"}
                </Button>
              </div>
            </Form>
          </div>
        </Col>

        <Col lg={6} className="d-flex">
          <div className="w-100 rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-[0_30px_80px_rgba(15,23,42,0.55)] d-flex flex-column">
            <div className="border-b border-slate-800/60 px-6 py-5">
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex h-10 w-10 align-items-center justify-content-center rounded-full bg-red-500/10 text-red-400">
                  <Shield size={18} />
                </div>
                <div>
                  <div className="text-white fw-semibold">
                    Safety Thresholds
                  </div>
                  <div className="text-slate-400 small">
                    Configure maximum current limits for overload protection.
                  </div>
                </div>
              </div>
            </div>

            <Form onSubmit={handleSaveSafety} className="px-6 py-5 d-flex flex-column flex-grow-1">
              <div className="flex-grow-1">
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="text-slate-300 small fw-semibold">
                      Max Total Current
                    </div>
                    <div className="text-slate-500 small">
                      Total strip limit (0A - 16A)
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3 rounded-3 border border-slate-700 bg-slate-900/60 px-4 py-3">
                    <Zap className="text-red-400" size={16} />
                    <Form.Control
                      type="number"
                      min="0"
                      max="16"
                      step="0.5"
                      value={maxTotalCurrent}
                      onChange={(event) => setMaxTotalCurrent(Number(event.target.value))}
                      className="bg-transparent border-0 text-white p-0"
                      style={{ maxWidth: "120px" }}
                    />
                    <div className="ms-auto text-slate-400">
                      Amperes (A)
                    </div>
                  </div>
                  <Form.Range 
                    min="0"
                    max="16"
                    step="0.5"
                    value={maxTotalCurrent}
                    onChange={(e) => setMaxTotalCurrent(Number(e.target.value))}
                    className="mt-3 w-100"
                    style={{ accentColor: 'gray' }}
                  />
                </div>

                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="text-slate-300 small fw-semibold">
                      Max Current per Socket
                    </div>
                    <div className="text-slate-500 small">
                      Single socket limit (0A - 16A)
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3 rounded-3 border border-slate-700 bg-slate-900/60 px-4 py-3">
                    <Zap className="text-orange-400" size={16} />
                    <Form.Control
                      type="number"
                      min="0"
                      max="16"
                      step="0.5"
                      value={maxSocketCurrent}
                      onChange={(event) => setMaxSocketCurrent(Number(event.target.value))}
                      className="bg-transparent border-0 text-white p-0"
                      style={{ maxWidth: "120px" }}
                    />
                    <div className="ms-auto text-slate-400">
                      Amperes (A)
                    </div>
                  </div>
                  <Form.Range 
                    min="0"
                    max="16"
                    step="0.5"
                    value={maxSocketCurrent}
                    onChange={(e) => setMaxSocketCurrent(Number(e.target.value))}
                    className="mt-3 w-100"
                    style={{ accentColor: 'gray' }}
                  />
                </div>
              </div>

              <div className="mt-4">
                <Button
                  variant={isSafetyDirty ? "primary" : "secondary"}
                  type="submit"
                  disabled={!isSafetyDirty}
                  className={`w-100 py-2 fw-semibold shadow-lg transition-all ${!isSafetyDirty ? 'opacity-50 border-slate-700 bg-slate-800 text-slate-400' : ''}`}
                >
                  <Save size={16} className="me-2" />
                  {isSafetyDirty ? "Save Safety Thresholds" : "Save Safety Thresholds"}
                </Button>
              </div>
            </Form>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Settings;