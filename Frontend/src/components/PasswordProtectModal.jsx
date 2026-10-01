import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { useToast } from './CustomToast';

const PasswordProtectModal = ({ v_id, shareId, onUnlock }) => {
  const toast = useToast();

  const [step, setStep] = useState('login'); // 'login' | 'otp' | 'newPassword'
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // OTP flow states
  const [otpValues, setOtpValues] = useState(['', '', '', '']);
  const [resendTimer, setResendTimer] = useState(23);
  const [otpError, setOtpError] = useState('');
  const otpRefs = useRef([]);

  // New Password states
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showNewPasswordInput, setShowNewPasswordInput] = useState(false);
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showConfirmPasswordInput, setShowConfirmPasswordInput] = useState(false);
  const [newFormError, setNewFormError] = useState('');
  const [isSavingNewPassword, setIsSavingNewPassword] = useState(false);

  // Timer countdown effect for OTP
  useEffect(() => {
    let timer;
    if (step === 'otp' && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendTimer]);

  const getUserEmail = () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return '';
      if (typeof storedUser === 'string') {
        if (storedUser.startsWith('{') || storedUser.startsWith('[')) {
          const userObj = JSON.parse(storedUser);
          return userObj?.emailId || userObj?.email || userObj?.userEmail || '';
        }
        return storedUser;
      }
      return '';
    } catch (e) {
      return '';
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const trimmedKey = passwordInput.trim();
    if (!trimmedKey) {
      setPasswordError("Please enter password.");
      return;
    }

    setPasswordError('');
    setIsSubmittingPassword(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      
      let isVerified = false;

      // Try verify-credential first
      try {
        const res = await axios.post(`${backendUrl}/api/flipbook/verify-credential`, {
          v_id: v_id || shareId,
          input: trimmedKey,
          mode: 'password'
        });
        if (res.data && res.data.success) {
          isVerified = true;
        }
      } catch (err) {
        // Fallback to verify-password endpoint if shareId exists
        if (shareId) {
          try {
            const res2 = await axios.post(`${backendUrl}/api/flipbook/verify-password/${shareId}`, {
              accessKey: trimmedKey,
              password: trimmedKey
            });
            if (res2.data && res2.data.success) {
              isVerified = true;
            }
          } catch (e2) {
            // failed
          }
        }
      }

      if (isVerified) {
        if (v_id) sessionStorage.setItem(`unlocked_${v_id}`, 'true');
        if (shareId) sessionStorage.setItem(`unlocked_${shareId}`, 'true');
        if (onUnlock) onUnlock();
      } else {
        setPasswordError("Invalid password.");
      }
    } catch (err) {
      console.error("Password verification error:", err);
      setPasswordError("Invalid password.");
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleSendOtp = async () => {
    setPasswordError('');
    setIsSubmittingPassword(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const emailId = getUserEmail();
      const currentVid = v_id || shareId;

      if (!emailId) {
        setPasswordError("Logged in user email not found.");
        return;
      }

      await axios.post(`${backendUrl}/api/flipbook/send-visibility-otp`, { emailId, v_id: currentVid });
      setResendTimer(23);
      setOtpValues(['', '', '', '']);
      setOtpError('');
      setStep('otp');
    } catch (err) {
      console.error("Failed to send OTP:", err);
      setPasswordError(err.response?.data?.message || "Failed to send verification code.");
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleOtpChange = (val, idx) => {
    const char = val.slice(-1);
    const newOtp = [...otpValues];
    newOtp[idx] = char;
    setOtpValues(newOtp);
    if (char && idx < 3) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otpValues[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{4}$/.test(pasted)) {
      const digits = pasted.split('');
      setOtpValues(digits);
      otpRefs.current[3]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otpValues.join('').trim();
    if (!code || code.length < 4) {
      setOtpError('Please enter the verification code.');
      return;
    }

    setOtpError('');
    setIsSubmittingPassword(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const emailId = getUserEmail();
      const currentVid = v_id || shareId;

      await axios.post(`${backendUrl}/api/flipbook/verify-visibility-otp`, {
        emailId,
        v_id: currentVid,
        otp: code
      });

      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setNewFormError('');
      setStep('newPassword');
    } catch (err) {
      console.error("OTP verification error:", err);
      setOtpError(err.response?.data?.message || "Invalid OTP code.");
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleSaveNewPassword = async () => {
    const newKey = newPasswordInput.trim();
    const confirmKey = confirmPasswordInput.trim();

    if (!newKey) {
      setNewFormError("Please enter your new password.");
      return;
    }

    if (newKey !== confirmKey) {
      setNewFormError("Passwords do not match.");
      return;
    }

    setNewFormError('');
    setIsSavingNewPassword(true);
    try {
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      const emailId = user?.emailId || user?.email;
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const currentVid = v_id || shareId;

      const updatedShare = {
        access: 'Password Protect',
        password: newKey,
        accessKey: newKey,
        isPasswordSaved: true
      };

      const payload = {
        emailId,
        v_id: currentVid,
        bookName: currentVid,
        share: updatedShare,
        Customized_Settings: {
          Visibility: updatedShare
        }
      };

      await axios.post(`${backendUrl}/api/flipbook/update-settings`, payload);

      toast?.success?.("Password updated successfully!");

      if (v_id) sessionStorage.setItem(`unlocked_${v_id}`, 'true');
      if (shareId) sessionStorage.setItem(`unlocked_${shareId}`, 'true');
      if (onUnlock) onUnlock();
    } catch (err) {
      console.error("Update settings error:", err);
      setNewFormError(err.response?.data?.message || "Failed to update password.");
    } finally {
      setIsSavingNewPassword(false);
    }
  };

  return (
    <div className="absolute inset-0 z-[99999] w-full h-full flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs text-slate-900 font-sans p-[1vw] select-none">
      <div className="bg-white rounded-[1.2vw] p-[1.4vw] shadow-[0_20px_50px_rgba(0,0,0,0.12)] w-[25vw] min-w-[320px] max-w-[420px] relative animate-in fade-in zoom-in-95 duration-200 border border-slate-100/80">
        
        {/* Header Row matching Visibility.jsx */}
        <div className="flex items-center justify-between mb-[0.4vw]">
          <div className="flex items-center flex-1 pr-[0.5vw]">
            <h2 className="text-[1vw] font-bold text-gray-900 tracking-tight whitespace-nowrap">
              {step === 'login' && 'Protected Flipbook'}
              {step === 'otp' && 'Verification Code'}
              {step === 'newPassword' && 'Change Password'}
            </h2>
            <div className="h-[1px] bg-gray-200 flex-1 ml-[0.6vw] mt-[0.1vw]"></div>
          </div>
        </div>

        {/* STEP 1: ENTER PASSWORD */}
        {step === 'login' && (
          <>
            <p className="text-[0.7vw] text-gray-400 font-normal mt-[0.2vw]">
              Enter password to view this flipbook.
            </p>

            <form onSubmit={handlePasswordSubmit} className="mt-[1vw] space-y-[0.35vw]">
              <label className="text-[0.78vw] font-semibold text-gray-900 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  placeholder="Enter password..."
                  className="w-full bg-white border border-gray-300 rounded-[0.5vw] px-[0.8vw] py-[0.5vw] text-[0.78vw] font-medium text-gray-800 focus:outline-none focus:border-[#5551FF] focus:ring-2 focus:ring-[#5551FF]/10 transition-all pr-[2.2vw] shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-[0.7vw] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <Icon
                    icon={showPassword ? "lucide:eye" : "lucide:eye-off"}
                    className="w-[1vw] h-[1vw] min-w-[14px] min-h-[14px]"
                  />
                </button>
              </div>

              {passwordError && (
                <p className="text-[0.7vw] text-red-500 font-medium pt-[0.1vw]">{passwordError}</p>
              )}

              <div className="flex justify-end pt-[0.1vw]">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="text-[0.7vw] font-medium text-[#4f46e5] underline hover:text-[#4338ca] cursor-pointer"
                >
                  Forgot Password ?
                </button>
              </div>

              <div className="pt-[0.8vw]">
                <button
                  type="submit"
                  disabled={isSubmittingPassword}
                  className="w-full bg-[#5551FF] hover:bg-[#4338ca] active:scale-[0.99] text-white py-[0.5vw] rounded-[0.5vw] text-[0.78vw] font-bold transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-[0.4vw]"
                >
                  {isSubmittingPassword ? (
                    <div className="animate-spin rounded-full h-[0.9vw] w-[0.9vw] min-h-[14px] min-w-[14px] border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Icon icon="lucide:key-round" className="w-[0.9vw] h-[0.9vw] min-w-[14px] min-h-[14px]" />
                      <span>Unlock Flipbook</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 'otp' && (
          <>
            <p className="text-[0.7vw] text-gray-400 font-normal mt-[0.2vw]">
              Enter the verification code sent to your email.
            </p>

            <div className="mt-[1vw] text-center space-y-[0.6vw]">
              <p className="text-[0.72vw] text-gray-500 leading-relaxed font-normal">
                We have sent One Time Password (OTP) via email<br />
                to this Account <strong className="font-semibold text-gray-800">{getUserEmail()}</strong>
              </p>

              <p className="text-[0.72vw] text-gray-600 font-normal pt-[0.2vw]">
                Enter the code below to continue.
              </p>

              {/* 4 Digit OTP Inputs matching Visibility.jsx */}
              <div className="flex items-center justify-center gap-[0.7vw] py-[0.5vw]">
                {otpValues.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpRefs.current[idx] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, idx)}
                    onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                    onPaste={handleOtpPaste}
                    className={`w-[2.8vw] h-[2.8vw] min-w-[38px] min-h-[38px] text-center text-[1vw] font-bold rounded-[0.6vw] border transition-all focus:outline-none shadow-xs ${
                      digit
                        ? 'border-[#5551FF] bg-white text-gray-900 shadow-sm'
                        : 'border-gray-300 bg-white text-gray-800 focus:border-[#5551FF]'
                    }`}
                  />
                ))}
              </div>

              {otpError && (
                <p className="text-[0.7vw] text-red-500 font-medium pt-[0.1vw]">{otpError}</p>
              )}

              {/* Resend Timer line */}
              <p className="text-[0.7vw] text-gray-500 pt-[0.1vw]">
                Didn't receive the code? : {' '}
                {resendTimer > 0 ? (
                  <span className="text-gray-500 font-normal">Resent in 00.{String(resendTimer).padStart(2, '0')}</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-[#5551FF] underline font-semibold hover:text-[#4338ca] cursor-pointer"
                  >
                    Resend Code
                  </button>
                )}
              </p>
            </div>

            {/* Action Buttons matching Visibility.jsx */}
            <div className="grid grid-cols-2 gap-[0.6vw] mt-[1.2vw]">
              <button
                type="button"
                onClick={() => setStep('login')}
                className="bg-white border border-gray-300 rounded-[0.5vw] py-[0.5vw] text-[0.78vw] font-bold text-gray-800 hover:bg-gray-50 transition-all cursor-pointer shadow-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={isSubmittingPassword}
                className="bg-[#5551FF] hover:bg-[#4338ca] text-white py-[0.5vw] rounded-[0.5vw] text-[0.78vw] font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-[0.4vw]"
              >
                {isSubmittingPassword ? (
                  <div className="animate-spin rounded-full h-[0.9vw] w-[0.9vw] min-h-[14px] min-w-[14px] border-2 border-white border-t-transparent" />
                ) : (
                  <span>Continue</span>
                )}
              </button>
            </div>
          </>
        )}

        {/* STEP 3: NEW PASSWORD & CONFIRM PASSWORD */}
        {step === 'newPassword' && (
          <>
            <p className="text-[0.7vw] text-gray-400 font-normal mt-[0.2vw]">
              Enter a new password to secure your flipbook settings.
            </p>

            <div className="mt-[1vw] space-y-[0.7vw]">
              {/* New Password */}
              <div className="space-y-[0.3vw]">
                <label className="text-[0.78vw] font-semibold text-gray-900 block">
                  Enter your New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPasswordInput ? "text" : "password"}
                    value={newPasswordInput}
                    onChange={(e) => {
                      setNewPasswordInput(e.target.value);
                      if (newFormError) setNewFormError('');
                    }}
                    placeholder="@My New pass123"
                    className="w-full bg-white border border-gray-300 rounded-[0.5vw] px-[0.8vw] py-[0.5vw] text-[0.78vw] font-medium text-gray-800 focus:outline-none focus:border-[#5551FF] focus:ring-2 focus:ring-[#5551FF]/10 transition-all pr-[2.2vw] shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPasswordInput(!showNewPasswordInput)}
                    className="absolute right-[0.7vw] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <Icon
                      icon={showNewPasswordInput ? "lucide:eye" : "lucide:eye-off"}
                      className="w-[1vw] h-[1vw] min-w-[14px] min-h-[14px]"
                    />
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-[0.3vw]">
                <label className="text-[0.78vw] font-semibold text-gray-900 block">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPasswordInput ? "text" : "password"}
                    value={confirmPasswordInput}
                    onChange={(e) => {
                      setConfirmPasswordInput(e.target.value);
                      if (newFormError) setNewFormError('');
                    }}
                    placeholder="@My New pass123"
                    className="w-full bg-white border border-gray-300 rounded-[0.5vw] px-[0.8vw] py-[0.5vw] text-[0.78vw] font-medium text-gray-800 focus:outline-none focus:border-[#5551FF] focus:ring-2 focus:ring-[#5551FF]/10 transition-all pr-[2.2vw] shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPasswordInput(!showConfirmPasswordInput)}
                    className="absolute right-[0.7vw] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <Icon
                      icon={showConfirmPasswordInput ? "lucide:eye" : "lucide:eye-off"}
                      className="w-[1vw] h-[1vw] min-w-[14px] min-h-[14px]"
                    />
                  </button>
                </div>
              </div>

              {newFormError && (
                <p className="text-[0.7vw] text-red-500 font-medium pt-[0.1vw]">{newFormError}</p>
              )}
            </div>

            {/* Action Buttons matching Visibility.jsx */}
            <div className="grid grid-cols-2 gap-[0.6vw] mt-[1.2vw]">
              <button
                type="button"
                onClick={() => setStep('login')}
                className="bg-white border border-gray-300 rounded-[0.5vw] py-[0.5vw] text-[0.78vw] font-bold text-gray-800 hover:bg-gray-50 transition-all cursor-pointer shadow-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNewPassword}
                disabled={isSavingNewPassword}
                className="bg-[#5551FF] hover:bg-[#4338ca] text-white py-[0.5vw] rounded-[0.5vw] text-[0.78vw] font-bold transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-[0.4vw]"
              >
                {isSavingNewPassword ? (
                  <div className="animate-spin rounded-full h-[0.9vw] w-[0.9vw] min-h-[14px] min-w-[14px] border-2 border-white border-t-transparent" />
                ) : (
                  <span>Save & Unlock</span>
                )}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default PasswordProtectModal;
