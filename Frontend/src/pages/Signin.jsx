import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useGoogleLogin, useGoogleOneTapLogin } from '@react-oauth/google';

import { useToast } from '../components/CustomToast';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import FlipibookLogo from '../assets/logo/Flipibook_logo.svg'; 
import SigninBg from '../assets/logo/signin.png';

export default function Signin() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [formData, setFormData] = useState({
    emailId: '',
    password: ''
  });
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleForgotPasswordClick = async (e) => {
    e.preventDefault();
    if (!formData.emailId) {
      toast.error("Please enter your Email ID first");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.emailId)) {
      toast.error("Please enter a valid Email ID");
      return;
    }

    try {
      setIsCheckingUser(true);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const res = await axios.post(`${backendUrl}/api/auth/check-user`, {
        emailId: formData.emailId
      });
      
      if (res.data.exists) {
        setIsForgotModalOpen(true);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error("This email is not registered");
      } else {
        console.error("Error checking user:", err);
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setIsCheckingUser(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
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

          toast.success('Login successful with Google!');
          const searchParams = new URLSearchParams(location.search);
          const redirectUrl = searchParams.get('redirect') || '/home';
          navigate(redirectUrl);
        }
      } catch (err) {
        console.error('Google Auth Error:', err);
        toast.error('Google Authentication failed');
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => toast.error('Google Login Failed')
  });

  // Google One Tap Login for seamless experience
  useGoogleOneTapLogin({
    onSuccess: async (credentialResponse) => {
      setIsLoading(true);
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
        // One Tap provides an ID Token (credential)
        const res = await axios.post(`${backendUrl}/api/auth/google-login`, {
          token: credentialResponse.credential,
          isAccessToken: false
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

          toast.success('Welcome back!');
          const searchParams = new URLSearchParams(location.search);
          const redirectUrl = searchParams.get('redirect') || '/home';
          navigate(redirectUrl);
        }
      } catch (err) {
        console.error('Google One Tap Error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => console.log('One Tap Login Failed'),
    auto_select: false, // Set to false to prevent automatic login after logout
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const res = await axios.post(`${backendUrl}/api/auth/login`, {
        emailId: formData.emailId,
        password: formData.password
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
          picture: res.data.user.picture || null,
          avatarBgColor: res.data.user.avatarBgColor || '#E8D4C8'
        };
        localStorage.setItem('user_profile', JSON.stringify(profileData));
        window.dispatchEvent(new CustomEvent('profileUpdate', { detail: profileData }));
      }

      toast.success('Login successful!');
      const searchParams = new URLSearchParams(location.search);
      const redirectUrl = searchParams.get('redirect') || '/home';
      navigate(redirectUrl);
    } catch (err) {
      console.error('Login error:', err.response?.data?.message || err.message);
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden bg-white"> 
      <ForgotPasswordModal 
        isOpen={isForgotModalOpen} 
        onClose={() => setIsForgotModalOpen(false)} 
        email={formData.emailId}
      />

      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={SigninBg} 
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
          <div className="flex-1 flex items-center justify-center">
             <div className="w-[25vw] h-[32.5vw] relative flex items-center justify-center"></div>
          </div>
        </div>

        {/* Right Section: Login Form */}
        <div className="w-full lg:w-[50%] flex items-center justify-center p-[4vw] lg:p-[4vw]">
          <div className="w-full max-w-[28vw] space-y-[2vw] text-white">
            <div className="text-center">
               <div className="lg:hidden flex justify-center mb-[1.5vw]">
                 <img src={FlipibookLogo} alt="Flipibook" className="h-[2.5vw] w-auto" />
               </div>
               <h2 className="text-[2.25vw] font-normal tracking-wide mb-[2.5vw]">Sign-in</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-[1.5vw]">
              <div className="space-y-[0.5vw]">
                <label className="text-[1vw] font-medium ml-[0.25vw]" htmlFor="emailId">Email Id</label>
                <input
                  type="email"
                  id="emailId"
                  name="emailId"
                  className="block w-full px-[1.25vw] py-[0.75vw] font-medium rounded-full bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-[1vw]"
                  placeholder="Enter your Email ID"
                  value={formData.emailId}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-[0.5vw]">
                <label className="text-[1vw] font-medium ml-[0.25vw]" htmlFor="password">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    className="block w-full px-[1.25vw] py-[0.75vw] pr-[3vw] font-medium rounded-full bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all text-[1vw]"
                    placeholder="Enter your Password"
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
                       <EyeOff className="w-[1.25vw] h-[1.25vw] text-gray-500 hover:text-gray-700" />
                     ) : (
                       <Eye className="w-[1.25vw] h-[1.25vw] text-gray-500 hover:text-gray-700" />
                     )}
                  </button>
                </div>
                <div className="flex justify-end pt-[0.25vw]">
                   <button 
                    type="button"
                    onClick={handleForgotPasswordClick}
                    className={`flex items-center text-[0.875vw] underline decoration-1 underline-offset-[0.25vw] transition-colors font-semibold ${(!formData.emailId || isCheckingUser) ? 'text-gray-500 cursor-not-allowed opacity-60' : 'text-gray-300 hover:text-white cursor-pointer'}`}
                    disabled={!formData.emailId || isCheckingUser}
                   >
                      {isCheckingUser ? (
                        <>
                          <Loader2 className="w-[1vw] h-[1vw] animate-spin mr-[0.5vw]" />
                          Sending OTP to your email...
                        </>
                      ) : (
                        "Forget Password ?"
                      )}
                   </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="block w-full text-center py-[0.875vw] px-[1vw] rounded-full bg-[#4c5add] cursor-pointer hover:bg-[#3f4bc0] text-white font-semibold text-[1.125vw] shadow-lg shadow-indigo-900/50 transition-all transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 border-2 border-indigo-400/30 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-[0.5vw]">
                    <Loader2 className="w-[1.25vw] h-[1.25vw] animate-spin" />
                    <span>Signing In...</span>
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>
              
              <div className="text-center mt-[1vw]">
                 <p className="text-[0.875vw] text-gray-300">
                    Create Account ?{' '}
                    <Link to="/signup" className="font-semibold text-white hover:underline decoration-1 underline-offset-[0.25vw]">
                       Sign up
                    </Link>
                 </p>
              </div>

              <div className="flex items-center my-[2vw]">
                <div className="flex-1 border-t border-1 border-white"></div>
                <span className="px-[0.75vw] text-gray-300 text-[0.875vw] font-semibold">or</span>
                <div className="flex-1 border-t border-1 border-white"></div>
              </div>

              {/* Google Login */}
              <button 
                type="button"
                onClick={() => handleGoogleLogin()}
                className="w-full flex cursor-pointer items-center justify-center px-[1vw] py-[0.875vw] rounded-full bg-white text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all transform hover:scale-[1.02] text-[1vw]"
              >
                 <svg className="w-[1.25vw] h-[1.25vw] mr-[0.75vw]" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                 </svg>
                 Sign-In with Google
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}