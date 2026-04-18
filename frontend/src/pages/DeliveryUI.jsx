import { useState, useEffect } from "react";
import axios from "axios";

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
    if (t === 0) return { label: "GREEN", color: "var(--green)", bg: "var(--green-bg)", border: "var(--green-border)", proof: "OTP", hint: "Ask customer for SMS OTP" };
    if (t === 1) return { label: "YELLOW", color: "var(--amber)", bg: "var(--amber-bg)", border: "var(--amber-border)", proof: "PHOTO", hint: "Photo of cylinder in kitchen" };
    return { label: "RED", color: "var(--red)", bg: "var(--red-bg)", border: "var(--red-border)", proof: "FACE_AUTH", hint: "Live face authentication" };
  }

  async function confirm(booking) {
    if (!proofData.trim()) return;
    setLoading(true); setResult(null);
    const ti = tierInfo(booking.riskTier);
    try {
      const res = await axios.post(`${API}/deliver`, {
        bookingId: booking.bookingId,
        proofType: ti.proof,
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
        <div className="page-title">Delivery</div>
        <div className="page-sub">Pending deliveries with risk-tiered verification.</div>
        <div className="mono" style={{ marginTop: 4 }}>agent: {agentAddress}</div>
      </div>

      {result && (
        <div className={`alert ${result.success ? "alert-success" : "alert-error"}`}>
          {result.success
            ? <>Subsidy released onchain.<br /><span className="mono">tx: {result.releaseTxHash}</span></>
            : result.error}
        </div>
      )}

      {deliveries.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.3 }}>—</div>
          <div style={{ color: "var(--text2)", fontSize: 13 }}>No pending deliveries</div>
          <div style={{ color: "var(--text3)", fontSize: 12, marginTop: 4 }}>Refreshing every 8s</div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {deliveries.map(b => {
            const ti = tierInfo(b.riskTier);
            const isOpen = selected?.bookingId === b.bookingId;
            return (
              <div key={b.bookingId} className="card" style={{ borderColor: isOpen ? ti.border : "var(--border)" }}>
                <div className="row-between" style={{ marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 2 }}>{b.bookingId}</div>
                    <div className="mono">{b.walletAddress}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ textAlign: "right" }}>
                      <div className="mono" style={{ fontSize: 18, fontWeight: 500, color: ti.color }}>{b.fraudScore}</div>
                      <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.04em" }}>fraud score</div>
                    </div>
                    <span className={`badge badge-${b.riskTier === 0 ? "green" : b.riskTier === 1 ? "yellow" : "red"}`}>{ti.label}</span>
                  </div>
                </div>

                <div style={{ background: ti.bg, border: `1px solid ${ti.border}`, borderRadius: "var(--radius-sm)", padding: "7px 11px", marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: ti.color }}>{ti.proof} required</div>
                  <div style={{ fontSize: 11, color: "var(--text2)" }}>{ti.hint}</div>
                </div>

                <div className="mono" style={{ marginBottom: 10 }}>
                  {new Date(b.createdAt).toLocaleString()} · escrow: {b.escrowTxHash?.slice(0, 18)}...
                </div>

                {!isOpen ? (
                  <button className="btn btn-blue" onClick={() => { setSelected(b); setProofData(""); setResult(null); }}>
                    Start delivery
                  </button>
                ) : (
                  <div>
                    <label className="label">Enter {ti.proof} proof</label>
                    {b.riskTier === 0 && <input className="input" placeholder="OTP from customer's phone" value={proofData} onChange={e => setProofData(e.target.value)} />}
                    {b.riskTier === 1 && <input className="input" placeholder="Photo hash / IPFS CID" value={proofData} onChange={e => setProofData(e.target.value)} />}
                    {b.riskTier === 2 && <input className="input" placeholder="UIDAI face auth txn_id" value={proofData} onChange={e => setProofData(e.target.value)} />}
                    <div className="row" style={{ marginTop: 6 }}>
                      <button className="btn btn-green" onClick={() => confirm(b)} disabled={loading || !proofData.trim()}>
                        {loading ? <><span className="spin">⏳</span> Releasing...</> : "Confirm & release subsidy"}
                      </button>
                      <button className="btn btn-outline" onClick={() => setSelected(null)}>Cancel</button>
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