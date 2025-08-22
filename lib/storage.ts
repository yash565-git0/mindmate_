"use client"

import { createBrowserClient } from "./supabase"
import type { Habit, JournalEntry, MoodEntry } from "./types"
import { generateId } from "./utils"

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

// Simple check for Supabase availability
const hasSupabase = () => {
  const supabase = createBrowserClient()
  return supabase !== null
}

// Journal Entries
export async function saveJournalEntry(entry: JournalEntry): Promise<void> {
  // Always use localStorage for now to avoid network issues
  const entries = getLocalJournalEntries()
  const newEntry = { ...entry, id: entry.id || generateId() }
  entries.unshift(newEntry)
  if (isBrowser) {
    localStorage.setItem("journal_entries", JSON.stringify(entries))
  }
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  // Always use localStorage for now to avoid network issues
  return getLocalJournalEntries()
}

export async function getJournalEntryById(id: string): Promise<JournalEntry | undefined> {
  // Always use localStorage for now to avoid network issues
  const entries = getLocalJournalEntries()
  return entries.find((entry) => entry.id === id)
}

// Local storage helpers for journal entries
function getLocalJournalEntries(): JournalEntry[] {
  if (!isBrowser) return []
  try {
    const stored = localStorage.getItem("journal_entries")
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Habits
export async function saveHabit(habit: Habit): Promise<void> {
  const habits = getLocalHabits()
  const newHabit = { ...habit, id: habit.id || generateId() }
  habits.push(newHabit)
  if (isBrowser) {
    localStorage.setItem("habits", JSON.stringify(habits))
  }
}

export async function getHabits(): Promise<Habit[]> {
  return getLocalHabits()
}

export async function updateHabit(updatedHabit: Habit): Promise<void> {
  const habits = getLocalHabits()
  const index = habits.findIndex((h) => h.id === updatedHabit.id)
  if (index !== -1) {
    habits[index] = updatedHabit
    if (isBrowser) {
      localStorage.setItem("habits", JSON.stringify(habits))
    }
  }
}

export async function toggleHabitCompletion(habitId: string, date: string): Promise<void> {
  const habits = getLocalHabits()
  const habit = habits.find((h) => h.id === habitId)
  if (habit) {
    const dateIndex = habit.completedDates.indexOf(date)
    if (dateIndex > -1) {
      habit.completedDates.splice(dateIndex, 1)
    } else {
      habit.completedDates.push(date)
    }
    if (isBrowser) {
      localStorage.setItem("habits", JSON.stringify(habits))
    }
  }
}

export async function deleteHabit(habitId: string): Promise<void> {
  const habits = getLocalHabits()
  const filteredHabits = habits.filter((h) => h.id !== habitId)
  if (isBrowser) {
    localStorage.setItem("habits", JSON.stringify(filteredHabits))
  }
}

// Local storage helpers for habits
function getLocalHabits(): Habit[] {
  if (!isBrowser) return []
  try {
    const stored = localStorage.getItem("habits")
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Mood Entries
export async function saveMoodEntry(entry: MoodEntry): Promise<void> {
  const entries = getLocalMoodEntries()
  const existingIndex = entries.findIndex((e) => e.date === entry.date)
  const newEntry = { ...entry, id: entry.id || generateId() }

  if (existingIndex > -1) {
    entries[existingIndex] = newEntry
  } else {
    entries.push(newEntry)
  }

  if (isBrowser) {
    localStorage.setItem("mood_entries", JSON.stringify(entries))
  }
}

export async function getMoodEntries(): Promise<MoodEntry[]> {
  return getLocalMoodEntries()
}

// Local storage helpers for mood entries
function getLocalMoodEntries(): MoodEntry[] {
  if (!isBrowser) return []
  try {
    const stored = localStorage.getItem("mood_entries")
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Initialize default data
export async function initializeDefaultData(): Promise<void> {
  // Initialize default habits in localStorage if none exist
  const habits = getLocalHabits()
  if (habits.length === 0) {
    const defaultHabits = [
      {
        id: generateId(),
        name: "Drink Water",
        description: "Drink at least 8 glasses of water throughout the day",
        category: "self-care" as const,
        createdAt: new Date().toISOString(),
        completedDates: [],
      },
      {
        id: generateId(),
        name: "5-Minute Meditation",
        description: "Take 5 minutes to meditate and center yourself",
        category: "mindfulness" as const,
        createdAt: new Date().toISOString(),
        completedDates: [],
      },
      {
        id: generateId(),
        name: "Stretching",
        description: "Do some gentle stretching to release tension",
        category: "physical" as const,
        createdAt: new Date().toISOString(),
        completedDates: [],
      },
    ]

    if (isBrowser) {
      localStorage.setItem("habits", JSON.stringify(defaultHabits))
    }
  }
}
