import { useState, useEffect } from "react";
import axios from "axios";
import { Users, Package, Clock, CheckCircle, AlertTriangle, FileText, Anchor, Search, ChevronDown, Activity, ExternalLink, ShieldAlert } from "lucide-react";

const API = "http://localhost:3001/api";

function StatGrid({ stats }) {
  if (!stats) return null;
  const items = [
    { val: stats.totalUsers, lbl: "Identified Users", color: "var(--brand-primary)", icon: Users },
    { val: stats.totalBookings, lbl: "Total Requests", color: "var(--brand-primary)", icon: Package },
    { val: stats.pendingBookings, lbl: "Awaiting Action", color: "var(--warning)", icon: Clock },
    { val: stats.deliveredBookings, lbl: "Fulfilled", color: "var(--brand-primary)", icon: CheckCircle },
    { val: stats.redBookings, lbl: "High Risk Flags", color: "var(--danger)", icon: AlertTriangle },
    { val: stats.totalDLEs, lbl: "Audit Records", color: "var(--accent)", icon: FileText },
  ];
  return (
    <div className="stat-grid">
      {items.map(i => (
        <div className="stat-card" key={i.lbl}>
          <div style={{ color: i.color, marginBottom: '12px' }}>
            <i.icon size={24} />
          </div>
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

  async function submitOverride() {
    setOverriding(true);
    await onOverride(dle.dle_id, overrideReason);
    setOverriding(false);
    setOverrideReason("");
  }

  return (
    <div className="panel">
      <div className="panel-header" onClick={() => setOpen(!open)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <span className="badge badge-blue" style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
            {dle.agent_id}
          </span>
          <span style={{ fontWeight: 600, fontSize: '14px' }}>{dle.decision_type}</span>
          {dle.override_history?.length > 0 && (
            <span className="badge badge-yellow" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldAlert size={12} />
              Manual Override
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span className="mono" style={{ fontSize: '11px' }}>{new Date(dle.timestamp).toLocaleTimeString()}</span>
          <ChevronDown size={16} style={{ color: "var(--text-tertiary)", transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }} />
        </div>
      </div>

      {open && (
        <div className="panel-content">
          <div style={{ background: "white", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-sm)", padding: "20px", marginBottom: "24px" }}>
            <div style={{ fontWeight: 700, fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Analysis Conclusion</div>
            <div style={{ fontSize: '15px', lineHeight: 1.6, color: "var(--text-primary)" }}>
              {dle.reasoning?.summary}
            </div>
          </div>

          {dle.reasoning?.factors?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 700, fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Weighted Risk Factors</div>
              {dle.reasoning.factors.map(f => (
                <div key={f.name} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{f.name}</span>
                    <span className="mono" style={{ fontSize: 11 }}>{f.contribution}% impact</span>
                  </div>
                  <div className="score-bar" style={{ background: 'var(--bg-tertiary)' }}>
                    <div className="score-fill" style={{ width: `${Math.min(f.contribution, 100)}%`, background: f.contribution > 30 ? "var(--danger)" : "var(--brand-primary)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: 24 }}>
            <div className="mono" style={{ fontSize: 10 }}>DLE UID: {dle.dle_id?.slice(0, 16)}...</div>
            <div className="mono" style={{ fontSize: 10 }}>Session: {dle.trace_id?.slice(0, 16)}...</div>
            {dle.onchain_tx && (
              <a href="#" className="mono" style={{ fontSize: 10, color: "var(--brand-primary)", textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Onchain Proof <ExternalLink size={10} />
              </a>
            )}
            <span className="badge badge-blue" style={{ fontSize: 10, borderRadius: '4px' }}>Confidence Index: {(dle.confidence * 100).toFixed(0)}%</span>
          </div>

          <details style={{ marginBottom: 24 }}>
            <summary style={{ cursor: "pointer", fontSize: 12, color: "var(--brand-primary)", fontWeight: 600 }}>Inspection Data Payload</summary>
            <pre className="mono" style={{ marginTop: 12, padding: 16, maxHeight: 250, overflow: 'auto', background: 'white', border: '1px solid var(--border-primary)', fontSize: '11px' }}>
              {JSON.stringify(dle.output, null, 2)}
            </pre>
          </details>

          {dle.override_history?.length > 0 && (
            <div style={{ background: "var(--warning-soft)", border: "1px solid var(--warning-border)", borderRadius: "var(--radius-sm)", padding: 16, marginBottom: 24 }}>
              <div style={{ fontWeight: 700, fontSize: '11px', color: "var(--warning)", marginBottom: '8px', textTransform: 'uppercase' }}>Audit Override History</div>
              {dle.override_history.map(o => (
                <div key={o.override_id} style={{ fontSize: 13, marginBottom: '4px' }}>
                  <strong>{o.challenged_by}</strong>: "{o.reason}" <span style={{ opacity: 0.5, fontSize: '11px' }}>— {new Date(o.timestamp).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {dle.overrideable && (
            <div style={{ borderTop: "1px solid var(--border-primary)", paddingTop: 24 }}>
              <label className="label">Authorized Override Control</label>
              <div style={{ display: 'flex', gap: '16px' }}>
                <input className="input" style={{ flex: 1 }} placeholder="Enter formal justification for record override..." value={overrideReason} onChange={e => setOverrideReason(e.target.value)} />
                <button className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={submitOverride} disabled={overriding || !overrideReason.trim()}>
                  {overriding ? <Activity size={16} className="spin" /> : <ShieldAlert size={16} />}
                  Execute Override
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
        <h1 className="page-title">Compliance Dashboard</h1>
        <p className="page-sub">Cryptographic verification of AAEP protocol decisions and state consistency.</p>
      </div>

      <StatGrid stats={stats} />

      <div className="card" style={{ borderTop: '4px solid var(--brand-primary)', background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '32px' }}>
          <div style={{ flex: 1 }}>
            <label className="label">Protocol State Root (Merkle)</label>
            <div className="mono" style={{ fontSize: '14px', padding: '12px', background: 'white', border: '1px solid var(--border-primary)' }}>{audit.merkleRoot || "Syncing state root..."}</div>
            {stats?.contractConfig && (
              <div style={{ marginTop: 12 }}>
                <span className="badge badge-blue" style={{ fontSize: '10px', background: 'white' }}>Oracle: {stats.contractConfig.contractAddress}</span>
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <button className="btn btn-primary" onClick={anchorRoot} disabled={anchoring}>
              {anchoring ? <Activity size={18} className="spin" /> : <Anchor size={18} />}
              Anchor State Onchain
            </button>
            {anchorResult && (
              <div className="mono" style={{ marginTop: 12, fontSize: 10, color: "var(--brand-primary)" }}>
                Proof Tx: {anchorResult.txHash?.slice(0, 32)}...
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="tab-row" style={{ marginTop: '48px' }}>
        <button className={`tab ${tab === "overview" ? "active" : ""}`} onClick={() => setTab("overview")}>Decision Logs</button>
        <button className={`tab ${tab === "trace" ? "active" : ""}`} onClick={() => setTab("trace")}>Session Trace</button>
      </div>

      {tab === "overview" && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div className="card-title" style={{ marginBottom: 0 }}>
              <FileText size={20} className="sidebar-logo" />
              Audit Trail ({filteredEntries.length})
            </div>
            <div className="tab-row" style={{ margin: 0, border: 'none', gap: '8px' }}>
              {["ALL", "booking-agent", "scoring-agent"].map(f => (
                <button 
                  key={f} 
                  className={`tab ${filter === f ? "active" : ""}`} 
                  style={{ padding: "8px 12px", fontSize: '13px' }} 
                  onClick={() => setFilter(f)}
                >
                  {f === "ALL" ? "All Activity" : f.split('-')[0]}
                </button>
              ))}
            </div>
          </div>
          {filteredEntries.length === 0
            ? <div style={{ textAlign: "center", color: "var(--text-tertiary)", padding: 80, fontSize: 16 }}>Initializing decision monitoring...</div>
            : filteredEntries.map(d => <DLERow key={d.dle_id} dle={d} onOverride={override} />)
          }
        </div>
      )}

      {tab === "trace" && (
        <div className="card">
          <div className="card-title">
            <Search size={20} className="sidebar-logo" />
            Forensic Investigation
          </div>
          <div style={{ display: 'flex', gap: '16px', marginBottom: 32 }}>
            <input className="input" style={{ flex: 1 }} placeholder="Enter Session / Trace ID for granular analysis..." value={traceSearch} onChange={e => setTraceSearch(e.target.value)} />
            <button className="btn btn-primary" onClick={searchTrace}>
              <Activity size={18} />
              Execute Query
            </button>
          </div>
          {traceResult && (
            <div>
              <div style={{ background: 'var(--success-soft)', padding: '16px', borderRadius: '8px', color: 'var(--brand-primary)', marginBottom: 24, display: 'flex', gap: '8px', alignItems: 'center' }}>
                <CheckCircle size={18} />
                Found {traceResult.total} related decision events.
              </div>
              {traceResult.entries.map(d => <DLERow key={d.dle_id} dle={d} onOverride={override} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}