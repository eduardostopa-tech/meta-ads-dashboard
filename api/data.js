const WINDSOR_API_KEY = process.env.WINDSOR_API_KEY;

const ACCOUNTS_STANDARD = [
  "2068758496936007","1219387043022426","390840644907537","619963795160015",
  "828394427632542","1852353518254493","457659635494933","748613300967995",
  "1019229360015655","329557496405271","4458721077543979",
  "437604455903564","772332721021119","1098725998109493","672538531656415",
  "1271165120214474","315895234514279","1632184990552904",
  "407828064482317","1374235873039705","1529560257488038","636872863427692",
  "1211196206223589","826364873694747","517693170661722","2341241392960174"
];

const ACCOUNTS_PIXEL = ["611835967744109","1594192167835660"];

const EXCLUDE_NAMES = [
  "nathalia kassis [curso]","nathalia kassis [espanhol]",
  "dra mirian vaz","dra andrea morato"
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

// Agrupa linhas por account_name, somando métricas de volume e recalculando médias ponderadas
function aggregateByAccount(rows, isPixel) {
  const map = {};

  for (const row of rows) {
    const name = row.account_name || "";
    if (!name) continue;
    if (EXCLUDE_NAMES.includes(name.toLowerCase())) continue;

    if (!map[name]) {
      map[name] = {
        account_name: name,
        conversas: 0, link_clicks: 0, spend: 0,
        reach: 0, impressions: 0,
        metric_label: isPixel ? "Conv. Pixel Custom" : "Conversas (Msg)",
        // para médias ponderadas
        _cpc_sum: 0, _ctr_sum: 0, _ctr_link_sum: 0,
        _cpm_sum: 0, _freq_sum: 0, _count: 0,
      };
    }

    const m = map[name];
    m.conversas += isPixel
      ? (row.actions_offsite_conversion_fb_pixel_custom || 0)
      : (row.actions_onsite_conversion_messaging_conversation_started_7d || 0);
    m.link_clicks += row.link_clicks || 0;
    m.spend += row.spend || 0;
    m.reach += row.reach || 0;
    m.impressions += row.impressions || 0;

    // acumula para médias ponderadas por impressões
    const imp = row.impressions || 0;
    m._cpc_sum += (row.cpc || 0) * imp;
    m._ctr_sum += (row.ctr || 0) * imp;
    m._ctr_link_sum += (row.unique_link_clicks_ctr || 0) * imp;
    m._cpm_sum += (row.cpm || 0) * imp;
    m._freq_sum += (row.frequency || 0) * imp;
    m._count += imp;
  }

  return Object.values(map).map(m => {
    const n = m._count || 1;
    const cpr = m.conversas > 0 ? m.spend / m.conversas : 0;
    return {
      account_name: m.account_name,
      conversas: m.conversas,
      cpr,
      link_clicks: m.link_clicks,
      cpc: m._cpc_sum / n,
      ctr: m._ctr_sum / n,
      ctr_link: m._ctr_link_sum / n,
      spend: m.spend,
      reach: m.reach,
      frequency: m._freq_sum / n,
      impressions: m.impressions,
      cpm: m._cpm_sum / n,
      metric_label: m.metric_label,
    };
  });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");

  try {
    const current = getDateRange(1);
    const prev = getDateRange(8);

    const [stdCurr, pixelCurr, stdPrev, pixelPrev] = await Promise.all([
      fetchWindsor(ACCOUNTS_STANDARD, FIELDS_STANDARD, current.from, current.to),
      fetchWindsor(ACCOUNTS_PIXEL, FIELDS_PIXEL, current.from, current.to),
      fetchWindsor(ACCOUNTS_STANDARD, FIELDS_STANDARD, prev.from, prev.to),
      fetchWindsor(ACCOUNTS_PIXEL, FIELDS_PIXEL, prev.from, prev.to),
    ]);

    res.status(200).json({
      current: [
        ...aggregateByAccount(stdCurr, false),
        ...aggregateByAccount(pixelCurr, true),
      ],
      prev: [
        ...aggregateByAccount(stdPrev, false),
        ...aggregateByAccount(pixelPrev, true),
      ],
      periods: {
        current: `${current.from} → ${current.to}`,
        prev: `${prev.from} → ${prev.to}`,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
