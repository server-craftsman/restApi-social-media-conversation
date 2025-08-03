import { Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import { AllConfigType } from '../config/config.type';

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter;
  constructor(private readonly configService: ConfigService<AllConfigType>) {
    // Use Gmail for production
    const mailConfig = {
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: configService.get('mail.user', { infer: true }),
        pass: configService.get('mail.password', { infer: true }),
      },
    };

    console.log('MailerService config:', {
      service: mailConfig.service,
      host: mailConfig.host,
      port: mailConfig.port,
      user: mailConfig.auth.user,
      secure: mailConfig.secure,
    });

    this.transporter = nodemailer.createTransport(mailConfig);

    // Test connection
    this.testConnection();
  }

  private async testConnection() {
    try {
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

  async sendMail({
    templatePath,
    context,
    ...mailOptions
  }: nodemailer.SendMailOptions & {
    templatePath: string;
    context: Record<string, unknown>;
  }): Promise<void> {
    console.log('=== MAILER SERVICE SENDMAIL START ===');
    console.log('MailerService.sendMail called with:', {
      to: mailOptions.to,
      subject: mailOptions.subject,
      templatePath,
      contextKeys: Object.keys(context),
    });

    try {
      let html: string | undefined;
      if (templatePath) {
        try {
          console.log('Reading template file:', templatePath);
          const template = await readFile(templatePath, 'utf-8');
          console.log('Template file read successfully, length:', template.length);

          console.log('Compiling template with context:', context);
          html = Handlebars.compile(template, {
            strict: true,
          })(context);
          console.log('Template compiled successfully, HTML length:', html.length);
        } catch (error) {
          console.error(`❌ Error reading template file: ${templatePath}`, error);
          // Fallback to plain text if template fails
          html = `
            <html>
              <body>
                <h1>${context.title || 'Email'}</h1>
                <p>${context.text1 || ''}</p>
                <p>${context.text2 || ''}</p>
                <p>${context.text3 || ''}</p>
                <a href="${context.url || '#'}">${context.actionTitle || 'Click here'}</a>
              </body>
            </html>
          `;
          console.log('Using fallback HTML template');
        }
      }

      try {
        console.log('Preparing email options...');
        const emailOptions = {
          ...mailOptions,
          from: mailOptions.from
            ? mailOptions.from
            : `"${this.configService.get('mail.defaultName', {
              infer: true,
            })}" <${this.configService.get('mail.defaultEmail', {
              infer: true,
            })}>`,
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

        console.log('✅ Email sent successfully');
        console.log('=== MAILER SERVICE SENDMAIL END ===');
      } catch (error) {
        console.error('❌ Error sending email:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          command: error.command,
          response: error.response,
          responseCode: error.responseCode,
        });
        throw new Error(`Failed to send email: ${error.message}`);
      }
    } catch (error) {
      console.error('❌ Error in MailerService.sendMail:', error);
      throw error;
    }
  }
}
