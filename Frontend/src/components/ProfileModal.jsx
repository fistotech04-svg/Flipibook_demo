import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Save, BookOpen, Library, Settings, ChevronRight, ArrowRight } from 'lucide-react';
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

export default function ProfileModal({ isOpen, onClose, isAutoSaveEnabled, onToggleAutoSave }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user_profile') || localStorage.getItem('user');
      if (stored) {
        const p = JSON.parse(stored);
        const email = p.emailId || p.email || '';
        return {
          name: p.name || (email ? email.split('@')[0] : 'User'),
          email: email || 'No Email',
          picture: p.picture || null,
          avatarBgColor: p.avatarBgColor || '#E8D4C8'
        };
      }
    } catch (e) {}
    return { name: 'User', email: '', picture: null, avatarBgColor: '#E8D4C8' };
  });
  const [storage, setStorage] = useState({ used: 0, total: 300 * 1024 * 1024 });
  const [isLoadingStorage, setIsLoadingStorage] = useState(false);
  const [autoSave, setAutoSave] = useState(() => {
    const saved = localStorage.getItem('isAutoSaveEnabled');
    return saved !== null ? JSON.parse(saved) : (isAutoSaveEnabled !== undefined ? isAutoSaveEnabled : true);
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (isAutoSaveEnabled !== undefined) {
      setAutoSave(isAutoSaveEnabled);
    }
  }, [isAutoSaveEnabled]);

  const handleToggleAutoSave = () => {
    const nextState = !autoSave;
    setAutoSave(nextState);
    localStorage.setItem('isAutoSaveEnabled', JSON.stringify(nextState));
    if (onToggleAutoSave) {
      onToggleAutoSave(nextState);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    let targetEmail = '';
    const storedUser = localStorage.getItem('user_profile') || localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        targetEmail = parsedUser.emailId || parsedUser.email || '';
        setUser({
          name: parsedUser.name || (targetEmail ? targetEmail.split('@')[0] : 'User'),
          email: targetEmail || 'No Email',
          picture: parsedUser.picture || null,
          avatarBgColor: parsedUser.avatarBgColor || '#E8D4C8'
        });
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }

    const backendUrl = import.meta.env.VITE_BACKEND_URL || '';

    // Fetch latest profile info (name, picture, avatarBgColor)
    const fetchLatestProfile = async (emailToFetch) => {
      if (!emailToFetch || emailToFetch === 'No Email' || emailToFetch === 'guest@example.com') return;
      try {
        const res = await fetch(`${backendUrl}/api/profile?emailId=${encodeURIComponent(emailToFetch)}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.success && data?.profile) {
            const p = data.profile;
            setUser({
              name: p.name || (emailToFetch ? emailToFetch.split('@')[0] : 'User'),
              email: p.emailId || emailToFetch,
              picture: p.picture || null,
              avatarBgColor: p.avatarBgColor || '#E8D4C8'
            });
            try {
              localStorage.setItem('user_profile', JSON.stringify(p));
            } catch (e) {}
          }
        }
      } catch (err) {
        console.error("Error fetching live profile in ProfileModal:", err);
      }
    };

    const fetchLiveStorageSettings = async (emailToFetch) => {
      if (!emailToFetch || emailToFetch === 'No Email' || emailToFetch === 'guest@example.com') return;

      setIsLoadingStorage(true);
      try {
        const response = await fetch(`${backendUrl}/api/usersetting/get-settings?emailId=${encodeURIComponent(emailToFetch)}`);
        if (response.ok) {
          const data = await response.json();
          if (data) {
            setStorage({
              used: typeof data.usedStorage === 'number' ? data.usedStorage : 0,
              total: typeof data.maxStorage === 'number' ? data.maxStorage : 300 * 1024 * 1024
            });
            if (data.isAutoSaveEnabled !== undefined) {
              setAutoSave(data.isAutoSaveEnabled);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching live storage settings:", error);
      } finally {
        setIsLoadingStorage(false);
      }
    };

    if (targetEmail) {
      fetchLatestProfile(targetEmail);
      fetchLiveStorageSettings(targetEmail);
    }
  }, [isOpen]);

  const formatMB = (bytes) => {
    if (!bytes || bytes <= 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 0.1) return '0.1 MB';
    if (mb < 100) return `${parseFloat(mb.toFixed(1))} MB`;
    return `${Math.round(mb)} MB`;
  };

  const usedFormatted = formatMB(storage.used);
  const totalFormatted = `${Math.round(storage.total / (1024 * 1024))}MB`;
  const percentage = storage.total > 0 ? Math.min(100, Math.round((storage.used / storage.total) * 100)) : 0;

  if (!isOpen) return null;

  return (
    <>
      {/* Light Dark Backdrop without blur */}
      <div className="fixed inset-0 z-[150] cursor-default bg-black/15" onClick={onClose}></div>

      {/* Popup Modal Card */}
      <div className="fixed top-[4.5vw] right-[2vw] z-[160] w-[21vw] min-w-[290px] max-w-[350px] bg-white rounded-[1.25vw] shadow-2xl border border-gray-100 overflow-hidden p-[1.25vw] animate-in fade-in zoom-in-95 duration-150 select-none">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-[1vw]">
          <div className="flex items-center flex-1 mr-[0.75vw]">
            <h2 className="text-[1.25vw] font-bold text-gray-900 tracking-tight pr-[0.5vw]">Profile</h2>
            <div className="flex-1 h-[1px] bg-gray-200 mt-[0.1vw]"></div>
          </div>
          {/* Red Close Button */}
          <button
            onClick={onClose}
            className="text-red-500 border border-red-300 hover:bg-red-50 transition-colors p-[0.25vw] rounded-[0.4vw] cursor-pointer flex items-center justify-center"
          >
            <X size="1.0vw" strokeWidth={2} />
          </button>
        </div>

        {/* User Info Card with Free Ribbon */}
        <div 
          onClick={() => { 
            navigate(user?.email && user?.email !== 'No Email' ? `/settings/profile/${encodeURIComponent(user.email)}` : '/settings/profile'); 
            onClose(); 
          }}
          className="relative border border-gray-100 rounded-[0.8vw] p-[0.85vw] shadow-sm bg-white flex items-center gap-[0.85vw] mb-[1vw] cursor-pointer hover:bg-gray-50/80 hover:border-gray-200 hover:shadow transition-all group"
        >
          {/* Free Badge Ribbon */}
          <div className="absolute top-0 right-0 bg-[#0066ff] text-white text-[0.62vw] font-bold px-[0.75vw] py-[0.2vw] rounded-bl-[0.4vw] rounded-tr-[0.8vw] shadow-sm">
            Free
          </div>

          {/* Avatar */}
          <div
            className="w-[3.2vw] h-[3.2vw] rounded-full overflow-hidden border border-gray-200 shadow-sm flex-shrink-0 flex items-center justify-center transition-colors group-hover:border-indigo-300"
            style={{ backgroundColor: (user.picture && user.picture !== 'color_only') ? '#ffffff' : ((user.avatarBgColor && user.avatarBgColor !== '#E8D4C8' && user.avatarBgColor !== '#ffffff') ? user.avatarBgColor : getAvatarColor(user.name || user.email || 'User')) }}
          >
            {user.picture && user.picture !== 'color_only' ? (
              <img 
                src={user.picture.startsWith('blob:') || user.picture.startsWith('data:') ? user.picture : resolveUploadsPath(user.picture)} 
                alt={user.name} 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <span className="text-[1.2vw] font-bold text-white drop-shadow-sm">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </span>
            )}
          </div>

          {/* User Details */}
          <div className="flex flex-col min-w-0 pr-[2vw]">
            <h3 className="text-[0.95vw] font-bold text-gray-900 truncate leading-tight">{user.name}</h3>
            <p className="text-[0.65vw] text-gray-500 font-normal truncate mt-[0.1vw]">{user.email}</p>
            <span className="text-[0.65vw] text-gray-400 font-normal mt-[0.1vw]">Free Plan</span>
          </div>
        </div>


        {/* Storage Progress Section */}
        <div className="mb-[1vw] px-[0.1vw]">
          <div className="flex justify-between items-center mb-[0.3vw]">
            <span className="text-[0.8vw] font-bold text-gray-900">Storage</span>
            <span className="text-[0.65vw] text-gray-500 font-medium">
              {isLoadingStorage ? 'Calculating...' : `${usedFormatted} / ${totalFormatted}`}
            </span>
          </div>
          <div className="w-full h-[0.35vw] bg-gray-100 rounded-full overflow-hidden mb-[0.25vw]">
            <div
              className="h-full bg-[#4c5add] transition-all duration-500 ease-out rounded-full"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <span className="text-[0.6vw] text-gray-400 font-normal">{percentage}% used</span>
        </div>

        {/* Navigation Options */}
        <div className="border-t border-b border-gray-100 divide-y divide-gray-100 mb-[1vw]">
          {/* My Flipbooks */}
          <div
            onClick={() => { navigate('/my-flipbooks'); onClose(); }}
            className="flex items-center justify-between py-[0.65vw] px-[0.25vw] hover:bg-gray-50 rounded-[0.4vw] cursor-pointer transition-colors group"
          >
            <div className="flex items-center gap-[0.75vw]">
              <div className="w-[2vw] h-[2vw] rounded-[0.4vw] bg-[#eef0fe] text-[#4c5add] flex items-center justify-center">
                <BookOpen size="0.95vw" />
              </div>
              <span className="text-[0.78vw] font-semibold text-gray-800 group-hover:text-[#4c5add] transition-colors">
                My Flipbooks
              </span>
            </div>
            <ChevronRight size="0.85vw" className="text-gray-400 group-hover:text-[#4c5add] transition-colors" />
          </div>

          {/* Go to Shelf */}
          <div
            onClick={() => { navigate('/settings/my-shelf'); onClose(); }}
            className="flex items-center justify-between py-[0.65vw] px-[0.25vw] hover:bg-gray-50 rounded-[0.4vw] cursor-pointer transition-colors group"
          >
            <div className="flex items-center gap-[0.75vw]">
              <div className="w-[2vw] h-[2vw] rounded-[0.4vw] bg-rose-50 text-rose-500 flex items-center justify-center">
                <Library size="0.95vw" />
              </div>
              <span className="text-[0.78vw] font-semibold text-gray-800 group-hover:text-rose-500 transition-colors">
                Go to Shelf
              </span>
            </div>
            <ChevronRight size="0.85vw" className="text-gray-400 group-hover:text-rose-500 transition-colors" />
          </div>

          {/* Settings */}
          <div
            onClick={() => { 
              navigate(user?.email && user?.email !== 'No Email' ? `/settings/profile/${encodeURIComponent(user.email)}` : '/settings/profile'); 
              onClose(); 
            }}
            className="flex items-center justify-between py-[0.65vw] px-[0.25vw] hover:bg-gray-50 rounded-[0.4vw] cursor-pointer transition-colors group"
          >
            <div className="flex items-center gap-[0.75vw]">
              <div className="w-[2vw] h-[2vw] rounded-[0.4vw] bg-gray-100 text-gray-700 flex items-center justify-center">
                <Settings size="0.95vw" />
              </div>
              <span className="text-[0.78vw] font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
                Settings
              </span>
            </div>
            <ChevronRight size="0.85vw" className="text-gray-400 group-hover:text-gray-900 transition-colors" />
          </div>
        </div>

        {/* Upgrade Profile Button */}
        <button 
          onClick={() => { navigate('/settings/billing'); onClose(); }}
          className="w-full bg-[#18181b] hover:bg-black text-white py-[0.65vw] px-[1vw] rounded-[0.75vw] text-[0.8vw] font-bold flex items-center justify-center gap-[0.4vw] shadow-md transition-all cursor-pointer"
        >
          Upgrade Profile <ArrowRight size="0.9vw" />
        </button>
      </div>
    </>
  );
}
