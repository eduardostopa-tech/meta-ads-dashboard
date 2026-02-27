import { useState, useMemo, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const sum = (arr, key) => arr.reduce((a, b) => a + (b[key] || 0), 0);
const pct = (curr, prev) => prev === 0 ? null : ((curr - prev) / prev) * 100;
const fmt = (v, type) => {
  if (v === null || v === undefined) return "–";
  if (type === "brl") return `R$ ${v.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  if (type === "pct") return `${(v * 100).toFixed(2)}%`;
  if (type === "dec") return v.toFixed(2);
  if (type === "int") return Math.round(v).toLocaleString("pt-BR");
  return v;
};

function KPICard({ label, curr, prev, valueType, lowerIsBetter = false }) {
  const diffPct = prev ? pct(curr, prev) : null;
  const isGood = diffPct !== null ? (lowerIsBetter ? diffPct < 0 : diffPct > 0) : null;
  return (
    <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"16px 20px", display:"flex", flexDirection:"column", gap:6, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:isGood===true?"#22c55e":isGood===false?"#ef4444":"#3b82f6" }} />
      <div style={{ fontSize:11, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:600 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:800, color:"#f1f5f9" }}>{fmt(curr, valueType)}</div>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:11, color:"#64748b" }}>Ant: {fmt(prev, valueType)}</span>
        {diffPct !== null && <span style={{ color:isGood?"#22c55e":"#ef4444", fontSize:11, fontWeight:700 }}>{diffPct>0?"▲":"▼"} {Math.abs(diffPct).toFixed(1)}%</span>}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"60vh", gap:16 }}>
      <div style={{ width:48, height:48, borderRadius:"50%", border:"3px solid rgba(59,130,246,0.2)", borderTop:"3px solid #3b82f6", animation:"spin 0.8s linear infinite" }} />
      <div style={{ color:"#64748b", fontSize:13 }}>Buscando dados do Windsor.ai...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("spend");
  const [sortDir, setSortDir] = useState("desc");
  const [activeChart, setActiveChart] = useState("conversas");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/data");
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date().toLocaleTimeString("pt-BR"));
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const currentWeekRaw = data?.current || [];
  const prevWeekRaw = data?.prev || [];
  const periods = data?.periods || {};

  const cSpend=sum(currentWeekRaw,"spend"), cImpressions=sum(currentWeekRaw,"impressions"), cReach=sum(currentWeekRaw,"reach"), cLinkClicks=sum(currentWeekRaw,"link_clicks"), cConversas=sum(currentWeekRaw,"conversas");
  const cCPC=cLinkClicks?cSpend/cLinkClicks:0, cCTR=cImpressions?cLinkClicks/cImpressions:0;
  const cCTRLink=cImpressions?currentWeekRaw.reduce((a,b)=>a+(b.ctr_link||0)*(b.impressions||0),0)/cImpressions:0;
  const cCPM=cImpressions?(cSpend/cImpressions)*1000:0, cFreq=cReach?cImpressions/cReach:0, cCPR=cConversas?cSpend/cConversas:0;

  const pSpend=sum(prevWeekRaw,"spend"), pImpressions=sum(prevWeekRaw,"impressions"), pReach=sum(prevWeekRaw,"reach"), pLinkClicks=sum(prevWeekRaw,"link_clicks"), pConversas=sum(prevWeekRaw,"conversas");
  const pCPC=pLinkClicks?pSpend/pLinkClicks:0, pCTR=pImpressions?pLinkClicks/pImpressions:0;
  const pCTRLink=pImpressions?prevWeekRaw.reduce((a,b)=>a+(b.ctr_link||0)*(b.impressions||0),0)/pImpressions:0;
  const pCPM=pImpressions?(pSpend/pImpressions)*1000:0, pFreq=pReach?pImpressions/pReach:0, pCPR=pConversas?pSpend/pConversas:0;

  const accounts = useMemo(() => {
    const prevMap={}; prevWeekRaw.forEach(r=>{prevMap[r.account_name]=r;});
    return currentWeekRaw.map(r=>({...r,prev:prevMap[r.account_name]||null}))
      .filter(r=>r.account_name.toLowerCase().includes(search.toLowerCase()))
      .sort((a,b)=>{ const av=a[sortKey]||0,bv=b[sortKey]||0; return sortDir==="desc"?bv-av:av-bv; });
  }, [currentWeekRaw,prevWeekRaw,search,sortKey,sortDir]);

  const chartData = useMemo(() => {
    const prevMap={}; prevWeekRaw.forEach(r=>{prevMap[r.account_name]=r;});
    return [...currentWeekRaw].sort((a,b)=>(b[activeChart]||0)-(a[activeChart]||0)).slice(0,12)
      .map(r=>({ name:r.account_name.length>16?r.account_name.slice(0,14)+"…":r.account_name, curr:r[activeChart]||0, prev:(prevMap[r.account_name]||{})[activeChart]||0 }));
  }, [currentWeekRaw,prevWeekRaw,activeChart]);

  const cols=[
    {key:"account_name",label:"Conta",w:200},
    {key:"conversas",label:"Conversas",w:100,type:"int"},
    {key:"cpr",label:"Custo/Result",w:110,type:"brl",lower:true},
    {key:"link_clicks",label:"Cliques Link",w:100,type:"int"},
    {key:"cpc",label:"CPC",w:80,type:"brl",lower:true},
    {key:"ctr",label:"CTR Total",w:90,type:"pct"},
    {key:"ctr_link",label:"CTR Link",w:90,type:"pct"},
    {key:"spend",label:"Gasto",w:100,type:"brl",lower:true},
    {key:"reach",label:"Alcance",w:90,type:"int"},
    {key:"frequency",label:"Freq.",w:70,type:"dec"},
    {key:"impressions",label:"Impressões",w:100,type:"int"},
    {key:"cpm",label:"CPM",w:80,type:"brl",lower:true},
  ];

  const chartOptions=[
    {key:"conversas",label:"Conversas"},{key:"spend",label:"Gasto"},
    {key:"link_clicks",label:"Cliques"},{key:"reach",label:"Alcance"},{key:"impressions",label:"Impressões"},
  ];

  return (
    <div style={{ fontFamily:"'DM Sans','Segoe UI',sans-serif", background:"#080e1a", minHeight:"100vh", color:"#e2e8f0", padding:"24px" }}>
      <div style={{ marginBottom:28, display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:"#3b82f6", boxShadow:"0 0 8px #3b82f6" }} />
            <span style={{ fontSize:11, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.15em", fontWeight:700 }}>Meta Ads · Todas as Contas</span>
          </div>
          <h1 style={{ fontSize:28, fontWeight:900, margin:0, background:"linear-gradient(135deg,#f1f5f9,#94a3b8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Dashboard de Performance</h1>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:11, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.1em" }}>Comparação WoW</div>
            <div style={{ fontSize:13, color:"#3b82f6", fontWeight:700 }}>Últimos 7d vs 7d anteriores</div>
            {periods.current && <div style={{ fontSize:10, color:"#475569", marginTop:2 }}>{periods.current}</div>}
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {lastUpdated && <span style={{ fontSize:10, color:"#475569" }}>Atualizado às {lastUpdated}</span>}
            <button onClick={fetchData} disabled={loading} style={{ padding:"6px 14px", borderRadius:8, border:"1px solid rgba(59,130,246,0.4)", background:"rgba(59,130,246,0.1)", color:"#3b82f6", fontSize:11, fontWeight:700, cursor:loading?"not-allowed":"pointer", opacity:loading?0.6:1 }}>
              {loading?"⏳ Carregando...":"↻ Atualizar"}
            </button>
          </div>
        </div>
      </div>

      {error && <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:10, padding:"12px 16px", marginBottom:20, color:"#fca5a5", fontSize:13 }}>⚠️ Erro: {error}</div>}

      {loading ? <Spinner /> : <>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:12, marginBottom:28 }}>
          <KPICard label="Conversas" curr={cConversas} prev={pConversas} valueType="int" />
          <KPICard label="Custo por Resultado" curr={cCPR} prev={pCPR} valueType="brl" lowerIsBetter />
          <KPICard label="Valor Usado" curr={cSpend} prev={pSpend} valueType="brl" lowerIsBetter />
          <KPICard label="Cliques no Link" curr={cLinkClicks} prev={pLinkClicks} valueType="int" />
          <KPICard label="CPC" curr={cCPC} prev={pCPC} valueType="brl" lowerIsBetter />
          <KPICard label="CTR Total" curr={cCTR} prev={pCTR} valueType="pct" />
          <KPICard label="CTR Clique no Link" curr={cCTRLink} prev={pCTRLink} valueType="pct" />
          <KPICard label="Alcance" curr={cReach} prev={pReach} valueType="int" />
          <KPICard label="Frequência" curr={cFreq} prev={pFreq} valueType="dec" lowerIsBetter />
          <KPICard label="Impressões" curr={cImpressions} prev={pImpressions} valueType="int" />
          <KPICard label="CPM" curr={cCPM} prev={pCPM} valueType="brl" lowerIsBetter />
        </div>

        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"20px 24px", marginBottom:24 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:10 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#cbd5e1" }}>Top 12 Contas por Métrica</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {chartOptions.map(o=>(
                <button key={o.key} onClick={()=>setActiveChart(o.key)} style={{ padding:"5px 12px", borderRadius:6, border:"none", cursor:"pointer", fontSize:11, fontWeight:700, background:activeChart===o.key?"#3b82f6":"rgba(255,255,255,0.06)", color:activeChart===o.key?"#fff":"#94a3b8" }}>{o.label}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} barGap={2} barCategoryGap="25%">
              <XAxis dataKey="name" tick={{fill:"#64748b",fontSize:9}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill:"#64748b",fontSize:10}} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{background:"#0f172a",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,fontSize:12}} labelStyle={{color:"#94a3b8",fontWeight:700}} />
              <Bar dataKey="curr" name="Semana Atual" radius={[4,4,0,0]} fill="#3b82f6" />
              <Bar dataKey="prev" name="Semana Ant." radius={[4,4,0,0]} fill="rgba(59,130,246,0.25)" />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display:"flex", gap:16, marginTop:8, justifyContent:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#64748b" }}><div style={{width:12,height:12,borderRadius:2,background:"#3b82f6"}}/> Semana Atual</div>
            <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#64748b" }}><div style={{width:12,height:12,borderRadius:2,background:"rgba(59,130,246,0.3)"}}/> Semana Anterior</div>
          </div>
        </div>

        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, overflow:"hidden" }}>
          <div style={{ padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid rgba(255,255,255,0.06)", flexWrap:"wrap", gap:10 }}>
            <span style={{ fontSize:13, fontWeight:700, color:"#cbd5e1" }}>Detalhamento por Conta ({accounts.length} contas)</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Filtrar conta..."
              style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"6px 12px", color:"#e2e8f0", fontSize:12, outline:"none", width:200 }} />
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead>
                <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                  {cols.map(c=>(
                    <th key={c.key} onClick={()=>{setSortKey(c.key);setSortDir(sortKey===c.key&&sortDir==="desc"?"asc":"desc");}}
                      style={{ textAlign:c.key==="account_name"?"left":"right", padding:"10px 12px", color:sortKey===c.key?"#3b82f6":"#64748b", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", fontSize:10, cursor:"pointer", whiteSpace:"nowrap", minWidth:c.w }}>
                      {c.label} {sortKey===c.key?(sortDir==="desc"?"↓":"↑"):""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {accounts.map((r,i)=>(
                  <tr key={r.account_name} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)", background:i%2===0?"transparent":"rgba(255,255,255,0.01)" }}>
                    <td style={{ padding:"9px 12px", color:"#cbd5e1", fontWeight:600, whiteSpace:"nowrap" }}>{r.account_name}</td>
                    {cols.slice(1).map(c=>{
                      const curr=r[c.key]||0, prev=r.prev?(r.prev[c.key]||0):null;
                      const diffPct=prev?pct(curr,prev):null;
                      const isGood=diffPct!==null?(c.lower?diffPct<0:diffPct>0):null;
                      return (
                        <td key={c.key} style={{ padding:"9px 12px", textAlign:"right", whiteSpace:"nowrap" }}>
                          <span style={{color:"#e2e8f0"}}>{fmt(curr,c.type)}</span>
                          {diffPct!==null && <span style={{color:isGood?"#22c55e":"#ef4444",fontSize:10,marginLeft:5,fontWeight:700}}>{diffPct>0?"▲":"▼"}{Math.abs(diffPct).toFixed(0)}%</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>}
      <div style={{ marginTop:16, textAlign:"center", fontSize:11, color:"#334155" }}>
        Dados em tempo real via Windsor.ai · Meta Ads · {periods.current||""}
      </div>
    </div>
  );
}
