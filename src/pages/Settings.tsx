import { useMemo, useState } from "react";
import { Button, Container, Form } from "react-bootstrap";
import { DollarSign, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { currencyOptions, usePowerStrip } from "@/context/PowerStripContext";

const Settings = () => {
  const { costConfig, setCostConfig } = usePowerStrip();
  const [rate, setRate] = useState(costConfig.rate);
  const [currency, setCurrency] = useState(costConfig.currency);

  const selectedSymbol = useMemo(() => {
    return (
      currencyOptions.find((option) => option.code === currency)?.symbol ?? "$"
    );
  }, [currency]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setCostConfig({ rate, currency });
    toast.success("Settings saved successfully");
  };

  return (
    <Container fluid>
      <div className="mb-4">
        <h1 className="text-white fw-bold mb-2 mt-4">Settings</h1>
        <p className="text-slate-400">Configure your application preferences</p>
      </div>

      <div className="max-w-3xl">
        <div className="rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-[0_30px_80px_rgba(15,23,42,0.55)]">
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

          <Form onSubmit={handleSave} className="px-6 py-5">
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
                      onClick={() => setCurrency(option.code)}
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
                <DollarSign className="text-blue-400" size={16} />
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

            <div className="d-flex justify-content-end">
              <Button
                variant="primary"
                type="submit"
                className="px-4 py-2 fw-semibold shadow-lg"
              >
                <Save size={16} className="me-2" />
                Save Changes
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </Container>
  );
};

export default Settings;
