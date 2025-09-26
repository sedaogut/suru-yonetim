import React, { useEffect, useRef, useState } from "react";
import { apiClient } from "./api";

// API'den gelen farklı şekilleri tek tipe çevirme
function normalizePosts(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export default function App() {
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
      inputRef.current?.focus();
    } catch {
      setError("Gönderi eklenemedi. Lütfen tekrar deneyin.");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    // Sunucu DELETE destekliyorsa çalışır; desteklemiyorsa bu butonu kaldır.
    try {
      await apiClient.delete(`/posts/${id}`);
      setPosts((p) => p.filter((x) => (x.id ?? x._id) !== id));
    } catch {
      setError("Silme işlemi başarısız oldu.");
    }
  };

  return (
    <>
      {/* Sadece bu dosyada geçerli, ekstra paket yok */}
      <style>{`
        :root { color-scheme: dark; --bg:#0b1020; --panel:rgba(255,255,255,.06); --border:rgba(255,255,255,.12); --text:#e5e7eb; --muted:#9aa4b2; --brand:#6366f1; }
        * { box-sizing: border-box; }
        html, body, #root { height: 100%; }
        body { margin: 0; background: radial-gradient(1200px 600px at 20% -10%, #4f46e5 0%, rgba(2,6,23,0) 60%), linear-gradient(135deg, #0b1020 0%, #0b1224 60%, #0e1530 100%); color: var(--text); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, "Apple Color Emoji","Segoe UI Emoji"; -webkit-font-smoothing: antialiased; }
        .wrap { min-height: 100vh; display: grid; place-items: center; padding: 56px 18px; }
        .container { width: 100%; max-width: 2080px; }
        .title { font-size: 30px; font-weight: 800; letter-spacing: -0.02em; }
        .sub { margin-top: 6px; color: var(--muted); }
        .card { margin-top: 16px; background: var(--panel); border:1px solid var(--border); border-radius: 18px; backdrop-filter: blur(8px); box-shadow: 0 10px 30px rgba(0,0,0,.25); padding: 18px; }
        .row { display: flex; gap: 10px; align-items: center; }
        .input { flex: 1; height: 46px; border-radius: 12px; border: 1px solid rgba(255,255,255,.2); background: rgba(255,255,255,.9); color:#0b1020; padding: 0 12px; font-size: 14px; outline: none; transition: box-shadow .2s, border-color .2s, transform .12s; }
        .input::placeholder { color:#64748b; }
        .input:focus { border-color: #818cf8; box-shadow: 0 0 0 3px rgba(99,102,241,.35); }
        .btn { height: 46px; padding: 0 16px; border: 1px solid rgba(255,255,255,.2); border-radius: 12px; background: linear-gradient(180deg, var(--brand), #4f46e5); color: white; font-weight: 700; letter-spacing: .2px; cursor: pointer; transition: transform .08s ease, filter .2s ease, opacity .2s; }
        .btn:disabled { opacity: .6; cursor: not-allowed; }
        .btn:not(:disabled):active { transform: translateY(1px); }
        .err { margin-top: 10px; color: #fecaca; font-size: 13px; }
        .listWrap { margin-top: 16px; max-height: 360px; overflow: auto; padding-right: 6px; }
        .ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
        .item { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px; border-radius: 14px; background: rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); transition: background .2s, transform .12s ease-out, border-color .2s; }
        .item:hover { background: rgba(255,255,255,.12); transform: translateY(-1px); border-color: rgba(255,255,255,.2); }
        .left { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .avatar { width: 36px; height: 36px; border-radius: 50%; background: rgba(99,102,241,.25); display: grid; place-items: center; color:#c7d2fe; font-weight: 800; }
        .ttl { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 14px; }
        .ghost { background: transparent; border: none; color: var(--text); opacity: 0; cursor: pointer; transition: opacity .2s, transform .08s; }
        .item:hover .ghost { opacity: 1; }
        .ghost:active { transform: translateY(1px); }
        .muted { margin-top: 10px; color: var(--muted); font-size: 12px; }
        .skeleton { display: flex; gap: 10px; align-items: center; margin: 8px 0; }
        .skA { width: 36px; height: 36px; border-radius: 50%; background: rgba(148,163,184,.25); animation: pulse 1.2s infinite ease-in-out; }
        .skB { height: 14px; width: 65%; border-radius: 6px; background: rgba(148,163,184,.25); animation: pulse 1.2s infinite ease-in-out; }
        @keyframes pulse { 0%,100%{opacity:.5} 50%{opacity:1} }
        .empty { border: 1px dashed rgba(255,255,255,.2); border-radius: 16px; padding: 28px; text-align: center; background: rgba(255,255,255,.06); }
        .footer { margin-top: 14px; text-align: center; font-size: 12px; color: var(--muted); }
      `}</style>

      <div className="wrap">
        <div className="container">
          <div>
            <div className="title">Gönderiler</div>
            <div className="sub">Hızlıca başlık ekle, liste anında güncellensin.</div>
          </div>

          <div className="card" role="region" aria-live="polite">
            <div className="row">
              <input
                ref={inputRef}
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="Başlık yazın..."
                aria-label="Başlık"
              />
              <button
                className="btn"
                onClick={handleAdd}
                disabled={adding || !title.trim()}
                title="Ekle"
              >
                {adding ? "Ekleniyor…" : "Ekle"}
              </button>
            </div>

            {error && <div className="err">{error}</div>}

            <div className="listWrap">
              {loading ? (
                <div>
                  <div className="skeleton"><div className="skA" /><div className="skB" /></div>
                  <div className="skeleton"><div className="skA" /><div className="skB" /></div>
                  <div className="skeleton"><div className="skA" /><div className="skB" /></div>
                </div>
              ) : posts.length === 0 ? (
                <div className="empty">
                  <div style={{fontWeight: 800, marginBottom: 6}}>Henüz gönderi yok</div>
                  <div style={{opacity: .8, fontSize: 14}}>Yukarıdan bir başlık eklemeyi deneyin.</div>
                </div>
              ) : (
                <>
                  <ul className="ul">
                    {posts.map((p, i) => {
                      const id = String(p.id ?? p._id ?? `${p.title}-${i}`);
                      const initial = ((p.title ?? "?").trim().charAt(0).toUpperCase()) || "?";
                      return (
                        <li className="item" key={id}>
                          <div className="left">
                            <div className="avatar">{initial}</div>
                            <span className="ttl">{p.title}</span>
                          </div>
                          {(p.id || p._id) && (
                            <button
                              className="ghost"
                              aria-label="Sil"
                              title="Sil"
                              onClick={() => handleDelete(p.id ?? p._id)}
                            >
                              ✖
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <div className="muted">Toplam <b>{posts.length}</b> gönderi</div>
                </>
              )}
            </div>
          </div>

          <div className="footer">Made with Seda Ö. ❤</div>
        </div>
      </div>
    </>
  );
}
