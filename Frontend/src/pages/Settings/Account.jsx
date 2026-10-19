import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { resolveUploadsPath } from '../../utils/supabaseUtils';
import { getAvatarColor } from './Profile/Settings';

const Account = () => {
  const context = useOutletContext();
  const user = context?.user || {};

  const userEmail = user?.emailId || user?.email || 'luffyonepiece@gmail.com';
  const userName = user?.name || (userEmail ? userEmail.split('@')[0] : 'Luffy');
  const avatarSrc = user?.picture && user.picture !== 'color_only'
    ? (user.picture.startsWith('blob:') || user.picture.startsWith('data:') ? user.picture : resolveUploadsPath(user.picture))
    : null;

  return (
    <div className="w-full flex flex-col p-[1.5vw] font-sans">
      {/* Page Title & Subtitle */}
      <div className="mb-[2vw]">
        <h1 className="text-[1.8vw] font-bold text-gray-900 leading-tight">
          Account Settings
        </h1>
        <p className="text-[0.82vw] text-gray-400 mt-[0.3vw]">
          PNG format keeps your logo clean and background-free
        </p>
      </div>

      {/* Account Overview Card */}
      <div className="w-full bg-white border border-gray-200/90 rounded-[1.2vw] p-[1.8vw] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        {/* Card Header */}
        <div className="flex items-center gap-[0.6vw] mb-[0.3vw]">
          <Icon icon="lucide:user" className="w-[1.2vw] h-[1.2vw] text-gray-900" strokeWidth="2.5" />
          <h2 className="text-[1.15vw] font-bold text-gray-900">
            Account Overview
          </h2>
        </div>
        <p className="text-[0.78vw] text-gray-400 mb-[1.8vw] pl-[1.8vw]">
          PNG format keeps your logo clean and background-free
        </p>

        {/* Content Row: User details, Account Type, Member Since, Last Login */}
        <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-[1.5vw] pt-[0.5vw]">
          
          {/* User Profile Block */}
          <div className="flex items-center gap-[1vw]">
            <div 
              className="w-[4.2vw] h-[4.2vw] rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-sm"
              style={{ backgroundColor: avatarSrc ? '#ffffff' : (user?.avatarBgColor || getAvatarColor(userName || userEmail || 'User')) }}
            >
              {avatarSrc ? (
                <img 
                  src={avatarSrc} 
                  alt={userName} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <span className="text-white text-[1.8vw] font-bold">
                  {userName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-[0.4vw]">
                <h3 className="text-[1.2vw] font-bold text-gray-900 truncate leading-none">
                  {userName}
                </h3>
                {/* Green Verified Badge */}
                <Icon icon="solar:verified-check-bold" className="w-[1.1vw] h-[1.1vw] text-[#22C55E] shrink-0" />
              </div>
              <p className="text-[0.78vw] text-gray-400 truncate mt-[0.35vw] mb-[0.45vw]">
                {userEmail}
              </p>
              {/* Email Verified Pill */}
              <div>
                <span className="inline-block bg-[#DCFCE7] text-[#16A34A] text-[0.68vw] font-semibold px-[0.7vw] py-[0.18vw] rounded-full">
                  Email Verified
                </span>
              </div>
            </div>
          </div>

          {/* Account Type */}
          <div className="flex flex-col pl-[1vw] border-l border-gray-100">
            <span className="text-[0.78vw] font-semibold text-gray-800 mb-[0.6vw]">
              Account type
            </span>
            <div className="flex items-center gap-[0.5vw] text-gray-500">
              <Icon icon="lucide:user" className="w-[1vw] h-[1vw] text-gray-700" strokeWidth="2" />
              <span className="text-[0.82vw] text-gray-500 font-normal">
                {user?.profileType || 'Individual Creator'}
              </span>
            </div>
          </div>

          {/* Member Since */}
          <div className="flex flex-col pl-[1vw] border-l border-gray-100">
            <span className="text-[0.78vw] font-semibold text-gray-800 mb-[0.6vw]">
              Member Since
            </span>
            <div className="flex items-center gap-[0.5vw] text-gray-500">
              <Icon icon="lucide:user" className="w-[1vw] h-[1vw] text-gray-700" strokeWidth="2" />
              <span className="text-[0.82vw] text-gray-500 font-normal">
                Apr 29,2024
              </span>
            </div>
          </div>

          {/* Last Login */}
          <div className="flex flex-col pl-[1vw] border-l border-gray-100">
            <span className="text-[0.78vw] font-semibold text-gray-800 mb-[0.6vw]">
              Last Login
            </span>
            <div className="flex items-center gap-[0.5vw] text-gray-500">
              <Icon icon="lucide:user" className="w-[1vw] h-[1vw] text-gray-700" strokeWidth="2" />
              <span className="text-[0.82vw] text-gray-500 font-normal">
                Apr 29, 2026 &nbsp;10:45 AM
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Sign-in & Security Card */}
      <div className="w-full bg-white border border-gray-200/90 rounded-[1.2vw] p-[1.8vw] shadow-[0_2px_12px_rgba(0,0,0,0.03)] mt-[1.5vw]">
        {/* Card Header */}
        <div className="flex items-center gap-[0.6vw] mb-[0.3vw]">
          <Icon icon="lucide:lock" className="w-[1.1vw] h-[1.1vw] text-gray-900" strokeWidth="2.5" />
          <h2 className="text-[1.15vw] font-bold text-gray-900">
            Sign-in & Security
          </h2>
        </div>
        <p className="text-[0.78vw] text-gray-400 mb-[1.4vw] pl-[1.7vw]">
          Manage your Password
        </p>

        {/* Password Row Box */}
        <div className="w-full bg-[#F9FAFB] border border-gray-100 rounded-[1vw] p-[1.1vw] flex items-center justify-between">
          <div className="flex items-center gap-[1vw]">
            {/* Key Icon in circle */}
            <div className="w-[2.8vw] h-[2.8vw] rounded-full bg-white border border-gray-200/80 flex items-center justify-center shadow-xs">
              <Icon icon="lucide:key" className="w-[1.2vw] h-[1.2vw] text-gray-600 -rotate-45" strokeWidth="2" />
            </div>

            <div className="flex flex-col">
              <span className="text-[0.95vw] font-bold text-gray-900">
                Password
              </span>
              <span className="text-[0.75vw] text-gray-400 mt-[0.15vw]">
                Last changed 5 months ago
              </span>
            </div>
          </div>

          {/* Change Password Button */}
          <button
            type="button"
            className="flex items-center gap-[0.5vw] bg-[#2D3139] hover:bg-[#1F232B] text-white text-[0.82vw] font-medium px-[1.1vw] py-[0.6vw] rounded-[0.6vw] shadow-sm transition-all cursor-pointer active:scale-[0.98]"
          >
            <Icon icon="lucide:repeat" className="w-[0.95vw] h-[0.95vw]" strokeWidth="2.2" />
            <span>Change Password</span>
          </button>
        </div>
      </div>

      {/* Active Sessions Card */}
      <div className="w-full bg-[#FBFBFC] border border-gray-200/80 rounded-[1.2vw] p-[1.8vw] shadow-[0_2px_12px_rgba(0,0,0,0.02)] mt-[1.5vw] mb-[2vw]">
        {/* Card Header with Top-Right Action Buttons */}
        <div className="flex items-start justify-between mb-[1.5vw]">
          <div>
            <div className="flex items-center gap-[0.6vw] mb-[0.3vw]">
              <Icon icon="lucide:monitor" className="w-[1.2vw] h-[1.2vw] text-gray-900" strokeWidth="2.5" />
              <h2 className="text-[1.15vw] font-bold text-gray-900">
                Active Sessions
              </h2>
            </div>
            <p className="text-[0.78vw] text-gray-400 pl-[1.8vw]">
              These are the devices currently signed in to your account
            </p>
          </div>

          <div className="flex items-center gap-[0.8vw]">
            {/* Select devices button */}
            <button
              type="button"
              className="flex items-center gap-[0.4vw] text-gray-600 hover:text-gray-900 text-[0.8vw] font-medium px-[0.8vw] py-[0.5vw] transition-colors cursor-pointer"
            >
              <Icon icon="lucide:copy" className="w-[0.9vw] h-[0.9vw]" strokeWidth="2" />
              <span>Select devices</span>
            </button>

            {/* Logout other devices button */}
            <button
              type="button"
              className="flex items-center gap-[0.4vw] bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#EF4444] text-[0.8vw] font-semibold px-[1vw] py-[0.55vw] rounded-[0.6vw] transition-colors cursor-pointer"
            >
              <Icon icon="lucide:log-out" className="w-[0.9vw] h-[0.9vw]" strokeWidth="2.2" />
              <span>Logout other devices</span>
            </button>
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex flex-col gap-[0.9vw]">
          {/* Session 1: Current Session */}
          <div className="w-full bg-white border border-gray-200/70 rounded-[1vw] px-[1.2vw] py-[1.1vw] grid grid-cols-12 items-center shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
            {/* Device & Details (identical to other sessions) */}
            <div className="col-span-3 flex items-center gap-[1vw]">
              <Icon icon="uim:windows" className="w-[2vw] h-[2vw] shrink-0 text-[#0078D4]" />
              <div className="flex flex-col">
                <span className="text-[0.95vw] font-bold text-gray-900 leading-none">
                  Chrome on Windows
                </span>
                <span className="text-[0.75vw] text-gray-400 mt-[0.35vw]">
                  Coimbatore, India <span className="text-gray-300">-</span> <span className="text-gray-500 font-medium">Active Now</span>
                </span>
              </div>
            </div>

            {/* Current Session Badge Column */}
            <div className="col-span-2 flex items-center justify-center">
              <span className="bg-[#DCFCE7] text-[#16A34A] text-[0.72vw] font-semibold px-[0.85vw] py-[0.2vw] rounded-full inline-flex items-center justify-center leading-normal">
                Current Section
              </span>
            </div>

            {/* IP Address */}
            <div className="col-span-3 text-[0.78vw] text-gray-400 font-medium pl-[1vw]">
              IP 123.3445.455.345
            </div>

            {/* Last Activated */}
            <div className="col-span-2 flex flex-col">
              <span className="text-[0.75vw] text-gray-400">
                Last Activated
              </span>
              <span className="text-[0.78vw] text-gray-500 font-medium mt-[0.1vw]">
                Apr 29, 2026 - 10:45 Am
              </span>
            </div>

            {/* Action placeholder */}
            <div className="col-span-2 flex justify-end"></div>
          </div>

          {/* Session 2 */}
          <div className="w-full bg-white border border-gray-200/70 rounded-[1vw] px-[1.2vw] py-[1.1vw] grid grid-cols-12 items-center shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
            {/* Device & Details */}
            <div className="col-span-3 flex items-center gap-[1vw]">
              <Icon icon="uim:windows" className="w-[2vw] h-[2vw] shrink-0 text-[#0078D4]" />
              <div className="flex flex-col">
                <span className="text-[0.95vw] font-bold text-gray-900 leading-none">
                  Chrome on Windows
                </span>
                <span className="text-[0.75vw] text-gray-400 mt-[0.35vw]">
                  Coimbatore, India <span className="text-gray-300">-</span> Last Active 2 hours ago
                </span>
              </div>
            </div>

            {/* Spacer Column */}
            <div className="col-span-2"></div>

            {/* IP Address */}
            <div className="col-span-3 text-[0.78vw] text-gray-400 font-medium pl-[1vw]">
              IP 123.3445.455.345
            </div>

            {/* Last Activated */}
            <div className="col-span-2 flex flex-col">
              <span className="text-[0.75vw] text-gray-400">
                Last Activated
              </span>
              <span className="text-[0.78vw] text-gray-500 font-medium mt-[0.1vw]">
                Apr 29, 2026 - 10:45 Am
              </span>
            </div>

            {/* Logout Button */}
            <div className="col-span-2 flex justify-end">
              <button
                type="button"
                className="flex items-center gap-[0.4vw] bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[0.78vw] font-medium px-[1.1vw] py-[0.48vw] rounded-[0.5vw] shadow-2xs transition-colors cursor-pointer"
              >
                <Icon icon="lucide:log-out" className="w-[0.85vw] h-[0.85vw] text-gray-500" strokeWidth="2" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Session 3 */}
          <div className="w-full bg-white border border-gray-200/70 rounded-[1vw] px-[1.2vw] py-[1.1vw] grid grid-cols-12 items-center shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
            {/* Device & Details */}
            <div className="col-span-3 flex items-center gap-[1vw]">
              <Icon icon="uim:windows" className="w-[2vw] h-[2vw] shrink-0 text-[#0078D4]" />
              <div className="flex flex-col">
                <span className="text-[0.95vw] font-bold text-gray-900 leading-none">
                  Chrome on Windows
                </span>
                <span className="text-[0.75vw] text-gray-400 mt-[0.35vw]">
                  Coimbatore, India <span className="text-gray-300">-</span> Last Active 1 day ago
                </span>
              </div>
            </div>

            {/* Spacer Column */}
            <div className="col-span-2"></div>

            {/* IP Address */}
            <div className="col-span-3 text-[0.78vw] text-gray-400 font-medium pl-[1vw]">
              IP 123.3445.455.345
            </div>

            {/* Last Activated */}
            <div className="col-span-2 flex flex-col">
              <span className="text-[0.75vw] text-gray-400">
                Last Activated
              </span>
              <span className="text-[0.78vw] text-gray-500 font-medium mt-[0.1vw]">
                Apr 29, 2026 - 10:45 Am
              </span>
            </div>

            {/* Logout Button */}
            <div className="col-span-2 flex justify-end">
              <button
                type="button"
                className="flex items-center gap-[0.4vw] bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[0.78vw] font-medium px-[1.1vw] py-[0.48vw] rounded-[0.5vw] shadow-2xs transition-colors cursor-pointer"
              >
                <Icon icon="lucide:log-out" className="w-[0.85vw] h-[0.85vw] text-gray-500" strokeWidth="2" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Session 4 */}
          <div className="w-full bg-white border border-gray-200/70 rounded-[1vw] px-[1.2vw] py-[1.1vw] grid grid-cols-12 items-center shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
            {/* Device & Details */}
            <div className="col-span-3 flex items-center gap-[1vw]">
              <Icon icon="uim:windows" className="w-[2vw] h-[2vw] shrink-0 text-[#0078D4]" />
              <div className="flex flex-col">
                <span className="text-[0.95vw] font-bold text-gray-900 leading-none">
                  Chrome on Windows
                </span>
                <span className="text-[0.75vw] text-gray-400 mt-[0.35vw]">
                  Coimbatore, India <span className="text-gray-300">-</span> Last Active 1 hours ago
                </span>
              </div>
            </div>

            {/* Spacer Column */}
            <div className="col-span-2"></div>

            {/* IP Address */}
            <div className="col-span-3 text-[0.78vw] text-gray-400 font-medium pl-[1vw]">
              IP 123.3445.455.345
            </div>

            {/* Last Activated */}
            <div className="col-span-2 flex flex-col">
              <span className="text-[0.75vw] text-gray-400">
                Last Activated
              </span>
              <span className="text-[0.78vw] text-gray-500 font-medium mt-[0.1vw]">
                Apr 29, 2026 - 10:45 Am
              </span>
            </div>

            {/* Logout Button */}
            <div className="col-span-2 flex justify-end">
              <button
                type="button"
                className="flex items-center gap-[0.4vw] bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[0.78vw] font-medium px-[1.1vw] py-[0.48vw] rounded-[0.5vw] shadow-2xs transition-colors cursor-pointer"
              >
                <Icon icon="lucide:log-out" className="w-[0.85vw] h-[0.85vw] text-gray-500" strokeWidth="2" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Login Activities Card */}
      <div className="w-full bg-white border border-gray-200/90 rounded-[1.2vw] p-[1.8vw] shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-[2vw]">
        {/* Card Header with More Menu */}
        <div className="flex items-start justify-between mb-[1.5vw]">
          <div>
            <div className="flex items-center gap-[0.6vw] mb-[0.3vw]">
              <Icon icon="lucide:history" className="w-[1.2vw] h-[1.2vw] text-gray-900" strokeWidth="2.5" />
              <h2 className="text-[1.15vw] font-bold text-gray-900">
                Recent Login Activities
              </h2>
            </div>
            <p className="text-[0.78vw] text-gray-400 pl-[1.8vw]">
              Your recent sign-in attempts and account activity
            </p>
          </div>

          <button
            type="button"
            className="p-[0.35vw] text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-[0.4vw] transition-colors cursor-pointer"
          >
            <Icon icon="lucide:more-vertical" className="w-[1.15vw] h-[1.15vw]" />
          </button>
        </div>

        {/* Table Container */}
        <div className="w-full border border-gray-100 rounded-[0.9vw] overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-6 bg-[#F9FAFB] px-[1.4vw] py-[0.85vw] text-[0.82vw] font-bold text-gray-800">
            <div>Device</div>
            <div>Location</div>
            <div>Date & Time</div>
            <div>IP Address</div>
            <div>Status</div>
            <div className="text-right pr-[0.8vw]">Action</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-gray-100 text-[0.8vw]">
            {/* Row 1: Chrome on Windows - Current Session */}
            <div className="grid grid-cols-6 items-center px-[1.4vw] py-[1.1vw] hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center gap-[0.7vw] font-bold text-gray-900">
                <Icon icon="uim:windows" className="w-[1.4vw] h-[1.4vw] shrink-0 text-[#0078D4]" />
                <span>Chrome on Windows</span>
              </div>
              <div className="text-gray-500 font-normal">
                Coimbatore, India
              </div>
              <div className="text-gray-500 font-normal">
                Apr 29, 2026 - 10:45 AM
              </div>
              <div className="text-gray-500 font-normal">
                IP : 192 . 168 . 584 . 485
              </div>
              <div>
                <span className="bg-[#DCFCE7] text-[#16A34A] text-[0.72vw] font-semibold px-[0.8vw] py-[0.25vw] rounded-full inline-block">
                  Current Session
                </span>
              </div>
              <div className="text-right pr-[0.8vw] text-gray-400 font-normal">
                Current device
              </div>
            </div>

            {/* Row 2: Chrome on Windows - Failed */}
            <div className="grid grid-cols-6 items-center px-[1.4vw] py-[1.1vw] hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center gap-[0.7vw] font-bold text-gray-900">
                <Icon icon="uim:windows" className="w-[1.4vw] h-[1.4vw] shrink-0 text-[#0078D4]" />
                <span>Chrome on Windows</span>
              </div>
              <div className="text-gray-500 font-normal">
                Coimbatore, India
              </div>
              <div className="text-gray-500 font-normal">
                Apr 29, 2026 - 10:45 AM
              </div>
              <div className="text-gray-500 font-normal">
                IP : 192 . 168 . 584 . 485
              </div>
              <div>
                <span className="bg-[#FEE2E2] text-[#EF4444] text-[0.72vw] font-semibold px-[0.9vw] py-[0.25vw] rounded-full inline-block">
                  Failed
                </span>
              </div>
              <div className="text-right pr-[0.8vw]">
                <button type="button" className="text-[#EF4444] hover:underline font-normal cursor-pointer">
                  It's Not you?
                </button>
              </div>
            </div>

            {/* Row 3: Chrome on Android - Completed */}
            <div className="grid grid-cols-6 items-center px-[1.4vw] py-[1.1vw] hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center gap-[0.7vw] font-bold text-gray-900">
                <Icon icon="ant-design:android-filled" className="w-[1.4vw] h-[1.4vw] shrink-0 text-[#3DDC84]" />
                <span>Chrome on Android</span>
              </div>
              <div className="text-gray-500 font-normal">
                Coimbatore, India
              </div>
              <div className="text-gray-500 font-normal">
                Apr 29, 2026 - 10:45 AM
              </div>
              <div className="text-gray-500 font-normal">
                IP : 192 . 168 . 584 . 485
              </div>
              <div className="text-gray-600 font-normal">
                Completed
              </div>
              <div className="text-right pr-[0.8vw]">
                <button type="button" className="text-[#EF4444] hover:underline font-normal cursor-pointer">
                  It's Not you?
                </button>
              </div>
            </div>

            {/* Row 4: Safari on Mac - Completed */}
            <div className="grid grid-cols-6 items-center px-[1.4vw] py-[1.1vw] hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center gap-[0.7vw] font-bold text-gray-900">
                <Icon icon="logos:apple" className="w-[1.3vw] h-[1.3vw] shrink-0 text-gray-900" />
                <span>Safari on Mac</span>
              </div>
              <div className="text-gray-500 font-normal">
                Coimbatore, India
              </div>
              <div className="text-gray-500 font-normal">
                Apr 29, 2026 - 10:45 AM
              </div>
              <div className="text-gray-500 font-normal">
                IP : 192 . 168 . 584 . 485
              </div>
              <div className="text-gray-600 font-normal">
                Completed
              </div>
              <div className="text-right pr-[0.8vw]">
                <button type="button" className="text-[#EF4444] hover:underline font-normal cursor-pointer">
                  It's Not you?
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* View More Expander Button */}
        <div className="w-full flex items-center justify-center pt-[1.2vw]">
          <button
            type="button"
            className="flex items-center gap-[0.3vw] text-gray-600 hover:text-gray-900 text-[0.82vw] font-medium transition-colors cursor-pointer"
          >
            <span>View More</span>
            <Icon icon="lucide:chevron-down" className="w-[1vw] h-[1vw]" strokeWidth="2.2" />
          </button>
        </div>
      </div>

      {/* Account Management Card */}
      <div className="w-full bg-white border border-gray-200/90 rounded-[1.2vw] p-[1.8vw] shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-[2vw]">
        {/* Card Header */}
        <div className="flex items-center gap-[0.6vw] mb-[0.3vw]">
          <Icon icon="lucide:user-cog" className="w-[1.2vw] h-[1.2vw] text-gray-900" strokeWidth="2.4" />
          <h2 className="text-[1.15vw] font-bold text-gray-900">
            Account Management
          </h2>
        </div>
        <p className="text-[0.78vw] text-gray-400 mb-[1.5vw] pl-[1.8vw]">
          Manage your account and account preferences
        </p>

        {/* Options List */}
        <div className="flex flex-col gap-[0.9vw]">
          {/* Option 1: Delete Account */}
          <div className="w-full bg-[#F9FAFB] hover:bg-gray-100/70 border border-gray-100 rounded-[1vw] p-[1.1vw] flex items-center justify-between cursor-pointer transition-colors group">
            <div className="flex items-center gap-[1vw]">
              <div className="w-[2.8vw] h-[2.8vw] rounded-full bg-white border border-red-200/80 flex items-center justify-center shadow-xs">
                <Icon icon="lucide:trash-2" className="w-[1.2vw] h-[1.2vw] text-[#EF4444]" strokeWidth="2" />
              </div>
              <div className="flex flex-col">
                <span className="text-[0.95vw] font-bold text-gray-900">
                  Delete Account
                </span>
                <span className="text-[0.75vw] text-gray-400 mt-[0.1vw]">
                  Permenently delete your account and all data
                </span>
              </div>
            </div>

            <Icon icon="lucide:chevron-right" className="w-[1.2vw] h-[1.2vw] text-gray-400 group-hover:text-gray-700 transition-colors" />
          </div>

          {/* Option 2: Switch Accounts */}
          <div className="w-full bg-[#F9FAFB] hover:bg-gray-100/70 border border-gray-100 rounded-[1vw] p-[1.1vw] flex items-center justify-between cursor-pointer transition-colors group">
            <div className="flex items-center gap-[1vw]">
              {/* Overlapping Avatars */}
              <div className="relative w-[3vw] h-[2.8vw] flex items-center">
                {/* Back avatar */}
                <div className="absolute right-0 w-[2.2vw] h-[2.2vw] rounded-full bg-[#E11D48] text-white text-[0.8vw] font-bold flex items-center justify-center shadow-xs">
                  A
                </div>
                {/* Front avatar */}
                <div 
                  className="absolute left-0 w-[2.2vw] h-[2.2vw] rounded-full overflow-hidden border-2 border-white flex items-center justify-center shadow-xs"
                  style={{ backgroundColor: avatarSrc ? '#ffffff' : (user?.avatarBgColor || getAvatarColor(userName || userEmail || 'User')) }}
                >
                  {avatarSrc ? (
                    <img 
                      src={avatarSrc} 
                      alt={userName} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <span className="text-white text-[0.9vw] font-bold">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-[0.95vw] font-bold text-gray-900">
                  Switch Accounts
                </span>
                <span className="text-[0.75vw] text-gray-400 mt-[0.1vw]">
                  Sign in with another Flipibook account or add a new account
                </span>
              </div>
            </div>

            <Icon icon="lucide:chevron-right" className="w-[1.2vw] h-[1.2vw] text-gray-400 group-hover:text-gray-700 transition-colors" />
          </div>

          {/* Option 3: Logout */}
          <div className="w-full bg-[#F9FAFB] border border-gray-100 rounded-[1vw] p-[1.1vw] flex items-center justify-between">
            <div className="flex items-center gap-[1vw]">
              <div 
                className="w-[2.8vw] h-[2.8vw] rounded-full overflow-hidden flex items-center justify-center shadow-xs"
                style={{ backgroundColor: avatarSrc ? '#ffffff' : (user?.avatarBgColor || getAvatarColor(userName || userEmail || 'User')) }}
              >
                {avatarSrc ? (
                  <img 
                    src={avatarSrc} 
                    alt={userName} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <span className="text-white text-[1.1vw] font-bold">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex flex-col">
                <span className="text-[0.95vw] font-bold text-gray-900">
                  Logout
                </span>
                <span className="text-[0.75vw] text-gray-400 mt-[0.1vw]">
                  Securely sign out from your current account
                </span>
              </div>
            </div>

            {/* Logout Current Account Button */}
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('user');
                localStorage.removeItem('user_profile');
                localStorage.removeItem('last_active_folder');
                localStorage.removeItem('hide_upgrade_card');
                sessionStorage.removeItem('hide_upgrade_card');
                if (window.google?.accounts?.id) {
                  window.google.accounts.id.disableAutoSelect();
                }
                window.location.href = '/';
              }}
              className="flex items-center gap-[0.4vw] bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#EF4444] text-[0.8vw] font-semibold px-[1vw] py-[0.55vw] rounded-[0.6vw] transition-colors cursor-pointer"
            >
              <Icon icon="lucide:log-out" className="w-[0.9vw] h-[0.9vw]" strokeWidth="2.2" />
              <span>Logout Current Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
