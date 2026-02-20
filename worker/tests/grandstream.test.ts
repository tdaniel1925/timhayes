/**
 * Unit tests for Grandstream UCM API integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authenticateUCM, downloadRecording } from '../src/lib/grandstream.js';

// Mock fetch
global.fetch = vi.fn();

describe('Grandstream UCM API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('authenticateUCM', () => {
    it('should successfully authenticate with correct credentials', async () => {
      const mockChallenge = 'abc123def456';
      const mockCookie = 'sid743052864-1771597757';

      // Mock challenge response
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: { challenge: mockChallenge },
          status: 0,
        }),
      });

      // Mock login response
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: { cookie: mockCookie },
          status: 0,
        }),
      });

      const cookie = await authenticateUCM(
        '192.168.1.100',
        8089,
        'cdrapi',
        'testpassword',
        false
      );

      expect(cookie).toBe(mockCookie);
      expect(fetch).toHaveBeenCalledTimes(2);

      // Verify challenge request format
      const challengeCall = (fetch as any).mock.calls[0];
      expect(challengeCall[0]).toBe('https://192.168.1.100:8089/api');
      const challengeBody = JSON.parse(challengeCall[1].body);
      expect(challengeBody).toEqual({
        request: {
          action: 'challenge',
          user: 'cdrapi',
          version: '1.0',
        },
      });

      // Verify login request format
      const loginCall = (fetch as any).mock.calls[1];
      expect(loginCall[0]).toBe('https://192.168.1.100:8089/api');
      const loginBody = JSON.parse(loginCall[1].body);
      expect(loginBody.request.action).toBe('login');
      expect(loginBody.request.user).toBe('cdrapi');
      expect(loginBody.request.token).toBeDefined();
    });

    it('should throw error when challenge fails', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: { error_msg: 'Invalid user' },
          status: -1,
        }),
      });

      await expect(
        authenticateUCM('192.168.1.100', 8089, 'baduser', 'password', false)
      ).rejects.toThrow('UCM challenge failed');
    });

    it('should throw error when login fails', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: { challenge: 'abc123' },
          status: 0,
        }),
      });

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: { error_msg: 'Authentication failed' },
          status: -1,
        }),
      });

      await expect(
        authenticateUCM('192.168.1.100', 8089, 'cdrapi', 'badpassword', false)
      ).rejects.toThrow('UCM login failed');
    });

    it('should throw error when no cookie returned', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: { challenge: 'abc123' },
          status: 0,
        }),
      });

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: {}, // No cookie field
          status: 0,
        }),
      });

      await expect(
        authenticateUCM('192.168.1.100', 8089, 'cdrapi', 'password', false)
      ).rejects.toThrow('No session cookie received');
    });
  });

  describe('downloadRecording', () => {
    it('should successfully download recording as buffer', async () => {
      const mockRecordingData = Buffer.from('fake audio data');
      const mockArrayBuffer = mockRecordingData.buffer.slice(
        mockRecordingData.byteOffset,
        mockRecordingData.byteOffset + mockRecordingData.byteLength
      );

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'audio/wav' : null,
        },
        arrayBuffer: async () => mockArrayBuffer,
      });

      const buffer = await downloadRecording(
        'sid123-456',
        '192.168.1.100',
        8089,
        '20250220-123456-1001-2001.wav',
        false
      );

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      expect(fetch).toHaveBeenCalledTimes(1);

      const callArgs = (fetch as any).mock.calls[0];
      expect(callArgs[0]).toBe('https://192.168.1.100:8089/api');
      const body = JSON.parse(callArgs[1].body);
      expect(body.request.action).toBe('recapi');
      expect(body.request.cookie).toBe('sid123-456');
      expect(body.request.recording_file).toBe('20250220-123456-1001-2001.wav');
    });

    it('should throw error when download returns JSON error', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) =>
            name === 'content-type' ? 'application/json' : null,
        },
        json: async () => ({
          response: { error_msg: 'File not found' },
          status: -1,
        }),
      });

      await expect(
        downloadRecording(
          'sid123-456',
          '192.168.1.100',
          8089,
          'nonexistent.wav',
          false
        )
      ).rejects.toThrow('Recording download failed');
    });

    it('should throw error when HTTP request fails', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await expect(
        downloadRecording(
          'sid123-456',
          '192.168.1.100',
          8089,
          'recording.wav',
          false
        )
      ).rejects.toThrow('Failed to download recording');
    });
  });
});
