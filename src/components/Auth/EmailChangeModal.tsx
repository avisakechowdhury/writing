import React, { useState, useEffect } from 'react';
import { X, Mail, Loader2, RotateCcw } from 'lucide-react';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface EmailChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
  onSuccess?: () => void;
}

const EmailChangeModal: React.FC<EmailChangeModalProps> = ({
  isOpen,
  onClose,
  currentEmail,
  onSuccess
}) => {
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (!isOpen || step !== 'verify') return;

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
  }, [isOpen, step]);

  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail) {
      toast.error('Please enter a new email address');
      return;
    }

    if (newEmail.toLowerCase() === currentEmail.toLowerCase()) {
      toast.error('New email must be different from current email');
      return;
    }

    setIsLoading(true);
    
    try {
      await authAPI.requestEmailChange(newEmail);
      toast.success('Verification code sent to your new email address');
      setStep('verify');
      setTimeLeft(300);
      setCanResend(false);
    } catch (error: any) {
      console.error('Request email change error:', error);
      const message = error.response?.data?.message || 'Failed to send verification code. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  const handleVerifyEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast.error('Please enter a 6-digit verification code');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await authAPI.verifyEmailChange(otp);
      
      toast.success('Email changed successfully!');
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Reset form
      setNewEmail('');
      setOtp('');
      setStep('request');
      onClose();
    } catch (error: any) {
      console.error('Verify email change error:', error);
      const message = error.response?.data?.message || 'Verification failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    
    try {
      await authAPI.requestEmailChange(newEmail);
      toast.success('Verification code sent to your email');
      setTimeLeft(300);
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

  const handleClose = () => {
    if (!isLoading) {
      setNewEmail('');
      setOtp('');
      setStep('request');
      setTimeLeft(300);
      setCanResend(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md relative animate-scale-in">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 hover:bg-neutral-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            {step === 'request' ? 'Change Email Address' : 'Verify New Email'}
          </h2>
          <p className="text-neutral-600">
            {step === 'request' 
              ? 'Enter your new email address. We\'ll send a verification code to confirm.'
              : `We've sent a 6-digit verification code to ${newEmail}`
            }
          </p>
        </div>

        {step === 'request' ? (
          <form onSubmit={handleRequestEmailChange} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Current Email
              </label>
              <input
                type="email"
                value={currentEmail}
                disabled
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                New Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your new email address"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : null}
              {isLoading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyEmailChange} className="space-y-6">
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
              {isLoading ? 'Verifying...' : 'Verify & Change Email'}
            </button>

            <button
              type="button"
              onClick={() => setStep('request')}
              className="w-full py-2 text-sm text-neutral-600 hover:text-neutral-700"
            >
              Back to email entry
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default EmailChangeModal;

