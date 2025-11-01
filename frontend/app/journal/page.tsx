'use client'

import { useState, useRef } from "react" // <-- IMPORT useRef HERE
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
  IconRobot,
  IconSquare,
  IconTrash,
  IconClockHour4,
  IconTag,
} from "@tabler/icons-react"
import Link from "next/link"

interface AnalysisResult {
  emotions: Array<{ name: string; intensity: number }>
  sentiment: number
  focus: string
  patterns: string[]
  recommendations: string[]
}

interface SavedJournalEntry {
  id: string; 
  date: string;
  text: string;
  analysis: AnalysisResult | null;
  audioUrl: string | null;
  imageFileName: string | null;
}

const mockFile = (fileName: string) => ({ 
    name: fileName, 
    type: 'image/jpeg', 
    size: 1024, 
    lastModified: Date.now() 
}) as unknown as File;


export default function JournalPage() {
  // 1. RE-DECLARE useRef
  const fileInputRef = useRef<HTMLInputElement>(null) 
  
  const [journalText, setJournalText] = useState("")
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const [attachedImage, setAttachedImage] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  
  const [savedEntries, setSavedEntries] = useState<SavedJournalEntry[]>([])


  async function uploadAudio(audioFile: Blob){
    const formData = new FormData();
    formData.append('audio_file', audioFile, 'consultation_audio.webm');

    try {
        const response = await fetch('http://0.0.0.0:8000/api/transcribe', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setJournalText(journalText + result.data)
        
        
    } catch (error) {
        console.error('Error uploading audio for transcription:', error);
    } finally { 
    }
};

  const startRecording = async () => {
    if (mediaRecorder) return; 
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      
      const audioChunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        uploadAudio(blob)
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      };

      recorder.start();
      setIsRecording(true);
      setAudioBlob(null); 
      setAudioUrl(null);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert("Microphone access denied or error starting recording.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setMediaRecorder(null);
    }
  };

  const clearRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
  };

  const handleVoiceNote = () => {
    if (isRecording) {
      stopRecording();
    } else if (!audioBlob) {
      startRecording();
    }
  };

  const handlePhotoAttachment = () => {
    // This requires fileInputRef to be defined and attached to a hidden input
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setAttachedImage(file);
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl); 
      }
      setImagePreviewUrl(URL.createObjectURL(file));
    }
    event.target.value = '';
  };

  const clearImage = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setAttachedImage(null);
    setImagePreviewUrl(null);
  };

  const handleAnalyze = async () => {
    // ADDED CHECK for audioBlob or attachedImage to allow analysis without text
    if (!journalText.trim() && !audioBlob && !attachedImage) return;
  
    setIsAnalyzing(true);
    
    try {
      const analysisData = {
        user_id: "temp-user-id", // Replace with actual user ID
        mood: 3, // Default mood, could be from a slider
        journal: journalText,
        // Added attachment placeholders back for full analysis functionality
        audio_attachment: audioBlob ? `[Audio file attached: ${audioBlob.type}]` : null,
        image_attachment: attachedImage ? `[Image file attached: ${attachedImage.name}]` : null,
        context: {}
      };
  
      const response = await apiClient.analyzeJournalEntry(analysisData);
      
      if (response.safety?.label === 'ESCALATE') {
        setAnalysis({
          emotions: [],
          sentiment: 0,
          focus: "Safety",
          patterns: ["Safety concern detected"],
          recommendations: [response.message || "Please reach out for support"]
        });
      } else {
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

  const handleSaveEntry = () => {
    if (!journalText.trim() && !audioBlob && !attachedImage) return;

    const newEntry: SavedJournalEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      text: journalText,
      analysis,
      audioUrl,
      imageFileName: attachedImage?.name || null,
    };

    setSavedEntries((prevEntries) => [newEntry, ...prevEntries]);

    localStorage.setItem('lastJournalEntry', JSON.stringify({
      date: newEntry.date,
      text: newEntry.text,
      analysis: newEntry.analysis,
      audio: newEntry.audioUrl ? 'attached' : 'none',
      image: newEntry.imageFileName ? 'attached' : 'none'
    }));

    setJournalText("");
    setAnalysis(null);
    clearRecording();
    clearImage();
  };

  const handleLoadEntry = (entry: SavedJournalEntry) => {
    setJournalText(entry.text);
    setAnalysis(entry.analysis);

    if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(entry.audioUrl);

    if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
    }
    if (entry.imageFileName) {
        const file = mockFile(entry.imageFileName);
        setAttachedImage(file);

    } else {
        setAttachedImage(null);
        setImagePreviewUrl(null);
    }

    alert(`Entry from ${new Date(entry.date).toLocaleTimeString()} loaded.`);
  };


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

  const getBadgeColorClass = (sentiment: number) => {
    if (sentiment > 0.2) return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    if (sentiment < -0.2) return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
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
          <div className="space-y-4">
            <h3 className="text-lg font-medium">How was your day?</h3>
            <Textarea
              placeholder="I had a challenging meeting with my team today. I felt frustrated when they disagreed with my proposal..."
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
              className="min-h-[150px] text-base"
            />
            
            {/* 2. RE-ADD THE HIDDEN INPUT FIELD */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            
            {/* ATTACHMENTS DISPLAY SECTION (re-added the complete attachment display logic) */}
            {(audioUrl || attachedImage) && (
              <div className="flex flex-col gap-3 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                <h4 className="text-sm font-medium">Attachments:</h4>
                {audioUrl && (
                  <div className="flex items-center justify-between p-2 border rounded-md bg-white dark:bg-gray-700">
                    <div className="flex items-center gap-2">
                      <IconMicrophone className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Voice Note Attached</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <audio controls src={audioUrl} className="h-8" />
                      <Button variant="ghost" size="icon" onClick={clearRecording}>
                        <IconTrash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                )}
                {attachedImage && imagePreviewUrl && (
                  <div className="flex items-center justify-between p-2 border rounded-md bg-white dark:bg-gray-700">
                    <div className="flex items-center gap-2">
                      <IconPhoto className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium truncate max-w-[150px]">{attachedImage.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <img src={imagePreviewUrl} alt="Preview" className="h-8 w-8 object-cover rounded" />
                      <Button variant="ghost" size="icon" onClick={clearImage}>
                        <IconTrash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleVoiceNote}
                // Updated variant/icons for voice note state
                variant={isRecording ? "destructive" : (audioBlob ? "outline" : "outline")}
                size="sm"
                className="flex items-center gap-2"
                disabled={!!audioBlob && !isRecording} 
              >
                {isRecording ? (
                  <>
                    <IconSquare className="h-4 w-4" />
                    Stop Recording
                  </>
                ) : audioBlob ? (
                  <>
                    <IconTrash className="h-4 w-4" />
                    Clear Voice Note
                  </>
                ) : (
                  <>
                    <IconMicrophone className="h-4 w-4" />
                    Voice Note
                  </>
                )}
              </Button>
              <Button
                onClick={attachedImage ? clearImage : handlePhotoAttachment}
                variant={attachedImage ? "outline" : "outline"}
                size="sm"
                className="flex items-center gap-2"
              >
                {attachedImage ? (
                  <>
                    <IconTrash className="h-4 w-4" />
                    Remove Photo
                  </>
                ) : (
                  <>
                    <IconPhoto className="h-4 w-4" />
                    Add Photo
                  </>
                )}
              </Button>
              <Button
                onClick={handleAnalyze}
                // Updated disabled logic for analysis
                disabled={(!journalText.trim() && !audioBlob && !attachedImage) || isAnalyzing}
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

          <div className="flex justify-center pt-6">
            <Button 
              variant="outline" 
              onClick={handleSaveEntry}
              disabled={!journalText.trim() && !audioBlob && !attachedImage}
              className="flex items-center gap-2"
            >
              <IconDeviceFloppy className="h-4 w-4" />
              Save Entry
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {savedEntries.length > 0 && (
        <div className="mt-8 p-6 border rounded-xl shadow-lg bg-white dark:bg-gray-800">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <IconClockHour4 className="h-5 w-5 text-gray-500" />
            Saved Entries History ({savedEntries.length})
          </h3>
          <div className="space-y-4">
            {savedEntries.map((entry) => (
              <div 
                key={entry.id} 
                className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 cursor-pointer" // Added cursor-pointer
                onClick={() => handleLoadEntry(entry)} // Added onClick handler
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm text-blue-600 dark:text-blue-400">
                    {new Date(entry.date).toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2">
                    {entry.audioUrl && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        <IconMicrophone className="h-3 w-3 mr-1" /> Audio
                      </Badge>
                    )}
                    {entry.imageFileName && (
                      <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                        <IconPhoto className="h-3 w-3 mr-1" /> Photo
                      </Badge>
                    )}
                    {entry.analysis?.sentiment !== undefined && (
                      <Badge 
                        className={`text-xs font-medium ${getBadgeColorClass(entry.analysis.sentiment)}`}
                      >
                         <IconTag className="h-3 w-3 mr-1" /> 
                         {getSentimentLabel(entry.analysis.sentiment)}
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                  Entry: {entry.text.substring(0, 150)}{entry.text.length > 150 ? "..." : ""}
                </p>
                {entry.analysis?.focus && (
                    <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                        Focus: {entry.analysis.focus}
                    </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}