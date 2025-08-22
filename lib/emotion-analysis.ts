"use server"

import { google } from "@ai-sdk/google"
import { generateText } from "ai"

// Define the emotions we want to classify
const EMOTIONS = ["happy", "calm", "sad", "anxious", "angry", "neutral"] as const

// Simple keyword-based emotion analysis (reliable fallback)
export async function analyzeEmotionKeywords(text: string): Promise<{
  emotion: (typeof EMOTIONS)[number]
  confidence: number
  method: "keywords"
  analysis: string
}> {
  const textLower = text.toLowerCase()

  // Enhanced keyword mapping
  const emotionKeywords = {
    happy: [
      "happy",
      "joy",
      "excited",
      "great",
      "wonderful",
      "fantastic",
      "pleased",
      "delighted",
      "cheerful",
      "elated",
      "thrilled",
      "amazing",
      "awesome",
      "brilliant",
      "excellent",
      "love",
      "beautiful",
      "perfect",
      "smile",
      "laugh",
    ],
    calm: [
      "calm",
      "peaceful",
      "relaxed",
      "serene",
      "tranquil",
      "content",
      "centered",
      "balanced",
      "quiet",
      "still",
      "gentle",
      "soothing",
      "comfortable",
      "at ease",
      "restful",
    ],
    sad: [
      "sad",
      "unhappy",
      "depressed",
      "down",
      "blue",
      "gloomy",
      "miserable",
      "upset",
      "disappointed",
      "heartbroken",
      "lonely",
      "empty",
      "hopeless",
      "crying",
      "tears",
      "grief",
      "sorrow",
    ],
    anxious: [
      "anxious",
      "worried",
      "nervous",
      "stressed",
      "tense",
      "uneasy",
      "afraid",
      "fearful",
      "panic",
      "overwhelmed",
      "restless",
      "agitated",
      "concerned",
      "apprehensive",
      "racing heart",
      "can't stop",
    ],
    angry: [
      "angry",
      "frustrated",
      "annoyed",
      "irritated",
      "mad",
      "furious",
      "rage",
      "outraged",
      "livid",
      "infuriated",
      "pissed",
      "hate",
      "disgusted",
      "fed up",
      "screaming",
    ],
  }

  // Count occurrences of emotion keywords
  const counts: Record<string, number> = {
    happy: 0,
    calm: 0,
    sad: 0,
    anxious: 0,
    angry: 0,
    neutral: 0,
  }

  Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
    keywords.forEach((keyword) => {
      if (textLower.includes(keyword)) {
        counts[emotion] += 1
      }
    })
  })

  // Find the emotion with the highest count
  let maxEmotion: (typeof EMOTIONS)[number] = "neutral"
  let maxCount = 0

  Object.entries(counts).forEach(([emotion, count]) => {
    if (count > maxCount) {
      maxCount = count
      maxEmotion = emotion as (typeof EMOTIONS)[number]
    }
  })

  const confidence = maxCount > 0 ? Math.min(0.8, 0.3 + maxCount * 0.1) : 0.5

  return {
    emotion: maxEmotion,
    confidence,
    method: "keywords",
    analysis: `Based on keyword analysis, found ${maxCount} emotion-related terms suggesting "${maxEmotion}" feelings. This analysis uses pattern matching to identify emotional indicators in your text.`,
  }
}

// AI-powered emotion analysis using Gemini (when available)
export async function analyzeEmotionWithAI(text: string): Promise<{
  emotion: (typeof EMOTIONS)[number]
  confidence: number
  method: "ai"
  analysis: string
}> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) {
    throw new Error("Google API key not available")
  }

  const prompt = `
    Analyze the emotional content of this text and determine the primary emotion.
    Choose exactly one emotion from: happy, calm, sad, anxious, angry, neutral
    
    Text: "${text}"
    
    Respond with a JSON object containing:
    - emotion: the primary emotion (one word from the list above)
    - confidence: a number between 0 and 1 indicating confidence
    - reasoning: brief explanation of why you chose this emotion
    
    Example: {"emotion": "happy", "confidence": 0.8, "reasoning": "The text contains positive language and expressions of joy"}
    
    Return ONLY the JSON object, no other text.
  `

  const { text: response } = await generateText({
    model: google("gemini-1.5-flash"),
    prompt,
  })

  // Parse the AI response
  let jsonStr = response.trim()
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (jsonMatch && jsonMatch[1]) {
    jsonStr = jsonMatch[1].trim()
  }

  const result = JSON.parse(jsonStr)

  return {
    emotion: result.emotion as (typeof EMOTIONS)[number],
    confidence: Math.min(1, Math.max(0, result.confidence || 0.7)),
    method: "ai",
    analysis: `AI analysis: ${result.reasoning || "The text was analyzed using advanced language understanding to detect emotional patterns and context."}`,
  }
}

// Main emotion analysis function with fallbacks
export async function analyzeEmotionEnhanced(text: string): Promise<{
  emotion: (typeof EMOTIONS)[number]
  confidence: number
  method: "ai" | "keywords"
  analysis: string
}> {
  try {
    // Try AI analysis first
    const aiResult = await analyzeEmotionWithAI(text)
    return aiResult
  } catch (error) {
    console.warn("AI emotion analysis failed, using keyword fallback:", error.message)

    // Fall back to keyword analysis
    const keywordResult = await analyzeEmotionKeywords(text)
    return {
      ...keywordResult,
      analysis: `${keywordResult.analysis} (AI analysis temporarily unavailable)`,
    }
  }
}
