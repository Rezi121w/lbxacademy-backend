import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  GetSendQuotaCommand,
  SendTemplatedEmailCommand,
  SESClient,
} from '@aws-sdk/client-ses';
import * as dotenv from 'dotenv';
import { Cron } from '@nestjs/schedule';

dotenv.config();

@Injectable()
export class MailService implements OnModuleInit {
  private readonly sesClient: SESClient;
  private sentMessagesCount: number = 999;
  private freeLimit = 195;

  constructor() {
    this.sesClient = new SESClient({
      region: process.env.AMAZON_MAIL_REGION,
      credentials: {
        accessKeyId: process.env.AWS_MAIL_ACCESS,
        secretAccessKey: process.env.AWS_MAIL_SECRET,
      },
    });
  }
  async onModuleInit() {
    console.log('Initializing limits...');
    await this.initLimits();
    console.log('Limits initialized:', this.sentMessagesCount);
  }

  async sendTemplatedEmail(
    templateName: string,
    emails: string[],
    templateData: any,
  ) {
    const params = {
      Destination: { ToAddresses: emails },
      Template: templateName,
      TemplateData: JSON.stringify(templateData),
      Source: 'admin@epiccube.online',
    };

    if (this.sentMessagesCount < this.freeLimit) {
      this.sentMessagesCount++;

      const command = new SendTemplatedEmailCommand(params);
      await this.sesClient.send(command);
    }

    return true;
  }

  private async getSendQuota() {
    const command = new GetSendQuotaCommand({});
    try {
      return await this.sesClient.send(command);
    } catch (error) {
      console.error('Error fetching send quota:', error);
    }
  }

  @Cron('5 0 * * *')
  private async initLimits() {
    const response = await this.getSendQuota();

    this.sentMessagesCount = Number(response ? response.SentLast24Hours : 200);
  }
}
