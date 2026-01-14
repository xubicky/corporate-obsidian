"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

// Dynamically import ForceGraph2D so it doesn't break SSR
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full text-gray-400 text-xs">Loading...</div>
});

interface GraphNode {
    id: number;
    title: string;
    group: string;
    x?: number;
    y?: number;
}

interface GraphLink {
    source: number | GraphNode;
    target: number | GraphNode;
}

interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

export default function LocalGraph() {
    const router = useRouter();
    const graphRef = useRef<any>(null);
    const [data, setData] = useState<GraphData>({ nodes: [], links: [] });
    const [dimensions, setDimensions] = useState({ width: 300, height: 200 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Fetch Graph Data
    useEffect(() => {
        const fetchGraph = async () => {
            try {
                const res = await fetch("http://localhost:8000/api/graph");
                if (!res.ok) throw new Error("Failed to load graph");
                const jsonData = await res.json();
                setData(jsonData);
            } catch (err) {
                console.error(err);
                setData({
                    nodes: [
                        { id: 1, title: "Home", group: "public" },
                        { id: 2, title: "Note 2", group: "team" },
                    ],
                    links: [{ source: 1, target: 2 }]
                });
            }
        };
        fetchGraph();
    }, []);

    // Responsive Sizing
    useEffect(() => {
        function handleResize() {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        }
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Interaction Handler
    const handleNodeClick = useCallback((node: any) => {
        router.push(`/notes/${node.id}`);
    }, [router]);

    return (
        <div ref={containerRef} className="w-full h-full min-h-[150px] bg-slate-100 overflow-hidden relative">
            <div className="absolute top-2 right-2 z-10 bg-white/80 backdrop-blur px-2 py-0.5 rounded text-[10px] font-mono text-slate-500 border border-slate-200">
                {data.nodes.length} Nodes • {data.links.length} Links
            </div>

            <ForceGraph2D
                ref={graphRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={data}
                backgroundColor="#f1f5f9"
                nodeLabel="title"
                nodeRelSize={5}
                nodeColor={(node: any) => {
                    switch (node.group) {
                        case "public": return "#22c55e";
                        case "private": return "#ef4444";
                        case "team": return "#3b82f6";
                        default: return "#64748b";
                    }
                }}
                linkColor={() => "#cbd5e1"}
                linkWidth={1}
                linkDirectionalArrowLength={3}
                linkDirectionalArrowRelPos={1}
                onNodeClick={handleNodeClick}
                cooldownTicks={50}
                d3AlphaDecay={0.05}
            />
        </div>
    );
}
