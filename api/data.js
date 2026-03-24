const WINDSOR_API_KEY = process.env.WINDSOR_API_KEY;

// Contas padrão (conversas por mensagem)
const ACCOUNTS_STANDARD = [
  "2068758496936007","1219387043022426","390840644907537","619963795160015",
  "828394427632542","1852353518254493","457659635494933","748613300967995",
  "1019229360015655","329557496405271","4458721077543979",
  "437604455903564","772332721021119","1098725998109493","672538531656415",
  "1271165120214474","315895234514279","1632184990552904",
  "407828064482317","1374235873039705","1529560257488038","636872863427692",
  "1211196206223589","826364873694747","517693170661722","2341241392960174"
];

// Contas pixel custom - nomes exatos como vêm do Windsor
const PIXEL_ACCOUNT_NAMES = ["Dra Mirian Vaz", "Dra Andrea Morato"];

// Contas com métrica "Contato no Site"
const CONTACT_ACCOUNT_NAMES = ["CA - Dr. Robson"];

// Contas a excluir completamente
const EXCLUDE_NAMES = [
  "nathalia kassis [curso]",
  "nathalia kassis [espanhol]"
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

const FIELDS_CONTACT = [
  "account_name",
  "actions_contact",
  "cost_per_action_type_contact",
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

// type: "msg" | "pixel" | "contact"
function aggregateRows(rows, type, allowedNames = null) {
  const map = {};

  for (const row of rows) {
    const name = (row.account_name || "").trim();
    if (!name) continue;
    if (EXCLUDE_NAMES.includes(name.toLowerCase())) continue;
    if (allowedNames && !allowedNames.includes(name)) continue;

    if (!map[name]) {
      map[name] = {
        account_name: name,
        conversas: 0, link_clicks: 0, spend: 0, reach: 0, impressions: 0,
        metric_label: type === "pixel" ? "Conv. Pixel Custom" : type === "contact" ? "Contato no Site" : "Conversas (Msg)",
        _cpc_w: 0, _ctr_w: 0, _ctr_link_w: 0, _cpm_w: 0, _freq_w: 0, _imp_total: 0,
      };
    }

    const m = map[name];
    if (type === "pixel")        m.conversas += row.actions_offsite_conversion_fb_pixel_custom || 0;
    else if (type === "contact") m.conversas += row.actions_contact || 0;
    else                         m.conversas += row.actions_onsite_conversion_messaging_conversation_started_7d || 0;

    m.link_clicks += row.link_clicks || 0;
    m.spend       += row.spend || 0;
    m.reach       += row.reach || 0;
    m.impressions += row.impressions || 0;

    const imp = row.impressions || 0;
    m._cpc_w      += (row.cpc || 0) * imp;
    m._ctr_w      += (row.ctr || 0) * imp;
    m._ctr_link_w += (row.unique_link_clicks_ctr || 0) * imp;
    m._cpm_w      += (row.cpm || 0) * imp;
    m._freq_w     += (row.frequency || 0) * imp;
    m._imp_total  += imp;
  }

  const toNum = v => { const x = parseFloat(v); return isNaN(x) ? 0 : x; };
  return Object.values(map).map(m => {
    const imp = m._imp_total || 1;
    const conv = toNum(m.conversas);
    const spend = toNum(m.spend);
    return {
      account_name: m.account_name,
      conversas:    conv,
      cpr:          conv > 0 ? spend / conv : 0,
      link_clicks:  toNum(m.link_clicks),
      cpc:          toNum(m._cpc_w) / imp,
      ctr:          toNum(m._ctr_w) / imp,
      ctr_link:     toNum(m._ctr_link_w) / imp,
      spend:        spend,
      reach:        toNum(m.reach),
      frequency:    toNum(m._freq_w) / imp,
      impressions:  toNum(m.impressions),
      cpm:          toNum(m._cpm_w) / imp,
      metric_label: m.metric_label,
    };
  });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");

  try {
    const current = getDateRange(1);
    const prev    = getDateRange(8);

    const [stdCurr, pixelCurr, contactCurr, stdPrev, pixelPrev, contactPrev] = await Promise.all([
      fetchWindsor(ACCOUNTS_STANDARD, FIELDS_STANDARD, current.from, current.to),
      fetchWindsor(ACCOUNTS_STANDARD, FIELDS_PIXEL,    current.from, current.to),
      fetchWindsor(ACCOUNTS_STANDARD, FIELDS_CONTACT,  current.from, current.to),
      fetchWindsor(ACCOUNTS_STANDARD, FIELDS_STANDARD, prev.from,    prev.to),
      fetchWindsor(ACCOUNTS_STANDARD, FIELDS_PIXEL,    prev.from,    prev.to),
      fetchWindsor(ACCOUNTS_STANDARD, FIELDS_CONTACT,  prev.from,    prev.to),
    ]);

    // Filtro: exclui pixel e contact das contas padrão
    const stdOnly = n => !PIXEL_ACCOUNT_NAMES.includes(n) && !CONTACT_ACCOUNT_NAMES.includes(n) && !EXCLUDE_NAMES.includes(n.toLowerCase());

    res.status(200).json({
      current: [
        ...aggregateRows(stdCurr.filter(r => stdOnly(r.account_name)), "msg"),
        ...aggregateRows(pixelCurr,   "pixel",   PIXEL_ACCOUNT_NAMES),
        ...aggregateRows(contactCurr, "contact", CONTACT_ACCOUNT_NAMES),
      ],
      prev: [
        ...aggregateRows(stdPrev.filter(r => stdOnly(r.account_name)), "msg"),
        ...aggregateRows(pixelPrev,   "pixel",   PIXEL_ACCOUNT_NAMES),
        ...aggregateRows(contactPrev, "contact", CONTACT_ACCOUNT_NAMES),
      ],
      periods: {
        current: `${current.from} → ${current.to}`,
        prev:    `${prev.from} → ${prev.to}`,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
