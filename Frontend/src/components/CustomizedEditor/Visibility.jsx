import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import PremiumDropdown from './PremiumDropdown';
import { useToast } from '../CustomToast';

const VISIBILITY_OPTIONS = [
  {
    id: 'Public',
    label: 'Public',
    renderDescription: () => (
      <>
        <strong className="text-gray-700 font-semibold">Everyone can view your flipbook.</strong> Your flipbook will be visible to all users. People can <strong className="text-gray-700 font-semibold">view, share, rate, review, follow your profile, and save your flipbook to their library.</strong> This option helps you reach more people and get more exposure.
      </>
    )
  },
  {
    id: 'Private',
    label: 'Private',
    renderDescription: () => (
      <>
        <strong className="text-gray-700 font-semibold">Only you can view your flipbook.</strong> No one else can <strong className="text-gray-700 font-semibold">find or open it.</strong> It will not appear in search or public pages. Best for drafts and personal work.
      </>
    )
  },
  {
    id: 'Password Protect',
    label: 'Password Protect',
    renderDescription: () => (
      <>
        <strong className="text-gray-700 font-semibold">Only people with the password can view your flipbook.</strong> It won't appear in public search or receive public ratings and reviews.
      </>
    )
  },
  {
    id: 'Invite Only Access',
    label: 'Invite Only Access',
    renderDescription: () => (
      <>
        <strong className="text-gray-700 font-semibold">Only invited users can view your flipbook.</strong> It won't appear in public search or receive public ratings and reviews.
      </>
    )
  }
];

const ToggleItem = ({ label, checked, onChange, children }) => (
  <div className="flex items-center justify-between py-[0.2vw]">
    <div className="flex items-center gap-[0.5vw] shrink-0">
      <span className="text-[0.85vw] font-medium text-gray-800 whitespace-nowrap shrink-0">{label}</span>
      {children}
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex items-center h-[1.2vw] w-[2.4vw] shrink-0 cursor-pointer rounded-full transition-all duration-300 ease-in-out border-[1.5px] ${
        checked ? 'bg-[#5551FF] border-[#5551FF]' : 'bg-gray-200 border-gray-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-[0.9vw] w-[0.9vw] rounded-full bg-white shadow-md transform transition duration-300 ease-in-out ${
          checked ? 'translate-x-[1.2vw]' : 'translate-x-[0.15vw]'
        }`}
      />
    </button>
  </div>
);

const TimePickerPopover = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const parseTime = (timeStr) => {
    if (!timeStr) return { hour: 0, minute: 5 };
    const hrMatch = String(timeStr).match(/(\d+)\s*(?:Hr|Hour|h)/i);
    const minMatch = String(timeStr).match(/(\d+)\s*(?:Min|Minute|m)/i);
    let h = hrMatch ? parseInt(hrMatch[1], 10) : 0;
    let m = minMatch ? parseInt(minMatch[1], 10) : 0;
    if (!hrMatch && !minMatch) {
      const digits = String(timeStr).match(/\d+/);
      if (digits) m = parseInt(digits[0], 10);
    }
    return { hour: Math.min(23, Math.max(0, h)), minute: Math.min(59, Math.max(0, m)) };
  };

  const initial = parseTime(value || '0 Hr 5 Min');
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);

  useEffect(() => {
    const parsed = parseTime(value || '0 Hr 5 Min');
    setHour(parsed.hour);
    setMinute(parsed.minute);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formattedHour = String(hour).padStart(2, '0');
  const formattedMinute = String(minute).padStart(2, '0');
  const displayTime = hour > 0 ? `${hour} Hr ${minute} Min` : `${minute} Mins`;

  const handleApply = () => {
    onChange(displayTime);
    setIsOpen(false);
  };

  const handleCancel = () => {
    const parsed = parseTime(value || '0 Hr 5 Min');
    setHour(parsed.hour);
    setMinute(parsed.minute);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-[0.35vw] bg-white border border-gray-200 rounded-[0.55vw] px-[0.6vw] py-[0.4vw] text-[0.78vw] font-semibold text-gray-800 hover:border-[#5551ff] focus:outline-none shadow-sm cursor-pointer whitespace-nowrap"
      >
        <div className="flex items-center gap-[0.3vw] whitespace-nowrap">
          <Icon icon="lucide:clock" className="w-[0.85vw] h-[0.85vw] text-[#5551ff] shrink-0" />
          <span className="whitespace-nowrap font-semibold text-gray-800 text-[0.75vw]">{displayTime}</span>
        </div>
        <Icon icon="ph:caret-down-bold" className={`w-[0.7vw] h-[0.7vw] text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#5551ff]' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-[115%] z-[9999] w-[15.5vw] min-w-[220px] bg-white rounded-[0.75rem] border-[1.5px] border-slate-200 shadow-[0_10px_30px_rgba(0,0,0,0.12)] p-[0.9vw] space-y-[0.65vw] animate-in fade-in zoom-in-95">
          <style>{`
            .custom-range-slider {
              -webkit-appearance: none;
              appearance: none;
              width: 100%;
              height: 5px;
              background: #e2e8f0;
              border-radius: 9999px;
              outline: none;
              border: none !important;
            }
            .custom-range-slider::-webkit-slider-runnable-track {
              width: 100%;
              height: 5px;
              background: #e2e8f0;
              border-radius: 9999px;
              border: none !important;
              outline: none !important;
            }
            .custom-range-slider::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 15px;
              height: 15px;
              border-radius: 50%;
              background: #5551ff;
              border: none !important;
              outline: none !important;
              box-shadow: 0 2px 5px rgba(85, 81, 255, 0.35);
              margin-top: -5px;
              cursor: pointer;
              transition: transform 0.15s ease;
            }
            .custom-range-slider::-webkit-slider-thumb:hover {
              transform: scale(1.15);
            }
            .custom-range-slider::-moz-range-track {
              width: 100%;
              height: 5px;
              background: #e2e8f0;
              border-radius: 9999px;
              border: none !important;
              outline: none !important;
            }
            .custom-range-slider::-moz-range-thumb {
              width: 15px;
              height: 15px;
              border-radius: 50%;
              background: #5551ff;
              border: none !important;
              outline: none !important;
              box-shadow: 0 2px 5px rgba(85, 81, 255, 0.35);
              cursor: pointer;
            }
          `}</style>

          {/* Header Row */}
          <div className="flex items-center justify-between">
            <span className="text-[1.2vw] font-bold text-[#1e293b] tracking-tight">
              {displayTime}
            </span>
            <span className="text-[0.7vw] font-bold text-[#5551ff] bg-[#eaebf7] px-[0.5vw] py-[0.18vw] rounded-[0.4vw]">
              Time
            </span>
          </div>

          <div className="h-[1px] bg-[#f1f5f9] w-full" />

          {/* Hour Slider */}
          <div className="space-y-[0.3vw]">
            <div className="flex items-center justify-between">
              <span className="text-[0.78vw] font-semibold text-[#334155]">Hour</span>
              <span className="bg-[#eaebf7] text-[#5551ff] text-[0.72vw] font-bold px-[0.5vw] py-[0.12vw] rounded-[0.4vw]">
                {formattedHour} Hr
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="23"
              value={hour}
              onChange={(e) => setHour(parseInt(e.target.value, 10))}
              className="custom-range-slider"
            />
            <div className="flex justify-between text-[0.62vw] text-[#94a3b8] font-medium px-[0.1vw]">
              <span>00</span>
              <span>12</span>
              <span>23</span>
            </div>
          </div>

          {/* Minutes Slider */}
          <div className="space-y-[0.3vw]">
            <div className="flex items-center justify-between">
              <span className="text-[0.78vw] font-semibold text-[#334155]">Minutes</span>
              <span className="bg-[#eaebf7] text-[#5551ff] text-[0.72vw] font-bold px-[0.5vw] py-[0.12vw] rounded-[0.4vw]">
                {formattedMinute} Min
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="59"
              value={minute}
              onChange={(e) => setMinute(parseInt(e.target.value, 10))}
              className="custom-range-slider"
            />
            <div className="flex justify-between text-[0.62vw] text-[#94a3b8] font-medium px-[0.1vw]">
              <span>00</span>
              <span>30</span>
              <span>59</span>
            </div>
          </div>

          {/* Quick Minute Presets */}
          <div className="space-y-[0.25vw] pt-[0.1vw]">
            <span className="text-[0.65vw] font-semibold text-[#94a3b8] block">Quick Presets</span>
            <div className="grid grid-cols-5 gap-[0.25vw]">
              {[5, 15, 30, 45, 60].map((mVal) => (
                <button
                  key={mVal}
                  type="button"
                  onClick={() => {
                    if (mVal === 60) {
                      setHour(1);
                      setMinute(0);
                    } else {
                      setHour(0);
                      setMinute(mVal);
                    }
                  }}
                  className={`py-[0.25vw] rounded-[0.35vw] text-[0.68vw] font-bold border cursor-pointer transition-all ${
                    (mVal === 60 ? (hour === 1 && minute === 0) : (hour === 0 && minute === mVal))
                      ? 'bg-[#5551ff] text-white border-[#5551ff]'
                      : 'bg-white text-[#334155] border-[#e2e8f0] hover:bg-slate-50'
                  }`}
                >
                  {mVal === 60 ? '1 Hr' : `${mVal}m`}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[1px] bg-[#f1f5f9] w-full" />

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-[0.6vw] pt-[0.1vw]">
            <button
              type="button"
              onClick={handleCancel}
              className="text-[#5551ff] hover:opacity-80 text-[0.75vw] font-semibold transition-colors cursor-pointer px-[0.3vw] py-[0.15vw]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="bg-[#5551ff] hover:bg-[#4338ca] text-white px-[1.1vw] py-[0.38vw] rounded-full text-[0.75vw] font-semibold transition-all shadow-md cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const DayPickerPopover = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const parseDay = (dayStr) => {
    if (dayStr === undefined || dayStr === null) return 0;
    const match = String(dayStr).match(/^(\d+)/);
    return match ? Math.max(0, parseInt(match[1], 10)) : 0;
  };

  const initialDay = parseDay(value ?? '0 Days');
  const [days, setDays] = useState(initialDay);

  useEffect(() => {
    setDays(parseDay(value ?? '0 Days'));
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayDays = `${days} ${days === 1 ? 'Day' : 'Days'}`;

  const handleApply = () => {
    onChange(displayDays);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setDays(parseDay(value ?? '0 Days'));
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-[0.35vw] bg-white border border-gray-200 rounded-[0.55vw] px-[0.6vw] py-[0.4vw] text-[0.78vw] font-semibold text-gray-800 hover:border-[#5551ff] focus:outline-none shadow-sm cursor-pointer whitespace-nowrap"
      >
        <div className="flex items-center gap-[0.3vw] whitespace-nowrap">
          <Icon icon="lucide:calendar" className="w-[0.85vw] h-[0.85vw] text-[#5551ff] shrink-0" />
          <span className="whitespace-nowrap font-semibold text-gray-800 text-[0.75vw]">{displayDays}</span>
        </div>
        <Icon icon="ph:caret-down-bold" className={`w-[0.7vw] h-[0.7vw] text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#5551ff]' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 bottom-[115%] z-[9999] w-[15.5vw] min-w-[220px] bg-white rounded-[0.75rem] border-[1.5px] border-slate-200 shadow-[0_10px_30px_rgba(0,0,0,0.12)] p-[0.9vw] space-y-[0.65vw] animate-in fade-in zoom-in-95">
          <style>{`
            .custom-range-slider {
              -webkit-appearance: none;
              appearance: none;
              width: 100%;
              height: 5px;
              background: #e2e8f0;
              border-radius: 9999px;
              outline: none;
              border: none !important;
              margin: 0;
              padding: 0;
            }
            .custom-range-slider::-webkit-slider-runnable-track {
              width: 100%;
              height: 5px;
              background: #e2e8f0;
              border-radius: 9999px;
              border: none !important;
              outline: none !important;
            }
            .custom-range-slider::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 15px;
              height: 15px;
              border-radius: 50%;
              background: #5551ff;
              border: none !important;
              outline: none !important;
              box-shadow: 0 2px 5px rgba(85, 81, 255, 0.35);
              margin-top: -5px;
              cursor: pointer;
              transition: transform 0.15s ease;
            }
            .custom-range-slider::-webkit-slider-thumb:hover {
              transform: scale(1.15);
            }
            .custom-range-slider::-moz-range-track {
              width: 100%;
              height: 5px;
              background: #e2e8f0;
              border-radius: 9999px;
              border: none !important;
              outline: none !important;
            }
            .custom-range-slider::-moz-range-thumb {
              width: 15px;
              height: 15px;
              border-radius: 50%;
              background: #5551ff;
              border: none !important;
              outline: none !important;
              box-shadow: 0 2px 5px rgba(85, 81, 255, 0.35);
              cursor: pointer;
            }
          `}</style>

          {/* Header Row */}
          <div className="flex items-center justify-between">
            <span className="text-[1.2vw] font-bold text-[#1e293b] tracking-tight">
              {displayDays}
            </span>
            <span className="text-[0.7vw] font-bold text-[#5551ff] bg-[#eaebf7] px-[0.5vw] py-[0.18vw] rounded-[0.4vw]">
              Days
            </span>
          </div>

          <div className="h-[1px] bg-[#f1f5f9] w-full" />

          {/* Days Slider */}
          <div className="space-y-[0.3vw]">
            <div className="flex items-center justify-between">
              <span className="text-[0.78vw] font-semibold text-[#334155]">Days Count</span>
              <span className="bg-[#eaebf7] text-[#5551ff] text-[0.72vw] font-bold px-[0.5vw] py-[0.12vw] rounded-[0.4vw]">
                {days} {days === 1 ? 'Day' : 'Days'}
              </span>
            </div>
            <div className="w-full py-1">
              <input
                type="range"
                min="0"
                max="30"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value, 10))}
                className="custom-range-slider"
              />
            </div>
            <div className="flex justify-between text-[0.62vw] text-[#94a3b8] font-medium px-[0.1vw]">
              <span>00</span>
              <span>15</span>
              <span>30</span>
            </div>
          </div>

          {/* Presets */}
          <div className="space-y-[0.25vw] pt-[0.1vw]">
            <span className="text-[0.65vw] font-semibold text-[#94a3b8] block">Quick Presets</span>
            <div className="grid grid-cols-6 gap-[0.2vw]">
              {[0, 1, 3, 5, 7, 30].map((pVal) => (
                <button
                  key={pVal}
                  type="button"
                  onClick={() => setDays(pVal)}
                  className={`py-[0.25vw] rounded-[0.35vw] text-[0.68vw] font-bold border cursor-pointer transition-all ${
                    days === pVal
                      ? 'bg-[#5551ff] text-white border-[#5551ff]'
                      : 'bg-white text-[#334155] border-[#e2e8f0] hover:bg-slate-50'
                  }`}
                >
                  {pVal}D
                </button>
              ))}
            </div>
          </div>

          <div className="h-[1px] bg-[#f1f5f9] w-full" />

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-[0.6vw] pt-[0.1vw]">
            <button
              type="button"
              onClick={handleCancel}
              className="text-[#5551ff] hover:opacity-80 text-[0.75vw] font-semibold transition-colors cursor-pointer px-[0.3vw] py-[0.15vw]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="bg-[#5551ff] hover:bg-[#4338ca] text-white px-[1.1vw] py-[0.38vw] rounded-full text-[0.75vw] font-semibold transition-all shadow-md cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Visibility = ({ onBack, settings, onUpdate, bookName, v_id, folder }) => {
  const [activeAccordion, setActiveAccordion] = useState('email'); // 'email' or 'domain'
  const [createPassword, setCreatePassword] = useState(settings?.password || '');
  const [confirmPassword, setConfirmPassword] = useState(settings?.password || '');
  const [accessKey, setAccessKey] = useState(settings?.accessKey || '');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(true);
  const [isPasswordSaved, setIsPasswordSaved] = useState(() => {
    return Boolean(settings?.isPasswordSaved || (settings?.password && settings?.accessKey));
  });
  const [verificationModal, setVerificationModal] = useState({ isOpen: false, mode: 'password', step: 'verifyPassword' });
  const [verificationPassword, setVerificationPassword] = useState('');
  const [showVerificationPassword, setShowVerificationPassword] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '']);
  const [resendTimer, setResendTimer] = useState(23);
  const otpRefs = useRef([]);

  const [localSettings, setLocalSettings] = useState(() => ({ ...(settings || {}) }));
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocalSettings(prev => ({ ...prev, ...settings }));
    }
  }, [settings]);

  let toast = null;
  try {
    toast = useToast();
  } catch (e) {
    // optional fallback
  }

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [saveErrorMsg, setSaveErrorMsg] = useState('');

  const triggerSuccessToast = (msg) => {
    setSaveSuccessMsg(msg);
    if (toast && typeof toast.success === 'function') {
      toast.success(msg);
    }
    setTimeout(() => setSaveSuccessMsg(''), 3500);
  };

  const triggerErrorToast = (msg) => {
    setSaveErrorMsg(msg);
    if (toast && typeof toast.error === 'function') {
      toast.error(msg);
    }
    setTimeout(() => setSaveErrorMsg(''), 4000);
  };

  const handleSaveVisibility = async () => {
    if (!isDirty) return;
    setIsSaving(true);
    setSaveSuccessMsg('');
    setSaveErrorMsg('');
    try {
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      const emailId = user?.emailId || user?.email;
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

      const currentVid = v_id || localSettings?.v_id || settings?.v_id || settings?.bookName || bookName;
      const currentFolder = folder || localSettings?.folderName || settings?.folderName || 'Recent Book';

      const curAuto = localSettings?.inviteOnly?.autoExpire || settings?.inviteOnly?.autoExpire || {};
      const saveDays = curAuto.days ?? '0 Days';
      const saveTime = curAuto.time ?? '5 Mins';
      const dNum = parseInt((String(saveDays).match(/\d+/) || [0])[0], 10);
      const tNum = parseInt((String(saveTime).match(/\d+/) || [0])[0], 10);
      const saveDuration = (dNum > 0 && tNum > 0) ? `${saveDays} ${saveTime}` : dNum > 0 ? saveDays : saveTime;

      const targetAccess = (localSettings?.type || settings?.type || 'Public').trim();
      const isInviteAccess = targetAccess.toLowerCase().startsWith('invite');

      const updatedShare = {
        access: localSettings?.type || settings?.type || 'Public',
        password: createPassword || localSettings?.password || settings?.password || '',
        accessKey: accessKey || localSettings?.accessKey || settings?.accessKey || '',
        isPasswordSaved: Boolean(localSettings?.isPasswordSaved || settings?.isPasswordSaved || isPasswordSaved),
        inviteOnly: {
          ...(localSettings?.inviteOnly || settings?.inviteOnly || {}),
          autoExpire: {
            ...curAuto,
            enabled: curAuto.enabled ?? true,
            days: saveDays,
            time: saveTime,
            duration: saveDuration,
            grantedAt: isInviteAccess ? new Date().toISOString() : null
          }
        }
      };

      const payload = {
        emailId: emailId,
        v_id: currentVid,
        bookName: currentVid,
        folderName: currentFolder,
        newName: bookName,
        share: updatedShare,
        Customized_Settings: {
          Visibility: updatedShare
        }
      };

      const res = await axios.post(`${backendUrl}/api/flipbook/update-settings`, payload);

      const mergedFinal = {
        ...settings,
        ...localSettings,
        ...updatedShare,
        type: localSettings?.type || settings?.type || 'Public',
        access: localSettings?.type || settings?.type || 'Public',
        Visibility: updatedShare,
        share: updatedShare,
        Customized_Settings: {
          Visibility: updatedShare
        }
      };

      if (onUpdate) {
        onUpdate(mergedFinal);
      }

      // Clear unlocked sessionStorage state on saving visibility settings
      if (currentVid) sessionStorage.removeItem(`unlocked_${currentVid}`);
      const sId = localSettings?.shareId || settings?.shareId || settings?.share?.shareId;
      if (sId) sessionStorage.removeItem(`unlocked_${sId}`);

      setIsDirty(false);
      triggerSuccessToast('Visibility updated successfully!');
    } catch (err) {
      console.error("Error saving visibility settings:", err);
      const errMsg = err.response?.data?.message || "Failed to update visibility settings.";
      triggerErrorToast(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

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

  const handleSendOtp = async () => {
    setVerificationError('');
    setResendTimer(23);
    setOtpValues(['', '', '', '']);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const emailId = getUserEmail();
      const currentVid = v_id || localSettings?.v_id || settings?.v_id || settings?.bookName || bookName;
      if (!emailId) {
        setVerificationError('No logged in user email found.');
        return;
      }
      await axios.post(`${backendUrl}/api/flipbook/send-visibility-otp`, { emailId, v_id: currentVid });
      setVerificationModal(prev => ({ ...prev, step: 'otp' }));
    } catch (err) {
      setVerificationError(err.response?.data?.message || 'Failed to send OTP code.');
    }
  };

  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [showNewPasswordInput, setShowNewPasswordInput] = useState(false);
  const [showNewPasswordConfirm, setShowNewPasswordConfirm] = useState(false);
  const [newAccessKeyInput, setNewAccessKeyInput] = useState('');
  const [showNewAccessKeyInput, setShowNewAccessKeyInput] = useState(false);
  const [newFormError, setNewFormError] = useState('');

  const resetVerificationModal = () => {
    setVerificationModal({ isOpen: false, mode: 'password', step: 'verifyPassword' });
    setVerificationPassword('');
    setVerificationError('');
    setOtpValues(['', '', '', '']);
    setNewPasswordInput('');
    setNewPasswordConfirm('');
    setNewAccessKeyInput('');
    setNewFormError('');
  };

  useEffect(() => {
    let timer;
    if (verificationModal.isOpen && verificationModal.step === 'otp' && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [verificationModal.isOpen, verificationModal.step, resendTimer]);

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

  const handleResendOtp = () => {
    setResendTimer(23);
    setOtpValues(['', '', '', '']);
  };
  const [emailInput, setEmailInput] = useState('');
  const [domainInput, setDomainInput] = useState('');
  const [emailSearch, setEmailSearch] = useState('');
  const [domainSearch, setDomainSearch] = useState('');

  const csvInputRef = useRef(null);

  const currentType = localSettings?.type || settings?.type || 'Public';

  const handleCsvFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result || '';
      const parsedEmails = content
        .split(/[\r\n,;]+/)
        .map(str => str.trim().replace(/^["']|["']$/g, ''))
        .filter(str => str.length > 0 && str.includes('@'));

      if (parsedEmails.length === 0) return;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const existing = localSettings?.inviteOnly?.emails || settings?.inviteOnly?.emails || [];
      const existingSet = new Set(existing.map(item => item.email.toLowerCase()));

      const newItems = [];
      parsedEmails.forEach(email => {
        if (!existingSet.has(email.toLowerCase())) {
          existingSet.add(email.toLowerCase());
          newItems.push({
            email,
            status: emailRegex.test(email) ? 'valid' : 'invalid'
          });
        }
      });

      if (newItems.length > 0) {
        updateInvite('emails', [...existing, ...newItems]);
      }
    };
    reader.readAsText(file);
  };

  const handleCsvInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleCsvFile(file);
    }
    e.target.value = '';
  };

  const handleSavePassword = () => {
    const finalAccessKey = accessKey.trim() || 'Book123';
    setLocalSettings(prev => ({
      ...prev,
      password: createPassword,
      accessKey: finalAccessKey,
      isPasswordSaved: true
    }));
    setIsPasswordSaved(true);
    setIsDirty(true);
  };

  const handleTypeChange = (typeId) => {
    const updated = {
      ...localSettings,
      type: typeId,
      access: typeId
    };
    setLocalSettings(updated);
    setIsDirty(true);
    if (onUpdate) {
      onUpdate(updated);
    }
  };

  const updateInvite = (field, value) => {
    setLocalSettings(prev => ({
      ...prev,
      inviteOnly: {
        ...(prev?.inviteOnly || settings?.inviteOnly || {}),
        [field]: value
      }
    }));
    setIsDirty(true);
  };

  const addEmail = () => {
    if (!emailInput.trim() || !emailInput.includes('@')) return;
    const existingEmails = localSettings?.inviteOnly?.emails || settings?.inviteOnly?.emails || [];
    const newEmails = [...existingEmails, { email: emailInput.trim(), status: 'valid' }];
    updateInvite('emails', newEmails);
    setEmailInput('');
  };

  const removeEmail = (emailOrIndex) => {
    const existingEmails = localSettings?.inviteOnly?.emails || settings?.inviteOnly?.emails || [];
    let newEmails = [];
    if (typeof emailOrIndex === 'string') {
      newEmails = existingEmails.filter(e => (typeof e === 'string' ? e : e.email).toLowerCase() !== emailOrIndex.toLowerCase());
    } else {
      newEmails = existingEmails.filter((_, i) => i !== emailOrIndex);
    }
    updateInvite('emails', newEmails);
  };

  const addDomain = () => {
    if (!domainInput.trim() || !domainInput.includes('.')) return;
    const existingDomains = localSettings?.inviteOnly?.domains || settings?.inviteOnly?.domains || [];
    const newDomains = [...existingDomains, { domain: domainInput.trim(), status: 'valid' }];
    updateInvite('domains', newDomains);
    setDomainInput('');
  };

  const removeDomain = (index) => {
    const existingDomains = localSettings?.inviteOnly?.domains || settings?.inviteOnly?.domains || [];
    const newDomains = existingDomains.filter((_, i) => i !== index);
    updateInvite('domains', newDomains);
  };

  const updateAutoExpire = (field, value) => {
    const prevAuto = localSettings?.inviteOnly?.autoExpire || settings?.inviteOnly?.autoExpire || {};
    const newDays = field === 'days' ? value : (prevAuto.days ?? '0 Days');
    const newTime = field === 'time' ? value : (prevAuto.time ?? '5 Mins');
    const newEnabled = field === 'enabled' ? value : (prevAuto.enabled ?? true);
    
    const dNum = parseInt((String(newDays).match(/\d+/) || [0])[0], 10);
    const tNum = parseInt((String(newTime).match(/\d+/) || [0])[0], 10);
    const newDuration = (dNum > 0 && tNum > 0) ? `${newDays} ${newTime}` : dNum > 0 ? newDays : newTime;

    setLocalSettings(prev => ({
      ...prev,
      inviteOnly: {
        ...(prev?.inviteOnly || settings?.inviteOnly || {}),
        autoExpire: {
          ...prevAuto,
          enabled: newEnabled,
          days: newDays,
          time: newTime,
          duration: newDuration,
          grantedAt: new Date().toISOString()
        }
      }
    }));
    setIsDirty(true);
  };

  const isTypeSelected = (optionId) => {
    if (!currentType) return false;
    const cur = currentType.toLowerCase().trim();
    const opt = optionId.toLowerCase().trim();
    if (cur === opt) return true;
    if (opt.startsWith('invite') && cur.startsWith('invite')) return true;
    return false;
  };

  return (
    <div className="flex flex-col h-full bg-[#f8f9fa] text-[0.8vw]">
      {/* Header */}
      <div className="h-[8vh] flex items-center justify-between px-[1.25vw] bg-white border-b border-gray-100">
        <div className="flex items-center gap-[0.75vw]">
          <Icon
            icon="lucide:eye"
            className="w-[1.25vw] h-[1.25vw] text-gray-800"
          />
          <span className="text-[1.1vw] font-bold text-gray-900">Visibility</span>
        </div>
        <button
          onClick={onBack}
          className="p-[0.4vw] hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
        >
          <Icon icon="ic:round-arrow-back" className="w-[1.1vw] h-[1.1vw] text-gray-600" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-[1.25vw] space-y-[1.5vw]">
        {/* Section Header */}
        <div className="flex items-center gap-[1vw]">
          <h3 className="text-[0.9vw] font-semibold text-gray-800 whitespace-nowrap">Select the Visibility Type</h3>
          <div className="h-[1px] bg-gray-200 w-full mt-[0.1vw]"></div>
        </div>

        {/* Radio Options List */}
        <div className="space-y-[1.25vw] pl-[0.2vw]">
          {VISIBILITY_OPTIONS.map((option) => {
            const selected = isTypeSelected(option.id);

            return (
              <label
                key={option.id}
                onClick={() => handleTypeChange(option.id)}
                className="flex items-center gap-[0.75vw] cursor-pointer group select-none"
              >
                <div className={`w-[1.15vw] h-[1.15vw] rounded-full border-2 flex items-center justify-center transition-all ${
                  selected ? 'border-[#5551FF] bg-white' : 'border-gray-400 group-hover:border-gray-500 bg-white'
                }`}>
                  {selected && <div className="w-[0.55vw] h-[0.55vw] rounded-full bg-[#5551FF]" />}
                </div>
                <span className={`text-[0.85vw] transition-colors ${
                  selected ? 'text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900'
                }`}>
                  {option.label}
                </span>
              </label>
            );
          })}
        </div>

        {/* Note Box below all options */}
        {(() => {
          const selectedOpt = VISIBILITY_OPTIONS.find(opt => isTypeSelected(opt.id)) || VISIBILITY_OPTIONS[0];
          return (
            <div className="p-[1.2vw] bg-[#eaebf7] rounded-[0.75vw] border border-[#e0e3f5] mt-[0.5vw]">
              <p className="text-[0.78vw] text-gray-500 leading-snug font-normal text-justify">
                {selectedOpt.renderDescription()}
              </p>
            </div>
          );
        })()}

        {/* Password Protect Config */}
        {isTypeSelected('Password Protect') && (
          isPasswordSaved ? (
            <div className="space-y-[1.25vw] pt-[0.5vw]">
              {/* Password Section Header */}
              <div className="flex items-center gap-[1vw]">
                <h3 className="text-[0.9vw] font-semibold text-gray-800 whitespace-nowrap">Password</h3>
                <div className="h-[1px] bg-gray-200 w-full mt-[0.1vw]"></div>
              </div>

              {/* Center Lock Badge */}
              <div className="py-[1.25vw]">
                <div className="w-[5.5vw] h-[5.5vw] rounded-full bg-white flex items-center justify-center border border-gray-100 shadow-sm mx-auto mb-[1vw]">
                  <Icon icon="lucide:lock" className="w-[2.2vw] h-[2.2vw] text-gray-800" />
                </div>
                <p className="text-center text-[0.82vw] text-gray-500 font-normal leading-snug">
                  Your Book <strong className="font-semibold text-gray-800">{bookName || settings?.bookName || 'Book Name'}</strong> is Protected by Password
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-[0.75vw] pt-[0.5vw]">
                <button
                  onClick={() => {
                    resetVerificationModal();
                    setVerificationModal({ isOpen: true, mode: 'password', step: 'verifyPassword' });
                  }}
                  className="w-full bg-white border border-gray-200 rounded-[0.75vw] py-[0.75vw] text-[0.82vw] font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm cursor-pointer flex items-center justify-center gap-[0.5vw]"
                >
                  <Icon icon="lucide:refresh-cw" className="w-[0.9vw] h-[0.9vw] text-gray-600" />
                  <span>Change Password</span>
                </button>

                <button
                  onClick={() => {
                    resetVerificationModal();
                    setVerificationModal({ isOpen: true, mode: 'accessKey', step: 'verifyPassword' });
                  }}
                  className="w-full bg-white border border-gray-200 rounded-[0.75vw] py-[0.75vw] text-[0.82vw] font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm cursor-pointer flex items-center justify-center gap-[0.5vw]"
                >
                  <Icon icon="lucide:refresh-cw" className="w-[0.9vw] h-[0.9vw] text-gray-600" />
                  <span>Change Access Key</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-[1.25vw] pt-[0.5vw]">
              {/* Set Password Section Header */}
              <div className="space-y-[0.3vw]">
                <div className="flex items-center gap-[1vw]">
                  <h3 className="text-[0.9vw] font-semibold text-gray-800 whitespace-nowrap">Set Password</h3>
                  <div className="h-[1px] bg-gray-200 w-full mt-[0.1vw]"></div>
                </div>
                <p className="text-[0.75vw] text-gray-500 font-normal">
                  Protect your flipbook with a secure password.
                </p>
              </div>

              {/* Create Password */}
              <div className="space-y-[0.4vw]">
                <label className="text-[0.85vw] font-semibold text-gray-800 block">Create Password</label>
                <div className="relative">
                  <input
                    type={showCreatePassword ? "text" : "password"}
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-gray-300 rounded-[0.6vw] px-[1vw] py-[0.65vw] text-[0.8vw] focus:outline-none focus:border-[#5551FF] shadow-sm pr-[2.5vw]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute right-[0.8vw] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <Icon
                      icon={showCreatePassword ? "lucide:eye" : "lucide:eye-off"}
                      className="w-[1.1vw] h-[1.1vw]"
                    />
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-[0.4vw]">
                <label className="text-[0.85vw] font-semibold text-gray-800 block">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-gray-300 rounded-[0.6vw] px-[1vw] py-[0.65vw] text-[0.8vw] focus:outline-none focus:border-[#5551FF] shadow-sm pr-[2.5vw]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-[0.8vw] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <Icon
                      icon={showConfirmPassword ? "lucide:eye" : "lucide:eye-off"}
                      className="w-[1.1vw] h-[1.1vw]"
                    />
                  </button>
                </div>
              </div>

              {/* Password Validation Checklist */}
              <div className="space-y-[0.5vw] pt-[0.2vw]">
                <h4 className="text-[0.85vw] font-semibold text-gray-800">Your password must include:</h4>
                <div className="space-y-[0.35vw] pl-[0.2vw]">
                  {[
                    { label: '8–16 characters', valid: createPassword.length >= 8 && createPassword.length <= 16 },
                    { label: 'One uppercase letter (A–Z)', valid: /[A-Z]/.test(createPassword) },
                    { label: 'One lowercase letter (a–z)', valid: /[a-z]/.test(createPassword) },
                    { label: 'One number (0–9)', valid: /[0-9]/.test(createPassword) },
                    { label: 'One special character (! @ # & *)', valid: /[!@#&*]/.test(createPassword) },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-[0.5vw]">
                      <Icon
                        icon="lucide:check"
                        className={`w-[0.9vw] h-[0.9vw] ${item.valid ? 'text-green-500' : 'text-gray-300'}`}
                      />
                      <span className={`text-[0.78vw] ${item.valid ? 'text-gray-700' : 'text-gray-500'}`}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enter Access Key */}
              <div className="space-y-[0.4vw]">
                <label className="text-[0.85vw] font-semibold text-gray-800 block">Enter Access Key</label>
                <input
                  type="text"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  placeholder="Book123"
                  className="w-full bg-white border border-gray-300 rounded-[0.6vw] px-[1vw] py-[0.65vw] text-[0.8vw] focus:outline-none focus:border-[#5551FF] shadow-sm"
                />
                <p className="text-gray-500 text-[0.72vw]">User will Enter this key to open this book</p>
              </div>

              {/* Save Password Button */}
              <div className="pt-[0.5vw]">
                <button
                  onClick={handleSavePassword}
                  className="w-full bg-[#5551FF] text-white py-[0.75vw] rounded-[0.6vw] text-[0.85vw] font-semibold hover:bg-[#4338ca] transition-colors shadow-md cursor-pointer flex items-center justify-center"
                >
                  Save Password
                </button>
              </div>
            </div>
          )
        )}

        {/* Invite Only Access Config */}
        {isTypeSelected('Invite Only Access') && (
          <div className="space-y-[0.6vw] pt-[0.5vw]">
            {/* Access Settings Block */}
            <div className="flex items-center gap-[1vw] mb-[0.1vw]">
              <h3 className="text-[0.9vw] font-semibold text-gray-800 whitespace-nowrap">Access Settings Block</h3>
              <div className="h-[1px] bg-gray-200 w-full mt-[0.1vw]"></div>
            </div>

            {/* Auto-Expire Container Card */}
            <div className="bg-white border border-gray-200 rounded-[0.75vw] p-[0.9vw] mt-[1vw] space-y-[0.75vw] shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[0.85vw] font-semibold text-gray-800">Auto-expire in</span>
                {(() => {
                  const isAutoExpireEnabled = localSettings?.inviteOnly?.autoExpire?.enabled ?? settings?.inviteOnly?.autoExpire?.enabled ?? true;
                  const currentDays = localSettings?.inviteOnly?.autoExpire?.days ?? settings?.inviteOnly?.autoExpire?.days ?? '0 Days';
                  const currentTime = localSettings?.inviteOnly?.autoExpire?.time ?? settings?.inviteOnly?.autoExpire?.time ?? '5 Mins';

                  return (
                    <>
                      <button
                        type="button"
                        onClick={() => updateAutoExpire('enabled', !isAutoExpireEnabled)}
                        className={`relative inline-flex items-center h-[1.2vw] w-[2.4vw] shrink-0 cursor-pointer rounded-full transition-all duration-300 ease-in-out border-[1.5px] ${
                          isAutoExpireEnabled ? 'bg-[#5551FF] border-[#5551FF]' : 'bg-gray-200 border-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-[0.9vw] w-[0.9vw] rounded-full bg-white shadow-md transform transition duration-300 ease-in-out ${
                            isAutoExpireEnabled ? 'translate-x-[1.2vw]' : 'translate-x-[0.15vw]'
                          }`}
                        />
                      </button>
                    </>
                  );
                })()}
              </div>

              {(localSettings?.inviteOnly?.autoExpire?.enabled ?? settings?.inviteOnly?.autoExpire?.enabled ?? true) && (
                <div className="grid grid-cols-2 gap-[0.6vw] pt-[0.2vw] animate-in fade-in slide-in-from-top-1 duration-200">
                  <DayPickerPopover
                    value={localSettings?.inviteOnly?.autoExpire?.days ?? settings?.inviteOnly?.autoExpire?.days ?? '0 Days'}
                    onChange={(newDays) => updateAutoExpire('days', newDays)}
                  />
                  <TimePickerPopover
                    value={localSettings?.inviteOnly?.autoExpire?.time ?? settings?.inviteOnly?.autoExpire?.time ?? '5 Mins'}
                    onChange={(newTime) => updateAutoExpire('time', newTime)}
                  />
                </div>
              )}
            </div>

            {/* Invite by Specific Email */}
            <div className="bg-white border border-gray-200 rounded-[0.75vw] shadow-sm overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setActiveAccordion(activeAccordion === 'email' ? null : 'email')}
                className="w-full flex items-center justify-between p-[0.9vw] text-[0.85vw] font-semibold text-gray-800 cursor-pointer hover:bg-gray-50/50 transition-colors"
              >
                <span>Invite by Specific Email</span>
                <Icon
                  icon={activeAccordion === 'email' ? "lucide:chevron-up" : "lucide:chevron-down"}
                  className="w-[1.1vw] h-[1.1vw] text-gray-500"
                />
              </button>

              {activeAccordion === 'email' && (
                <div className="p-[0.9vw] pt-0 space-y-[0.85vw]">
                  {/* Add Emails Section */}
                  <div className="space-y-[0.5vw]">
                    <div className="flex items-center gap-[0.8vw]">
                      <h4 className="text-[0.8vw] font-semibold text-gray-800 whitespace-nowrap">Add Emails</h4>
                      <div className="h-[1px] bg-gray-200/80 w-full mt-[0.1vw]"></div>
                    </div>

                    {/* Inline Email Input + Icon-only Plus Button */}
                    {(() => {
                      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.trim());
                      return (
                        <div className="relative flex items-center">
                          <input
                            type="email"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && isValidEmail) { e.preventDefault(); addEmail(); } }}
                            placeholder="naveen1234@gmail.com"
                            className="w-full bg-white border border-gray-300 rounded-[0.6vw] pl-[0.9vw] pr-[3.2vw] py-[0.6vw] text-[0.78vw] font-medium text-gray-800 focus:outline-none focus:border-[#5551FF] focus:ring-2 focus:ring-[#5551FF]/10 transition-all shadow-xs"
                          />
                          <button
                            type="button"
                            onClick={addEmail}
                            disabled={!isValidEmail}
                            className={`absolute right-[0.35vw] w-[2.1vw] h-[2.1vw] min-w-[26px] min-h-[26px] rounded-[0.45vw] font-semibold transition-all flex items-center justify-center shrink-0 ${
                              isValidEmail
                                ? 'bg-[#5551FF] hover:bg-[#4338ca] text-white cursor-pointer active:scale-95 shadow-sm'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-70'
                            }`}
                            title={isValidEmail ? "Add Email" : "Enter a valid email address"}
                          >
                            <Icon icon="lucide:plus" className="w-[1.1vw] h-[1.1vw] min-w-[16px] min-h-[16px]" />
                          </button>
                        </div>
                      );
                    })()}
                  </div>

                  {/* "or" text divider */}
                  <div className="relative flex items-center justify-center my-[0.2vw]">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200/60"></div>
                    </div>
                    <span className="relative bg-white px-[0.6vw] text-[0.68vw] text-gray-400 font-medium uppercase tracking-wider">or</span>
                  </div>

                  {/* Drag & Drop Upload CSV Box */}
                  <input
                    type="file"
                    ref={csvInputRef}
                    accept=".csv,.txt"
                    onChange={handleCsvInputChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => csvInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files?.[0]) {
                        handleCsvFile(e.dataTransfer.files[0]);
                      }
                    }}
                    className="border border-dashed border-gray-300/90 rounded-[0.7vw] py-[0.9vw] px-[1vw] flex flex-col items-center justify-center gap-[0.3vw] bg-gradient-to-b from-gray-50/40 to-white cursor-pointer hover:border-[#5551FF]/60 hover:bg-[#5551FF]/5 transition-all group shadow-2xs"
                  >
                    <div className="w-[2vw] h-[2vw] rounded-full bg-indigo-50/80 group-hover:bg-indigo-100 flex items-center justify-center text-[#5551FF] transition-colors">
                      <Icon icon="lucide:upload" className="w-[1vw] h-[1vw]" />
                    </div>
                    <p className="text-[0.75vw] text-gray-500 font-normal">
                      Drag & Drop or <span className="text-[#5551FF] font-semibold underline decoration-[#5551FF]/40 underline-offset-2">Upload</span> CSV file
                    </p>
                  </div>

                  {/* Added Email List Section */}
                  <div className="space-y-[0.6vw] pt-[0.2vw]">
                    <div className="flex items-center gap-[0.8vw]">
                      <h4 className="text-[0.8vw] font-semibold text-gray-800 whitespace-nowrap">Added Email List</h4>
                      <div className="h-[1px] bg-gray-200/80 w-full mt-[0.1vw]"></div>
                    </div>

                    {/* Table Container Card */}
                    <div className="bg-white border border-gray-200/80 rounded-[0.75vw] shadow-xs overflow-hidden p-[0.7vw] space-y-[0.6vw]">
                      {/* Search & Sort Header */}
                      <div className="flex items-center gap-[0.5vw]">
                        <div className="flex-1 relative">
                          <Icon icon="lucide:search" className="absolute left-[0.75vw] top-1/2 -translate-y-1/2 text-gray-400 w-[0.85vw] h-[0.85vw]" />
                          <input
                            type="text"
                            value={emailSearch}
                            onChange={(e) => setEmailSearch(e.target.value)}
                            placeholder="Search email..."
                            className="w-full bg-white border border-gray-300 rounded-full pl-[2.2vw] pr-[0.8vw] py-[0.38vw] text-[0.75vw] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#5551FF] focus:ring-2 focus:ring-[#5551FF]/10 transition-all shadow-2xs"
                          />
                        </div>
                        <button
                          type="button"
                          className="flex items-center gap-[0.4vw] bg-gray-900 hover:bg-black text-white px-[1vw] py-[0.38vw] rounded-full text-[0.72vw] font-semibold cursor-pointer shrink-0 transition-all shadow-xs"
                        >
                          <Icon icon="lucide:arrow-up-down" className="w-[0.75vw] h-[0.75vw]" />
                          <span>Sort</span>
                        </button>
                      </div>

                      {/* Added Email List Container */}
                      <div className="border border-gray-200/80 rounded-[0.6vw] overflow-hidden bg-white">
                        {/* Header Bar */}
                        <div className="bg-slate-50 border-b border-gray-200 px-[0.8vw] py-[0.5vw] flex items-center justify-between text-[0.72vw] font-semibold text-gray-700 uppercase tracking-wider select-none pr-[1.4vw]">
                          <span>Emails</span>
                          <span>Action</span>
                        </div>

                        {/* Scrollable Email List Rows */}
                        <div className="max-h-[12vw] overflow-y-auto divide-y divide-gray-100 pr-[0.2vw] [scrollbar-width:thin]">
                          {(() => {
                            const activeEmailList = localSettings?.inviteOnly?.emails ?? settings?.inviteOnly?.emails ?? [];
                            const filteredEmails = activeEmailList.filter(item => {
                              const emailStr = typeof item === 'string' ? item : item.email;
                              return emailStr.toLowerCase().includes(emailSearch.toLowerCase());
                            });

                            if (filteredEmails.length === 0) {
                              return (
                                <div className="p-[1.2vw] text-center text-gray-400 font-normal text-[0.75vw]">
                                  No emails added yet.
                                </div>
                              );
                            }

                            return filteredEmails.map((item, idx) => {
                              const emailStr = typeof item === 'string' ? item : item.email;
                              return (
                                <div key={idx} className="flex items-center justify-between px-[0.8vw] py-[0.45vw] hover:bg-indigo-50/30 transition-colors">
                                  <span title={emailStr} className="text-[0.75vw] text-gray-700 font-medium truncate max-w-[14vw]">
                                    {emailStr}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeEmail(emailStr)}
                                    className="w-[1.6vw] h-[1.6vw] min-w-[22px] min-h-[22px] rounded-[0.4vw] text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer flex items-center justify-center shrink-0 border border-transparent hover:border-red-200/60"
                                    title="Remove email"
                                  >
                                    <Icon icon="lucide:trash-2" className="w-[0.85vw] h-[0.85vw] min-w-[14px] min-h-[14px]" />
                                  </button>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Save Settings Footer Bar */}
      <div className="p-[1vw] bg-white border-t border-gray-200 flex flex-col gap-[0.5vw] shrink-0 sticky bottom-0 z-10 shadow-md mt-auto">
        {saveErrorMsg && (
          <div className="flex items-center gap-[0.4vw] text-red-600 bg-red-50 border border-red-200 px-[0.8vw] py-[0.4vw] rounded-[0.4vw] text-[0.75vw] font-medium animate-in fade-in">
            <Icon icon="lucide:alert-circle" className="w-[0.9vw] h-[0.9vw] text-red-600 shrink-0" />
            <span>{saveErrorMsg}</span>
          </div>
        )}
        <button
          type="button"
          onClick={handleSaveVisibility}
          disabled={!isDirty || isSaving}
          className={`w-full font-bold py-[0.6vw] rounded-[0.5vw] text-[0.8vw] transition-all shadow-md flex items-center justify-center gap-[0.4vw] ${
            isDirty && !isSaving
              ? 'bg-black hover:bg-gray-900 text-white cursor-pointer active:scale-[0.99]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300 shadow-none'
          }`}
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-[0.9vw] w-[0.9vw] min-h-[14px] min-w-[14px] border-2 border-white border-t-transparent" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Icon icon="lucide:save" className="w-[0.9vw] h-[0.9vw] min-w-[14px] min-h-[14px]" />
              <span>Save Visibility Settings</span>
            </>
          )}
        </button>
      </div>

      {/* Verification Modal (Center of Full Screen Window via React Portal) */}
      {verificationModal.isOpen && createPortal(
        <div className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-xs flex items-center justify-center p-[1vw] select-none">
          <div className="bg-white rounded-[1.2vw] p-[1.4vw] shadow-[0_20px_50px_rgba(0,0,0,0.12)] w-[25vw] min-w-[320px] max-w-[420px] relative animate-in fade-in zoom-in-95 duration-200 border border-slate-100/80">
            {/* Header Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-1 pr-[0.5vw]">
                <h2 className="text-[1vw] font-bold text-gray-900 tracking-tight whitespace-nowrap">
                  {verificationModal.mode === 'password' ? 'Change Password' : 'Change Access Key'}
                </h2>
                <div className="h-[1px] bg-gray-200 flex-1 ml-[0.6vw] mt-[0.1vw]"></div>
              </div>
              <button
                type="button"
                onClick={resetVerificationModal}
                className="w-[1.8vw] h-[1.8vw] min-w-[24px] min-h-[24px] rounded-[0.5vw] border border-red-300 text-red-500 hover:bg-red-50 flex items-center justify-center cursor-pointer transition-colors shrink-0"
              >
                <Icon icon="lucide:x" className="w-[0.9vw] h-[0.9vw] min-w-[14px] min-h-[14px] text-red-500" />
              </button>
            </div>

            {verificationModal.step === 'otp' && (
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

                  {/* 4 Digit OTP Inputs */}
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
              </>
            )}

            {verificationModal.step === 'verifyPassword' && (
              <>
                <p className="text-[0.7vw] text-gray-400 font-normal mt-[0.2vw]">
                  {verificationModal.mode === 'password'
                    ? 'Verify your current password to continue.'
                    : 'Verify your current access key to continue.'}
                </p>

                {/* Form Inputs */}
                <div className="mt-[1vw] space-y-[0.35vw]">
                  <label className="text-[0.78vw] font-semibold text-gray-900 block">
                    {verificationModal.mode === 'password'
                      ? 'Enter your current Password'
                      : 'Enter your current Access Key'}
                  </label>
                  <div className="relative">
                    <input
                      type={showVerificationPassword ? "text" : "password"}
                      value={verificationPassword}
                      onChange={(e) => {
                        setVerificationPassword(e.target.value);
                        if (verificationError) setVerificationError('');
                      }}
                      placeholder={verificationModal.mode === 'password' ? "@My current pass123" : "Key123"}
                      className="w-full bg-white border border-gray-300 rounded-[0.5vw] px-[0.8vw] py-[0.5vw] text-[0.78vw] font-medium text-gray-800 focus:outline-none focus:border-[#5551FF] focus:ring-2 focus:ring-[#5551FF]/10 transition-all pr-[2.2vw] shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowVerificationPassword(!showVerificationPassword)}
                      className="absolute right-[0.7vw] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    >
                      <Icon
                        icon={showVerificationPassword ? "lucide:eye" : "lucide:eye-off"}
                        className="w-[1vw] h-[1vw] min-w-[14px] min-h-[14px]"
                      />
                    </button>
                  </div>

                  {verificationError && (
                    <p className="text-[0.7vw] text-red-500 font-medium pt-[0.1vw]">{verificationError}</p>
                  )}

                  <div className="flex justify-end pt-[0.1vw]">
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="text-[0.7vw] font-medium text-[#4f46e5] underline hover:text-[#4338ca] cursor-pointer"
                    >
                      {verificationModal.mode === 'password' ? 'Forgot Password ?' : 'Forgot Access Key ?'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {verificationModal.step === 'newPassword' && (
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
                        type={showNewPasswordConfirm ? "text" : "password"}
                        value={newPasswordConfirm}
                        onChange={(e) => {
                          setNewPasswordConfirm(e.target.value);
                          if (newFormError) setNewFormError('');
                        }}
                        placeholder="@My New pass123"
                        className="w-full bg-white border border-gray-300 rounded-[0.5vw] px-[0.8vw] py-[0.5vw] text-[0.78vw] font-medium text-gray-800 focus:outline-none focus:border-[#5551FF] focus:ring-2 focus:ring-[#5551FF]/10 transition-all pr-[2.2vw] shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPasswordConfirm(!showNewPasswordConfirm)}
                        className="absolute right-[0.7vw] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                      >
                        <Icon
                          icon={showNewPasswordConfirm ? "lucide:eye" : "lucide:eye-off"}
                          className="w-[1vw] h-[1vw] min-w-[14px] min-h-[14px]"
                        />
                      </button>
                    </div>
                  </div>

                  {newFormError && (
                    <p className="text-[0.7vw] text-red-500 font-medium pt-[0.1vw]">{newFormError}</p>
                  )}
                </div>
              </>
            )}

            {verificationModal.step === 'newAccessKey' && (
              <>
                <p className="text-[0.7vw] text-gray-400 font-normal mt-[0.2vw]">
                  Create a new book key to share secure access with your readers.
                </p>

                <div className="mt-[1vw] space-y-[0.7vw]">
                  {/* Your Current Access Key */}
                  <div className="space-y-[0.15vw]">
                    <label className="text-[0.78vw] font-normal text-gray-600 block">
                      Your Current Access Key
                    </label>
                    <p className="text-[0.85vw] font-semibold text-gray-400">
                      {accessKey || settings?.accessKey || 'Book123'}
                    </p>
                  </div>

                  {/* Enter your New Access Key */}
                  <div className="space-y-[0.3vw]">
                    <label className="text-[0.78vw] font-semibold text-gray-900 block">
                      Enter your New Access Key
                    </label>
                    <div className="relative">
                      <input
                        type={showNewAccessKeyInput ? "text" : "password"}
                        value={newAccessKeyInput}
                        onChange={(e) => {
                          setNewAccessKeyInput(e.target.value);
                          if (newFormError) setNewFormError('');
                        }}
                        placeholder="New.Bookkey"
                        className="w-full bg-white border border-gray-300 rounded-[0.5vw] px-[0.8vw] py-[0.5vw] text-[0.78vw] font-medium text-gray-800 focus:outline-none focus:border-[#5551FF] focus:ring-2 focus:ring-[#5551FF]/10 transition-all pr-[2.2vw] shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewAccessKeyInput(!showNewAccessKeyInput)}
                        className="absolute right-[0.7vw] top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                      >
                        <Icon
                          icon={showNewAccessKeyInput ? "lucide:eye" : "lucide:eye-off"}
                          className="w-[1vw] h-[1vw] min-w-[14px] min-h-[14px]"
                        />
                      </button>
                    </div>
                  </div>

                  {/* Note Banner */}
                  <div className="bg-[#f0f2f8] rounded-[0.5vw] p-[0.6vw] px-[0.8vw]">
                    <p className="text-[0.68vw] text-gray-500 leading-snug">
                      <strong className="font-semibold text-gray-800">Note:</strong> Changing your Access Key will disable the current key. Anyone using the old key will no longer be able to access this flipbook.
                    </p>
                  </div>

                  {newFormError && (
                    <p className="text-[0.7vw] text-red-500 font-medium pt-[0.1vw]">{newFormError}</p>
                  )}
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-[0.6vw] mt-[1.2vw]">
              <button
                type="button"
                onClick={resetVerificationModal}
                className="bg-white border border-gray-300 rounded-[0.5vw] py-[0.5vw] text-[0.78vw] font-bold text-gray-800 hover:bg-gray-50 transition-all cursor-pointer shadow-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (verificationModal.step === 'verifyPassword') {
                    if (!verificationPassword.trim()) {
                      setVerificationError(
                        verificationModal.mode === 'password'
                          ? 'Please enter your current password.'
                          : 'Please enter your current access key.'
                      );
                      return;
                    }
                    setVerificationError('');
                    setIsSaving(true);
                    try {
                      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                      const currentVid = v_id || localSettings?.v_id || settings?.v_id || settings?.bookName || bookName;
                      await axios.post(`${backendUrl}/api/flipbook/verify-credential`, {
                        v_id: currentVid,
                        input: verificationPassword.trim(),
                        mode: verificationModal.mode // 'password' or 'accessKey'
                      });
                      setVerificationModal(prev => ({
                        ...prev,
                        step: prev.mode === 'password' ? 'newPassword' : 'newAccessKey'
                      }));
                    } catch (err) {
                      setVerificationError(
                        err.response?.data?.message || 
                        (verificationModal.mode === 'password' ? 'Current password is incorrect.' : 'Current access key is incorrect.')
                      );
                    } finally {
                      setIsSaving(false);
                    }
                  } else if (verificationModal.step === 'otp') {
                    const code = otpValues.join('').trim();
                    if (!code || code.length < 4) {
                      setVerificationError('Please enter the verification code.');
                      return;
                    }
                    setVerificationError('');
                    setIsSaving(true);
                    try {
                      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                      const emailId = getUserEmail();
                      const currentVid = v_id || localSettings?.v_id || settings?.v_id || settings?.bookName || bookName;
                      await axios.post(`${backendUrl}/api/flipbook/verify-visibility-otp`, {
                        emailId,
                        v_id: currentVid,
                        otp: code
                      });
                      setVerificationModal(prev => ({
                        ...prev,
                        step: prev.mode === 'password' ? 'newPassword' : 'newAccessKey'
                      }));
                    } catch (err) {
                      setVerificationError(err.response?.data?.message || 'Invalid OTP code.');
                    } finally {
                      setIsSaving(false);
                    }
                  } else if (verificationModal.step === 'newPassword') {
                    if (!newPasswordInput.trim()) {
                      setNewFormError('Please enter your new password.');
                      return;
                    }
                    if (newPasswordInput !== newPasswordConfirm) {
                      setNewFormError('Passwords do not match.');
                      return;
                    }
                    setNewFormError('');
                    setIsSaving(true);
                    try {
                      const storedUser = localStorage.getItem('user');
                      const user = storedUser ? JSON.parse(storedUser) : null;
                      const emailId = user?.emailId || user?.email;
                      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

                      const currentVid = v_id || localSettings?.v_id || settings?.v_id || settings?.bookName || bookName;
                      const currentFolder = folder || localSettings?.folderName || settings?.folderName || 'Recent Book';

                      const updatedShare = {
                        access: localSettings?.type || settings?.type || 'Password Protect',
                        password: newPasswordInput.trim(),
                        accessKey: accessKey || localSettings?.accessKey || settings?.accessKey || 'Book123',
                        isPasswordSaved: true,
                        inviteOnly: localSettings?.inviteOnly || settings?.inviteOnly || {}
                      };

                      const payload = {
                        emailId: emailId,
                        v_id: currentVid,
                        bookName: currentVid,
                        folderName: currentFolder,
                        newName: bookName,
                        share: updatedShare,
                        Customized_Settings: {
                          Visibility: updatedShare
                        }
                      };

                      await axios.post(`${backendUrl}/api/flipbook/update-settings`, payload);

                      setCreatePassword(newPasswordInput.trim());
                      setConfirmPassword(newPasswordInput.trim());
                      setIsPasswordSaved(true);
                      setLocalSettings(prev => ({ ...prev, ...updatedShare }));

                      if (onUpdate) {
                        onUpdate({ ...settings, ...updatedShare });
                      }

                      resetVerificationModal();
                      triggerSuccessToast('Password updated successfully!');
                    } catch (err) {
                      setNewFormError(err.response?.data?.message || 'Failed to update password.');
                    } finally {
                      setIsSaving(false);
                    }
                  } else if (verificationModal.step === 'newAccessKey') {
                    if (!newAccessKeyInput.trim()) {
                      setNewFormError('Please enter a new access key.');
                      return;
                    }
                    setNewFormError('');
                    setIsSaving(true);
                    try {
                      const storedUser = localStorage.getItem('user');
                      const user = storedUser ? JSON.parse(storedUser) : null;
                      const emailId = user?.emailId || user?.email;
                      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

                      const currentVid = v_id || localSettings?.v_id || settings?.v_id || settings?.bookName || bookName;
                      const currentFolder = folder || localSettings?.folderName || settings?.folderName || 'Recent Book';

                      const updatedShare = {
                        access: localSettings?.type || settings?.type || 'Password Protect',
                        password: createPassword || localSettings?.password || settings?.password || '',
                        accessKey: newAccessKeyInput.trim(),
                        isPasswordSaved: true,
                        inviteOnly: localSettings?.inviteOnly || settings?.inviteOnly || {}
                      };

                      const payload = {
                        emailId: emailId,
                        v_id: currentVid,
                        bookName: currentVid,
                        folderName: currentFolder,
                        newName: bookName,
                        share: updatedShare,
                        Customized_Settings: {
                          Visibility: updatedShare
                        }
                      };

                      await axios.post(`${backendUrl}/api/flipbook/update-settings`, payload);

                      setAccessKey(newAccessKeyInput.trim());
                      setIsPasswordSaved(true);
                      setLocalSettings(prev => ({ ...prev, ...updatedShare }));

                      if (onUpdate) {
                        onUpdate({ ...settings, ...updatedShare });
                      }

                      resetVerificationModal();
                      triggerSuccessToast('Access Key updated successfully!');
                    } catch (err) {
                      setNewFormError(err.response?.data?.message || 'Failed to update access key.');
                    } finally {
                      setIsSaving(false);
                    }
                  }
                }}
                disabled={isSaving}
                className="bg-black text-white rounded-[0.5vw] py-[0.5vw] text-[0.78vw] font-bold hover:bg-gray-900 transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : verificationModal.step === 'newPassword' ? (
                  'Change Password'
                ) : verificationModal.step === 'newAccessKey' ? (
                  'Change Access Key'
                ) : (
                  'Verify'
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Visibility;
