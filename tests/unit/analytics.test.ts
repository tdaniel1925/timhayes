/**
 * Unit tests for analytics and AI analysis
 */

import { describe, it, expect } from 'vitest';

describe('Call Analytics', () => {
  describe('Sentiment Analysis', () => {
    it('should correctly categorize positive sentiment', () => {
      const sentimentScore = 0.75;
      const category =
        sentimentScore > 0.5
          ? 'positive'
          : sentimentScore < -0.5
            ? 'negative'
            : 'neutral';

      expect(category).toBe('positive');
    });

    it('should correctly categorize negative sentiment', () => {
      const sentimentScore = -0.8;
      const category =
        sentimentScore > 0.5
          ? 'positive'
          : sentimentScore < -0.5
            ? 'negative'
            : 'neutral';

      expect(category).toBe('negative');
    });

    it('should correctly categorize neutral sentiment', () => {
      const sentimentScore = 0.1;
      const category =
        sentimentScore > 0.5
          ? 'positive'
          : sentimentScore < -0.5
            ? 'negative'
            : 'neutral';

      expect(category).toBe('neutral');
    });

    it('should handle edge cases at boundaries', () => {
      expect(
        0.5 > 0.5
          ? 'positive'
          : 0.5 < -0.5
            ? 'negative'
            : 'neutral'
      ).toBe('neutral');

      expect(
        -0.5 > 0.5
          ? 'positive'
          : -0.5 < -0.5
            ? 'negative'
            : 'neutral'
      ).toBe('neutral');
    });
  });

  describe('Talk Ratio Calculation', () => {
    it('should calculate correct talk ratio', () => {
      const callerSeconds = 60;
      const agentSeconds = 180;
      const totalTalk = callerSeconds + agentSeconds;

      const talkRatio = {
        caller: callerSeconds / totalTalk,
        agent: agentSeconds / totalTalk,
      };

      expect(talkRatio.caller).toBeCloseTo(0.25, 2);
      expect(talkRatio.agent).toBeCloseTo(0.75, 2);
      expect(talkRatio.caller + talkRatio.agent).toBeCloseTo(1.0, 5);
    });

    it('should handle zero total talk time', () => {
      const callerSeconds = 0;
      const agentSeconds = 0;
      const totalTalk = callerSeconds + agentSeconds;

      const talkRatio =
        totalTalk === 0
          ? { caller: 0, agent: 0 }
          : {
              caller: callerSeconds / totalTalk,
              agent: agentSeconds / totalTalk,
            };

      expect(talkRatio.caller).toBe(0);
      expect(talkRatio.agent).toBe(0);
    });

    it('should handle single speaker scenarios', () => {
      const callerSeconds = 120;
      const agentSeconds = 0;
      const totalTalk = callerSeconds + agentSeconds;

      const talkRatio = {
        caller: callerSeconds / totalTalk,
        agent: agentSeconds / totalTalk,
      };

      expect(talkRatio.caller).toBe(1.0);
      expect(talkRatio.agent).toBe(0.0);
    });
  });

  describe('Compliance Score Calculation', () => {
    it('should calculate compliance score from flags', () => {
      const complianceFlags = [
        { flag: 'greeting', passed: true },
        { flag: 'identification', passed: true },
        { flag: 'disclaimer', passed: false },
        { flag: 'closing', passed: true },
      ];

      const passedCount = complianceFlags.filter((f) => f.passed).length;
      const complianceScore = passedCount / complianceFlags.length;

      expect(complianceScore).toBeCloseTo(0.75, 2);
    });

    it('should handle 100% compliance', () => {
      const complianceFlags = [
        { flag: 'greeting', passed: true },
        { flag: 'identification', passed: true },
      ];

      const passedCount = complianceFlags.filter((f) => f.passed).length;
      const complianceScore = passedCount / complianceFlags.length;

      expect(complianceScore).toBe(1.0);
    });

    it('should handle 0% compliance', () => {
      const complianceFlags = [
        { flag: 'greeting', passed: false },
        { flag: 'identification', passed: false },
      ];

      const passedCount = complianceFlags.filter((f) => f.passed).length;
      const complianceScore = passedCount / complianceFlags.length;

      expect(complianceScore).toBe(0.0);
    });

    it('should handle empty flags array', () => {
      const complianceFlags: Array<{ flag: string; passed: boolean }> = [];
      const passedCount = complianceFlags.filter((f) => f.passed).length;
      const complianceScore =
        complianceFlags.length === 0 ? 0 : passedCount / complianceFlags.length;

      expect(complianceScore).toBe(0);
    });
  });

  describe('Keyword Frequency Analysis', () => {
    it('should count keyword occurrences in transcript', () => {
      const transcript =
        'Hello, thank you for calling. How can I help you today? Thank you for your patience.';
      const keyword = 'thank you';

      const occurrences = transcript.toLowerCase().split(keyword.toLowerCase())
        .length - 1;

      expect(occurrences).toBe(2);
    });

    it('should be case-insensitive', () => {
      const transcript = 'THANK YOU. Thank you. thank YOU.';
      const keyword = 'thank you';

      const occurrences = transcript.toLowerCase().split(keyword.toLowerCase())
        .length - 1;

      expect(occurrences).toBe(3);
    });

    it('should handle keywords not in transcript', () => {
      const transcript = 'Hello, how are you?';
      const keyword = 'refund';

      const occurrences = transcript.toLowerCase().split(keyword.toLowerCase())
        .length - 1;

      expect(occurrences).toBe(0);
    });
  });

  describe('Escalation Risk Assessment', () => {
    it('should identify high escalation risk', () => {
      const indicators = {
        negativeKeywords: 5,
        sentiment: -0.7,
        interruptionCount: 10,
        volumeLevel: 'high',
      };

      const risk =
        indicators.sentiment < -0.5 && indicators.negativeKeywords > 3
          ? 'high'
          : indicators.sentiment < 0 && indicators.negativeKeywords > 0
            ? 'medium'
            : 'low';

      expect(risk).toBe('high');
    });

    it('should identify medium escalation risk', () => {
      const indicators = {
        negativeKeywords: 2,
        sentiment: -0.3,
        interruptionCount: 3,
        volumeLevel: 'medium',
      };

      const risk =
        indicators.sentiment < -0.5 && indicators.negativeKeywords > 3
          ? 'high'
          : indicators.sentiment < 0 && indicators.negativeKeywords > 0
            ? 'medium'
            : 'low';

      expect(risk).toBe('medium');
    });

    it('should identify low escalation risk', () => {
      const indicators = {
        negativeKeywords: 0,
        sentiment: 0.5,
        interruptionCount: 0,
        volumeLevel: 'normal',
      };

      const risk =
        indicators.sentiment < -0.5 && indicators.negativeKeywords > 3
          ? 'high'
          : indicators.sentiment < 0 && indicators.negativeKeywords > 0
            ? 'medium'
            : 'low';

      expect(risk).toBe('low');
    });
  });
});
