'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api"
import { 
  IconEdit, 
  IconMicrophone, 
  IconPhoto, 
  IconBrain, 
  IconMoodHappy, 
  IconChartBar, 
  IconTarget, 
  IconBulb, 
  IconSparkles, 
  IconPlayerPlay, 
  IconRefresh, 
  IconDeviceFloppy,
  IconRobot
} from "@tabler/icons-react"
import Link from "next/link"

interface AnalysisResult {
  emotions: Array<{ name: string; intensity: number }>
  sentiment: number
  focus: string
  patterns: string[]
  recommendations: string[]
}

export default function JournalPage() {
  const [journalText, setJournalText] = useState("")
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyze = async () => {
    if (!journalText.trim()) return;
  
    setIsAnalyzing(true);
    
    try {
      // Submit to backend for analysis
      const analysisData = {
        user_id: "temp-user-id", // Replace with actual user ID
        mood: 3, // Default mood, could be from a slider
        journal: journalText,
        context: {}
      };
  
      const response = await apiClient.analyzeJournalEntry(analysisData);
      
      if (response.safety?.label === 'ESCALATE') {
        // Handle safety concern
        setAnalysis({
          emotions: [],
          sentiment: 0,
          focus: "Safety",
          patterns: ["Safety concern detected"],
          recommendations: [response.message || "Please reach out for support"]
        });
      } else {
        // Convert backend response to frontend format
        const backendAnalysis = response.analysis;
        const mockAnalysis = {
          emotions: backendAnalysis.emotions.map((e: { label: string; score: number }) => ({
            name: e.label,
            intensity: e.score
          })),
          sentiment: backendAnalysis.sentiment,
          focus: Object.keys(backendAnalysis.facet_signals).find(key => 
            backendAnalysis.facet_signals[key] === '-'
          ) || "Self-Awareness",
          patterns: backendAnalysis.cognitive_distortions,
          recommendations: response.recommendation ? [
            `Try: ${response.recommendation.title}`,
            response.recommendation.expected_outcome
          ] : ["Continue journaling regularly"]
        };
        
        setAnalysis(mockAnalysis);
      }
      
    } catch (error) {
      console.error('Analysis failed:', error);
      // Fallback to mock analysis
      const mockAnalysis = {
        emotions: [
          { name: "Reflection", intensity: 0.7 },
          { name: "Curiosity", intensity: 0.5 }
        ],
        sentiment: 0.1,
        focus: "Self-Awareness",
        patterns: ["Introspective thinking"],
        recommendations: [
          "Continue regular journaling",
          "Try mindfulness exercises"
        ]
      };
      setAnalysis(mockAnalysis);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleVoiceNote = () => {
    // Voice recording functionality would go here
    alert("Voice recording feature coming soon!")
  }

  const handlePhotoAttachment = () => {
    // Photo attachment functionality would go here
    alert("Photo attachment feature coming soon!")
  }

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.2) return "text-green-600"
    if (sentiment < -0.2) return "text-red-600"
    return "text-yellow-600"
  }

  const getSentimentLabel = (sentiment: number) => {
    if (sentiment > 0.2) return "Positive"
    if (sentiment < -0.2) return "Negative"
    return "Neutral"
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <IconEdit className="h-6 w-6 text-blue-500" />
            <CardTitle className="text-2xl">Daily Reflection</CardTitle>
          </div>
          <CardDescription>
            Share your thoughts and get AI-powered emotional insights
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Journal Input */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">How was your day?</h3>
            <Textarea
              placeholder="I had a challenging meeting with my team today. I felt frustrated when they disagreed with my proposal..."
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
              className="min-h-[150px] text-base"
            />
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleVoiceNote}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <IconMicrophone className="h-4 w-4" />
                Voice Note
              </Button>
              <Button
                onClick={handlePhotoAttachment}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <IconPhoto className="h-4 w-4" />
                Add Photo
              </Button>
              <Button
                onClick={handleAnalyze}
                disabled={!journalText.trim() || isAnalyzing}
                className="flex items-center gap-2"
              >
                <IconBrain className="h-4 w-4" />
                {isAnalyzing ? "Analyzing..." : "Analyze"}
              </Button>
            </div>
          </div>

          {/* Analysis Results */}
          {analysis && (
            <Card className="border-2 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconRobot className="h-5 w-5 text-blue-500" />
                  AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Emotions Detected */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <IconMoodHappy className="h-4 w-4" />
                    Emotions Detected
                  </h4>
                  <div className="space-y-2">
                    {analysis.emotions.map((emotion, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{emotion.name}</span>
                        <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                          <div className="flex-1 bg-muted rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${emotion.intensity * 100}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {(emotion.intensity * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sentiment & Focus */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <IconChartBar className="h-4 w-4" />
                      Overall Sentiment
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={getSentimentColor(analysis.sentiment)}
                      >
                        {getSentimentLabel(analysis.sentiment)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        ({analysis.sentiment > 0 ? '+' : ''}{analysis.sentiment.toFixed(1)})
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <IconTarget className="h-4 w-4" />
                      Recommended Focus
                    </h4>
                    <Badge variant="secondary">{analysis.focus}</Badge>
                  </div>
                </div>

                {/* Patterns Identified */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <IconBulb className="h-4 w-4" />
                    Patterns Identified
                  </h4>
                  <ul className="space-y-1">
                    {analysis.patterns.map((pattern, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-orange-500">•</span>
                        {pattern}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <IconSparkles className="h-4 w-4" />
                    Recommendations
                  </h4>
                  <div className="space-y-2">
                    {analysis.recommendations.map((rec, index) => (
                      <div key={index} className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <p className="text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                  <Link href="/exercise" className="flex-1">
                    <Button className="w-full flex items-center gap-2">
                      <IconPlayerPlay className="h-4 w-4" />
                      Start Exercise
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleAnalyze}
                  >
                    <IconRefresh className="h-4 w-4 mr-2" />
                    Re-analyze
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Save Entry */}
          <div className="flex justify-center pt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                // Save journal entry logic
                localStorage.setItem('lastJournalEntry', JSON.stringify({
                  date: new Date().toISOString(),
                  text: journalText,
                  analysis
                }))
                alert("Journal entry saved!")
              }}
              disabled={!journalText.trim()}
              className="flex items-center gap-2"
            >
              <IconDeviceFloppy className="h-4 w-4" />
              Save Entry
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}