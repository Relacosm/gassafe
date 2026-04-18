import { useState, useEffect } from "react";
import axios from "axios";
import { Truck, Fingerprint, CheckCircle, AlertCircle, Calendar, Link, Activity, ShieldCheck, UserCheck } from "lucide-react";

const API = "http://localhost:3001/api";

export default function DeliveryUI() {
  const [deliveries, setDeliveries] = useState([]);
  const [selected, setSelected] = useState(null);
  const [proofData, setProofData] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [agentAddress] = useState("0xacc1f6E32dB61CB6d48FB752ED28E15EA48A4aD6");

  function load() {
    axios.get(`${API}/deliveries/pending`).then(r => setDeliveries(r.data.bookings)).catch(() => {});
  }

  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, []);

  function tierInfo(t) {
    if (t === 0) return { label: "LOW RISK", color: "var(--brand-primary)", bg: "var(--brand-primary-soft)", border: "var(--brand-primary-border)", proof: "OTP Verification", hint: "Standard verification: Request 6-digit OTP from customer." };
    if (t === 1) return { label: "MEDIUM RISK", color: "var(--warning)", bg: "var(--warning-soft)", border: "var(--warning-border)", proof: "Photo Evidence", hint: "Elevated risk: Upload photo of cylinder installation at premises." };
    return { label: "HIGH RISK", color: "var(--danger)", bg: "var(--danger-soft)", border: "var(--danger-border)", proof: "Biometric Face Auth", hint: "Critical risk: Live face authentication required via UIDAI portal." };
  }

  async function confirm(booking) {
    if (!proofData.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res = await axios.post(`${API}/deliver`, {
        bookingId: booking.bookingId,
        proofType: booking.riskTier === 0 ? "OTP" : booking.riskTier === 1 ? "PHOTO" : "FACE_AUTH",
        proofData,
        agentAddress,
        agentLat: 18.5204, agentLon: 73.8567
      });
      setResult(res.data);
      if (res.data.success) { setSelected(null); setProofData(""); load(); }
    } catch (e) {
      setResult({ success: false, error: e.response?.data?.error || e.message });
    }
    setLoading(false);
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Fulfillment Center</h1>
        <p className="page-sub">Tiered verification workflow for secure gas asset distribution.</p>
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: '6px' }}>
            <UserCheck size={14} color="var(--brand-primary)" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Agent ID: {agentAddress.slice(0, 10)}...</span>
          </div>
        </div>
      </div>

      {result && (
        <div className="card" style={{ background: result.success ? "var(--success-soft)" : "var(--danger-soft)", borderColor: result.success ? "var(--success-border)" : "var(--danger-border)", marginBottom: 32 }}>
          {result.success ? (
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <ShieldCheck size={24} color="var(--success)" />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--success)', marginBottom: '4px' }}>Subsidy Release Authorized</div>
                <div className="mono" style={{ fontSize: '11px', background: 'white' }}>Tx Hash: {result.releaseTxHash}</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', color: 'var(--danger)' }}>
              <AlertCircle size={24} />
              <div>{result.error}</div>
            </div>
          )}
        </div>
      )}

      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Truck size={18} color="var(--text-tertiary)" />
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Pending Distributions ({deliveries.length})</span>
      </div>

      {deliveries.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 80, background: 'var(--bg-secondary)', borderStyle: 'dashed' }}>
          <div style={{ color: "var(--text-tertiary)", marginBottom: 16 }}>
            <Truck size={48} strokeWidth={1} />
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: 16, fontWeight: 600 }}>Operational Queue Empty</div>
          <div style={{ color: "var(--text-tertiary)", fontSize: 13, marginTop: 4 }}>System is monitoring for new bookings on Hela Testnet.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {deliveries.map(b => {
            const ti = tierInfo(b.riskTier);
            const isOpen = selected?.bookingId === b.bookingId;
            return (
              <div key={b.bookingId} className="card" style={{ borderLeft: `6px solid ${ti.color}`, transition: 'all 0.3s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>Ref: {b.bookingId.slice(0, 16)}...</div>
                    <div className="mono" style={{ fontSize: '11px' }}>Recipient: {b.walletAddress}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: ti.color }}>{b.fraudScore}</div>
                        <div style={{ fontSize: 9, color: "var(--text-tertiary)", fontWeight: 700, textTransform: 'uppercase' }}>Fraud Index</div>
                      </div>
                      <span className="badge" style={{ background: ti.bg, color: ti.color, border: `1px solid ${ti.border}` }}>{ti.label}</span>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', borderRadius: "var(--radius-md)", padding: "16px", border: '1px solid var(--border-primary)', marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Fingerprint size={16} color={ti.color} />
                    <div style={{ fontSize: 13, fontWeight: 700, color: ti.color, textTransform: 'uppercase' }}>{ti.proof} REQUIRED</div>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{ti.hint}</div>
                </div>

                <div style={{ display: 'flex', gap: '20px', marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)', fontSize: '12px' }}>
                    <Calendar size={14} />
                    {new Date(b.createdAt).toLocaleString()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)', fontSize: '12px' }}>
                    <Link size={14} />
                    Escrow: {b.escrowTxHash?.slice(0, 12)}...
                  </div>
                </div>

                {!isOpen ? (
                  <button className="btn btn-primary" onClick={() => { setSelected(b); setProofData(""); setResult(null); }} style={{ width: '100%', padding: '16px' }}>
                    Initialize Verification Sequence
                  </button>
                ) : (
                  <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 24 }}>
                    <div className="form-group">
                      <label className="label">Verification Evidence Payload</label>
                      {b.riskTier === 0 && <input className="input" placeholder="Input 6-digit OTP provided by recipient" value={proofData} onChange={e => setProofData(e.target.value)} />}
                      {b.riskTier === 1 && <input className="input" placeholder="IPFS CID of installation photograph" value={proofData} onChange={e => setProofData(e.target.value)} />}
                      {b.riskTier === 2 && <input className="input" placeholder="UIDAI Biometric Transaction ID" value={proofData} onChange={e => setProofData(e.target.value)} />}
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button className="btn btn-primary" onClick={() => confirm(b)} disabled={loading || !proofData.trim()} style={{ flex: 1 }}>
                        {loading ? <Activity size={18} className="spin" /> : <ShieldCheck size={18} />}
                        {loading ? "Confirming Proof..." : "Verify & Release Escrow"}
                      </button>
                      <button className="btn btn-outline" onClick={() => setSelected(null)}>Abort</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}