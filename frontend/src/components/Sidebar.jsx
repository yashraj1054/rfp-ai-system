import { NavLink } from "react-router-dom";

const steps = [
  {
    step: 1,
    label: "Create RFP",
    sub: "From Natural Language → structure",
    to: "/create-rfp",
  },
  {
    step: 2,
    label: "Vendors & Send",
    sub: "Manage Vendors · Send",
    to: "/vendors",
  },
  {
    step: 3,
    label: "Vendor Responses",
    sub: "Paste Emails · Parse",
    to: "/responses",
  },
  {
    step: 4,
    label: "Compare & Decide",
    sub: "Scores · Recommendation",
    to: "/compare",
  },
];

export default function Sidebar() {
  return (
    <aside className="flex max-h-[calc(100vh-140px)] flex-col gap-4 rounded-2xl bg-white p-4 shadow-lg sticky top-20 max-md:static max-md:max-h-none">
      <div>
        <div className="mb-1 text-sm font-semibold text-slate-700">
          Workflow
        </div>
        <ul className="space-y-1">
          {steps.map((s) => (
            <li key={s.step}>
              <NavLink
                to={s.to}
                className={({ isActive }) =>
                  `flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-xs transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "hover:bg-blue-50"
                  }`
                }
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-300 bg-white text-[11px] font-bold text-slate-600">
                  {s.step}
                </span>
                <div>
                  <div className="font-medium">{s.label}</div>
                  <div className="text-[10px] opacity-70">{s.sub}</div>
                </div>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>


    </aside>
  );
}
