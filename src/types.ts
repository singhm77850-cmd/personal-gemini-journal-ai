export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  status: 'active' | 'completed' | 'archived';
  messages: ChatMessage[];
  summary?: string;
  keyThemes?: string[];
  mood?: string;
  actionItems?: string[];
  mode?: 'reflective' | 'brainstorming' | 'planning' | 'freeform';
  createdAt: string;
  updatedAt: string;
}

export interface RecurringTheme {
  theme: string;
  description: string;
  frequency: string;
  actionableAdvice: string;
}

export interface ReflectionPattern {
  pattern: string;
  observation: string;
  advice: string;
}

export interface JournalInsightData {
  id?: string;
  userId: string;
  generatedAt: string;
  journalCountAnalyzed: number;
  recurringThemes: RecurringTheme[];
  reflectionPatterns: ReflectionPattern[];
  personalizedPrompts: string[];
  emotionalTrends: string;
  growthOpportunities: string[];
}

export interface SummarizeResponse {
  title: string;
  summary: string;
  keyThemes: string[];
  mood: string;
  actionItems: string[];
}

export type ViewTab = 'journal' | 'history' | 'insights';
