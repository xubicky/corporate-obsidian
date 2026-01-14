"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { MarkdownEditor } from "@/components/editor/Editor";
import { Save, Link as LinkIcon, AlertCircle, Clock, Star, Users, Lock, Globe, MoreHorizontal, FileText, ArrowLeft, ArrowRight, X, Trash2 } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import LocalGraph from "@/components/graph/LocalGraph";
import { useRouter } from "next/navigation";
import { useNotes } from "@/context/NotesContext";

interface Note {
    id: number;
    title: string;
    content: string;
    updated_at: string;
    is_favorite: boolean;
    visibility: string;
}

interface Backlink {
    source_id: number;
    source_title: string;
    snippet: string;
}

export default function NotePage() {
    const params = useParams();
    const noteId = params.id;
    const router = useRouter();
    const { refreshNotes } = useNotes();

    const [note, setNote] = useState<Note | null>(null);
    const [backlinks, setBacklinks] = useState<Backlink[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [rightPanelOpen, setRightPanelOpen] = useState(true);
    const [error, setError] = useState("");

    // FETCH DATA
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [noteRes, linksRes] = await Promise.all([
                    axios.get(`http://localhost:8000/api/notes/${noteId}`),
                    axios.get(`http://localhost:8000/api/notes/${noteId}/backlinks`)
                ]);

                setNote(noteRes.data);
                setBacklinks(linksRes.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError("Failed to load note data");
                setLoading(false);
            }
        };

        if (noteId) fetchData();
    }, [noteId]);

    // DELETE HANDLER
    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this note?")) return;
        try {
            await axios.delete(`http://localhost:8000/api/notes/${noteId}`);
            await refreshNotes(); // Refresh sidebar list
            router.push("/notes"); // Redirect to list
        } catch (err) {
            console.error(err);
            setError("Failed to delete note");
        }
    };

    // SAVE HANDLER
    const handleSave = async () => {
        if (!note) return;
        setSaving(true);
        try {
            await axios.put(`http://localhost:8000/api/notes/${noteId}`, {
                content: note.content,
                visibility: note.visibility
            });
            const linksRes = await axios.get(`http://localhost:8000/api/notes/${noteId}/backlinks`);
            setBacklinks(linksRes.data);
            setNote(prev => prev ? { ...prev, updated_at: new Date().toISOString() } : null);
            setSaving(false);
        } catch (err) {
            console.error(err);
            setError("Failed to save changes");
            setSaving(false);
        }
    };

    const toggleFavorite = async () => {
        if (!note) return;
        setNote(prev => prev ? { ...prev, is_favorite: !prev.is_favorite } : null);
        try {
            await axios.put(`http://localhost:8000/api/notes/${noteId}`, { is_favorite: !note.is_favorite });
        } catch (error) {
            setNote(prev => prev ? { ...prev, is_favorite: !prev.is_favorite } : null);
        }
    };

    const handleEditorChange = useCallback((newContent: string) => {
        setNote(prev => prev ? { ...prev, content: newContent } : null);
    }, []);

    // State for History
    const [historyOpen, setHistoryOpen] = useState(false);
    const [revisions, setRevisions] = useState<any[]>([]);

    const fetchRevisions = async () => {
        try {
            const res = await axios.get(`http://localhost:8000/api/notes/${noteId}/revisions`);
            setRevisions(res.data);
            setHistoryOpen(true);
        } catch (err) {
            console.error("Failed to load revisions");
        }
    };

    const handleRestore = async (contentSnapshot: string) => {
        if (!confirm("Restore this version? current unsaved changes will be lost.")) return;
        setNote(prev => prev ? { ...prev, content: contentSnapshot } : null);
        // We do a save immediately to persist the restore
        try {
            setSaving(true);
            await axios.put(`http://localhost:8000/api/notes/${noteId}`, {
                content: contentSnapshot,
                visibility: note?.visibility
            });
            setSaving(false);
            setHistoryOpen(false); // Close history
        } catch (err) {
            setSaving(false);
            alert("Failed to restore.");
        }
    };

    if (loading) return <div className="flex items-center justify-center h-full text-slate-400">Loading...</div>;
    if (!note) return <div className="p-8 text-red-500">Note not found.</div>;

    const VisibilityIcon = { public: Globe, team: Users, private: Lock }[note.visibility] || Users;

    return (
        <div className="flex h-full bg-white relative">

            {/* 1. Main Content Area (Center) */}
            <div className={`flex-1 flex flex-col min-w-0 transition-all ${rightPanelOpen || historyOpen ? 'mr-0' : ''}`}>

                {/* Tab Bar / Header (Obsidian Style) */}
                <div className="h-10 border-b border-slate-200 flex items-center justify-between px-4 bg-slate-50 select-none">
                    <div className="flex items-center gap-2">
                        {/* Fake Tabs */}
                        <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 border-b-white rounded-t-lg text-sm font-medium text-slate-700 translate-y-[5px] relative z-10 shadow-sm group">
                            <FileText size={14} className="text-blue-500" />
                            <span className="truncate max-w-[150px]">{note.title}</span>
                            <Link href="/notes" className="ml-1 p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-all">
                                <X size={12} />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Breadcrumbs & Actions Pane */}
                <div className="px-8 pt-6 pb-2 flex items-center justify-between">
                    <div className="text-sm text-slate-500 flex items-center gap-2">
                        <span className="hover:underline cursor-pointer">All Notes</span>
                        <ArrowRight size={12} />
                        <span className="font-semibold text-slate-800">{note.title}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={fetchRevisions} className={`text-slate-400 hover:text-slate-700 p-1.5 rounded hover:bg-slate-100 ${historyOpen ? 'bg-slate-100 text-slate-900' : ''}`} title="Version History">
                            <Clock size={18} />
                        </button>
                        <button onClick={toggleFavorite} className={`p-1.5 rounded hover:bg-slate-100 ${note.is_favorite ? "text-yellow-500" : "text-slate-400"}`}>
                            <Star size={18} fill={note.is_favorite ? "currentColor" : "none"} />
                        </button>
                        <button onClick={handleDelete} className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50" title="Delete Note">
                            <Trash2 size={18} />
                        </button>
                        <button onClick={handleSave} className="text-slate-400 hover:text-blue-600 p-1.5 rounded hover:bg-slate-100" title="Save (Cmd+S)">
                            <Save size={18} className={saving ? "animate-pulse text-blue-500" : ""} />
                        </button>
                        <button onClick={() => setRightPanelOpen(!rightPanelOpen)} className={`text-slate-400 hover:text-slate-700 p-1.5 rounded hover:bg-slate-100 ${rightPanelOpen ? 'bg-slate-100' : ''}`} title="Toggle Right Sidebar">
                            <MoreHorizontal size={18} />
                        </button>
                    </div>
                </div>

                {/* Editor Container */}
                <div className="flex-1 overflow-auto px-8 md:px-16 lg:px-24 py-4">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-6 tracking-tight">{note.title}</h1>

                    <div className="min-h-[500px]">
                        <MarkdownEditor
                            initialValue={note.content} // Updated by handleRestore or handleSave
                            onChange={handleEditorChange}
                            placeholder="Start writing..."
                        />
                    </div>

                    <div className="h-20"></div> {/* Bottom Spacer */}
                </div>

                {/* Footer Status Bar (Obsidian Style) */}
                <div className="h-7 bg-slate-100 border-t border-slate-200 flex items-center justify-between px-3 text-[10px] text-slate-500 select-none">
                    <div className="flex gap-4">
                        <span>{backlinks.length} backlink(s)</span>
                        <span>{note.content.split(/\s+/).length} words</span>
                    </div>
                    <div>
                        Updated {new Date(note.updated_at).toLocaleTimeString()}
                    </div>
                </div>

            </div>

            {/* 3. Revisions Sidebar (Overrides Right Panel if open) */}
            {historyOpen && (
                <div className="w-80 border-l border-slate-200 bg-white flex flex-col h-full shadow-xl z-30 slide-in-from-right duration-200">
                    <div className="h-10 border-b border-slate-200 flex items-center justify-between px-4 bg-slate-50">
                        <span className="font-bold text-slate-600 text-sm">Version History</span>
                        <button onClick={() => setHistoryOpen(false)}><X size={16} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {revisions.length === 0 ? (
                            <div className="text-sm text-slate-400 italic">No history available.</div>
                        ) : revisions.map((rev) => (
                            <div key={rev.id} className="p-3 border border-slate-200 rounded-lg hover:border-blue-400 bg-slate-50 hover:bg-white transition-all group">
                                <div className="text-xs text-slate-500 mb-1">
                                    {new Date(rev.created_at.endsWith("Z") ? rev.created_at : rev.created_at + "Z").toLocaleString("en-US", {
                                        timeZone: "America/New_York",
                                        dateStyle: "medium",
                                        timeStyle: "short"
                                    })}
                                </div>
                                <div className="text-xs text-slate-800 line-clamp-3 font-mono bg-white p-1 border border-slate-100 rounded mb-2">
                                    {rev.content_snapshot.substring(0, 100) || "(empty)"}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleRestore(rev.content_snapshot)} className="flex-1 py-1 text-xs font-medium text-blue-600 border border-blue-200 rounded hover:bg-blue-50">
                                        Restore
                                    </button>
                                    <button onClick={async () => {
                                        if (!confirm("Delete this version permanently?")) return;
                                        try {
                                            await axios.delete(`http://localhost:8000/api/revisions/${rev.id}`);
                                            setRevisions(prev => prev.filter(r => r.id !== rev.id));
                                        } catch (e) {
                                            alert("Failed to delete revision");
                                        }
                                    }} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded border border-transparent hover:border-red-200">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 2. Right Sidebar (Local Graph & Backlinks) - Collapsible */}
            {!historyOpen && rightPanelOpen && (
                <div className="w-80 border-l border-slate-200 bg-slate-50 flex flex-col h-full shadow-xl z-20">
                    {/* Panel 1: Local Graph */}
                    <div className="h-1/2 flex flex-col border-b border-slate-200">
                        <div className="h-9 border-b border-slate-200 flex items-center px-4 bg-white">
                            <span className="text-xs font-bold text-slate-500 uppercase">Local Graph</span>
                        </div>
                        <div className="flex-1 overflow-hidden relative bg-slate-100">
                            {/* Re-use Global Graph for now, ideally pass props to focus this node */}
                            <LocalGraph />
                        </div>
                    </div>

                    {/* Panel 2: Backlinks/Outgoing */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-white">
                        <div className="h-9 border-b border-slate-200 flex items-center px-4 bg-white sticky top-0">
                            <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                <LinkIcon size={12} /> Linked Mentions
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-0">
                            {backlinks.length === 0 ? (
                                <div className="p-4 text-xs text-slate-400 text-center italic mt-4">No backlinks yet.</div>
                            ) : (
                                <div>
                                    {backlinks.map(link => (
                                        <Link key={link.source_id} href={`/notes/${link.source_id}`} className="block p-3 border-b border-slate-100 hover:bg-slate-50 group transition-colors">
                                            <div className="text-sm font-medium text-slate-700 group-hover:text-blue-600 mb-1">{link.source_title}</div>
                                            <div className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                                {link.snippet}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
