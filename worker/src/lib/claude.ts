/**
 * OpenAI integration for call analysis
 * Uses structured prompts to extract insights from call transcripts
 */

import OpenAI from 'openai';
import type { TranscriptResult } from './deepgram.js';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface CallAnalysisResult {
  summary: string;
  sentiment_overall: 'positive' | 'negative' | 'neutral' | 'mixed';
  sentiment_score: number; // -1.00 to 1.00
  sentiment_timeline: Array<{
    timestamp_ms: number;
    sentiment: string;
    score: number;
  }>;
  talk_ratio: {
    caller: number;
    agent: number;
  };
  talk_time_seconds: {
    caller: number;
    agent: number;
  };
  silence_seconds: number;
  keywords: Array<{
    keyword: string;
    count: number;
    context: string;
  }>;
  topics: Array<{
    topic: string;
    relevance_score: number;
  }>;
  action_items: Array<{
    description: string;
    assignee: 'caller' | 'agent' | 'unknown';
    deadline_mentioned: string | null;
  }>;
  call_disposition_ai: string;
  compliance_score: number;
  compliance_flags: Array<{
    flag: string;
    description: string;
    passed: boolean;
  }>;
  escalation_risk: 'low' | 'medium' | 'high';
  escalation_reasons: string[] | null;
  satisfaction_prediction: 'satisfied' | 'neutral' | 'dissatisfied';
  satisfaction_score: number;
  questions_asked: Array<{
    speaker: 'caller' | 'agent';
    question: string;
    timestamp_ms: number;
  }>;
  objections: Array<{
    objection: string;
    response: string;
    outcome: 'resolved' | 'unresolved' | 'partial';
  }>;
  custom_keyword_matches: Array<{
    keyword: string;
    count: number;
    contexts: string[];
  }>;
}

/**
 * Analyze call transcript with Claude AI
 */
export async function analyzeCall(
  transcript: TranscriptResult,
  customKeywords: string[] = [],
  callMetadata?: {
    direction: string;
    duration: number;
    src: string;
    dst: string;
  }
): Promise<CallAnalysisResult> {
  const startTime = Date.now();

  // Format transcript with speaker labels
  const formattedTranscript = transcript.utterances
    .map((u) => {
      const speaker = u.speaker === 0 ? 'Speaker 1' : 'Speaker 2';
      const timestamp = Math.floor(u.start * 1000); // Convert to ms
      return `[${timestamp}ms] ${speaker}: ${u.text}`;
    })
    .join('\n');

  // Build the analysis prompt
  const systemPrompt = `You are an expert call analyst for AudiaPro, an AI-powered call analytics platform.
Analyze phone call transcripts and return structured JSON analysis with actionable insights.`;

  const userPrompt = `Analyze the following phone call transcript and return a detailed JSON analysis.

TRANSCRIPT:
${formattedTranscript}

${customKeywords.length > 0 ? `CUSTOM KEYWORDS TO TRACK:\n${customKeywords.join(', ')}\n\n` : ''}

${callMetadata ? `CALL METADATA:
- Direction: ${callMetadata.direction}
- Duration: ${callMetadata.duration} seconds
- From: ${callMetadata.src}
- To: ${callMetadata.dst}

` : ''}

Return ONLY valid JSON with this exact structure:
{
  "summary": "2-3 sentence executive summary of the call",
  "sentiment_overall": "positive|negative|neutral|mixed",
  "sentiment_score": <float between -1.0 and 1.0>,
  "sentiment_timeline": [{"timestamp_ms": <int>, "sentiment": "<string>", "score": <float>}],
  "talk_ratio": {"caller": <float 0-1>, "agent": <float 0-1>},
  "talk_time_seconds": {"caller": <int>, "agent": <int>},
  "silence_seconds": <int>,
  "keywords": [{"keyword": "<string>", "count": <int>, "context": "<string>"}],
  "topics": [{"topic": "<string>", "relevance_score": <float 0-1>}],
  "action_items": [{"description": "<string>", "assignee": "caller|agent|unknown", "deadline_mentioned": "<string|null>"}],
  "call_disposition_ai": "sale|support|complaint|inquiry|follow_up|scheduling|info_request|escalation|other",
  "compliance_score": <float 0-1>,
  "compliance_flags": [{"flag": "<string>", "description": "<string>", "passed": <boolean>}],
  "escalation_risk": "low|medium|high",
  "escalation_reasons": ["<string>"] or null,
  "satisfaction_prediction": "satisfied|neutral|dissatisfied",
  "satisfaction_score": <float 0-1>,
  "questions_asked": [{"speaker": "caller|agent", "question": "<string>", "timestamp_ms": <int>}],
  "objections": [{"objection": "<string>", "response": "<string>", "outcome": "resolved|unresolved|partial"}],
  "custom_keyword_matches": [{"keyword": "<string>", "count": <int>, "contexts": ["<string>"]}]
}

Assume Speaker 1 is typically the agent/employee and Speaker 2 is the caller/customer unless context suggests otherwise.

Return ONLY the JSON object, no other text.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 4096,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    // Extract JSON from response
    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Try to parse JSON from response
    let analysisResult: CallAnalysisResult;
    try {
      // Claude might wrap JSON in markdown code blocks
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) ||
                        responseText.match(/```\n([\s\S]*?)\n```/);

      const jsonText = jsonMatch ? jsonMatch[1] : responseText;
      analysisResult = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse Claude response as JSON:', responseText);
      throw new Error(`Failed to parse AI analysis response: ${parseError}`);
    }

    const processingTime = Date.now() - startTime;
    console.log(`AI analysis completed in ${processingTime}ms`);

    return analysisResult;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`AI analysis failed: ${error.message}`);
    }
    throw new Error('Unknown AI analysis error');
  }
}
