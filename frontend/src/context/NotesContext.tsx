"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

interface Tag {
    id: number;
    name: string;
}

interface NoteSummary {
    id: number;
    title: string;
    tags: Tag[]; // Added tags
    updated_at: string;
}

interface NotesContextType {
    notes: NoteSummary[];
    refreshNotes: () => Promise<void>;
    selectedTag: string | null;
    setSelectedTag: (tag: string | null) => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: ReactNode }) {
    const [notes, setNotes] = useState<NoteSummary[]>([]);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    const refreshNotes = async () => {
        try {
            const res = await axios.get("http://localhost:8000/api/notes?limit=100");
            setNotes(res.data);
        } catch (err) {
            console.error("Failed to fetch notes:", err);
        }
    };

    // Initial fetch
    useEffect(() => {
        refreshNotes();
    }, []);

    return (
        <NotesContext.Provider value={{ notes, refreshNotes, selectedTag, setSelectedTag }}>
            {children}
        </NotesContext.Provider>
    );
}

export function useNotes() {
    const context = useContext(NotesContext);
    if (context === undefined) {
        throw new Error("useNotes must be used within a NotesProvider");
    }
    return context;
}
