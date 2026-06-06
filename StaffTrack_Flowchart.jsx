import { useState } from "react";

const flows = {
  W1: {
    id: "W1",
    title: "Morning Arrival",
    icon: "☀️",
    color: "#22C55E",
    bg: "#052e16",
    steps: [
      { id: 1, type: "actor", actor: "staff", label: "Staff opens kiosk laptop", icon: "💻" },
      { id: 2, type: "action", actor: "staff", label: "Finds their name card\n(Status: Absent ⚫)", icon: "👤" },
      { id: 3, type: "action", actor: "staff", label: "Taps [Mark Arrived]", icon: "👆" },
      { id: 4, type: "system", actor: "system", label: "Camera opens\nCountdown 3–2–1", icon: "📷" },
      { id: 5, type: "system", actor: "system", label: "face-api.js scans face\nExtracts descriptor", icon: "🤖" },
      { id: 6, type: "decision", label: "Face Match?", icon: "🔍",
        yes: [
          { id: "6y1", type: "system", actor: "system", label: "Write: morning_arrival = NOW()", icon: "💾" },
          { id: "6y2", type: "system", actor: "system", label: "Status → 🟢 Present", icon: "✅" },
          { id: "6y3", type: "notify", actor: "system", label: "WhatsApp to Admin:\n✅ Ravi arrived at 09:02 AM", icon: "📱" },
          { id: "6y4", type: "ui", actor: "kiosk", label: "Show: ✅ Welcome Ravi!\nAuto-dismiss in 4s", icon: "🎉" },
          { id: "6y5", type: "notify", actor: "admin", label: "Admin sees toast:\nRavi arrived 09:02 AM", icon: "🔔" },
        ],
        no: [
          { id: "6n1", type: "system", actor: "system", label: "Capture photo snapshot", icon: "📸" },
          { id: "6n2", type: "system", actor: "system", label: "Upload photo to Storage", icon: "☁️" },
          { id: "6n3", type: "notify", actor: "system", label: "WhatsApp to Admin:\n⚠️ FAILED for Ravi + photo link", icon: "📱" },
          { id: "6n4", type: "ui", actor: "kiosk", label: "Show: ❌ Face not recognized\nAdmin notified", icon: "❌" },
        ]
      },
    ]
  },
  W2: {
    id: "W2",
    title: "Lunch Departure",
    icon: "🍱",
    color: "#F59E0B",
    bg: "#1c1100",
    steps: [
      { id: 1, type: "actor", actor: "staff", label: "Taps [Going for Lunch]", icon: "👆" },
      { id: 2, type: "system", actor: "system", label: "Camera → face scan", icon: "📷" },
      { id: 3, type: "decision", label: "Face Match?", icon: "🔍",
        yes: [
          { id: "3y1", type: "system", label: "Write: lunch_departure = NOW()", icon: "💾" },
          { id: "3y2", type: "system", label: "Status → 🟡 On Lunch", icon: "🟡" },
          { id: "3y3", type: "notify", label: "WhatsApp: 🍱 Ravi left for lunch 1:05 PM", icon: "📱" },
          { id: "3y4", type: "ui", label: "Show: 🍱 Enjoy lunch, Ravi!", icon: "🎉" },
        ],
        no: [
          { id: "3n1", type: "system", label: "Capture + upload photo", icon: "📸" },
          { id: "3n2", type: "notify", label: "WhatsApp: ⚠️ Verification FAILED for Ravi", icon: "📱" },
          { id: "3n3", type: "ui", label: "Show: ❌ Face not recognized", icon: "❌" },
        ]
      },
    ]
  },
  W3: {
    id: "W3",
    title: "Lunch Return",
    icon: "🔙",
    color: "#3B82F6",
    bg: "#0c1a35",
    steps: [
      { id: 1, type: "actor", actor: "staff", label: "Taps [Back from Lunch]", icon: "👆" },
      { id: 2, type: "system", actor: "system", label: "Camera → face scan", icon: "📷" },
      { id: 3, type: "decision", label: "Face Match?", icon: "🔍",
        yes: [
          { id: "3y1", type: "system", label: "Write: lunch_return = NOW()", icon: "💾" },
          { id: "3y2", type: "system", label: "Calculate lunch duration", icon: "⏱️" },
          { id: "3y3", type: "system", label: "Status → 🟢 Present", icon: "✅" },
          { id: "3y4", type: "notify", label: "WhatsApp: 🔙 Ravi back at 2:10 PM", icon: "📱" },
          { id: "3y5", type: "ui", label: "Show: 🔙 Welcome back, Ravi!", icon: "🎉" },
        ],
        no: [
          { id: "3n1", type: "system", label: "Capture + upload photo", icon: "📸" },
          { id: "3n2", type: "notify", label: "WhatsApp: ⚠️ FAILED for Ravi + photo", icon: "📱" },
          { id: "3n3", type: "ui", label: "Show: ❌ Face not recognized", icon: "❌" },
        ]
      },
    ]
  },
  W4: {
    id: "W4",
    title: "Evening Departure",
    icon: "🏠",
    color: "#94A3B8",
    bg: "#0f172a",
    steps: [
      { id: 1, type: "actor", actor: "staff", label: "Taps [Mark Departed]", icon: "👆" },
      { id: 2, type: "system", actor: "system", label: "Camera → face scan", icon: "📷" },
      { id: 3, type: "decision", label: "Face Match?", icon: "🔍",
        yes: [
          { id: "3y1", type: "system", label: "Write: evening_departure = NOW()", icon: "💾" },
          { id: "3y2", type: "system", label: "Calculate total hours\n(morning + afternoon)", icon: "🧮" },
          { id: "3y3", type: "system", label: "Status → ⬛ Departed", icon: "⬛" },
          { id: "3y4", type: "notify", label: "WhatsApp: 🏠 Ravi left at 6:30 PM | 7.5 hrs", icon: "📱" },
          { id: "3y5", type: "ui", label: "Show: 🏠 Goodbye Ravi!\nTotal: 7.5 hrs today", icon: "🎉" },
        ],
        no: [
          { id: "3n1", type: "system", label: "Capture + upload photo", icon: "📸" },
          { id: "3n2", type: "notify", label: "WhatsApp: ⚠️ FAILED for Ravi + photo", icon: "📱" },
          { id: "3n3", type: "ui", label: "Show: ❌ Face not recognized", icon: "❌" },
        ]
      },
    ]
  },
  W5: {
    id: "W5",
    title: "Absence Report",
    icon: "🚨",
    color: "#EF4444",
    bg: "#1a0505",
    steps: [
      { id: 1, type: "actor", actor: "staff", label: "Taps [Report Absence]\nat bottom of kiosk", icon: "👆" },
      { id: 2, type: "ui", actor: "kiosk", label: "Simple form appears:\nWho? + Type of absence", icon: "📋" },
      { id: 3, type: "actor", actor: "staff", label: "Selects missing staff\n+ report type + note", icon: "✏️" },
      { id: 4, type: "actor", actor: "staff", label: "Taps [Send Report]", icon: "📤" },
      { id: 5, type: "system", actor: "system", label: "Saves to absence_reports\ntable in DB", icon: "💾" },
      { id: 6, type: "notify", actor: "system", label: "WhatsApp to Admin:\n🚨 Kiran hasn't arrived!\nReported by Ravi", icon: "📱" },
      { id: 7, type: "notify", actor: "admin", label: "Admin gets in-app alert\nwith details", icon: "🔔" },
      { id: 8, type: "ui", actor: "kiosk", label: "Show: ✅ Report sent to admin", icon: "✅" },
      { id: 9, type: "actor", actor: "admin", label: "Admin views report,\nmarks resolved + notes", icon: "👨‍💼" },
    ]
  },
  W6: {
    id: "W6",
    title: "Daily Auto Summary",
    icon: "📊",
    color: "#A78BFA",
    bg: "#0d0a1f",
    steps: [
      { id: 1, type: "system", actor: "system", label: "Cron job fires\nat 7:00 PM daily", icon: "⏰" },
      { id: 2, type: "system", actor: "system", label: "Query all staff:\nwho is still not departed?", icon: "🔍" },
      { id: 3, type: "system", actor: "system", label: "Auto-mark remaining staff\nas departed/absent", icon: "💾" },
      { id: 4, type: "system", actor: "system", label: "Calculate all totals:\nhours, late count, absent", icon: "🧮" },
      { id: 5, type: "notify", actor: "system", label: "Send WhatsApp summary:\n📊 Daily Report to admin", icon: "📱" },
    ]
  },
};

const actorColors = {
  staff:   { bg: "#1a2744", text: "#93C5FD", border: "#3B82F6" },
  system:  { bg: "#1a1a2e", text: "#C4B5FD", border: "#7C3AED" },
  kiosk:   { bg: "#1a1a2e", text: "#C4B5FD", border: "#7C3AED" },
  admin:   { bg: "#1c1100", text: "#FCD34D", border: "#F59E0B" },
  notify:  { bg: "#1a2010", text: "#86EFAC", border: "#22C55E" },
};

const typeStyles = {
  actor:    actorColors.staff,
  system:   actorColors.system,
  ui:       actorColors.kiosk,
  notify:   actorColors.notify,
  decision: { bg: "#1a0a1a", text: "#F9A8D4", border: "#EC4899" },
};

function Arrow({ color = "#334155" }) {
  return (
    <div className="flex flex-col items-center py-1">
      <div style={{ width: 2, height: 16, background: color }} />
      <div style={{
        width: 0, height: 0,
        borderLeft: "6px solid transparent",
        borderRight: "6px solid transparent",
        borderTop: `8px solid ${color}`
      }} />
    </div>
  );
}

function StepNode({ step, flowColor }) {
  const style = typeStyles[step.type] || typeStyles.system;
  return (
    <div style={{
      background: style.bg,
      border: `1.5px solid ${style.border}`,
      borderRadius: 10,
      padding: "10px 16px",
      minWidth: 200,
      maxWidth: 280,
      textAlign: "center",
    }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{step.icon}</div>
      <div style={{ color: style.text, fontSize: 13, lineHeight: 1.5, whiteSpace: "pre-line", fontFamily: "monospace" }}>
        {step.label}
      </div>
    </div>
  );
}

function DecisionNode({ step, flowColor }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Diamond */}
      <div style={{
        width: 120, height: 60,
        background: "#1a0a1a",
        border: `2px solid #EC4899`,
        transform: "rotate(0deg)",
        borderRadius: 8,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "monospace",
        fontSize: 13,
        color: "#F9A8D4",
        gap: 6,
        padding: "0 12px",
        textAlign: "center",
      }}>
        <span style={{ fontSize: 16 }}>{step.icon}</span>
        <span>{step.label}</span>
      </div>

      {/* Yes / No branches */}
      <div style={{ display: "flex", gap: 24, marginTop: 12, alignItems: "flex-start" }}>
        {/* YES branch */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{
            background: "#052e16", border: "1px solid #22C55E",
            borderRadius: 6, padding: "2px 12px",
            color: "#4ADE80", fontSize: 12, fontFamily: "monospace", fontWeight: "bold",
            marginBottom: 6
          }}>✅ YES — Match</div>
          {step.yes.map((s, i) => (
            <div key={s.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              {i > 0 && <Arrow color="#22C55E" />}
              <StepNode step={s} flowColor={flowColor} />
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: 1, background: "#334155", alignSelf: "stretch", margin: "0 4px" }} />

        {/* NO branch */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{
            background: "#1a0505", border: "1px solid #EF4444",
            borderRadius: 6, padding: "2px 12px",
            color: "#F87171", fontSize: 12, fontFamily: "monospace", fontWeight: "bold",
            marginBottom: 6
          }}>❌ NO — Fail</div>
          {step.no.map((s, i) => (
            <div key={s.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              {i > 0 && <Arrow color="#EF4444" />}
              <StepNode step={s} flowColor={flowColor} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FlowChart({ flow }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 12px" }}>
      {/* Title */}
      <div style={{
        background: flow.bg,
        border: `2px solid ${flow.color}`,
        borderRadius: 12,
        padding: "12px 28px",
        marginBottom: 8,
        textAlign: "center",
      }}>
        <span style={{ fontSize: 22 }}>{flow.icon}</span>
        <div style={{ color: flow.color, fontFamily: "monospace", fontWeight: "bold", fontSize: 16, marginTop: 4 }}>
          {flow.title}
        </div>
      </div>

      {flow.steps.map((step, i) => (
        <div key={step.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {i > 0 && <Arrow color={flow.color} />}
          {step.type === "decision"
            ? <DecisionNode step={step} flowColor={flow.color} />
            : <StepNode step={step} flowColor={flow.color} />
          }
        </div>
      ))}

      {/* End node */}
      <Arrow color={flow.color} />
      <div style={{
        background: flow.bg,
        border: `2px solid ${flow.color}`,
        borderRadius: 999,
        padding: "6px 24px",
        color: flow.color,
        fontFamily: "monospace",
        fontSize: 13,
      }}>● END</div>
    </div>
  );
}

const stateFlow = [
  { label: "⚫ ABSENT",          color: "#6B7280", action: "Mark Arrived + Face Scan" },
  { label: "🟢 PRESENT (AM)",    color: "#22C55E", action: "Going for Lunch + Face Scan" },
  { label: "🟡 ON LUNCH",        color: "#F59E0B", action: "Back from Lunch + Face Scan" },
  { label: "🟢 PRESENT (PM)",    color: "#22C55E", action: "Mark Departed + Face Scan" },
  { label: "⬛ DEPARTED",        color: "#94A3B8", action: null },
];

function StateFlowDiagram() {
  return (
    <div style={{ padding: "24px 16px" }}>
      <div style={{
        textAlign: "center", color: "#94A3B8", fontFamily: "monospace",
        fontSize: 13, marginBottom: 20
      }}>
        Daily state progression for each staff member
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
        {stateFlow.map((s, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{
              border: `2px solid ${s.color}`,
              borderRadius: 10,
              padding: "12px 32px",
              background: "#0f172a",
              color: s.color,
              fontFamily: "monospace",
              fontWeight: "bold",
              fontSize: 15,
              minWidth: 200,
              textAlign: "center",
            }}>
              {s.label}
            </div>
            {s.action && (
              <>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 4 }}>
                  <div style={{ width: 2, height: 12, background: "#475569" }} />
                  <div style={{
                    background: "#1e293b", border: "1px solid #475569",
                    borderRadius: 6, padding: "4px 14px",
                    color: "#94A3B8", fontSize: 11, fontFamily: "monospace",
                    textAlign: "center",
                  }}>
                    {s.action}
                  </div>
                  <div style={{ width: 2, height: 12, background: "#475569" }} />
                  <div style={{
                    width: 0, height: 0,
                    borderLeft: "6px solid transparent",
                    borderRight: "6px solid transparent",
                    borderTop: "8px solid #475569",
                    marginBottom: 4,
                  }} />
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const legend = [
  { type: "actor",    label: "Staff Action", color: "#3B82F6" },
  { type: "system",   label: "System Process", color: "#7C3AED" },
  { type: "notify",   label: "Notification Sent", color: "#22C55E" },
  { type: "decision", label: "Decision Point", color: "#EC4899" },
  { type: "ui",       label: "UI Screen", color: "#7C3AED" },
];

export default function App() {
  const [activeFlow, setActiveFlow] = useState("state");

  const tabs = [
    { id: "state", label: "📋 State Flow" },
    ...Object.values(flows).map(f => ({ id: f.id, label: `${f.icon} ${f.title}` }))
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080c14",
      color: "#E2E8F0",
      fontFamily: "system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background: "#0f172a",
        borderBottom: "1px solid #1e293b",
        padding: "16px 20px",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 22 }}>🏪</span>
            <span style={{ fontFamily: "monospace", fontWeight: "bold", fontSize: 18, color: "#F1F5F9" }}>
              StaffTrack
            </span>
            <span style={{
              background: "#1e293b", border: "1px solid #334155",
              borderRadius: 999, padding: "2px 10px",
              color: "#64748B", fontSize: 11, fontFamily: "monospace",
            }}>
              Workflow Flowchart
            </span>
          </div>

          {/* Tabs — scrollable */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFlow(tab.id)}
                style={{
                  background: activeFlow === tab.id ? "#1e3a5f" : "#1e293b",
                  border: activeFlow === tab.id ? "1.5px solid #3B82F6" : "1.5px solid #334155",
                  borderRadius: 8,
                  padding: "6px 14px",
                  color: activeFlow === tab.id ? "#93C5FD" : "#64748B",
                  fontFamily: "monospace",
                  fontSize: 12,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 12px 40px" }}>

        {/* Legend */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 8,
          padding: "14px 0",
          borderBottom: "1px solid #1e293b",
          marginBottom: 8,
        }}>
          {legend.map(l => (
            <div key={l.type} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
              <span style={{ color: "#64748B", fontSize: 11, fontFamily: "monospace" }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* Flow content */}
        <div style={{ overflowX: "auto" }}>
          {activeFlow === "state"
            ? <StateFlowDiagram />
            : <FlowChart flow={flows[activeFlow]} />
          }
        </div>
      </div>
    </div>
  );
}
