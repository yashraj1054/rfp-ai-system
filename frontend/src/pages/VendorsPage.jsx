import { useEffect, useState } from "react";
import api from "../api";

export default function VendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [rfps, setRfps] = useState([]);
  const [selectedRfpId, setSelectedRfpId] = useState("");
  const [selectedVendorIds, setSelectedVendorIds] = useState([]);

  const [form, setForm] = useState({ name: "", email: "", company: "" });
  const [loadingVendor, setLoadingVendor] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  // sorting
  const [sortBy, setSortBy] = useState("name"); 
  const [sortDir, setSortDir] = useState("asc"); 

  const loadVendors = async () => {
    try {
      const res = await api.get("/vendors");
      setVendors(res.data);
      setSelectedVendorIds((prev) =>
        prev.filter((id) => res.data.some((v) => v._id === id))
      );
    } catch (err) {
      console.error(err);
      setError("Failed to load vendors");
    }
  };

  const loadRfps = async () => {
    try {
      const res = await api.get("/rfps");
      setRfps(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadVendors();
    loadRfps();
  }, []);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name || !form.email) {
      setError("Name and email are required");
      return;
    }

    try {
      setLoadingVendor(true);
      await api.post("/vendors", form);
      setForm({ name: "", email: "", company: "" });
      await loadVendors();
      setSuccess("Vendor added successfully.");
    } catch (err) {
      console.error(err);
      setError("Failed to create vendor");
    } finally {
      setLoadingVendor(false);
    }
  };

  const toggleVendor = (id) => {
    setSelectedVendorIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSendRfp = async () => {
    setError("");
    setSuccess("");

    if (!selectedRfpId) {
      setError("Select an RFP to send");
      return;
    }
    if (selectedVendorIds.length === 0) {
      setError("Select at least one vendor to send to");
      return;
    }

    try {
      setSending(true);
      const res = await api.post("/proposals/send", {
        rfpId: selectedRfpId,
        vendorIds: selectedVendorIds,
      });

      setSuccess(`Emails sent: ${res.data.sent}, failed: ${res.data.failed}.`);
      setSelectedVendorIds([]);
      setSelectedRfpId("");
      setSearch("");
    } catch (err) {
      console.error(err);
      setError("Failed to send RFP to vendors");
    } finally {
      setSending(false);
    }
  };

  const selectedRfp = rfps.find((r) => r._id === selectedRfpId);

  // Filter vendors by search term 
  const searchLower = search.trim().toLowerCase();
  let filteredVendors = !searchLower
    ? vendors
    : vendors.filter((v) => {
        const name = v.name?.toLowerCase() || "";
        const email = v.email?.toLowerCase() || "";
        const company = v.company?.toLowerCase() || "";
        return (
          name.includes(searchLower) ||
          email.includes(searchLower) ||
          company.includes(searchLower)
        );
      });

  // Sort filtered vendors
  filteredVendors = [...filteredVendors].sort((a, b) => {
    const fieldA =
      (sortBy === "name"
        ? a.name
        : sortBy === "company"
        ? a.company
        : a.email) || "";
    const fieldB =
      (sortBy === "name"
        ? b.name
        : sortBy === "company"
        ? b.company
        : b.email) || "";

    const va = fieldA.toLowerCase();
    const vb = fieldB.toLowerCase();

    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  // Select-all Vendors
  const allFilteredSelected =
    filteredVendors.length > 0 &&
    filteredVendors.every((v) => selectedVendorIds.includes(v._id));

  const handleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      // clear selection of filtered vendors
      setSelectedVendorIds((prev) =>
        prev.filter((id) => !filteredVendors.some((v) => v._id === id))
      );
    } else {
      // select all filtered vendors (merge)
      setSelectedVendorIds((prev) => {
        const set = new Set(prev);
        filteredVendors.forEach((v) => set.add(v._id));
        return Array.from(set);
      });
    }
  };

  return (
    <section className="rounded-2xl bg-white p-5 shadow-lg">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            2 · Manage vendors &amp; send RFP
          </h2>
          <p className="text-xs text-slate-500">
            Add vendors, search &amp; sort, and send a selected RFP only to the
            vendors you choose.
          </p>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] text-indigo-700">
          Search · Sort · Select
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

      <div className="grid gap-4 md:grid-cols-2">
        {/* Left: add vendor form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-100 p-4"
        >
          <h3 className="mb-3 text-sm font-semibold">Add vendor</h3>

          <div className="mb-3">
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Vendor name
            </label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              placeholder="e.g. TechWorld Suppliers"
              value={form.name}
              onChange={handleChange("name")}
            />
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Vendor email
            </label>
            <input
              type="email"
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              placeholder="e.g. sales@techworld.com"
              value={form.email}
              onChange={handleChange("email")}
            />
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Company
            </label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
              placeholder="Company Name"
              value={form.company}
              onChange={handleChange("company")}
            />
          </div>

          <div className="mt-3 flex items-center justify-end text-[11px] text-slate-500">
            <button
              type="submit"
              disabled={loadingVendor}
              className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loadingVendor ? "Adding..." : "Add vendor"}
            </button>
          </div>
        </form>

        {/* Right: vendor list + search/sort + send RFP */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-100 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Vendors</h3>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
                {selectedVendorIds.length} selected / {vendors.length} total
              </span>
            </div>

            {/* Search input */}
            <div className="mb-2">
              <input
                type="text"
                className="w-full rounded-full border border-slate-300 px-3 py-1.5 text-xs"
                placeholder="Search by vendor name, email, or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <div className="mt-1 text-[11px] text-slate-500">
                  Showing {filteredVendors.length} of {vendors.length} vendors
                  matching &quot;{search}&quot;
                </div>
              )}
            </div>

            {/* Sort + Select all row */}
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-1">
                <span className="text-slate-500">Sort by</span>
                <select
                  className="rounded-full border border-slate-300 bg-white px-2 py-1"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="name">Name</option>
                  <option value="company">Company</option>
                  <option value="email">Email</option>
                </select>
                <button
                  type="button"
                  className="rounded-full border border-slate-300 px-2 py-1"
                  onClick={() =>
                    setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                  }
                >
                  {sortDir === "asc" ? "A → Z" : "Z → A"}
                </button>
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  disabled={filteredVendors.length === 0}
                  className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 font-medium disabled:opacity-50"
                >
                  {allFilteredSelected ? "Clear selection" : "Select all"}
                </button>
              </div>
            </div>

            {/* Vendor list */}
            {vendors.length === 0 ? (
              <div className="rounded-lg bg-slate-50 px-3 py-4 text-xs text-slate-500">
                No vendors yet. Add your first vendor using the form on the left.
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="rounded-lg bg-slate-50 px-3 py-4 text-xs text-slate-500">
                No vendors match your search.
              </div>
            ) : (
              <div className="max-h-40 space-y-1 overflow-auto text-sm">
                {filteredVendors.map((v) => (
                  <label
                    key={v._id}
                    className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300"
                        checked={selectedVendorIds.includes(v._id)}
                        onChange={() => toggleVendor(v._id)}
                      />
                      <div>
                        <div className="text-sm font-medium">{v.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {v.email} {v.company && <>· {v.company}</>}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Select RFP + send section */}
          <div className="rounded-xl border border-slate-100 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Send RFP</h3>
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Select RFP
              </label>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                value={selectedRfpId}
                onChange={(e) => setSelectedRfpId(e.target.value)}
              >
                <option value="">-- Choose an RFP --</option>
                {rfps.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.title || r._id}
                  </option>
                ))}
              </select>
              {!rfps.length && (
                <p className="mt-1 text-[11px] text-slate-500">
                  You haven&apos;t created any RFPs yet. Go to step 1 to create
                  one.
                </p>
              )}
            </div>

            {selectedRfp && (
              <p className="mb-2 text-[11px] text-slate-500">
                Current RFP budget:{" "}
                <span className="font-semibold">
                  {selectedRfp.structured?.budget ?? "N/A"}
                </span>{" "}
                · Delivery in{" "}
                <span className="font-semibold">
                  {selectedRfp.structured?.deliveryTimelineDays ?? "?"}
                </span>{" "}
                days
              </p>
            )}

            <button
              type="button"
              onClick={handleSendRfp}
              disabled={sending}
              className="w-full rounded-full bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send RFP to selected vendors"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
