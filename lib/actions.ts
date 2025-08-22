"use server"
import { createServerClient } from "./supabase"
import { analyzeEmotionEnhanced, analyzeEmotionKeywords } from "./emotion-analysis"
import type { Emotion, JournalEntry } from "./types"

// Enhanced journal sentiment analysis
export async function analyzeJournalSentiment(content: string): Promise<{
  emotion: Emotion
  analysis: string
}> {
  try {
    // Use the enhanced emotion analysis
    const result = await analyzeEmotionEnhanced(content)
    return {
      emotion: result.emotion,
      analysis: result.analysis,
    }
  } catch (error) {
    console.error("Error analyzing sentiment:", error)

    // Final fallback to keyword analysis
    const result = await analyzeEmotionKeywords(content)
    return {
      emotion: result.emotion,
      analysis: `${result.analysis} (Advanced analysis temporarily unavailable)`,
    }
  }
}

// Test function for emotion analysis
export async function testEmotionAnalysis(text: string): Promise<any> {
  try {
    const result = await analyzeEmotionEnhanced(text)
    return result
  } catch (error) {
    console.error("Emotion analysis failed:", error)

    // Try keyword analysis as final fallback
    try {
      const keywordResult = await analyzeEmotionKeywords(text)
      return keywordResult
    } catch (fallbackError) {
      return {
        error: `Analysis failed: ${error.message}`,
        fallbackError: fallbackError.message,
      }
    }
  }
}

// Save journal entry to Supabase
export async function saveJournalEntryToDb(entry: Omit<JournalEntry, "id">): Promise<JournalEntry> {
  const supabase = createServerClient()

  if (!supabase) {
    throw new Error("Database connection not available")
  }

  const { data, error } = await supabase
    .from("journal_entries")
    .insert({
      content: entry.content,
      emotion: entry.emotion,
      analysis: entry.analysis,
      date: entry.date,
    })
    .select()
    .single()

  if (error) {
    console.error("Error saving journal entry:", error)
    throw new Error("Failed to save journal entry")
  }

  return data as JournalEntry
}

// Get journal entries from Supabase
export async function getJournalEntriesFromDb(): Promise<JournalEntry[]> {
  const supabase = createServerClient()

  if (!supabase) {
    return []
  }

  const { data, error } = await supabase.from("journal_entries").select("*").order("date", { ascending: false })

  if (error) {
    console.error("Error fetching journal entries:", error)
    return []
  }

  return data as JournalEntry[]
}

// Get a single journal entry by ID
export async function getJournalEntryByIdFromDb(id: string): Promise<JournalEntry | null> {
  const supabase = createServerClient()

  if (!supabase) {
    return null
  }

  const { data, error } = await supabase.from("journal_entries").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching journal entry:", error)
    return null
  }

  return data as JournalEntry
}
