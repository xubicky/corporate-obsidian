"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { useNotes } from "@/context/NotesContext";

export default function NewNotePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { refreshNotes } = useNotes();

    // Auto-fill title from URL if present (e.g. from WikiLink click on non-existing note)
    const initialTitle = searchParams.get("title") || "";

    const [title, setTitle] = useState(initialTitle);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");

    // Update state if URL param changes
    useEffect(() => {
        if (initialTitle) setTitle(initialTitle);
    }, [initialTitle]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setError("");

        try {
            const response = await axios.post("http://localhost:8000/api/notes", {
                title: title,
                content: `# ${title}\n\nStart writing here...`,
                visibility: "team"
            });

            const newNoteId = response.data.id;

            // Refresh Sidebar via Context
            await refreshNotes();

            router.push(`/notes/${newNoteId}`);

        } catch (err: any) {
            console.error("Failed to create note:", err);
            setError(err.response?.data?.detail || "Failed to create note.");
            setCreating(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto mt-20">
            <Link href="/" className="text-slate-400 hover:text-slate-600 flex items-center gap-2 mb-8 text-sm">
                <ArrowLeft size={16} /> Back to Dashboard
            </Link>

            <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
                <h1 className="text-2xl font-bold text-slate-900 mb-6">Create New Note</h1>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleCreate} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Note Title</label>
                        <input
                            type="text"
                            required
                            autoFocus
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                            placeholder="e.g., Project Gamma Strategy"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                        <p className="text-xs text-slate-500 mt-2">
                            Note: If you arrived here via a WikiLink, creating this note will make that link active.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={creating || !title.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {creating ? "Creating..." : "Create Note"}
                    </button>
                </form>
            </div>
        </div>
    );
}
