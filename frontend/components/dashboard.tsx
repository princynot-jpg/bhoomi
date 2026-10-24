"use client";

import {
  ArrowDownLeft,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Command,
  Compass,
  Download,
  FileCheck2,
  FilePlus2,
  GanttChart,
  GitBranch,
  Grid2X2,
  LogOut,
  Map,
  MapPinned,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import ThemeToggle from "@/components/theme-toggle";
import NepalAddressPicker from "@/components/ui/nepal-address-picker";
import { signOut, useCurrentUser } from "@/lib/auth";
import {
  createWorkspaceRecord,
  listWorkspaceRecords,
  updateWorkspaceRecordStatus,
  type WorkspaceRecord,
} from "@/lib/workspace";

type Proposal = {
  id: string;
  title: string;
  district: string;
  state: string;
  agency: string;
  stage: string;
  area: string;
  progress: number;
  updated: string;
  color: string;
};

type Workspace = {
  id: string;
  name: string;
  scope: "District" | "State" | "National";
  district?: string;
};

const workspaces: Workspace[] = [
  { id: "chhattisgarh", name: "Chhattisgarh · State", scope: "State" },
  { id: "surguja", name: "Surguja · District", scope: "District", district: "Surguja" },
  { id: "korba", name: "Korba · District", scope: "District", district: "Korba" },
  { id: "national", name: "National · Demo", scope: "National" },
];

const proposals: Proposal[] = [
  {
    id: "LA-2025-0842",
    title: "NH-130 · Ambikapur Bypass",
    district: "Surguja",
    state: "Chhattisgarh",
    agency: "NHAI · Regional Office",
    stage: "Under scrutiny",
    area: "42.5 ha",
    progress: 15,
    updated: "12 min ago",
    color: "sage",
  },
  {
    id: "LA-2025-0837",
    title: "Korba–Champa Rail Link",
    district: "Korba",
    state: "Chhattisgarh",
    agency: "South East Central Railway",
    stage: "Notice issued",
    area: "18.2 ha",
    progress: 48,
    updated: "38 min ago",
    color: "blue",
  },
  {
    id: "LA-2025-0821",
    title: "Mahanadi Irrigation Canal",
    district: "Dhamtari",
    state: "Chhattisgarh",
    agency: "Water Resources Department",
    stage: "Award declared",
    area: "126.8 ha",
    progress: 91,
    updated: "1 hour ago",
    color: "gold",
  },
  {
    id: "LA-2025-0798",
    title: "Raipur Outer Ring Road · P2",
    district: "Raipur",
    state: "Chhattisgarh",
    agency: "NHAI · Regional Office",
    stage: "Compensation",
    area: "64.1 ha",
    progress: 64,
    updated: "3 hours ago",
    color: "violet",
  },
  {
    id: "LA-2025-0772",
    title: "Bastar Rural Connectivity",
    district: "Bastar",
    state: "Chhattisgarh",
    agency: "PWD · Bastar Division",
    stage: "Possession",
    area: "31.6 ha",
    progress: 83,
    updated: "Yesterday",
    color: "sage",
  },
];

const navigation = [
  { label: "Overview", icon: Grid2X2 },
  { label: "Proposals", icon: GanttChart, count: "05" },
  { label: "Project workflow", icon: GitBranch },
  { label: "Land parcels", icon: MapPinned },
  { label: "Compensation", icon: ArrowDownLeft },
  { label: "Rehabilitation", icon: Users },
];

const timeline = [
  {
    type: "success",
    title: "Section 19 notification issued",
    detail: "NH-130 · Ambikapur Bypass",
    time: "10:42 AM",
  },
  {
    type: "warning",
    title: "Scrutiny deadline in 2 days",
    detail: "Korba–Champa Rail Link",
    time: "9:18 AM",
  },
  {
    type: "info",
    title: "12 families verified",
    detail: "Mahanadi Irrigation Canal",
    time: "Yesterday",
  },
];

const modulePreviews: Record<string, { icon: typeof Map; description: string; next: string }> = {
  Insights: {
    icon: Compass,
    description: "See how acquisition activity, project timelines and district progress connect across the state.",
    next: "Spatial analytics will be available when the underlying project and parcel data is connected.",
  },
  Reports: {
    icon: FileCheck2,
    description: "Prepare a clear, exportable view of milestones, land area and project progress.",
    next: "The overview can export its illustrative proposal rows; live MIS reporting is not connected yet.",
  },
  "Help & support": {
    icon: CircleHelp,
    description: "Find guidance for using the workspace and moving acquisition projects forward.",
    next: "Contact your workspace administrator for access or account support.",
  },
};

function BrandMark() {
  return (
    <div aria-label="Bhoomi" className="brand-mark">
      <div className="brand-symbol">
        <span />
        <span />
        <span />
        <span />
      </div>
      <span className="brand-name">Bhoomi</span>
    </div>
  );
}

function Sidebar({
  active,
  workspace,
  onWorkspaceChange,
  onNavigate,
  open,
  onClose,
}: {
  active: string;
  workspace: Workspace;
  onWorkspaceChange: (workspace: Workspace) => void;
  onNavigate: (label: string) => void;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const user = useCurrentUser();
  const workspaceMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!workspaceMenuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !workspaceMenuRef.current?.contains(event.target)) {
        setWorkspaceMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setWorkspaceMenuOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [workspaceMenuOpen]);

  return (
    <>
      {open && <button aria-label="Close navigation" className="sidebar-scrim" onClick={onClose} />}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <BrandMark />
          <button aria-label="Close navigation" className="icon-button sidebar-close" onClick={onClose}>
            <X size={18} />
          </button>
          <div className="workspace-picker" ref={workspaceMenuRef}>
            <button
              aria-controls="workspace-options"
              aria-expanded={workspaceMenuOpen}
              aria-haspopup="listbox"
              aria-label={`Change workspace. Current workspace: ${workspace.name}`}
              className="workspace-switch"
              onClick={() => setWorkspaceMenuOpen((isOpen) => !isOpen)}
              type="button"
            >
              <span className="workspace-avatar"><Sprout size={17} /></span>
              <span className="workspace-copy">
                <span>{workspace.scope} workspace</span>
                <strong>{workspace.name}</strong>
              </span>
              <ChevronDown className={`workspace-chevron ${workspaceMenuOpen ? "workspace-chevron-open" : ""}`} size={15} />
            </button>
            {workspaceMenuOpen && (
              <div className="workspace-menu" id="workspace-options">
                <div className="workspace-menu-heading">
                  <span>DEMO WORKSPACES</span>
                  <small>Sample views</small>
                </div>
                <div aria-label="Choose a workspace" className="workspace-options" role="listbox">
                  {workspaces.map((option) => (
                    <button
                      aria-selected={workspace.id === option.id}
                      className={`workspace-option ${workspace.id === option.id ? "workspace-option-selected" : ""}`}
                      key={option.id}
                      onClick={() => {
                        onWorkspaceChange(option);
                        setWorkspaceMenuOpen(false);
                      }}
                      role="option"
                      type="button"
                    >
                      <span className="workspace-option-icon"><Sprout size={14} /></span>
                      <span className="workspace-option-copy"><strong>{option.name}</strong><small>{option.scope} view · sample data</small></span>
                      {workspace.id === option.id && <Check className="workspace-option-check" size={14} />}
                    </button>
                  ))}
                </div>
                <p className="workspace-menu-note">District views filter the sample project list. Other figures remain illustrative.</p>
              </div>
            )}
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>
        <nav aria-label="Main navigation" className="main-nav">
          {navigation.map(({ label, icon: Icon, count }) => (
            <button
              aria-current={active === label ? "page" : undefined}
              className={`nav-item ${active === label ? "nav-item-active" : ""}`}
              key={label}
              onClick={() => {
                onNavigate(label);
                onClose();
              }}
            >
              <Icon size={17} strokeWidth={1.8} />
              <span>{label}</span>
              {count && <span className="nav-count">{count}</span>}
            </button>
          ))}
        </nav>

        <div className="nav-label nav-label-spaced">INTELLIGENCE</div>
        <nav aria-label="Intelligence navigation" className="main-nav">
          <button className="nav-item" onClick={() => onNavigate("Insights")}>
            <Compass size={17} strokeWidth={1.8} /><span>Spatial insights</span>
            <span className="nav-new">NEW</span>
          </button>
          <button className="nav-item" onClick={() => onNavigate("Reports")}>
            <FileCheck2 size={17} strokeWidth={1.8} /><span>Reports</span>
          </button>
        </nav>

        <div className="sidebar-spacer" />
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <div className="tip-icon"><Sparkles size={15} /></div>
            <strong>A clearer picture,<br />together.</strong>
            <span>Explore how your work connects across districts.</span>
            <button onClick={() => onNavigate("Insights")}>Explore insights <ArrowRight size={13} /></button>
            <div className="tip-orbit tip-orbit-one" />
            <div className="tip-orbit tip-orbit-two" />
          </div>
          <button className="nav-item sidebar-help" onClick={() => onNavigate("Help & support")}>
            <CircleHelp size={17} strokeWidth={1.8} /><span>Help & support</span>
          </button>
          <div className="user-profile">
            <div className="profile-avatar">{user ? user.name.slice(0, 2).toUpperCase() : "BH"}</div>
            <div className="profile-info">
              <strong>{user?.name ?? "Demo workspace"}</strong>
              <span>{user?.email ?? "Sample data · Chhattisgarh"}</span>
            </div>
            <button
              aria-label="Log out"
              className="profile-signout"
              disabled={signingOut}
              onClick={async () => {
                setSignOutError("");
                if (!user) {
                  router.replace("/login");
                  return;
                }

                setSigningOut(true);
                try {
                  await signOut();
                  router.replace("/login");
                } catch (cause) {
                  setSignOutError(cause instanceof Error ? cause.message : "Unable to sign out. Please try again.");
                } finally {
                  setSigningOut(false);
                }
              }}
              type="button"
            >
              <LogOut aria-hidden="true" size={15} />
              <span>{signingOut ? "Logging out…" : "Log out"}</span>
            </button>
          </div>
          {signOutError && <p className="profile-auth-error" role="alert">{signOutError}</p>}
        </div>
      </aside>
    </>
  );
}

function StatCard({
  label,
  value,
  unit,
  change,
  positive = true,
  icon: Icon,
  tone,
  index,
}: {
  label: string;
  value: string;
  unit: string;
  change: string;
  positive?: boolean;
  icon: typeof Map;
  tone: string;
  index: string;
}) {
  return (
    <article className={`stat-card stat-card-${tone}`}>
      <div className="stat-topline">
        <span>{label}</span>
        <span className="stat-index">{index}</span>
      </div>
      <div className="stat-value-row"><strong>{value}</strong><span>{unit}</span></div>
      <div className="stat-foot">
        <span className={`stat-change ${positive ? "change-positive" : "change-neutral"}`}>
          {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {change}
        </span>
        <span className="stat-period">vs. last month</span>
        <span className="stat-icon"><Icon size={15} strokeWidth={1.8} /></span>
      </div>
    </article>
  );
}

function StageBadge({ stage }: { stage: string }) {
  const style =
    stage === "Under scrutiny" ? "badge-blue" :
      stage === "Notice issued" ? "badge-amber" :
        stage === "Award declared" ? "badge-green" :
          stage === "Compensation" ? "badge-violet" : "badge-sage";
  return <span className={`stage-badge ${style}`}><span />{stage}</span>;
}

function ProposalTable({ items, onShowWorkflow }: { items: Proposal[]; onShowWorkflow: (proposal: Proposal) => void }) {
  return (
    <div className="table-scroll">
      <table className="proposal-table">
        <thead>
          <tr><th>PROJECT</th><th>LOCATION</th><th>STAGE</th><th>LAND AREA</th><th>PROGRESS</th><th>UPDATED</th><th /></tr>
        </thead>
        <tbody>
          {items.map((proposal) => (
            <tr key={proposal.id}>
              <td>
                <div className="project-cell">
                  <span className={`project-marker marker-${proposal.color}`}><Map size={15} /></span>
                  <span><strong>{proposal.title}</strong><small>{proposal.id} <i /> {proposal.agency}</small></span>
                </div>
              </td>
              <td><span className="location-cell">{proposal.district}<small>{proposal.state}</small></span></td>
              <td><StageBadge stage={proposal.stage} /></td>
              <td className="area-cell">{proposal.area}</td>
              <td>
                <div className="progress-cell"><div className="progress-track"><span style={{ width: `${proposal.progress}%` }} /></div><small>{proposal.progress}%</small></div>
              </td>
              <td className="updated-cell">{proposal.updated}</td>
              <td><button aria-label={`Show project workflow for ${proposal.title}`} className="workflow-button" onClick={() => onShowWorkflow(proposal)}><GitBranch size={14} /><span>Workflow</span></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const resourceConfig = {
  "Land parcels": {
    path: "land-parcels",
    noun: "land parcel",
    statuses: ["Identified", "Verified", "Under acquisition", "Possession"],
    fields: [
      { name: "reference", label: "Parcel reference", placeholder: "LP-2026-001" },
      { name: "project", label: "Project", placeholder: "Project name" },
      { name: "surveyNumber", label: "Survey number", placeholder: "Survey number" },
      { name: "ownerName", label: "Landowner", placeholder: "Landowner name" },
      { name: "areaHectares", label: "Area (hectares)", placeholder: "0.00", type: "number" },
    ],
  },
  Compensation: {
    path: "compensation",
    noun: "compensation record",
    statuses: ["Assessment", "Approved", "Partially paid", "Paid"],
    fields: [
      { name: "reference", label: "Award reference", placeholder: "CA-2026-001" },
      { name: "project", label: "Project", placeholder: "Project name" },
      { name: "parcelReference", label: "Parcel reference", placeholder: "LP-2026-001" },
      { name: "recipient", label: "Recipient", placeholder: "Recipient name" },
      { name: "awardAmount", label: "Award amount (INR)", placeholder: "0", type: "number" },
      { name: "paidAmount", label: "Amount paid (INR)", placeholder: "0", type: "number" },
    ],
  },
  Rehabilitation: {
    path: "rehabilitation",
    noun: "rehabilitation case",
    statuses: ["Verification", "Eligible", "Support in progress", "Completed"],
    fields: [
      { name: "reference", label: "Case reference", placeholder: "RR-2026-001" },
      { name: "project", label: "Project", placeholder: "Project name" },
      { name: "familyName", label: "Family name", placeholder: "Family name" },
      { name: "affectedMembers", label: "Affected members", placeholder: "1", type: "number" },
      { name: "entitlement", label: "Entitlement / support", placeholder: "Describe the entitlement" },
    ],
  },
} as const;

function isResourceModule(title: string): title is keyof typeof resourceConfig {
  return Object.hasOwn(resourceConfig, title);
}

function ResourceModule({ title }: { title: keyof typeof resourceConfig }) {
  const config = resourceConfig[title];
  const [records, setRecords] = useState<WorkspaceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadRecords() {
    setLoading(true);
    setError("");
    try {
      setRecords(await listWorkspaceRecords(config.path));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRecords();
  }, [config.path]);

  async function submitRecord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const record: Record<string, string | number> = {};
    for (const [name, value] of form.entries()) {
      const field = config.fields.find((candidate) => candidate.name === name);
      if (field && "type" in field && field.type === "number") record[name] = Number(value);
      else record[name] = String(value).trim();
    }
    try {
      const created = await createWorkspaceRecord(config.path, record);
      setRecords((current) => [created, ...current]);
      setShowForm(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `Unable to create ${config.noun}.`);
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(record: WorkspaceRecord, status: string) {
    setError("");
    try {
      const updated = await updateWorkspaceRecordStatus(config.path, record._id, status);
      setRecords((current) => current.map((item) => item._id === updated._id ? updated : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update status.");
    }
  }

  return (
    <section className="surface resource-module">
      <div className="resource-heading">
        <div className="section-heading">
          <div className="section-kicker">LIVE WORKSPACE RECORDS</div>
          <h2>{title}<span>.</span></h2>
          <p>Records are saved to the backend and scoped to your assigned district.</p>
        </div>
        <button className="button button-primary" onClick={() => setShowForm((current) => !current)}><Plus size={15} /> Add {config.noun}</button>
      </div>

      {error && <p className="resource-error" role="alert">{error}</p>}

      {showForm && (
        <form className="resource-form" onSubmit={submitRecord}>
          <div className="resource-form-grid">
            {config.fields.map((field) => (
              <label className="modal-label" key={field.name}>
                {field.label}
                <input
                  max={"type" in field && field.type === "number" ? "1000000000000" : undefined}
                  min={"type" in field && field.type === "number" ? (field.name === "areaHectares" || field.name === "affectedMembers" ? "1" : "0") : undefined}
                  name={field.name}
                  placeholder={field.placeholder}
                  required
                  step={"type" in field && field.type === "number" && field.name !== "affectedMembers" ? "any" : undefined}
                  type={"type" in field ? field.type : "text"}
                />
              </label>
            ))}
          </div>
          <div className="resource-form-actions">
            <button className="button button-secondary" onClick={() => setShowForm(false)} type="button">Cancel</button>
            <button className="button button-primary" disabled={saving} type="submit">{saving ? "Saving…" : "Save record"}</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="resource-state">Loading workspace records…</p>
      ) : records.length === 0 ? (
        <div className="resource-state"><strong>No {title.toLowerCase()} records yet</strong><span>Add a record to start tracking this workflow.</span></div>
      ) : (
        <div className="resource-records">
          {records.map((record) => (
            <article className="resource-record" key={record._id}>
              <div className="resource-record-main">
                <div className="section-kicker">{record.reference} <span className="eyebrow-line" /> {record.district}, {record.state}</div>
                <strong>{record.project}</strong>
                <span>{title === "Land parcels"
                  ? `${record.surveyNumber} · ${record.ownerName} · ${record.areaHectares} ha`
                  : title === "Compensation"
                    ? `${record.recipient} · Parcel ${record.parcelReference} · ₹${Number(record.paidAmount).toLocaleString("en-IN")} / ₹${Number(record.awardAmount).toLocaleString("en-IN")}`
                    : `${record.familyName} · ${record.affectedMembers} members · ${record.entitlement}`}</span>
              </div>
              <label className="resource-status-label">
                <span>Status</span>
                <select aria-label={`Status for ${record.reference}`} onChange={(event) => void changeStatus(record, event.target.value)} value={record.status}>
                  {config.statuses.map((status) => <option key={status}>{status}</option>)}
                </select>
              </label>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ProjectWorkflowDialog({ proposal, onClose }: { proposal: Proposal; onClose: () => void }) {
  const stages = [
    "Project Proposal",
    "Verification",
    "Approval",
    "GIS Land Mapping",
    "Notification",
    "Compensation",
    "Possession",
    "R&R",
    "Final Status",
  ];
  const currentStage = getWorkflowStage(proposal.stage);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section aria-labelledby="workflow-title" aria-modal="true" className="create-modal workflow-modal" role="dialog">
        <button aria-label="Close workflow" className="icon-button modal-close" onClick={onClose}><X size={18} /></button>
        <span className="modal-symbol"><GitBranch size={21} /></span>
        <span className="modal-kicker">PROJECT WORKFLOW · {proposal.id}</span>
        <h2 id="workflow-title">{proposal.title}</h2>
        <p>{proposal.district}, {proposal.state} · Current stage: {stages[currentStage]}</p>
        <WorkflowStages stages={stages} currentStage={currentStage} />
        <button className="button button-primary modal-submit" onClick={onClose}>Done <Check size={15} /></button>
      </section>
    </div>
  );
}

function getWorkflowStage(stage: string) {
  if (stage === "Under scrutiny") return 1;
  if (stage === "Notice issued") return 4;
  if (stage === "Award declared" || stage === "Compensation") return 5;
  if (stage === "Possession") return 6;
  return 0;
}

function WorkflowStages({ stages, currentStage }: { stages: string[]; currentStage: number }) {
  return (
    <div aria-label="Project stages" className="workflow-track-scroll">
      <ol className="workflow-track">
        {stages.map((stage, index) => {
          const status = index < currentStage ? "Completed" : index === currentStage ? "In progress" : "Upcoming";
          const stageClass = index < currentStage ? "workflow-stage-complete" : index === currentStage ? "workflow-stage-current" : "";
          return (
            <li className={`workflow-track-stage ${stageClass}`} key={stage}>
              <span className="workflow-track-label">{stage}</span>
              <small>{status}</small>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ProjectWorkflowPage() {
  const [projectId, setProjectId] = useState(proposals[0]?.id ?? "");
  const proposal = proposals.find((item) => item.id === projectId);
  if (!proposal) return null;
  const stages = [
    "Project Proposal",
    "Verification",
    "Approval",
    "GIS Land Mapping",
    "Notification",
    "Compensation",
    "Possession",
    "R&R",
    "Final Status",
  ];

  return (
    <section className="surface project-workflow-page">
      <div className="resource-heading">
        <div className="section-heading">
          <div className="section-kicker"><GitBranch size={12} /> PROJECT LIFECYCLE</div>
          <h2>Project workflow<span>.</span></h2>
          <p>Follow each project from proposal submission through final status.</p>
        </div>
        <label className="workflow-project-select">
          <span>Project</span>
          <select aria-label="Choose project workflow" onChange={(event) => setProjectId(event.target.value)} value={proposal.id}>
            {proposals.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
        </label>
      </div>
      <div className="workflow-project-summary">
        <div><span>{proposal.id}</span><strong>{proposal.title}</strong></div>
        <div><span>LOCATION</span><strong>{proposal.district}, {proposal.state}</strong></div>
        <div><span>CURRENT STAGE</span><strong>{stages[getWorkflowStage(proposal.stage)]}</strong></div>
        <div><span>PROGRESS</span><strong>{proposal.progress}%</strong></div>
      </div>
      <WorkflowStages stages={stages} currentStage={getWorkflowStage(proposal.stage)} />
      <p className="workflow-demo-note">Workflow stages shown for the illustrative project register.</p>
    </section>
  );
}

function ModulePreview({
  title,
  onOverview,
}: {
  title: string;
  onOverview: () => void;
}) {
  const preview = modulePreviews[title] ?? modulePreviews.Insights;
  const Icon = preview.icon;

  return (
    <section className="surface module-preview">
      <div className="module-preview-graphic"><div className="module-orbit module-orbit-one" /><div className="module-orbit module-orbit-two" /><span><Icon size={24} /></span></div>
      <div className="module-preview-copy">
        <div className="section-kicker">WORKSPACE MODULE <span className="module-preview-dot" /></div>
        <h2>{title}<span>.</span></h2>
        <p>{preview.description}</p>
        <div className="module-status"><Clock3 size={14} /><span>{preview.next}</span></div>
        <button className="button button-secondary" onClick={onOverview}>Return to overview <ArrowRight size={14} /></button>
      </div>
      <span className="module-preview-watermark">BH</span>
    </section>
  );
}

export default function Dashboard() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [workspace, setWorkspace] = useState(workspaces[0]);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All stages");
  const [showFilters, setShowFilters] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [workflowProposal, setWorkflowProposal] = useState<Proposal | null>(null);

  const workspaceProposals = useMemo(
    () => workspace.district
      ? proposals.filter((proposal) => proposal.district === workspace.district)
      : proposals,
    [workspace],
  );

  const filteredProposals = useMemo(
    () => workspaceProposals.filter((proposal) => {
      const query = search.trim().toLowerCase();
      const matchesSearch = !query || `${proposal.id} ${proposal.title} ${proposal.district} ${proposal.agency}`.toLowerCase().includes(query);
      const matchesStage = stageFilter === "All stages" || proposal.stage === stageFilter;
      return matchesSearch && matchesStage;
    }),
    [search, stageFilter, workspaceProposals],
  );

  function exportReport() {
    const rows = [
      ["Reference", "Project", "District", "State", "Agency", "Stage", "Land area", "Progress"],
      ...filteredProposals.map((p) => [p.id, p.title, p.district, p.state, p.agency, p.stage, p.area, `${p.progress}%`]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "bhoomi-proposals.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const sectionTitle = activeNav === "Overview" ? "Statewide overview" : activeNav;
  const sectionSubtitle = activeNav === "Overview"
    ? `A considered view of projects, people and land across ${workspace.scope === "National" ? "India" : workspace.district ?? "your state"}.`
    : `A clear view of ${activeNav.toLowerCase()} across ${workspace.scope === "National" ? "India" : workspace.district ?? "Chhattisgarh"}.`;

  return (
    <div className="app-frame">
      <Sidebar
        active={activeNav}
        workspace={workspace}
        onWorkspaceChange={(nextWorkspace) => {
          setWorkspace(nextWorkspace);
          setSearch("");
          setStageFilter("All stages");
        }}
        onNavigate={setActiveNav}
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
      <main className="main-area">
        <header className="topbar">
          <button aria-label="Open navigation" className="icon-button mobile-menu" onClick={() => setMobileNavOpen(true)}><Menu size={19} /></button>
          <div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14} /><strong>{activeNav}</strong></div>
          <div className="topbar-actions">
            <div className="command-hint"><Search size={15} /><span>Search anything...</span><kbd><Command size={11} /> K</kbd></div>
            <ThemeToggle />
            <div className="notification-wrap">
              <button aria-label="Notifications" className="icon-button notification-button" onClick={() => setNotificationsOpen(!notificationsOpen)}><Bell size={17} /><span /></button>
              {notificationsOpen && <div className="notification-popover"><strong>You’re all caught up</strong><span>New updates will appear here.</span></div>}
            </div>
            <div className="topbar-divider" />
            <span className="topbar-date">{workspace.scope === "National" ? "INDIA · DEMO" : `${workspace.district ?? "CHHATTISGARH"} · ${workspace.scope.toUpperCase()}`}</span>
          </div>
        </header>

        <div className="page-content" key={activeNav}>
          <section className="welcome-row">
            <div className="welcome-copy">
              <div className="eyebrow"><span className="eyebrow-dot" /> DEMO WORKSPACE <span className="eyebrow-line" /> {workspace.scope === "National" ? "INDIA" : workspace.district?.toUpperCase() ?? "CHHATTISGARH"}</div>
              <h1>{sectionTitle}<span className="greeting-comma">.</span></h1>
              <p>{sectionSubtitle}</p>
            </div>
            <div className="welcome-actions">
              {(activeNav === "Overview" || activeNav === "Proposals") && <button className="button button-secondary" onClick={exportReport}><Download size={15} /> Export report</button>}
              {(activeNav === "Overview" || activeNav === "Proposals") && <button className="button button-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> New proposal</button>}
            </div>
          </section>

          {activeNav === "Overview" && (
            <>
              <section aria-label="Illustrative state overview metrics" className="stats-grid">
                <StatCard label="ACTIVE PROPOSALS" value="248" unit="projects" change="+12.8%" icon={GanttChart} tone="green" index="01" />
                <StatCard label="LAND UNDER ACQUISITION" value="18,426" unit="hectares" change="+8.4%" icon={MapPinned} tone="blue" index="02" />
                <StatCard label="FAMILIES IDENTIFIED" value="12,804" unit="families" change="+5.2%" icon={Users} tone="gold" index="03" />
                <StatCard label="ON-TIME MILESTONES" value="94.2" unit="%" change="+2.1%" icon={Clock3} tone="lavender" index="04" />
              </section>

          <section className="spatial-grid">
            <article className="surface map-card">
              <div className="section-heading map-heading">
                <div><div className="section-kicker"><span className="live-dot" /> SPATIAL OVERVIEW</div><h2>Land, in context<span>.</span></h2><p>Choose a province or district, or search by postal code.</p></div>
              </div>
              <NepalAddressPicker className="dashboard-nepal-map" />
            </article>

            <article className="surface activity-card">
              <div className="section-heading activity-heading">
                <div><div className="section-kicker">FIELD NOTES <span className="note-count">03</span></div><h2>Moving forward<span>.</span></h2><p>The latest across your districts</p></div>
                <button aria-label="More field notes" className="icon-button tiny-more"><MoreHorizontal size={18} /></button>
              </div>
              <div className="activity-list">
                {timeline.map((event, index) => (
                  <div className="activity-item" key={event.title}>
                    <div className={`activity-marker activity-marker-${event.type}`}>{event.type === "success" ? <Check size={12} /> : event.type === "warning" ? <Clock3 size={12} /> : <Users size={12} />}</div>
                    <div className="activity-body"><strong>{event.title}</strong><span>{event.detail}</span><time>{event.time}</time></div>
                    {index < timeline.length - 1 && <span className="activity-connector" />}
                  </div>
                ))}
              </div>
              <button className="activity-link" onClick={() => setActiveNav("Proposals")}>View all activity <ArrowRight size={14} /></button>
              <div className="activity-glow" />
            </article>
          </section>
            </>
          )}

          {(activeNav === "Overview" || activeNav === "Proposals") && <section className="surface proposals-card">
            <div className="proposals-heading">
              <div className="section-heading">
                <div className="section-kicker">{activeNav === "Overview" ? "THE WORK, AT A GLANCE" : "SAMPLE REGISTER · 05 PROJECTS"}</div>
                <h2>{activeNav === "Overview" ? "Active proposals" : "Proposal register"}<span>.</span></h2>
                <p>{activeNav === "Overview" ? "Keep every milestone moving in the right direction." : "Illustrative project records for the Chhattisgarh workspace."}</p>
              </div>
              {activeNav === "Overview" && <button className="view-all-button" onClick={() => setActiveNav("Proposals")}>View all proposals <ArrowRight size={14} /></button>}
            </div>
            <div className="table-toolbar">
              <label className="table-search"><Search size={15} /><input aria-label="Search proposals" onChange={(event) => setSearch(event.target.value)} placeholder="Find a project, district or ID..." value={search} /><kbd>⌘ K</kbd></label>
              <div className="toolbar-controls">
                <button className={`filter-button ${showFilters ? "filter-active" : ""}`} onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal size={15} /> Filters{stageFilter !== "All stages" && <i />}</button>
                <button className="filter-button filter-short" onClick={exportReport}><Download size={15} /><span>Export</span></button>
                <button aria-label="More list options" className="icon-button list-more"><MoreHorizontal size={18} /></button>
              </div>
            </div>
            {showFilters && (
              <div className="filter-panel">
                <label htmlFor="stage-filter">Stage</label>
                <select id="stage-filter" onChange={(event) => setStageFilter(event.target.value)} value={stageFilter}>
                  <option>All stages</option>
                  {proposals.map((proposal) => proposal.stage).filter((stage, index, stages) => stages.indexOf(stage) === index).map((stage) => <option key={stage}>{stage}</option>)}
                </select>
                {stageFilter !== "All stages" && <button onClick={() => setStageFilter("All stages")}>Clear</button>}
              </div>
            )}
            <ProposalTable items={filteredProposals} onShowWorkflow={setWorkflowProposal} />
            <div className="table-footer"><span>Showing <strong>{filteredProposals.length}</strong> of <strong>{workspaceProposals.length}</strong> sample proposals</span><div className="pagination"><button aria-label="Previous page" disabled><ChevronLeft size={15} /></button><span><strong>1</strong> / 1</span><button aria-label="Next page" disabled><ChevronRight size={15} /></button></div></div>
          </section>}

          {isResourceModule(activeNav) && (
            <ResourceModule title={activeNav} />
          )}

          {activeNav === "Project workflow" && <ProjectWorkflowPage />}

          {activeNav !== "Overview" && activeNav !== "Proposals" && activeNav !== "Project workflow" && !isResourceModule(activeNav) && (
            <ModulePreview title={activeNav} onOverview={() => setActiveNav("Overview")} />
          )}

          <footer className="page-footer"><span>© 2025 Bhoomi · Land, managed with care.</span><span><span className="footer-status" /> Sample workspace <i /> Dashboard figures are illustrative</span></footer>
        </div>
      </main>

      {showCreate && <CreateProposalModal onClose={() => setShowCreate(false)} />}
      {workflowProposal && <ProjectWorkflowDialog proposal={workflowProposal} onClose={() => setWorkflowProposal(null)} />}
    </div>
  );
}

function CreateProposalModal({ onClose }: { onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section aria-labelledby="create-title" aria-modal="true" className="create-modal" role="dialog">
        <button aria-label="Close dialog" className="icon-button modal-close" onClick={onClose}><X size={18} /></button>
        <span className="modal-symbol"><FilePlus2 size={21} /></span>
        {submitted ? (
          <><span className="modal-kicker">WORKSPACE READY</span><h2 id="create-title">A good place to start.</h2><p>Proposal submission isn’t connected yet. It’ll be available once the proposals API is implemented.</p><button className="button button-primary modal-submit" onClick={onClose}>Got it <Check size={15} /></button></>
        ) : (
          <><span className="modal-kicker">NEW ACQUISITION</span><h2 id="create-title">Start a proposal.</h2><p>Bring a new project into the shared view. Details can be completed as your team moves through review.</p>
            <label className="modal-label">Project name<input placeholder="e.g. NH-130 widening, Phase 2" /></label>
            <div className="modal-form-row"><label className="modal-label">District<select defaultValue=""><option disabled value="">Choose district</option><option>Raipur</option><option>Surguja</option><option>Korba</option><option>Dhamtari</option></select></label><label className="modal-label">Project type<select defaultValue=""><option disabled value="">Choose type</option><option>Highway</option><option>Railway</option><option>Irrigation</option><option>Other public infrastructure</option></select></label></div>
            <label className="modal-label">Estimated area <div className="input-with-unit"><input min="0" placeholder="0.00" type="number" /><span>hectares</span></div></label>
            <div className="modal-note"><Sparkles size={14} /><span>Securely saved to your state workspace once submission is connected.</span></div>
            <button className="button button-primary modal-submit" onClick={() => setSubmitted(true)}>Continue <ArrowRight size={15} /></button>
          </>
        )}
      </section>
    </div>
  );
}
