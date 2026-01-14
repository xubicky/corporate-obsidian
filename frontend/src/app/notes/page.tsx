"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { FileText, Search, Loader2 } from "lucide-react";

interface NoteSummary {
    id: number;
    title: string;
    updated_at: string;
    visibility: string;
}

import { useNotes } from "@/context/NotesContext";

export default function AllNotesPage() {
    const [notes, setNotes] = useState<NoteSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const { selectedTag } = useNotes();

    useEffect(() => {
        // Determine the query
        // If selectedTag is present, we override the search to be #tagName

        const currentSearch = selectedTag ? `#${selectedTag}` : search;

        const fetchNotes = async () => {
            try {
                const params = currentSearch ? { search: currentSearch } : {};
                const res = await axios.get("http://localhost:8000/api/notes", { params });
                setNotes(res.data);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch notes", err);
                setLoading(false);
            }
        };

        // Debounce slightly (only if typing search, not tag click)
        if (selectedTag) {
            fetchNotes();
        } else {
            const timeout = setTimeout(fetchNotes, 300);
            return () => clearTimeout(timeout);
        }
    }, [search, selectedTag]);

    return (
        <div className="p-8 max-w-5xl mx-auto h-full flex flex-col">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-slate-900">All Notes</h1>
                    {selectedTag && (
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium border border-purple-200">
                            #{selectedTag}
                        </span>
                    )}
                </div>
                <div className="relative group w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search notes..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 bg-clip-padding flex flex-col">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-slate-400">
                        <Loader2 className="animate-spin mr-2" /> Loading...
                    </div>
                ) : (
                    <div className="overflow-auto flex-1">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 border-b border-slate-200 font-medium text-slate-500 uppercase tracking-wider sticky top-0 backdrop-blur-sm z-10">
                                <tr>
                                    <th className="px-6 py-4">Title</th>
                                    <th className="px-6 py-4 w-48">Last Updated</th>
                                    <th className="px-6 py-4 w-32">Visibility</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {notes.map(note => (
                                    <tr key={note.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                                        <td className="px-6 py-4">
                                            <Link href={`/notes/${note.id}`} className="font-semibold text-slate-800 group-hover:text-blue-600 flex items-center gap-3 transition-colors">
                                                <div className="p-1.5 bg-slate-100 rounded text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-500">
                                                    <FileText size={16} />
                                                </div>
                                                {note.title}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                            {new Date(note.updated_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border
                                        ${note.visibility === 'public' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    note.visibility === 'private' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                        'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                                {note.visibility || 'team'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {notes.length === 0 && !loading && (
                            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                                <FileText size={48} className="text-slate-200 mb-4" />
                                <p>No notes found matching "{search}"</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
