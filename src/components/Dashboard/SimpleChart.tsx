import { Card } from "react-bootstrap";

interface DataPoint {
  label: string;
  value: number;
}

interface SimpleChartProps {
  title: string;
  data: DataPoint[];
  unit?: string;
}

const SimpleChart = ({ title, data, unit = "W" }: SimpleChartProps) => {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <Card bg="dark" text="white" className="border-secondary">
      <Card.Body>
        <Card.Title className="mb-4">{title}</Card.Title>
        <div className="d-flex align-items-end gap-2" style={{ height: "200px" }}>
          {data.map((point, index) => {
            const height = (point.value / maxValue) * 100;
            return (
              <div key={index} className="flex-fill d-flex flex-column align-items-center">
                <div className="w-100 d-flex flex-column justify-content-end" style={{ height: "160px" }}>
                  <div
                    className="bg-primary rounded-top w-100 position-relative"
                    style={{ height: `${height}%`, minHeight: "2px" }}
                  >
                    <span
                      className="position-absolute top-0 start-50 translate-middle-x text-white small fw-bold"
                      style={{ marginTop: "-20px" }}
                    >
                      {point.value}
                      {unit}
                    </span>
                  </div>
                </div>
                <small className="text-muted mt-2">{point.label}</small>
              </div>
            );
          })}
        </div>
      </Card.Body>
    </Card>
  );
};

export default SimpleChart;
