const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

async function callOllamaChat({ systemPrompt, userContent }) {
  const body = {
    model: process.env.OLLAMA_MODEL || "llama3",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    stream: false,
  };

  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Ollama error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const content = json?.message?.content || "";
  return content.trim();
}

// To Extract structured RFP fields from natural language
export async function ollamaExtractRfp(text) {
  const systemPrompt = `
You are an assistant that extracts structured RFP data from free text.
Respond ONLY with valid JSON. No commentary.

Schema:
{
  "title": string,
  "budget": number | null,
  "deliveryTimelineDays": number | null,
  "warrantyMonths": number | null,
  "paymentTerms": string | null,
  "items": [
    { "name": string, "quantity": number | null, "specs": string | null }
  ],
  "otherRequirements": string | null
}
`;

  const raw = await callOllamaChat({
    systemPrompt,
    userContent: text,
  });

  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse Ollama RFP JSON, raw:", raw);
    throw e;
  }
}

// To Extract structured proposal from vendor response email/text
export async function ollamaExtractProposal(text) {
  const systemPrompt = `
You read vendor proposal emails and extract structured fields.
Respond ONLY with valid JSON and no extra text.

Schema (all keys required):
{
  "price": number | null,
  "deliveryDays": number | null,
  "warrantyMonths": number | null,
  "paymentTerms": string | null,
  "notes": string
}
Always fill every key. If unknown, use null or empty string.
`;

  const raw = await callOllamaChat({
    systemPrompt,
    userContent: text,
  });

  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse Ollama proposal JSON, raw:", raw);
    throw e;
  }
}

// Score proposals vs RFP using Ollama
export async function ollamaScoreProposals(rfp, proposals) {
  const systemPrompt = `
You are an AI assistant helping with procurement decisions.

You will receive:
1) The structured RFP (requirements, budget, delivery timeline, warranty, etc.)
2) A list of vendor proposals with extracted fields: price, delivery days, warranty months, payment terms, and notes.

Your job:
- Evaluate each proposal against the RFP.
- Give each proposal a score from 0 to 10 (10 = best fit).
- Indicate which single proposal you recommend.
- Provide one short sentence explanation per proposal.

Important:
- Return ONLY valid JSON. No extra text.
- JSON format:

{
  "scores": [
    {
      "proposalId": "<Mongo _id string>",
      "score": number,
      "isRecommended": boolean,
      "reason": string
    }
  ]
}
`;

  const payload = {
    rfp,
    proposals: proposals.map((p) => ({
      proposalId: p._id.toString(),      
      vendorName: p.vendorId?.name,
      vendorEmail: p.vendorId?.email,
      price: p.price,
      deliveryDays: p.deliveryDays,
      warrantyMonths: p.warrantyMonths,
      paymentTerms: p.paymentTerms,
      notes: p.notes,
    })),
  };

  const raw = await callOllamaChat({
    systemPrompt,
    userContent: JSON.stringify(payload),
  });

  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse Ollama scoring JSON, raw:", raw);
    throw e;
  }
}
