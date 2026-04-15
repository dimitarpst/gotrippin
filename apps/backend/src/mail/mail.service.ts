import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

const BREVO_SEND_URL = 'https://api.brevo.com/v3/smtp/email';

export interface SendTransactionalEmailParams {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  isConfigured(): boolean {
    const key = this.configService.get<string>('BREVO_API_KEY');
    const sender = this.configService.get<string>('BREVO_SENDER_EMAIL');
    return Boolean(key?.trim() && sender?.trim());
  }

  async sendTransactionalEmail(params: SendTransactionalEmailParams): Promise<void> {
    const apiKey = this.configService.get<string>('BREVO_API_KEY')?.trim();
    const senderEmail = this.configService.get<string>('BREVO_SENDER_EMAIL')?.trim();
    const senderName = this.configService.get<string>('BREVO_SENDER_NAME')?.trim() ?? 'gotrippin';

    if (!apiKey || !senderEmail) {
      this.logger.error(
        'Transactional email skipped: set BREVO_API_KEY and BREVO_SENDER_EMAIL to enable outbound mail.',
      );
      throw new ServiceUnavailableException(
        'Email is not configured on this server. Set BREVO_API_KEY and BREVO_SENDER_EMAIL.',
      );
    }

    try {
      await firstValueFrom(
        this.httpService.post(
          BREVO_SEND_URL,
          {
            sender: { name: senderName, email: senderEmail },
            to: [{ email: params.to }],
            subject: params.subject,
            htmlContent: params.htmlContent,
            textContent: params.textContent,
          },
          {
            headers: {
              accept: 'application/json',
              'content-type': 'application/json',
              'api-key': apiKey,
            },
            timeout: 20_000,
          },
        ),
      );
    } catch (err) {
      const ax = err instanceof AxiosError ? err : null;
      const status = ax?.response?.status;
      const body =
        ax?.response?.data !== undefined
          ? typeof ax.response.data === 'string'
            ? ax.response.data
            : JSON.stringify(ax.response.data)
          : err instanceof Error
            ? err.message
            : String(err);
      this.logger.error(`Brevo send failed (status=${status ?? 'n/a'}): ${body}`);
      throw new ServiceUnavailableException('Failed to send email. Try again later.');
    }
  }
}
