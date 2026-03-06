const WINDSOR_API_KEY = process.env.WINDSOR_API_KEY;

// Todas as contas EXCETO: CURSO, ESPANHOL, Mirian Vaz, Andrea Morato
const ACCOUNTS_STANDARD = [
  "2068758496936007","1219387043022426","390840644907537","619963795160015",
  "828394427632542","1852353518254493","457659635494933","748613300967995",
  "1019229360015655","329557496405271","4458721077543979",
  "437604455903564","772332721021119","1098725998109493","672538531656415",
  "1271165120214474","315895234514279","1632184990552904",
  "407828064482317","1374235873039705","1529560257488038","636872863427692",
  "1211196206223589","826364873694747","517693170661722","2341241392960174"
];

// Contas com pixel customizado
const ACCOUNTS_PIXEL = ["611835967744109", "1594192167835660"];

// Nomes a excluir da query padrão (caso apareçam por conta duplicada)
const EXCLUDE_NAMES = [
  "nathalia kassis [curso]",
  "nathalia kassis [espanhol]",
  "dra mirian vaz",
  "dra andrea morato"
];

const FIELDS_STANDARD = [
  "account_name",
  "actions_onsite_conversion_messaging_conversation_started_7d",
  "cost_per_action_type_onsite_conversion_messaging_conversation_started_7d",
  "link_clicks","cpc","ctr","unique_link_clicks_ctr",
  "spend","reach","frequency","impressions","cpm"
].join(",");

const FIELDS_PIXEL = [
  "account_name",
  "actions_offsite_conversion_fb_pixel_custom",
  "cost_per_action_type_offsite_conversion_fb_pixel_custom",
  "link_clicks","cpc","ctr","unique_link_clicks_ctr",
  "spend","reach","frequency","impressions","cpm"
].join(",");

function getDateRange(offsetDays) {
  const to = new Date();
  to.setDate(to.getDate() - offsetDays);
  const from = new Date(to);
  from.setDate(from.getDate() - 6);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

async function fetchWindsor(accounts, fields, dateFrom, dateTo) {
  const params = new URLSearchParams({ api_key: WINDSOR_API_KEY, fields, date_from: dateFrom, date_to: dateTo });
  accounts.forEach(id => params.append("account_id", id));
  const res = await fetch(`https://connectors.windsor.ai/facebook?${params.toString()}`);
  const json = await res.json();
  return json.data || [];
}

function normalizeStandard(row) {
  return {
    account_name: row.account_name || "",
    conversas: row.actions_onsite_conversion_messaging_conversation_started_7d || 0,
    cpr: row.cost_per_action_type_onsite_conversion_messaging_conversation_started_7d || 0,
    link_clicks: row.link_clicks || 0, cpc: row.cpc || 0, ctr: row.ctr || 0,
    ctr_link: row.unique_link_clicks_ctr || 0, spend: row.spend || 0,
    reach: row.reach || 0, frequency: row.frequency || 0,
    impressions: row.impressions || 0, cpm: row.cpm || 0,
    metric_label: "Conversas (Msg)",
  };
}

function normalizePixel(row) {
  return {
    account_name: row.account_name || "",
    conversas: row.actions_offsite_conversion_fb_pixel_custom || 0,
    cpr: row.cost_per_action_type_offsite_conversion_fb_pixel_custom || 0,
    link_clicks: row.link_clicks || 0, cpc: row.cpc || 0, ctr: row.ctr || 0,
    ctr_link: row.unique_link_clicks_ctr || 0, spend: row.spend || 0,
    reach: row.reach || 0, frequency: row.frequency || 0,
    impressions: row.impressions || 0, cpm: row.cpm || 0,
    metric_label: "Conv. Pixel Custom",
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store"); // sem cache para garantir dados frescos

  try {
    const current = getDateRange(1);
    const prev = getDateRange(8);

    const [stdCurr, pixelCurr, stdPrev, pixelPrev] = await Promise.all([
      fetchWindsor(ACCOUNTS_STANDARD, FIELDS_STANDARD, current.from, current.to),
      fetchWindsor(ACCOUNTS_PIXEL, FIELDS_PIXEL, current.from, current.to),
      fetchWindsor(ACCOUNTS_STANDARD, FIELDS_STANDARD, prev.from, prev.to),
      fetchWindsor(ACCOUNTS_PIXEL, FIELDS_PIXEL, prev.from, prev.to),
    ]);

    // Filtra nomes excluídos da query padrão (segurança dupla)
    const filterStd = (arr) => arr.filter(r =>
      !EXCLUDE_NAMES.includes((r.account_name || "").toLowerCase())
    );

    res.status(200).json({
      current: [...filterStd(stdCurr).map(normalizeStandard), ...pixelCurr.map(normalizePixel)],
      prev: [...filterStd(stdPrev).map(normalizeStandard), ...pixelPrev.map(normalizePixel)],
      periods: { current: `${current.from} → ${current.to}`, prev: `${prev.from} → ${prev.to}` }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
