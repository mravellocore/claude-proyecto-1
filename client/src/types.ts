export type SlideType = 'poll' | 'wordcloud' | 'quiz' | 'qa' | 'open';

export interface Slide {
  id: string;
  type: SlideType;
  question: string;
  options: string[];
  responses: Response[];
  createdAt: string;
}

export interface Response {
  odium: string;
  participantName: string;
  answer: string;
  timestamp: string;
}

export interface Presentation {
  id: string;
  title: string;
  accessCode: string;
  slides: Slide[];
  currentSlide: number;
  createdAt: string;
  isActive: boolean;
}

export interface PollResults {
  type: 'poll' | 'quiz';
  question: string;
  options: string[];
  results: Record<string, number>;
  totalResponses: number;
}

export interface WordCloudResults {
  type: 'wordcloud';
  question: string;
  words: { text: string; count: number }[];
  totalResponses: number;
}

export interface QAResults {
  type: 'qa' | 'open';
  question: string;
  answers: { answer: string; timestamp: string }[];
  totalResponses: number;
}

export type SlideResults = PollResults | WordCloudResults | QAResults;
