import { useEffect, useState } from "react";
import { apiClient } from "./api";

export default function App(){
  const [posts,setPosts]=useState([]);
  const [title,setTitle]=useState("");

  useEffect(()=>{
    apiClient.get("/posts").then(r=>{
      setPosts(Array.isArray(r.data) ? r.data : (Array.isArray(r.data?.data) ? r.data.data : []));
    });
  },[]);

  const add = async () => {
    if(!title.trim()) return;
    const { data } = await apiClient.post("/posts", { title });
    setPosts(p=>[data, ...p]);
    setTitle("");
  };

  return (
    <div style={{padding:24}}>
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="başlık" />
      <button onClick={add}>Ekle</button>
      <ul>{posts.map(p=> <li key={p.id}>{p.title}</li>)}</ul>
    </div>
  );
}
