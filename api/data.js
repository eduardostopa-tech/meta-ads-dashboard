const WINDSOR_API_KEY = process.env.WINDSOR_API_KEY;

const ACCOUNTS = [
  "2068758496936007","1219387043022426","390840644907537","619963795160015",
  "828394427632542","1852353518254493","457659635494933","748613300967995",
  "1019229360015655","329557496405271","4458721077543979","1594192167835660",
  "437604455903564","772332721021119","1098725998109493","672538531656415",
  "1271165120214474","315895234514279","611835967744109","1632184990552904",
  "407828064482317","1374235873039705","913992542512590","1118542338971200",
  "1529560257488038","636872863427692","1211196206223589","826364873694747",
  "517693170661722","2341241392960174"
];

const FIELDS = [
  "account_name",
  "actions_onsite_conversion_messaging_conversation_started_7d",
  "cost_per_action_type_onsite_conversion_messaging_conversation_started_7d",
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

async function fetchWindsor(dateFrom, dateTo) {
  const params = new URLSearchParams({
    api_key: WINDSOR_API_KEY,
    fields: FIELDS,
    date_from: dateFrom,
    date_to: dateTo,
  });
  ACCOUNTS.forEach(id => params.append("account_id", id));

  const url = `https://connectors.windsor.ai/facebook?${params.toString()}`;
  const res = await fetch(url);
  const json = await res.json();
  return json.data || [];
}

function normalize(row) {
  return {
    account_name: row.account_name || "",
    conversas: row.actions_onsite_conversion_messaging_conversation_started_7d || 0,
    cpr: row.cost_per_action_type_onsite_conversion_messaging_conversation_started_7d || 0,
    link_clicks: row.link_clicks || 0,
    cpc: row.cpc || 0,
    ctr: row.ctr || 0,
    ctr_link: row.unique_link_clicks_ctr || 0,
    spend: row.spend || 0,
    reach: row.reach || 0,
    frequency: row.frequency || 0,
    impressions: row.impressions || 0,
    cpm: row.cpm || 0,
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");

  try {
    const current = getDateRange(1);   // últimos 7 dias
    const prev = getDateRange(8);      // 7 dias anteriores

    const [currentData, prevData] = await Promise.all([
      fetchWindsor(current.from, current.to),
      fetchWindsor(prev.from, prev.to),
    ]);

    res.status(200).json({
      current: currentData.map(normalize),
      prev: prevData.map(normalize),
      periods: {
        current: `${current.from} → ${current.to}`,
        prev: `${prev.from} → ${prev.to}`,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
