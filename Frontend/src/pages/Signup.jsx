import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Check, X, Loader2, ArrowLeft, Mail } from 'lucide-react';
import axios from 'axios';
import { useGoogleLogin } from '@react-oauth/google';

import { useToast } from '../components/CustomToast';
import FlipibookLogo from '../assets/logo/Flipibook_logo.svg'; 
import SignupBg from '../assets/logo/signup.png';

export default function Signup() {
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(30);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  const otpInputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false
  });

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Focus first OTP input on step change
  useEffect(() => {
    if (step === 'otp' && otpInputRefs.current[0]) {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  const validatePassword = (password) => {
    const criteria = {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password),
    };
    setPasswordCriteria(criteria);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'password') {
       validatePassword(e.target.value);
    }
  };

  // OTP Inputs handling
  const handleOtpChange = (index, value) => {
    const digit = value.slice(-1);
    if (isNaN(digit)) return;

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-focus next input
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    const digits = pastedData.split('');
    
    digits.forEach((digit, i) => {
      if (i < 6) newOtp[i] = digit;
    });

    setOtp(newOtp);
    const nextIndex = Math.min(digits.length, 5);
    otpInputRefs.current[nextIndex]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleGoogleSignup = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
        
        // Fetch user info from Google using access token
        const userInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        
        // Send info to our backend
        const res = await axios.post(`${backendUrl}/api/auth/google-login`, {
          isAccessToken: true,
          email: userInfo.data.email,
          name: userInfo.data.name,
          picture: userInfo.data.picture,
          sub: userInfo.data.sub
        });

        if (res.data.user) {
          const userData = { ...res.data.user, isLoggedIn: true };
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.removeItem('hide_upgrade_card');
          sessionStorage.removeItem('hide_upgrade_card');
          
          const profileData = {
            emailId: res.data.user.emailId,
            email: res.data.user.emailId,
            name: res.data.user.name || res.data.user.emailId.split('@')[0],
            picture: res.data.user.picture || null,
            avatarBgColor: res.data.user.avatarBgColor || '#E8D4C8'
          };
          localStorage.setItem('user_profile', JSON.stringify(profileData));
          window.dispatchEvent(new CustomEvent('profileUpdate', { detail: profileData }));

          toast.success('Signup successful with Google!');
          const searchParams = new URLSearchParams(location.search);
          const redirectUrl = searchParams.get('redirect') || '/home';
          navigate(redirectUrl);
        }
      } catch (err) {
        console.error('Google Auth Error:', err);
        toast.error('Google Sign-Up failed');
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => toast.error('Google Sign-Up Failed')
  });

  // Step 1: Send OTP to verify email
  const handleInitiateSignup = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!Object.values(passwordCriteria).every(Boolean)) {
      toast.error("Please satisfy all password criteria");
      return;
    }

    setIsLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const res = await axios.post(`${backendUrl}/api/auth/send-signup-otp`, {
        emailId: formData.email
      });

      if (res.data?.success) {
        toast.success('Verification code sent to your email!');
        setStep('otp');
        setTimer(30);
        setOtp(['', '', '', '', '', '']);
      }
    } catch (err) {
      console.error('Send OTP Error:', err.response?.data?.message || err.message);
      toast.error(err.response?.data?.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (timer > 0 || isResending) return;
    setIsResending(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const res = await axios.post(`${backendUrl}/api/auth/send-signup-otp`, {
        emailId: formData.email
      });
      if (res.data?.success) {
        setTimer(30);
        setOtp(['', '', '', '', '', '']);
        toast.success('New verification code sent!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  // Step 2: Verify OTP and create user
  const handleVerifyAndSignup = async (e) => {
    if (e) e.preventDefault();
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 6) {
      toast.error('Please enter the full 6-digit verification code');
      return;
    }

    setIsLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const res = await axios.post(`${backendUrl}/api/auth/signup`, {
        emailId: formData.email,
        password: formData.password,
        otp: enteredOtp
      });
      
      if (res.data.user) {
        const userData = {
          ...res.data.user,
          isLoggedIn: true
        };
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.removeItem('hide_upgrade_card');
        sessionStorage.removeItem('hide_upgrade_card');

        const profileData = {
          emailId: res.data.user.emailId,
          email: res.data.user.emailId,
          name: res.data.user.name || res.data.user.emailId.split('@')[0],
          picture: null,
          avatarBgColor: '#E8D4C8'
        };
        localStorage.setItem('user_profile', JSON.stringify(profileData));
        window.dispatchEvent(new CustomEvent('profileUpdate', { detail: profileData }));
      }
      
      toast.success('Account created successfully!');
      const searchParams = new URLSearchParams(location.search);
      const redirectUrl = searchParams.get('redirect') || '/home';
      navigate(redirectUrl);
    } catch (err) {
      console.error('Signup error:', err.response?.data?.message || err.message);
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex relative overflow-hidden bg-white">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={SignupBg} 
          alt="Background" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content Container */}
      <div className="flex w-full h-full z-10 relative">
        {/* Left Section: Logo */}
        <div className="hidden lg:flex w-[50%] flex-col p-[3vw] relative">
          <div className="mb-auto">
             <img src={FlipibookLogo} alt="Flipibook" className="w-[9vw] object-contain" />
          </div>
        </div>

        {/* Right Section: Signup Form or OTP Form */}
        <div className="w-full lg:w-[50%] flex items-center justify-center p-[1.5vw] lg:p-[3vw]">
          <div className="w-full max-w-[28vw] space-y-[1vw] bg-transparent">
            
            {step === 'form' ? (
              <>
                <div className="text-center">
                   <div className="lg:hidden flex justify-center mb-[1vw]">
                     <img src={FlipibookLogo} alt="Flipibook" className="h-[2.5vw] w-auto" />
                   </div>
                   <h2 className="text-[2vw] font-semibold tracking-tight mb-[1vw] text-black drop-shadow-md">Sign-Up</h2>
                </div>

                <form onSubmit={handleInitiateSignup} className="space-y-[1.25vw]">
                  {/* Email */}
                  <div className="space-y-[0.5vw]">
                    <label className="text-[0.875vw] font-bold ml-[0.25vw] text-black" htmlFor="email">Email Id</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="block w-full px-[1.25vw] py-[0.75vw] font-medium rounded-full bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all border border-indigo-200 shadow-lg shadow-indigo-100 text-[1vw]"
                      placeholder="Enter your Email ID"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-[0.5vw]">
                    <label className="text-[0.875vw] font-bold ml-[0.25vw] text-black" htmlFor="password">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        className="block w-full px-[1.25vw] py-[0.75vw] pr-[3vw] font-medium rounded-full bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all border border-indigo-200 shadow-lg shadow-indigo-100 text-[1vw]"
                        placeholder="Create your Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-[1vw] flex items-center"
                      >
                         {showPassword ? (
                           <EyeOff className="w-[1.25vw] h-[1.25vw] text-indigo-800 hover:text-indigo-600 cursor-pointer" />
                         ) : (
                           <Eye className="w-[1.25vw] h-[1.25vw] text-indigo-800 hover:text-indigo-600 cursor-pointer" />
                         )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-[0.5vw]">
                    <label className="text-[0.875vw] font-bold ml-[0.25vw] text-black" htmlFor="confirmPassword">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        className="block w-full px-[1.25vw] py-[0.75vw] pr-[3vw] font-medium rounded-full bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all border border-indigo-200 shadow-lg shadow-indigo-100 text-[1vw]"
                        placeholder="Re - Enter your Password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-[1vw] flex items-center"
                      >
                         {showConfirmPassword ? (
                           <EyeOff className="w-[1.25vw] h-[1.25vw] text-indigo-800 hover:text-indigo-600 cursor-pointer" />
                         ) : (
                           <Eye className="w-[1.25vw] h-[1.25vw] text-indigo-800 hover:text-indigo-600 cursor-pointer" />
                         )}
                      </button>
                    </div>
                    {formData.confirmPassword && (
                        <div className={`text-[0.625vw] ml-[0.25vw] font-medium mt-[0.25vw] flex items-center gap-[0.25vw] ${formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                            {formData.password === formData.confirmPassword ? <Check size="0.625vw" /> : <X size="0.625vw" />}
                            <span>{formData.password === formData.confirmPassword ? "Passwords match" : "Passwords do not match"}</span>
                        </div>
                    )}
                  </div>

                  {/* Password Requirements Checklist */}
                  <div className="text-[0.625vw] space-y-[0.125vw] ml-[0.25vw] font-medium mt-[0.5vw]">
                     <div className={`flex items-center gap-[0.5vw] ${!formData.password ? 'text-gray-400' : (passwordCriteria.length ? 'text-green-600' : 'text-red-500')}`}>
                        {!formData.password ? <div className="w-[0.625vw] h-[0.625vw] rounded-full border border-gray-300" /> : (passwordCriteria.length ? <Check size="0.75vw" /> : <div className="p-[0.0625vw] rounded-full bg-red-100"><X size="0.625vw" className="text-red-500" /></div>)}
                        <span>Minimum 8 characters</span>
                     </div>
                     <div className={`flex items-center gap-[0.5vw] ${!formData.password ? 'text-gray-400' : (passwordCriteria.upper ? 'text-green-600' : 'text-red-500')}`}>
                        {!formData.password ? <div className="w-[0.625vw] h-[0.625vw] rounded-full border border-gray-300" /> : (passwordCriteria.upper ? <Check size="0.75vw" /> : <div className="p-[0.0625vw] rounded-full bg-red-100"><X size="0.625vw" className="text-red-500" /></div>)}
                        <span>At least 1 uppercase letter (A-Z)</span>
                     </div>
                     <div className={`flex items-center gap-[0.5vw] ${!formData.password ? 'text-gray-400' : (passwordCriteria.lower ? 'text-green-600' : 'text-red-500')}`}>
                        {!formData.password ? <div className="w-[0.625vw] h-[0.625vw] rounded-full border border-gray-300" /> : (passwordCriteria.lower ? <Check size="0.75vw" /> : <div className="p-[0.0625vw] rounded-full bg-red-100"><X size="0.625vw" className="text-red-500" /></div>)}
                        <span>At least 1 lowercase letter (a-z)</span>
                     </div>
                     <div className={`flex items-center gap-[0.5vw] ${!formData.password ? 'text-gray-400' : (passwordCriteria.number ? 'text-green-600' : 'text-red-500')}`}>
                        {!formData.password ? <div className="w-[0.625vw] h-[0.625vw] rounded-full border border-gray-300" /> : (passwordCriteria.number ? <Check size="0.75vw" /> : <div className="p-[0.0625vw] rounded-full bg-red-100"><X size="0.625vw" className="text-red-500" /></div>)}
                        <span>At least 1 number (0-9)</span>
                     </div>
                     <div className={`flex items-center gap-[0.5vw] ${!formData.password ? 'text-gray-400' : (passwordCriteria.special ? 'text-green-600' : 'text-red-500')}`}>
                        {!formData.password ? <div className="w-[0.625vw] h-[0.625vw] rounded-full border border-gray-300" /> : (passwordCriteria.special ? <Check size="0.75vw" /> : <div className="p-[0.0625vw] rounded-full bg-red-100"><X size="0.625vw" className="text-red-500" /></div>)}
                        <span>At least 1 special char (! @ # $ % ^ & *)</span>
                     </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={
                      isLoading || 
                      !formData.email || 
                      !formData.password || 
                      !formData.confirmPassword || 
                      formData.password !== formData.confirmPassword ||
                      !Object.values(passwordCriteria).every(Boolean)
                    }
                    className="w-full py-[0.875vw] px-[1vw] cursor-pointer rounded-full bg-[#4c5add] hover:bg-[#3f4bc0] text-white font-semibold text-[1.125vw] shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.02] focus:outline-none text-center block disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-[0.5vw]">
                        <Loader2 className="w-[1.25vw] h-[1.25vw] animate-spin" />
                        <span>Sending Verification Code...</span>
                      </div>
                    ) : (
                      "Sign Up"
                    )}
                  </button>

                  {/* Google Sign-Up Divider */}
                  <div className="flex items-center my-[1vw]">
                    <div className="flex-1 border-t border-gray-200"></div>
                    <span className="px-[0.75vw] text-gray-500 text-[0.875vw] font-semibold">or</span>
                    <div className="flex-1 border-t border-gray-200"></div>
                  </div>

                  {/* Google Sign-Up Button */}
                  <button 
                    type="button"
                    onClick={() => handleGoogleSignup()}
                    className="w-full flex cursor-pointer items-center justify-center px-[1vw] py-[0.75vw] rounded-full bg-white text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all border border-gray-300 shadow-sm text-[1vw]"
                  >
                     <svg className="w-[1.25vw] h-[1.25vw] mr-[0.75vw]" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                     </svg>
                     Sign-Up with Google
                  </button>

                  {/* Footer Link */}
                  <div className="text-center mt-[0.5vw]">
                     <p className="text-[0.875vw] text-black">
                        Already have an account ?{' '}
                        <Link to="/" className="font-semibold text-[#4c5add] hover:underline decoration-1 underline-offset-[0.25vw]">
                          Sign in
                        </Link>
                     </p>
                  </div>
                </form>
              </>
            ) : (
              /* Step 2: OTP Verification Screen */
              <div className="flex flex-col items-center justify-center py-[1vw] text-center animate-in fade-in zoom-in-95 duration-300">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="self-start flex items-center gap-[0.4vw] text-[0.85vw] font-semibold text-indigo-700 hover:text-indigo-900 transition-colors mb-[1vw] cursor-pointer"
                >
                  <ArrowLeft className="w-[1vw] h-[1vw]" />
                  <span>Back to details</span>
                </button>

                <div className="w-[3.5vw] h-[3.5vw] rounded-full bg-indigo-50 flex items-center justify-center mb-[1vw] border border-indigo-100">
                  <Mail className="w-[1.75vw] h-[1.75vw] text-[#4c5add]" />
                </div>

                <h2 className="text-[2vw] font-semibold tracking-tight text-black mb-[0.5vw]">Verify Your Email</h2>
                
                <p className="text-gray-600 text-[0.85vw] font-medium mb-[0.25vw]">
                  We have sent a 6-digit One Time Password (OTP) to:
                </p>
                <div className="flex items-center justify-center gap-[0.5vw] mb-[1.75vw]">
                  <span className="text-[#4c5add] font-bold text-[0.95vw]">{formData.email}</span>
                  <button 
                    type="button"
                    onClick={() => setStep('form')}
                    className="text-[0.75vw] text-gray-500 hover:text-indigo-600 underline font-medium cursor-pointer"
                  >
                    Edit
                  </button>
                </div>

                <form onSubmit={handleVerifyAndSignup} className="w-full flex flex-col items-center">
                  <div className="flex gap-[0.65vw] mb-[1vw] justify-center">
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
                        className="w-[3.2vw] h-[3.2vw] border-[0.12vw] border-indigo-200 rounded-[0.6vw] bg-white text-center text-[1.3vw] font-bold text-[#373d8b] focus:border-[#4c5add] focus:ring-4 focus:ring-[#4c5add]/15 outline-none transition-all shadow-sm"
                      />
                    ))}
                  </div>

                  <div className="text-[#373d8b] font-medium mb-[1.75vw] text-[0.85vw]">
                    {timer > 0 ? (
                      <span>Resend code in <span className="font-bold text-[#4c5add]">00.{timer.toString().padStart(2, '0')}</span></span>
                    ) : (
                      <button 
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isResending}
                        className="text-[#4c5add] font-bold hover:underline cursor-pointer flex items-center gap-[0.3vw] mx-auto"
                      >
                        {isResending ? (
                          <>
                            <Loader2 className="w-[0.85vw] h-[0.85vw] animate-spin" />
                            <span>Resending...</span>
                          </>
                        ) : (
                          "Resend OTP"
                        )}
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otp.join('').length !== 6}
                    className="w-full py-[0.875vw] px-[1vw] cursor-pointer rounded-full bg-[#4c5add] hover:bg-[#3f4bc0] text-white font-semibold text-[1.05vw] shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.02] focus:outline-none text-center block disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-[0.5vw]">
                        <Loader2 className="w-[1.25vw] h-[1.25vw] animate-spin" />
                        <span>Verifying & Creating Account...</span>
                      </div>
                    ) : (
                      "Verify & Complete Sign-Up"
                    )}
                  </button>

                  <div className="text-center mt-[1.25vw]">
                    <button 
                      type="button"
                      onClick={() => setStep('form')}
                      className="text-[0.85vw] text-gray-500 hover:text-gray-800 font-medium cursor-pointer"
                    >
                      Change registration details
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}