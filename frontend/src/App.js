import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import toast, { Toaster } from "react-hot-toast";
import ABI from "./config/AgriChain.abi.json";
import deployment from "./config/deployment.json";
import "./App.css";

// ─── Constants ───────────────────────────────────────────────────────────────

const CONTRACT_ADDRESS = deployment.contractAddress;
const CERTIFICATIONS   = ["Standard", "Organic", "Non-GMO", "Fair Trade"];
const STATUS_LABELS    = ["Registered", "Listed", "Sold", "In Transit", "Delivered"];
const STATUS_COLORS    = ["#888", "#3B6D11", "#854F0B", "#185FA5", "#0F6E56"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const shortAddr = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
const weiToEth  = (wei)  => parseFloat(ethers.formatEther(wei)).toFixed(4);

function getContract(signerOrProvider) {
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, signerOrProvider);
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [provider,   setProvider]   = useState(null);
  const [signer,     setSigner]     = useState(null);
  const [account,    setAccount]    = useState("");
  const [network,    setNetwork]    = useState("");
  const [isFarmer,   setIsFarmer]   = useState(false);
  const [crops,      setCrops]      = useState([]);
  const [tab,        setTab]        = useState("dashboard");
  const [loading,    setLoading]    = useState(false);
  const [stats,      setStats]      = useState({ total: 0, volume: "0" });

  // ── Form state
  const [form, setForm] = useState({
    name: "", cropType: "Grain", quantity: "", pricePerKg: "",
    harvestDate: "", location: "", ipfsHash: "", cert: 0,
  });
  const [trackId,   setTrackId]   = useState("");
  const [shipLog,   setShipLog]   = useState([]);
  const [buyQty,    setBuyQty]    = useState({});

  // ─── Wallet Connection ───────────────────────────────────────────────────

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not detected — please install it.");
      return;
    }
    try {
      const prov = new ethers.BrowserProvider(window.ethereum);
      await prov.send("eth_requestAccounts", []);
      const sign = await prov.getSigner();
      const addr = await sign.getAddress();
      const net  = await prov.getNetwork();

      setProvider(prov);
      setSigner(sign);
      setAccount(addr);
      setNetwork(net.name);

      const contract  = getContract(sign);
      const farmer    = await contract.verifiedFarmers(addr);
      setIsFarmer(farmer);

      toast.success(`Connected: ${shortAddr(addr)}`);
      loadCrops(prov);
    } catch (e) {
      toast.error(e.message);
    }
  }, []);

  // ─── Load Crops ──────────────────────────────────────────────────────────

  const loadCrops = useCallback(async (prov) => {
    try {
      const contract = getContract(prov || provider);
      const total    = await contract.totalCrops();
      const statVol  = await contract.totalVolume();

      const loaded = [];
      for (let i = 1; i <= Number(total); i++) {
        const c = await contract.crops(i);
        loaded.push(c);
      }
      setCrops(loaded);
      setStats({ total: Number(total), volume: weiToEth(statVol) });
    } catch (e) {
      console.error("loadCrops:", e);
    }
  }, [provider]);

  useEffect(() => {
    if (provider) loadCrops(provider);
  }, [provider, loadCrops]);

  // ─── Register Crop ───────────────────────────────────────────────────────

  const registerCrop = async () => {
    if (!signer) { toast.error("Connect wallet first"); return; }
    if (!isFarmer) { toast.error("Your address is not a verified farmer"); return; }
    setLoading(true);
    try {
      const contract    = getContract(signer);
      const harvestTs   = Math.floor(new Date(form.harvestDate).getTime() / 1000);
      const priceWei    = ethers.parseEther(form.pricePerKg || "0");
      const quantityGrams = parseInt(form.quantity) * 1000;

      const tx = await contract.registerCrop(
        form.name, form.cropType, quantityGrams,
        priceWei, harvestTs, form.location,
        form.ipfsHash || "", parseInt(form.cert)
      );
      toast.loading("Transaction pending...", { id: "tx" });
      await tx.wait();
      toast.success(`🌾 ${form.name} registered on-chain!`, { id: "tx" });
      setForm({ name: "", cropType: "Grain", quantity: "", pricePerKg: "", harvestDate: "", location: "", ipfsHash: "", cert: 0 });
      loadCrops();
    } catch (e) {
      toast.error(e.reason || e.message, { id: "tx" });
    }
    setLoading(false);
  };

  // ─── Purchase Crop ───────────────────────────────────────────────────────

  const purchaseCrop = async (cropId) => {
    if (!signer) { toast.error("Connect wallet first"); return; }
    setLoading(true);
    try {
      const contract = getContract(signer);
      const price    = await contract.getCropPrice(cropId);
      const tx       = await contract.purchaseCrop(cropId, { value: price });
      toast.loading("Purchasing...", { id: "buy" });
      await tx.wait();
      toast.success("Purchase confirmed! NFT transferred.", { id: "buy" });
      loadCrops();
    } catch (e) {
      toast.error(e.reason || e.message, { id: "buy" });
    }
    setLoading(false);
  };

  // ─── Track Supply Chain ──────────────────────────────────────────────────

  const trackShipment = async () => {
    if (!provider) { toast.error("Connect wallet first"); return; }
    try {
      const contract = getContract(provider);
      const log      = await contract.getSupplyChain(parseInt(trackId));
      setShipLog(log);
      if (log.length === 0) toast("No shipment events yet for this batch.", { icon: "ℹ️" });
    } catch (e) {
      toast.error("Batch not found");
    }
  };

  // ─── UI Helpers ──────────────────────────────────────────────────────────

  const TABS = [
    { id: "dashboard", label: "Dashboard" },
    { id: "register",  label: "Register Crop" },
    { id: "market",    label: "Marketplace"   },
    { id: "supply",    label: "Supply Chain"  },
  ];

  return (
    <div className="app">
      <Toaster position="bottom-right" />

      {/* Header */}
      <header className="header">
        <div className="logo">
          <span className="logo-icon">🌾</span>
          <div>
            <div className="logo-name">AgriChain</div>
            <div className="logo-sub">Decentralized Agriculture</div>
          </div>
        </div>
        <div className="header-right">
          {network && <span className="network-badge">{network}</span>}
          <button className="wallet-btn" onClick={connectWallet}>
            <span className={`dot ${account ? "connected" : ""}`} />
            {account ? shortAddr(account) : "Connect Wallet"}
          </button>
          {isFarmer && <span className="farmer-badge">✔ Verified Farmer</span>}
        </div>
      </header>

      {/* Nav */}
      <nav className="nav">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`nav-btn ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="content">

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <div>
            <div className="stats-grid">
              {[
                { label: "Total Crops",    value: stats.total,           unit: "on-chain" },
                { label: "Volume Traded",  value: `${stats.volume} ETH`, unit: "cumulative" },
                { label: "Network",        value: network || "—",        unit: "connected to" },
                { label: "Your Role",      value: isFarmer ? "Farmer" : "Buyer", unit: "wallet role" },
              ].map((s, i) => (
                <div key={i} className="stat-card">
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-unit">{s.unit}</div>
                </div>
              ))}
            </div>

            <h2 className="section-title">Recent Crop Listings</h2>
            {crops.length === 0
              ? <p className="muted">No crops registered yet. Connect your wallet to load data.</p>
              : (
                <div className="crop-list">
                  {crops.slice(-5).reverse().map((c, i) => (
                    <div key={i} className="crop-row">
                      <div>
                        <strong>{c.name}</strong>
                        <span className="muted"> — {c.cropType} — {c.location}</span>
                      </div>
                      <span
                        className="status-badge"
                        style={{ background: STATUS_COLORS[Number(c.status)] + "22", color: STATUS_COLORS[Number(c.status)] }}
                      >
                        {STATUS_LABELS[Number(c.status)]}
                      </span>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        )}

        {/* REGISTER */}
        {tab === "register" && (
          <div>
            <h2 className="section-title">Register New Crop Batch</h2>
            <div className="card">
              <div className="form-grid-2">
                <label className="form-group">
                  <span>Crop Name</span>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Wheat" />
                </label>
                <label className="form-group">
                  <span>Crop Type</span>
                  <select value={form.cropType} onChange={e => setForm({...form, cropType: e.target.value})}>
                    {["Grain","Vegetable","Fruit","Fiber","Cash Crop"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </label>
                <label className="form-group">
                  <span>Quantity (kg)</span>
                  <input type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} placeholder="500" />
                </label>
                <label className="form-group">
                  <span>Price per kg (ETH)</span>
                  <input type="number" step="0.001" value={form.pricePerKg} onChange={e => setForm({...form, pricePerKg: e.target.value})} placeholder="0.004" />
                </label>
                <label className="form-group">
                  <span>Harvest Date</span>
                  <input type="date" value={form.harvestDate} onChange={e => setForm({...form, harvestDate: e.target.value})} />
                </label>
                <label className="form-group">
                  <span>Certification</span>
                  <select value={form.cert} onChange={e => setForm({...form, cert: e.target.value})}>
                    {CERTIFICATIONS.map((c, i) => <option key={c} value={i}>{c}</option>)}
                  </select>
                </label>
              </div>
              <label className="form-group" style={{marginTop: 12}}>
                <span>Farm Location</span>
                <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="GPS or region, e.g. Punjab, PK" />
              </label>
              <label className="form-group" style={{marginTop: 12}}>
                <span>IPFS Hash (optional)</span>
                <input value={form.ipfsHash} onChange={e => setForm({...form, ipfsHash: e.target.value})} placeholder="Qm..." />
              </label>
              <button className="btn-primary" onClick={registerCrop} disabled={loading} style={{marginTop: 16}}>
                {loading ? "Sending tx..." : "🌱 Register on Blockchain"}
              </button>
            </div>
          </div>
        )}

        {/* MARKETPLACE */}
        {tab === "market" && (
          <div>
            <h2 className="section-title">Crop Marketplace</h2>
            {crops.filter(c => Number(c.status) === 1).length === 0
              ? <p className="muted">No crops listed for sale. Register one first.</p>
              : (
                <div className="market-grid">
                  {crops
                    .filter(c => Number(c.status) === 1)
                    .map((c, i) => (
                      <div key={i} className="market-card">
                        <div className="market-name">{c.name}</div>
                        <div className="muted" style={{fontSize:12}}>{c.cropType} · {CERTIFICATIONS[Number(c.cert)]}</div>
                        <div className="muted" style={{fontSize:12, marginTop:4}}>{c.location}</div>
                        <div className="muted" style={{fontSize:12}}>Farmer: {shortAddr(c.farmer)}</div>
                        <div className="market-price">{weiToEth(c.pricePerKg)} ETH/kg</div>
                        <div className="muted" style={{fontSize:12}}>Qty: {(Number(c.quantity)/1000).toLocaleString()} kg</div>
                        <button
                          className="btn-primary"
                          style={{marginTop:12, width:"100%"}}
                          onClick={() => purchaseCrop(Number(c.id))}
                          disabled={loading || account.toLowerCase() === c.farmer.toLowerCase()}
                        >
                          {account.toLowerCase() === c.farmer.toLowerCase() ? "Your listing" : "Buy Now"}
                        </button>
                      </div>
                    ))
                  }
                </div>
              )
            }
          </div>
        )}

        {/* SUPPLY CHAIN */}
        {tab === "supply" && (
          <div>
            <h2 className="section-title">Track Shipment</h2>
            <div className="card">
              <div className="form-inline">
                <input
                  value={trackId}
                  onChange={e => setTrackId(e.target.value)}
                  placeholder="Crop Token ID (e.g. 1)"
                  style={{flex:1}}
                />
                <button className="btn-primary" onClick={trackShipment}>Track</button>
              </div>
            </div>

            {shipLog.length > 0 && (
              <div className="card" style={{marginTop:16}}>
                <h3 className="section-title">Supply Chain Log — Batch #{trackId}</h3>
                {shipLog.map((e, i) => (
                  <div key={i} className="supply-event">
                    <div className="supply-dot" />
                    <div>
                      <strong>{e.eventType}</strong>
                      <div className="muted" style={{fontSize:12}}>{e.location} · {shortAddr(e.actor)}</div>
                      <div className="muted" style={{fontSize:11}}>
                        {new Date(Number(e.timestamp) * 1000).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
