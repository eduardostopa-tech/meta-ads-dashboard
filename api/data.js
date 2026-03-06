const WINDSOR_API_KEY = process.env.WINDSOR_API_KEY;

// Contas padrão (conversas por mensagem) - SEM CURSO, ESPANHOL, Mirian Vaz, Andrea Morato
const ACCOUNTS_STANDARD = [
  "2068758496936007", // CMD Olhos CA 1.1.2
  "1219387043022426", // CMD Olhos CA 1.1.1
  "390840644907537",  // Dra. Camila Machado
  "619963795160015",  // Natasha - Antiga Convênios
  "828394427632542",  // Lumiata
  "1852353518254493", // Clinica Crepaldi
  "457659635494933",  // CA Dr. Robson
  "748613300967995",  // CA Dra Cristiane
  "1019229360015655", // Dra Daniela Ribeiro
  "329557496405271",  // Dra Lais Filadelfo
  "4458721077543979", // Balmee
  "437604455903564",  // CA Dra Bianca Duarte
  "772332721021119",  // Dr Rogério Ferrari
  "1098725998109493", // Dra Bruna Cotta
  "672538531656415",  // CA Dra Sara Profeta
  "1271165120214474", // Crepaldi Bela Laser
  "315895234514279",  // Dra Desiree Hickmann
  "1632184990552904", // Tebrine Fonseca
  "407828064482317",  // CA Marcelo Cardoso
  "1374235873039705", // Dra Priscila Marques Perin
  "1529560257488038", // Spa Crepaldi
  "636872863427692",  // Dr André Alves
  "1211196206223589", // Clínica Personne
  "826364873694747",  // Dr Alexandre César
  "517693170661722",  // Nathalia Kassis [CLINICA]
  "2341241392960174"  // CA Dra. Sara / outro
];

// Contas pixel custom (Dra Mirian Vaz e Dra Andrea Morato)
const ACCOUNTS_PIXEL = [
  "611835967744109",  // Dra Mirian Vaz
  "1594192167835660"  // Dra Andrea Morato
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
  const params = new URLSearchParams({
    api_key: WINDSOR_API_KEY,
    fields,
    date_from: dateFrom,
    date_to: dateTo,
  });
  accounts.forEach(id => params.append("account_id", id));
  const url = `https://connectors.windsor.ai/facebook?${params.toString()}`;
  const res = await fetch(url);
  const json = await res.json();
  return json.data || [];
}

function normalizeStandard(row) {
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
    metric_label: "Conversas (Msg)",
  };
}

function normalizePixel(row) {
  return {
    account_name: row.account_name || "",
    conversas: row.actions_offsite_conversion_fb_pixel_custom || 0,
    cpr: row.cost_per_action_type_offsite_conversion_fb_pixel_custom || 0,
    link_clicks: row.link_clicks || 0,
    cpc: row.cpc || 0,
    ctr: row.ctr || 0,
    ctr_link: row.unique_link_clicks_ctr || 0,
    spend: row.spend || 0,
    reach: row.reach || 0,
    frequency: row.frequency || 0,
    impressions: row.impressions || 0,
    cpm: row.cpm || 0,
    metric_label: "Conv. Pixel Custom",
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");

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
        ...stdCurr.map(normalizeStandard),
        ...pixelCurr.map(normalizePixel),
      ],
      prev: [
        ...stdPrev.map(normalizeStandard),
        ...pixelPrev.map(normalizePixel),
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
