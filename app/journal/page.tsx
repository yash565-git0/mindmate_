"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import type { JournalEntry, Emotion } from "@/lib/types"
import { formatDate } from "@/lib/utils"
import { getJournalEntries, saveJournalEntry } from "@/lib/storage"
import { analyzeJournalSentiment, testEmotionAnalysis } from "@/lib/actions"
import { EmotionBadge } from "@/components/emotion-badge"
import { PenLine, Plus, Search, Download, Lightbulb, BarChart3, TestTube, Calendar, TrendingUp } from "lucide-react"
import { generateId } from "@/lib/utils"

const writingPrompts = [
  "What made me smile today?",
  "What am I grateful for right now?",
  "How did I handle stress today?",
  "What would I tell my younger self?",
  "What's one thing I learned about myself today?",
  "What are three things that went well today?",
  "How am I feeling about my goals right now?",
  "What's something I'm looking forward to?",
  "What challenged me today and how did I respond?",
  "What would make tomorrow better than today?",
]

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [newEntry, setNewEntry] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | "all">("all")
  const [previewAnalysis, setPreviewAnalysis] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchEntries = async () => {
      const storedEntries = await getJournalEntries()
      setEntries(storedEntries)
    }

    fetchEntries()
  }, [])

  const handleSubmit = async () => {
    if (!newEntry.trim()) return

    setIsSubmitting(true)

    try {
      // Analyze sentiment using AI
      const { emotion, analysis } = await analyzeJournalSentiment(newEntry)

      // Create new entry with generated ID
      const entry: JournalEntry = {
        id: generateId(),
        date: new Date().toISOString(),
        content: newEntry,
        emotion,
        analysis,
      }

      // Save entry
      await saveJournalEntry(entry)

      // Refresh entries
      const updatedEntries = await getJournalEntries()
      setEntries(updatedEntries)

      setNewEntry("")
      setPreviewAnalysis(null)
      toast({
        title: "Journal entry saved",
        description: "Your journal entry has been saved and analyzed.",
      })
    } catch (error) {
      console.error("Error saving journal entry:", error)
      toast({
        title: "Error saving entry",
        description: "There was a problem saving your journal entry. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePreviewAnalysis = async () => {
    if (!newEntry.trim()) return

    setIsAnalyzing(true)
    try {
      const result = await testEmotionAnalysis(newEntry)
      setPreviewAnalysis(result)
    } catch (error) {
      console.error("Error analyzing text:", error)
      toast({
        title: "Analysis failed",
        description: "Could not analyze the text. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleUsePrompt = (prompt: string) => {
    setNewEntry(prompt + "\n\n")
  }

  const exportEntries = () => {
    const dataStr = JSON.stringify(entries, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `journal-entries-${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Filter entries based on search and emotion
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch = entry.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEmotion = selectedEmotion === "all" || entry.emotion === selectedEmotion
    return matchesSearch && matchesEmotion
  })

  // Calculate emotion statistics
  const emotionStats = entries.reduce(
    (acc, entry) => {
      acc[entry.emotion] = (acc[entry.emotion] || 0) + 1
      return acc
    },
    {} as Record<Emotion, number>,
  )

  const totalEntries = entries.length
  const mostCommonEmotion =
    totalEntries > 0
      ? (Object.entries(emotionStats).reduce((a, b) =>
          emotionStats[a[0] as Emotion] > emotionStats[b[0] as Emotion] ? a : b,
        )?.[0] as Emotion)
      : null

  return (
    <div className="container max-w-6xl py-8 space-y-8 animate-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Journaling</h1>
        <Button variant="outline" onClick={exportEntries} disabled={entries.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <Tabs defaultValue="write" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="write" className="flex items-center gap-1">
            <PenLine className="h-4 w-4" />
            <span className="hidden sm:inline">Write</span>
          </TabsTrigger>
          <TabsTrigger value="entries" className="flex items-center gap-1">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Browse</span>
          </TabsTrigger>
          <TabsTrigger value="prompts" className="flex items-center gap-1">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Prompts</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Insights</span>
          </TabsTrigger>
        </TabsList>

        {/* Write Tab */}
        <TabsContent value="write" className="space-y-6">
          <Card className="bg-card border-accent/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenLine className="h-5 w-5" />
                New Entry
              </CardTitle>
              <CardDescription>
                Write your thoughts and feelings. Use AI analysis to understand your emotional patterns.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="How are you feeling today? What's on your mind?"
                className="min-h-[200px] resize-none"
                value={newEntry}
                onChange={(e) => setNewEntry(e.target.value)}
              />

              {/* Preview Analysis */}
              {previewAnalysis && (
                <Card className="bg-muted/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TestTube className="h-4 w-4" />
                      Analysis Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs font-medium">Detected Emotion:</p>
                        <EmotionBadge emotion={previewAnalysis.emotion as Emotion} />
                      </div>
                      <div>
                        <p className="text-xs font-medium">Confidence:</p>
                        <p className="text-sm font-bold">{(previewAnalysis.confidence * 100).toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium">Method:</p>
                        <Badge variant="outline" className="text-xs">
                          {previewAnalysis.method}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{previewAnalysis.analysis}</p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handlePreviewAnalysis} disabled={!newEntry.trim() || isAnalyzing}>
                <TestTube className="h-4 w-4 mr-2" />
                {isAnalyzing ? "Analyzing..." : "Preview Analysis"}
              </Button>
              <Button onClick={handleSubmit} disabled={!newEntry.trim() || isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Entry"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Browse Entries Tab */}
        <TabsContent value="entries" className="space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Browse Entries
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search your entries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={selectedEmotion === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedEmotion("all")}
                  >
                    All
                  </Button>
                  {(["happy", "calm", "sad", "anxious", "angry", "neutral"] as Emotion[]).map((emotion) => (
                    <Button
                      key={emotion}
                      variant={selectedEmotion === emotion ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedEmotion(emotion)}
                      className="capitalize"
                    >
                      {emotion}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Entries List */}
          {filteredEntries.length === 0 ? (
            <Card className="bg-muted/50">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  {entries.length === 0
                    ? "No journal entries yet. Start writing to track your emotional journey."
                    : "No entries match your search criteria."}
                </p>
                {entries.length === 0 && (
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => document.querySelector('[value="write"]')?.click()}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create your first entry
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredEntries.map((entry) => (
                <Card key={entry.id} className="overflow-hidden transition-all hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{formatDate(entry.date)}</CardTitle>
                      <EmotionBadge emotion={entry.emotion} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-3 text-muted-foreground">{entry.content}</p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/journal/${entry.id}`}>View Details</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Writing Prompts Tab */}
        <TabsContent value="prompts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Writing Prompts
              </CardTitle>
              <CardDescription>
                Get inspired with these thoughtful prompts to help you reflect and write.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {writingPrompts.map((prompt, index) => (
                  <Card key={index} className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <p className="text-sm mb-2">{prompt}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          handleUsePrompt(prompt)
                          document.querySelector('[value="write"]')?.click()
                        }}
                      >
                        Use This Prompt
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Journal Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{totalEntries}</p>
                    <p className="text-sm text-muted-foreground">Total Entries</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {totalEntries > 0
                        ? Math.round(entries.reduce((sum, entry) => sum + entry.content.length, 0) / totalEntries)
                        : 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Avg. Words</p>
                  </div>
                </div>
                {mostCommonEmotion && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Most Common Emotion</p>
                    <EmotionBadge emotion={mostCommonEmotion} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Emotion Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Emotion Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {totalEntries === 0 ? (
                  <p className="text-center text-muted-foreground">No data available yet</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(emotionStats).map(([emotion, count]) => (
                      <div key={emotion} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <EmotionBadge emotion={emotion as Emotion} showIcon={false} />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${(count / totalEntries) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {entries.length === 0 ? (
                <p className="text-center text-muted-foreground">Start journaling to see your activity trends</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Last entry: {formatDate(entries[0]?.date)}</p>
                  <p className="text-sm text-muted-foreground">
                    Entries this week:{" "}
                    {
                      entries.filter((entry) => {
                        const entryDate = new Date(entry.date)
                        const weekAgo = new Date()
                        weekAgo.setDate(weekAgo.getDate() - 7)
                        return entryDate > weekAgo
                      }).length
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Entries this month:{" "}
                    {
                      entries.filter((entry) => {
                        const entryDate = new Date(entry.date)
                        const monthAgo = new Date()
                        monthAgo.setMonth(monthAgo.getMonth() - 1)
                        return entryDate > monthAgo
                      }).length
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
