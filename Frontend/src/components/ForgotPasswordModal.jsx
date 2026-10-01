import React, { useState, useEffect, useRef } from 'react';
import { X, Eye, EyeOff, Check, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useToast } from './CustomToast';

export default function ForgotPasswordModal({ isOpen, onClose, email }) {
  const [step, setStep] = useState('otp'); // 'otp' | 'reset'
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  
  // Password Reset State
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const otpInputRefs = useRef([]);

  // Timer logic
  useEffect(() => {
    let interval;
    if (isOpen && step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, step, timer]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setStep('otp');
      setTimer(30);
      setOtp(['', '', '', '', '', '']);
      setPasswords({ newPassword: '', confirmPassword: '' });
    }
  }, [isOpen]);

  const handleOtpChange = (index, value) => {
    // Only allow one digit
    const digit = value.slice(-1);
    if (isNaN(digit)) return;

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-focus next input
    if (digit && index < 5) {
      otpInputRefs.current[index + 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6); // Get first 6 chars
    if (!/^\d+$/.test(pastedData)) return; // Only allow numbers

    const newOtp = [...otp];
    const digits = pastedData.split('');
    
    digits.forEach((digit, i) => {
      if (i < 6) newOtp[i] = digit;
    });

    setOtp(newOtp);

    // Focus the last filled input or the last input
    const nextIndex = Math.min(digits.length, 5);
    otpInputRefs.current[nextIndex].focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1].focus();
    }
  };


  const handleResendOtp = async () => {
    if (timer > 0) return;
    
    setIsLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      await axios.post(`${backendUrl}/api/auth/check-user`, { emailId: email });
      setTimer(30);
      toast.success('OTP Resent successfully');
    } catch (err) {
      toast.error('Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    
    setIsLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      await axios.post(`${backendUrl}/api/auth/verify-otp`, {
        emailId: email,
        otp: enteredOtp
      });
      toast.success('OTP Verified Successfully');
      setStep('reset');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const validatePassword = (password) => {
    return {
      length: password.length >= 8 && password.length <= 16,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };
  };

  const criteria = validatePassword(passwords.newPassword);

  const handleResetPassword = async () => {
    if (!criteria.length || !criteria.upper || !criteria.lower || !criteria.number || !criteria.special) {
      toast.error("Password does not meet requirements");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    setIsLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      await axios.post(`${backendUrl}/api/auth/reset-password`, {
        emailId: email,
        otp: otp.join(''),
        newPassword: passwords.newPassword
      });
      toast.success("Password Reset Successfully");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };


  const handleClose = async () => {
    if (email) {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
        axios.post(`${backendUrl}/api/auth/clear-otp`, { emailId: email });
      } catch (err) {
        console.error('Error clearing OTP:', err);
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-[1vw] bg-black/60 backdrop-blur-sm transition-opacity">
      <div 
        className="bg-white rounded-[1.5vw] w-full max-w-[40vw] p-[1.5vw] relative shadow-2xl animate-in fade-in zoom-in duration-300"
      >

        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-[1vw] right-[1vw] p-[0.4vw] rounded-full hover:bg-gray-100 transition-colors border border-red-200"
        >
          <X className="w-[1.25vw] h-[1.25vw] text-red-500" />
        </button>


        {step === 'otp' ? (
          /* OTP Section */
          <form 
            onSubmit={(e) => { e.preventDefault(); handleVerifyOtp(); }}
            className="flex flex-col items-center justify-center py-[1.5vw] text-center"
          >
            <h2 className="text-[2vw] font-normal mb-[1.5vw] text-black">Forgot Password ?</h2>
            
            <p className="text-gray-600 mb-[0.25vw] font-medium text-[0.875vw]">
              We have sent One Time Password (OTP) via email to this Account
            </p>
            <p className="text-[#4c5add] font-semibold text-[1vw] mb-[2vw]">
              {email || 'example@gmail.com'}
            </p>

            <div className="flex gap-[0.75vw] mb-[0.75vw]">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpInputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-[3.2vw] h-[3.2vw] border-[0.1vw] border-[#373d8b]/40 rounded-[0.5vw] text-center text-[1.25vw] font-semibold text-[#373d8b] focus:border-[#4c5add] focus:ring-4 focus:ring-[#4c5add]/10 outline-none transition-all"
                />


              ))}
            </div>

            <div className="text-[#373d8b] font-medium mb-[2vw] text-[0.875vw]">
              {timer > 0 ? (
                <span>Resent in <span className="font-bold">00.{timer.toString().padStart(2, '0')}</span></span>
              ) : (
                <button 
                  type="button"
                  onClick={handleResendOtp}
                  className="text-[#4c5add] font-bold hover:underline cursor-pointer"
                >
                  Resend OTP
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-[14vw] py-[0.75vw] bg-[#4c5add] hover:bg-[#3f4bc0] text-white rounded-full font-semibold text-[1vw] shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-[0.5vw]">
                  <Loader2 className="w-[1.25vw] h-[1.25vw] animate-spin" />
                  <span>Verifying...</span>
                </div>
              ) : (
                "Verify OTP"
              )}
            </button>

          </form>
        ) : (
          /* Reset Password Section */
          <form 
            onSubmit={(e) => { e.preventDefault(); handleResetPassword(); }}
            className="py-[1vw] px-[0.5vw]"
          >
            <h2 className="text-[2vw] font-normal text-center mb-[2vw] text-black">Reset your Password</h2>
            
            <div className="flex flex-col gap-[1.5vw] justify-center max-w-[30vw] mx-auto">
              {/* Inputs */}
              <div className="space-y-[1.25vw]">
                <div className="space-y-[0.5vw]">
                  <label className="text-[0.875vw] font-semibold ml-[0.25vw] text-black">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPass ? "text" : "password"}
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                      className="w-full px-[1.25vw] py-[0.75vw] rounded-full border border-[#373d8b]/30 text-gray-800 focus:border-[#4c5add] focus:ring-4 focus:ring-[#4c5add]/10 outline-none transition-all placeholder-gray-400 text-[0.875vw]"
                      placeholder="Create your new Password"
                    />
                    <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-[0.75vw] top-1/2 -translate-y-1/2 text-[#373d8b]"
                    >
                        {showNewPass ? <EyeOff size="1.125vw"/> : <Eye size="1.125vw"/>}
                    </button>
                  </div>
                </div>

                <div className="space-y-[0.5vw]">
                  <label className="text-[0.875vw] font-semibold ml-[0.25vw] text-black">Re-Enter Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? "text" : "password"}
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                      className="w-full px-[1.25vw] py-[0.75vw] rounded-full border border-[#373d8b]/30 text-gray-800 focus:border-[#4c5add] focus:ring-4 focus:ring-[#4c5add]/10 outline-none transition-all placeholder-gray-400 text-[0.875vw]"
                      placeholder="Re - Enter your Password"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-[0.75vw] top-1/2 -translate-y-1/2 text-[#373d8b]"
                    >
                        {showConfirmPass ? <EyeOff size="1.125vw"/> : <Eye size="1.125vw"/>}
                    </button>
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div className="space-y-[0.75vw] pt-[0.25vw] bg-transparent">
                  <div className="grid grid-cols-1 gap-[0.5vw]">
                    <RequirementItemV2 met={criteria.length} text="Min 8 - Max 16 chars" />
                    <RequirementItemV2 met={criteria.upper} text="At least 1 uppercase (A-Z)" />
                    <RequirementItemV2 met={criteria.lower} text="At least 1 lowercase (a-z)" />
                    <RequirementItemV2 met={criteria.number} text="At least 1 number (0-9)" />
                    <RequirementItemV2 met={criteria.special} text="At least 1 special char" />
                  </div>
              </div>
            </div>

            <div className="flex justify-center mt-[1.25vw]">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-[16vw] py-[0.75vw] bg-[#4c5add] hover:bg-[#3f4bc0] text-white rounded-full font-semibold text-[1vw] shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-[0.5vw]">
                      <Loader2 className="w-[1.25vw] h-[1.25vw] animate-spin" />
                      <span>Resetting...</span>
                    </div>
                  ) : (
                    "Reset Password"
                  )}
                </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}

function RequirementItemV2({ met, text }) {
    return (
      <div className="flex items-center gap-[0.5vw]">
        {met ? (
          <Check className="w-[1vw] h-[1vw] text-green-500 shrink-0" strokeWidth={2.5} />
        ) : (
          <Check className="w-[1vw] h-[1vw] text-red-500 shrink-0" strokeWidth={2.5} /> 
        )}
         <span className={`text-[0.75vw] font-medium ${met ? 'text-gray-700' : 'text-gray-500'}`}>{text}</span>
      </div>
    );
}
