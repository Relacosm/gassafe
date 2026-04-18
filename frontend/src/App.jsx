import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import CustomerUI from "./pages/CustomerUI";
import DeliveryUI from "./pages/DeliveryUI";
import AdminUI from "./pages/AdminUI";
import "./main.css";

function Sidebar() {
  const loc = useLocation();
  const links = [
    { to: "/", label: "Customer", color: "#4ade80" },
    { to: "/delivery", label: "Delivery", color: "#60a5fa" },
    { to: "/admin", label: "Admin audit", color: "#a78bfa" },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-icon">⛽</div>
        <div>
          <div className="sidebar-name">GasSafe</div>
          <div className="sidebar-tag">AAEP v1.0</div>
        </div>
      </div>

      {links.map(l => (
        <Link key={l.to} to={l.to} className={`nav-item ${loc.pathname === l.to ? "active" : ""}`}>
          <span className="nav-dot" style={{ background: l.color }} />
          {l.label}
        </Link>
      ))}

      <div className="sidebar-footer">Sepolia testnet</div>
    </aside>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Sidebar />
        <main className="main">
          <Routes>
            <Route path="/" element={<CustomerUI />} />
            <Route path="/delivery" element={<DeliveryUI />} />
            <Route path="/admin" element={<AdminUI />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}