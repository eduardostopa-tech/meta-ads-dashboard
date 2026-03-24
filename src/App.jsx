import { useState, useMemo, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const n = (v) => { const x = parseFloat(v); return isNaN(x) ? 0 : x; };
const sum = (arr, key) => arr.reduce((a, b) => a + n(b[key]), 0);
const pct = (curr, prev) => n(prev) === 0 ? null : ((n(curr) - n(prev)) / n(prev)) * 100;
const fmt = (v, type) => {
  const num = n(v);
  if (type === "brl") return `R$ ${num.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  if (type === "pct") return `${(num * 100).toFixed(2)}%`;
  if (type === "dec") return num.toFixed(2);
  if (type === "int") return Math.round(num).toLocaleString("pt-BR");
  return num;
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

function Spinner({ msg="Carregando..." }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"60vh", gap:16 }}>
      <div style={{ width:48, height:48, borderRadius:"50%", border:"3px solid rgba(59,130,246,0.2)", borderTop:"3px solid #3b82f6", animation:"spin 0.8s linear infinite" }} />
      <div style={{ color:"#64748b", fontSize:13, maxWidth:340, textAlign:"center", lineHeight:1.5 }}>{msg}</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const PCOLOR = { Alta:"#ef4444", Média:"#f59e0b", Baixa:"#3b82f6" };
const PBG    = { Alta:"rgba(239,68,68,0.07)", Média:"rgba(245,158,11,0.07)", Baixa:"rgba(59,130,246,0.07)" };

function OptCard({ item }) {
  const [open, setOpen] = useState(false);
  const color = PCOLOR[item.prioridade] || "#64748b";
  const bg    = PBG[item.prioridade]    || "rgba(255,255,255,0.04)";
  return (
    <div onClick={()=>setOpen(!open)} style={{ background:bg, border:`1px solid ${color}33`, borderRadius:12, padding:"14px 18px", cursor:"pointer", transition:"all 0.15s" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, flexWrap:"wrap" }}>
            <span style={{ fontSize:10, fontWeight:800, color, background:`${color}22`, padding:"2px 8px", borderRadius:4, textTransform:"uppercase", letterSpacing:"0.08em" }}>{item.prioridade}</span>
            {item.alertas?.map(a=>(
              <span key={a} style={{ fontSize:10, color:"#94a3b8", background:"rgba(255,255,255,0.05)", padding:"2px 7px", borderRadius:4, border:"1px solid rgba(255,255,255,0.07)" }}>{a}</span>
            ))}
          </div>
          <div style={{ fontSize:14, fontWeight:700, color:"#e2e8f0" }}>{item.conta}</div>
          <div style={{ fontSize:12, color:"#94a3b8", marginTop:3 }}>{item.resumo}</div>
        </div>
        <div style={{ color:"#475569", fontSize:14, transition:"transform 0.2s", transform:open?"rotate(180deg)":"rotate(0deg)", marginTop:2 }}>▼</div>
      </div>
      {open && (
        <div style={{ marginTop:14, paddingTop:14, borderTop:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize:12, color:"#cbd5e1", lineHeight:1.8, whiteSpace:"pre-wrap" }}>{item.acoes}</div>
          {item.metricas?.length > 0 && (
            <div style={{ marginTop:10, display:"flex", gap:8, flexWrap:"wrap" }}>
              {item.metricas.map(m=>(
                <div key={m} style={{ fontSize:11, color:"#64748b", background:"rgba(255,255,255,0.04)", padding:"3px 9px", borderRadius:5, border:"1px solid rgba(255,255,255,0.06)" }}>{m}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

async function callClaude(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      model:"claude-sonnet-4-20250514",
      max_tokens:4000,
      system:`Você é um especialista em Meta Ads para clínicas médicas e estéticas no Brasil.
Analise os dados de performance e gere otimizações práticas e específicas para cada conta.
Responda SOMENTE com JSON válido, sem markdown, sem texto fora do JSON, no formato:
[{"conta":"nome exato","prioridade":"Alta|Média|Baixa","alertas":["alerta1","alerta2"],"resumo":"diagnóstico em 1 frase","acoes":"• Ação 1\n• Ação 2\n• Ação 3","metricas":["CPR: R$ X","Freq: X"]}]`,
      messages:[{role:"user", content:prompt}]
    })
  });
  const data = await res.json();
  const text = data.content?.find(b=>b.type==="text")?.text || "[]";
  return JSON.parse(text.replace(/```json|```/g,"").trim());
}

export default function App() {
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [search, setSearch]           = useState("");
  const [sortKey, setSortKey]         = useState("spend");
  const [sortDir, setSortDir]         = useState("desc");
  const [activeChart, setActiveChart] = useState("conversas");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab]     = useState("dashboard");
  const [opts, setOpts]               = useState(null);
  const [optLoading, setOptLoading]   = useState(false);
  const [optError, setOptError]       = useState(null);
  const [optFilter, setOptFilter]     = useState("Todas");

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

  useEffect(()=>{ fetchData(); },[]);

  const generateOpts = async () => {
    if (!data) return;
    setOptLoading(true); setOptError(null); setOpts(null);
    try {
      const curr = data.current || [];
      const prevMap = {};
      (data.prev||[]).forEach(r=>{ prevMap[r.account_name]=r; });

      const avgCPR = (()=>{ const v=curr.filter(r=>r.cpr>0); return v.length?v.reduce((a,b)=>a+b.cpr,0)/v.length:0; })();
      const avgCTR = curr.reduce((a,b)=>a+b.ctr,0)/(curr.length||1);

      const accounts = curr.map(r => {
        const p = prevMap[r.account_name] || {};
        const alerts = [];
        if (r.frequency > 3)                          alerts.push("Frequência alta (>3)");
        if (r.conversas === 0 && r.spend > 50)        alerts.push("Zero conversões com gasto");
        if (r.cpr > avgCPR * 1.5 && r.cpr > 0)       alerts.push("CPR acima da média");
        if (r.ctr < avgCTR * 0.6)                     alerts.push("CTR abaixo do benchmark");
        if (r.spend > 300 && r.conversas < 3)         alerts.push("Gasto alto sem resultado");
        if (p.reach && r.reach < p.reach * 0.8)       alerts.push("Alcance caindo WoW");
        return alerts.length ? {
          conta: r.account_name,
          tipo_conversao: r.metric_label,
          conversas: r.conversas,
          conversas_anterior: p.conversas||0,
          cpr: `R$ ${(r.cpr||0).toFixed(2)}`,
          cpr_anterior: `R$ ${(p.cpr||0).toFixed(2)}`,
          gasto: `R$ ${(r.spend||0).toFixed(2)}`,
          cpc: `R$ ${(r.cpc||0).toFixed(2)}`,
          ctr: `${((r.ctr||0)*100).toFixed(2)}%`,
          frequencia: (r.frequency||0).toFixed(2),
          alcance: r.reach, alcance_anterior: p.reach||0,
          impressoes: r.impressions,
          alertas_detectados: alerts,
        } : null;
      }).filter(Boolean);

      const prompt = `Analise ${accounts.length} contas de Meta Ads de clínicas médicas/estéticas brasileiras com alertas.
Média CPR geral: ${avgCPR.toFixed(2)} BRL | Média CTR geral: ${(avgCTR*100).toFixed(2)}%

CONTAS COM ALERTAS (período: ${data.periods?.current||"últimos 7 dias"}):
${JSON.stringify(accounts, null, 1)}

Gere otimizações práticas para cada conta. Foque em ações concretas específicas para o nicho médico/estético.
- Alta: 3+ alertas, ou zero conversões + alto gasto, ou gasto >R$500 sem resultado
- Média: 1-2 alertas moderados
- Baixa: alertas menores`;

      const result = await callClaude(prompt);
      setOpts(result);
    } catch(e) { setOptError(e.message); }
    finally { setOptLoading(false); }
  };

  const curr = data?.current||[], prevArr = data?.prev||[], periods = data?.periods||{};

  const cSpend=sum(curr,"spend"), cImp=sum(curr,"impressions"), cReach=sum(curr,"reach"),
        cClicks=sum(curr,"link_clicks"), cConv=sum(curr,"conversas");
  const cCPC=cClicks?cSpend/cClicks:0, cCTR=cImp?cClicks/cImp:0;
  const cCTRL=cImp?curr.reduce((a,b)=>a+(b.ctr_link||0)*(b.impressions||0),0)/cImp:0;
  const cCPM=cImp?(cSpend/cImp)*1000:0, cFreq=cReach?cImp/cReach:0, cCPR=cConv?cSpend/cConv:0;

  const pSpend=sum(prevArr,"spend"), pImp=sum(prevArr,"impressions"), pReach=sum(prevArr,"reach"),
        pClicks=sum(prevArr,"link_clicks"), pConv=sum(prevArr,"conversas");
  const pCPC=pClicks?pSpend/pClicks:0, pCTR=pImp?pClicks/pImp:0;
  const pCTRL=pImp?prevArr.reduce((a,b)=>a+(b.ctr_link||0)*(b.impressions||0),0)/pImp:0;
  const pCPM=pImp?(pSpend/pImp)*1000:0, pFreq=pReach?pImp/pReach:0, pCPR=pConv?pSpend/pConv:0;

  const accounts = useMemo(()=>{
    const pm={}; prevArr.forEach(r=>{pm[r.account_name]=r;});
    return curr.map(r=>({...r,prev:pm[r.account_name]||null}))
      .filter(r=>r.account_name.toLowerCase().includes(search.toLowerCase()))
      .sort((a,b)=>{ const av=a[sortKey]||0,bv=b[sortKey]||0; return sortDir==="desc"?bv-av:av-bv; });
  },[curr,prevArr,search,sortKey,sortDir]);

  const chartData = useMemo(()=>{
    const pm={}; prevArr.forEach(r=>{pm[r.account_name]=r;});
    return [...curr].sort((a,b)=>(b[activeChart]||0)-(a[activeChart]||0)).slice(0,12)
      .map(r=>({ name:r.account_name.length>16?r.account_name.slice(0,14)+"…":r.account_name, curr:r[activeChart]||0, prev:(pm[r.account_name]||{})[activeChart]||0 }));
  },[curr,prevArr,activeChart]);

  const filteredOpts = useMemo(()=>{
    if (!opts) return [];
    return optFilter==="Todas"?opts:opts.filter(o=>o.prioridade===optFilter);
  },[opts,optFilter]);

  const pCounts = useMemo(()=>{
    if (!opts) return {};
    return opts.reduce((acc,o)=>{ acc[o.prioridade]=(acc[o.prioridade]||0)+1; return acc; },{});
  },[opts]);

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

  const chartOpts=[
    {key:"conversas",label:"Conversas"},{key:"spend",label:"Gasto"},
    {key:"link_clicks",label:"Cliques"},{key:"reach",label:"Alcance"},{key:"impressions",label:"Impressões"},
  ];

  return (
    <div style={{ fontFamily:"'DM Sans','Segoe UI',sans-serif", background:"#080e1a", minHeight:"100vh", color:"#e2e8f0", padding:"24px" }}>

      {/* Header */}
      <div style={{ marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:"#3b82f6", boxShadow:"0 0 8px #3b82f6" }} />
            <span style={{ fontSize:11, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.15em", fontWeight:700 }}>Meta Ads · Todas as Contas</span>
          </div>
          <h1 style={{ fontSize:26, fontWeight:900, margin:0, background:"linear-gradient(135deg,#f1f5f9,#94a3b8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Dashboard de Performance</h1>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {lastUpdated && <span style={{ fontSize:10, color:"#475569" }}>Atualizado às {lastUpdated}</span>}
          <button onClick={fetchData} disabled={loading} style={{ padding:"6px 14px", borderRadius:8, border:"1px solid rgba(59,130,246,0.4)", background:"rgba(59,130,246,0.1)", color:"#3b82f6", fontSize:11, fontWeight:700, cursor:loading?"not-allowed":"pointer", opacity:loading?0.6:1 }}>
            {loading?"⏳ Carregando...":"↻ Atualizar"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:2, marginBottom:24, borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
        {[{id:"dashboard",label:"📊 Dashboard"},{id:"otimizacoes",label:"🤖 Otimizações IA"}].map(t=>(
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{
            padding:"10px 22px", borderRadius:"8px 8px 0 0", border:"none", cursor:"pointer",
            fontSize:13, fontWeight:700,
            background:activeTab===t.id?"rgba(59,130,246,0.12)":"transparent",
            color:activeTab===t.id?"#3b82f6":"#64748b",
            borderBottom:activeTab===t.id?"2px solid #3b82f6":"2px solid transparent",
          }}>{t.label}{t.id==="otimizacoes"&&opts?<span style={{marginLeft:6,fontSize:10,background:"#ef4444",color:"#fff",borderRadius:10,padding:"1px 6px"}}>{opts.length}</span>:null}</button>
        ))}
      </div>

      {error && <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:10, padding:"12px 16px", marginBottom:20, color:"#fca5a5", fontSize:13 }}>⚠️ Erro: {error}</div>}

      {/* DASHBOARD TAB */}
      {activeTab==="dashboard" && (loading ? <Spinner msg="Buscando dados do Windsor.ai..." /> : <>
        <div style={{ marginBottom:18, fontSize:11, color:"#475569" }}>
          📅 Atual: <span style={{color:"#3b82f6",fontWeight:700}}>{periods.current}</span>
          &nbsp;|&nbsp; Anterior: <span style={{color:"#64748b"}}>{periods.prev}</span>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(175px,1fr))", gap:12, marginBottom:28 }}>
          <KPICard label="Conversas"         curr={cConv}  prev={pConv}  valueType="int" />
          <KPICard label="Custo/Resultado"   curr={cCPR}   prev={pCPR}   valueType="brl" lowerIsBetter />
          <KPICard label="Valor Usado"       curr={cSpend} prev={pSpend} valueType="brl" lowerIsBetter />
          <KPICard label="Cliques no Link"   curr={cClicks}prev={pClicks}valueType="int" />
          <KPICard label="CPC"               curr={cCPC}   prev={pCPC}   valueType="brl" lowerIsBetter />
          <KPICard label="CTR Total"         curr={cCTR}   prev={pCTR}   valueType="pct" />
          <KPICard label="CTR Clique Link"   curr={cCTRL}  prev={pCTRL}  valueType="pct" />
          <KPICard label="Alcance"           curr={cReach} prev={pReach} valueType="int" />
          <KPICard label="Frequência"        curr={cFreq}  prev={pFreq}  valueType="dec" lowerIsBetter />
          <KPICard label="Impressões"        curr={cImp}   prev={pImp}   valueType="int" />
          <KPICard label="CPM"               curr={cCPM}   prev={pCPM}   valueType="brl" lowerIsBetter />
        </div>

        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"20px 24px", marginBottom:24 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:10 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#cbd5e1" }}>Top 12 Contas por Métrica</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {chartOpts.map(o=>(
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
              <Bar dataKey="prev" name="Semana Ant."  radius={[4,4,0,0]} fill="rgba(59,130,246,0.25)" />
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
                    <td style={{ padding:"9px 12px", color:"#cbd5e1", fontWeight:600, whiteSpace:"nowrap" }}>
                      {r.account_name}
                      {r.metric_label==="Conv. Pixel Custom"&&<span style={{fontSize:9,color:"#a78bfa",marginLeft:6,background:"rgba(167,139,250,0.1)",padding:"1px 5px",borderRadius:3}}>PIXEL</span>}
                      {r.metric_label==="Contato no Site"&&<span style={{fontSize:9,color:"#34d399",marginLeft:6,background:"rgba(52,211,153,0.1)",padding:"1px 5px",borderRadius:3}}>CONTATO</span>}
                    </td>
                    {cols.slice(1).map(c=>{
                      const cv=r[c.key]||0, pv=r.prev?(r.prev[c.key]||0):null;
                      const dp=pv?pct(cv,pv):null;
                      const ig=dp!==null?(c.lower?dp<0:dp>0):null;
                      return (
                        <td key={c.key} style={{ padding:"9px 12px", textAlign:"right", whiteSpace:"nowrap" }}>
                          <span style={{color:"#e2e8f0"}}>{fmt(cv,c.type)}</span>
                          {dp!==null&&<span style={{color:ig?"#22c55e":"#ef4444",fontSize:10,marginLeft:5,fontWeight:700}}>{dp>0?"▲":"▼"}{Math.abs(dp).toFixed(0)}%</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>)}

      {/* OTIMIZAÇÕES TAB */}
      {activeTab==="otimizacoes" && (
        <div>
          {!opts && !optLoading && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"55vh", gap:20 }}>
              <div style={{ fontSize:52 }}>🤖</div>
              <div style={{ fontSize:18, fontWeight:800, color:"#e2e8f0" }}>Análise de Otimizações por IA</div>
              <div style={{ fontSize:13, color:"#64748b", textAlign:"center", maxWidth:500, lineHeight:1.7 }}>
                O Claude analisa todas as <strong style={{color:"#94a3b8"}}>{curr.length} contas</strong>, detecta alertas automaticamente e gera recomendações práticas e específicas para cada cliente.
              </div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center", maxWidth:560 }}>
                {["🔴 Zero conversões com gasto","🟡 CPR acima da média","🟠 Frequência alta (>3)","🔵 CTR abaixo do benchmark","🟥 Gasto alto sem resultado","📉 Alcance caindo WoW"].map(a=>(
                  <span key={a} style={{ fontSize:11, color:"#94a3b8", background:"rgba(255,255,255,0.04)", padding:"4px 10px", borderRadius:6, border:"1px solid rgba(255,255,255,0.07)" }}>{a}</span>
                ))}
              </div>
              {loading
                ? <div style={{color:"#475569",fontSize:13}}>⏳ Aguardando dados do dashboard...</div>
                : <button onClick={generateOpts} style={{ padding:"13px 36px", borderRadius:10, border:"none", cursor:"pointer", background:"linear-gradient(135deg,#3b82f6,#6366f1)", color:"#fff", fontSize:14, fontWeight:800, boxShadow:"0 4px 24px rgba(59,130,246,0.35)", letterSpacing:"0.02em" }}>
                    ✨ Gerar Otimizações com IA
                  </button>
              }
            </div>
          )}

          {optLoading && <Spinner msg="O Claude está analisando suas campanhas e gerando recomendações... isso pode levar alguns segundos ✨" />}

          {optError && (
            <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:10, padding:"12px 16px", color:"#fca5a5", fontSize:13, display:"flex", alignItems:"center", gap:12 }}>
              ⚠️ Erro: {optError}
              <button onClick={generateOpts} style={{padding:"4px 12px",borderRadius:6,border:"1px solid #ef4444",background:"transparent",color:"#ef4444",cursor:"pointer",fontSize:11,fontWeight:700}}>Tentar novamente</button>
            </div>
          )}

          {opts && !optLoading && (
            <>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18, flexWrap:"wrap", gap:12 }}>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
                  <span style={{ fontSize:14, fontWeight:800, color:"#e2e8f0" }}>{opts.length} contas com alertas</span>
                  {Object.entries(pCounts).sort((a,b)=>["Alta","Média","Baixa"].indexOf(a[0])-["Alta","Média","Baixa"].indexOf(b[0])).map(([p,c])=>(
                    <span key={p} style={{ fontSize:11, fontWeight:700, color:PCOLOR[p], background:PBG[p], padding:"3px 10px", borderRadius:6, border:`1px solid ${PCOLOR[p]}44` }}>{c} {p}</span>
                  ))}
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {["Todas","Alta","Média","Baixa"].map(f=>(
                    <button key={f} onClick={()=>setOptFilter(f)} style={{ padding:"5px 12px", borderRadius:6, border:"none", cursor:"pointer", fontSize:11, fontWeight:700, background:optFilter===f?(PCOLOR[f]||"#3b82f6"):"rgba(255,255,255,0.06)", color:optFilter===f?"#fff":"#94a3b8" }}>{f}</button>
                  ))}
                  <button onClick={generateOpts} style={{ padding:"5px 14px", borderRadius:6, border:"1px solid rgba(59,130,246,0.4)", background:"rgba(59,130,246,0.1)", color:"#3b82f6", fontSize:11, fontWeight:700, cursor:"pointer", marginLeft:4 }}>↻ Reanalisar</button>
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {filteredOpts.map((item,i)=><OptCard key={i} item={item} />)}
                {filteredOpts.length===0 && <div style={{ textAlign:"center", color:"#475569", padding:"40px", fontSize:13 }}>Nenhuma conta com prioridade "{optFilter}"</div>}
              </div>
            </>
          )}
        </div>
      )}

      <div style={{ marginTop:20, textAlign:"center", fontSize:11, color:"#1e293b" }}>
        Dados em tempo real via Windsor.ai · Meta Ads · {periods.current||""}
      </div>
    </div>
  );
}
