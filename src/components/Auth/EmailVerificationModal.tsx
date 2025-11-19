import React, { useState, useEffect } from 'react';
import { X, Mail, Loader2, RotateCcw } from 'lucide-react';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onVerificationSuccess: (token: string, refreshToken: string, user: any) => void;
}

const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  onClose,
  email,
  onVerificationSuccess
}) => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast.error('Please enter a 6-digit verification code');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await authAPI.verifyEmail(email, otp);
      
      // Store token and user data
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('refresh_token', response.refreshToken);
      localStorage.setItem('user_data', JSON.stringify(response.user));
      
      toast.success('Email verified successfully!');
      onVerificationSuccess(response.token, response.refreshToken, response.user);
      onClose();
    } catch (error: any) {
      console.error('Verification error:', error);
      const message = error.response?.data?.message || 'Verification failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    
    try {
      await authAPI.sendVerificationOTP(email);
      toast.success('Verification code sent to your email');
      setTimeLeft(300); // Reset timer
      setCanResend(false);
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      const message = error.response?.data?.message || 'Failed to resend verification code';
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md relative animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-neutral-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            Verify Your Email
          </h2>
          <p className="text-neutral-600 mb-4">
            We've sent a 6-digit verification code to
          </p>
          <p className="text-primary-600 font-semibold">{email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={otp}
              onChange={handleOtpChange}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
              placeholder="000000"
              maxLength={6}
              required
            />
          </div>

          <div className="text-center">
            {timeLeft > 0 ? (
              <p className="text-sm text-neutral-500">
                Resend code in {formatTime(timeLeft)}
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={isResending}
                className="text-primary-600 hover:text-primary-700 font-medium text-sm disabled:opacity-50 flex items-center justify-center mx-auto"
              >
                {isResending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <RotateCcw className="w-4 h-4 mr-2" />
                )}
                Resend Code
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="w-full py-3 px-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : null}
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-600">
            Didn't receive the email? Check your spam folder or{' '}
            <button
              onClick={handleResendOTP}
              disabled={!canResend || isResending}
              className="text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
            >
              resend
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationModal;
