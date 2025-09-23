// src/App.jsx
import { useEffect, useState } from 'react'
import axios from 'axios'
export default function App(){
  const [msg,setMsg]=useState('...')
  useEffect(()=>{
    axios.get(`${import.meta.env.VITE_API_URL}/health`)
      .then(r=>setMsg(JSON.stringify(r.data)))
      .catch(()=>setMsg('API erişimi yok'))
  },[])
  return <div>Health: {msg}</div>
}
