import { Container, Nav, Navbar } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import { Activity, Zap, AlertTriangle, Settings } from "lucide-react";

const Navigation = () => {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="border-bottom border-primary/20 mb-4">
      <Container fluid>
        <Navbar.Brand href="/" className="d-flex align-items-center gap-2 fw-bold">
          <Zap className="text-primary" size={28} />
          <span className="text-primary">Insight</span>
          <span className="text-muted ms-2 fs-6 fw-normal">Smart Power Strip</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <NavLink to="/" className="nav-link d-flex align-items-center gap-2">
              <Activity size={18} />
              Overview
            </NavLink>
            <NavLink to="/devices" className="nav-link d-flex align-items-center gap-2">
              <Zap size={18} />
              Device Monitoring
            </NavLink>
            <NavLink to="/alerts" className="nav-link d-flex align-items-center gap-2">
              <AlertTriangle size={18} />
              Risk & Alerts
            </NavLink>
            <NavLink to="/settings" className="nav-link d-flex align-items-center gap-2">
              <Settings size={18} />
              Settings
            </NavLink>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
