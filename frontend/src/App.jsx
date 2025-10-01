import React, { useEffect, useMemo, useRef, useState } from "react";
import { apiClient } from "./api";

// === 3D BAĞIMLILIKLARI ===
// npm i three @react-three/fiber @react-three/drei three-stdlib
import * as THREE from "three";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Center, Environment, Grid, Stats } from "@react-three/drei";
import { GLTFLoader, OBJLoader, STLLoader } from "three-stdlib";

/** API'den gelen farklı şekilleri tek tipe çevirme */
function normalizePosts(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

/** Basit SVG Çizgi Grafik */
function LineChart({ data = [], height = 160, padding = 14 }) {
  const width = 480; // kapsayıcı genişliğe göre scale oluyor (viewBox)
  const h = height;
  const w = width;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const rng = Math.max(1, max - min);
  const pts = data.map((v, i) => {
    const x = padding + (i * (w - padding * 2)) / Math.max(1, data.length - 1);
    const y = padding + (h - padding * 2) * (1 - (v - min) / rng);
    return [x, y];
  });
  const d = pts
    .map(([x, y], i) => (i === 0 ? `M ${x},${y}` : `L ${x},${y}`))
    .join(" ");
  const fill = d + ` L ${padding},${h - padding} L ${w - padding},${h - padding} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height }}>
      <path d={fill} fill="rgba(99,102,241,.18)"></path>
      <path d={d} fill="none" stroke="rgba(99,102,241,1)" strokeWidth="2.2" />
    </svg>
  );
}

// ==========================
// 3D GÖRÜNTÜLEYİCİ BİLEŞENLERİ (JS — tip yok)
// ==========================
function GLTFModel({ url }) {
  const gltf = useLoader(GLTFLoader, url);
  return <primitive object={gltf.scene} />;
}
function STLModel({ url, wireframe }) {
  const geometry = useLoader(STLLoader, url);
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial metalness={0.1} roughness={0.8} wireframe={!!wireframe} />
    </mesh>
  );
}
function OBJModel({ url }) {
  const obj = useLoader(OBJLoader, url);
  return <primitive object={obj} />;
}
function ModelSwitcher({ url, ext, wireframe }) {
  if (ext === "glb" || ext === "gltf") return <GLTFModel url={url} />;
  if (ext === "stl") return <STLModel url={url} wireframe={wireframe} />;
  if (ext === "obj") return <OBJModel url={url} />;
  return null;
}
function Viewer3D() {
  const [fileUrl, setFileUrl] = useState(null);
  const [fileExt, setFileExt] = useState(null);
  const [wireframe, setWireframe] = useState(false);
  const [grid, setGrid] = useState(true);
  const [autorotate, setAutorotate] = useState(true);
  const [bg, setBg] = useState("#0b1020");

  const onFile = (file) => {
    const url = URL.createObjectURL(file);
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    setFileUrl(url);
    setFileExt(ext);
  };

  return (
    <div className="card">
      <h3>3D Model — Buzağı Yemleme Robotu</h3>
      <div className="row" style={{ gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="file"
          accept=".glb,.gltf,.stl,.obj"
          onChange={(e) => e.target.files && e.target.files[0] && onFile(e.target.files[0])}
          className="input"
          style={{ maxWidth: 360, background: "transparent", color: "inherit" }}
        />
        <label className="chip">
          <input type="checkbox" checked={wireframe} onChange={(e) => setWireframe(e.target.checked)} /> Wireframe
        </label>
        <label className="chip">
          <input type="checkbox" checked={grid} onChange={(e) => setGrid(e.target.checked)} /> Grid
        </label>
        <label className="chip">
          <input type="checkbox" checked={autorotate} onChange={(e) => setAutorotate(e.target.checked)} /> Otomatik Döndür
        </label>
        <span className="chip">Arkaplan <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} /></span>
      </div>

      <div style={{ height: 520, marginTop: 12, borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
        <Canvas
          shadows
          camera={{ position: [4, 3, 6], fov: 40 }}
          gl={{ antialias: true }}
          onCreated={({ scene }) => {
            scene.background = new THREE.Color(bg);
          }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />

          <Center disableY>
            {fileUrl ? (
              <ModelSwitcher url={fileUrl} ext={fileExt || "glb"} wireframe={wireframe} />
            ) : (
              <Placeholder3D />
            )}
          </Center>

          {grid && (
            <Grid args={[20, 20]} cellSize={0.5} cellThickness={0.6} sectionThickness={1.2} fadeDistance={30} infiniteGrid position={[0, -0.001, 0]} />
          )}

          <Environment preset="warehouse" />
          <OrbitControls makeDefault enableDamping dampingFactor={0.1} autoRotate={autorotate} autoRotateSpeed={0.6} />
          <Stats className="stats" />
        </Canvas>
      </div>

      {!fileUrl && (
        <div className="empty" style={{ marginTop: 10 }}>
          Dosya seçin veya sürükleyip bırakın (GLB/GLTF önerilir; STL/OBJ desteklenir).
        </div>
      )}
      <p className="muted" style={{ marginTop: 8 }}>
        STEP/IGES varsa önce GLB/OBJ/GLTF'e dönüştürün. Ölçü birimi mm olacak şekilde dışa aktarın.
      </p>
    </div>
  );
}
function Placeholder3D() {
  return (
    <group>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial metalness={0.1} roughness={0.7} />
      </mesh>
      <mesh position={[1.2, 0.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.5, 24]} />
        <meshStandardMaterial metalness={0.1} roughness={0.7} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[-1.2, 0.1, 0]} castShadow receiveShadow>
        <torusGeometry args={[0.35, 0.1, 16, 48]} />
        <meshStandardMaterial metalness={0.1} roughness={0.7} />
      </mesh>
    </group>
  );
}

export default function App() {
  // ---- Tema & Router
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [view, setView] = useState(() => (typeof window !== "undefined" && window.location.hash.slice(1)) || "home");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);
  useEffect(() => {
    const onHash = () => setView(window.location.hash.replace("#", "") || "home");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const go = (id) => { window.location.hash = id; };

  // ---- Kullanıcı & Rol
  const userName = "Seda Ö.";
  const isAdmin = true;

  // ---- Gönderiler (API entegre)
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiClient.get("/posts");
        if (!mounted) return;
        setPosts(normalizePosts(res.data));
      } catch {
        if (!mounted) return;
        setError("Gönderiler yüklenirken bir sorun oluştu.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);
  const handleAdd = async () => {
    const value = title.trim();
    if (!value) return;
    setAdding(true);
    setError("");
    try {
      const { data } = await apiClient.post("/posts", { title: value });
      setPosts((p) => [data, ...p]);
      setTitle("");
      inputRef.current?.focus && inputRef.current.focus();
    } catch {
      setError("Gönderi eklenemedi. Lütfen tekrar deneyin.");
    } finally {
      setAdding(false);
    }
  };
  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/posts/${id}`);
      setPosts((p) => p.filter((x) => (x.id ?? x._id) !== id));
    } catch {
      setError("Silme işlemi başarısız oldu.");
    }
  };

  // ---- Demo veriler
  const animalsInit = useMemo(() => [
    { id: 1, kupe: "TR001", dogum: "2023-03-12", sut: 24 },
    { id: 2, kupe: "TR002", dogum: "2022-11-01", sut: 18 },
    { id: 3, kupe: "TR003", dogum: "2021-07-22", sut: 21 },
  ], []);
  const [animals, setAnimals] = useState(animalsInit);
  const alerts = {
    heat: ["TR002 için hareketlilik artışı", "TR003 için ısıl döngü uyarısı"],
    collar: ["TR001 tasma pili zayıf"],
    bucket: ["Kova 2 sıcaklık sapması"],
    treatment: ["TR003 antibiyotik günü"],
    feed: ["1. grup rasyon kontrolü"],
  };
  const schedule = [
    { gun: "Bugün", saat: "06:00 / 18:00" },
    { gun: "Yarın", saat: "06:00 / 18:00" },
    { gun: "Cuma", saat: "06:00 / 18:00" },
  ];

  // ---- KPI’lar
  const kpi = useMemo(() => {
    const total = animals.length;
    const dailyMilk = animals.reduce((a, b) => a + (b.sut || 0), 0);
    const alertsCount = Object.values(alerts).reduce((a, b) => a + (b?.length || 0), 0);
    return { total, dailyMilk, alertsCount };
  }, [animals]);

  // ---- Arama (basit filtreleme)
  const [q, setQ] = useState("");
  const filterText = (t) => t.toLowerCase().includes(q.toLowerCase());
  const filteredAnimals = animals.filter((a) => filterText(`${a.kupe} ${a.dogum} ${a.sut}`));

  // ---- Hayvan Ayır (simülasyon)
  const separate = (id) => { setAnimals((prev) => prev.filter((x) => x.id !== id)); };

  // ---- Basit veri üretimi – grafik
  const chartData = useMemo(() => Array.from({ length: 7 }, () => Math.round(15 + Math.random() * 12)), [animals.length]);

  return (
    <>
      {/* Tema ve layout CSS’i */}
      <style>{`
        :root { color-scheme: dark;
          --bg:#0b1020; --bg2:#0d1430; --panel:rgba(255,255,255,.06);
          --glass:rgba(255,255,255,.08); --border:rgba(255,255,255,.15);
          --text:#e5e7eb; --muted:#9aa4b2; --brand:#6366f1; --brand2:#8b5cf6;
          --shadow:0 10px 30px rgba(0,0,0,.25); --r:16px;
        }
        [data-theme="light"]{
          color-scheme: light; --bg:#f7f7fb; --bg2:#fff; --text:#0b1020; --muted:#5b6572;
          --panel:rgba(0,0,0,.04); --glass:rgba(0,0,0,.04); --border:rgba(0,0,0,.12);
        }
        *{ box-sizing: border-box; }
        html, body, #root { height: 100%; }
        body { margin:0; background:
          radial-gradient(1100px 520px at 12% -10%, #4f46e5 0%, rgba(2,6,23,0) 60%),
          linear-gradient(135deg, var(--bg) 0%, #0b1224 60%, #0e1530 100%);
          color: var(--text); font-family: ui-sans-serif, system-ui, -apple-system,"Segoe UI", Roboto, Arial;
          -webkit-font-smoothing: antialiased;
        }
        .app { display:grid; grid-template-columns: 280px 1fr; min-height:100vh; }
        @media (max-width: 800px){ .app{ grid-template-columns: 1fr; } .sidebar{ position:fixed; inset:0 auto 0 0; width:280px; transform:translateX(-100%); transition:transform .25s ease; z-index:1000; }
          .sidebar.open{ transform: translateX(0); } .burger{ display:flex; }
        }
        /* Sidebar */
        .sidebar { height:100vh; position:sticky; top:0; border-right:1px solid var(--border);
          backdrop-filter: blur(8px); background: var(--panel); box-shadow: var(--shadow); }
        .logo { display:flex; align-items:center; gap:10px; padding:18px; border-bottom:1px solid var(--border); }
        .logo .brand { font-weight:900; letter-spacing:.2px; }
        .menu { margin:12px 10px 30px; padding:0; list-style:none; }
        .label { font-size:13px; color:var(--muted); padding:10px 8px; }
        .sidebar-item { }
        .sidebar-link { display:flex; align-items:center; gap:12px; width:100%; padding:12px 14px; border-radius:12px;
          color:inherit; text-decoration:none; border:1px solid transparent; transition: background .2s, border-color .2s, transform .06s; }
        .sidebar-link:hover{ background:var(--glass); border-color:var(--border); }
        .sidebar-item.active > .sidebar-link { background: linear-gradient(180deg, var(--brand), #4f46e5); color:#fff; border-color:transparent;
          box-shadow: 0 10px 20px rgba(79,70,229,.25); }
        .has-sub > .sidebar-link::after { content:"▾"; margin-left:auto; opacity:.8; transform: translateY(-1px); }
        .has-sub.open > .sidebar-link::after { transform: rotate(180deg); }
        .submenu { display:none; margin:6px 0 6px 12px; padding-left:8px; border-left:1px dashed var(--border); }
        .has-sub.open > .submenu { display:block; }
        .submenu a { display:block; padding:9px 12px; font-size:14px; border-radius:10px; color:inherit; text-decoration:none; }
        .submenu a:hover{ background:var(--glass); }
        /* Main */
        main { padding:18px; }
        header.topbar { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:14px; }
        .left-tools { display:flex; align-items:center; gap:10px; }
        .burger { display:none; width:40px; height:40px; border:1px solid var(--border); border-radius:12px; background:var(--panel); align-items:center; justify-content:center; cursor:pointer; }
        .search { position:relative; flex:1; max-width:520px; }
        .search input { width:100%; height:42px; border-radius:12px; border:1px solid var(--border); background:rgba(255,255,255,.9); color:#0b1020; padding:0 38px 0 12px; outline:0; transition: box-shadow .2s, border-color .2s; }
        .search input:focus{ border-color:#818cf8; box-shadow:0 0 0 3px rgba(99,102,241,.25); }
        .search .ico { position:absolute; right:10px; top:50%; transform:translateY(-50%); opacity:.7; }
        .actions { display:flex; align-items:center; gap:10px; }
        .chip { display:inline-flex; align-items:center; gap:8px; padding:8px 10px; border-radius:12px; border:1px solid var(--border); background:var(--panel); }
        .btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; height:42px; padding:0 14px; border-radius:12px; border:1px solid var(--border);
          background:linear-gradient(180deg, var(--brand), #4f46e5); color:#fff; font-weight:800; letter-spacing:.2px; cursor:pointer; transition: transform .06s ease; }
        .btn:active { transform: translateY(1px); }
        .grid { display:grid; gap:14px; }
        .cols-3 { grid-template-columns: repeat(3, minmax(0,1fr)); }
        .cols-2 { grid-template-columns: repeat(2, minmax(0,1fr)); }
        @media (max-width: 1200px){ .cols-3{ grid-template-columns: repeat(2, minmax(0,1fr)); } }
        @media (max-width: 800px){ .cols-3,.cols-2{ grid-template-columns: 1fr; } main{ padding:14px; } }
        .card { background:var(--panel); border:1px solid var(--border); border-radius:var(--r); box-shadow:var(--shadow); padding:14px; }
        .card h3 { margin:0 0 6px; font-size:16px; letter-spacing:.3px; }
        .kpi { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px; border-radius:14px; background:rgba(255,255,255,.06); border:1px solid var(--border); }
        .kpi .val { font-size:24px; font-weight:900; letter-spacing:-.02em; }
        .muted { color:var(--muted); font-size:13px; }
        footer { margin: 22px 0 8px; text-align:center; color:var(--muted); font-size:12px; }
        .row{ display:flex; gap:10px; align-items:center; }
        .input{ flex:1; height:44px; border-radius:12px; border:1px solid var(--border); background:rgba(255,255,255,.9); color:#0b1020; padding:0 12px; font-size:14px; outline:none; transition: box-shadow .2s, border-color .2s; }
        .input:focus{ border-color:#818cf8; box-shadow:0 0 0 3px rgba(99,102,241,.25); }
        .btn-ghost{ height:34px; padding:0 10px; border:1px solid var(--border); border-radius:10px; background:transparent; color:inherit; cursor:pointer; }
        .list{ margin-top:10px; max-height:320px; overflow:auto; padding-right:6px; display:grid; gap:8px; }
        .item{ display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px; border-radius:12px; background:rgba(255,255,255,.06); border:1px solid var(--border); }
        .left{ display:flex; align-items:center; gap:10px; min-width:0; }
        .avatar{ width:34px; height:34px; border-radius:50%; background: rgba(99,102,241,.25); display:grid; place-items:center; color:#c7d2fe; font-weight:900; }
        .ttl{ flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-size:14px; }
        .ghost{ background:transparent; border:none; color:inherit; opacity:.75; cursor:pointer; }
        .ghost:hover{ opacity:1; }
        .err{ color:#fecaca; font-size:13px; margin-top:8px; }
        .empty{ border:1px dashed var(--border); border-radius:12px; padding:18px; text-align:center; background:rgba(255,255,255,.06); }
        .view{ display:none; }
        .view.active{ display:block; animation: fade .15s ease; }
        @keyframes fade{ from{ opacity:.5; transform: translateY(4px); } to{ opacity:1; transform: none; } }
      `}</style>

      <div className="app">
        {/* Sidebar */}
        <aside className={`sidebar ${view === "_open" ? "open" : ""}`} id="sidebar">
          <div className="logo">
            <div className="brand">🐄 Çiftlik Paneli</div>
          </div>
          <ul className="menu">
            <li className="label">Menü</li>
            <li className={`sidebar-item ${view === "home" ? "active" : ""}`} onClick={() => go("home")}>
              <a className="sidebar-link" href="#home">🏠 <span>Anasayfa</span></a>
            </li>
            <li className={`sidebar-item has-sub ${["hayvan-karti","hayvan-ekle","hayvan-listesi","hayvan-ayir"].includes(view) ? "open active" : ""}`}>
              <a className="sidebar-link" href="#hayvan-karti" onClick={(e)=>e.preventDefault()}>🐄 <span>Hayvan Yönetimi</span></a>
              <div className="submenu">
                <div className={`submenu-item ${view==="hayvan-karti"?"active":""}`}><a href="#hayvan-karti" onClick={()=>go("hayvan-karti")}>Hayvan Kartı</a></div>
                <div className={`submenu-item ${view==="hayvan-ekle"?"active":""}`}><a href="#hayvan-ekle" onClick={()=>go("hayvan-ekle")}>Hayvan Ekle</a></div>
                <div className={`submenu-item ${view==="hayvan-listesi"?"active":""}`}><a href="#hayvan-listesi" onClick={()=>go("hayvan-listesi")}>Hayvan Listesi</a></div>
                <div className={`submenu-item ${view==="hayvan-ayir"?"active":""}`}><a href="#hayvan-ayir" onClick={()=>go("hayvan-ayir")}>Hayvan Ayır</a></div>
              </div>
            </li>
            <li className={`sidebar-item has-sub ${["sut-degerleri"].includes(view) ? "open active" : ""}`}>
              <a className="sidebar-link" href="#sut-degerleri" onClick={(e)=>e.preventDefault()}>💧 <span>Süt</span></a>
              <div className="submenu">
                <div className={`submenu-item ${view==="sut-degerleri"?"active":""}`}><a href="#sut-degerleri" onClick={()=>go("sut-degerleri")}>Süt Değerleri</a></div>
              </div>
            </li>
            <li className={`sidebar-item has-sub ${["sut-miktari","sagim-takvimi","istatistikler"].includes(view) ? "open active" : ""}`}>
              <a className="sidebar-link" href="#sut-miktari" onClick={(e)=>e.preventDefault()}>📈 <span>Sürü Takip</span></a>
              <div className="submenu">
                <div className={`submenu-item ${view==="sut-miktari"?"active":""}`}><a href="#sut-miktari" onClick={()=>go("sut-miktari")}>Süt Miktarı</a></div>
                <div className={`submenu-item ${view==="sagim-takvimi"?"active":""}`}><a href="#sagim-takvimi" onClick={()=>go("sagim-takvimi")}>Sağım Takvimi</a></div>
                <div className={`submenu-item ${view==="istatistikler"?"active":""}`}><a href="#istatistikler" onClick={()=>go("istatistikler")}>İstatistikler</a></div>
              </div>
            </li>
            <li className={`sidebar-item has-sub ${["kizginlik","tasma","kova","tedavi","yem"].includes(view) ? "open active" : ""}`}>
              <a className="sidebar-link" href="#kizginlik" onClick={(e)=>e.preventDefault()}>🔔 <span>Uyarılar</span></a>
              <div className="submenu">
                <div className={`submenu-item ${view==="kizginlik"?"active":""}`}><a href="#kizginlik" onClick={()=>go("kizginlik")}>Kızgınlık Kontrol</a></div>
                <div className={`submenu-item ${view==="tasma"?"active":""}`}><a href="#tasma" onClick={()=>go("tasma")}>Tasma Kontrol</a></div>
                <div className={`submenu-item ${view==="kova"?"active":""}`}><a href="#kova" onClick={()=>go("kova")}>Kova Kontrol</a></div>
                <div className={`submenu-item ${view==="tedavi"?"active":""}`}><a href="#tedavi" onClick={()=>go("tedavi")}>Tedavi Kontrol</a></div>
                <div className={`submenu-item ${view==="yem"?"active":""}`}><a href="#yem" onClick={()=>go("yem")}>Yem Kontrol</a></div>
              </div>
            </li>
            <li className={`sidebar-item has-sub ${["grup-yonetimi","grup-listesi"].includes(view) ? "open active" : ""}`}>
              <a className="sidebar-link" href="#grup-yonetimi" onClick={(e)=>e.preventDefault()}>👥 <span>Gruplar</span></a>
              <div className="submenu">
                <div className={`submenu-item ${view==="grup-yonetimi"?"active":""}`}><a href="#grup-yonetimi" onClick={()=>go("grup-yonetimi")}>Grup Yönetimi</a></div>
                <div className={`submenu-item ${view==="grup-listesi"?"active":""}`}><a href="#grup-listesi" onClick={()=>go("grup-listesi")}>Grup Listesi</a></div>
              </div>
            </li>
            <li className={`sidebar-item has-sub ${["ciftlik-ayarlari"].includes(view) ? "open active" : ""}`}>
              <a className="sidebar-link" href="#ciftlik-ayarlari" onClick={(e)=>e.preventDefault()}>⚙️ <span>Genel Ayarlar</span></a>
              <div className="submenu">
                <div className={`submenu-item ${view==="ciftlik-ayarlari"?"active":""}`}><a href="#ciftlik-ayarlari" onClick={()=>go("ciftlik-ayarlari")}>Çiftlik Ayarları</a></div>
              </div>
            </li>
            <li className="label">Geçiş İşlemleri</li>
            <li className={`sidebar-item ${view==="yemleme"?"active":""}`} onClick={()=>go("yemleme")}>
              <a className="sidebar-link" href="#yemleme">🔄 <span>Buzağı Besleme</span></a>
            </li>
            {/* YENİ: 3D GÖRÜNTÜLEYİCİ */}
            <li className={`sidebar-item ${view==="model-3d"?"active":""}`} onClick={()=>go("model-3d")}>
              <a className="sidebar-link" href="#model-3d">🧊 <span>3D Model</span></a>
            </li>
            {isAdmin && (
              <>
                <li className="label">Yönetim</li>
                <li className={`sidebar-item has-sub ${["yonetici-listesi"].includes(view) ? "open active" : ""}`}>
                  <a className="sidebar-link" href="#yonetici-listesi" onClick={(e)=>e.preventDefault()}>🛡️ <span>Yönetici</span></a>
                  <div className="submenu">
                    <div className={`submenu-item ${view==="yonetici-listesi"?"active":""}`}><a href="#yonetici-listesi" onClick={()=>go("yonetici-listesi")}>Yönetici Listesi</a></div>
                  </div>
                </li>
              </>
            )}
            <li className="label">Hesap</li>
            <li className="sidebar-item"><a className="sidebar-link" href="/logout">🚪 <span>Oturumu Kapat</span></a></li>
          </ul>
        </aside>

        {/* Main */}
        <main>
          <header className="topbar">
            <div className="left-tools">
              <button className="burger" onClick={() => { const el = document.querySelector(".sidebar"); el?.classList.toggle("open"); }} aria-label="Menüyü aç/kapat">☰</button>
              <div className="search" role="search">
                <input type="search" placeholder="Panel içinde ara…" aria-label="Ara" value={q} onChange={(e) => setQ(e.target.value)} />
                <span className="ico">🔎</span>
              </div>
            </div>
            <div className="actions">
              <button className="chip" onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} title="Tema değiştir">🌓 Tema</button>
              <span className="chip">👤 {userName}</span>
            </div>
          </header>

          {/* ANASAYFA */}
          <section className={`view ${view === "home" ? "active" : ""}`} id="home">
            <div className="grid cols-3">
              <div className="card">
                <h3>Özet</h3>
                <div className="grid cols-3">
                  <div className="kpi"><div><div className="muted">Toplam Hayvan</div><div className="val">{animals.length}</div></div><span>🐄</span></div>
                  <div className="kpi"><div><div className="muted">Günlük Süt (L)</div><div className="val">{kpi.dailyMilk}</div></div><span>💧</span></div>
                  <div className="kpi"><div><div className="muted">Açık Uyarı</div><div className="val">{kpi.alertsCount}</div></div><span>🔔</span></div>
                </div>
              </div>
              <div className="card"><h3>Süt Üretimi</h3><LineChart data={chartData} /></div>
              <div className="card" role="region" aria-live="polite">
                <h3>Hızlı Gönderiler</h3>
                <div className="row">
                  <input ref={inputRef} className="input" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} placeholder="Başlık yazın..." aria-label="Başlık" />
                  <button className="btn" onClick={handleAdd} disabled={adding || !title.trim()} title="Ekle">{adding ? "Ekleniyor…" : "Ekle"}</button>
                </div>
                {error && <div className="err">{error}</div>}
                <div className="list">
                  {loading ? (
                    <>
                      <div className="item"><span className="muted">Yükleniyor…</span></div>
                      <div className="item"><span className="muted">Yükleniyor…</span></div>
                    </>
                  ) : posts.length === 0 ? (
                    <div className="empty"><div style={{ fontWeight: 800, marginBottom: 6 }}>Henüz gönderi yok</div><div style={{ opacity: 0.8, fontSize: 14 }}>Yukarıdan bir başlık ekleyin.</div></div>
                  ) : (
                    posts.filter((p) => filterText(p.title ?? "")).map((p, i) => {
                      const id = String(p.id ?? p._id ?? `${p.title}-${i}`);
                      const initial = ((p.title ?? "?").trim().charAt(0).toUpperCase()) || "?";
                      return (
                        <div className="item" key={id}>
                          <div className="left"><div className="avatar">{initial}</div><span className="ttl">{p.title}</span></div>
                          {(p.id || p._id) && (
                            <button className="ghost" aria-label="Sil" title="Sil" onClick={() => handleDelete(p.id ?? p._id)}>✖</button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
            <div className="grid cols-2" style={{ marginTop: 14 }}>
              <div className="card">
                <h3>Sağım Takvimi</h3>
                <div className="list">
                  {schedule.filter((x) => filterText(`${x.gun} ${x.saat}`)).map((x, idx) => (
                    <div className="item" key={idx}><div className="left"><span>📅</span><span className="ttl">{x.gun}</span></div><b className="muted">{x.saat}</b></div>
                  ))}
                </div>
              </div>
              <div className="card">
                <h3>Hızlı İşlemler</h3>
                <div className="row" style={{ flexWrap: "wrap" }}>
                  <button className="btn" onClick={() => go("hayvan-ekle")}>➕ Yeni Hayvan</button>
                  <button className="btn" onClick={() => go("kizginlik")}>⚠️ Kızgınlık</button>
                  <button className="btn" onClick={() => go("sagim-takvimi")}>📅 Takvim</button>
                  <button className="btn" onClick={() => go("ciftlik-ayarlari")}>⚙️ Ayarlar</button>
                </div>
              </div>
            </div>
            <footer>Made with ❤ {userName}</footer>
          </section>

          {/* HAYVAN YÖNETİMİ */}
          <section className={`view ${view === "hayvan-karti" ? "active" : ""}`} id="hayvan-karti">
            <div className="card">
              <h3>Hayvan Kartı</h3>
              <p className="muted">RFID veya Küpe No ile arayın.</p>
              <div className="row">
                <input className="input" placeholder="RFID / Küpe No" id="rfid" />
                <button className="btn" onClick={() => {
                  const elInput = document.getElementById("rfid");
                  const r = (elInput && elInput.value ? elInput.value : "").trim().toLowerCase();
                  const a = animals.find((x) => x.kupe.toLowerCase() === r);
                  const el = document.getElementById("animalCard");
                  if (el) {
                    el.innerHTML = a
                      ? `<div class="item"><div class="left"><div class="avatar">${a.kupe.slice(-2)}</div>
                         <span class="ttl">${a.kupe} · Doğum: ${a.dogum} · Günlük süt: ${a.sut}L</span></div></div>`
                      : `<div class="empty">Kayıt bulunamadı.</div>`;
                  }
                }}>Bul</button>
              </div>
              <div id="animalCard" className="list" style={{ marginTop: 10 }} />
            </div>
          </section>

          <section className={`view ${view === "hayvan-ekle" ? "active" : ""}`} id="hayvan-ekle">
            <div className="card">
              <h3>Hayvan Ekle</h3>
              <div className="grid cols-2">
                <div><label className="muted">Küpe No</label><input className="input" placeholder="TR012345…" id="ekleKupe" /></div>
                <div><label className="muted">Doğum Tarihi</label><input className="input" type="date" id="ekleDogum" /></div>
              </div>
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn" onClick={() => {
                  const elKupe = document.getElementById("ekleKupe");
                  const elDogum = document.getElementById("ekleDogum");
                  const kupe = (elKupe && elKupe.value) ? elKupe.value.trim() : "";
                  const dogum = (elDogum && elDogum.value) ? elDogum.value : "—";
                  if (!kupe) return;
                  setAnimals((prev) => [...prev, { id: Date.now(), kupe, dogum, sut: 0 }]);
                  if (elKupe) elKupe.value = ""; if (elDogum) elDogum.value = "";
                  const m = document.getElementById("ekleMsg");
                  if (m) { m.textContent = "Kaydedildi (demo)."; setTimeout(() => (m.textContent = ""), 1500); }
                }}>Kaydet</button>
                <span id="ekleMsg" className="muted"></span>
              </div>
            </div>
          </section>

          <section className={`view ${view === "hayvan-listesi" ? "active" : ""}`} id="hayvan-listesi">
            <div className="card">
              <h3>Hayvan Listesi</h3>
              <div className="list">
                {filteredAnimals.map((a) => (
                  <div className="item" key={a.id}>
                    <div className="left"><div className="avatar">{a.kupe.slice(-2)}</div><span className="ttl">{a.kupe} · Doğum: {a.dogum}</span></div>
                    <button className="btn-ghost" onClick={() => separate(a.id)}>✂️ Ayır</button>
                  </div>
                ))}
                {filteredAnimals.length === 0 && (<div className="empty">Kayıt yok.</div>)}
              </div>
            </div>
          </section>

          <section className={`view ${view === "hayvan-ayir" ? "active" : ""}`} id="hayvan-ayir">
            <div className="card">
              <h3>Hayvan Ayır</h3>
              <p className="muted">Listeden seçip ayrılma işlemini simüle edin.</p>
              <div className="list">
                {animals.map((a) => (
                  <div className="item" key={a.id}>
                    <div className="left"><div className="avatar">{a.kupe.slice(-2)}</div><span className="ttl">{a.kupe} · Doğum: {a.dogum}</span></div>
                    <button className="btn-ghost" onClick={() => separate(a.id)}>✂️ Ayır</button>
                  </div>
                ))}
                {animals.length === 0 && <div className="empty">Kayıt yok.</div>}
              </div>
            </div>
          </section>

          {/* SÜT & SÜRÜ */}
          <section className={`view ${view === "sut-degerleri" ? "active" : ""}`} id="sut-degerleri">
            <div className="card"><h3>Süt Değerleri</h3><LineChart data={chartData} height={180} /></div>
          </section>
          <section className={`view ${view === "sut-miktari" ? "active" : ""}`} id="sut-miktari">
            <div className="card">
              <h3>Süt Miktarı</h3>
              <div className="muted">Günlük toplamlar.</div>
              <div className="list">
                {["Bugün", "Dün", "2 gün önce", "3 gün önce"].map((d, i) => {
                  const l = 60 + i * 3 + Math.round(Math.random() * 6);
                  return (
                    <div className="item" key={d}><div className="left"><span>💧</span><span className="ttl">{d}</span></div><b>{l} L</b></div>
                  );
                })}
              </div>
            </div>
          </section>
          <section className={`view ${view === "sagim-takvimi" ? "active" : ""}`} id="sagim-takvimi">
            <div className="card">
              <h3>Sağım Takvimi</h3>
              <div className="list">
                {schedule.map((x, idx) => (
                  <div className="item" key={idx}><div className="left"><span>📅</span><span className="ttl">{x.gun}</span></div><b className="muted">{x.saat}</b></div>
                ))}
              </div>
            </div>
          </section>
          <section className={`view ${view === "istatistikler" ? "active" : ""}`} id="istatistikler">
            <div className="card">
              <h3>İstatistikler</h3>
              <div className="grid cols-3">
                <div className="kpi"><div><div className="muted">Ortalama Süt (L)</div><div className="val">{Math.round((animals.reduce((a, b) => a + (b.sut || 0), 0) / Math.max(1, animals.length)) * 10) / 10}</div></div><span>⏱️</span></div>
                <div className="kpi"><div><div className="muted">Sağım Süresi (dk)</div><div className="val">28</div></div><span>🕒</span></div>
                <div className="kpi"><div><div className="muted">Randıman (%)</div><div className="val">91</div></div><span>📊</span></div>
              </div>
            </div>
          </section>

          {/* UYARILAR */}
          {[
            ["kizginlik", alerts.heat],
            ["tasma", alerts.collar],
            ["kova", alerts.bucket],
            ["tedavi", alerts.treatment],
            ["yem", alerts.feed],
          ].map(([id, list]) => (
            <section key={id} className={`view ${view === id ? "active" : ""}`} id={id}>
              <div className="card">
                <h3>
                  {id === "kizginlik" && "Kızgınlık Kontrol"}
                  {id === "tasma" && "Tasma Kontrol"}
                  {id === "kova" && "Kova Kontrol"}
                  {id === "tedavi" && "Tedavi Kontrol"}
                  {id === "yem" && "Yem Kontrol"}
                </h3>
                <div className="list">
                  {list.filter((s) => filterText(s)).map((s, i) => (
                    <div className="item" key={`${id}-${i}`}><div className="left"><span>🔔</span><span className="ttl">{s}</span></div></div>
                  ))}
                </div>
              </div>
            </section>
          ))}

          {/* GRUPLAR & AYARLAR */}
          <section className={`view ${view === "grup-yonetimi" ? "active" : ""}`} id="grup-yonetimi">
            <div className="card">
              <h3>Grup Yönetimi</h3>
              <div className="list">
                <div className="item"><div className="left"><span>👥</span><span className="ttl">1. Grup</span></div><button className="btn-ghost">Düzenle</button></div>
                <div className="item"><div className="left"><span>👥</span><span className="ttl">2. Grup</span></div><button className="btn-ghost">Düzenle</button></div>
              </div>
            </div>
          </section>
          <section className={`view ${view === "grup-listesi" ? "active" : ""}`} id="grup-listesi">
            <div className="card">
              <h3>Grup Listesi</h3>
              <div className="list">
                <div className="item"><div className="left"><span>📋</span><span className="ttl">1. Grup · 12 hayvan</span></div></div>
                <div className="item"><div className="left"><span>📋</span><span className="ttl">2. Grup · 9 hayvan</span></div></div>
              </div>
            </div>
          </section>
          <section className={`view ${view === "ciftlik-ayarlari" ? "active" : ""}`} id="ciftlik-ayarlari">
            <div className="card">
              <h3>Çiftlik Ayarları</h3>
              <div className="grid cols-2">
                <div><label className="muted">Başlık</label><input className="input" defaultValue="Seda Çiftlik" /></div>
                <div><label className="muted">Logo (URL)</label><input className="input" defaultValue="/logo.png" /></div>
              </div>
              <p className="muted" style={{ marginTop: 8 }}>Not: Demo alanıdır. Kalıcı kayıt için kendi API’na gönder.</p>
            </div>
          </section>

          {/* GEÇİŞ İŞLEMLERİ */}
          <section className={`view ${view === "yemleme" ? "active" : ""}`} id="yemleme">
            <div className="card">
              <h3>Buzağı Besleme</h3>
              <p className="muted">Bu bölüm ayrı sayfa yerine tek sayfa içinde gösterilir.</p>
              <div className="grid cols-2">
                <div><label className="muted">Günlük Rasyon (L)</label><input className="input" id="rationL" defaultValue="2.0" /></div>
                <div><label className="muted">Sıklık (gün/kez)</label><input className="input" id="rationF" defaultValue="3" /></div>
              </div>
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn" onClick={() => { const m = document.getElementById("rationMsg"); if (m) { m.textContent = "Kaydedildi (demo)."; setTimeout(() => (m.textContent = ""), 1500); } }}>💾 Kaydet</button>
                <span id="rationMsg" className="muted"></span>
              </div>
            </div>
          </section>

          {/* YENİ: 3D GÖRÜNÜM */}
          <section className={`view ${view === "model-3d" ? "active" : ""}`} id="model-3d">
            <Viewer3D />
          </section>

          {/* YÖNETİM (Admin) */}
          {isAdmin && (
            <section className={`view ${view === "yonetici-listesi" ? "active" : ""}`} id="yonetici-listesi">
              <div className="card">
                <h3>Yönetici Listesi</h3>
                <div className="list">
                  {[
                    { ad: "Yönetici 1", rol: "Süper Admin" },
                    { ad: "Yönetici 2", rol: "Editör" },
                  ].map((x) => (
                    <div className="item" key={x.ad}><div className="left"><span>🛡️</span><span className="ttl">{x.ad}</span></div><span className="muted">{x.rol}</span></div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  );
}
