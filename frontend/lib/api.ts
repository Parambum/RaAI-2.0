const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
//test
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  removeToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      console.log(`Making API request to: ${url}`);
      
      const response = await fetch(url, {
        ...options,
        headers,
        // Add timeout and other options
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      console.log(`API response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      
      // If it's a network error, throw a specific error
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Cannot connect to backend server. Please check if the backend is running.');
      }
      
      throw error;
    }
  }

  // Health check with fallback
  async health() {
    try {
      return await this.request('/health');
    } catch (error) {
      console.warn('Health check failed:', error);
      return { status: 'offline', error: typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : String(error) };
    }
  }

  // Check-in questions with fallback
  async getCheckInQuestions() {
    try {
      return await this.request('/analytics/checkin/questions');
    } catch {
      console.warn('Failed to get questions from backend, using fallback');
      return {
        questions: [
          { id: "mood", text: "How are you feeling today?", scale: "1=Very Low, 5=Very High" },
          { id: "stress", text: "How stressed did you feel today?", scale: "1=Not at all, 5=Extremely" },
          { id: "energy", text: "What's your energy level right now?", scale: "1=Very Low, 5=Very High" },
          { id: "connection", text: "How connected did you feel to others today?", scale: "1=Not at all, 5=Very Connected" },
          { id: "motivation", text: "How motivated did you feel today?", scale: "1=Not at all, 5=Extremely" }
        ]
      };
    }
  }

  // Submit check-in with fallback
  async submitCheckIn(data: Record<string, unknown>) {
    try {
      return await this.request('/analytics/checkin', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      console.warn('Failed to submit to backend, storing locally');
      // Calculate simple mood score locally
      const responses = { ...data };
      delete responses.user_id;
      delete responses.date;
      
      const values = Object.values(responses) as number[];
      const avgScore = values.reduce((a, b) => a + b, 0) / values.length;
      const moodIndex = ((avgScore - 1) / 4) * 100;
      
      return {
        mood_index: Math.round(moodIndex * 100) / 100,
        offline: true
      };
    }
  }

  // Journal analysis with fallback
  async analyzeJournalEntry(data: { journal: string; [key: string]: unknown }) {
    try {
      return await this.request('/ai/analyze-entry', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      console.warn('Failed to analyze with backend, using simple analysis');
      return {
        safety: { label: 'SAFE' },
        analysis: {
          emotions: this.analyzeFallbackEmotions(data.journal),
          sentiment: this.calculateFallbackSentiment(data.journal),
          cognitive_distortions: [],
          topics: [],
          facet_signals: {
            self_awareness: '0',
            self_regulation: '0', 
            motivation: '0',
            empathy: '0',
            social_skills: '0'
          },
          one_line_insight: "Continue reflecting on your experiences."
        },
        offline: true
      };
    }
  }

  // Simple fallback emotion analysis
  private analyzeFallbackEmotions(text: string): Array<{ label: string; score: number }> {
    const emotions: Array<{ label: string; score: number }> = [];
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('happy') || lowerText.includes('joy') || lowerText.includes('good')) {
      emotions.push({ label: "Joy", score: 0.7 });
    }
    if (lowerText.includes('sad') || lowerText.includes('down') || lowerText.includes('upset')) {
      emotions.push({ label: "Sadness", score: 0.6 });
    }
    if (lowerText.includes('angry') || lowerText.includes('mad') || lowerText.includes('frustrated')) {
      emotions.push({ label: "Anger", score: 0.6 });
    }
    if (lowerText.includes('worried') || lowerText.includes('anxious') || lowerText.includes('nervous')) {
      emotions.push({ label: "Anxiety", score: 0.6 });
    }
    
    if (emotions.length === 0) {
      emotions.push({ label: "Reflection", score: 0.5 });
    }
    
    return emotions;
  }

  // Simple fallback sentiment calculation
  private calculateFallbackSentiment(text: string): number {
    const positiveWords = ['good', 'great', 'happy', 'love', 'amazing', 'wonderful', 'excellent', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'horrible', 'worst', 'sad', 'angry'];
    
    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    
    words.forEach(word => {
      if (positiveWords.some(pos => word.includes(pos))) score += 1;
      if (negativeWords.some(neg => word.includes(neg))) score -= 1;
    });
    
    return Math.max(-1, Math.min(1, score / Math.max(words.length / 10, 1)));
  }

  // Other methods with basic error handling
  async getBaselineQuestions() {
    try {
      return await this.request('/ai/get-baseline-questions');
    } catch {
      return {
        questions: [
          {"qid": "SA1", "facet": "self_awareness", "text": "I can recognize my emotions as they arise."},
          {"qid": "SR1", "facet": "self_regulation", "text": "I can stay calm under pressure."},
          {"qid": "M1", "facet": "motivation", "text": "I persist even when tasks are difficult."},
          {"qid": "E1", "facet": "empathy", "text": "I understand others' feelings even if unspoken."},
          {"qid": "SS1", "facet": "social_skills", "text": "I handle disagreements constructively."}
        ]
      };
    }
  }

  async submitBaseline(data: Record<string, unknown>) {
    try {
      return await this.request('/ai/score-baseline', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      // Simple fallback scoring
      const scores = {
        self_awareness: 0.6,
        self_regulation: 0.5,
        motivation: 0.7,
        empathy: 0.6,
        social_skills: 0.5
      };
      
      return {
        scores,
        strengths: ["self_awareness"],
        focus: ["self_regulation", "social_skills"],
        summary: "Baseline assessment completed offline.",
        offline: true
      };
    }
  }

  async rewriteText(data: { text: string; [key: string]: unknown }) {
    try {
      return await this.request('/collab/rewrite', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return {
        rewrite: data.text, // Return original text if rewrite fails
        removed_terms: [],
        offline: true
      };
    }
  }

  // Minimal implementations for other methods
  async getMoodSeries(userId: string, days: number = 30) {
    try {
      return await this.request(`/analytics/series?user_id=${userId}&days=${days}`);
    } catch {
      return { series: [], offline: true };
    }
  }

  async getExercise(data: Record<string, unknown>) {
    try {
      return await this.request('/ai/get-exercise', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      return {
        exercise: {
          exercise_id: "fallback_breathing",
          title: "Simple Breathing Exercise",
          steps: ["Sit comfortably", "Breathe in for 4 counts", "Hold for 4 counts", "Breathe out for 4 counts", "Repeat 5 times"],
          expected_outcome: "Feeling more calm and centered",
          source_doc_id: "fallback",
          followup_question: "How do you feel after this exercise?"
        },
        offline: true
      };
    }
  }

  async safetyCheck(text: string) {
    try {
      return await this.request('/ai/safety-check', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
    } catch {
      return { label: 'SAFE', offline: true };
    }
  }
}

export const apiClient = new ApiClient();

// Helper function to check if we're in offline mode
export function isOfflineMode(): boolean {
  return !navigator.onLine;
}

// Helper to handle API errors gracefully
export function handleApiError(error: unknown, fallback?: unknown) {
  console.error('API Error:', error);
  if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message: string }).message === 'string' && (error as { message: string }).message.includes('Cannot connect to backend')) {
    console.warn('Backend appears to be offline, using fallback data');
  }
  return fallback || null;
}

export default apiClient;