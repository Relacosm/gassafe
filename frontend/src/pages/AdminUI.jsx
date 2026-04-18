import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:3001/api";

function StatGrid({ stats }) {
  if (!stats) return null;
  const items = [
    { val: stats.totalUsers, lbl: "Users", color: "var(--green)" },
    { val: stats.totalBookings, lbl: "Bookings", color: "var(--blue)" },
    { val: stats.pendingBookings, lbl: "Pending", color: "var(--amber)" },
    { val: stats.deliveredBookings, lbl: "Delivered", color: "var(--green)" },
    { val: stats.redBookings, lbl: "Red zone", color: "var(--red)" },
    { val: stats.totalDLEs, lbl: "Audit entries", color: "var(--purple)" },
  ];
  return (
    <div className="stat-grid" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
      {items.map(i => (
        <div className="stat-card" key={i.lbl}>
          <div className="stat-val" style={{ color: i.color }}>{i.val ?? 0}</div>
          <div className="stat-lbl">{i.lbl}</div>
        </div>
      ))}
    </div>
  );
}

function DLERow({ dle, onOverride }) {
  const [open, setOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [overriding, setOverriding] = useState(false);

  const isBooking = dle.agent_id === "booking-agent";
  const agentColor = isBooking ? "var(--blue)" : "var(--purple)";
  const agentBg = isBooking ? "var(--blue-bg)" : "var(--purple-bg)";
  const agentBorder = isBooking ? "var(--blue-border)" : "var(--purple-border)";

  async function submitOverride() {
    setOverriding(true);
    await onOverride(dle.dle_id, overrideReason);
    setOverriding(false);
    setOverrideReason("");
  }

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", marginBottom: 6, overflow: "hidden" }}>
      <div
        style={{ padding: "9px 12px", cursor: "pointer", display: "flex", gap: 10, alignItems: "center", background: open ? "var(--bg3)" : "transparent" }}
        onClick={() => setOpen(!open)}
      >
        <span style={{ background: agentBg, color: agentColor, border: `1px solid ${agentBorder}`, fontSize: 10, fontWeight: 500, padding: "2px 7px", borderRadius: 99, whiteSpace: "nowrap", fontFamily: "DM Mono, monospace" }}>
          {dle.agent_id}
        </span>
        <span style={{ fontWeight: 500, fontSize: 12, flex: 1, color: "var(--text)" }}>{dle.decision_type}</span>
        {dle.override_history?.length > 0 && <span className="badge badge-yellow">overridden</span>}
        <span className="mono" style={{ fontSize: 10 }}>{new Date(dle.timestamp).toLocaleTimeString()}</span>
        <span style={{ color: "var(--text3)", fontSize: 10 }}>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div style={{ padding: 14, background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
          <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: 10, marginBottom: 10, fontSize: 12, lineHeight: 1.7, color: "var(--text2)" }}>
            {dle.reasoning?.summary}
          </div>

          {dle.reasoning?.factors?.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              {dle.reasoning.factors.map(f => (
                <div key={f.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <span style={{ fontSize: 11, minWidth: 160, color: "var(--text2)" }}>{f.name}</span>
                  <div style={{ flex: 1, background: "var(--bg3)", borderRadius: 2, height: 3 }}>
                    <div style={{ width: `${Math.min(f.contribution, 100)}%`, height: "100%", background: f.contribution > 30 ? "var(--red)" : "var(--green)", borderRadius: 2 }} />
                  </div>
                  <span className="mono" style={{ minWidth: 24 }}>{f.contribution}</span>
                </div>
              ))}
            </div>
          )}

          <details style={{ marginBottom: 10 }}>
            <summary style={{ cursor: "pointer", fontSize: 11, color: "var(--text2)", marginBottom: 5 }}>output json</summary>
            <pre style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: 10, fontSize: 11, color: "var(--text2)", overflow: "auto", maxHeight: 180, fontFamily: "DM Mono, monospace" }}>
              {JSON.stringify(dle.output, null, 2)}
            </pre>
          </details>

          <div className="row" style={{ marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
            <span className="mono" style={{ fontSize: 10 }}>dle: {dle.dle_id?.slice(0, 16)}...</span>
            <span className="mono" style={{ fontSize: 10 }}>trace: {dle.trace_id?.slice(0, 16)}...</span>
            {dle.onchain_tx && <span className="mono" style={{ fontSize: 10, color: "var(--blue)" }}>tx: {dle.onchain_tx?.slice(0, 18)}...</span>}
            <span className="mono" style={{ fontSize: 10 }}>confidence: {(dle.confidence * 100).toFixed(0)}%</span>
          </div>

          {dle.override_history?.length > 0 && (
            <div style={{ background: "var(--amber-bg)", border: "1px solid var(--amber-border)", borderRadius: "var(--radius-sm)", padding: 10, marginBottom: 10 }}>
              {dle.override_history.map(o => (
                <div key={o.override_id} style={{ fontSize: 12, color: "var(--amber)" }}>
                  {o.challenged_by} — "{o.reason}" — {new Date(o.timestamp).toLocaleString()}
                </div>
              ))}
            </div>
          )}

          {dle.overrideable && (
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }}>
              <label className="label">Admin override</label>
              <div className="row">
                <input className="input" style={{ marginBottom: 0, flex: 1 }} placeholder="Reason for override..." value={overrideReason} onChange={e => setOverrideReason(e.target.value)} />
                <button className="btn btn-red" onClick={submitOverride} disabled={overriding || !overrideReason.trim()}>
                  {overriding ? "..." : "Override"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminUI() {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [audit, setAudit] = useState({ entries: [], total: 0, merkleRoot: "" });
  const [traceSearch, setTraceSearch] = useState("");
  const [traceResult, setTraceResult] = useState(null);
  const [anchoring, setAnchoring] = useState(false);
  const [anchorResult, setAnchorResult] = useState(null);
  const [filter, setFilter] = useState("ALL");

  function loadAll() {
    axios.get(`${API}/stats`).then(r => setStats(r.data)).catch(() => {});
    axios.get(`${API}/audit`).then(r => setAudit(r.data)).catch(() => {});
  }

  useEffect(() => { loadAll(); const t = setInterval(loadAll, 10000); return () => clearInterval(t); }, []);

  async function searchTrace() {
    if (!traceSearch.trim()) return;
    const res = await axios.get(`${API}/audit/${traceSearch.trim()}`);
    setTraceResult(res.data);
  }

  async function override(dleId, reason) {
    await axios.post(`${API}/override/${dleId}`, { challengedBy: "admin", reason });
    loadAll();
  }

  async function anchorRoot() {
    setAnchoring(true);
    try {
      const res = await axios.post(`${API}/audit/anchor`);
      setAnchorResult(res.data);
    } catch (e) {}
    setAnchoring(false);
    loadAll();
  }

  const filteredEntries = audit.entries
    .filter(d => filter === "ALL" || d.agent_id === filter || d.decision_type.includes(filter))
    .slice()
    .reverse();

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Admin audit</div>
        <div className="page-sub">Full decision transparency — AAEP protocol.</div>
      </div>

      <StatGrid stats={stats} />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row-between">
          <div>
            <label className="label">Merkle root</label>
            <div className="mono">{audit.merkleRoot || "No entries yet"}</div>
            {stats?.contractConfig && (
              <div className="mono" style={{ marginTop: 4, color: "var(--blue)", fontSize: 10 }}>
                contract: {stats.contractConfig.contractAddress}
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <button className="btn btn-purple" onClick={anchorRoot} disabled={anchoring}>
              {anchoring ? <><span className="spin">⏳</span> Anchoring...</> : "Anchor root onchain"}
            </button>
            {anchorResult && (
              <div className="mono" style={{ fontSize: 10, color: "var(--green)" }}>
                anchored: {anchorResult.txHash?.slice(0, 22)}...
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="tab-row">
        <button className={`tab ${tab === "overview" ? "active" : ""}`} onClick={() => setTab("overview")}>All decisions</button>
        <button className={`tab ${tab === "trace" ? "active" : ""}`} onClick={() => setTab("trace")}>Trace search</button>
      </div>

      {tab === "overview" && (
        <div className="card">
          <div className="row-between" style={{ marginBottom: 12 }}>
            <div className="card-title" style={{ marginBottom: 0 }}>Decision log ({filteredEntries.length})</div>
            <div className="row" style={{ gap: 4 }}>
              {["ALL", "booking-agent", "scoring-agent", "FRAUD_SCORE", "BOOKING_CREATED"].map(f => (
                <button key={f} className={`tab ${filter === f ? "active" : ""}`} style={{ padding: "3px 8px", fontSize: 10 }} onClick={() => setFilter(f)}>{f}</button>
              ))}
            </div>
          </div>
          {filteredEntries.length === 0
            ? <div style={{ textAlign: "center", color: "var(--text3)", padding: 40, fontSize: 13 }}>No audit entries yet.</div>
            : filteredEntries.map(d => <DLERow key={d.dle_id} dle={d} onOverride={override} />)
          }
        </div>
      )}

      {tab === "trace" && (
        <div className="card">
          <div className="card-title">Trace ID lookup</div>
          <div className="row">
            <input className="input" style={{ marginBottom: 0, flex: 1 }} placeholder="Paste trace_id..." value={traceSearch} onChange={e => setTraceSearch(e.target.value)} />
            <button className="btn btn-purple" onClick={searchTrace}>Search</button>
          </div>
          {traceResult && (
            <div style={{ marginTop: 14 }}>
              <div className="alert alert-info" style={{ marginBottom: 10 }}>Found {traceResult.total} decision(s)</div>
              {traceResult.entries.map(d => <DLERow key={d.dle_id} dle={d} onOverride={override} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}