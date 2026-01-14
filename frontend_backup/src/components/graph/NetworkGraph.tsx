"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

// Dynamically import ForceGraph2D so it doesn't break SSR (Server Side Rendering)
// react-force-graph-2d relies on window/canvas which isn't available on server.
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full text-gray-400">Loading Graph...</div>
});

interface GraphNode {
    id: number;
    title: string;
    group: string;
    // react-force-graph adds x, y, vx, vy automatically
    x?: number;
    y?: number;
}

interface GraphLink {
    source: number | GraphNode; // initially number, then object after graph parses
    target: number | GraphNode;
}

interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

export default function NetworkGraph() {
    const router = useRouter();
    const graphRef = useRef<any>();
    const [data, setData] = useState<GraphData>({ nodes: [], links: [] });
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const containerRef = useRef<HTMLDivElement>(null);

    // 1. Fetch Graph Data
    useEffect(() => {
        const fetchGraph = async () => {
            try {
                const res = await fetch("http://localhost:8000/api/graph");
                if (!res.ok) throw new Error("Failed to load graph");
                const jsonData = await res.json();
                setData(jsonData);
            } catch (err) {
                console.error(err);
                // Fallback data for demo if API fails
                setData({
                    nodes: [
                        { id: 1, title: "Home", group: "public" },
                        { id: 2, title: "Engineering", group: "team" },
                        { id: 3, title: "Product", group: "team" }
                    ],
                    links: [
                        { source: 1, target: 2 },
                        { source: 1, target: 3 }
                    ]
                });
            }
        };

        fetchGraph();
    }, []);

    // 2. Responsive Sizing
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
        // Call once to set initial
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 3. Interaction Handler
    const handleNodeClick = useCallback((node: GraphNode) => {
        // Center the graph on the new node (optional visual flair)
        if (graphRef.current) {
            graphRef.current.centerAt(node.x, node.y, 1000);
            graphRef.current.zoom(8, 2000);
        }

        // Navigate to the note page
        // Using simple ID based routing, or could be slug if provided
        router.push(`/notes/${node.id}`);
    }, [router]);

    return (
        <div ref={containerRef} className="w-full h-full min-h-[500px] bg-slate-50 rounded-xl overflow-hidden shadow-inner border border-slate-200 relative">
            <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur px-3 py-1 rounded text-xs font-mono text-slate-500 border border-slate-200 pointer-events-none">
                {data.nodes.length} Nodes • {data.links.length} Links
            </div>

            <ForceGraph2D
                ref={graphRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={data}

                // Visual Config
                backgroundColor="#f8fafc" // slate-50 matches container
                nodeLabel="title"
                nodeRelSize={6} // Node radius

                // Coloring by group
                nodeColor={(node: any) => {
                    switch (node.group) {
                        case "public": return "#22c55e"; // green
                        case "private": return "#ef4444"; // red
                        case "team": return "#3b82f6"; // blue
                        default: return "#64748b"; // slate
                    }
                }}

                // Link styling
                linkColor={() => "#cbd5e1"} // slate-300
                linkWidth={1.5}
                linkDirectionalArrowLength={3.5}
                linkDirectionalArrowRelPos={1}

                // Interaction
                onNodeClick={handleNodeClick}

            // Bloom / Glow effect (simulated via canvas context if needed, but defaults are fine)
            // cooldownTicks={100}
            />
        </div>
    );
}
