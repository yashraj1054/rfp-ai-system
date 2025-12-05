import { useEffect, useState } from "react";
import api from "../api";

export default function ResponsesPage() {
  const [rfps, setRfps] = useState([]);
  const [selectedRfpId, setSelectedRfpId] = useState("");
  const [proposals, setProposals] = useState([]);
  const [selectedProposalId, setSelectedProposalId] = useState("");

  const [responseText, setResponseText] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [warrantyMonths, setWarrantyMonths] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [notes, setNotes] = useState("");

  const [loadingParse, setLoadingParse] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // load RFPs once
  useEffect(() => {
    api.get("/rfps").then((res) => {
      setRfps(res.data);
      if (res.data.length && !selectedRfpId) {
        setSelectedRfpId(res.data[0]._id);
      }
    });
    
  }, []);

  // load proposals when RFP changes
  useEffect(() => {
    if (!selectedRfpId) {
      setProposals([]);
      setSelectedProposalId("");
      return;
    }
    api
      .get(`/proposals?rfpId=${selectedRfpId}`)
      .then((res) => {
        setProposals(res.data);
        if (res.data.length && !selectedProposalId) {
          setSelectedProposalId(res.data[0]._id);
        }
      })
      .catch(() => setProposals([]));
  }, [selectedRfpId]);

  const selectedProposal = proposals.find((p) => p._id === selectedProposalId);

  const resetParsedFields = () => {
    setDeliveryDays("");
    setPaymentTerms("");
    setWarrantyMonths("");
    setTotalPrice("");
    setNotes("");
  };

  const handleRfpChange = (e) => {
    setSelectedRfpId(e.target.value);
    setSelectedProposalId("");
    setResponseText("");
    resetParsedFields();
    setError("");
    setSuccess("");
  };

  const handleVendorChange = (e) => {
    const id = e.target.value;
    setSelectedProposalId(id);
    setResponseText("");
    resetParsedFields();
    setError("");
    setSuccess("");

    const p = proposals.find((x) => x._id === id);
    if (p && p.status === "responded") {
      setDeliveryDays(p.deliveryDays ?? "");
      setPaymentTerms(p.paymentTerms ?? "");
      setWarrantyMonths(p.warrantyMonths ?? "");
      setTotalPrice(p.price ?? "");
      setNotes(p.notes ?? "");
    }
  };

  const handleParse = async () => {
    setError("");
    setSuccess("");

    if (!selectedProposalId) {
      setError("Select a vendor first.");
      return;
    }
    if (!responseText.trim()) {
      setError("Paste a vendor's email / proposal text first.");
      return;
    }

    try {
      setLoadingParse(true);
      const res = await api.patch(`/proposals/${selectedProposalId}/respond`, {
        responseText,
      });
      const updated = res.data;

      // update list
      setProposals((prev) =>
        prev.map((p) => (p._id === updated._id ? updated : p))
      );

      // fill parsed fields
      setDeliveryDays(updated.deliveryDays ?? "");
      setPaymentTerms(updated.paymentTerms ?? "");
      setWarrantyMonths(updated.warrantyMonths ?? "");
      setTotalPrice(updated.price ?? "");
      setNotes(updated.notes ?? "");

      setSuccess("Proposal parsed and saved for this RFP.");
    } catch (err) {
      console.error(err);
      setError("Failed to parse & save proposal.");
    } finally {
      setLoadingParse(false);
    }
  };

  const handleSaveOnly = () => {
    // shows a success message.
    setError("");
    setSuccess("Proposal saved for this RFP.");
    setResponseText("");
    resetParsedFields();
  };

  const vendorOptions = proposals.map((p) => ({
    id: p._id,
    label: p.vendorId?.name || p.vendorId?.email || "Vendor",
  }));

  return (
    <section className="rounded-2xl bg-white p-5 shadow-lg">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">
            3 · Vendor responses &amp; AI parsing
          </h2>
          <p className="text-xs text-slate-500">
            Paste a vendor&apos;s email-like response.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-emerald-400 bg-emerald-50 px-3 py-1 text-[11px] text-emerald-700">
          🤖 AI step: unstructured → structured proposal
        </span>
      </div>

      {error && (
        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      {success && (
        <p className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {success}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        {/* LEFT: vendor + email text */}
        <div className="rounded-2xl border border-slate-100 p-4">
          {/* RFP selector */}
          <div className="mb-3 text-[11px] text-slate-500">
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Current RFP:
            </label>
            <select
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              value={selectedRfpId}
              onChange={handleRfpChange}
            >
              {rfps.length === 0 && <option value="">No RFPs yet</option>}
              {rfps.length > 0 &&
                rfps.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.title || r._id}
                  </option>
                ))}
            </select>
          </div>

          {/* Vendor dropdown */}
          <div className="mb-3">
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Vendor
            </label>
            <select
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              value={selectedProposalId}
              onChange={handleVendorChange}
            >
              {vendorOptions.length === 0 ? (
                <option value="">No vendors yet</option>
              ) : (
                <>
                  <option value="">-- Select vendor --</option>
                  {vendorOptions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* Response textarea */}
          <div className="mb-3">
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Vendor email / proposal text
            </label>
            <textarea
              className="min-h-[170px] w-full rounded-xl border border-slate-300 p-3 text-sm"
              placeholder={
                "Example:\nHi, we can supply 20 laptops and 15 monitors for a total price of $45,000. Delivery in 25 days. We offer 18 months warranty. Payment terms: Net 30."
              }
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
            />
          </div>

          {/* Parse button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleParse}
              disabled={loadingParse}
              className="rounded-full bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {loadingParse ? "Parsing..." : "Parse & attach to current RFP"}
            </button>
          </div>
        </div>

        {/* RIGHT: parsed proposal card */}
        <div className="flex flex-col rounded-2xl border border-slate-100 p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Parsed proposal</h3>
            <span className="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-[11px] text-slate-700">
              Edit before saving
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="mb-1 block font-semibold text-slate-600">
                Detected delivery (in days)
              </label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                value={deliveryDays}
                onChange={(e) => setDeliveryDays(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-slate-600">
                Detected payment terms
              </label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-slate-600">
                Detected warranty (in months)
              </label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                value={warrantyMonths}
                onChange={(e) => setWarrantyMonths(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-slate-600">
                Detected total price (in INR)
              </label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                value={totalPrice}
                onChange={(e) => setTotalPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-3 flex-1">
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Free-form notes / conditions
            </label>
            <textarea
              className="h-28 w-full rounded-xl border border-slate-300 p-2 text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="mt-3 flex items-center justify-end text-[11px] text-slate-500">
            <button
              type="button"
              onClick={handleSaveOnly}
              className="rounded-full bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Save proposal for this RFP
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
