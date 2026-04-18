import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:3001/api";

function RegisterForm({ onRegistered }) {
  const [form, setForm] = useState({
    name: "", aadhaarNumber: "", walletAddress: "",
    phone: "", lat: "18.5204", lon: "73.8567", pincode: "411001"
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function submit() {
    setLoading(true); setResult(null);
    try {
      const res = await axios.post(`${API}/register`, form);
      setResult(res.data);
      if (res.data.success) onRegistered(form.walletAddress, form.name);
    } catch (e) {
      setResult({ success: false, error: e.response?.data?.error || e.message });
    }
    setLoading(false);
  }

  return (
    <div className="card">
      <div className="card-title">Register new connection</div>
      <div className="input-row">
        <div>
          <label className="label">Full name</label>
          <input className="input" placeholder="Ramesh Kumar" value={form.name} onChange={e => set("name", e.target.value)} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" placeholder="+91 98765 43210" value={form.phone} onChange={e => set("phone", e.target.value)} />
        </div>
      </div>
      <label className="label">Aadhaar number</label>
      <input className="input" placeholder="XXXX XXXX XXXX" value={form.aadhaarNumber} onChange={e => set("aadhaarNumber", e.target.value)} />
      <label className="label">Wallet address</label>
      <input className="input" placeholder="0x..." value={form.walletAddress} onChange={e => set("walletAddress", e.target.value)} />
      <div className="input-row">
        <div>
          <label className="label">Latitude</label>
          <input className="input" value={form.lat} onChange={e => set("lat", e.target.value)} />
        </div>
        <div>
          <label className="label">Longitude</label>
          <input className="input" value={form.lon} onChange={e => set("lon", e.target.value)} />
        </div>
      </div>
      <label className="label">Pincode</label>
      <input className="input" placeholder="411001" value={form.pincode} onChange={e => set("pincode", e.target.value)} />

      <div className="zkp-notice">
        ZKP — your Aadhaar is hashed locally and never stored. Only a cryptographic commitment is sent.
      </div>

      <button className="btn btn-green" onClick={submit} disabled={loading || !form.aadhaarNumber || !form.walletAddress}>
        {loading ? <><span className="spin">⏳</span> Processing...</> : "Register & mint SBT"}
      </button>

      {result && (
        <div className={`alert ${result.success ? "alert-success" : "alert-error"}`} style={{ marginTop: 12 }}>
          {result.success ? (
            <>SBT minted.<br />
              <span className="mono">tx: {result.txHash}</span><br />
              <span className="mono">trace: {result.traceId}</span>
            </>
          ) : result.error}
        </div>
      )}
    </div>
  );
}

function BookingPanel({ wallet }) {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [deviceId] = useState("DEVICE-" + Math.random().toString(36).slice(2, 10).toUpperCase());

  useEffect(() => {
    if (!wallet) return;
    axios.get(`${API}/user/${wallet}`).then(r => setUser(r.data)).catch(() => {});
    axios.get(`${API}/bookings/${wallet}`).then(r => setBookings(r.data.bookings)).catch(() => {});
  }, [wallet, result]);

  async function book() {
    setLoading(true); setResult(null);
    try {
      const res = await axios.post(`${API}/book`, {
        walletAddress: wallet, deviceId,
        deliveryLat: 18.5204, deliveryLon: 73.8567
      });
      setResult(res.data);
    } catch (e) {
      setResult({ success: false, error: e.response?.data?.error || e.message });
    }
    setLoading(false);
  }

  const tierBadge = t => t === 0
    ? <span className="badge badge-green">GREEN</span>
    : t === 1 ? <span className="badge badge-yellow">YELLOW</span>
    : <span className="badge badge-red">RED</span>;

  return (
    <>
      {user && (
        <div className="card">
          <div className="row-between" style={{ marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 2 }}>{user.name}</div>
              <div className="mono">{wallet}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="stat-val" style={{ color: "var(--green)" }}>{user.vouchersRemaining}</div>
              <div className="stat-lbl">vouchers left</div>
            </div>
          </div>
          <button className="btn btn-green" onClick={book} disabled={loading || user.vouchersRemaining <= 0} style={{ width: "100%", justifyContent: "center", padding: "11px 0" }}>
            {loading ? <><span className="spin">⏳</span> Scoring & locking escrow...</> : "Book gas cylinder"}
          </button>
          {result && (
            <div className={`alert ${result.success ? "alert-success" : "alert-error"}`} style={{ marginTop: 12 }}>
              {result.success ? (
                <>
                  Booking confirmed. Escrow locked onchain.<br />
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "6px 0" }}>
                    <span className="mono">score: {result.fraudScore}/100</span>
                    {tierBadge(result.riskTier)}
                    <span className="badge badge-blue">{result.verificationRequired}</span>
                  </div>
                  <span className="mono">id: {result.bookingId}</span><br />
                  <span className="mono">tx: {result.escrowTxHash}</span>
                </>
              ) : result.error}
            </div>
          )}
        </div>
      )}

      {bookings.length > 0 && (
        <div className="card">
          <div className="card-title">My bookings</div>
          <table>
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Date</th>
                <th>Score</th>
                <th>Tier</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.bookingId}>
                  <td className="mono">{b.bookingId}</td>
                  <td style={{ color: "var(--text2)", fontSize: 12 }}>{new Date(b.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className="mono">{b.fraudScore}</span>
                    <div className="score-bar">
                      <div className="score-fill" style={{
                        width: `${b.fraudScore}%`,
                        background: b.fraudScore > 75 ? "var(--red)" : b.fraudScore > 30 ? "var(--amber)" : "var(--green)"
                      }} />
                    </div>
                  </td>
                  <td>{tierBadge(b.riskTier)}</td>
                  <td>
                    <span className={`badge ${b.status === "DELIVERED" ? "badge-green" : b.status === "PENDING" ? "badge-yellow" : "badge-gray"}`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function CustomerUI() {
  const [wallet, setWallet] = useState("");
  const [registered, setRegistered] = useState(null);
  const [tab, setTab] = useState("register");

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Customer</div>
        <div className="page-sub">Register your gas connection and book cylinders.</div>
      </div>

      <div className="tab-row">
        <button className={`tab ${tab === "register" ? "active" : ""}`} onClick={() => setTab("register")}>Register</button>
        <button className={`tab ${tab === "book" ? "active" : ""}`} onClick={() => setTab("book")}>Book gas</button>
      </div>

      {tab === "register" && (
        <RegisterForm onRegistered={(w, n) => { setRegistered({ wallet: w, name: n }); setWallet(w); setTab("book"); }} />
      )}

      {tab === "book" && (
        <>
          {!registered && (
            <div className="card">
              <div className="card-title">Enter wallet address</div>
              <input className="input" placeholder="0x..." value={wallet} onChange={e => setWallet(e.target.value)} />
              <button className="btn btn-blue" onClick={() => setRegistered({ wallet, name: "" })} disabled={!wallet}>
                Load account
              </button>
            </div>
          )}
          {(registered || wallet) && <BookingPanel wallet={registered?.wallet || wallet} />}
        </>
      )}
    </div>
  );
}