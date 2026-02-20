/**
 * Unit tests for webhook validation and processing
 */

import { describe, it, expect } from 'vitest';
import {
  grandstreamWebhookSchema,
  determineCallDirection,
} from '@/lib/validations/webhook';

describe('Webhook Validation', () => {
  describe('grandstreamWebhookSchema', () => {
    it('should validate complete Grandstream CDR payload', () => {
      const validPayload = {
        src: '1001',
        dst: '2001',
        dcontext: 'from-internal',
        channel: 'SIP/1001-00000001',
        dstchannel: 'SIP/2001-00000002',
        lastapp: 'Dial',
        lastdata: 'SIP/2001,60,tr',
        start: '2025-02-20 10:30:00',
        answer: '2025-02-20 10:30:05',
        end: '2025-02-20 10:35:00',
        duration: '300',
        billsec: '295',
        disposition: 'ANSWERED',
        amaflags: 'DOCUMENTATION',
        accountcode: '',
        uniqueid: '1708428600.1',
        userfield: '',
        recordfiles: '20250220-103000-1001-2001.wav',
        did: '',
        outbound_cnum: '',
        outbound_cnam: '',
        dst_cnam: 'John Doe',
        linkedid: '1708428600.1',
        peeraccount: '2001',
        sequence: '1',
        callid: 'abc123def456',
        src_trunk_name: '',
        dst_trunk_name: '',
        clid: '"Alice" <1001>',
        session: '',
      };

      const result = grandstreamWebhookSchema.safeParse(validPayload);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.src).toBe('1001');
        expect(result.data.dst).toBe('2001');
        expect(result.data.disposition).toBe('ANSWERED');
        expect(result.data.recordfiles).toBe('20250220-103000-1001-2001.wav');
      }
    });

    it('should reject payload with missing required fields', () => {
      const invalidPayload = {
        src: '1001',
        // missing dst
        dcontext: 'from-internal',
      };

      const result = grandstreamWebhookSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should reject invalid disposition values', () => {
      const invalidPayload = {
        src: '1001',
        dst: '2001',
        dcontext: 'from-internal',
        channel: 'SIP/1001-00000001',
        dstchannel: 'SIP/2001-00000002',
        lastapp: 'Dial',
        lastdata: 'SIP/2001',
        start: '2025-02-20 10:30:00',
        answer: '',
        end: '2025-02-20 10:30:00',
        duration: '0',
        billsec: '0',
        disposition: 'INVALID_STATUS', // Invalid
        amaflags: 'DOCUMENTATION',
        accountcode: '',
        uniqueid: '1708428600.1',
        userfield: '',
        recordfiles: '',
        did: '',
        outbound_cnum: '',
        outbound_cnam: '',
        dst_cnam: '',
        linkedid: '1708428600.1',
        peeraccount: '',
        sequence: '1',
        callid: 'abc123',
        src_trunk_name: '',
        dst_trunk_name: '',
        clid: '',
        session: '',
      };

      const result = grandstreamWebhookSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should provide default values for optional fields', () => {
      const minimalPayload = {
        src: '1001',
        dst: '2001',
        dcontext: 'from-internal',
        channel: 'SIP/1001-00000001',
        dstchannel: 'SIP/2001-00000002',
        lastapp: 'Dial',
        lastdata: 'SIP/2001',
        start: '2025-02-20 10:30:00',
        answer: '',
        end: '2025-02-20 10:30:00',
        duration: '0',
        billsec: '0',
        disposition: 'NO ANSWER',
        amaflags: 'DOCUMENTATION',
        accountcode: '',
        uniqueid: '1708428600.1',
        userfield: '',
        // recordfiles omitted
        did: '',
        outbound_cnum: '',
        outbound_cnam: '',
        dst_cnam: '',
        linkedid: '1708428600.1',
        peeraccount: '',
        sequence: '1',
        callid: 'abc123',
        src_trunk_name: '',
        dst_trunk_name: '',
        clid: '',
        // session omitted
      };

      const result = grandstreamWebhookSchema.safeParse(minimalPayload);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.recordfiles).toBe(''); // Default value
        expect(result.data.session).toBe(''); // Default value
      }
    });
  });

  describe('determineCallDirection', () => {
    it('should identify outbound calls', () => {
      const direction = determineCallDirection(
        'from-internal',
        '',
        'VoiceTrunk'
      );
      expect(direction).toBe('outbound');
    });

    it('should identify inbound calls', () => {
      const direction = determineCallDirection('from-trunk', 'VoiceTrunk', '');
      expect(direction).toBe('inbound');
    });

    it('should identify internal calls', () => {
      const direction = determineCallDirection('from-internal', '', '');
      expect(direction).toBe('internal');
    });

    it('should handle edge case: internal context with trunk', () => {
      // If both src and dst trunk are present, prefer trunk-based logic
      const direction = determineCallDirection(
        'from-internal',
        'TrunkA',
        'TrunkB'
      );
      // Should be outbound because dcontext is from-internal and dst trunk exists
      expect(direction).toBe('outbound');
    });

    it('should identify inbound even without from-trunk context', () => {
      const direction = determineCallDirection(
        'default',
        'InboundTrunk',
        ''
      );
      expect(direction).toBe('inbound');
    });
  });
});
