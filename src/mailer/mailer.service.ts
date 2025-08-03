import { Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import { AllConfigType } from '../config/config.type';

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter | null;
  constructor(private readonly configService: ConfigService) {
    // Get mail configuration
    const mailUser = this.configService.get('app.mail.user');
    const mailPassword = this.configService.get('app.mail.password');
    const mailHost = this.configService.get('app.mail.host') || 'smtp.gmail.com';
    const mailPort = this.configService.get('app.mail.port') || 587;
    const mailSecure = this.configService.get('app.mail.secure') || false;

    console.log('MailerService config:', {
      host: mailHost,
      port: mailPort,
      secure: mailSecure,
      user: mailUser,
      hasPassword: !!mailPassword,
    });

    // Check if credentials are provided
    if (!mailUser || !mailPassword) {
      console.warn('⚠️ Mail credentials not provided. Email functionality will be disabled.');
      console.warn('To enable email, set MAIL_USER and MAIL_PASSWORD environment variables.');
      this.transporter = null;
      return;
    }

    // Use Gmail for production
    const mailConfig = {
      service: 'gmail',
      host: mailHost,
      port: mailPort,
      secure: mailSecure,
      auth: {
        user: mailUser,
        pass: mailPassword,
      },
    };

    this.transporter = nodemailer.createTransport(mailConfig);

    // Test connection
    this.testConnection();
  }

  private async testConnection() {
    try {
      if (!this.transporter) {
        console.log('⚠️ Skipping SMTP connection test - no credentials provided');
        return;
      }

      console.log('Testing SMTP connection...');
      await this.transporter.verify();
      console.log('✅ SMTP connection successful');
    } catch (error) {
      console.error('❌ SMTP connection failed:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        command: error.command,
      });
    }
  }

  async sendMail(mailOptions: {
    to: string | string[];
    subject: string;
    templatePath: string;
    context: Record<string, any>;
    html?: string;
  }): Promise<any> {
    try {
      if (!this.transporter) {
        console.warn('⚠️ Cannot send email - transporter not initialized (missing credentials)');
        throw new Error('Email service not configured - missing credentials');
      }

      console.log('=== MAILER SERVICE SEND START ===');
      console.log('Sending email with options:', {
        to: mailOptions.to,
        subject: mailOptions.subject,
        templatePath: mailOptions.templatePath,
        hasContext: !!mailOptions.context,
        hasHtml: !!mailOptions.html,
      });

      // Read and compile template
      let html = '';
      if (mailOptions.templatePath && !mailOptions.html) {
        console.log('Reading template file:', mailOptions.templatePath);
        const templateContent = await readFile(mailOptions.templatePath, 'utf-8');
        const template = Handlebars.compile(templateContent);
        html = template(mailOptions.context);
        console.log('Template compiled successfully');
      }

      const emailOptions = {
        to: mailOptions.to,
        subject: mailOptions.subject,
        from: `SmartChat <${this.configService.get('app.mail.defaultEmail', { infer: true }) || 'noreply@smartchat.com'}>`,
        html: mailOptions.html ? mailOptions.html : html,
      };

      console.log('Final email options:', {
        to: emailOptions.to,
        subject: emailOptions.subject,
        from: emailOptions.from,
        hasHtml: !!emailOptions.html,
      });

      console.log('Sending email via transporter...');
      const result = await this.transporter.sendMail(emailOptions);
      console.log('Email result:', result);

      console.log('=== MAILER SERVICE SEND END ===');
      return result;
    } catch (error) {
      console.error('Error in MailerService.sendMail:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}
