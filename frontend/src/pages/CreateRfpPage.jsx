import { useState } from "react";
import api from "../api";

export default function CreateRfpPage() {
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [budget, setBudget] = useState("");
  const [warrantyMonths, setWarrantyMonths] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [items, setItems] = useState("");
  const [notes, setNotes] = useState("");

  const [currentRfpId, setCurrentRfpId] = useState(null);
  const [loadingGen, setLoadingGen] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  
  const clearFields = () => {
    setDescription("");
    setTitle("");
    setPaymentTerms("");
    setBudget("");
    setWarrantyMonths("");
    setDeliveryDays("");
    setItems("");
    setNotes("");
    setCurrentRfpId(null);
  };

  const handleGenerate = async () => {
    if (!description.trim()) return;
    setLoadingGen(true);
    setError("");
    setSuccess("");

    try {
      // This calls backend POST /api/rfps to do AI structuring + save
      const res = await api.post("/rfps", {
        naturalLanguageDescription: description,
      });

      const r = res.data;
      setCurrentRfpId(r._id);

      setTitle(r.title || "");
      setPaymentTerms(r.structured?.paymentTerms || "");
      setBudget(r.structured?.budget ?? "");
      setWarrantyMonths(r.structured?.warrantyMonths ?? "");
      setDeliveryDays(r.structured?.deliveryTimelineDays ?? "");
      setItems(
        r.structured?.items
          ?.map((it) => `${it.quantity} x ${it.name} (${it.specs || ""})`)
          .join(", ") || ""
      );
      setNotes(r.structured?.otherRequirements || "");
    } catch (err) {
      console.error(err);
      setError(
        "Failed to generate structured RFP (check backend / AI service)."
      );
    } finally {
      setLoadingGen(false);
    }
  };

  const handleClear = () => {
    clearFields();
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (!currentRfpId) {
      setError("Generate an RFP first so it has an ID to save.");
      return;
    }

    setLoadingSave(true);

    try {
      await api.put(`/rfps/${currentRfpId}`, {
        title,
        naturalLanguageDescription: description,
        structured: {
          paymentTerms,
          budget: budget ? Number(budget) : null,
          warrantyMonths: warrantyMonths ? Number(warrantyMonths) : null,
          deliveryTimelineDays: deliveryDays ? Number(deliveryDays) : null,
          items: [{ name: items, quantity: null, specs: "" }], 
          otherRequirements: notes,
        },
      });

      // show success message
      setSuccess("RFP saved successfully.");
      clearFields();
    } catch (err) {
      console.error(err);
      setError(
        "Failed to save RFP. Make sure backend has PUT /api/rfps/:id implemented."
      );
    } finally {
      setLoadingSave(false);
    }
  };

  return (
    <section className="rounded-2xl bg-white p-5 shadow-lg">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">
            1 · Create RFP from natural language
          </h2>
          <p className="text-xs text-slate-500">
            Describe what you want to buy in plain English. The system turns it
            into a structured RFP object.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
          🤖 AI step: text → structured fields
        </div>
      </div>

      {/* Banners */}
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

      <div className="grid grid-cols-[1.2fr_1fr] gap-4 max-lg:grid-cols-1">
        {/* Left: natural language input */}
        <div className="flex flex-col">
          <label className="mb-1 text-xs font-semibold text-slate-600">
            Your procurement description
          </label>
          <textarea
            className="min-h-[180px] rounded-xl border border-slate-300 p-3 text-sm shadow-inner focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            placeholder="Example: I need to procure laptops and monitors for our new office. Budget is $50,000 total. Need delivery within 30 days. We need 20 laptops with 16GB RAM and 15 monitors 27-inch. Payment terms should be net 30, and we need at least 1 year warranty."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="mt-3 flex items-center justify-end text-[11px] text-slate-500">
            <button
              onClick={handleGenerate}
              disabled={loadingGen || !description.trim()}
              className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingGen ? "Generating..." : "Generate structured RFP"}
            </button>
          </div>
        </div>

        {/* Right: structured RFP */}
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Structured RFP</h3>
            <span className="inline-flex items-centre rounded-full bg-slate-200 px-3 py-1 text-[11px] text-slate-700">
              Edit before saving
            </span>
          </div>

          {/* Title */}
          <div className="mb-3">
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Title
            </label>
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              placeholder="e.g. Laptops & Monitors for New Office"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Grouped fields */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="mb-1 block font-semibold text-slate-600">
                Payment terms
              </label>
              <input
                className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-sm"
                placeholder="e.g. Net 30"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-slate-600">
                Budget (approx, in USD)
              </label>
              <input
                type="number"
                className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-sm"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-slate-600">
                Minimum warranty (months)
              </label>
              <input
                type="number"
                className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-sm"
                value={warrantyMonths}
                onChange={(e) => setWarrantyMonths(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-slate-600">
                Delivery required within (days)
              </label>
              <input
                type="number"
                className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-sm"
                value={deliveryDays}
                onChange={(e) => setDeliveryDays(e.target.value)}
              />
            </div>
          </div>

          {/* Items */}
          <div className="mt-3">
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Items / scope (short description)
            </label>
            <textarea
              className="w-full rounded-xl border border-slate-300 p-2 text-sm"
              placeholder={`e.g. 20 x laptops (16GB RAM), 15 x 27" monitors`}
              value={items}
              onChange={(e) => setItems(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="mt-3">
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Other requirements / notes
            </label>
            <textarea
              className="w-full rounded-xl border border-slate-300 p-2 text-sm"
              placeholder="Any other details you care about (support, brand, etc.)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="mt-3 flex items-center justify-end text-[11px] text-slate-500">
            <div className="inline-flex gap-2">
              <button
                type="button"
                onClick={handleClear}
                className="rounded-full bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-300"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={loadingSave}
                className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loadingSave ? "Saving..." : "Save RFP"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
