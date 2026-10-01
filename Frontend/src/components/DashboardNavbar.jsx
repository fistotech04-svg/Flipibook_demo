import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import FlipibookLogo from '../assets/logo/Flipibook_logo.svg';
import { Bell } from 'lucide-react';
import ProfileModal from './ProfileModal';
import { resolveUploadsPath } from '../utils/supabaseUtils';

const defaultColors = [
  '#4c5add', '#2563eb', '#059669', '#d97706', '#dc2626', 
  '#7c3aed', '#db2777', '#0891b2', '#8a4419', '#597810'
];

const getAvatarColor = (identifier, customColor) => {
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

export default function DashboardNavbar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user_profile') || localStorage.getItem('user');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return null;
  });

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e?.detail) {
        setUser(e.detail);
        return;
      }
      try {
        const stored = localStorage.getItem('user_profile') || localStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));
      } catch (err) {}
    };

    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileUpdate', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdate', handleStorageChange);
    };
  }, [isProfileModalOpen]);

  const navLinks = [
    { name: 'Home', path: '/home' },
    { name: 'My Flipbooks', path: '/my-flipbooks' },
    { name: 'Templates', path: '/templates' },
    { name: 'Explore', path: '/explore' },
    { name: 'Features', path: '#' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact Us', path: '/contact' },
    { name: 'Help', path: '#' },
    // { name: 'Settings', path: '/settings' },
  ];

  return (
    <>
    <nav className="w-full bg-white px-[1.5vw] flex items-center justify-between z-50 border-b border-gray-200 shadow-sm" style={{ height: '8vh' }}>
      <div className="flex items-center gap-[4vw]">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link to="/home">
            <img src={FlipibookLogo} alt="Flipibook" className="h-[2.5vw] w-auto object-contain transition-transform duration-300" />
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="hidden lg:flex items-center gap-[2.5vw]">
          {navLinks.map((link) => {
            const currentPath = location.pathname;
            const isActive = currentPath === link.path || 
                             (link.name === 'Home' && currentPath === '/') ||
                             (link.path === '/contact' && currentPath === '/contact-us');
            
            const baseLinkStyle = "text-gray-500 hover:text-gray-900 font-medium text-[0.85vw] transition-colors relative pb-[0.25vw] after:absolute after:left-0 after:bottom-0 after:h-[0.15vw] after:w-0 hover:after:w-full after:bg-black after:transition-all after:duration-300 after:rounded-full";
            const activeLinkStyle = "text-[#ec5137] font-semibold text-[0.85vw] transition-colors relative pb-[0.25vw] after:absolute after:left-0 after:bottom-0 after:h-[0.15vw] after:w-full after:bg-[#ec5137] after:transition-all after:duration-300 after:rounded-full";

            return (
              <Link 
                  key={link.name} 
                  to={link.path} 
                  className={isActive ? activeLinkStyle : baseLinkStyle}
              >
                  {link.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-[1vw]">
         {/* Notification */}
         <button className="w-[2.5vw] h-[2.5vw] cursor-pointer flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all duration-200 group">
            <Bell size="1.2vw" className="text-gray-600 group-hover:text-gray-900 transition-colors" />
         </button>

         {/* Profile */}
         <button 
           onClick={() => setIsProfileModalOpen(true)}
           className="w-[2.5vw] h-[2.5vw] cursor-pointer flex items-center justify-center rounded-full border border-gray-200 transition-all duration-200 overflow-hidden group p-[0.1vw] shadow-sm"
           style={{ backgroundColor: (user?.picture && user?.picture !== 'color_only') ? '#ffffff' : ((user?.avatarBgColor && user?.avatarBgColor !== '#E8D4C8' && user?.avatarBgColor !== '#ffffff') ? user?.avatarBgColor : getAvatarColor(user?.name || user?.emailId || user?.email || 'User')) }}
         >
             {user?.picture && user?.picture !== 'color_only' ? (
                <img 
                  src={user.picture.startsWith('blob:') || user.picture.startsWith('data:') ? user.picture : resolveUploadsPath(user.picture)} 
                  alt={user.name || 'User'} 
                  className="w-full h-full object-cover rounded-full" 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
             ) : (
               <div
                 className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-[0.9vw]"
                 style={{ backgroundColor: (user?.avatarBgColor && user?.avatarBgColor !== '#E8D4C8' && user?.avatarBgColor !== '#ffffff') ? user.avatarBgColor : getAvatarColor(user?.name || user?.emailId || user?.email || 'User') }}
               >
                 {user?.name ? user.name.charAt(0).toUpperCase() : (user?.emailId || user?.email ? (user.emailId || user.email).charAt(0).toUpperCase() : 'U')}
               </div>
             )}
         </button>
      </div>
    </nav>
    <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </>
  );
}
