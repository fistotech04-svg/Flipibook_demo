import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Icon, addIcon } from '@iconify/react';
import { Country, State } from 'country-state-city';

// Register the exact UPI logo icon under 'thesvg-color:upi' matching screenshot 1
addIcon('thesvg-color:upi', {
  width: 32,
  height: 32,
  body: `
    <g transform="translate(6, 2) scale(0.68)">
      <!-- Green Chevron in the background -->
      <polygon points="17,3 27,21 11,32 16,21" fill="#0A7C3E"/>
      <!-- Orange Triangle in the foreground -->
      <polygon points="10,2 21,21 4,32" fill="#F46E27"/>
    </g>
  `
});

const Billing = () => {
  const navigate = useNavigate();
  const context = useOutletContext();
  const user = context?.user || {};

  const userEmail = user?.emailId || user?.email || 'luffyonepiece@gmail.com';
  const userName = user?.name || (userEmail ? userEmail.split('@')[0] : 'Luffy');
  const companyName = user?.companyName || 'EduVision Creatives';
  
  // Format billing address if present on user profile, otherwise fallback to exact screenshot address
  const fullAddress = [
    user?.address1 || '1/58 Sundram layout',
    user?.address2 || 'Ramanathapuram',
    `${user?.city || 'Coimbatore'}, ${user?.state || 'Tamil Nadu'} - ${user?.pincode || '645387'}`,
    user?.country || 'India.'
  ].filter(Boolean);

  const [defaultMethod, setDefaultMethod] = useState('visa');
  const [autoRenew, setAutoRenew] = useState(true);

  // Add Payment Method Modal State
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState('card'); // 'card', 'upi', 'netbanking'
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState(userName || 'Luffy');
  const [upiId, setUpiId] = useState('luffy@okaxis');
  const [setAsDefaultPayment, setSetAsDefaultPayment] = useState(true);

  // Edit Billing Information Modal State
  const [isEditBillingModalOpen, setIsEditBillingModalOpen] = useState(false);
  const [billingName, setBillingName] = useState(userName || 'Luffy');
  const [billingCompany, setBillingCompany] = useState(companyName || 'EduVision Creatives');
  const [billingEmail, setBillingEmail] = useState(userEmail || 'luffyonepiece@gmail.com');
  const [billingAddress, setBillingAddress] = useState('123, Anna Nagar');
  const [selectedCountryCode, setSelectedCountryCode] = useState('IN');
  const [billingState, setBillingState] = useState('Tamil Nadu');
  const [billingCity, setBillingCity] = useState('Madurai');
  const [billingPostalCode, setBillingPostalCode] = useState('625020');
  const [billingGstin, setBillingGstin] = useState('luffy@okaxis');

  // Dropdown open/close state & search queries
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [isStateOpen, setIsStateOpen] = useState(false);
  const [stateSearch, setStateSearch] = useState('');

  const countryRef = useRef(null);
  const stateRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryRef.current && !countryRef.current.contains(event.target)) {
        setIsCountryOpen(false);
      }
      if (stateRef.current && !stateRef.current.contains(event.target)) {
        setIsStateOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load all countries once
  const allCountries = useMemo(() => Country.getAllCountries(), []);

  // Compute available states for currently selected country
  const availableStates = useMemo(() => {
    return selectedCountryCode ? State.getStatesOfCountry(selectedCountryCode) : [];
  }, [selectedCountryCode]);

  // Country alias map for intuitive searching (e.g. searching 'america' or 'usa' matches 'United States')
  const countryAliases = {
    US: ['america', 'united states of america', 'usa', 'us'],
    GB: ['united kingdom', 'uk', 'great britain', 'england', 'britain'],
    AE: ['united arab emirates', 'uae', 'dubai'],
    RU: ['russia', 'russian federation'],
    KR: ['south korea', 'korea']
  };

  // Filtered countries for dropdown search
  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return allCountries;
    const query = countrySearch.toLowerCase().trim();
    return allCountries.filter((c) => {
      const nameMatches = c.name.toLowerCase().includes(query);
      const codeMatches = c.isoCode.toLowerCase() === query;
      const aliasMatches = countryAliases[c.isoCode]?.some((alias) => alias.includes(query));
      return nameMatches || codeMatches || aliasMatches;
    });
  }, [allCountries, countrySearch]);

  // Filtered states for dropdown search
  const filteredStates = useMemo(() => {
    if (!stateSearch.trim()) return availableStates;
    return availableStates.filter((s) =>
      s.name.toLowerCase().includes(stateSearch.toLowerCase())
    );
  }, [availableStates, stateSearch]);

  const selectedCountryName = useMemo(() => {
    const c = allCountries.find((item) => item.isoCode === selectedCountryCode);
    return c ? c.name : 'India';
  }, [allCountries, selectedCountryCode]);

  const handleSelectCountry = (code, name) => {
    setSelectedCountryCode(code);
    setIsCountryOpen(false);
    setCountrySearch('');
    const states = State.getStatesOfCountry(code);
    setBillingState(states.length > 0 ? states[0].name : '');
  };

  const handleSelectState = (name) => {
    setBillingState(name);
    setIsStateOpen(false);
    setStateSearch('');
  };

  const handleOpenEditBillingModal = () => {
    setIsEditBillingModalOpen(true);
    setIsCountryOpen(false);
    setIsStateOpen(false);
    setCountrySearch('');
    setStateSearch('');
  };

  const handleCloseEditBillingModal = () => {
    setIsEditBillingModalOpen(false);
  };

  const handleSaveBillingInfo = (e) => {
    e?.preventDefault();
    setIsEditBillingModalOpen(false);
  };

  const handleOpenAddModal = () => {
    setCardNumber('');
    setExpiryDate('');
    setCvv('');
    setCardholderName(userName || 'Luffy');
    setUpiId('luffy@okaxis');
    setSetAsDefaultPayment(true);
    setPaymentType('card');
    setIsAddPaymentModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddPaymentModalOpen(false);
  };

  const handleSavePaymentMethod = (e) => {
    e?.preventDefault();
    // Closes cleanly without breaking any backend/flow
    setIsAddPaymentModalOpen(false);
  };

  return (
    <div className="w-full flex flex-col p-[1.5vw] font-sans bg-white select-none">
      
      {/* Top Header Row: Title & Subtitle on left, Need help banner on right */}
      <div className="flex items-start justify-between gap-[2vw] mb-[2vw]">
        {/* Left: Title & Subtitle */}
        <div className="flex flex-col">
          <h1 className="text-[1.8vw] font-bold text-gray-900 leading-tight">
            Billing and Invoice
          </h1>
          <p className="text-[0.82vw] text-gray-500 mt-[0.35vw] font-normal">
            Mange your subscription, payment methods, billing details and invoices.
          </p>
        </div>

        {/* Right: Need help with billing ? Box */}
        <div className="flex items-center gap-[0.9vw] bg-[#FDF2F0] border border-[#FDE5E1] rounded-[0.9vw] px-[1.1vw] py-[0.7vw] shadow-sm shrink-0">
          {/* Orange-Red Circle with Headphones */}
          <div className="w-[2.4vw] h-[2.4vw] rounded-full bg-[#E54D38] flex items-center justify-center shrink-0 shadow-sm">
            <Icon icon="lucide:headphones" className="w-[1.25vw] h-[1.25vw] text-white" strokeWidth="2.2" />
          </div>

          {/* Texts */}
          <div className="flex flex-col pr-[0.8vw]">
            <h4 className="text-[0.88vw] font-bold text-gray-900 leading-tight">
              Need help with billing ?
            </h4>
            <p className="text-[0.68vw] text-gray-500 mt-[0.2vw] leading-tight">
              Get support for payment, invoices or subscription.
            </p>
          </div>

          {/* Contact Support Button */}
          <button
            type="button"
            onClick={() => navigate('/contact')}
            className="flex items-center gap-[0.45vw] bg-[#E54D38] hover:bg-[#d63f2b] active:scale-[0.98] text-white text-[0.82vw] font-semibold px-[1.2vw] py-[0.65vw] rounded-[0.65vw] shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <span>Contact Support</span>
            <Icon icon="lucide:arrow-right" className="w-[0.95vw] h-[0.95vw]" strokeWidth="2.5" />
          </button>
        </div>
      </div>

      {/* Current Subscription Card (Dark Charcoal Rounded Container) */}
      <div 
        className="w-full rounded-[1.2vw] p-[1.5vw] text-white shadow-[0_4px_20px_rgba(0,0,0,0.18)]"
        style={{
          background: 'radial-gradient(ellipse at 50% 10%, #2a2c30 0%, #1e2023 60%, #18191b 100%)'
        }}
      >
        {/* Card Header: Golden Crown + Title */}
        <div className="flex items-center gap-[0.6vw] mb-[1.4vw]">
          <Icon icon="solar:crown-bold" className="w-[1.25vw] h-[1.25vw] text-[#F59E0B] shrink-0" />
          <h2 className="text-[1.15vw] font-bold text-white tracking-wide">
            Current Subscription
          </h2>
        </div>

        {/* Inner Card (Dark Grey Rounded Panel) */}
        <div className="w-full bg-[#27292c] border border-white/5 rounded-[1vw] px-[1.6vw] py-[1.5vw] flex items-center justify-between shadow-inner">
          
          {/* Section 1: Plan Details & Action Buttons */}
          <div className="flex items-start gap-[1.2vw]">
            {/* White Rounded Square Badge with Crown */}
            <div className="w-[3.6vw] h-[3.6vw] rounded-[0.8vw] bg-white flex items-center justify-center shrink-0 shadow-md">
              <Icon icon="solar:crown-bold" className="w-[2.2vw] h-[2.2vw] text-[#F59E0B]" />
            </div>

            {/* Plan Info and Buttons */}
            <div className="flex flex-col">
              {/* Plan Title & Active Badge */}
              <div className="flex items-center gap-[0.6vw]">
                <h3 className="text-[1.4vw] font-bold text-white tracking-tight leading-none">
                  Pro Plan
                </h3>
                <span className="bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/40 text-[0.68vw] font-semibold px-[0.7vw] py-[0.18vw] rounded-full inline-flex items-center justify-center leading-normal">
                  Active
                </span>
              </div>

              {/* Plan Features Subtitle */}
              <p className="text-[0.78vw] text-gray-400 mt-[0.45vw] mb-[1.1vw] font-normal">
                All premium features, unlimited flipibooks and more
              </p>

              {/* Action Buttons Row */}
              <div className="flex items-center gap-[1.2vw]">
                {/* Manage Plan Button */}
                <button
                  type="button"
                  onClick={() => navigate('/settings/billing')}
                  className="flex items-center gap-[0.4vw] bg-[#E54D38] hover:bg-[#d63f2b] active:scale-[0.98] text-white text-[0.8vw] font-semibold px-[1.2vw] py-[0.55vw] rounded-full shadow-sm transition-all cursor-pointer whitespace-nowrap"
                >
                  <span>Manage Plan</span>
                  <Icon icon="lucide:arrow-right" className="w-[0.9vw] h-[0.9vw]" strokeWidth="2.4" />
                </button>

                {/* View All Plans Link */}
                <button
                  type="button"
                  onClick={() => navigate('/home')}
                  className="flex items-center gap-[0.35vw] text-gray-300 hover:text-white text-[0.8vw] font-medium transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>View All Plans</span>
                  <Icon icon="lucide:arrow-right" className="w-[0.9vw] h-[0.9vw] text-gray-300" strokeWidth="2.2" />
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Next Billing Date */}
          <div className="flex flex-col justify-center px-[2vw] border-r border-white/10 min-w-0">
            <span className="text-[0.72vw] text-gray-400 font-medium">
              Next Billing Date
            </span>
            <div className="flex items-center gap-[0.45vw] text-gray-200 mt-[0.4vw]">
              <Icon icon="lucide:calendar" className="w-[0.95vw] h-[0.95vw] text-gray-400 shrink-0" strokeWidth="2" />
              <span className="text-[0.85vw] font-medium text-white whitespace-nowrap">
                14 Oct 2027
              </span>
            </div>
          </div>

          {/* Section 3: Payment Status */}
          <div className="flex flex-col justify-center px-[2vw] border-r border-white/10 min-w-0">
            <span className="text-[0.72vw] text-gray-400 font-medium">
              Payment Status
            </span>
            <div className="flex items-center gap-[0.45vw] mt-[0.4vw]">
              {/* Green checkmark circle */}
              <div className="w-[0.95vw] h-[0.95vw] rounded-full bg-[#22C55E] flex items-center justify-center shrink-0">
                <Icon icon="lucide:check" className="w-[0.65vw] h-[0.65vw] text-white" strokeWidth="3.2" />
              </div>
              <span className="text-[0.85vw] font-medium text-white whitespace-nowrap">
                Paid
              </span>
            </div>
          </div>

          {/* Section 4: Price / Interval */}
          <div className="flex flex-col items-end justify-center pl-[2vw] shrink-0">
            <div className="flex items-baseline text-white">
              <span className="text-[1.8vw] font-semibold mr-[0.2vw]">₹</span>
              <span className="text-[2.2vw] font-extrabold tracking-tight">4999</span>
            </div>
            <span className="text-[0.75vw] text-gray-400 -mt-[0.2vw]">
              / year
            </span>
          </div>

        </div>
      </div>

      {/* Two Column Grid: Payment Method (Left) & Billing Information (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[1.2vw] mt-[1.4vw] items-stretch">
        
        {/* Card 1: Payment Method */}
        <div className="w-full h-full bg-white border border-gray-200/90 rounded-[1.1vw] p-[1.2vw] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex flex-col h-full">
            {/* Header: Icon + Title & Add New Button */}
            <div className="flex items-center justify-between gap-[1vw] mb-[0.2vw]">
              <div className="flex items-center gap-[0.55vw]">
                <Icon icon="lucide:credit-card" className="w-[1.15vw] h-[1.15vw] text-gray-900" strokeWidth="2.5" />
                <h3 className="text-[1.1vw] font-bold text-gray-900">
                  Payment Method
                </h3>
              </div>

              {/* Add New Button */}
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="flex items-center gap-[0.3vw] bg-[#222428] hover:bg-[#151618] active:scale-[0.98] text-white text-[0.76vw] font-medium px-[0.95vw] py-[0.42vw] rounded-[0.5vw] shadow-sm transition-all cursor-pointer whitespace-nowrap"
              >
                <Icon icon="lucide:plus" className="w-[0.85vw] h-[0.85vw]" strokeWidth="2.5" />
                <span>Add New</span>
              </button>
            </div>

            {/* Subtitle */}
            <p className="text-[0.75vw] text-gray-400 mb-[0.9vw]">
              Manage payment methods used for subscription renewals.
            </p>

            {/* Payment Method Rows Container */}
            <div className="flex-1 flex flex-col justify-between gap-[0.7vw]">
              
              {/* Row 1: Visa Ending in 4242 */}
              <div className="w-full flex-1 min-h-[4.4vw] bg-[#f8f9fa] hover:bg-[#f3f4f6] border border-gray-100 rounded-[0.85vw] px-[1.1vw] py-[0.8vw] flex items-center justify-between transition-colors">
                {/* Left: Card Brand Logo + Details */}
                <div className="flex items-center gap-[0.9vw]">
                  {/* Card Badge */}
                  <div className="w-[3.8vw] h-[2.3vw] rounded-[0.45vw] bg-white border border-gray-200/80 flex items-center justify-center shrink-0 shadow-sm px-[0.35vw]">
                    <Icon icon="logos:visa" className="w-[2.4vw] h-[1.2vw] object-contain" />
                  </div>

                  <div className="flex flex-col">
                    <h4 className="text-[0.92vw] font-bold text-gray-900 leading-tight">
                      Visa ending in 4242
                    </h4>
                    <span className="text-[0.72vw] text-gray-400 mt-[0.15vw] font-normal">
                      Expires 08/2028
                    </span>
                  </div>
                </div>

                {/* Right: Default Badge / Button & Three Dots Menu */}
                <div className="flex items-center gap-[1vw]">
                  {defaultMethod === 'visa' ? (
                    <span className="bg-[#DCFCE7] text-[#16A34A] text-[0.7vw] font-semibold px-[0.8vw] py-[0.2vw] rounded-full inline-flex items-center justify-center">
                      Default
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDefaultMethod('visa')}
                      className="text-[#2563EB] hover:text-[#1d4ed8] text-[0.76vw] font-semibold transition-colors cursor-pointer"
                    >
                      Set as default
                    </button>
                  )}

                  {/* Three Dots Menu */}
                  <button 
                    type="button" 
                    className="text-gray-900 hover:text-black p-[0.25vw] rounded-[0.35vw] hover:bg-gray-200/50 transition-colors cursor-pointer"
                  >
                    <Icon icon="lucide:more-horizontal" className="w-[1.1vw] h-[1.1vw]" strokeWidth="2.8" />
                  </button>
                </div>
              </div>

              {/* Row 2: Mastercard Ending in 4242 */}
              <div className="w-full flex-1 min-h-[4.4vw] bg-[#f8f9fa] hover:bg-[#f3f4f6] border border-gray-100 rounded-[0.85vw] px-[1.1vw] py-[0.8vw] flex items-center justify-between transition-colors">
                {/* Left: Card Brand Logo + Details */}
                <div className="flex items-center gap-[0.9vw]">
                  {/* Card Badge */}
                  <div className="w-[3.8vw] h-[2.3vw] rounded-[0.45vw] bg-white border border-gray-200/80 flex items-center justify-center shrink-0 shadow-sm px-[0.35vw]">
                    <Icon icon="logos:mastercard" className="w-[2.1vw] h-[1.3vw] object-contain" />
                  </div>

                  <div className="flex flex-col">
                    <h4 className="text-[0.92vw] font-bold text-gray-900 leading-tight">
                      Mastercard ending in 4242
                    </h4>
                    <span className="text-[0.72vw] text-gray-400 mt-[0.15vw] font-normal">
                      Expires 08/2028
                    </span>
                  </div>
                </div>

                {/* Right: Default Badge / Button & Three Dots Menu */}
                <div className="flex items-center gap-[1vw]">
                  {defaultMethod === 'mastercard' ? (
                    <span className="bg-[#DCFCE7] text-[#16A34A] text-[0.7vw] font-semibold px-[0.8vw] py-[0.2vw] rounded-full inline-flex items-center justify-center">
                      Default
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDefaultMethod('mastercard')}
                      className="text-[#2563EB] hover:text-[#1d4ed8] text-[0.76vw] font-semibold transition-colors cursor-pointer"
                    >
                      Set as default
                    </button>
                  )}

                  {/* Three Dots Menu */}
                  <button 
                    type="button" 
                    className="text-gray-900 hover:text-black p-[0.25vw] rounded-[0.35vw] hover:bg-gray-200/50 transition-colors cursor-pointer"
                  >
                    <Icon icon="lucide:more-horizontal" className="w-[1.1vw] h-[1.1vw]" strokeWidth="2.8" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Card 2: Billing Information */}
        <div className="w-full h-full bg-white border border-gray-200/90 rounded-[1.1vw] p-[1.2vw] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex flex-col h-full">
            {/* Header: Icon + Title & Edit details Button */}
            <div className="flex items-center justify-between gap-[1vw] mb-[0.2vw]">
              <div className="flex items-center gap-[0.55vw]">
                <Icon icon="lucide:file-text" className="w-[1.15vw] h-[1.15vw] text-gray-900" strokeWidth="2.5" />
                <h3 className="text-[1.1vw] font-bold text-gray-900">
                  Billing Information
                </h3>
              </div>

              {/* Edit Details Button */}
              <button
                type="button"
                onClick={handleOpenEditBillingModal}
                className="flex items-center gap-[0.3vw] bg-[#222428] hover:bg-[#151618] active:scale-[0.98] text-white text-[0.76vw] font-medium px-[0.95vw] py-[0.42vw] rounded-[0.5vw] shadow-sm transition-all cursor-pointer whitespace-nowrap"
              >
                <Icon icon="lucide:pencil" className="w-[0.8vw] h-[0.8vw]" strokeWidth="2.4" />
                <span>Edit details</span>
              </button>
            </div>

            {/* Subtitle */}
            <p className="text-[0.75vw] text-gray-400 mb-[0.9vw]">
              Your billing details will be used for invoice and tax purposes
            </p>

            {/* Gray Sub-Container with 2-Column Fields Grid */}
            <div className="flex-1 w-full bg-[#f8f9fa] border border-gray-100 rounded-[0.85vw] p-[1.1vw] grid grid-cols-2 gap-x-[1.8vw] gap-y-[0.7vw] items-start content-between">
              
              {/* Left Column 1: Billing Name */}
              <div className="flex flex-col">
                <span className="text-[0.7vw] text-gray-400 font-medium">
                  Billing Name
                </span>
                <span className="text-[0.82vw] font-semibold text-gray-900 mt-[0.1vw]">
                  {userName}
                </span>
              </div>

              {/* Right Column 1: Billing Address */}
              <div className="flex flex-col row-span-2">
                <span className="text-[0.7vw] text-gray-400 font-medium">
                  Billing Address
                </span>
                <div className="text-[0.82vw] font-semibold text-gray-900 mt-[0.1vw] leading-snug">
                  {fullAddress.map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>
              </div>

              {/* Left Column 2: Company Name (Optional) */}
              <div className="flex flex-col">
                <span className="text-[0.7vw] text-gray-400 font-medium">
                  Company Name (Optional)
                </span>
                <span className="text-[0.82vw] font-semibold text-gray-900 mt-[0.1vw]">
                  {companyName}
                </span>
              </div>

              {/* Left Column 3: Billing Email */}
              <div className="flex flex-col">
                <span className="text-[0.7vw] text-gray-400 font-medium">
                  Billing Email
                </span>
                <span className="text-[0.82vw] font-semibold text-gray-900 mt-[0.1vw]">
                  {userEmail}
                </span>
              </div>

              {/* Right Column 2: GSTIN (Optional) */}
              <div className="flex flex-col">
                <span className="text-[0.7vw] text-gray-400 font-medium">
                  GSTIN (Optional)
                </span>
                <span className="text-[0.82vw] font-semibold text-gray-900 mt-[0.1vw]">
                  {user?.gstin || 'Not provided'}
                </span>
              </div>

              {/* Left Column 4: Billing Name (as shown in screenshot) */}
              <div className="flex flex-col">
                <span className="text-[0.7vw] text-gray-400 font-medium">
                  Billing Name
                </span>
                <span className="text-[0.82vw] font-semibold text-gray-900 mt-[0.1vw]">
                  {userName}
                </span>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Invoice History Section */}
      <div className="w-full bg-white border border-gray-200/90 rounded-[1.2vw] p-[1.6vw] shadow-[0_2px_12px_rgba(0,0,0,0.03)] mt-[1.5vw] flex flex-col">
        {/* Header: Icon + Title, Subtitle, Filter Dropdown, and View All link */}
        <div className="flex items-start justify-between gap-[1vw] mb-[1.2vw]">
          <div className="flex flex-col">
            <div className="flex items-center gap-[0.6vw]">
              <Icon icon="lucide:file-text" className="w-[1.2vw] h-[1.2vw] text-gray-900" strokeWidth="2.5" />
              <h3 className="text-[1.2vw] font-bold text-gray-900">
                Invoice History
              </h3>
            </div>
            <p className="text-[0.78vw] text-gray-400 mt-[0.25vw]">
              View and download your past inoices.
            </p>
          </div>

          {/* Right Controls: Filter Dropdown & View All */}
          <div className="flex items-center gap-[1.2vw]">
            {/* Filter Dropdown */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center justify-between gap-[0.8vw] bg-white border border-gray-200 hover:border-gray-300 px-[1vw] py-[0.45vw] rounded-[0.6vw] text-[0.8vw] font-medium text-gray-700 transition-colors shadow-sm cursor-pointer"
              >
                <span>All Invoices</span>
                <Icon icon="lucide:chevron-down" className="w-[0.9vw] h-[0.9vw] text-gray-500" strokeWidth="2.2" />
              </button>
            </div>

            {/* View All Link */}
            <button
              type="button"
              className="flex items-center gap-[0.4vw] text-[#E54D38] hover:text-[#d63f2b] text-[0.85vw] font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>View All</span>
              <Icon icon="lucide:arrow-right" className="w-[0.95vw] h-[0.95vw]" strokeWidth="2.4" />
            </button>
          </div>
        </div>

        {/* Invoices Table Container */}
        <div className="w-full border border-gray-200/80 rounded-[0.9vw] overflow-hidden">
          {/* Table Header Row */}
          <div className="w-full bg-[#f8f9fa] border-b border-gray-200/80 px-[1.5vw] py-[0.85vw] grid grid-cols-12 items-center text-[0.82vw] font-bold text-gray-900">
            <div className="col-span-3">Invoice</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Plan</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-2 text-right pr-[0.5vw]">Action</div>
          </div>

          {/* Table Body Rows */}
          <div className="divide-y divide-gray-100 bg-white">
            {[1, 2, 3, 4].map((item, index) => (
              <div 
                key={index} 
                className="w-full px-[1.5vw] py-[1.05vw] grid grid-cols-12 items-center text-[0.82vw] hover:bg-gray-50/70 transition-colors"
              >
                {/* Column 1: Invoice ID */}
                <div className="col-span-3 font-semibold text-gray-800">
                  INV-2026-004
                </div>

                {/* Column 2: Date */}
                <div className="col-span-2 text-gray-500 font-normal">
                  14 OCT 2026
                </div>

                {/* Column 3: Plan */}
                <div className="col-span-2 text-gray-500 font-normal">
                  Pro plan (Yearly)
                </div>

                {/* Column 4: Amount */}
                <div className="col-span-2 font-medium text-gray-800">
                  ₹ 4999
                </div>

                {/* Column 5: Status Pill */}
                <div className="col-span-1 flex justify-center">
                  <span className="bg-[#DCFCE7] text-[#16A34A] text-[0.72vw] font-semibold px-[0.9vw] py-[0.25vw] rounded-full inline-flex items-center justify-center">
                    Paid
                  </span>
                </div>

                {/* Column 6: Action / Download Button */}
                <div className="col-span-2 flex justify-end items-center gap-[0.5vw]">
                  {/* Red/White PDF Icon */}
                  <div className="w-[1.4vw] h-[1.4vw] flex items-center justify-center shrink-0">
                    <Icon icon="teenyicons:pdf-solid" className="w-[1.2vw] h-[1.2vw] text-[#EF4444]" />
                  </div>

                  {/* Download Button */}
                  <button
                    type="button"
                    className="flex items-center gap-[0.4vw] bg-gray-100/90 hover:bg-gray-200 text-gray-600 hover:text-gray-900 text-[0.78vw] font-medium px-[0.85vw] py-[0.4vw] rounded-[0.5vw] transition-colors cursor-pointer"
                  >
                    <span>Download</span>
                    <Icon icon="lucide:download" className="w-[0.85vw] h-[0.85vw]" strokeWidth="2.2" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* View More Expander at the bottom */}
        <div className="w-full flex justify-center pt-[1.2vw]">
          <button
            type="button"
            className="flex items-center gap-[0.4vw] text-[0.85vw] font-semibold text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <span>View More</span>
            <Icon icon="lucide:chevron-down" className="w-[1vw] h-[1vw]" strokeWidth="2.4" />
          </button>
        </div>

      </div>

      {/* Renewal Settings Section */}
      <div className="w-full bg-white border border-gray-200/90 rounded-[1.2vw] p-[1.6vw] shadow-[0_2px_12px_rgba(0,0,0,0.03)] mt-[1.5vw] flex flex-col">
        {/* Header: Icon + Title & Subtitle */}
        <div className="flex flex-col mb-[1.4vw]">
          <div className="flex items-center gap-[0.6vw]">
            <Icon icon="lucide:refresh-cw" className="w-[1.2vw] h-[1.2vw] text-gray-900" strokeWidth="2.5" />
            <h3 className="text-[1.2vw] font-bold text-gray-900">
              Renewal Settings
            </h3>
          </div>
          <p className="text-[0.78vw] text-gray-400 mt-[0.25vw]">
            Manage your subscription renewal preferences
          </p>
        </div>

        {/* Inner Card / Details Container */}
        <div className="w-full bg-white border border-gray-200/80 rounded-[1vw] p-[1.4vw] flex items-center justify-between shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
          {/* Left: Crown icon + Auto-Renewal title + toggle + description */}
          <div className="flex items-center gap-[1.1vw]">
            {/* Crown Icon Box */}
            <div className="w-[3.6vw] h-[3.6vw] rounded-[0.8vw] bg-[#FFF8EC] border border-[#FFE8BF] flex items-center justify-center shrink-0 shadow-sm">
              <Icon icon="solar:crown-bold" className="w-[2vw] h-[2vw] text-[#F59E0B]" />
            </div>

            {/* Title, Toggle, and Subtext */}
            <div className="flex flex-col">
              <div className="flex items-center gap-[0.8vw]">
                <h4 className="text-[1.1vw] font-bold text-gray-900">
                  Auto-Renewal
                </h4>

                {/* Switch Toggle (Exact style from EditProfile Visibility section) */}
                <button
                  type="button"
                  onClick={() => setAutoRenew(!autoRenew)}
                  className="relative inline-flex items-center w-[2.7vw] h-[1.6vw] shrink-0 cursor-pointer focus:outline-none"
                >
                  {/* Track */}
                  <span
                    className={`w-[2.4vw] h-[1.1vw] rounded-full transition-colors duration-200 ease-in-out ${
                      autoRenew ? 'bg-[#EC5137]' : 'bg-gray-200'
                    }`}
                  />

                  {/* Circular Button with Centered White Checkmark */}
                  <span
                    className={`absolute top-1/2 -translate-y-1/2 w-[1.45vw] h-[1.45vw] rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.22)] flex items-center justify-center transition-transform duration-200 ease-in-out ${
                      autoRenew
                        ? 'translate-x-[1.25vw] bg-[#EC5137]'
                        : 'translate-x-0 bg-white'
                    }`}
                  >
                    {autoRenew ? (
                      <Icon icon="lucide:check" className="w-[0.85vw] h-[0.85vw] text-white stroke-[3.5]" />
                    ) : null}
                  </span>
                </button>
              </div>

              <p className="text-[0.78vw] text-gray-400 mt-[0.25vw]">
                Automatically renew your subscription at the end of each billing cycle
              </p>
            </div>
          </div>

          {/* Right: Next Renewal Date & Current Plan */}
          <div className="flex items-center">
            {/* Next Renewal Date */}
            <div className="flex flex-col justify-center px-[2.2vw]">
              <span className="text-[0.72vw] text-gray-500 font-medium">
                Next Renewal Date
              </span>
              <div className="flex items-center gap-[0.45vw] text-gray-800 mt-[0.35vw]">
                <Icon icon="lucide:calendar-clock" className="w-[1vw] h-[1vw] text-gray-500 shrink-0" strokeWidth="2" />
                <span className="text-[0.85vw] font-semibold text-gray-800 whitespace-nowrap">
                  Apr 29,2024
                </span>
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="h-[2.5vw] w-[1px] bg-gray-200 shrink-0" />

            {/* Current Plan */}
            <div className="flex flex-col justify-center pl-[2.2vw]">
              <span className="text-[0.72vw] text-gray-500 font-medium">
                Current Plan
              </span>
              <div className="flex items-center gap-[0.45vw] text-gray-800 mt-[0.35vw]">
                <Icon icon="solar:crown-bold" className="w-[1vw] h-[1vw] text-gray-800 shrink-0" />
                <span className="text-[0.85vw] font-semibold text-gray-800 whitespace-nowrap">
                  Pro Plan (Yearly)
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Add Payment Method Modal */}
      {isAddPaymentModalOpen && (
        <div 
          onClick={handleCloseAddModal}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-[2px] p-[1vw]"
        >
          <div 
            className="w-full max-w-[34.5vw] bg-white rounded-[1.05vw] shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-[1.6vw] pt-[1.35vw] pb-[0.7vw]">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-[0.7vw]">
                  {/* Red/Orange credit card with plus icon */}
                  <div className="mt-[0.12vw] text-[#EC5137]">
                    <Icon icon="lucide:credit-card" className="w-[1.3vw] h-[1.3vw]" strokeWidth="2.4" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-[0.7vw]">
                      <h2 className="text-[1.12vw] font-bold text-gray-900 tracking-tight leading-none">
                        Add Payment Method
                      </h2>
                      {/* Decorative soft line */}
                      <div className="w-[8.5vw] h-[1px] bg-gray-200 hidden sm:block" />
                    </div>
                    <p className="text-[0.68vw] text-gray-400 mt-[0.28vw]">
                      Add a new payment method for future subscription payments.
                    </p>
                  </div>
                </div>

                {/* Close 'X' Button */}
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer p-[0.22vw] rounded-[0.3vw] hover:bg-gray-100"
                >
                  <Icon icon="lucide:x" className="w-[1vw] h-[1vw]" strokeWidth="2.2" />
                </button>
              </div>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSavePaymentMethod} className="px-[1.6vw] pb-[1.45vw] pt-[0.2vw] flex flex-col gap-[0.95vw]">
              
              {/* Payment Type Selection Tabs */}
              <div className="grid grid-cols-3 gap-[0.7vw]">
                {/* Option 1: Card */}
                <button
                  type="button"
                  onClick={() => setPaymentType('card')}
                  className={`flex items-center gap-[0.58vw] p-[0.68vw] rounded-[0.65vw] border text-left transition-all cursor-pointer ${
                    paymentType === 'card'
                      ? 'border-[#EC5137] bg-white shadow-xs'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="w-[1.85vw] h-[1.85vw] rounded-[0.42vw] bg-[#FDF2F0] flex items-center justify-center shrink-0">
                    <Icon icon="bi:credit-card" className="w-[1.02vw] h-[1.02vw] text-[#EC5137]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[0.76vw] font-bold text-gray-900 leading-tight">Card</span>
                    <span className="text-[0.6vw] text-gray-400 mt-[0.1vw] truncate">Credit / Debit Card</span>
                  </div>
                </button>

                {/* Option 2: UPI */}
                <button
                  type="button"
                  onClick={() => setPaymentType('upi')}
                  className={`flex items-center gap-[0.58vw] p-[0.68vw] rounded-[0.65vw] border text-left transition-all cursor-pointer ${
                    paymentType === 'upi'
                      ? 'border-[#EC5137] bg-white shadow-xs'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="w-[1.85vw] h-[1.85vw] rounded-[0.42vw] bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                    <Icon icon="thesvg-color:upi" className="w-[1.12vw] h-[1.12vw]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[0.76vw] font-bold text-gray-900 leading-tight">UPI</span>
                    <span className="text-[0.6vw] text-gray-400 mt-[0.1vw] truncate">Google Pay, Paytm, ect.</span>
                  </div>
                </button>

                {/* Option 3: Net Banking */}
                <button
                  type="button"
                  onClick={() => setPaymentType('netbanking')}
                  className={`flex items-center gap-[0.58vw] p-[0.68vw] rounded-[0.65vw] border text-left transition-all cursor-pointer ${
                    paymentType === 'netbanking'
                      ? 'border-[#EC5137] bg-white shadow-xs'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="w-[1.85vw] h-[1.85vw] rounded-[0.42vw] bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                    <Icon icon="fluent:building-bank-24-filled" className="w-[1.08vw] h-[1.08vw] text-gray-700" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[0.76vw] font-bold text-gray-900 leading-tight">Net Banking</span>
                    <span className="text-[0.6vw] text-gray-400 mt-[0.1vw] truncate">All major banks</span>
                  </div>
                </button>
              </div>

              {/* Conditional Fields: Card vs UPI */}
              {paymentType === 'upi' ? (
                /* UPI ID Field */
                <div className="flex flex-col gap-[0.3vw]">
                  <label className="text-[0.72vw] font-semibold text-gray-800">
                    UPI ID
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="luffy@okaxis"
                    className="w-full px-[0.82vw] py-[0.55vw] rounded-[0.55vw] border border-gray-200 hover:border-gray-300 focus:border-[#EC5137] focus:ring-1 focus:ring-[#EC5137] outline-none text-[0.74vw] text-gray-800 placeholder-gray-400 transition-colors"
                  />
                  <p className="text-[0.62vw] text-gray-400 mt-[0.1vw]">
                    Enter your UPI ID to set up automatic subscription payments.
                  </p>
                </div>
              ) : (
                /* Card Fields (Card Number, Expiry, CVV, Cardholder Name) */
                <>
                  {/* Card Number Field */}
                  <div className="flex flex-col gap-[0.3vw]">
                    <label className="text-[0.72vw] font-semibold text-gray-800">
                      Card Number
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-[0.75vw] text-gray-400 flex items-center pointer-events-none">
                        <Icon icon="lucide:credit-card" className="w-[0.95vw] h-[0.95vw]" strokeWidth="2" />
                      </div>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="1234 5678 9012 3456"
                        className="w-full pl-[2.2vw] pr-[7.2vw] py-[0.55vw] rounded-[0.55vw] border border-gray-200 hover:border-gray-300 focus:border-[#EC5137] focus:ring-1 focus:ring-[#EC5137] outline-none text-[0.74vw] text-gray-800 placeholder-gray-400 transition-colors"
                      />
                      {/* Card Brand Logos on the right */}
                      <div className="absolute right-[0.75vw] flex items-center gap-[0.35vw] pointer-events-none">
                        <Icon icon="logos:visa" className="w-[1.3vw] h-[0.72vw] object-contain" />
                        <Icon icon="logos:mastercard" className="w-[1.08vw] h-[0.72vw] object-contain" />
                        <Icon icon="logos:amex" className="w-[1.15vw] h-[0.72vw] object-contain" />
                        <Icon icon="logos:paypal" className="w-[0.98vw] h-[0.72vw] object-contain" />
                      </div>
                    </div>
                  </div>

                  {/* Expiry Date & CVV Row */}
                  <div className="grid grid-cols-2 gap-[0.9vw]">
                    {/* Expiry Date */}
                    <div className="flex flex-col gap-[0.3vw]">
                      <label className="text-[0.72vw] font-semibold text-gray-800">
                        Expiry Date
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          placeholder="MM / YY"
                          className="w-full px-[0.82vw] pr-[2.2vw] py-[0.55vw] rounded-[0.55vw] border border-gray-200 hover:border-gray-300 focus:border-[#EC5137] focus:ring-1 focus:ring-[#EC5137] outline-none text-[0.74vw] text-gray-800 placeholder-gray-400 transition-colors"
                        />
                        <div className="absolute right-[0.75vw] text-gray-400 flex items-center pointer-events-none">
                          <Icon icon="lucide:calendar" className="w-[0.9vw] h-[0.9vw]" strokeWidth="2" />
                        </div>
                      </div>
                    </div>

                    {/* CVV */}
                    <div className="flex flex-col gap-[0.3vw]">
                      <div className="flex items-center gap-[0.3vw]">
                        <label className="text-[0.72vw] font-semibold text-gray-800">
                          CVV
                        </label>
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type="password"
                          maxLength={4}
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value)}
                          placeholder="123"
                          className="w-full px-[0.82vw] pr-[3.1vw] py-[0.55vw] rounded-[0.55vw] border border-gray-200 hover:border-gray-300 focus:border-[#EC5137] focus:ring-1 focus:ring-[#EC5137] outline-none text-[0.74vw] text-gray-800 placeholder-gray-400 transition-colors"
                        />
                        <div className="absolute right-[0.75vw] flex items-center gap-[0.3vw]">
                          <Icon icon="lucide:lock" className="w-[0.85vw] h-[0.85vw] text-gray-400" strokeWidth="2" />
                          <button 
                            type="button" 
                            title="3 or 4 digit code on the back of your card"
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <Icon icon="lucide:help-circle" className="w-[0.85vw] h-[0.85vw]" strokeWidth="2" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cardholder Name Field */}
                  <div className="flex flex-col gap-[0.3vw]">
                    <label className="text-[0.72vw] font-semibold text-gray-800">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      placeholder="Luffy"
                      className="w-full px-[0.82vw] py-[0.55vw] rounded-[0.55vw] border border-gray-200 hover:border-gray-300 focus:border-[#EC5137] focus:ring-1 focus:ring-[#EC5137] outline-none text-[0.74vw] text-gray-800 placeholder-gray-400 transition-colors"
                    />
                  </div>
                </>
              )}

              {/* Checkbox: Set as default payment method */}
              <div className="flex items-start gap-[0.5vw] pt-[0.08vw]">
                <button
                  type="button"
                  onClick={() => setSetAsDefaultPayment(!setAsDefaultPayment)}
                  className={`w-[0.92vw] h-[0.92vw] rounded-[0.22vw] flex items-center justify-center shrink-0 mt-[0.1vw] transition-colors cursor-pointer ${
                    setAsDefaultPayment
                      ? 'bg-[#EC5137] text-white'
                      : 'border border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  {setAsDefaultPayment && (
                    <Icon icon="lucide:check" className="w-[0.7vw] h-[0.7vw] stroke-[3.5]" />
                  )}
                </button>
                <div className="flex flex-col">
                  <span className="text-[0.74vw] font-semibold text-gray-900 leading-tight">
                    Set as default payment method
                  </span>
                  <span className="text-[0.64vw] text-gray-400 mt-[0.1vw]">
                    This card will be used for all future subscription payments
                  </span>
                </div>
              </div>

              {/* Informational Blue Banner (Shown when UPI is selected) */}
              {paymentType === 'upi' && (
                <div className="flex items-center gap-[0.6vw] bg-[#EEF4FF] border border-[#D0E1FD] rounded-[0.55vw] px-[0.85vw] py-[0.6vw] mt-[0.2vw]">
                  <Icon icon="boxicons:lock-keyhole" className="w-[1vw] h-[1vw] text-[#3B82F6] shrink-0" />
                  <p className="text-[0.63vw] text-[#475569] leading-tight font-normal">
                    Your payment method will be linked only after successful authorization. Any applicable mandate terms and amount will be shown before approval.
                  </p>
                </div>
              )}

              {/* Action Buttons: Cancel & Add Payment Method */}
              <div className="flex items-center justify-end gap-[0.7vw] pt-[0.5vw]">
                {/* Cancel Button */}
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  className="flex items-center gap-[0.32vw] px-[1.1vw] py-[0.5vw] rounded-[0.5vw] border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-[0.74vw] font-medium text-gray-700 transition-all cursor-pointer"
                >
                  <Icon icon="lucide:x" className="w-[0.8vw] h-[0.8vw] text-gray-500" strokeWidth="2.2" />
                  <span>Cancel</span>
                </button>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="flex items-center gap-[0.38vw] px-[1.2vw] py-[0.5vw] rounded-[0.5vw] bg-[#EC5137] hover:bg-[#d94229] active:scale-[0.98] text-white text-[0.74vw] font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <Icon icon="lucide:credit-card" className="w-[0.85vw] h-[0.85vw]" strokeWidth="2.2" />
                  <span>Add Payment Method</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Edit Billing Information Modal */}
      {isEditBillingModalOpen && (
        <div 
          onClick={handleCloseEditBillingModal}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-[2px] p-[1vw]"
        >
          <div 
            className="w-full max-w-[34.5vw] bg-white rounded-[1.05vw] shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-[1.6vw] pt-[1.35vw] pb-[0.7vw] shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-[0.7vw]">
                  {/* Red/Orange edit document icon */}
                  <div className="mt-[0.12vw] text-[#EC5137]">
                    <Icon icon="lucide:file-edit" className="w-[1.3vw] h-[1.3vw]" strokeWidth="2.3" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-[0.7vw]">
                      <h2 className="text-[1.12vw] font-bold text-gray-900 tracking-tight leading-none">
                        Edit Billing Information
                      </h2>
                      {/* Decorative soft line */}
                      <div className="w-[8.5vw] h-[1px] bg-gray-200 hidden sm:block" />
                    </div>
                    <p className="text-[0.68vw] text-gray-400 mt-[0.28vw]">
                      These details will be used for billing and invoices.
                    </p>
                  </div>
                </div>

                {/* Close 'X' Button */}
                <button
                  type="button"
                  onClick={handleCloseEditBillingModal}
                  className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer p-[0.22vw] rounded-[0.3vw] hover:bg-gray-100"
                >
                  <Icon icon="lucide:x" className="w-[1vw] h-[1vw]" strokeWidth="2.2" />
                </button>
              </div>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveBillingInfo} className="flex flex-col flex-1 min-h-0">
              
              <div className="px-[1.6vw] pb-[0.8vw] pt-[0.2vw] flex flex-col gap-[0.85vw] overflow-y-auto [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                {/* Field 1: Billing Name * */}
                <div className="flex flex-col gap-[0.25vw]">
                  <label className="text-[0.72vw] font-semibold text-gray-800">
                    Billing Name <span className="text-[#EC5137]">*</span>
                  </label>
                  <input
                    type="text"
                    value={billingName}
                    onChange={(e) => setBillingName(e.target.value)}
                    placeholder="Luffy"
                    className="w-full px-[0.82vw] py-[0.52vw] rounded-[0.55vw] border border-gray-200 hover:border-gray-300 focus:border-[#EC5137] focus:ring-1 focus:ring-[#EC5137] outline-none text-[0.74vw] text-gray-800 placeholder-gray-400 transition-colors"
                  />
                </div>

                {/* Field 2: Company Name (Optional) */}
                <div className="flex flex-col gap-[0.25vw]">
                  <label className="text-[0.72vw] font-semibold text-gray-800">
                    Company Name <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={billingCompany}
                    onChange={(e) => setBillingCompany(e.target.value)}
                    placeholder="EduVision Creatives"
                    className="w-full px-[0.82vw] py-[0.52vw] rounded-[0.55vw] border border-gray-200 hover:border-gray-300 focus:border-[#EC5137] focus:ring-1 focus:ring-[#EC5137] outline-none text-[0.74vw] text-gray-800 placeholder-gray-400 transition-colors"
                  />
                </div>

                {/* Field 3: Billing Email * */}
                <div className="flex flex-col gap-[0.25vw]">
                  <label className="text-[0.72vw] font-semibold text-gray-800">
                    Billing Email <span className="text-[#EC5137]">*</span>
                  </label>
                  <input
                    type="email"
                    value={billingEmail}
                    onChange={(e) => setBillingEmail(e.target.value)}
                    placeholder="luffyonepiece@gmail.com"
                    className="w-full px-[0.82vw] py-[0.52vw] rounded-[0.55vw] border border-gray-200 hover:border-gray-300 focus:border-[#EC5137] focus:ring-1 focus:ring-[#EC5137] outline-none text-[0.74vw] text-gray-800 placeholder-gray-400 transition-colors"
                  />
                </div>

                {/* Field 4: Billing Address * */}
                <div className="flex flex-col gap-[0.25vw]">
                  <label className="text-[0.72vw] font-semibold text-gray-800">
                    Billing Address <span className="text-[#EC5137]">*</span>
                  </label>
                  <input
                    type="text"
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    placeholder="123, Anna Nagar"
                    className="w-full px-[0.82vw] py-[0.52vw] rounded-[0.55vw] border border-gray-200 hover:border-gray-300 focus:border-[#EC5137] focus:ring-1 focus:ring-[#EC5137] outline-none text-[0.74vw] text-gray-800 placeholder-gray-400 transition-colors"
                  />
                </div>

                {/* Row: Country * & State * */}
                <div className="grid grid-cols-2 gap-[0.9vw]">
                  {/* Country Dropdown */}
                  <div className="flex flex-col gap-[0.25vw]" ref={countryRef}>
                    <label className="text-[0.72vw] font-semibold text-gray-800">
                      Country <span className="text-[#EC5137]">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCountryOpen(!isCountryOpen);
                          setIsStateOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-[0.82vw] py-[0.52vw] rounded-[0.55vw] border bg-white text-[0.74vw] transition-colors cursor-pointer ${
                          isCountryOpen ? 'border-[#EC5137] ring-1 ring-[#EC5137]' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="truncate text-gray-800 font-medium">
                          {selectedCountryName}
                        </span>
                        <Icon
                          icon="lucide:chevron-down"
                          className={`w-[0.9vw] h-[0.9vw] text-gray-400 transition-transform duration-200 shrink-0 ${
                            isCountryOpen ? 'rotate-180 text-[#EC5137]' : ''
                          }`}
                          strokeWidth="2.2"
                        />
                      </button>

                      {/* Compact Dropdown Popover */}
                      {isCountryOpen && (
                        <div className="absolute left-0 top-[110%] w-full bg-white rounded-[0.55vw] shadow-xl border border-gray-100 z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
                          {/* Search Input */}
                          <div className="p-[0.35vw] border-b border-gray-100 bg-gray-50/70">
                            <div className="flex items-center px-[0.5vw] py-[0.3vw] bg-white rounded-[0.4vw] border border-gray-200">
                              <Icon icon="lucide:search" className="w-[0.75vw] h-[0.75vw] text-gray-400 shrink-0 mr-[0.3vw]" />
                              <input
                                type="text"
                                value={countrySearch}
                                onChange={(e) => setCountrySearch(e.target.value)}
                                placeholder="Search country..."
                                autoFocus
                                className="w-full text-[0.68vw] bg-transparent outline-none text-gray-800 placeholder-gray-400"
                              />
                              {countrySearch && (
                                <button
                                  type="button"
                                  onClick={() => setCountrySearch('')}
                                  className="text-gray-400 hover:text-gray-600 text-[0.65vw]"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Country List - Fixed Compact Max Height */}
                          <div className="max-h-[10.5vw] overflow-y-auto divide-y divide-gray-50 [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                            {filteredCountries.length > 0 ? (
                              filteredCountries.map((country) => {
                                const isSelected = country.isoCode === selectedCountryCode;
                                return (
                                  <button
                                    key={country.isoCode}
                                    type="button"
                                    onClick={() => handleSelectCountry(country.isoCode, country.name)}
                                    className={`w-full text-left px-[0.82vw] py-[0.4vw] text-[0.72vw] transition-colors flex items-center justify-between cursor-pointer ${
                                      isSelected
                                        ? 'bg-[#EC5137]/10 text-[#EC5137] font-semibold'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                  >
                                    <span className="truncate">{country.name}</span>
                                    {isSelected && (
                                      <Icon icon="lucide:check" className="w-[0.8vw] h-[0.8vw] text-[#EC5137] shrink-0" strokeWidth="2.5" />
                                    )}
                                  </button>
                                );
                              })
                            ) : (
                              <div className="p-[0.7vw] text-center text-gray-400 text-[0.68vw]">
                                No country found
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* State Dropdown */}
                  <div className="flex flex-col gap-[0.25vw]" ref={stateRef}>
                    <label className="text-[0.72vw] font-semibold text-gray-800">
                      State <span className="text-[#EC5137]">*</span>
                    </label>
                    <div className="relative">
                      {availableStates.length > 0 ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setIsStateOpen(!isStateOpen);
                              setIsCountryOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-[0.82vw] py-[0.52vw] rounded-[0.55vw] border bg-white text-[0.74vw] transition-colors cursor-pointer ${
                              isStateOpen ? 'border-[#EC5137] ring-1 ring-[#EC5137]' : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <span className="truncate text-gray-800 font-medium">
                              {billingState || 'Select state'}
                            </span>
                            <Icon
                              icon="lucide:chevron-down"
                              className={`w-[0.9vw] h-[0.9vw] text-gray-400 transition-transform duration-200 shrink-0 ${
                                isStateOpen ? 'rotate-180 text-[#EC5137]' : ''
                              }`}
                              strokeWidth="2.2"
                            />
                          </button>

                          {/* Compact Dropdown Popover */}
                          {isStateOpen && (
                            <div className="absolute left-0 top-[110%] w-full bg-white rounded-[0.55vw] shadow-xl border border-gray-100 z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
                              {/* Search Input if many states */}
                              {availableStates.length > 5 && (
                                <div className="p-[0.35vw] border-b border-gray-100 bg-gray-50/70">
                                  <div className="flex items-center px-[0.5vw] py-[0.3vw] bg-white rounded-[0.4vw] border border-gray-200">
                                    <Icon icon="lucide:search" className="w-[0.75vw] h-[0.75vw] text-gray-400 shrink-0 mr-[0.3vw]" />
                                    <input
                                      type="text"
                                      value={stateSearch}
                                      onChange={(e) => setStateSearch(e.target.value)}
                                      placeholder="Search state..."
                                      autoFocus
                                      className="w-full text-[0.68vw] bg-transparent outline-none text-gray-800 placeholder-gray-400"
                                    />
                                    {stateSearch && (
                                      <button
                                        type="button"
                                        onClick={() => setStateSearch('')}
                                        className="text-gray-400 hover:text-gray-600 text-[0.65vw]"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* State List - Fixed Compact Max Height */}
                              <div className="max-h-[10.5vw] overflow-y-auto divide-y divide-gray-50 [&::-webkit-scrollbar]:w-[4px] [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                                {filteredStates.length > 0 ? (
                                  filteredStates.map((state) => {
                                    const isSelected = state.name === billingState;
                                    return (
                                      <button
                                        key={state.isoCode || state.name}
                                        type="button"
                                        onClick={() => handleSelectState(state.name)}
                                        className={`w-full text-left px-[0.82vw] py-[0.4vw] text-[0.72vw] transition-colors flex items-center justify-between cursor-pointer ${
                                          isSelected
                                            ? 'bg-[#EC5137]/10 text-[#EC5137] font-semibold'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                      >
                                        <span className="truncate">{state.name}</span>
                                        {isSelected && (
                                          <Icon icon="lucide:check" className="w-[0.8vw] h-[0.8vw] text-[#EC5137] shrink-0" strokeWidth="2.5" />
                                        )}
                                      </button>
                                    );
                                  })
                                ) : (
                                  <div className="p-[0.7vw] text-center text-gray-400 text-[0.68vw]">
                                    No state found
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <input
                          type="text"
                          value={billingState}
                          onChange={(e) => setBillingState(e.target.value)}
                          placeholder="Enter state"
                          className="w-full px-[0.82vw] py-[0.52vw] rounded-[0.55vw] border border-gray-200 hover:border-gray-300 focus:border-[#EC5137] focus:ring-1 focus:ring-[#EC5137] outline-none text-[0.74vw] text-gray-800 transition-colors"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Row: City * & Postal Code * */}
                <div className="grid grid-cols-2 gap-[0.9vw]">
                  {/* City */}
                  <div className="flex flex-col gap-[0.25vw]">
                    <label className="text-[0.72vw] font-semibold text-gray-800">
                      City <span className="text-[#EC5137]">*</span>
                    </label>
                    <input
                      type="text"
                      value={billingCity}
                      onChange={(e) => setBillingCity(e.target.value)}
                      placeholder="Madurai"
                      className="w-full px-[0.82vw] py-[0.52vw] rounded-[0.55vw] border border-gray-200 hover:border-gray-300 focus:border-[#EC5137] focus:ring-1 focus:ring-[#EC5137] outline-none text-[0.74vw] text-gray-800 placeholder-gray-400 transition-colors"
                    />
                  </div>

                  {/* Postal Code */}
                  <div className="flex flex-col gap-[0.25vw]">
                    <label className="text-[0.72vw] font-semibold text-gray-800">
                      Postal Code <span className="text-[#EC5137]">*</span>
                    </label>
                    <input
                      type="text"
                      value={billingPostalCode}
                      onChange={(e) => setBillingPostalCode(e.target.value)}
                      placeholder="625020"
                      className="w-full px-[0.82vw] py-[0.52vw] rounded-[0.55vw] border border-gray-200 hover:border-gray-300 focus:border-[#EC5137] focus:ring-1 focus:ring-[#EC5137] outline-none text-[0.74vw] text-gray-800 placeholder-gray-400 transition-colors"
                    />
                  </div>
                </div>

                {/* Field 7: GSTIN (Optional) */}
                <div className="flex flex-col gap-[0.25vw]">
                  <label className="text-[0.72vw] font-semibold text-gray-800">
                    GSTIN <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={billingGstin}
                    onChange={(e) => setBillingGstin(e.target.value)}
                    placeholder="luffy@okaxis"
                    className="w-full px-[0.82vw] py-[0.52vw] rounded-[0.55vw] border border-gray-200 hover:border-gray-300 focus:border-[#EC5137] focus:ring-1 focus:ring-[#EC5137] outline-none text-[0.74vw] text-gray-800 placeholder-gray-400 transition-colors"
                  />
                  <p className="text-[0.62vw] text-gray-400 mt-[0.1vw]">
                    For applicable Indian business tax invoices.
                  </p>
                </div>
              </div>

              {/* Action Buttons: Cancel & Save Changes */}
              <div className="px-[1.6vw] py-[1vw] border-t border-gray-100 flex items-center justify-end gap-[0.7vw] shrink-0 bg-white">
                {/* Cancel Button */}
                <button
                  type="button"
                  onClick={handleCloseEditBillingModal}
                  className="flex items-center gap-[0.32vw] px-[1.1vw] py-[0.5vw] rounded-[0.5vw] border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-[0.74vw] font-medium text-gray-700 transition-all cursor-pointer"
                >
                  <Icon icon="lucide:x" className="w-[0.8vw] h-[0.8vw] text-gray-500" strokeWidth="2.2" />
                  <span>Cancel</span>
                </button>

                {/* Save Changes Button */}
                <button
                  type="submit"
                  className="flex items-center gap-[0.38vw] px-[1.3vw] py-[0.5vw] rounded-[0.5vw] bg-[#EC5137] hover:bg-[#d94229] active:scale-[0.98] text-white text-[0.74vw] font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <Icon icon="lucide:check" className="w-[0.85vw] h-[0.85vw]" strokeWidth="2.8" />
                  <span>Save changes</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default Billing;
