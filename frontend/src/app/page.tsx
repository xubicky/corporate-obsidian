"use client";

import React, { useEffect, useState } from "react";
import NetworkGraph from "@/components/graph/NetworkGraph";
import { Clock, Star, TrendingUp, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import axios from "axios";

interface NoteSummary {
  id: number;
  title: string;
  updated_at: string;
}

export default function Dashboard() {
  const [recentNotes, setRecentNotes] = useState<NoteSummary[]>([]);
  const [favoriteNotes, setFavoriteNotes] = useState<NoteSummary[]>([]);
  const [stats, setStats] = useState({ count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recentRes, favRes] = await Promise.all([
          axios.get("http://localhost:8000/api/notes?limit=5"),
          axios.get("http://localhost:8000/api/notes?is_favorite=true")
        ]);

        setRecentNotes(recentRes.data);
        setFavoriteNotes(favRes.data);
        setStats({ count: recentRes.data.length });
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-8 h-full flex flex-col gap-6 w-full max-w-[1600px] mx-auto">

      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Knowledge Base</h1>
          <p className="text-slate-500 mt-2">
            Welcome back.
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">

        {/* Left Column: The Graph */}
        <div className="lg:col-span-2 flex flex-col gap-4 min-h-[500px]">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white z-10">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp size={16} /> Global Connections
              </h2>
              <Link href="/graph" className="text-xs text-blue-600 hover:underline">Expand View</Link>
            </div>

            <div className="flex-1 relative bg-slate-50">
              <NetworkGraph />
            </div>
          </div>
        </div>

        {/* Right Column: Recent Activity */}
        <div className="flex flex-col gap-6">

          {/* Recent Notes */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
              <Clock size={20} className="text-blue-500" /> Recent Updates
            </h2>

            {loading ? (
              <div className="flex justify-center py-8 text-slate-400">
                <Loader2 className="animate-spin" />
              </div>
            ) : recentNotes.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No recent activity.
                <br />
                <Link href="/notes/new" className="text-blue-500 hover:underline mt-2 inline-block">Create a note</Link>
              </div>
            ) : (
              <ul className="space-y-4">
                {recentNotes.map((note) => (
                  <li key={note.id} className="group cursor-pointer">
                    <Link href={`/notes/${note.id}`} className="block">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-slate-700 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {note.title}
                        </span>
                        <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                          {new Date(note.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 line-clamp-1">
                        Click to view full content and connections...
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link href="/notes" className="flex items-center justify-center w-full py-2 text-sm text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors gap-2">
                View All Activity <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Favorites */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-1 min-h-[200px]">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Star size={20} className="text-yellow-500" /> Favorites
            </h2>
            {loading ? (
              <div className="flex justify-center py-8 text-slate-400">
                <Loader2 className="animate-spin" />
              </div>
            ) : favoriteNotes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm italic pb-10">
                <span>No favorites pinned yet.</span>
              </div>
            ) : (
              <ul className="space-y-3">
                {favoriteNotes.map(note => (
                  <li key={note.id}>
                    <Link href={`/notes/${note.id}`} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                      <div className="p-1.5 bg-yellow-50 text-yellow-500 rounded">
                        <Star size={14} fill="currentColor" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">
                        {note.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
