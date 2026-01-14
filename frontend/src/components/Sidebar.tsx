"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
    LayoutDashboard,
    FileText,
    Share2,
    Settings,
    Plus,
    Search,
    Folder,
    ChevronRight,
    ChevronDown,
    Hash,
    X
} from "lucide-react";
import axios from "axios";
import { usePathname } from "next/navigation";

// --- Types ---
interface NoteSummary {
    id: number;
    title: string;
}

export function Sidebar() {
    return (
        <div className="flex h-screen border-r border-slate-200 bg-slate-50">
            {/* 1. Icon Rail (Far Left) */}
            <div className="w-12 h-full bg-slate-100 border-r border-slate-200 flex flex-col items-center py-4 gap-4 z-20">
                <Link href="/" title="Dashboard" className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors">
                    <LayoutDashboard size={20} />
                </Link>
                <Link href="/notes" title="File Explorer" className="p-2 rounded-lg text-blue-600 bg-blue-50 transition-colors">
                    <Folder size={20} />
                </Link>
                <Link href="/notes/search" title="Search" className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors">
                    <Search size={20} />
                </Link>
                <Link href="/graph" title="Graph View" className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors">
                    <Share2 size={20} />
                </Link>

                <div className="flex-1" />

                <Link href="/settings" title="Settings" className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors">
                    <Settings size={20} />
                </Link>
            </div>

            {/* 2. File Explorer Panel */}
            <FileExplorer />
        </div>
    );
}

import { useNotes } from "@/context/NotesContext";

function FileExplorer() {
    const { notes, selectedTag, setSelectedTag } = useNotes();
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(["root"]));
    const [tags, setTags] = useState<any[]>([]);
    // const [selectedTag, setSelectedTag] = useState<string | null>(null); // Moved to Context
    const pathname = usePathname();

    useEffect(() => {
        axios.get("http://localhost:8000/api/tags")
            .then(res => setTags(res.data))
            .catch(err => console.error("Failed to fetch tags", err));
    }, [notes]); // Re-fetch tags when notes change (crud)

    const toggleFolder = (id: string) => {
        const next = new Set(expandedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedIds(next);
    };

    // Auto-expand 'root' if tag is selected so user sees results
    useEffect(() => {
        if (selectedTag) {
            setExpandedIds(prev => {
                const next = new Set(prev);
                next.add("root");
                return next;
            });
        }
    }, [selectedTag]);

    // Filter Logic
    // If a tag is selected, we filter notes. But wait, we don't have note-tag mapping on 'notes' summary list locally unless we fetch it.
    // The current 'notes' context provider likely only fetches basic info. 
    // Ideally we should update the context/API to return tags in the note summary list. 
    // Assuming backend 'NoteRead' now includes 'tags' field based on previous edits.

    // We need to verify if the Context was updated. The schema was updated.
    // If the Context fetches GET /notes which returns NoteRead, then `notes` array HAS tags.

    const displayedNotes = selectedTag
        ? notes.filter(n => (n as any).tags && Array.isArray((n as any).tags) && (n as any).tags.some((t: any) => t.name === selectedTag))
        : notes;

    return (
        <div className="w-60 h-full flex flex-col bg-slate-50">
            {/* Header */}
            <div className="h-10 border-b border-slate-200 flex items-center justify-between px-4 bg-white/50">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Explorer</span>
                <div className="flex items-center gap-1">
                    {selectedTag && (
                        <button onClick={() => setSelectedTag(null)} className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full hover:bg-purple-200 flex items-center gap-1">
                            #{selectedTag} <X size={10} />
                        </button>
                    )}
                    <Link href="/notes/new" className="text-slate-400 hover:text-slate-700">
                        <Plus size={16} />
                    </Link>
                </div>
            </div>

            {/* Tree Content */}
            <div className="flex-1 overflow-y-auto py-2">

                {/* Mock Folder: Notes (Root) */}
                <div className="select-none">
                    <div
                        className="flex items-center gap-1 px-2 py-1 text-sm text-slate-600 cursor-pointer hover:bg-slate-100"
                        onClick={() => toggleFolder("root")}
                    >
                        {expandedIds.has("root") ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <Folder size={14} className="text-slate-400 fill-slate-300" />
                        <span className="font-medium">All Notes</span>
                    </div>

                    {expandedIds.has("root") && (
                        <div className="pl-4">
                            {/* Tags List */}
                            {tags.length > 0 && (
                                <div className="mb-2">
                                    {tags.map(tag => (
                                        <div
                                            key={tag.id}
                                            onClick={() => setSelectedTag(selectedTag === tag.name ? null : tag.name)}
                                            className={`flex items-center gap-2 px-2 py-1 text-xs cursor-pointer ${selectedTag === tag.name ? "text-purple-600 bg-purple-50 font-medium" : "text-slate-500 hover:bg-slate-100"
                                                }`}
                                        >
                                            <Hash size={12} /> <span>{tag.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* File List */}
                            {displayedNotes.map(note => (
                                <Link
                                    key={note.id}
                                    href={`/notes/${note.id}`}
                                    className={`flex items-center gap-2 px-2 py-1 text-sm cursor-pointer border-l-2 ml-1 ${pathname === `/notes/${note.id}`
                                        ? "bg-blue-50 text-blue-700 border-blue-500 font-medium"
                                        : "text-slate-600 border-transparent hover:bg-slate-100 hover:border-slate-300"
                                        }`}
                                >
                                    <FileText size={14} className="opacity-70" />
                                    <span className="truncate">{note.title}</span>
                                </Link>
                            ))}

                            {displayedNotes.length === 0 && (
                                <div className="px-4 py-2 text-xs text-slate-400 italic">No notes found.</div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
