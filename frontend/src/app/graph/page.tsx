"use client";

import React from "react";
import NetworkGraph from "@/components/graph/NetworkGraph";

export default function GraphPage() {
    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="px-8 py-4 border-b border-slate-200 bg-white flex justify-between items-center z-10 shadow-sm">
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">Global Knowledge Graph</h1>
                <div className="text-sm text-slate-500">
                    Interactive Visualization
                </div>
            </div>
            <div className="flex-1 relative cursor-grab active:cursor-grabbing p-4">
                <NetworkGraph />
            </div>
        </div>
    );
}
