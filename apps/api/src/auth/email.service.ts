import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    const publicApiUrl = process.env.API_PUBLIC_URL;
    if (!apiKey?.trim() || !from?.trim() || !publicApiUrl?.trim()) {
      const missingConfiguration = [
        { name: 'RESEND_API_KEY', value: apiKey },
        { name: 'EMAIL_FROM', value: from },
        { name: 'API_PUBLIC_URL', value: publicApiUrl },
      ]
        .filter(({ value }) => !value?.trim())
        .map(({ name }) => name);
      throw new ServiceUnavailableException(
        `Email verification is not configured. Missing: ${missingConfiguration.join(', ')}.`,
      );
    }

    let verificationUrl: URL;
    try {
      const baseUrl = new URL(publicApiUrl);
      if (baseUrl.protocol !== 'https:' && !(baseUrl.protocol === 'http:' && baseUrl.hostname === 'localhost')) {
        throw new Error('API_PUBLIC_URL must use HTTPS, except for localhost development.');
      }
      verificationUrl = new URL('/auth/verify-email', baseUrl);
      verificationUrl.searchParams.set('token', token);
    } catch (error) {
      this.logger.error('Invalid API_PUBLIC_URL configuration.', error);
      throw new ServiceUnavailableException('Email verification is not configured.');
    }

    const safeName = escapeHtml(name);
    const url = verificationUrl.toString();

    let response: Response;
    try {
      response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [email],
          subject: 'Verify your Money Splitzy email',
          html: `<p>Hi ${safeName},</p><p>Verify your email address to finish creating your Money Splitzy account.</p><p><a href="${url}">Verify email address</a></p><p>This link expires in 24 hours. If you did not create an account, you can ignore this email.</p>`,
          text: `Hi ${name},\n\nVerify your email address to finish creating your Money Splitzy account:\n${url}\n\nThis link expires in 24 hours. If you did not create an account, you can ignore this email.`,
        }),
      });
    } catch (error) {
      this.logger.error('Resend email request failed.', error);
      throw new ServiceUnavailableException('Could not send the verification email. Please try again.');
    }

    if (!response.ok) {
      this.logger.error(`Resend rejected the verification email with status ${response.status}.`);
      throw new ServiceUnavailableException('Could not send the verification email. Please try again.');
    }
  }
}
