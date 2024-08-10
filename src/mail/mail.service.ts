import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

@Injectable()
export class MailService {
  private apiUrl: string = 'https://api.brevo.com/v3/smtp/email';
  private apiKey: string = process.env.BREVO_API_KEY;

  constructor() {
    if (!this.apiKey) {
      throw new Error('BREVO_API_KEY is not defined in environment variables');
    }
  }

  private async loadTemplate(templateName: string, data: any): Promise<string> {
    const templatePath = path.join(
      __dirname,
      '../../mailTemplates',
      `${templateName}.html`,
    );

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`);
    }

    let template = fs.readFileSync(templatePath, 'utf-8');

    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      template = template.replace(regex, value.toString());
    }

    return template;
  }

  async sendTemplatedEmail(
    emails: string[],
    subject: string,
    templateName: string,
    templateData: any,
  ) {
    try {
      const htmlContent = await this.loadTemplate(templateName, templateData);

      const response = await axios.post(
        this.apiUrl,
        {
          sender: { email: 'admin@epiccube.online' },
          to: emails.map((email) => ({ email })),
          subject: subject,
          htmlContent: htmlContent,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.apiKey,
          },
        },
      );

      console.log('Message sent: %s', response.data.messageId);
      return response.data;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  //
}
