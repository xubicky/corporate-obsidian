"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
    Settings2,
    ChevronDown,
    ChevronRight,
    Search,
    RefreshCw,
    X,
    Zap,
    Eye,
    Layers,
    Move
} from "lucide-react";

// Dynamically import ForceGraph2D so it doesn't break SSR
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full text-gray-400">Loading Graph...</div>
});

interface GraphNode {
    id: number | string;
    title: string;
    group: string;
    type?: string;
    linkCount?: number;
    x?: number;
    y?: number;
}

interface GraphLink {
    source: number | string | GraphNode;
    target: number | string | GraphNode;
    type?: string;
}

interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

interface FullGraphData extends GraphData {
    tags: GraphNode[];
    tagLinks: GraphLink[];
}

interface GraphSettings {
    // Filters
    searchQuery: string;
    showOrphans: boolean;
    showTags: boolean;

    // Display
    showArrows: boolean;
    nodeSize: number;
    linkThickness: number;
    textFadeThreshold: number;
    showLabels: boolean;

    // Forces
    centerForce: number;
    repelForce: number;
    linkForce: number;
    linkDistance: number;
}

const defaultSettings: GraphSettings = {
    searchQuery: "",
    showOrphans: true,
    showTags: false,
    showArrows: true,
    nodeSize: 6,
    linkThickness: 1.5,
    textFadeThreshold: 1.5,
    showLabels: true,
    centerForce: 1,
    repelForce: -300,
    linkForce: 1,
    linkDistance: 50,
};

export default function NetworkGraph() {
    const router = useRouter();
    const graphRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [data, setData] = useState<FullGraphData>({ nodes: [], links: [], tags: [], tagLinks: [] });
    const [filteredData, setFilteredData] = useState<GraphData>({ nodes: [], links: [] });
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [settings, setSettings] = useState<GraphSettings>(defaultSettings);
    const [panelOpen, setPanelOpen] = useState(true);
    const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

    // Collapsible sections
    const [filtersOpen, setFiltersOpen] = useState(true);
    const [displayOpen, setDisplayOpen] = useState(true);
    const [forcesOpen, setForcesOpen] = useState(false);

    // 1. Fetch Graph Data
    useEffect(() => {
        const fetchGraph = async () => {
            try {
                const res = await fetch("http://localhost:8000/api/graph");
                if (!res.ok) throw new Error("Failed to load graph");
                const jsonData = await res.json();

                // Calculate link counts for each node
                const linkCounts: Record<number | string, number> = {};
                jsonData.links.forEach((link: any) => {
                    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
                    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
                    linkCounts[sourceId] = (linkCounts[sourceId] || 0) + 1;
                    linkCounts[targetId] = (linkCounts[targetId] || 0) + 1;
                });

                const nodesWithCounts = jsonData.nodes.map((n: GraphNode) => ({
                    ...n,
                    linkCount: linkCounts[n.id] || 0
                }));

                setData({
                    nodes: nodesWithCounts,
                    links: jsonData.links,
                    tags: jsonData.tags || [],
                    tagLinks: jsonData.tagLinks || []
                });
            } catch (err) {
                console.error(err);
                setData({
                    nodes: [
                        { id: 1, title: "Home", group: "public", linkCount: 2 },
                        { id: 2, title: "Engineering", group: "team", linkCount: 1 },
                        { id: 3, title: "Product", group: "team", linkCount: 1 }
                    ],
                    links: [
                        { source: 1, target: 2 },
                        { source: 1, target: 3 }
                    ],
                    tags: [],
                    tagLinks: []
                });
            }
        };
        fetchGraph();
    }, []);

    // 2. Apply Filters
    useEffect(() => {
        let nodes = [...data.nodes];
        let links = [...data.links];

        // Include tags if showTags is enabled
        if (settings.showTags && data.tags.length > 0) {
            nodes = [...nodes, ...data.tags];
            links = [...links, ...data.tagLinks];
        }

        // Search filter
        if (settings.searchQuery) {
            const query = settings.searchQuery.toLowerCase();
            nodes = nodes.filter(n => n.title.toLowerCase().includes(query));
            const nodeIds = new Set(nodes.map(n => n.id));
            links = links.filter(l => {
                const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
                const targetId = typeof l.target === 'object' ? l.target.id : l.target;
                return nodeIds.has(sourceId) && nodeIds.has(targetId);
            });
        }

        // Orphan filter
        if (!settings.showOrphans) {
            const connectedIds = new Set<number | string>();
            links.forEach(l => {
                const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
                const targetId = typeof l.target === 'object' ? l.target.id : l.target;
                connectedIds.add(sourceId);
                connectedIds.add(targetId);
            });
            nodes = nodes.filter(n => connectedIds.has(n.id));
        }

        // Recalculate link counts based on current filtered links
        const linkCounts: Record<number | string, number> = {};
        links.forEach(l => {
            const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
            const targetId = typeof l.target === 'object' ? l.target.id : l.target;
            linkCounts[sourceId] = (linkCounts[sourceId] || 0) + 1;
            linkCounts[targetId] = (linkCounts[targetId] || 0) + 1;
        });

        // Update nodes with recalculated link counts
        const nodesWithUpdatedCounts = nodes.map(n => ({
            ...n,
            linkCount: linkCounts[n.id] || 0
        }));

        // Create fresh link copies to avoid mutation issues with force graph
        const freshLinks = links.map(l => ({
            source: typeof l.source === 'object' ? l.source.id : l.source,
            target: typeof l.target === 'object' ? l.target.id : l.target,
            type: l.type
        }));

        setFilteredData({ nodes: nodesWithUpdatedCounts, links: freshLinks });
    }, [data, settings.searchQuery, settings.showOrphans, settings.showTags]);

    // 3. Responsive Sizing
    useEffect(() => {
        function handleResize() {
            if (containerRef.current) {
                const panelWidth = panelOpen ? 280 : 0;
                setDimensions({
                    width: containerRef.current.offsetWidth - panelWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        }
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, [panelOpen]);

    // 4. Apply Forces when settings change
    useEffect(() => {
        if (graphRef.current) {
            graphRef.current.d3Force('charge')?.strength(settings.repelForce);
            graphRef.current.d3Force('link')?.distance(settings.linkDistance);
            graphRef.current.d3Force('center')?.strength(settings.centerForce);
            graphRef.current.d3ReheatSimulation();
        }
    }, [settings.repelForce, settings.linkDistance, settings.centerForce]);

    // 5. Interaction Handlers
    const handleNodeClick = useCallback((node: any) => {
        if (graphRef.current) {
            graphRef.current.centerAt(node.x, node.y, 1000);
            graphRef.current.zoom(4, 1000);
        }
        router.push(`/notes/${node.id}`);
    }, [router]);

    const handleNodeHover = useCallback((node: any) => {
        setHoveredNode(node);
        if (containerRef.current) {
            containerRef.current.style.cursor = node ? 'pointer' : 'grab';
        }
    }, []);

    const resetView = () => {
        if (graphRef.current) {
            graphRef.current.zoomToFit(400, 50);
        }
    };

    const reheatSimulation = () => {
        if (graphRef.current) {
            graphRef.current.d3ReheatSimulation();
        }
    };

    // Settings Panel Toggle
    const Toggle = ({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) => (
        <div className="flex items-center justify-between py-1.5">
            <span className="text-sm text-slate-600">{label}</span>
            <button
                onClick={() => onChange(!value)}
                className={`w-10 h-5 rounded-full transition-colors relative ${value ? 'bg-blue-500' : 'bg-slate-300'}`}
            >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all shadow ${value ? 'left-5' : 'left-0.5'}`} />
            </button>
        </div>
    );

    // Slider Component - uses local state during drag for smooth interaction
    const Slider = ({ value, onChange, min, max, step, label }: {
        value: number; onChange: (v: number) => void; min: number; max: number; step: number; label: string
    }) => {
        const [localValue, setLocalValue] = React.useState(value);
        const [isDragging, setIsDragging] = React.useState(false);

        // Sync local value when parent value changes (and not dragging)
        React.useEffect(() => {
            if (!isDragging) {
                setLocalValue(value);
            }
        }, [value, isDragging]);

        const displayValue = isDragging ? localValue : value;
        const percentage = ((displayValue - min) / (max - min)) * 100;

        return (
            <div className="py-1.5">
                <div className="flex justify-between mb-1">
                    <span className="text-sm text-slate-600">{label}</span>
                    <span className="text-xs text-slate-400 font-mono">{displayValue}</span>
                </div>
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    defaultValue={value}
                    onMouseDown={() => setIsDragging(true)}
                    onTouchStart={() => setIsDragging(true)}
                    onInput={(e) => {
                        const newValue = Number((e.target as HTMLInputElement).value);
                        setLocalValue(newValue);
                    }}
                    onMouseUp={(e) => {
                        setIsDragging(false);
                        onChange(Number((e.target as HTMLInputElement).value));
                    }}
                    onTouchEnd={(e) => {
                        setIsDragging(false);
                        onChange(Number((e.target as HTMLInputElement).value));
                    }}
                    onChange={(e) => {
                        // For keyboard accessibility
                        if (!isDragging) {
                            onChange(Number(e.target.value));
                        }
                    }}
                    className="slider-input"
                    style={{
                        width: '100%',
                        height: '6px',
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #e2e8f0 ${percentage}%, #e2e8f0 100%)`,
                        borderRadius: '9999px',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        cursor: 'pointer',
                        outline: 'none',
                    }}
                />
                <style jsx>{`
                    .slider-input::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        appearance: none;
                        width: 16px;
                        height: 16px;
                        background: #3b82f6;
                        border-radius: 50%;
                        cursor: grab;
                        border: 2px solid white;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                    }
                    .slider-input::-webkit-slider-thumb:active {
                        cursor: grabbing;
                    }
                    .slider-input::-moz-range-thumb {
                        width: 16px;
                        height: 16px;
                        background: #3b82f6;
                        border-radius: 50%;
                        cursor: grab;
                        border: 2px solid white;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                    }
                    .slider-input::-moz-range-thumb:active {
                        cursor: grabbing;
                    }
                `}</style>
            </div>
        );
    };

    // Section Header
    const SectionHeader = ({ title, icon: Icon, open, onToggle }: {
        title: string; icon: any; open: boolean; onToggle: () => void
    }) => (
        <button
            onClick={onToggle}
            className="flex items-center gap-2 w-full py-2 text-left text-slate-700 hover:text-slate-900 transition-colors"
        >
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Icon size={14} />
            <span className="text-sm font-medium">{title}</span>
        </button>
    );

    return (
        <div ref={containerRef} className="w-full h-full min-h-[500px] bg-slate-50 rounded-xl overflow-hidden relative flex border border-slate-200">

            {/* Graph Canvas */}
            <div className="flex-1 relative">
                {/* Stats Badge */}
                <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-mono text-slate-600 border border-slate-200 pointer-events-none shadow-sm">
                    {filteredData.nodes.length} Nodes • {filteredData.links.length} Links
                </div>

                {/* Hovered Node Info */}
                {hoveredNode && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/95 backdrop-blur px-4 py-2 rounded-lg border border-slate-200 shadow-lg">
                        <div className="text-sm font-semibold text-slate-800">{hoveredNode.title}</div>
                        <div className="text-xs text-slate-500">{hoveredNode.linkCount || 0} connections</div>
                    </div>
                )}

                {/* Toggle Panel Button */}
                <button
                    onClick={() => setPanelOpen(!panelOpen)}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shadow-sm"
                    title="Toggle Settings"
                >
                    <Settings2 size={18} />
                </button>

                {/* Quick Actions */}
                <div className="absolute bottom-4 left-4 z-10 flex gap-2">
                    <button
                        onClick={resetView}
                        className="p-2 bg-white/90 backdrop-blur rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shadow-sm"
                        title="Fit to View"
                    >
                        <Move size={16} />
                    </button>
                    <button
                        onClick={reheatSimulation}
                        className="p-2 bg-white/90 backdrop-blur rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shadow-sm"
                        title="Animate"
                    >
                        <Zap size={16} />
                    </button>
                </div>

                <ForceGraph2D
                    key={`graph-${settings.showTags}`}
                    ref={graphRef}
                    width={dimensions.width}
                    height={dimensions.height}
                    graphData={filteredData}
                    backgroundColor="#f8fafc"
                    nodeId="id"

                    // Nodes
                    nodeLabel={settings.showLabels ? "title" : ""}
                    nodeRelSize={settings.nodeSize}
                    nodeColor={(node: any) => {
                        if (hoveredNode?.id === node.id) return "#3b82f6"; // blue highlight
                        switch (node.group) {
                            case "public": return "#22c55e";
                            case "private": return "#ef4444";
                            case "team": return "#3b82f6";
                            case "tag": return "#a855f7"; // purple for tags
                            default: return "#64748b";
                        }
                    }}
                    nodeCanvasObject={(node: any, ctx, globalScale) => {
                        const label = node.title;
                        const fontSize = 12 / globalScale;
                        const nodeRadius = settings.nodeSize;

                        // Draw node
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
                        ctx.fillStyle = hoveredNode?.id === node.id ? "#3b82f6" :
                            node.group === "public" ? "#22c55e" :
                                node.group === "private" ? "#ef4444" :
                                    node.group === "team" ? "#3b82f6" :
                                        node.group === "tag" ? "#a855f7" : "#64748b";
                        ctx.fill();

                        // Glow effect
                        if (hoveredNode?.id === node.id) {
                            ctx.shadowColor = "#3b82f6";
                            ctx.shadowBlur = 15;
                            ctx.fill();
                            ctx.shadowBlur = 0;
                        }

                        // Draw label if zoom is above threshold
                        if (globalScale >= settings.textFadeThreshold && settings.showLabels) {
                            ctx.font = `${fontSize}px Inter, sans-serif`;
                            ctx.textAlign = "center";
                            ctx.textBaseline = "middle";
                            ctx.fillStyle = "rgba(30, 41, 59, 0.9)";
                            ctx.fillText(label, node.x, node.y + nodeRadius + fontSize);
                        }
                    }}
                    nodeCanvasObjectMode={() => "replace"}

                    // Links
                    linkColor={() => "rgba(148, 163, 184, 0.4)"}
                    linkWidth={settings.linkThickness}
                    linkDirectionalArrowLength={settings.showArrows ? 4 : 0}
                    linkDirectionalArrowRelPos={1}

                    // Interaction
                    onNodeClick={handleNodeClick}
                    onNodeHover={handleNodeHover}

                    // Physics
                    cooldownTicks={100}
                    d3AlphaDecay={0.02}
                    d3VelocityDecay={0.3}
                />
            </div>

            {/* Settings Panel */}
            {panelOpen && (
                <div className="w-72 bg-white border-l border-slate-200 overflow-y-auto">
                    {/* Panel Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                        <span className="text-sm font-semibold text-slate-700">Graph Settings</span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setSettings(defaultSettings)}
                                className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                                title="Reset to defaults"
                            >
                                <RefreshCw size={14} />
                            </button>
                            <button
                                onClick={() => setPanelOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="p-4 space-y-1">
                        {/* FILTERS SECTION */}
                        <SectionHeader title="Filters" icon={Search} open={filtersOpen} onToggle={() => setFiltersOpen(!filtersOpen)} />
                        {filtersOpen && (
                            <div className="pl-6 pb-3 space-y-2">
                                {/* Search */}
                                <div className="relative">
                                    <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="text"
                                        placeholder="Search files..."
                                        value={settings.searchQuery}
                                        onChange={(e) => setSettings(s => ({ ...s, searchQuery: e.target.value }))}
                                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <Toggle
                                    label="Orphans"
                                    value={settings.showOrphans}
                                    onChange={(v) => setSettings(s => ({ ...s, showOrphans: v }))}
                                />
                                <Toggle
                                    label="Tags"
                                    value={settings.showTags}
                                    onChange={(v) => setSettings(s => ({ ...s, showTags: v }))}
                                />
                            </div>
                        )}

                        {/* DISPLAY SECTION */}
                        <SectionHeader title="Display" icon={Eye} open={displayOpen} onToggle={() => setDisplayOpen(!displayOpen)} />
                        {displayOpen && (
                            <div className="pl-6 pb-3 space-y-2">
                                <Toggle
                                    label="Arrows"
                                    value={settings.showArrows}
                                    onChange={(v) => setSettings(s => ({ ...s, showArrows: v }))}
                                />
                                <Toggle
                                    label="Labels"
                                    value={settings.showLabels}
                                    onChange={(v) => setSettings(s => ({ ...s, showLabels: v }))}
                                />
                                <Slider
                                    label="Text fade threshold"
                                    value={settings.textFadeThreshold}
                                    onChange={(v) => setSettings(s => ({ ...s, textFadeThreshold: v }))}
                                    min={0.5} max={5} step={0.1}
                                />
                                <Slider
                                    label="Node size"
                                    value={settings.nodeSize}
                                    onChange={(v) => setSettings(s => ({ ...s, nodeSize: v }))}
                                    min={2} max={20} step={1}
                                />
                                <Slider
                                    label="Link thickness"
                                    value={settings.linkThickness}
                                    onChange={(v) => setSettings(s => ({ ...s, linkThickness: v }))}
                                    min={0.5} max={5} step={0.5}
                                />

                                {/* Animate Button */}
                                <button
                                    onClick={reheatSimulation}
                                    className="w-full mt-2 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <Zap size={14} />
                                    Animate
                                </button>
                            </div>
                        )}

                        {/* FORCES SECTION */}
                        <SectionHeader title="Forces" icon={Layers} open={forcesOpen} onToggle={() => setForcesOpen(!forcesOpen)} />
                        {forcesOpen && (
                            <div className="pl-6 pb-3 space-y-2">
                                <Slider
                                    label="Center force"
                                    value={settings.centerForce}
                                    onChange={(v) => setSettings(s => ({ ...s, centerForce: v }))}
                                    min={0} max={2} step={0.1}
                                />
                                <Slider
                                    label="Repel force"
                                    value={settings.repelForce}
                                    onChange={(v) => setSettings(s => ({ ...s, repelForce: v }))}
                                    min={-1000} max={0} step={10}
                                />
                                <Slider
                                    label="Link distance"
                                    value={settings.linkDistance}
                                    onChange={(v) => setSettings(s => ({ ...s, linkDistance: v }))}
                                    min={10} max={200} step={5}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
