import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const currentWeekRaw = [
  {"account_name":"Dr. André Alves / Instituto Vitalite","conversas":37,"cpr":12.34,"link_clicks":84,"cpc":3.41,"ctr":0.0146,"ctr_link":0.0091,"spend":456.46,"reach":4903,"frequency":1.87,"impressions":9190,"cpm":49.67},
  {"account_name":"Clínica Personne","conversas":0,"cpr":0,"link_clicks":653,"cpc":0.48,"ctr":0.006,"ctr_link":0.0058,"spend":322.74,"reach":65202,"frequency":1.72,"impressions":111982,"cpm":2.88},
  {"account_name":"Nathalia Kassis [ESPANHOL]","conversas":5,"cpr":283.47,"link_clicks":3229,"cpc":0.38,"ctr":0.0461,"ctr_link":0.0394,"spend":1417.37,"reach":42771,"frequency":1.92,"impressions":81960,"cpm":17.29},
  {"account_name":"Spa Crepaldi","conversas":113,"cpr":6.25,"link_clicks":216,"cpc":1.25,"ctr":0.0174,"ctr_link":0.0067,"spend":706.56,"reach":16448,"frequency":1.97,"impressions":32478,"cpm":21.76},
  {"account_name":"CMD Olhos (Dra. Gabriela) - 1.1.2","conversas":35,"cpr":7.62,"link_clicks":131,"cpc":0.94,"ctr":0.0151,"ctr_link":0.007,"spend":266.6,"reach":10198,"frequency":1.85,"impressions":18824,"cpm":14.16},
  {"account_name":"Clinica Crepaldi","conversas":51,"cpr":12.52,"link_clicks":826,"cpc":0.64,"ctr":0.0261,"ctr_link":0.0217,"spend":638.58,"reach":21512,"frequency":1.77,"impressions":38051,"cpm":16.78},
  {"account_name":"Dra. Priscila Perin","conversas":35,"cpr":14.01,"link_clicks":877,"cpc":0.48,"ctr":0.033,"ctr_link":0.0281,"spend":490.28,"reach":23481,"frequency":1.33,"impressions":31203,"cpm":15.71},
  {"account_name":"CMD Olhos - CA 1.1.1","conversas":11,"cpr":19.36,"link_clicks":79,"cpc":1.40,"ctr":0.0144,"ctr_link":0.0075,"spend":212.92,"reach":6503,"frequency":1.63,"impressions":10587,"cpm":20.11},
  {"account_name":"Natasha - Antiga Convênios","conversas":240,"cpr":8.95,"link_clicks":463,"cpc":2.62,"ctr":0.0193,"ctr_link":0.0109,"spend":2149.1,"reach":19587,"frequency":2.17,"impressions":42561,"cpm":50.49},
  {"account_name":"Dra. Camila Machado","conversas":34,"cpr":9.00,"link_clicks":327,"cpc":0.82,"ctr":0.0327,"ctr_link":0.0286,"spend":306.05,"reach":6917,"frequency":1.65,"impressions":11420,"cpm":26.80},
  {"account_name":"Lumiata - 01","conversas":244,"cpr":11.97,"link_clicks":1258,"cpc":1.44,"ctr":0.0109,"ctr_link":0.0067,"spend":2920.44,"reach":124626,"frequency":1.50,"impressions":186391,"cpm":15.67},
  {"account_name":"CA - Dr. Robson","conversas":2,"cpr":140.1,"link_clicks":12720,"cpc":0.03,"ctr":0.3294,"ctr_link":0.4071,"spend":280.2,"reach":3816,"frequency":8.19,"impressions":31248,"cpm":8.97},
  {"account_name":"Dr. Alexandre César","conversas":26,"cpr":19.54,"link_clicks":231,"cpc":1.41,"ctr":0.0061,"ctr_link":0.0039,"spend":507.94,"reach":22890,"frequency":2.56,"impressions":58685,"cpm":8.66},
  {"account_name":"Dra Lais Filadelfo","conversas":27,"cpr":5.35,"link_clicks":48,"cpc":1.47,"ctr":0.0252,"ctr_link":0.0123,"spend":144.33,"reach":2546,"frequency":1.53,"impressions":3890,"cpm":37.10},
  {"account_name":"CA - Dra Cristiane","conversas":88,"cpr":3.86,"link_clicks":142,"cpc":0.65,"ctr":0.0294,"ctr_link":0.008,"spend":339.45,"reach":8307,"frequency":2.14,"impressions":17800,"cpm":19.07},
  {"account_name":"CA - Dra Bianca Duarte","conversas":64,"cpr":13.22,"link_clicks":792,"cpc":0.82,"ctr":0.0165,"ctr_link":0.0127,"spend":846.14,"reach":21968,"frequency":2.84,"impressions":62487,"cpm":13.54},
  {"account_name":"CA - Dra. Sara Profeta","conversas":15,"cpr":14.74,"link_clicks":164,"cpc":1.11,"ctr":0.0221,"ctr_link":0.0182,"spend":221.16,"reach":7156,"frequency":1.26,"impressions":8987,"cpm":24.61},
  {"account_name":"Dra Daniela Ribeiro","conversas":4,"cpr":285.38,"link_clicks":209,"cpc":3.62,"ctr":0.0029,"ctr_link":0.0019,"spend":1141.52,"reach":13448,"frequency":8.05,"impressions":108313,"cpm":10.54},
  {"account_name":"Balmee Clínica & Spa","conversas":16,"cpr":10.37,"link_clicks":38,"cpc":1.55,"ctr":0.0151,"ctr_link":0.0054,"spend":165.86,"reach":4970,"frequency":1.42,"impressions":7066,"cpm":23.47},
  {"account_name":"Dra Andrea Morato","conversas":3,"cpr":155.44,"link_clicks":532,"cpc":0.63,"ctr":0.0298,"ctr_link":0.0214,"spend":466.32,"reach":17669,"frequency":1.41,"impressions":24866,"cpm":18.75},
  {"account_name":"Nathalia Kassis [CLINICA]","conversas":520,"cpr":7.39,"link_clicks":4201,"cpc":0.78,"ctr":0.0373,"ctr_link":0.032,"spend":3840.83,"reach":81953,"frequency":1.60,"impressions":131323,"cpm":29.25},
  {"account_name":"02 - Dra. Desiree Hickmann","conversas":107,"cpr":5.14,"link_clicks":178,"cpc":0.90,"ctr":0.0152,"ctr_link":0.0044,"spend":550.37,"reach":17650,"frequency":2.27,"impressions":40092,"cpm":13.73},
  {"account_name":"Dr Rogério Ferrari","conversas":32,"cpr":7.56,"link_clicks":967,"cpc":0.24,"ctr":0.0487,"ctr_link":0.0461,"spend":242.01,"reach":18431,"frequency":1.14,"impressions":20966,"cpm":11.54},
  {"account_name":"Dra Bruna Cotta","conversas":68,"cpr":8.75,"link_clicks":683,"cpc":0.66,"ctr":0.0269,"ctr_link":0.0205,"spend":595.15,"reach":13317,"frequency":2.51,"impressions":33366,"cpm":17.84},
  {"account_name":"CA - Dra. Marcela Tinoco","conversas":7,"cpr":6.11,"link_clicks":19,"cpc":1.71,"ctr":0.0103,"ctr_link":0.0078,"spend":42.77,"reach":2247,"frequency":1.08,"impressions":2434,"cpm":17.57},
  {"account_name":"Nathalia Kassis [CURSO]","conversas":38,"cpr":78.58,"link_clicks":3306,"cpc":0.74,"ctr":0.0396,"ctr_link":0.0325,"spend":2986.18,"reach":58170,"frequency":1.75,"impressions":101703,"cpm":29.36},
  {"account_name":"Dra Mirian Vaz","conversas":0,"cpr":0,"link_clicks":561,"cpc":0.36,"ctr":0.0544,"ctr_link":0.0496,"spend":220.7,"reach":8636,"frequency":1.31,"impressions":11307,"cpm":19.52},
  {"account_name":"CA Marcelo Cardoso","conversas":50,"cpr":9.43,"link_clicks":295,"cpc":1.16,"ctr":0.0109,"ctr_link":0.008,"spend":471.29,"reach":15186,"frequency":2.44,"impressions":37070,"cpm":12.71},
  {"account_name":"Tebrine Fonseca","conversas":4,"cpr":69.32,"link_clicks":366,"cpc":0.63,"ctr":0.0201,"ctr_link":0.0168,"spend":277.28,"reach":12970,"frequency":1.68,"impressions":21779,"cpm":12.73},
  {"account_name":"Crepaldi - Bela Laser","conversas":59,"cpr":12.35,"link_clicks":124,"cpc":2.64,"ctr":0.0068,"ctr_link":0.0031,"spend":728.55,"reach":21940,"frequency":1.84,"impressions":40305,"cpm":18.08},
];

const prevWeekRaw = [
  {"account_name":"Dr. André Alves / Instituto Vitalite","conversas":17,"cpr":14.36,"link_clicks":49,"cpc":3.13,"ctr":0.0172,"ctr_link":0.0108,"spend":244.12,"reach":3269,"frequency":1.39,"impressions":4529,"cpm":53.90},
  {"account_name":"Clínica Personne","conversas":0,"cpr":0,"link_clicks":717,"cpc":0.47,"ctr":0.0058,"ctr_link":0.0056,"spend":343.23,"reach":70107,"frequency":1.83,"impressions":128156,"cpm":2.68},
  {"account_name":"Nathalia Kassis [ESPANHOL]","conversas":2,"cpr":704.95,"link_clicks":3115,"cpc":0.39,"ctr":0.0462,"ctr_link":0.0397,"spend":1409.89,"reach":38471,"frequency":2.04,"impressions":78533,"cpm":17.95},
  {"account_name":"Spa Crepaldi","conversas":67,"cpr":10.19,"link_clicks":139,"cpc":2.01,"ctr":0.0137,"ctr_link":0.0056,"spend":682.62,"reach":10096,"frequency":2.45,"impressions":24758,"cpm":27.57},
  {"account_name":"CMD Olhos (Dra. Gabriela) - 1.1.2","conversas":45,"cpr":5.77,"link_clicks":131,"cpc":1.05,"ctr":0.0132,"ctr_link":0.007,"spend":259.59,"reach":9870,"frequency":1.89,"impressions":18670,"cpm":13.90},
  {"account_name":"Clinica Crepaldi","conversas":58,"cpr":13.54,"link_clicks":160,"cpc":3.46,"ctr":0.0129,"ctr_link":0.0091,"spend":785.32,"reach":9560,"frequency":1.84,"impressions":17566,"cpm":44.71},
  {"account_name":"Dra. Priscila Perin","conversas":38,"cpr":13.05,"link_clicks":810,"cpc":0.52,"ctr":0.029,"ctr_link":0.0246,"spend":495.92,"reach":26400,"frequency":1.25,"impressions":32959,"cpm":15.05},
  {"account_name":"CMD Olhos - CA 1.1.1","conversas":21,"cpr":9.96,"link_clicks":76,"cpc":1.36,"ctr":0.0154,"ctr_link":0.0076,"spend":209.07,"reach":5858,"frequency":1.71,"impressions":10024,"cpm":20.86},
  {"account_name":"Natasha - Antiga Convênios","conversas":235,"cpr":8.18,"link_clicks":373,"cpc":2.71,"ctr":0.0168,"ctr_link":0.0088,"spend":1921.34,"reach":19771,"frequency":2.14,"impressions":42230,"cpm":45.50},
  {"account_name":"Dra. Camila Machado","conversas":28,"cpr":10.51,"link_clicks":278,"cpc":0.91,"ctr":0.0316,"ctr_link":0.027,"spend":294.3,"reach":6781,"frequency":1.52,"impressions":10279,"cpm":28.63},
  {"account_name":"Lumiata - 01","conversas":233,"cpr":12.42,"link_clicks":1339,"cpc":1.34,"ctr":0.0114,"ctr_link":0.0071,"spend":2893.08,"reach":134629,"frequency":1.41,"impressions":189492,"cpm":15.27},
  {"account_name":"CA - Dr. Robson","conversas":1,"cpr":299.94,"link_clicks":12841,"cpc":0.03,"ctr":0.2894,"ctr_link":0.3581,"spend":299.94,"reach":6193,"frequency":5.79,"impressions":35855,"cpm":8.37},
  {"account_name":"Dr. Alexandre César","conversas":38,"cpr":13.35,"link_clicks":218,"cpc":1.50,"ctr":0.0063,"ctr_link":0.0041,"spend":507.32,"reach":22211,"frequency":2.41,"impressions":53598,"cpm":9.47},
  {"account_name":"Dra Lais Filadelfo","conversas":15,"cpr":8.83,"link_clicks":30,"cpc":2.21,"ctr":0.0152,"ctr_link":0.0076,"spend":132.39,"reach":2489,"frequency":1.58,"impressions":3940,"cpm":33.60},
  {"account_name":"CA - Dra Cristiane","conversas":72,"cpr":5.21,"link_clicks":123,"cpc":1.21,"ctr":0.0227,"ctr_link":0.0091,"spend":375.38,"reach":6111,"frequency":2.22,"impressions":13583,"cpm":27.64},
  {"account_name":"CA - Dra Bianca Duarte","conversas":30,"cpr":12.98,"link_clicks":366,"cpc":0.81,"ctr":0.0162,"ctr_link":0.0123,"spend":389.34,"reach":15142,"frequency":1.96,"impressions":29641,"cpm":13.14},
  {"account_name":"CA - Dra. Sara Profeta","conversas":50,"cpr":8.16,"link_clicks":312,"cpc":1.02,"ctr":0.0161,"ctr_link":0.0126,"spend":407.8,"reach":16334,"frequency":1.51,"impressions":24681,"cpm":16.52},
  {"account_name":"Dra Daniela Ribeiro","conversas":2,"cpr":612.48,"link_clicks":220,"cpc":3.62,"ctr":0.0028,"ctr_link":0.0018,"spend":1224.96,"reach":16670,"frequency":7.22,"impressions":120319,"cpm":10.18},
  {"account_name":"Balmee Clínica & Spa","conversas":35,"cpr":8.60,"link_clicks":53,"cpc":1.64,"ctr":0.0133,"ctr_link":0.0039,"spend":300.91,"reach":8315,"frequency":1.65,"impressions":13750,"cpm":21.88},
  {"account_name":"Dra Andrea Morato","conversas":2,"cpr":228.0,"link_clicks":557,"cpc":0.60,"ctr":0.0302,"ctr_link":0.0221,"spend":456.0,"reach":18250,"frequency":1.38,"impressions":25255,"cpm":18.06},
  {"account_name":"Nathalia Kassis [CLINICA]","conversas":496,"cpr":7.16,"link_clicks":3428,"cpc":0.90,"ctr":0.0382,"ctr_link":0.0332,"spend":3549.89,"reach":63125,"frequency":1.64,"impressions":103311,"cpm":34.36},
  {"account_name":"02 - Dra. Desiree Hickmann","conversas":96,"cpr":6.38,"link_clicks":182,"cpc":0.96,"ctr":0.0162,"ctr_link":0.0046,"spend":612.31,"reach":17979,"frequency":2.20,"impressions":39568,"cpm":15.47},
  {"account_name":"Dr Rogério Ferrari","conversas":16,"cpr":15.36,"link_clicks":1106,"cpc":0.21,"ctr":0.0566,"ctr_link":0.0533,"spend":245.78,"reach":18560,"frequency":1.12,"impressions":20759,"cpm":11.84},
  {"account_name":"Dra Bruna Cotta","conversas":56,"cpr":10.63,"link_clicks":615,"cpc":0.79,"ctr":0.0223,"ctr_link":0.0182,"spend":595.31,"reach":15052,"frequency":2.24,"impressions":33703,"cpm":17.66},
  {"account_name":"CA - Dra. Marcela Tinoco","conversas":36,"cpr":11.23,"link_clicks":403,"cpc":0.79,"ctr":0.0142,"ctr_link":0.0113,"spend":404.12,"reach":24621,"frequency":1.45,"impressions":35763,"cpm":11.30},
  {"account_name":"Nathalia Kassis [CURSO]","conversas":35,"cpr":88.77,"link_clicks":3642,"cpc":0.72,"ctr":0.0404,"ctr_link":0.0339,"spend":3106.83,"reach":65051,"frequency":1.65,"impressions":107301,"cpm":28.95},
  {"account_name":"Dra Mirian Vaz","conversas":0,"cpr":0,"link_clicks":74,"cpc":0.32,"ctr":0.0709,"ctr_link":0.0617,"spend":26.83,"reach":1119,"frequency":1.07,"impressions":1199,"cpm":22.38},
  {"account_name":"CA Marcelo Cardoso","conversas":30,"cpr":15.25,"link_clicks":330,"cpc":1.13,"ctr":0.01,"ctr_link":0.0081,"spend":457.63,"reach":16080,"frequency":2.52,"impressions":40524,"cpm":11.29},
  {"account_name":"Tebrine Fonseca","conversas":2,"cpr":139.77,"link_clicks":366,"cpc":0.64,"ctr":0.0189,"ctr_link":0.0158,"spend":279.54,"reach":14239,"frequency":1.62,"impressions":23104,"cpm":12.10},
  {"account_name":"Crepaldi - Bela Laser","conversas":75,"cpr":15.37,"link_clicks":227,"cpc":2.65,"ctr":0.0072,"ctr_link":0.0037,"spend":1152.67,"reach":26966,"frequency":2.25,"impressions":60767,"cpm":18.97},
];

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
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background: isGood===true?"#22c55e":isGood===false?"#ef4444":"#3b82f6" }} />
      <div style={{ fontSize:11, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:600 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:800, color:"#f1f5f9" }}>{fmt(curr, valueType)}</div>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ fontSize:11, color:"#64748b" }}>Ant: {fmt(prev, valueType)}</span>
        {diffPct !== null && (
          <span style={{ color:isGood?"#22c55e":"#ef4444", fontSize:11, fontWeight:700 }}>
            {diffPct > 0 ? "▲" : "▼"} {Math.abs(diffPct).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("spend");
  const [sortDir, setSortDir] = useState("desc");
  const [activeChart, setActiveChart] = useState("conversas");

  const cSpend = sum(currentWeekRaw, "spend");
  const cImpressions = sum(currentWeekRaw, "impressions");
  const cReach = sum(currentWeekRaw, "reach");
  const cLinkClicks = sum(currentWeekRaw, "link_clicks");
  const cConversas = sum(currentWeekRaw, "conversas");
  const cCPC = cSpend / cLinkClicks;
  const cCTR = cImpressions > 0 ? cLinkClicks / cImpressions : 0;
  const cCTRLink = currentWeekRaw.reduce((a,b) => a + b.ctr_link * b.impressions, 0) / cImpressions;
  const cCPM = (cSpend / cImpressions) * 1000;
  const cFreq = cImpressions / cReach;
  const cCPR = cSpend / cConversas;

  const pSpend = sum(prevWeekRaw, "spend");
  const pImpressions = sum(prevWeekRaw, "impressions");
  const pReach = sum(prevWeekRaw, "reach");
  const pLinkClicks = sum(prevWeekRaw, "link_clicks");
  const pConversas = sum(prevWeekRaw, "conversas");
  const pCPC = pSpend / pLinkClicks;
  const pCTR = pImpressions > 0 ? pLinkClicks / pImpressions : 0;
  const pCTRLink = prevWeekRaw.reduce((a,b) => a + b.ctr_link * b.impressions, 0) / pImpressions;
  const pCPM = (pSpend / pImpressions) * 1000;
  const pFreq = pImpressions / pReach;
  const pCPR = pSpend / pConversas;

  const accounts = useMemo(() => {
    const prevMap = {};
    prevWeekRaw.forEach(r => { prevMap[r.account_name] = r; });
    return currentWeekRaw
      .map(r => ({ ...r, prev: prevMap[r.account_name] || null }))
      .filter(r => r.account_name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        const av = a[sortKey] || 0, bv = b[sortKey] || 0;
        return sortDir === "desc" ? bv - av : av - bv;
      });
  }, [search, sortKey, sortDir]);

  const chartData = useMemo(() => {
    return [...currentWeekRaw]
      .sort((a, b) => (b[activeChart] || 0) - (a[activeChart] || 0))
      .slice(0, 12)
      .map(r => ({
        name: r.account_name.length > 18 ? r.account_name.slice(0,16)+"…" : r.account_name,
        curr: r[activeChart] || 0,
        prev: (prevWeekRaw.find(p => p.account_name === r.account_name) || {})[activeChart] || 0,
      }));
  }, [activeChart]);

  const cols = [
    { key:"account_name", label:"Conta", w:200 },
    { key:"conversas", label:"Conversas", w:100, type:"int" },
    { key:"cpr", label:"Custo/Result", w:110, type:"brl", lower:true },
    { key:"link_clicks", label:"Cliques Link", w:100, type:"int" },
    { key:"cpc", label:"CPC", w:80, type:"brl", lower:true },
    { key:"ctr", label:"CTR Total", w:90, type:"pct" },
    { key:"ctr_link", label:"CTR Link", w:90, type:"pct" },
    { key:"spend", label:"Gasto", w:100, type:"brl", lower:true },
    { key:"reach", label:"Alcance", w:90, type:"int" },
    { key:"frequency", label:"Freq.", w:70, type:"dec" },
    { key:"impressions", label:"Impressões", w:100, type:"int" },
    { key:"cpm", label:"CPM", w:80, type:"brl", lower:true },
  ];

  const chartOptions = [
    { key:"conversas", label:"Conversas" },
    { key:"spend", label:"Gasto" },
    { key:"link_clicks", label:"Cliques" },
    { key:"reach", label:"Alcance" },
    { key:"impressions", label:"Impressões" },
  ];

  return (
    <div style={{ fontFamily:"'DM Sans','Segoe UI',sans-serif", background:"#080e1a", minHeight:"100vh", color:"#e2e8f0", padding:"24px" }}>
      {/* Header */}
      <div style={{ marginBottom:28, display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:"#3b82f6", boxShadow:"0 0 8px #3b82f6" }} />
            <span style={{ fontSize:11, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.15em", fontWeight:700 }}>Meta Ads · Todas as Contas</span>
          </div>
          <h1 style={{ fontSize:28, fontWeight:900, margin:0, background:"linear-gradient(135deg,#f1f5f9,#94a3b8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            Dashboard de Performance
          </h1>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:11, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.1em" }}>Comparação WoW</div>
          <div style={{ fontSize:13, color:"#3b82f6", fontWeight:700 }}>Últimos 7d vs 7d anteriores</div>
          <div style={{ fontSize:11, color:"#475569", marginTop:2 }}>30 contas ativas</div>
        </div>
      </div>

      {/* KPI Grid */}
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

      {/* Chart */}
      <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"20px 24px", marginBottom:24 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:10 }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#cbd5e1" }}>Top 12 Contas por Métrica</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {chartOptions.map(o => (
              <button key={o.key} onClick={() => setActiveChart(o.key)} style={{
                padding:"5px 12px", borderRadius:6, border:"none", cursor:"pointer",
                fontSize:11, fontWeight:700,
                background: activeChart===o.key ? "#3b82f6" : "rgba(255,255,255,0.06)",
                color: activeChart===o.key ? "#fff" : "#94a3b8",
              }}>{o.label}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} barGap={2} barCategoryGap="25%">
            <XAxis dataKey="name" tick={{ fill:"#64748b", fontSize:9 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:"#64748b", fontSize:10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background:"#0f172a", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, fontSize:12 }} labelStyle={{ color:"#94a3b8", fontWeight:700 }} />
            <Bar dataKey="curr" name="Semana Atual" radius={[4,4,0,0]} fill="#3b82f6" />
            <Bar dataKey="prev" name="Semana Ant." radius={[4,4,0,0]} fill="rgba(59,130,246,0.25)" />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display:"flex", gap:16, marginTop:8, justifyContent:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#64748b" }}>
            <div style={{ width:12, height:12, borderRadius:2, background:"#3b82f6" }} /> Semana Atual
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#64748b" }}>
            <div style={{ width:12, height:12, borderRadius:2, background:"rgba(59,130,246,0.3)" }} /> Semana Anterior
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, overflow:"hidden" }}>
        <div style={{ padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid rgba(255,255,255,0.06)", flexWrap:"wrap", gap:10 }}>
          <span style={{ fontSize:13, fontWeight:700, color:"#cbd5e1" }}>Detalhamento por Conta</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filtrar conta..."
            style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"6px 12px", color:"#e2e8f0", fontSize:12, outline:"none", width:200 }} />
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                {cols.map(c => (
                  <th key={c.key}
                    onClick={() => { setSortKey(c.key); setSortDir(sortKey===c.key && sortDir==="desc" ? "asc" : "desc"); }}
                    style={{ textAlign:c.key==="account_name"?"left":"right", padding:"10px 12px", color:sortKey===c.key?"#3b82f6":"#64748b", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", fontSize:10, cursor:"pointer", whiteSpace:"nowrap", minWidth:c.w }}>
                    {c.label} {sortKey===c.key?(sortDir==="desc"?"↓":"↑"):""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {accounts.map((r, i) => (
                <tr key={r.account_name} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)", background:i%2===0?"transparent":"rgba(255,255,255,0.01)" }}>
                  <td style={{ padding:"9px 12px", color:"#cbd5e1", fontWeight:600, whiteSpace:"nowrap" }}>{r.account_name}</td>
                  {cols.slice(1).map(c => {
                    const curr = r[c.key] || 0;
                    const prev = r.prev ? (r.prev[c.key] || 0) : null;
                    const diffPct = prev ? pct(curr, prev) : null;
                    const isGood = diffPct !== null ? (c.lower ? diffPct < 0 : diffPct > 0) : null;
                    return (
                      <td key={c.key} style={{ padding:"9px 12px", textAlign:"right", whiteSpace:"nowrap" }}>
                        <span style={{ color:"#e2e8f0" }}>{fmt(curr, c.type)}</span>
                        {diffPct !== null && (
                          <span style={{ color:isGood?"#22c55e":"#ef4444", fontSize:10, marginLeft:5, fontWeight:700 }}>
                            {diffPct>0?"▲":"▼"}{Math.abs(diffPct).toFixed(0)}%
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ marginTop:16, textAlign:"center", fontSize:11, color:"#334155" }}>
        Dados via Windsor.ai · Meta Ads · Últimos 7 dias vs 7 dias anteriores
      </div>
    </div>
  );
}
