import { ServiceUnavailableException } from '@nestjs/common';
import { EmailService } from './email.service';

describe('EmailService', () => {
  const originalEnvironment = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    API_PUBLIC_URL: process.env.API_PUBLIC_URL,
  };
  let fetchRequest: jest.SpyInstance;
  let service: EmailService;

  beforeEach(() => {
    process.env.RESEND_API_KEY = 'test-api-key';
    process.env.EMAIL_FROM = 'Money Splitzy <no-reply@example.com>';
    process.env.API_PUBLIC_URL = 'https://api.example.com';
    fetchRequest = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);
    service = new EmailService();
  });

  afterEach(() => {
    fetchRequest.mockRestore();
    for (const [key, value] of Object.entries(originalEnvironment)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it('sends a safely encoded verification link through Resend', async () => {
    await service.sendVerificationEmail(
      'person@example.com',
      '<Person & Friends>',
      'a'.repeat(43),
    );

    expect(fetchRequest).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-api-key',
        }),
      }),
    );
    const requestBody = JSON.parse(fetchRequest.mock.calls[0][1].body);
    expect(requestBody.to).toEqual(['person@example.com']);
    expect(requestBody.html).toContain('&lt;Person &amp; Friends&gt;');
    expect(requestBody.html).toContain(
      'https://api.example.com/auth/verify-email?token=' + 'a'.repeat(43),
    );
  });

  it('reports provider failures instead of pretending the email was sent', async () => {
    fetchRequest.mockResolvedValue({ ok: false, status: 422 });

    await expect(
      service.sendVerificationEmail('person@example.com', 'Person', 'a'.repeat(43)),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
