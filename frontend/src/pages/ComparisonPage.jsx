import { useEffect, useState } from "react";
import api from "../api";

export default function ComparisonPage() {
  const [rfps, setRfps] = useState([]);
  const [selectedRfpId, setSelectedRfpId] = useState("");
  const [proposals, setProposals] = useState([]);
  const [error, setError] = useState("");
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [source, setSource] = useState("none");

  // Load all RFPs once
  useEffect(() => {
    api
      .get("/rfps")
      .then((res) => {
        setRfps(res.data);
        if (res.data.length && !selectedRfpId) {
          setSelectedRfpId(res.data[0]._id);
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load RFPs");
      });
  }, []);

  // Asking AI to compare proposals whenever RFP changes
  useEffect(() => {
    if (!selectedRfpId) {
      setProposals([]);
      return;
    }
    setError("");
    setLoadingCompare(true);
    api
      .get(`/proposals/compare?rfpId=${selectedRfpId}`)
      .then((res) => {
        setProposals(res.data.proposals || []);
        setSource(res.data.source || "none");
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to compare proposals for this RFP");
      })
      .finally(() => setLoadingCompare(false));
  }, [selectedRfpId]);

  const selectedRfp = rfps.find((r) => r._id === selectedRfpId) || null;
  const best = proposals.find((p) => p.isRecommended) || null;

  return (
    <section className="rounded-2xl bg-white p-5 shadow-lg">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">
            4 · Compare proposals &amp; decide
          </h2>
          <p className="text-xs text-slate-500">
            See all vendor proposals for the current RFP, with an AI-based
            score and recommendation.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-emerald-400 bg-emerald-50 px-3 py-1 text-[11px] text-emerald-700">
          🤖 AI step: scoring &amp; recommendation
        </span>
      </div>

      {error && (
        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      <div className="w-full max-w-5xl mx-auto">
        <div className="rounded-2xl border border-slate-100 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">Proposals for this RFP</h3>
              <p className="text-[11px] text-slate-500">
                Only vendors that have responded in step 3 are included here.
              </p>
              {selectedRfp && (
                <p className="mt-1 text-[11px] text-slate-500">
                  Current RFP:{" "}
                  <span className="font-semibold">{selectedRfp.title}</span>
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center">
              <select
                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px]"
                value={selectedRfpId}
                onChange={(e) => setSelectedRfpId(e.target.value)}
              >
                {rfps.length === 0 ? (
                  <option value="">No RFPs yet</option>
                ) : (
                  rfps.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.title || r._id}
                    </option>
                  ))
                )}
              </select>
              <span className="rounded-full bg-slate-50 px-2 py-1 text-[10px] text-slate-500">
                {loadingCompare
                  ? "Asking AI..."
                  : source === "ollama"
                  ? "AI scored by Ollama"
                  : source === "fallback"
                  ? "Scored by heuristic fallback"
                  : "No scores yet"}
              </span>
            </div>
          </div>

          {loadingCompare ? (
            <div className="rounded-xl bg-slate-50 px-3 py-4 text-xs text-slate-500">
              Crunching proposals with AI...
            </div>
          ) : proposals.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-3 py-4 text-xs text-slate-500">
              No responded proposals yet for this RFP. Make sure you&apos;ve:
              <ul className="mt-1 list-inside list-disc">
                <li>Sent this RFP to vendors in step 2, and</li>
                <li>Parsed at least one response in step 3.</li>
              </ul>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Vendor</th>
                    <th className="px-3 py-2">Total price</th>
                    <th className="px-3 py-2">Delivery (days)</th>
                    <th className="px-3 py-2">Warranty (months)</th>
                    <th className="px-3 py-2">Score (0–10)</th>
                    <th className="px-3 py-2">Notes / AI reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {proposals.map((p) => {
                    const isBest = p.isRecommended;
                    const displayScore =
                      typeof p.score === "number"
                        ? p.score.toFixed(1)
                        : p.score ?? "—";
                    return (
                      <tr
                        key={p._id}
                        className={isBest ? "bg-emerald-50" : "hover:bg-slate-50"}
                      >
                        <td className="px-3 py-2 align-top">
                          <div className="font-medium">
                            {p.vendorId?.name || p.vendorId?.email}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {p.vendorId?.email}
                          </div>
                        </td>
                        <td className="px-3 py-2 align-top">
                          {p.price != null ? `$${p.price}` : "—"}
                        </td>
                        <td className="px-3 py-2 align-top">
                          {p.deliveryDays != null ? `${p.deliveryDays} days` : "—"}
                        </td>
                        <td className="px-3 py-2 align-top">
                          {p.warrantyMonths != null
                            ? `${p.warrantyMonths} mo`
                            : "—"}
                        </td>
                        <td className="px-3 py-2 align-top">
                          <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white">
                            {displayScore}
                          </span>
                          {isBest && (
                            <span className="ml-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-medium text-white">
                              Recommended
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 align-top max-w-xs text-[11px] text-slate-600">
                          {p.aiReason || p.notes || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
