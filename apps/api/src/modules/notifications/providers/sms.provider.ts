/**
 * PetVerse SMS Provider Abstraction
 *
 * Implements a pluggable SMS provider interface:
 *   - TwilioSmsProvider: Sends SMS messages via Twilio REST API.
 *   - DevLoggerSmsProvider: Logs sanitized SMS payloads in dev/test, fails gracefully in production.
 *
 * SECURITY:
 *   - Auth tokens and credentials are NEVER logged.
 *   - Recipient phone numbers are masked in logs (e.g. +1***567).
 */

import { env } from '../../../config/env';
import { logger } from '../../../shared/utils/logger';

export interface SmsPayload {
  to: string;
  body: string;
  senderId?: string;
  templateId?: string;
}

export interface SmsResult {
  success: boolean;
  provider: 'msg91' | 'twofactor' | 'twilio' | 'aws-sns' | 'dev-log';
  messageId?: string;
  error?: string;
}

export interface ISmsProvider {
  name: 'msg91' | 'twofactor' | 'twilio' | 'aws-sns' | 'dev-log';
  sendSms(payload: SmsPayload): Promise<SmsResult>;
}

function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 5) return '***';
  return phone.slice(0, 2) + '***' + phone.slice(-4);
}

/**
 * Twilio REST SMS Provider
 * Uses direct HTTP basic auth against Twilio Messages endpoint without requiring heavyweight SDKs.
 */
export class TwilioSmsProvider implements ISmsProvider {
  public readonly name = 'twilio';

  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly fromPhone: string;

  constructor(accountSid: string, authToken: string, fromPhone: string) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.fromPhone = fromPhone;
  }

  public async sendSms(payload: SmsPayload): Promise<SmsResult> {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const params = new URLSearchParams();
      params.append('To', payload.to);
      params.append('From', this.fromPhone);
      params.append('Body', payload.body);

      const authHeader = 'Basic ' + Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = (await response.json()) as any;

      if (!response.ok) {
        const errorMsg = data?.message || `Twilio HTTP ${response.status}`;
        logger.error('[TwilioSmsProvider] Twilio API dispatch failed', {
          to: maskPhoneNumber(payload.to),
          errorMessage: errorMsg,
        });
        return {
          success: false,
          provider: 'twilio',
          error: errorMsg,
        };
      }

      logger.info('[TwilioSmsProvider] SMS message dispatched successfully', {
        to: maskPhoneNumber(payload.to),
        sid: data?.sid,
      });

      return {
        success: true,
        provider: 'twilio',
        messageId: data?.sid,
      };
    } catch (err: any) {
      logger.error('[TwilioSmsProvider] Network/Transport exception during SMS delivery', {
        to: maskPhoneNumber(payload.to),
        errorMessage: err?.message || 'Unknown network error',
      });
      return {
        success: false,
        provider: 'twilio',
        error: err?.message || 'Transport failure',
      };
    }
  }
}

/**
 * MSG91 SMS Provider (India-First Primary SMS Gateway)
 * Uses MSG91 Flow / Send SMS REST API
 */
export class Msg91SmsProvider implements ISmsProvider {
  public readonly name = 'msg91';

  private readonly authKey: string;
  private readonly senderId: string;
  private readonly defaultTemplateId?: string;

  constructor(authKey: string, senderId = 'PETVRS', templateId?: string) {
    this.authKey = authKey;
    this.senderId = senderId;
    this.defaultTemplateId = templateId;
  }

  public async sendSms(payload: SmsPayload): Promise<SmsResult> {
    try {
      // Clean phone number: MSG91 accepts numbers with country code without '+' or formatting
      const cleanPhone = payload.to.replace(/[^\d]/g, '');
      const templateId = payload.templateId || this.defaultTemplateId;

      if (templateId) {
        // Flow API (DLT template compliant)
        const response = await fetch('https://control.msg91.com/api/v5/flow/', {
          method: 'POST',
          headers: {
            authkey: this.authKey,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            template_id: templateId,
            sender: this.senderId,
            short_url: '0',
            recipients: [
              {
                mobiles: cleanPhone,
                message: payload.body,
              },
            ],
          }),
        });

        const data = (await response.json()) as any;
        if (!response.ok || data?.type === 'error') {
          const errorMsg = data?.message || `MSG91 Flow HTTP ${response.status}`;
          logger.error('[Msg91SmsProvider] Flow API dispatch failed', {
            to: maskPhoneNumber(payload.to),
            errorMessage: errorMsg,
          });
          return { success: false, provider: 'msg91', error: errorMsg };
        }

        logger.info('[Msg91SmsProvider] SMS dispatched successfully via MSG91 Flow', {
          to: maskPhoneNumber(payload.to),
          messageId: data?.message,
        });
        return { success: true, provider: 'msg91', messageId: data?.message };
      } else {
        // Direct transactional SMS endpoint
        const response = await fetch('https://api.msg91.com/api/v2/sendsms', {
          method: 'POST',
          headers: {
            authkey: this.authKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender: this.senderId,
            route: '4',
            country: '91',
            sms: [
              {
                message: payload.body,
                to: [cleanPhone],
              },
            ],
          }),
        });

        const data = (await response.json()) as any;
        if (!response.ok || data?.type === 'error') {
          const errorMsg = data?.message || `MSG91 HTTP ${response.status}`;
          logger.error('[Msg91SmsProvider] Transactional dispatch failed', {
            to: maskPhoneNumber(payload.to),
            errorMessage: errorMsg,
          });
          return { success: false, provider: 'msg91', error: errorMsg };
        }

        return { success: true, provider: 'msg91', messageId: data?.message };
      }
    } catch (err: any) {
      logger.error('[Msg91SmsProvider] Network failure dispatching SMS', {
        to: maskPhoneNumber(payload.to),
        errorMessage: err?.message,
      });
      return { success: false, provider: 'msg91', error: err?.message || 'MSG91 network failure' };
    }
  }
}

/**
 * 2Factor SMS Provider (India Fallback SMS / OTP Gateway)
 */
export class TwoFactorSmsProvider implements ISmsProvider {
  public readonly name = 'twofactor';

  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  public async sendSms(payload: SmsPayload): Promise<SmsResult> {
    try {
      const cleanPhone = payload.to.replace(/[^\d]/g, '');
      const url = `https://2factor.in/API/V1/${encodeURIComponent(this.apiKey)}/ADDON_SERVICES/SEND/TSMS`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          From: payload.senderId || 'PETVRS',
          To: cleanPhone,
          Msg: payload.body,
        }).toString(),
      });

      const data = (await response.json()) as any;
      if (!response.ok || data?.Status !== 'Success') {
        const errorMsg = data?.Details || `2Factor HTTP ${response.status}`;
        logger.error('[TwoFactorSmsProvider] SMS dispatch failed', {
          to: maskPhoneNumber(payload.to),
          errorMessage: errorMsg,
        });
        return { success: false, provider: 'twofactor', error: errorMsg };
      }

      logger.info('[TwoFactorSmsProvider] SMS dispatched successfully via 2Factor', {
        to: maskPhoneNumber(payload.to),
        sessionId: data?.Details,
      });
      return { success: true, provider: 'twofactor', messageId: data?.Details };
    } catch (err: any) {
      logger.error('[TwoFactorSmsProvider] Network failure during SMS delivery', {
        to: maskPhoneNumber(payload.to),
        errorMessage: err?.message,
      });
      return { success: false, provider: 'twofactor', error: err?.message || '2Factor transport failure' };
    }
  }
}

/**
 * Development & Fallback SMS Provider
 */
export class DevLoggerSmsProvider implements ISmsProvider {
  public readonly name = 'dev-log';

  public async sendSms(payload: SmsPayload): Promise<SmsResult> {
    if (env.NODE_ENV === 'production') {
      logger.error('[DevLoggerSmsProvider] SMS provider not configured in production. SMS not sent.', {
        to: maskPhoneNumber(payload.to),
      });
      return {
        success: false,
        provider: 'dev-log',
        error: 'SMS provider credentials are not configured in production environment',
      };
    }

    logger.info('[DevLoggerSmsProvider:dev] SMS notification simulated in development', {
      to: maskPhoneNumber(payload.to),
      bodyPreview: payload.body.slice(0, 100),
    });

    return {
      success: true,
      provider: 'dev-log',
      messageId: `dev-sms-${Date.now()}`,
    };
  }
}

let activeProvider: ISmsProvider | null = null;

export function getSmsProvider(): ISmsProvider {
  if (activeProvider) return activeProvider;

  // 1. MSG91 (India-first primary SMS gateway)
  if (env.MSG91_API_KEY) {
    activeProvider = new Msg91SmsProvider(
      env.MSG91_API_KEY,
      env.MSG91_SENDER_ID || 'PETVRS',
      env.MSG91_TEMPLATE_ID
    );
    return activeProvider;
  }

  // 2. 2Factor (India-first secondary SMS gateway)
  if (env.TWOFACTOR_API_KEY) {
    activeProvider = new TwoFactorSmsProvider(env.TWOFACTOR_API_KEY);
    return activeProvider;
  }

  // 3. Twilio (International / legacy fallback)
  if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER) {
    activeProvider = new TwilioSmsProvider(
      env.TWILIO_ACCOUNT_SID,
      env.TWILIO_AUTH_TOKEN,
      env.TWILIO_PHONE_NUMBER
    );
    return activeProvider;
  }

  activeProvider = new DevLoggerSmsProvider();
  return activeProvider;
}

export function setSmsProviderForTesting(provider: ISmsProvider | null): void {
  activeProvider = provider;
}

export async function sendSmsNotification(payload: SmsPayload): Promise<SmsResult> {
  const provider = getSmsProvider();
  return provider.sendSms(payload);
}
