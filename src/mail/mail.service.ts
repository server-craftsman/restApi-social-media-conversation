import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailData } from './interfaces/mail-data.interface';
import { MailerService } from '../mailer/mailer.service';
import * as path from 'path';
import { AllConfigType } from '../config/config.type';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService<AllConfigType>,
  ) { }

  async userSignUp(mailData: MailData<{ hash: string }>): Promise<void> {
    console.log('=== MAIL SERVICE USER SIGNUP START ===');
    console.log('MailService.userSignUp called with:', {
      to: mailData.to,
      hash: mailData.data.hash,
    });

    try {
      const emailConfirmTitle = 'Confirm Email';
      const text1 = 'Please confirm your email address by clicking the button below:';
      const text2 = 'If you did not create an account, no further action is required.';
      const text3 = 'Thank you for using our service!';

      console.log('Getting frontend domain...');
      const frontendDomain = this.configService.getOrThrow('app.frontendDomain', {
        infer: true,
      });
      console.log('Frontend domain:', frontendDomain);

      const url = new URL(frontendDomain + '/confirm-email');
      url.searchParams.set('hash', mailData.data.hash);

      console.log('Verification URL:', url.toString());

      const templatePath = path.join(
        process.cwd(),
        'src',
        'mail',
        'mail-templates',
        'activation.hbs',
      );
      console.log('Template path:', templatePath);

      console.log('Calling MailerService.sendMail...');
      console.log('MailerService instance:', !!this.mailerService);

      await this.mailerService.sendMail({
        to: mailData.to,
        subject: emailConfirmTitle,
        text: `${url.toString()} ${emailConfirmTitle}`,
        templatePath,
        context: {
          title: emailConfirmTitle,
          url: url.toString(),
          actionTitle: emailConfirmTitle,
          app_name: this.configService.get('app.name', { infer: true }),
          text1,
          text2,
          text3,
        },
      });

      console.log('✅ MailService.userSignUp completed successfully');
      console.log('=== MAIL SERVICE USER SIGNUP END ===');
    } catch (error) {
      console.error('❌ Error in MailService.userSignUp:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  async forgotPassword(
    mailData: MailData<{ hash: string; tokenExpires: number }>,
  ): Promise<void> {
    const resetPasswordTitle = 'Reset Password';
    const text1 = 'You are receiving this email because we received a password reset request for your account.';
    const text2 = 'Click the button below to reset your password:';
    const text3 = 'If you did not request a password reset, no further action is required.';
    const text4 = 'This password reset link will expire in 60 minutes.';

    const url = new URL(
      this.configService.getOrThrow('app.frontendDomain', {
        infer: true,
      }) + '/password-change',
    );
    url.searchParams.set('hash', mailData.data.hash);
    url.searchParams.set('expires', mailData.data.tokenExpires.toString());

    await this.mailerService.sendMail({
      to: mailData.to,
      subject: resetPasswordTitle,
      text: `${url.toString()} ${resetPasswordTitle}`,
      templatePath: path.join(
        process.cwd(),
        'src',
        'mail',
        'mail-templates',
        'reset-password.hbs',
      ),
      context: {
        title: resetPasswordTitle,
        url: url.toString(),
        actionTitle: resetPasswordTitle,
        app_name: this.configService.get('app.name', {
          infer: true,
        }),
        text1,
        text2,
        text3,
        text4,
      },
    });
  }

  async confirmNewEmail(mailData: MailData<{ hash: string }>): Promise<void> {
    const emailConfirmTitle = 'Confirm New Email';
    const text1 = 'Please confirm your new email address by clicking the button below:';
    const text2 = 'If you did not request this change, no further action is required.';
    const text3 = 'Thank you for using our service!';

    const url = new URL(
      this.configService.getOrThrow('app.frontendDomain', {
        infer: true,
      }) + '/confirm-new-email',
    );
    url.searchParams.set('hash', mailData.data.hash);

    await this.mailerService.sendMail({
      to: mailData.to,
      subject: emailConfirmTitle,
      text: `${url.toString()} ${emailConfirmTitle}`,
      templatePath: path.join(
        process.cwd(),
        'src',
        'mail',
        'mail-templates',
        'confirm-new-email.hbs',
      ),
      context: {
        title: emailConfirmTitle,
        url: url.toString(),
        actionTitle: emailConfirmTitle,
        app_name: this.configService.get('app.name', { infer: true }),
        text1,
        text2,
        text3,
      },
    });
  }
}
