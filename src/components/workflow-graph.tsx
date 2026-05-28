"use client";

import { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeProps,
  Handle,
  Position,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import type { OsceSpec } from "@/lib/schemas/osce";

// ─── Types ────────────────────────────────────────────────────────────────────

type EmotionalTone = "neutral" | "anxious" | "distressed" | "reassured" | "evasive" | "pain";

type StateNodeData = {
  label: string;
  tone: EmotionalTone;
  isStart: boolean;
  isActive: boolean;
  isVisited: boolean;
};

// ─── Colours ─────────────────────────────────────────────────────────────────

const TONE: Record<EmotionalTone, { bg: string; border: string; text: string; badge: string }> = {
  neutral:    { bg: "#ffffff", border: "#d4d4d8", text: "#18181b", badge: "#71717a" },
  anxious:    { bg: "#fefce8", border: "#ca8a04", text: "#713f12", badge: "#eab308" },
  distressed: { bg: "#fff1f2", border: "#e11d48", text: "#881337", badge: "#f43f5e" },
  reassured:  { bg: "#f0fdf4", border: "#16a34a", text: "#14532d", badge: "#22c55e" },
  evasive:    { bg: "#faf5ff", border: "#9333ea", text: "#3b0764", badge: "#a855f7" },
  pain:       { bg: "#fff7ed", border: "#ea580c", text: "#7c2d12", badge: "#f97316" },
};

// ─── Custom node ──────────────────────────────────────────────────────────────

function StateNode({ data }: NodeProps) {
  const d = data as StateNodeData;
  const c = TONE[d.tone];
  const isActive = d.isActive;
  const isVisited = d.isVisited && !isActive;

  return (
    <div
      style={{
        background: isActive ? c.bg : isVisited ? "#f8fafc" : "#ffffff",
        border: `2px solid ${isActive ? c.border : isVisited ? "#94a3b8" : "#e2e8f0"}`,
        boxShadow: isActive
          ? `0 0 0 3px ${c.border}33, 0 4px 12px ${c.border}22`
          : isVisited
          ? "0 1px 3px rgba(0,0,0,0.06)"
          : "0 1px 3px rgba(0,0,0,0.04)",
        borderRadius: 10,
        padding: "10px 14px",
        minWidth: 160,
        transition: "all 0.3s ease",
        opacity: 1,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: "#94a3b8", width: 8, height: 8 }} />

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        {/* Tone dot */}
        <span style={{
          width: 8, height: 8, borderRadius: "50%",
          background: c.badge, flexShrink: 0,
          boxShadow: isActive ? `0 0 6px ${c.badge}` : "none",
        }} />
        <span style={{
          fontSize: 12, fontWeight: 600,
          color: isActive ? c.text : isVisited ? "#64748b" : "#374151",
          lineHeight: 1.3,
        }}>
          {d.label}
        </span>
        {isVisited && !isActive && (
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#22c55e", fontWeight: 700 }}>✓</span>
        )}
        {isActive && (
          <span style={{
            marginLeft: "auto", fontSize: 9, fontWeight: 700,
            color: c.border, letterSpacing: "0.05em",
            display: "flex", alignItems: "center", gap: 3,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: c.border,
              animation: "pulse-dot 1.5s ease-in-out infinite",
            }} />
            NOW
          </span>
        )}
      </div>

      {/* Tone label */}
      <div style={{ fontSize: 10, color: c.badge, fontWeight: 500 }}>{d.tone}</div>

      {/* START badge */}
      {d.isStart && (
        <div style={{
          marginTop: 6,
          display: "inline-block",
          background: "#1e293b",
          color: "#fff",
          fontSize: 9,
          fontWeight: 700,
          padding: "1px 6px",
          borderRadius: 4,
          letterSpacing: "0.08em",
        }}>
          START
        </div>
      )}

      <Handle type="source" position={Position.Right} style={{ background: "#94a3b8", width: 8, height: 8 }} />
    </div>
  );
}

const nodeTypes = { stateNode: StateNode };

// ─── Layout ───────────────────────────────────────────────────────────────────

const NODE_W = 180;
const NODE_H = 72;

function buildLayout(spec: OsceSpec, activeStateId: string | null, visitedSet: Set<string>) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", nodesep: 50, ranksep: 90, marginx: 40, marginy: 40 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const s of spec.states) {
    g.setNode(s.id, { width: NODE_W, height: NODE_H });
  }
  for (const t of spec.transitions) {
    g.setEdge(t.from, t.to, { label: t.trigger });
  }
  dagre.layout(g);

  const nodes: Node[] = spec.states.map((s) => {
    const n = g.node(s.id);
    return {
      id: s.id,
      type: "stateNode",
      position: { x: n.x - NODE_W / 2, y: n.y - NODE_H / 2 },
      data: {
        label: s.label,
        tone: s.emotional_tone,
        isStart: !!s.is_start,
        isActive: s.id === activeStateId,
        isVisited: visitedSet.has(s.id),
      } satisfies StateNodeData,
    };
  });

  const edges: Edge[] = spec.transitions.map((t, i) => ({
    id: `e-${i}`,
    source: t.from,
    target: t.to,
    label: t.trigger,
    type: "smoothstep",
    animated: t.from === activeStateId,
    style: {
      stroke: t.from === activeStateId ? "#3b82f6" : visitedSet.has(t.from) ? "#94a3b8" : "#cbd5e1",
      strokeWidth: t.from === activeStateId ? 2 : 1.5,
    },
    labelStyle: {
      fontSize: 10,
      fill: t.from === activeStateId ? "#1d4ed8" : "#64748b",
      fontWeight: t.from === activeStateId ? 600 : 400,
    },
    labelBgStyle: {
      fill: "white",
      stroke: t.from === activeStateId ? "#bfdbfe" : "#e2e8f0",
      strokeWidth: 1,
    },
    labelBgPadding: [4, 6] as [number, number],
    labelBgBorderRadius: 4,
  }));

  return { nodes, edges };
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  spec: OsceSpec;
  activeStateId?: string | null;
  visitedStateIds?: string[];
  className?: string;
}

export function WorkflowGraph({ spec, activeStateId = null, visitedStateIds = [], className = "" }: Props) {
  const visitedSet = useMemo(() => new Set(visitedStateIds), [visitedStateIds]);

  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => buildLayout(spec, activeStateId, visitedSet),
    [spec, activeStateId, visitedSet]
  );

  const [nodes, , onNodesChange] = useNodesState(layoutNodes);
  const [edges, , onEdgesChange] = useEdgesState(layoutEdges);

  // Sync external prop changes into flow state
  const updatedNodes = useMemo(() => nodes.map((n) => {
    const match = layoutNodes.find((ln) => ln.id === n.id);
    if (!match) return n;
    return { ...n, data: match.data };
  }), [nodes, layoutNodes]);

  const updatedEdges = useMemo(() => layoutEdges, [layoutEdges]);

  const onInit = useCallback(() => {}, []);

  return (
    <>
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.4); }
        }
      `}</style>
      <div className={`rounded-lg border overflow-hidden ${className}`} style={{ background: "#fafafa" }}>
        <ReactFlow
          nodes={updatedNodes}
          edges={updatedEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onInit={onInit}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          proOptions={{ hideAttribution: true }}
          minZoom={0.3}
          maxZoom={2}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e2e8f0" />
          <Controls showInteractive={false} style={{ bottom: 8, left: 8 }} />
          <MiniMap
            nodeColor={(n) => {
              const d = n.data as StateNodeData;
              return d.isActive ? TONE[d.tone].badge : d.isVisited ? "#94a3b8" : "#e2e8f0";
            }}
            style={{ bottom: 8, right: 8, borderRadius: 8, border: "1px solid #e2e8f0" }}
            maskColor="rgba(255,255,255,0.7)"
          />
        </ReactFlow>
      </div>
    </>
  );
}
