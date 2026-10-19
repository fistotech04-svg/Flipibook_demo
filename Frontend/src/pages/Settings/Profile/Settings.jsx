import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { ArrowRight } from 'lucide-react';
import { resolveUploadsPath } from '../../../utils/supabaseUtils';
import crownImg from '../../../assets/settings/Crown img.svg';
import p1 from '../../../assets/settings/p1.png';

const defaultColors = [
  '#4c5add', '#2563eb', '#059669', '#d97706', '#dc2626', 
  '#7c3aed', '#db2777', '#0891b2', '#8a4419', '#597810'
];

export const getAvatarColor = (identifier, customColor) => {
  if (customColor && customColor !== '#E8D4C8' && customColor !== '#ffffff' && customColor !== 'transparent') {
    return customColor;
  }
  if (!identifier) return defaultColors[0];
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  return defaultColors[Math.abs(hash) % defaultColors.length];
};

const defaultProfile = {
  name: 'User',
  email: '',
  emailId: '',
  picture: null,
  avatarBgColor: '#E8D4C8',
  about: '',
  mobile: '',
  companyName: '',
  industryType: '',
  companyEmail: '',
  website: '',
  services: [],
  address1: '',
  address2: '',
  city: '',
  pincode: '',
  state: '',
  country: 'INDIA',
  socials: {
    website: '',
    instagram: '',
    linkedin: '',
    facebook: '',
    whatsapp: ''
  },
  visibilitySettings: {
    showInExplore: true,
    showContact: true,
    showAddress: true,
    showSocial: true
  },
  bannerBg: {
    type: 'gradient',
    value: 'linear-gradient(to bottom right, #c1e8d7, #85d8c3, #60bba3)'
  }
};

const getInitialProfile = () => {
  try {
    const cached = localStorage.getItem('user_profile') || localStorage.getItem('user');
    if (cached) {
      const parsed = JSON.parse(cached);
      const email = parsed.emailId || parsed.email || '';
      return {
        ...defaultProfile,
        ...parsed,
        email,
        emailId: email,
        name: parsed.name || (email ? email.split('@')[0] : 'User')
      };
    }
  } catch (e) {}
  return defaultProfile;
};

const SettingsLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(getInitialProfile);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('user_profile');
    localStorage.removeItem('last_active_folder');
    localStorage.removeItem('hide_upgrade_card');
    sessionStorage.removeItem('hide_upgrade_card');
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
    navigate('/');
  };

  useEffect(() => {
    let targetEmail = '';
    const storedUser = localStorage.getItem('user_profile') || localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        targetEmail = parsedUser.emailId || parsedUser.email || '';
        setUser(prev => ({
          ...defaultProfile,
          ...prev,
          ...parsedUser,
          name: parsedUser.name || (targetEmail ? targetEmail.split('@')[0] : 'User'),
          email: targetEmail || '',
          emailId: targetEmail || '',
          picture: parsedUser.picture || null,
          avatarBgColor: parsedUser.avatarBgColor || '#E8D4C8'
        }));
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }

    if (targetEmail) {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      fetch(`${backendUrl}/api/profile?emailId=${encodeURIComponent(targetEmail)}`)
        .then(res => res.json())
        .then(data => {
          if (data?.success && data?.profile) {
            const p = data.profile;
            setUser(prev => {
              const updated = {
                ...defaultProfile,
                ...prev,
                ...p,
                email: p.emailId || prev.email || targetEmail,
                emailId: p.emailId || prev.emailId || targetEmail,
                name: p.name || prev.name,
                picture: p.picture || prev.picture || null,
                avatarBgColor: p.avatarBgColor || prev.avatarBgColor || '#E8D4C8',
                services: p.services || prev.services || [],
                socials: {
                  ...defaultProfile.socials,
                  ...(prev.socials || {}),
                  ...(p.socials || {})
                },
                visibilitySettings: {
                  ...defaultProfile.visibilitySettings,
                  ...(prev.visibilitySettings || {}),
                  ...(p.visibilitySettings || {})
                }
              };
              return updated;
            });
          }
        })
        .catch(err => console.error("Error loading profile in settings:", err));
    }
  }, []);

  // Sync user state to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('user_profile', JSON.stringify(user));
    } catch (e) {}
  }, [user]);

  const userEmail = user?.emailId || user?.email || '';
  const profilePath = userEmail ? `profile/${encodeURIComponent(userEmail)}` : 'profile';

  const sidebarGroups = [
    {
      title: 'General',
      items: [
        { path: profilePath, id: 'profile', label: 'Profile', icon: 'solar:user-id-linear' },
        { path: 'account', id: 'account', label: 'Account', icon: 'lucide:user' },
        { path: 'notifications', id: 'notifications', label: 'Notifications', icon: 'lucide:bell' },
        { path: 'my-shelf', id: 'my-shelf', label: 'My Shelf', icon: 'clarity:library-line' },
      ]
    },
    {
      title: 'System & Billing',
      items: [
        { path: 'virtual-stall', id: 'virtual-stall', label: 'Virtual Stall', icon: 'lucide:store' },
        { path: 'billing-and-invoice', id: 'billing-and-invoice', label: 'Billing and Invoice', icon: 'lucide:receipt' },
        { path: 'support', id: 'support', label: 'Support', icon: 'lucide:headset' },
      ]
    }
  ];

  const avatarSrc = user?.picture && user.picture !== 'color_only'
    ? (user.picture.startsWith('blob:') || user.picture.startsWith('data:') ? user.picture : resolveUploadsPath(user.picture))
    : null;

  return (
    <div className="flex h-full bg-white font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-[18vw] flex-shrink-0 border-r border-gray-100 flex flex-col bg-white">
        
        {/* User Profile Header in Sidebar (as shown in screenshot) */}
        <div className="flex items-center justify-between px-[1.2vw] pt-[1.2vw] pb-[1.4vw] border-b border-gray-100">
          <div className="flex items-center gap-[0.8vw] min-w-0">
            <div 
              className="w-[3.2vw] h-[3.2vw] rounded-full overflow-hidden flex items-center justify-center shrink-0 shadow-sm"
              style={{ backgroundColor: avatarSrc ? '#ffffff' : (user?.avatarBgColor || getAvatarColor(user?.name || userEmail || 'User')) }}
            >
              {avatarSrc ? (
                <img 
                  src={avatarSrc} 
                  alt={user?.name || 'User'} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <span className="text-white text-[1.4vw] font-semibold">
                  {user?.name ? user.name.charAt(0).toUpperCase() : (userEmail ? userEmail.charAt(0).toUpperCase() : 'U')}
                </span>
              )}
            </div>
            <div className="min-w-0 flex flex-col">
              <h3 className="text-[1.1vw] font-bold text-gray-900 truncate leading-tight">
                {user?.name || (userEmail ? userEmail.split('@')[0] : 'User')}
              </h3>
              <p className="text-[0.78vw] text-gray-500 truncate leading-normal">
                {userEmail}
              </p>
            </div>
          </div>

          <Link
            to={profilePath}
            title="Edit Profile"
            className="p-[0.35vw] text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-[0.4vw] transition-colors shrink-0"
          >
            <Icon icon="lucide:square-pen" className="w-[1.2vw] h-[1.2vw]" />
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-[1vw] pt-[1.2vw] pb-[2vw] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {sidebarGroups.map((group, index) => (
            <div key={index} className="mb-[1.6vw]">
              
              {/* Group Title with Line */}
              <div className="flex items-center gap-[0.8vw] mb-[0.8vw] px-[0.5vw]">
                <h4 className="text-[0.88vw] font-medium text-gray-600 whitespace-nowrap">
                  {group.title}
                </h4>
                <div className="h-[1px] bg-gray-100 flex-1"></div>
              </div>

              <div className="flex flex-col gap-[0.25vw]">
                {group.items.map((item) => {
                  const isProfile = item.id === 'profile';
                  const isActive = isProfile 
                    ? location.pathname.startsWith('/settings/profile')
                    : location.pathname === `/settings/${item.path}` || location.pathname.startsWith(`/settings/${item.path}/`) || (item.id === 'billing-and-invoice' && location.pathname === '/settings/billing');

                  return (
                    <Link
                      key={item.id || item.path}
                      to={item.path}
                      className={`
                        flex items-center gap-[0.9vw] px-[0.9vw] py-[0.55vw] rounded-[0.5vw] text-[0.85vw] font-normal transition-colors
                        ${isActive 
                          ? 'bg-[#F2F2F2] text-gray-900 font-medium' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      <Icon 
                        icon={item.icon} 
                        className="w-[1.15vw] h-[1.15vw] flex-shrink-0 text-gray-700" 
                        strokeWidth="1.8"
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Upgrade Profile Card with Royal Gold Crown (Matching screenshot) */}
        <div className="p-[0.8vw] mb-[0.6vw]">
          <div className="relative">
            {/* 3D Realistic Royal Gold Crown on Top-Right */}
            <div className="absolute -top-[1.1vw] -right-[0.5vw] w-[2.8vw] h-[2.3vw] rotate-[14deg] z-20 select-none pointer-events-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.35)]">
              <img 
                src={crownImg} 
                alt="Crown" 
                className="w-full h-full object-contain" 
              />
            </div>

            {/* Dark Textured / Speckled Upgrade Profile Button */}
            <button
              onClick={() => navigate('/settings/billing-and-invoice')}
              className="w-full relative overflow-hidden py-[0.7vw] px-[1vw] rounded-[0.7vw] text-[0.88vw] font-semibold text-white flex items-center justify-center gap-[0.5vw] shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_22px_rgba(0,0,0,0.4)] active:scale-[0.98] transition-all cursor-pointer group"
              style={{
                background: 'radial-gradient(ellipse at 50% 20%, #2b2e35 0%, #17181c 65%, #0f1013 100%)',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.12)'
              }}
            >
              <span className="tracking-wide text-gray-100 font-medium">Upgrade Profile</span>
              <ArrowRight size="1vw" strokeWidth={2.4} className="text-gray-200 transition-transform group-hover:translate-x-[0.2vw]" />
            </button>
          </div>
        </div>

      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-white p-[1vw] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <Outlet context={{ user, setUser }} />
      </main>
    </div>
  );
};

export default SettingsLayout;
