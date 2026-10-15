import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { User, Building, MapPin, Globe, Check, X, Upload, Trash2 } from 'lucide-react';
import { Icon } from '@iconify/react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { parsePhoneNumberFromString, isValidPhoneNumber } from 'libphonenumber-js';
import { resolveUploadsPath } from '../../../utils/supabaseUtils';

// Reusable phone component with the exact same UI, dropdown, length validation, and green checkmark as Interaction WhatsApp
const ProfilePhoneField = ({ value, countryCode, onChange, onBlur, placeholder = "1234567890", hasError }) => {
  const defaultCountry = 'in';
  const defaultDialCode = '91';

  // Clean incoming countryCode and determine initial country
  const getCountryFromCode = (code) => {
    const rawDial = (code || '+91').replace(/\D/g, '') || defaultDialCode;
    try {
      const parsed = parsePhoneNumberFromString('+' + rawDial + '1234567890');
      if (parsed && parsed.country) return parsed.country.toLowerCase();
    } catch (e) {}
    if (rawDial === '1') return 'us';
    if (rawDial === '44') return 'gb';
    if (rawDial === '91') return 'in';
    return defaultCountry;
  };

  const initialDialCode = (countryCode || '+91').replace(/\D/g, '') || defaultDialCode;
  const [selectedCountry, setSelectedCountry] = useState(() => getCountryFromCode(countryCode));
  const [dialCode, setDialCode] = useState(initialDialCode);
  const [localValue, setLocalValue] = useState(() => (value || '').replace(/\D/g, ''));
  const containerRef = useRef(null);

  // Sync only if countryCode or value changes from external updates (e.g. loaded user profile)
  useEffect(() => {
    const rawDial = (countryCode || '+91').replace(/\D/g, '') || defaultDialCode;
    const rawNum = (value || '').replace(/\D/g, '');
    setLocalValue(rawNum);
    setDialCode(rawDial);
    setSelectedCountry(getCountryFromCode(countryCode));
  }, [countryCode]);

  // Validation with libphonenumber-js (same as InteractionPanel)
  let isInvalid = false;
  let hasDigits = localValue.trim().length > 0;
  if (hasDigits) {
    try {
      isInvalid = !isValidPhoneNumber(localValue, selectedCountry.toUpperCase());
    } catch (e) {
      isInvalid = true;
    }
  }

  const isValidAndFilled = hasDigits && !isInvalid;
  const textColor = isInvalid ? '#EF4444' : '#374151';
  const borderColor = hasError || isInvalid ? '#EF4444' : (isValidAndFilled ? '#22C55E' : '#D1D5DB');
  const bgColor = isInvalid ? '#FEF2F2' : '#F3F4F6';

  useEffect(() => {
    if (!containerRef.current) return;
    const removeTitle = () => {
      if (!containerRef.current) return;
      const flags = containerRef.current.querySelectorAll('.selected-flag');
      flags.forEach(el => {
        if (el.hasAttribute('title')) el.removeAttribute('title');
      });
    };
    removeTitle();
    const observer = new MutationObserver(removeTitle);
    observer.observe(containerRef.current, { childList: true, subtree: true, attributes: true, attributeFilter: ['title'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full h-full relative" ref={containerRef}>
      <style>{`
        .profile-phone-container .react-tel-input .flag-dropdown .selected-flag,
        .profile-phone-container .react-tel-input .flag-dropdown:hover .selected-flag,
        .profile-phone-container .react-tel-input .flag-dropdown.open-dropdown .selected-flag,
        .profile-phone-container .react-tel-input .flag-dropdown:focus .selected-flag {
          background-color: transparent !important;
          width: 100% !important;
          justify-content: center !important;
        }
        .profile-phone-container .react-tel-input .country-list .country {
          padding: 0.6vw 0.6vw 0.6vw 2.6vw !important;
        }
        .profile-phone-container .react-tel-input .country-list .flag {
          left: 0.8vw !important;
          margin-top: 0.2vw !important;
        }
        .profile-phone-container .react-tel-input .country-list {
          margin: 0 !important;
          left: 0 !important;
          transform: none !important;
          top: 100% !important;
          bottom: auto !important;
          margin-top: 0.2vw !important;
          z-index: 99999 !important;
        }
      `}</style>
      <div className="profile-phone-container w-full h-[2.6vw] relative">
        <PhoneInput
          country={selectedCountry}
          preferredCountries={['in', 'us', 'gb']}
          disableCountryGuess={true}
          value={'+' + dialCode + localValue}
          onChange={(phone, data) => {
            let nationalNum = phone;
            if (data && data.dialCode && phone.startsWith(data.dialCode)) {
              nationalNum = phone.substring(data.dialCode.length);
            }
            setLocalValue(nationalNum);

            const newDialCode = data?.dialCode ? `+${data.dialCode}` : `+${dialCode}`;
            if (data && data.countryCode && data.countryCode !== selectedCountry) {
              setSelectedCountry(data.countryCode);
              setDialCode(data.dialCode);
            }
            onChange(nationalNum, newDialCode);
          }}
          onBlur={() => {
            if (onBlur) onBlur(localValue, `+${dialCode}`);
          }}
          placeholder={placeholder}
          containerStyle={{
            width: '100%',
            height: '100%'
          }}
          inputStyle={{
            width: '100%',
            height: '100%',
            border: `1px solid ${borderColor}`,
            borderRadius: '0.6vw',
            fontSize: '0.85vw',
            color: textColor,
            fontWeight: '500',
            paddingLeft: '3.8vw',
            backgroundColor: '#FFFFFF',
            outline: 'none',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            transition: 'all 0.3s ease'
          }}
          buttonStyle={{
            backgroundColor: bgColor,
            border: `1px solid ${borderColor}`,
            borderRight: '1px solid #D1D5DB',
            borderRadius: '0.6vw 0 0 0.6vw',
            width: '3.2vw',
            height: '100%',
            top: '0',
            left: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease'
          }}
          dropdownStyle={{
            width: '14vw',
            maxHeight: '20vh',
            fontSize: '0.8vw',
            borderRadius: '0.6vw',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            border: '1px solid #E5E7EB',
            textAlign: 'left',
            zIndex: 50
          }}
        />
        {/* Green checkmark inside input when valid */}
        {isValidAndFilled && (
          <div className="absolute right-[0.8vw] top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10">
            <div className="w-[1.1vw] h-[1.1vw] bg-[#22C55E] rounded-full flex items-center justify-center shadow-sm">
              <Icon icon="lucide:check" className="text-white text-[0.7vw]" strokeWidth="3" />
            </div>
          </div>
        )}
      </div>
      {isInvalid && (
        <div className="text-[#EF4444] text-[0.68vw] font-normal mt-[0.3vw]">
          Please enter the valid number *
        </div>
      )}
    </div>
  );
};

const EditProfile = ({ user, setUser }) => {
  const [editedUser, setEditedUser] = useState(user);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || '';

  useEffect(() => {
    setEditedUser(user);
    setErrors({});
  }, [user]);

  const isEdited = JSON.stringify(user) !== JSON.stringify(editedUser);

  const validate = () => {
    let newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const urlRegex = /^(https?:\/\/)?([\w\d\-]+\.)+\w{2,}(\/.*)?$/i;

    if (editedUser.email && !emailRegex.test(editedUser.email)) newErrors.email = "Invalid email format";
    if (editedUser.mobile && editedUser.mobile.trim()) {
      const dial = (editedUser.countryCode || '+91').replace(/\D/g, '');
      const fullNumber = '+' + dial + editedUser.mobile.replace(/\D/g, '');
      try {
        if (!isValidPhoneNumber(fullNumber)) {
          newErrors.mobile = "Invalid mobile number for selected country";
        }
      } catch (e) {
        newErrors.mobile = "Invalid mobile number";
      }
    }
    if (editedUser.companyEmail && !emailRegex.test(editedUser.companyEmail)) newErrors.companyEmail = "Invalid email format";
    if (editedUser.website && !urlRegex.test(editedUser.website)) newErrors.website = "Invalid URL format";
    if (editedUser.pincode && !/^\d{5,6}$/.test(editedUser.pincode)) newErrors.pincode = "Invalid Pin Code";

    if (editedUser.socials?.website && !urlRegex.test(editedUser.socials.website)) newErrors.socialWebsite = "Invalid URL format";
    if (editedUser.socials?.instagram && !urlRegex.test(editedUser.socials.instagram)) newErrors.instagram = "Invalid URL format";
    if (editedUser.socials?.linkedin && !urlRegex.test(editedUser.socials.linkedin)) newErrors.linkedin = "Invalid URL format";
    if (editedUser.socials?.facebook && !urlRegex.test(editedUser.socials.facebook)) newErrors.facebook = "Invalid URL format";
    if (editedUser.socials?.whatsapp && !urlRegex.test(editedUser.socials.whatsapp)) newErrors.whatsapp = "Invalid URL format";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateField = (field, value) => {
    let newErrors = { ...errors };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const urlRegex = /^(https?:\/\/)?([\w\d\-]+\.)+\w{2,}(\/.*)?$/i;

    switch (field) {
      case 'email':
      case 'companyEmail':
        if (value && !emailRegex.test(value)) newErrors[field] = "Invalid email format";
        else delete newErrors[field];
        break;
      case 'mobile':
        if (value && value.trim()) {
          const dial = (editedUser.countryCode || '+91').replace(/\D/g, '');
          const fullNumber = '+' + dial + value.replace(/\D/g, '');
          try {
            if (!isValidPhoneNumber(fullNumber)) {
              newErrors.mobile = "Invalid mobile number for selected country";
            } else {
              delete newErrors.mobile;
            }
          } catch (e) {
            newErrors.mobile = "Invalid mobile number";
          }
        } else {
          delete newErrors.mobile;
        }
        break;
      case 'website':
      case 'socialWebsite':
      case 'instagram':
      case 'linkedin':
      case 'facebook':
      case 'whatsapp':
        if (value && !urlRegex.test(value)) newErrors[field] = "Invalid URL format";
        else delete newErrors[field];
        break;
      case 'pincode':
        if (value && !/^\d{5,6}$/.test(value)) newErrors.pincode = "Invalid Pin Code";
        else delete newErrors.pincode;
        break;
      default:
        break;
    }
    setErrors(newErrors);
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const email = editedUser.email || editedUser.emailId;
      const res = await axios.post(`${backendUrl}/api/profile/save`, {
        emailId: email,
        ...editedUser
      });

      if (res.data?.success && res.data?.profile) {
        const p = res.data.profile;
        const merged = {
          ...editedUser,
          ...p,
          email: p.emailId || email,
          emailId: p.emailId || email,
          company_logo_url: p.company_logo_url || p.companyLogo || editedUser.company_logo_url || editedUser.companyLogo || '',
          companyLogo: p.company_logo_url || p.companyLogo || editedUser.company_logo_url || editedUser.companyLogo || '',
          services: p.services || editedUser.services || [],
          socials: {
            ...(editedUser.socials || {}),
            ...(p.socials || {})
          }
        };
        if (setUser) setUser(merged);

        try {
          localStorage.setItem('user_profile', JSON.stringify(merged));
          const stored = localStorage.getItem('user');
          const parsed = stored ? JSON.parse(stored) : {};
          localStorage.setItem('user', JSON.stringify({
            ...parsed,
            name: merged.name,
            emailId: merged.emailId,
            picture: merged.picture,
            avatarBgColor: merged.avatarBgColor
          }));
          window.dispatchEvent(new CustomEvent('profileUpdate', { detail: merged }));
        } catch (e) {}
      } else {
        if (setUser) setUser(editedUser);
        try {
          localStorage.setItem('user_profile', JSON.stringify(editedUser));
          window.dispatchEvent(new CustomEvent('profileUpdate', { detail: editedUser }));
        } catch (e) {}
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      if (setUser) setUser(editedUser);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedUser(user);
    setErrors({});
  };

  const [portalTarget, setPortalTarget] = useState(null);

  useEffect(() => {
    setPortalTarget(document.getElementById('save-buttons-portal-target'));
  }, []);

  const saveActions = (
    <div className="flex gap-[0.5vw]">
      <button
        type="button"
        disabled={isSaving || !isEdited}
        onClick={handleCancel}
        className="flex items-center gap-[0.3vw] px-[1.2vw] py-[0.55vw] border border-gray-300 rounded-[0.5vw] text-[0.85vw] font-medium text-gray-600 hover:text-gray-900 bg-white transition-colors disabled:opacity-40"
      >
        <X size="0.9vw" /> Cancel
      </button>
      <button
        type="button"
        disabled={isSaving || !isEdited}
        onClick={handleSave}
        className="flex items-center gap-[0.3vw] px-[1.2vw] py-[0.55vw] bg-[#34a853] hover:bg-[#2d9249] rounded-[0.5vw] text-[0.85vw] font-medium text-white transition-colors shadow-sm disabled:opacity-50"
      >
        {isSaving ? (
          <Icon icon="line-md:loading-loop" className="w-[0.9vw] h-[0.9vw]" />
        ) : (
          <Check size="0.9vw" />
        )}
        {isSaving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );

  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [isProfileTypeDropdownOpen, setIsProfileTypeDropdownOpen] = useState(false);
  const [isIndustryDropdownOpen, setIsIndustryDropdownOpen] = useState(false);
  const [activeContactCountryDropdown, setActiveContactCountryDropdown] = useState(null);
  const [isAddingService, setIsAddingService] = useState(false);
  const [newServiceInput, setNewServiceInput] = useState('');
  const [isAddingSocial, setIsAddingSocial] = useState(false);
  const [selectedSocialToAdd, setSelectedSocialToAdd] = useState('twitter');

  const profileTypeOptions = [
    { label: 'Individual', icon: 'lucide:user' },
    { label: 'Company / Agency', icon: 'lucide:building-2' },
    { label: 'Organization', icon: 'lucide:users' },
    { label: 'Freelancer', icon: 'lucide:briefcase' }
  ];

  const industryOptions = [
    'Software Development',
    'Design & Creative',
    'Marketing & Advertising',
    'E-commerce & Retail',
    'Education & Training',
    'Finance & Banking',
    'Healthcare & Medical',
    'Media & Publishing',
    'Architecture & Real Estate',
    'Manufacturing'
  ];



  // Helper for services tags
  const servicesList = Array.isArray(editedUser?.services)
    ? editedUser.services
    : (typeof editedUser?.services === 'string' && editedUser.services.trim()
        ? editedUser.services.split(',').map(s => s.trim()).filter(Boolean)
        : ['Website', 'Mobile Application', 'IDC', '3D Models', '3D Animations', 'Immencive Website', 'Customized Designs']);

  const handleAddService = () => {
    if (!newServiceInput.trim()) return;
    const val = newServiceInput.trim();
    if (!servicesList.includes(val)) {
      setEditedUser({ ...editedUser, services: [...servicesList, val] });
    }
    setNewServiceInput('');
    setIsAddingService(false);
  };

  const handleRemoveService = (serviceToRemove) => {
    const nextServices = servicesList.filter(s => s !== serviceToRemove);
    setEditedUser({ ...editedUser, services: nextServices });
  };

  // Helper for multiple contact numbers
  const contactNumbersList = (editedUser?.contactNumbers && editedUser.contactNumbers.length > 0)
    ? editedUser.contactNumbers
    : [
        { label: 'Enter Text Label 1', countryCode: '+91', number: '' },
        { label: 'Enter Text Label 2', countryCode: '+91', number: '' }
      ];

  const handleContactNumberChange = (index, field, value) => {
    const nextList = contactNumbersList.map((c, i) => i === index ? { ...c, [field]: value } : c);
    setEditedUser({ ...editedUser, contactNumbers: nextList });
  };

  const handleContactNumberFullChange = (index, nationalNum, newDialCode) => {
    const nextList = contactNumbersList.map((c, i) => 
      i === index ? { ...c, number: nationalNum, countryCode: newDialCode } : c
    );
    setEditedUser({ ...editedUser, contactNumbers: nextList });
  };

  const handleAddContactNumber = () => {
    const nextIndex = contactNumbersList.length + 1;
    const nextList = [
      ...contactNumbersList,
      { label: `Enter Text Label ${nextIndex}`, countryCode: '+91', number: '' }
    ];
    setEditedUser({ ...editedUser, contactNumbers: nextList });
  };

  const handleRemoveContactNumber = (index) => {
    const nextList = contactNumbersList.filter((_, i) => i !== index);
    setEditedUser({ ...editedUser, contactNumbers: nextList });
  };

  return (
    <div className="flex flex-col flex-1 w-full relative h-full pt-[0.8vw]">
      {/* Header section with Title, Subtitle, and Portal Save Actions */}
      <div className="flex justify-between items-start mb-[1.8vw] mt-[0.8vw]">
        <div>
          <h2 className="text-[1.5vw] font-semibold text-gray-900 tracking-normal">Edit Profile</h2>
          <p className="text-[0.75vw] text-gray-400 mt-[0.2vw]">Only your actions and activities will appear here.</p>
        </div>
        {portalTarget ? createPortal(saveActions, portalTarget) : saveActions}
      </div>

      <div className="flex flex-col gap-[2.5vw]">
        {/* Personal Details */}
        <section>
          <div className="flex items-center gap-[0.5vw] mb-[1.2vw]">
            <User size="1.1vw" className="text-gray-800" strokeWidth={2} />
            <h3 className="text-[0.95vw] font-semibold text-gray-800">Personal Details</h3>
          </div>

          <div className="flex flex-col gap-[1.2vw]">
            {/* Row 1: Full Name & Display Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[1.5vw]">
              <div>
                <label className="block text-[0.8vw] font-semibold text-gray-800 mb-[0.4vw]">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={editedUser?.name || ''}
                  onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-[0.6vw] px-[1vw] py-[0.65vw] text-[0.85vw] focus:outline-none focus:border-gray-300 text-gray-700 bg-white"
                />
              </div>

              <div>
                <label className="block text-[0.8vw] font-semibold text-gray-800 mb-[0.4vw]">
                  Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Johnny"
                  value={editedUser?.displayName || ''}
                  onChange={(e) => setEditedUser({ ...editedUser, displayName: e.target.value })}
                  className="w-full border border-gray-200 rounded-[0.6vw] px-[1vw] py-[0.65vw] text-[0.85vw] focus:outline-none focus:border-gray-300 text-gray-700 bg-white"
                />
              </div>
            </div>

            {/* Row 2: Email ID & Mobile Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[1.5vw]">
              <div>
                <label className="block text-[0.8vw] font-semibold text-gray-800 mb-[0.4vw]">
                  Email ID <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-[1vw] flex items-center justify-center pointer-events-none">
                    <Icon icon="logos:google-icon" className="w-[1.1vw] h-[1.1vw]" />
                  </div>
                  <input
                    type="email"
                    placeholder="e.g. john@example.com"
                    value={editedUser?.email || ''}
                    disabled
                    className="w-full border border-gray-200 bg-white cursor-default pointer-events-none rounded-[0.6vw] pl-[2.8vw] pr-[1vw] py-[0.65vw] text-[0.85vw] focus:outline-none text-gray-700 font-medium"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-[0.65vw] mt-[0.2vw]">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-[0.8vw] font-semibold text-gray-800 mb-[0.4vw]">
                  Mobile Number
                </label>
                <div className="w-full min-h-[2.6vw]">
                  <ProfilePhoneField
                    value={editedUser?.mobile || ''}
                    countryCode={editedUser?.countryCode || '+91'}
                    onChange={(nationalNum, newDialCode) => {
                      setEditedUser(prev => ({
                        ...prev,
                        mobile: nationalNum,
                        countryCode: newDialCode
                      }));
                      setErrors(prev => ({ ...prev, mobile: null }));
                    }}
                    onBlur={(val) => validateField('mobile', val)}
                    hasError={Boolean(errors.mobile)}
                    placeholder="1234567890"
                  />
                </div>
                {errors.mobile && <p className="text-red-500 text-[0.65vw] mt-[0.2vw]">{errors.mobile}</p>}
              </div>
            </div>

            {/* Row 3: About */}
            <div>
              <label className="block text-[0.8vw] font-semibold text-gray-800 mb-[0.4vw]">
                About <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Tell us a little about yourself..."
                value={editedUser?.about || ''}
                onChange={(e) => setEditedUser({ ...editedUser, about: e.target.value })}
                className="w-full border border-gray-200 rounded-[0.6vw] px-[1vw] py-[0.8vw] text-[0.85vw] focus:outline-none focus:border-gray-300 resize-none text-gray-700 bg-white leading-relaxed"
              />
            </div>
          </div>
        </section>

        {/* Professional Details */}
        <section>
          <div className="flex items-center gap-[0.5vw] mb-[1.2vw]">
            <Icon icon="lucide:building-2" className="w-[1.2vw] h-[1.2vw] text-gray-800" />
            <h3 className="text-[0.95vw] font-semibold text-gray-800">Professional Details</h3>
          </div>

          <div className="flex flex-col gap-[1.2vw]">
            {/* Row 1: Profile Type & Company / Organization Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[1.5vw]">
              {/* Profile Type Custom Dropdown */}
              <div className="relative">
                <label className="block text-[0.8vw] font-semibold text-gray-800 mb-[0.4vw]">
                  Profile Type <span className="text-red-500">*</span>
                </label>
                <div
                  onClick={() => setIsProfileTypeDropdownOpen(!isProfileTypeDropdownOpen)}
                  className="flex items-center justify-between border border-gray-200 rounded-[0.6vw] px-[1vw] py-[0.65vw] bg-white cursor-pointer hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-[0.6vw] text-[0.85vw] text-gray-800">
                    <Icon icon={profileTypeOptions.find(p => p.label === (editedUser?.profileType || 'Individual'))?.icon || 'lucide:user'} className="w-[1vw] h-[1vw] text-gray-700" />
                    <span className="font-medium">{editedUser?.profileType || 'Individual'}</span>
                  </div>
                  <Icon icon="lucide:chevron-down" className="w-[0.9vw] h-[0.9vw] text-gray-400" />
                </div>

                {isProfileTypeDropdownOpen && (
                  <div className="absolute top-[calc(100%+0.3vw)] left-0 w-full bg-white border border-gray-200 rounded-[0.5vw] shadow-lg py-[0.3vw] z-50">
                    {profileTypeOptions.map((opt) => (
                      <div
                        key={opt.label}
                        onClick={() => {
                          setEditedUser({ ...editedUser, profileType: opt.label });
                          setIsProfileTypeDropdownOpen(false);
                        }}
                        className={`flex items-center gap-[0.6vw] px-[1vw] py-[0.5vw] hover:bg-gray-50 cursor-pointer text-[0.8vw] ${editedUser?.profileType === opt.label ? 'bg-gray-50 font-semibold text-gray-900' : 'text-gray-700'}`}
                      >
                        <Icon icon={opt.icon} className="w-[0.95vw] h-[0.95vw]" />
                        <span>{opt.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[0.8vw] font-semibold text-gray-800 mb-[0.4vw]">
                  Company / Organization Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fist-o Tech Private Limited"
                  value={editedUser?.companyName || ''}
                  onChange={(e) => setEditedUser({ ...editedUser, companyName: e.target.value })}
                  className="w-full border border-gray-200 rounded-[0.6vw] px-[1vw] py-[0.65vw] text-[0.85vw] focus:outline-none focus:border-gray-300 text-gray-700 bg-white"
                />
              </div>
            </div>

            {/* Row 2: Industry Type & Company Gmail */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[1.5vw]">
              {/* Industry Type Custom Dropdown */}
              <div className="relative">
                <label className="block text-[0.8vw] font-semibold text-gray-800 mb-[0.4vw]">
                  Industry Type <span className="text-red-500">*</span>
                </label>
                <div
                  onClick={() => setIsIndustryDropdownOpen(!isIndustryDropdownOpen)}
                  className="flex items-center justify-between border border-gray-200 rounded-[0.6vw] px-[1vw] py-[0.65vw] bg-white cursor-pointer hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-[0.6vw] text-[0.85vw] text-gray-800">
                    <Icon icon="lucide:line-chart" className="w-[1vw] h-[1vw] text-gray-700" />
                    <span className="font-medium">{editedUser?.industryType || 'Software Development'}</span>
                  </div>
                  <Icon icon="lucide:chevron-down" className="w-[0.9vw] h-[0.9vw] text-gray-400" />
                </div>

                {isIndustryDropdownOpen && (
                  <div className="absolute top-[calc(100%+0.3vw)] left-0 w-full bg-white border border-gray-200 rounded-[0.5vw] shadow-lg py-[0.3vw] z-50 max-h-[14vw] overflow-y-auto">
                    {industryOptions.map((ind) => (
                      <div
                        key={ind}
                        onClick={() => {
                          setEditedUser({ ...editedUser, industryType: ind });
                          setIsIndustryDropdownOpen(false);
                        }}
                        className={`flex items-center gap-[0.6vw] px-[1vw] py-[0.5vw] hover:bg-gray-50 cursor-pointer text-[0.8vw] ${editedUser?.industryType === ind ? 'bg-gray-50 font-semibold text-gray-900' : 'text-gray-700'}`}
                      >
                        <span>{ind}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[0.8vw] font-semibold text-gray-800 mb-[0.4vw]">
                  Company Gmail
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-[1vw] flex items-center justify-center pointer-events-none">
                    <Icon icon="logos:google-icon" className="w-[1.1vw] h-[1.1vw]" />
                  </div>
                  <input
                    type="email"
                    placeholder="e.g. fistotech@gmail.com"
                    value={editedUser?.companyEmail || ''}
                    onChange={(e) => {
                      setEditedUser({ ...editedUser, companyEmail: e.target.value });
                      setErrors({ ...errors, companyEmail: null });
                    }}
                    onBlur={(e) => validateField('companyEmail', e.target.value)}
                    className="w-full border border-gray-200 bg-white rounded-[0.6vw] pl-[2.8vw] pr-[1vw] py-[0.65vw] text-[0.85vw] focus:outline-none focus:border-gray-300 text-gray-700 font-medium"
                  />
                </div>
                {errors.companyEmail && <p className="text-red-500 text-[0.65vw] mt-[0.2vw]">{errors.companyEmail}</p>}
              </div>
            </div>

            {/* Row 3: Website Link */}
            <div>
              <label className="block text-[0.8vw] font-semibold text-gray-800 mb-[0.4vw]">
                Website Link
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-[1vw] flex items-center justify-center pointer-events-none text-gray-600">
                  <Icon icon="lucide:globe" className="w-[1.1vw] h-[1.1vw]" />
                </div>
                <input
                  type="text"
                  placeholder="https://fisto.com"
                  value={editedUser?.website || ''}
                  onChange={(e) => {
                    setEditedUser({ ...editedUser, website: e.target.value });
                    setErrors({ ...errors, website: null });
                  }}
                  onBlur={(e) => validateField('website', e.target.value)}
                  className="w-full border border-gray-200 bg-white rounded-[0.6vw] pl-[2.8vw] pr-[1vw] py-[0.65vw] text-[0.85vw] focus:outline-none focus:border-gray-300 text-gray-700"
                />
              </div>
              {errors.website && <p className="text-red-500 text-[0.65vw] mt-[0.2vw]">{errors.website}</p>}
            </div>

            {/* Row 4: Services / Expertise */}
            <div>
              <label className="block text-[0.8vw] font-semibold text-gray-800 mb-[0.4vw]">
                Services / Expertise <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap items-center gap-[0.5vw] p-[0.6vw] border border-gray-200 rounded-[0.6vw] bg-white min-h-[3.2vw]">
                {/* + Add Service Button */}
                {isAddingService ? (
                  <div className="flex items-center gap-[0.3vw] border border-[#EC5137] rounded-[0.4vw] px-[0.6vw] py-[0.3vw] bg-[#EC5137]/5">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Service name..."
                      value={newServiceInput}
                      onChange={(e) => setNewServiceInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddService();
                        } else if (e.key === 'Escape') {
                          setIsAddingService(false);
                          setNewServiceInput('');
                        }
                      }}
                      className="text-[0.75vw] bg-transparent focus:outline-none w-[7vw] text-gray-700"
                    />
                    <button
                      type="button"
                      onClick={handleAddService}
                      className="text-[#EC5137] hover:opacity-80 font-bold text-[0.75vw]"
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingService(false);
                        setNewServiceInput('');
                      }}
                      className="text-gray-400 hover:text-gray-600 text-[0.75vw]"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingService(true)}
                    className="flex items-center gap-[0.25vw] px-[0.7vw] py-[0.35vw] border border-[#EC5137] text-[#EC5137] rounded-[0.4vw] text-[0.75vw] font-medium hover:bg-[#EC5137]/5 transition-colors"
                  >
                    <span>+</span> Add Service
                  </button>
                )}

                {/* Service Tag Badges */}
                {servicesList.map((service, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-[0.4vw] px-[0.7vw] py-[0.35vw] bg-gray-100/90 text-gray-600 rounded-[0.4vw] text-[0.75vw] font-medium"
                  >
                    {service}
                    <button
                      type="button"
                      onClick={() => handleRemoveService(service)}
                      className="text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      <X className="w-[0.7vw] h-[0.7vw]" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Row 5: Contact Number (Multiple labels with country code) */}
            <div>
              <label className="block text-[0.8vw] font-semibold text-gray-800 mb-[0.6vw]">
                Contact Number
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-[1.5vw] mb-[0.8vw]">
                {contactNumbersList.map((contact, index) => {
                  return (
                    <div key={index} className="flex flex-col">
                      <span className="text-[0.7vw] text-gray-400 mb-[0.3vw]">
                        {contact.label || `Enter Text Label ${index + 1}`}
                      </span>

                      <div className="relative flex items-start w-full">
                        <div className="flex-1">
                          <ProfilePhoneField
                            value={contact.number || ''}
                            countryCode={contact.countryCode || '+91'}
                            onChange={(nationalNum, newDialCode) => {
                              handleContactNumberFullChange(index, nationalNum, newDialCode);
                            }}
                            placeholder="1234567890"
                          />
                        </div>

                        {contactNumbersList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveContactNumber(index)}
                            className="ml-[0.5vw] h-[2.6vw] px-[0.6vw] border border-gray-200 rounded-[0.5vw] text-gray-400 hover:text-red-500 hover:bg-gray-50 transition-colors flex items-center justify-center shrink-0 bg-white"
                          >
                            <Trash2 size="0.85vw" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Contact Number Button */}
              <button
                type="button"
                onClick={handleAddContactNumber}
                className="flex items-center gap-[0.3vw] px-[1vw] py-[0.5vw] border border-[#EC5137] text-[#EC5137] rounded-[0.4vw] text-[0.78vw] font-medium hover:bg-[#EC5137]/5 transition-colors"
              >
                <span>+</span> Add Contact Number
              </button>
            </div>
          </div>
        </section>

        {/* Address */}
        <section>
          <div className="flex items-center gap-[0.5vw] mb-[1vw]">
            <MapPin size="1.2vw" className="text-gray-900" />
            <h3 className="text-[1vw] font-semibold text-gray-900">Address</h3>
          </div>
          <div className="flex flex-col gap-[1vw] pl-[1.7vw]">
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Address Line 1</label>
              <input type="text" placeholder="e.g. No. 45, Lake View Street" value={editedUser?.address1 || ''} onChange={(e) => setEditedUser({ ...editedUser, address1: e.target.value })} className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-600" />
            </div>
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Address Line 2</label>
              <input type="text" placeholder="e.g. Near Central Bus Stand" value={editedUser?.address2 || ''} onChange={(e) => setEditedUser({ ...editedUser, address2: e.target.value })} className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-600" />
            </div>
            <div className="flex gap-[1vw]">
              <div className="flex-1">
                <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">City</label>
                <input type="text" placeholder="e.g. Coimbatore" value={editedUser?.city || ''} onChange={(e) => setEditedUser({ ...editedUser, city: e.target.value })} className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-600" />
              </div>
              <div className="flex-1">
                <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Pin Code</label>
                <input type="text" maxLength={6} placeholder="e.g. 641012" value={editedUser?.pincode || ''} onChange={(e) => { setEditedUser({ ...editedUser, pincode: e.target.value.replace(/\D/g, '') }); setErrors({ ...errors, pincode: null }); }} onBlur={(e) => validateField('pincode', e.target.value.replace(/\D/g, ''))} className={`w-full border ${errors.pincode ? 'border-red-500' : 'border-gray-200'} rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-600`} />
                {errors.pincode && <p className="text-red-500 text-[0.65vw] mt-[0.2vw]">{errors.pincode}</p>}
              </div>
            </div>
            <div className="flex gap-[1vw]">
              <div className="flex-1 relative">
                <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">State</label>
                <select value={editedUser?.state || ''} onChange={(e) => setEditedUser({ ...editedUser, state: e.target.value })} className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 bg-white appearance-none text-gray-600">
                  {editedUser?.country === 'USA' ? (
                    <>
                      <option value="California">California</option>
                      <option value="New York">New York</option>
                      <option value="Texas">Texas</option>
                      <option value="Florida">Florida</option>
                    </>
                  ) : editedUser?.country === 'UK' ? (
                    <>
                      <option value="England">England</option>
                      <option value="Scotland">Scotland</option>
                      <option value="Wales">Wales</option>
                      <option value="Northern Ireland">Northern Ireland</option>
                    </>
                  ) : (
                    <>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Kerala">Kerala</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Maharashtra">Maharashtra</option>
                    </>
                  )}
                </select>
                <div className="absolute right-[0.8vw] top-[2vw] pointer-events-none">
                  <Icon icon="lucide:chevron-down" className="w-[1vw] h-[1vw] text-gray-400" />
                </div>
              </div>
              <div className="flex-1 relative">
                <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Country</label>
                <select value={editedUser?.country || ''} onChange={(e) => {
                  const newCountry = e.target.value;
                  const defaultStates = { 'INDIA': 'Tamil Nadu', 'USA': 'California', 'UK': 'England' };
                  setEditedUser({ ...editedUser, country: newCountry, state: defaultStates[newCountry] });
                }} className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 bg-white appearance-none text-gray-600">
                  <option value="INDIA">INDIA</option>
                  <option value="USA">USA</option>
                  <option value="UK">UK</option>
                </select>
                <div className="absolute right-[0.8vw] top-[2vw] pointer-events-none">
                  <Icon icon="lucide:chevron-down" className="w-[1vw] h-[1vw] text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Media */}
        <section>
          <div className="flex items-center gap-[0.5vw] mb-[1.2vw]">
            <Icon icon="lucide:globe" className="w-[1.2vw] h-[1.2vw] text-gray-800" />
            <h3 className="text-[0.95vw] font-semibold text-gray-800">Social Media</h3>
          </div>

          <div className="flex flex-col gap-[1vw]">
            {/* Website */}
            <div className="flex items-center gap-[0.8vw]">
              <div className="w-[2.6vw] h-[2.6vw] bg-[#1a1a1a] rounded-[0.5vw] flex items-center justify-center shrink-0">
                <Globe className="w-[1.4vw] h-[1.4vw] text-white" />
              </div>
              <input
                type="text"
                placeholder="https://www.fistotech.com"
                value={editedUser?.socials?.website || ''}
                onChange={(e) => {
                  setEditedUser({ ...editedUser, socials: { ...editedUser.socials, website: e.target.value } });
                  setErrors({ ...errors, socialWebsite: null });
                }}
                onBlur={(e) => validateField('socialWebsite', e.target.value)}
                className="flex-1 border border-gray-200 rounded-[0.6vw] px-[1vw] py-[0.65vw] text-[0.85vw] focus:outline-none focus:border-gray-300 text-gray-700 bg-white"
              />
              <button
                type="button"
                onClick={() => setEditedUser({ ...editedUser, socials: { ...editedUser.socials, website: '' } })}
                className="w-[2.6vw] h-[2.6vw] border border-gray-200 rounded-[0.5vw] flex items-center justify-center hover:bg-gray-50 text-gray-400 hover:text-gray-700 transition-colors bg-white shrink-0"
              >
                <X className="w-[1vw] h-[1vw]" />
              </button>
            </div>

            {/* Instagram */}
            <div className="flex items-center gap-[0.8vw]">
              <div className="w-[2.6vw] h-[2.6vw] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-[0.5vw] flex items-center justify-center shrink-0">
                <Icon icon="mdi:instagram" className="w-[1.5vw] h-[1.5vw] text-white" />
              </div>
              <input
                type="text"
                placeholder="https://www.instagram.com/fistotech"
                value={editedUser?.socials?.instagram || ''}
                onChange={(e) => {
                  setEditedUser({ ...editedUser, socials: { ...editedUser.socials, instagram: e.target.value } });
                  setErrors({ ...errors, instagram: null });
                }}
                onBlur={(e) => validateField('instagram', e.target.value)}
                className="flex-1 border border-gray-200 rounded-[0.6vw] px-[1vw] py-[0.65vw] text-[0.85vw] focus:outline-none focus:border-gray-300 text-gray-700 bg-white"
              />
              <button
                type="button"
                onClick={() => setEditedUser({ ...editedUser, socials: { ...editedUser.socials, instagram: '' } })}
                className="w-[2.6vw] h-[2.6vw] border border-gray-200 rounded-[0.5vw] flex items-center justify-center hover:bg-gray-50 text-gray-400 hover:text-gray-700 transition-colors bg-white shrink-0"
              >
                <X className="w-[1vw] h-[1vw]" />
              </button>
            </div>

            {/* LinkedIn */}
            <div className="flex items-center gap-[0.8vw]">
              <div className="w-[2.6vw] h-[2.6vw] bg-[#0077b5] rounded-[0.5vw] flex items-center justify-center shrink-0">
                <Icon icon="mdi:linkedin" className="w-[1.5vw] h-[1.5vw] text-white" />
              </div>
              <input
                type="text"
                placeholder="https://www.linkedin.com/company/fistotech"
                value={editedUser?.socials?.linkedin || ''}
                onChange={(e) => {
                  setEditedUser({ ...editedUser, socials: { ...editedUser.socials, linkedin: e.target.value } });
                  setErrors({ ...errors, linkedin: null });
                }}
                onBlur={(e) => validateField('linkedin', e.target.value)}
                className="flex-1 border border-gray-200 rounded-[0.6vw] px-[1vw] py-[0.65vw] text-[0.85vw] focus:outline-none focus:border-gray-300 text-gray-700 bg-white"
              />
              <button
                type="button"
                onClick={() => setEditedUser({ ...editedUser, socials: { ...editedUser.socials, linkedin: '' } })}
                className="w-[2.6vw] h-[2.6vw] border border-gray-200 rounded-[0.5vw] flex items-center justify-center hover:bg-gray-50 text-gray-400 hover:text-gray-700 transition-colors bg-white shrink-0"
              >
                <X className="w-[1vw] h-[1vw]" />
              </button>
            </div>

            {/* Facebook */}
            <div className="flex items-center gap-[0.8vw]">
              <div className="w-[2.6vw] h-[2.6vw] bg-[#1877f2] rounded-[0.5vw] flex items-center justify-center shrink-0">
                <Icon icon="mdi:facebook" className="w-[1.5vw] h-[1.5vw] text-white" />
              </div>
              <input
                type="text"
                placeholder="https://www.facebook.com/fistotech"
                value={editedUser?.socials?.facebook || ''}
                onChange={(e) => {
                  setEditedUser({ ...editedUser, socials: { ...editedUser.socials, facebook: e.target.value } });
                  setErrors({ ...errors, facebook: null });
                }}
                onBlur={(e) => validateField('facebook', e.target.value)}
                className="flex-1 border border-gray-200 rounded-[0.6vw] px-[1vw] py-[0.65vw] text-[0.85vw] focus:outline-none focus:border-gray-300 text-gray-700 bg-white"
              />
              <button
                type="button"
                onClick={() => setEditedUser({ ...editedUser, socials: { ...editedUser.socials, facebook: '' } })}
                className="w-[2.6vw] h-[2.6vw] border border-gray-200 rounded-[0.5vw] flex items-center justify-center hover:bg-gray-50 text-gray-400 hover:text-gray-700 transition-colors bg-white shrink-0"
              >
                <X className="w-[1vw] h-[1vw]" />
              </button>
            </div>

            {/* WhatsApp */}
            <div className="flex items-center gap-[0.8vw]">
              <div className="w-[2.6vw] h-[2.6vw] bg-[#25d366] rounded-[0.5vw] flex items-center justify-center shrink-0">
                <Icon icon="mdi:whatsapp" className="w-[1.5vw] h-[1.5vw] text-white" />
              </div>
              <input
                type="text"
                placeholder="https://wa.me/919876543210"
                value={editedUser?.socials?.whatsapp || ''}
                onChange={(e) => {
                  setEditedUser({ ...editedUser, socials: { ...editedUser.socials, whatsapp: e.target.value } });
                  setErrors({ ...errors, whatsapp: null });
                }}
                onBlur={(e) => validateField('whatsapp', e.target.value)}
                className="flex-1 border border-gray-200 rounded-[0.6vw] px-[1vw] py-[0.65vw] text-[0.85vw] focus:outline-none focus:border-gray-300 text-gray-700 bg-white"
              />
              <button
                type="button"
                onClick={() => setEditedUser({ ...editedUser, socials: { ...editedUser.socials, whatsapp: '' } })}
                className="w-[2.6vw] h-[2.6vw] border border-gray-200 rounded-[0.5vw] flex items-center justify-center hover:bg-gray-50 text-gray-400 hover:text-gray-700 transition-colors bg-white shrink-0"
              >
                <X className="w-[1vw] h-[1vw]" />
              </button>
            </div>

            {/* + Add Social Links Button */}
            <div className="mt-[0.2vw]">
              <button
                type="button"
                onClick={() => setIsAddingSocial(!isAddingSocial)}
                className="flex items-center gap-[0.3vw] px-[1vw] py-[0.5vw] border border-[#EC5137] text-[#EC5137] rounded-[0.4vw] text-[0.78vw] font-medium hover:bg-[#EC5137]/5 transition-colors"
              >
                <span>+</span> Add Social Links
              </button>
            </div>
          </div>
        </section>

        {/* Visibility Section */}
        <section className="border border-gray-200/80 rounded-[0.8vw] p-[1.5vw] bg-white shadow-sm mb-[2.5vw]">
          <div className="flex items-start gap-[0.6vw] mb-[1.4vw]">
            <Icon icon="lucide:eye" className="w-[1.2vw] h-[1.2vw] text-gray-900 mt-[0.1vw]" />
            <div>
              <h3 className="text-[1.1vw] font-semibold text-gray-900 leading-tight">Visibility</h3>
              <p className="text-[0.72vw] text-gray-400 mt-[0.15vw]">Control what information is visible to others</p>
            </div>
          </div>

          <div className="flex flex-col gap-[1vw] pt-[0.2vw]">
            {/* Toggle Row */}
            <div className="flex flex-col gap-[0.2vw] w-full">
              <div className="flex items-center gap-[1.2vw] w-full">
                <h4 className="text-[0.95vw] font-semibold text-gray-900 shrink-0">
                  Show my profile in Explore Page
                </h4>

                {/* Straight Dashed line */}
                <div className="flex-1 border-b border-dashed border-gray-200"></div>

                {/* Pill Switch matching screenshot */}
                <button
                  type="button"
                  onClick={() => {
                    const currentVal = editedUser?.visibilitySettings?.showInExplore !== false;
                    setEditedUser({
                      ...editedUser,
                      visibilitySettings: {
                        ...(editedUser?.visibilitySettings || {}),
                        showInExplore: !currentVal
                      }
                    });
                  }}
                  className="relative inline-flex items-center w-[2.7vw] h-[1.6vw] shrink-0 cursor-pointer focus:outline-none"
                >
                  {/* Track */}
                  <span
                    className={`w-[2.4vw] h-[1.1vw] rounded-full transition-colors duration-200 ease-in-out ${
                      editedUser?.visibilitySettings?.showInExplore !== false ? 'bg-[#EC5137]' : 'bg-gray-200'
                    }`}
                  />

                  {/* Circular Button with Centered White Checkmark */}
                  <span
                    className={`absolute top-1/2 -translate-y-1/2 w-[1.45vw] h-[1.45vw] rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.22)] flex items-center justify-center transition-transform duration-200 ease-in-out ${
                      editedUser?.visibilitySettings?.showInExplore !== false
                        ? 'translate-x-[1.25vw] bg-[#EC5137]'
                        : 'translate-x-0 bg-white'
                    }`}
                  >
                    {editedUser?.visibilitySettings?.showInExplore !== false ? (
                      <Icon icon="lucide:check" className="w-[0.85vw] h-[0.85vw] text-white stroke-[3.5]" />
                    ) : null}
                  </span>
                </button>
              </div>

              <p className="text-[0.72vw] text-gray-400">
                Make your profile visible to others in Explore page
              </p>
            </div>

            {/* Checkbox Items */}
            <div className="flex flex-col gap-[0.75vw] pt-[0.4vw]">
              {/* Option 1 */}
              <label className="flex items-center gap-[0.6vw] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editedUser?.visibilitySettings?.showContact !== false}
                  onChange={(e) => {
                    setEditedUser({
                      ...editedUser,
                      visibilitySettings: {
                        ...(editedUser?.visibilitySettings || {}),
                        showContact: e.target.checked
                      }
                    });
                  }}
                  className="hidden"
                />
                <div
                  className={`w-[1vw] h-[1vw] rounded-[0.2vw] flex items-center justify-center transition-colors shrink-0 ${
                    editedUser?.visibilitySettings?.showContact !== false
                      ? 'bg-[#EC5137] text-white'
                      : 'border border-gray-300 bg-white'
                  }`}
                >
                  {editedUser?.visibilitySettings?.showContact !== false && (
                    <Icon icon="lucide:check" className="w-[0.75vw] h-[0.75vw] stroke-[3]" />
                  )}
                </div>
                <span className="text-[0.75vw] text-gray-500">
                  Show <strong className="font-semibold text-gray-900">contact information</strong> like email, phone and website in your public profile
                </span>
              </label>

              {/* Option 2 */}
              <label className="flex items-center gap-[0.6vw] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editedUser?.visibilitySettings?.showAddress !== false}
                  onChange={(e) => {
                    setEditedUser({
                      ...editedUser,
                      visibilitySettings: {
                        ...(editedUser?.visibilitySettings || {}),
                        showAddress: e.target.checked
                      }
                    });
                  }}
                  className="hidden"
                />
                <div
                  className={`w-[1vw] h-[1vw] rounded-[0.2vw] flex items-center justify-center transition-colors shrink-0 ${
                    editedUser?.visibilitySettings?.showAddress !== false
                      ? 'bg-[#EC5137] text-white'
                      : 'border border-gray-300 bg-white'
                  }`}
                >
                  {editedUser?.visibilitySettings?.showAddress !== false && (
                    <Icon icon="lucide:check" className="w-[0.75vw] h-[0.75vw] stroke-[3]" />
                  )}
                </div>
                <span className="text-[0.75vw] text-gray-500">
                  Show <strong className="font-semibold text-gray-900">Address</strong> in your public profile
                </span>
              </label>

              {/* Option 3 */}
              <label className="flex items-center gap-[0.6vw] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editedUser?.visibilitySettings?.showSocial !== false}
                  onChange={(e) => {
                    setEditedUser({
                      ...editedUser,
                      visibilitySettings: {
                        ...(editedUser?.visibilitySettings || {}),
                        showSocial: e.target.checked
                      }
                    });
                  }}
                  className="hidden"
                />
                <div
                  className={`w-[1vw] h-[1vw] rounded-[0.2vw] flex items-center justify-center transition-colors shrink-0 ${
                    editedUser?.visibilitySettings?.showSocial !== false
                      ? 'bg-[#EC5137] text-white'
                      : 'border border-gray-300 bg-white'
                  }`}
                >
                  {editedUser?.visibilitySettings?.showSocial !== false && (
                    <Icon icon="lucide:check" className="w-[0.75vw] h-[0.75vw] stroke-[3]" />
                  )}
                </div>
                <span className="text-[0.75vw] text-gray-500">
                  Show <strong className="font-semibold text-gray-900">Social Media</strong> Navigation Icons in your public profile
                </span>
              </label>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default EditProfile;
