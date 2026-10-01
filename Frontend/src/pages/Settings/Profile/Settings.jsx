import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
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
        { path: profilePath, id: 'profile', label: 'Profile', icon: 'mingcute:profile-line' },
        { path: 'account', id: 'account', label: 'Account', icon: 'iconamoon:profile' },
        { path: 'notifications', id: 'notifications', label: 'Notifications', icon: 'basil:notification-on-outline' },
        { path: 'my-shelf', id: 'my-shelf', label: 'My Shelf', icon: 'clarity:library-line' },
      ]
    },
    {
      title: 'Workspace',
      items: [
        { path: 'editor-defaults', id: 'editor-defaults', label: 'Editor Defaults', icon: 'vaadin:edit' },
        { path: 'library', id: 'library', label: 'Library', icon: 'clarity:library-line' },
        { path: 'integrations', id: 'integrations', label: 'Integrations', icon: 'oui:integration-general' },
      ]
    },
    {
      title: 'System & Billing',
      items: [
        { path: 'privacy-access', id: 'privacy-access', label: 'Privacy & Access', icon: 'line-md:security' },
        { path: 'analytics', id: 'analytics', label: 'Analytics', icon: 'carbon:analytics' },
        { path: 'billing', id: 'billing', label: 'Billing', icon: 'tdesign:bill' },
        { path: 'advanced', id: 'advanced', label: 'Advanced', icon: 'gcp:advanced-solutions-lab' },
        { path: 'account-management', id: 'account-management', label: 'Account Management', icon: 'material-symbols:manage-accounts-outline-rounded' },
      ]
    }
  ];

  return (
    <div className="flex h-full bg-white font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-[16vw] mt-[1.5vw] flex-shrink-0 border-r border-gray-100 flex flex-col">
        
        {/* Navigation Links */}
        <div className="flex-1 px-[1vw] pb-[2vw] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {sidebarGroups.map((group, index) => (
            <div key={index} className="mb-[1vw]">
              
              {/* Group Title with Line */}
              <div className="flex items-center gap-[1vw] mb-[0.8vw] px-[0.5vw]">
                <h4 className="text-[0.95vw] font-semibold text-gray-700 whitespace-nowrap">
                  {group.title}
                </h4>
                <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}> </div>
              </div>

              <div className="flex flex-col gap-[0.2vw]">
                {group.items.map((item) => {
                  const isProfile = item.id === 'profile';
                  const isActive = isProfile 
                    ? location.pathname.startsWith('/settings/profile')
                    : location.pathname === `/settings/${item.path}` || location.pathname.startsWith(`/settings/${item.path}/`);

                  return (
                    <Link
                      key={item.id || item.path}
                      to={item.path}
                      className={`
                        flex items-center gap-[1vw] px-[0.75vw] py-[0.4vw] rounded-[0.5vw] text-[0.8125vw] font-semibold transition-colors
                        ${isActive 
                          ? 'bg-[#F2F2F2] text-gray-800' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                        }
                      `}
                    >
                      <Icon 
                        icon={item.icon} 
                        className={`w-[1vw] h-[1vw] flex-shrink-0 text-gray-700 ${item.icon.startsWith('gcp:') ? 'grayscale brightness-0 opacity-90' : ''}`} 
                        style={{ strokeWidth: '1.2px' }}
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Log Out Button */}
        <div className="p-[0.5vw] mb-[0.5vw]">
          <button 
            onClick={handleLogout}
            className="w-full relative overflow-hidden bg-transparent border-2 border-red-600 text-red-600 hover:bg-red-600 hover:border-red-600 hover:text-white active:scale-[0.98] rounded-[0.8vw] py-[0.65vw] flex items-center justify-center gap-[0.5vw] transition-all duration-200 cursor-pointer font-semibold text-[0.85vw] shadow-xs hover:shadow-md hover:shadow-red-500/20 group"
          >
            <Icon icon="lucide:log-out" className="w-[1.05vw] h-[1.05vw] transition-transform group-hover:-translate-x-0.5" />
            <span>Log Out</span>
          </button>
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
