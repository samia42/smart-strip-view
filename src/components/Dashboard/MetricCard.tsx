import { Card } from "react-bootstrap";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "primary" | "success" | "warning" | "danger";
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const MetricCard = ({ title, value, subtitle, icon: Icon, variant = "primary", trend }: MetricCardProps) => {
  const variantColors = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  };

  return (
    <Card bg="dark" text="white" className="h-100 border-secondary">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <Card.Subtitle className="text-muted mb-2">{title}</Card.Subtitle>
            <Card.Title className="display-6 fw-bold mb-0">{value}</Card.Title>
            {subtitle && <small className="text-muted">{subtitle}</small>}
          </div>
          <div className={`${variantColors[variant]} opacity-75`}>
            <Icon size={40} />
          </div>
        </div>
        {trend && (
          <div className={`small ${trend.isPositive ? "text-success" : "text-danger"}`}>
            {trend.isPositive ? "↑" : "↓"} {trend.value}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default MetricCard;
