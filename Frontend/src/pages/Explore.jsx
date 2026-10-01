import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import exploreHeroImg from '../assets/Explore/explore-hero-section.png';
import cover1 from '../assets/Explore/c-bg1.png';
import cover2 from '../assets/Explore/c-bg2.png';
import cover3 from '../assets/Explore/c-bg3.png';
import cover4 from '../assets/Explore/c-bg4.png';
import cover5 from '../assets/Explore/c-bg5.png';
import p1 from '../assets/Explore/p1.png';
import p2 from '../assets/Explore/p2.png';
import p3 from '../assets/Explore/p3.png';
import p4 from '../assets/Explore/p4.png';
import p5 from '../assets/Explore/p5.png';
import Footer from './Footer';
import ShareModal from '../components/ShareModal';
import ExportModal from '../components/ExportModal';
import CreatorProfileModal from './CreatorProfileModal';
import { useToast } from '../components/CustomToast';

const covers = [cover1, cover2, cover3, cover4, cover5];
const profiles = [p1, p2, p3, p4, p5];

const defaultColors = [
    '#4c5add', '#2563eb', '#059669', '#d97706', '#dc2626',
    '#7c3aed', '#db2777', '#0891b2', '#8a4419', '#597810'
];

const defaultGradients = [
    'linear-gradient(to bottom right, #059669, #a7f3d0)',
    'linear-gradient(to bottom right, #d97706, #fde68a)',
    'linear-gradient(to bottom right, #2563eb, #bfdbfe)',
    'linear-gradient(to bottom right, #dc2626, #fecaca)',
    'linear-gradient(to bottom right, #0d9488, #99f6e4)'
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

const CustomDropdown = ({ options, value, onChange, className, buttonClassName, renderButton }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {renderButton ? (
                renderButton(value, isOpen, setIsOpen)
            ) : (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center justify-between w-full border-[1.5px] border-gray-300 rounded-[0.5vw] px-[1vw] py-[0.6vh] text-[0.9vw] text-gray-500 bg-white hover:bg-gray-50 transition-colors focus:outline-none ${buttonClassName}`}
                >
                    <span className="font-normal pr-[2vw]">{value}</span>
                    <svg className={`w-[0.9vw] h-[0.9vw] text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
            )}

            {isOpen && (
                <div className="absolute top-full left-0 mt-[0.5vh] w-full bg-white rounded-[0.5vw] shadow-[0_4px_15px_rgba(0,0,0,0.1)] py-[1vh] z-50 border border-gray-100">
                    {options.map((opt, idx) => (
                        <div
                            key={idx}
                            onClick={() => { onChange(opt); setIsOpen(false); }}
                            className="px-[1.2vw] py-[0.8vh] text-[0.9vw] text-[#4a5568] hover:bg-gray-50 hover:text-black cursor-pointer transition-colors"
                        >
                            {opt}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const FlipbookCard = ({ v_id, shareId, access, rawBook, coverImg, profileImg, authorPicture, authorBgColor, bookName, authorName, location, pages, views, rating, description, onShare, onDownload, onProfileClick, onAddToShelf, isAddedToShelf }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const handleOpenBook = () => {
        const targetShareId = shareId || v_id;
        const rawAcc = String(access).toLowerCase();
        if (targetShareId) {
            window.open(`/share=${rawAcc}/${targetShareId}`, '_blank');
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const displayAvatar = (authorPicture && authorPicture !== 'color_only') ? authorPicture : null;
    const avatarColor = getAvatarColor(authorName || rawBook?.userEmail, authorBgColor);

    const isShareEnabled = (book) => {
        if (!book) return true;
        const target = book.rawBook || book;
        const cs = target.Customized_Settings || target.settings || {};
        if (cs.MenuBar?.shareExport?.share !== undefined) return Boolean(cs.MenuBar.shareExport.share);
        if (cs.shareExport?.share !== undefined) return Boolean(cs.shareExport.share);
        if (cs.Other_Setup?.shareExport?.share !== undefined) return Boolean(cs.Other_Setup.shareExport.share);
        if (cs.ShareExport?.share !== undefined) return Boolean(cs.ShareExport.share);
        if (target.shareExport?.share !== undefined) return Boolean(target.shareExport.share);
        return true;
    };

    const isDownloadEnabled = (book) => {
        if (!book) return true;
        const target = book.rawBook || book;
        const cs = target.Customized_Settings || target.settings || {};
        if (cs.MenuBar?.shareExport?.download !== undefined) return Boolean(cs.MenuBar.shareExport.download);
        if (cs.shareExport?.download !== undefined) return Boolean(cs.shareExport.download);
        if (cs.Other_Setup?.shareExport?.download !== undefined) return Boolean(cs.Other_Setup.shareExport.download);
        if (cs.ShareExport?.download !== undefined) return Boolean(cs.ShareExport.download);
        if (target.shareExport?.download !== undefined) return Boolean(target.shareExport.download);
        return true;
    };

    const canShare = isShareEnabled(rawBook);
    const canDownload = isDownloadEnabled(rawBook);

    const menuItems = [
        { name: 'View Book', icon: <svg className="w-[1vw] h-[1vw]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg> },
        { name: 'Creator Profile', icon: <Icon icon="solar:user-bold" className="w-[1vw] h-[1vw]" /> },
        { name: isAddedToShelf ? 'Book Added' : 'Add to Shelf', icon: isAddedToShelf ? <Icon icon="lucide:check" className="w-[1vw] h-[1vw] text-green-500" /> : <Icon icon="ri:book-shelf-line" className="w-[1vw] h-[1vw]" /> },
        ...(canShare ? [{ name: 'Share', icon: <svg className="w-[1vw] h-[1vw]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg> }] : []),
        ...(canDownload ? [{ name: 'Download', icon: <svg className="w-[1vw] h-[1vw]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg> }] : []),
        { name: 'Report', icon: <svg className="w-[1vw] h-[1vw]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> }
    ];

    return (
        <div className="bg-white border border-gray-100 rounded-[0.8vw] overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-300 shadow-[0_2px_10px_rgba(0,0,0,0.06)] relative group">
            {/* Thumbnail Container */}
            <div className="relative w-full aspect-[4/4] flex items-center justify-center">
                <img src={coverImg} alt="Flipbook Cover" className="w-full h-full object-cover" />

                {/* Menu Button */}
                <div className={`absolute top-[0.8vw] right-[0.8vw] transition-opacity duration-200 ${isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="bg-white/80 backdrop-blur-sm p-[0.1vw] rounded-[0.3vw] hover:bg-white text-gray-800 focus:outline-none transition-colors shadow-sm"
                    >
                        <svg className="w-[1.2vw] h-[1.2vw]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                        <div className="absolute top-[110%] right-0 w-[9.5vw] bg-white rounded-[0.6vw] shadow-[0_8px_30px_rgb(0,0,0,0.12)] py-[1.2vh] z-20 border border-gray-100">
                            {menuItems.map((menuItem, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        if (menuItem.name === 'View Book') {
                                            handleOpenBook();
                                        } else if (menuItem.name === 'Creator Profile') {
                                            if (onProfileClick) onProfileClick({ name: authorName, profileImg: displayAvatar, picture: displayAvatar, role: 'Creator', email: rawBook?.userEmail, emailId: rawBook?.userEmail, avatarBgColor: authorBgColor, location });
                                        } else if (menuItem.name === 'Share') {
                                            if (onShare) onShare(rawBook);
                                        } else if (menuItem.name === 'Download') {
                                            if (onDownload) onDownload(rawBook);
                                        } else if (menuItem.name === 'Add to Shelf' || menuItem.name === 'Book Added') {
                                            if (onAddToShelf) onAddToShelf(rawBook);
                                        }
                                    }}
                                    className="w-[8.8vw] flex items-center mx-[0.5vw] gap-[0.8vw] px-[0.8vw] py-[0.8vh] transition-colors text-left rounded-md text-gray-600 hover:text-black hover:bg-gray-50"
                                >
                                    <span className="transition-colors flex items-center justify-center">{menuItem.icon}</span>
                                    <span className="text-[0.75vw] font-medium transition-colors">{menuItem.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Card Details */}
            <div className="p-[1.2vw] flex flex-col flex-1 bg-white">
                {/* Author Info */}
                <div className="flex items-center gap-[0.6vw]">
                    {displayAvatar ? (
                        <img
                            src={displayAvatar}
                            alt={authorName}
                            className="w-[2.5vw] h-[2.5vw] rounded-full border border-gray-200 object-cover cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                            onClick={() => onProfileClick && onProfileClick({ name: authorName, profileImg: displayAvatar, picture: displayAvatar, role: 'Creator', email: rawBook?.userEmail, emailId: rawBook?.userEmail, avatarBgColor: authorBgColor, location })}
                        />
                    ) : (
                        <div
                            className="w-[2.5vw] h-[2.5vw] rounded-full flex items-center justify-center text-white text-[1.1vw] font-bold shrink-0 cursor-pointer hover:opacity-80 transition-opacity shadow-inner"
                            style={{ backgroundColor: avatarColor }}
                            onClick={() => onProfileClick && onProfileClick({ name: authorName, profileImg: null, picture: null, role: 'Creator', email: rawBook?.userEmail, emailId: rawBook?.userEmail, avatarBgColor: authorBgColor, location })}
                        >
                            {authorName ? authorName.charAt(0).toUpperCase() : 'U'}
                        </div>
                    )}
                    <div
                        className="flex flex-col min-w-0 pr-[0.5vw] cursor-pointer"
                        onClick={() => onProfileClick && onProfileClick({ name: authorName, profileImg: displayAvatar, picture: displayAvatar, role: 'Creator', email: rawBook?.userEmail, emailId: rawBook?.userEmail, avatarBgColor: authorBgColor, location })}
                    >
                        <span className="text-[0.85vw] font-semibold text-gray-900 leading-tight truncate hover:text-indigo-600 transition-colors">{authorName || 'Alex Johnson'}</span>
                        <span className="flex items-center gap-[0.2vw] text-[0.7vw] text-gray-400 mt-[0.2vh] truncate">
                            <Icon icon="lucide:map-pin" className="w-[0.75vw] h-[0.75vw] text-gray-400 shrink-0" />
                            <span className="truncate">{location ? String(location).replace(/📍/g, '').trim() : 'Coimbatore'}</span>
                        </span>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-[0.3vw] justify-start text-[0.75vw] text-gray-700 font-medium mt-[1.5vh] whitespace-nowrap">
                    <div className="flex items-center gap-[0.3vw]">
                        <span className="text-black font-semibold">{pages || 12}</span>
                        <span className="font-normal text-gray-500">Pages</span>
                    </div>
                    <span className="text-gray-200">|</span>
                    <span className="flex items-center gap-[0.3vw]">
                        <svg className="w-[0.9vw] text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        {views || '12.5k'}
                    </span>
                    <span className="text-gray-200">|</span>
                    <span className="flex items-center gap-[0.3vw]">
                        <svg className="w-[0.9vw] text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 1L12.7 6.5L19 7.4L14.5 11.8L15.6 18.1L10 15.2L4.4 18.1L5.5 11.8L1 7.4L7.3 6.5Z"></path></svg>
                        {rating || 4.5}
                    </span>
                </div>

                {/* Title & Desc & Button */}
                <div className="relative flex-1 mt-[1.2vh]">
                    <div className="relative group/tt block max-w-full">
                        <h4 className="text-[0.9vw] font-semibold text-black truncate tracking-tight pr-[2.2vw] cursor-default">
                            {bookName || 'Name of the Flipbook'}
                        </h4>
                        {/* Hover Tooltip (TopToolbar style) */}
                        <div className="absolute left-0 bottom-full mb-[0.35vw] hidden group-hover/tt:flex flex-col items-start pointer-events-none z-50 whitespace-nowrap max-w-[18vw]">
                            <div className="bg-gray-900 text-white text-[0.65vw] font-medium px-[0.5vw] py-[0.25vw] rounded-[0.3vw] shadow-lg truncate max-w-full">
                                {bookName || 'Name of the Flipbook'}
                            </div>
                            <div className="w-0 h-0 ml-[0.8vw] -mt-[0.2px] border-x-[0.3vw] border-x-transparent border-t-[0.3vw] border-t-gray-900" />
                        </div>
                    </div>
                    <p className="text-[0.7vw] text-gray-500 leading-relaxed mt-[0.5vh] pr-[2.2vw] line-clamp-2">
                        {description || '“Bring your content to life with a real, interactive experience”'}
                    </p>

                    {/* Action Button */}
                    <button
                        onClick={handleOpenBook}
                        className="absolute bottom-[0.5vw] right-[-0.5vw] bg-black text-white w-[2vw] h-[2vw] rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors shadow-md cursor-pointer"
                    >
                        <svg className="w-[1.5vw] h-[1.5vw]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 7l-10 10M17 7H8M17 7v9"></path></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

const FlipbookCardSkeleton = () => {
    return (
        <div className="bg-white border border-gray-100 rounded-[0.8vw] overflow-hidden flex flex-col shadow-[0_2px_10px_rgba(0,0,0,0.06)] relative animate-pulse">
            <div className="relative w-full aspect-[4/4] bg-gray-200"></div>
            <div className="p-[1.2vw] flex flex-col flex-1 bg-white">
                <div className="flex items-center gap-[0.6vw]">
                    <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-gray-200 shrink-0"></div>
                    <div className="flex flex-col gap-[0.3vh]">
                        <div className="h-[0.85vw] bg-gray-200 rounded w-[6vw]"></div>
                        <div className="h-[0.7vw] bg-gray-100 rounded w-[4vw]"></div>
                    </div>
                </div>
                <div className="flex items-center gap-[0.3vw] justify-start text-[0.75vw] mt-[1.5vh]">
                    <div className="h-[0.75vw] bg-gray-200 rounded w-[3.5vw]"></div>
                    <span className="text-gray-200">|</span>
                    <div className="h-[0.75vw] bg-gray-200 rounded w-[3vw]"></div>
                    <span className="text-gray-200">|</span>
                    <div className="h-[0.75vw] bg-gray-200 rounded w-[2.5vw]"></div>
                </div>
                <div className="relative flex-1 mt-[1.2vh] min-h-[4vw]">
                    <div className="h-[0.9vw] bg-gray-200 rounded w-[9vw]"></div>
                    <div className="h-[0.7vw] bg-gray-100 rounded w-[11vw] mt-[0.5vh]"></div>
                    <div className="absolute bottom-[0.5vw] right-[-0.5vw] bg-gray-200 w-[2vw] h-[2vw] rounded-full"></div>
                </div>
            </div>
        </div>
    );
};

const Explore = () => {
    const [exploreMode, setExploreMode] = useState('books'); // 'books' | 'creators'

    const [booksData, setBooksData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const toast = useToast();
    const [shelfBookIds, setShelfBookIds] = useState([]);

    const currentUserEmail = React.useMemo(() => {
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const u = JSON.parse(storedUser);
                if (u?.emailId || u?.email) return (u.emailId || u.email).toLowerCase();
            }
            const storedProfile = localStorage.getItem('user_profile');
            if (storedProfile) {
                const p = JSON.parse(storedProfile);
                if (p?.emailId || p?.email) return (p.emailId || p.email).toLowerCase();
            }
        } catch (e) { }
        return '';
    }, []);

    const [topCreators, setTopCreators] = useState([]);
    const [isCreatorsLoading, setIsCreatorsLoading] = useState(true);
    const [followingLoadingMap, setFollowingLoadingMap] = useState({});

    useEffect(() => {
        if (!currentUserEmail) return;
        const fetchShelfBooks = async () => {
            try {
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                const res = await axios.get(`${backendUrl}/api/profile/my-shelf-books?emailId=${encodeURIComponent(currentUserEmail)}`);
                if (res.data && res.data.books) {
                    setShelfBookIds(res.data.books.map(b => b.v_id));
                }
            } catch (err) {
                console.error("Error fetching shelf books:", err);
            }
        };
        fetchShelfBooks();
    }, [currentUserEmail]);

    const handleToggleFollow = async (targetEmail) => {
        if (!currentUserEmail) {
            toast.error("Please log in to follow creators.");
            return;
        }
        if (!targetEmail) return;

        const normTarget = targetEmail.trim().toLowerCase();
        if (normTarget === currentUserEmail) return;

        const prevCreators = [...topCreators];
        const targetCreator = topCreators.find(c => (c.emailId || c.email)?.toLowerCase() === normTarget);
        const wasFollowing = targetCreator?.isFollowing || false;

        setTopCreators(prev => prev.map(c => {
            if ((c.emailId || c.email)?.toLowerCase() === normTarget) {
                const newCount = wasFollowing ? Math.max(0, (c.followersCount || 1) - 1) : (c.followersCount || 0) + 1;
                return {
                    ...c,
                    isFollowing: !wasFollowing,
                    followersCount: newCount
                };
            }
            return c;
        }));

        setFollowingLoadingMap(prev => ({ ...prev, [normTarget]: true }));

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            const res = await axios.post(`${backendUrl}/api/explore/toggle-follow`, {
                currentEmail: currentUserEmail,
                targetEmail: normTarget
            });

            if (res.data?.success) {
                setTopCreators(prev => prev.map(c => {
                    if ((c.emailId || c.email)?.toLowerCase() === normTarget) {
                        return {
                            ...c,
                            isFollowing: res.data.isFollowing,
                            followersCount: res.data.followersCount,
                            followers: res.data.followers
                        };
                    }
                    return c;
                }));
            } else {
                setTopCreators(prevCreators);
            }
        } catch (err) {
            console.error("Error toggling follow status:", err);
            setTopCreators(prevCreators);
        } finally {
            setFollowingLoadingMap(prev => ({ ...prev, [normTarget]: false }));
        }
    };

    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [selectedBookForModal, setSelectedBookForModal] = useState(null);

    const navigate = useNavigate();
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [selectedCreator, setSelectedCreator] = useState(null);

    const handleProfileClick = (creator) => {
        const creatorEmail = creator?.emailId || creator?.email || creator?.userEmail || '';
        if (creatorEmail) {
            navigate(`/profile/${encodeURIComponent(creatorEmail)}`);
        } else {
            setSelectedCreator(creator);
            setIsProfileModalOpen(true);
        }
    };

    const handleOpenShareModal = (rawBook) => {
        setSelectedBookForModal(rawBook);
        setIsShareModalOpen(true);
    };

    const handleOpenExportModal = (rawBook) => {
        setSelectedBookForModal(rawBook);
        setIsExportModalOpen(true);
    };

    const handleAddToShelf = async (rawBook) => {
        if (!currentUserEmail) {
            toast.error("Please log in to add books to your shelf.");
            return;
        }
        const isAdded = shelfBookIds.includes(rawBook.v_id);
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        
        try {
            if (isAdded) {
                const res = await axios.post(`${backendUrl}/api/profile/remove-from-shelf`, {
                    emailId: currentUserEmail,
                    bookId: rawBook.v_id
                });
                if (res.data?.success) {
                    toast.success("Book removed from your shelf.");
                    setShelfBookIds(prev => prev.filter(id => id !== rawBook.v_id));
                } else {
                    toast.error(res.data?.message || "Failed to remove book from shelf");
                }
            } else {
                const res = await axios.post(`${backendUrl}/api/profile/add-to-shelf`, {
                    emailId: currentUserEmail,
                    bookId: rawBook.v_id,
                    folderName: 'My Flipbooks'
                });
                if (res.data?.success) {
                    toast.success("Book successfully added to your shelf!");
                    setShelfBookIds(prev => [...prev, rawBook.v_id]);
                } else {
                    toast.error(res.data?.message || "Failed to add book to shelf");
                    if (res.data?.message === 'Book is already on your shelf') {
                        setShelfBookIds(prev => [...prev, rawBook.v_id]);
                    }
                }
            }
        } catch (err) {
            console.error("Error managing shelf:", err);
            toast.error(err.response?.data?.message || "Error updating shelf");
        }
    };

    const [category, setCategory] = useState("All Category");
    const [sortBy, setSortBy] = useState("Most Popular");
    const [showMoreRatings, setShowMoreRatings] = useState(false);

    // Sidebar Filters State
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedRating, setSelectedRating] = useState(null);
    const [maxPages, setMaxPages] = useState(100);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

        const fetchPublishedBooks = async () => {
            try {
                setIsLoading(true);
                const response = await axios.get(`${backendUrl}/api/explore/published`);

                if (response.data && response.data.books) {
                    const formattedBooks = response.data.books.map(book => {
                        let rawOrient = (book.Customized_Settings?.FlipbookInfo?.orientation || '').toLowerCase();
                        if (!rawOrient) {
                            const w = book.Customized_Settings?.FlipbookInfo?.width;
                            const h = book.Customized_Settings?.FlipbookInfo?.height;
                            if (w && h) {
                                rawOrient = w > h ? 'landscape' : w < h ? 'portrait' : 'square';
                            } else {
                                rawOrient = 'portrait';
                            }
                        }

                        let typeName = 'Portrait';
                        if (rawOrient.includes('landscape')) typeName = 'Landscape';
                        else if (rawOrient.includes('square')) typeName = 'Square';
                        else if (rawOrient.includes('portrait')) typeName = 'Portrait';

                        const has3D = Boolean(
                            book.has3D || 
                            book.is3D || 
                            book.has3DModels || 
                            (book.Customized_Settings?.InteractionThreedModel && Object.keys(book.Customized_Settings.InteractionThreedModel).length > 0)
                        );

                        const vis = book.Customized_Settings?.Visibility || book.Visibility || {};
                        const shareId = vis.shareId || book.v_id;
                        const access = (vis.access || 'public').toLowerCase();

                        return {
                            rawBook: book,
                            v_id: book.v_id,
                            shareId: shareId,
                            access: access,
                            userEmail: book.userEmail,
                            bookName: book.flipbookName,
                            authorName: book.authorName || (book.userEmail ? book.userEmail.split('@')[0] : "Creator"),
                            location: book.city || book.location || "Coimbatore",
                            authorPicture: book.authorPicture || null,
                            authorBgColor: book.authorBgColor || '#E8D4C8',
                            pages: book.pages?.length || 12,
                            views: "12.5k",
                            rating: 4.5,
                            description: book.Customized_Settings?.FlipbookInfo?.quotes,
                            type: typeName,
                            has3D: has3D,
                            is3D: has3D,
                            category: book.Customized_Settings?.FlipbookInfo?.category
                        };
                    }).filter(book => book.access === 'public');

                    setBooksData(formattedBooks);
                }
            } catch (err) {
                console.error("Error fetching data from backend API:", err);
                setError("Failed to load flipbooks from server.");
            } finally {
                setIsLoading(false);
            }
        };

        const fetchTopCreators = async () => {
            try {
                setIsCreatorsLoading(true);
                const params = {};
                if (currentUserEmail) params.excludeEmail = currentUserEmail;

                const res = await axios.get(`${backendUrl}/api/explore/top-creators`, { params });
                if (res.data && res.data.creators) {
                    setTopCreators(res.data.creators);
                }
            } catch (err) {
                console.error("Error fetching top creators from backend API:", err);
            } finally {
                setIsCreatorsLoading(false);
            }
        };

        fetchPublishedBooks();
        fetchTopCreators();
    }, [currentUserEmail]);

    // Filter booksData based on all filters
    const filteredBooks = booksData.filter(book => {
        if (category !== "All Category" && book.category?.toLowerCase() !== category.toLowerCase()) return false;

        if (searchQuery && !book.bookName.toLowerCase().includes(searchQuery.toLowerCase()) && !book.authorName?.toLowerCase().includes(searchQuery.toLowerCase())) return false;

        if (selectedTypes.length > 0) {
            const isTypeMatched = selectedTypes.some(typeOpt => {
                if (typeOpt === "3D Added Flipbook") {
                    return book.has3D || book.is3D;
                }
                return book.type?.toLowerCase() === typeOpt.toLowerCase();
            });
            if (!isTypeMatched) return false;
        }

        if (selectedCategories.length > 0) {
            const isCatMatched = selectedCategories.some(catOpt =>
                book.category?.toLowerCase() === catOpt.toLowerCase()
            );
            if (!isCatMatched) return false;
        }

        if (selectedRating && book.rating < selectedRating) return false;

        if (book.pages > maxPages) return false;

        return true;
    });

    // Filter creators based on search
    const filteredCreators = topCreators.filter(creator => {
        if (currentUserEmail && (creator.emailId?.toLowerCase() === currentUserEmail || creator.email?.toLowerCase() === currentUserEmail)) {
            return false;
        }
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            return (
                (creator.name && creator.name.toLowerCase().includes(q)) ||
                (creator.email && creator.email.toLowerCase().includes(q)) ||
                (creator.emailId && creator.emailId.toLowerCase().includes(q)) ||
                (creator.city && creator.city.toLowerCase().includes(q)) ||
                (creator.industryType && creator.industryType.toLowerCase().includes(q)) ||
                (creator.about && creator.about.toLowerCase().includes(q))
            );
        }
        return true;
    });

    // Applied filter tags list
    const appliedFilterChips = React.useMemo(() => {
        const chips = [];

        selectedTypes.forEach(type => {
            chips.push({
                id: `type-${type}`,
                label: type,
                onRemove: () => setSelectedTypes(prev => prev.filter(t => t !== type))
            });
        });

        selectedCategories.forEach(cat => {
            chips.push({
                id: `cat-${cat}`,
                label: cat,
                onRemove: () => setSelectedCategories(prev => prev.filter(c => c !== cat))
            });
        });

        if (selectedRating !== null) {
            chips.push({
                id: 'rating',
                label: `${selectedRating} Star`,
                onRemove: () => setSelectedRating(null)
            });
        }

        if (searchQuery.trim()) {
            chips.push({
                id: 'search',
                label: `"${searchQuery}"`,
                onRemove: () => setSearchQuery("")
            });
        }

        if (category !== "All Category") {
            chips.push({
                id: 'top-cat',
                label: category,
                onRemove: () => setCategory("All Category")
            });
        }

        return chips;
    }, [selectedTypes, selectedCategories, selectedRating, searchQuery, category]);

    const handleClearAllFilters = () => {
        setSelectedTypes([]);
        setSelectedCategories([]);
        setSelectedRating(null);
        setSearchQuery("");
        setCategory("All Category");
        setMaxPages(100);
    };

    return (
        <div className="w-full bg-white font-sans pb-0">
            <style>{`
                input[type="range"].custom-range-slider { 
                    -webkit-appearance: none; 
                    width: 100%; 
                    background: transparent; 
                    position: relative; 
                    outline: none;
                }
                input[type="range"].custom-range-slider::before { 
                    content: ""; 
                    position: absolute; 
                    top: -0.75vw; 
                    bottom: -0.75vw; 
                    left: 0; 
                    right: 0; 
                    cursor: pointer; 
                    z-index: 1; 
                }
                input[type="range"].custom-range-slider::-webkit-slider-runnable-track { 
                    height: 0.3vw; 
                    border-radius: 0.15vw; 
                    background: inherit; 
                }
                input[type="range"].custom-range-slider::-webkit-slider-thumb { 
                    -webkit-appearance: none !important; 
                    height: 1vw !important; 
                    width: 1vw !important; 
                    border-radius: 50% !important; 
                    background: #4D47FF !important; 
                    border: 0.1vw solid #ffffff !important; 
                    box-shadow: 0 0.15vw 0.5vw rgba(77,71,255,0.4) !important; 
                    margin-top: -0.35vw !important; 
                    cursor: pointer !important; 
                    transition: box-shadow 0.15s ease !important; 
                    position: relative; 
                    z-index: 2; 
                }
                input[type="range"].custom-range-slider::-webkit-slider-thumb:hover { 
                    box-shadow: 0 0.15vw 0.75vw rgba(77,71,255,0.6) !important; 
                }
            `}</style>

            {/* Top Hero Section Banner */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full bg-[#f5f5f5] border-b border-gray-100 px-[5vw]"
            >
                <div className="max-w-[85vw] mx-auto flex flex-col md:flex-row items-center justify-between gap-[3vw]">
                    {/* Left Text Block */}
                    <div className="max-w-[44vw] space-y-[1.8vh]">
                        <h1 className="text-[3.2vw] text-gray-900 font-normal tracking-tight leading-tight">
                            Explore IDC
                        </h1>

                        <p className="text-[0.9vw] text-gray-600 font-normal leading-relaxed">
                            Discover immersive digital catalogues created by businesses, designers, and creators worldwide. Explore interactive flipbooks enhanced with 3D models, hotspots, videos, animations, and rich multimedia experiences.
                        </p>

                        <div className="w-[7vw] h-[0.3vh] min-h-[2px] bg-gray-800 rounded-full mt-[1.8vh]"></div>
                    </div>

                    {/* Right Hero Graphic */}
                    <div className="relative flex justify-center md:justify-end self-end">
                        <img
                            src={exploreHeroImg}
                            alt="Explore IDC Hero Graphic"
                            className="h-[35vh] max-h-[400px] w-auto object-contain object-bottom shrink-0 block"
                        />
                    </div>
                </div>
            </motion.div>

            {/* Main Content Section */}
            <div className="w-full px-[2vw] md:px-[2vw] py-[4vh] space-y-[4vh]">

                {/* Top Control Bar */}
                <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md py-[1.5vh] px-[2vw] -mx-[2vw] flex flex-col md:flex-row justify-between items-center gap-[2vw] border-b border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all">
                    
                    {/* Left: Explore by Toggle */}
                    <div className="flex items-center gap-[1.2vw]">
                        <h2 className="text-[1.8vw] font-medium text-gray-900 tracking-tight">Explore by :</h2>
                        
                        {/* Books / Creators Switch Pills */}
                        <div className="flex items-center bg-[#f3f4f6] p-[0.25vw] rounded-[0.5vw] border border-gray-200">
                            <button
                                onClick={() => setExploreMode('books')}
                                className={`px-[1.2vw] py-[0.5vh] rounded-[0.35vw] text-[0.85vw] font-semibold transition-all duration-200 cursor-pointer ${
                                    exploreMode === 'books'
                                        ? 'bg-black text-white shadow-sm'
                                        : 'text-gray-500 hover:text-black'
                                }`}
                            >
                                Books
                            </button>
                            <button
                                onClick={() => setExploreMode('creators')}
                                className={`px-[1.2vw] py-[0.5vh] rounded-[0.35vw] text-[0.85vw] font-semibold transition-all duration-200 cursor-pointer ${
                                    exploreMode === 'creators'
                                        ? 'bg-black text-white shadow-sm'
                                        : 'text-gray-500 hover:text-black'
                                }`}
                            >
                                Creators
                            </button>
                        </div>

                        {exploreMode === 'books' && (
                            <CustomDropdown
                                options={['All Category', 'Brochure', 'Catalog', 'Magazine', 'Portfolio', 'Storybook', 'Photography Book', 'Product Catalog']}
                                value={category}
                                onChange={setCategory}
                                className="min-w-[12vw]"
                            />
                        )}
                    </div>

                    {/* Right: Search Bar & Sort By */}
                    <div className="flex items-center gap-[1.5vw] w-full md:w-auto">
                        <div className="relative flex items-center w-full md:w-[22vw]">
                            <svg className="w-[1vw] h-[1vw] text-gray-400 absolute left-[1vw]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            <input
                                type="text"
                                placeholder={exploreMode === 'books' ? "Search Flipbook..." : "Search Creator..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full border-[1.5px] border-gray-300 rounded-[0.5vw] pl-[2.8vw] pr-[1vw] py-[0.6vh] text-[0.9vw] text-gray-700 outline-none focus:border-gray-400 placeholder-gray-400 transition-all"
                            />
                        </div>

                        <div className="flex items-center justify-between border-[1.5px] border-gray-300 rounded-[0.5vw] p-[0.3vw] pl-[1vw] bg-white">
                            <div className="flex items-center gap-[0.5vw] text-gray-600 text-[0.9vw]">
                                <svg className="w-[1vw] h-[1vw]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path></svg>
                                <span className="font-medium whitespace-nowrap">Sort by : </span>
                            </div>

                            <CustomDropdown
                                options={['Most Popular', 'Newest']}
                                value={sortBy}
                                onChange={setSortBy}
                                className="ml-[0.5vw] w-[8.5vw]"
                                renderButton={(val, isOpen, setIsOpen) => (
                                    <button
                                        onClick={() => setIsOpen(!isOpen)}
                                        className="flex items-center justify-between w-full gap-[0.8vw] bg-[#f3f4f6] rounded-[0.4vw] px-[0.8vw] py-[0.3vh] focus:outline-none cursor-pointer"
                                    >
                                        <span className="text-[0.85vw] text-gray-700 font-medium whitespace-nowrap text-left flex-1">{val}</span>
                                        <svg className={`w-[0.9vw] h-[0.9vw] text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </button>
                                )}
                            />
                        </div>
                    </div>
                </div>

                {/* Main Layout Grid */}
                <div className="flex flex-col md:flex-row gap-[2vw] items-start">

                    {/* Left Sidebar Filter */}
                    <div className="w-full md:w-[16vw] flex-shrink-0 space-y-[1.5vh]">
                        {/* Title */}
                        <div className="flex items-center justify-between px-[0.5vw]">
                            <div className="flex items-center gap-[0.5vw]">
                                <Icon icon="flowbite:filter-outline" className="w-[1.3vw] h-[1.3vw] text-black" />
                                <span className="font-semibold text-[1.1vw] text-black">
                                    {exploreMode === 'books' ? 'Filter Books By' : 'Filter Creators By'}
                                </span>
                            </div>
                            {appliedFilterChips.length > 0 && (
                                <button
                                    onClick={handleClearAllFilters}
                                    className="flex items-center gap-[0.2vw] text-[0.8vw] text-red-500 hover:text-red-600 font-medium transition-colors cursor-pointer"
                                >
                                    <span>Clear all</span>
                                    <Icon icon="lucide:trash-2" className="w-[0.85vw] h-[0.85vw]" />
                                </button>
                            )}
                        </div>

                        {/* Filter Container */}
                        <div className="bg-white border border-gray-200 rounded-[0.5vw] flex flex-col shadow-sm">

                            {/* Flipbook Type */}
                            {exploreMode === 'books' && (
                                <div className="p-[1.2vw] border-b border-gray-200 space-y-[1.5vh]">
                                    <h3 className="font-semibold text-[0.95vw] text-black">Flipbook Type</h3>
                                    <div className="space-y-[1.2vh]">
                                        {['Landscape', 'Portrait', 'Square', '3D Added Flipbook'].map((type, i) => (
                                            <label key={i} className="flex items-center justify-between cursor-pointer group">
                                                <span className="text-[0.85vw] text-gray-800">{type}</span>
                                                <div className="relative flex items-center justify-center">
                                                    <input
                                                        type="checkbox"
                                                        className="peer appearance-none w-[1.1vw] h-[1.1vw] border-[1.5px] border-black rounded-[3px] checked:bg-[#5551ff] checked:border-[#5551ff] cursor-pointer transition-colors"
                                                        checked={selectedTypes.includes(type)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) setSelectedTypes([...selectedTypes, type]);
                                                            else setSelectedTypes(selectedTypes.filter(t => t !== type));
                                                        }}
                                                    />
                                                    <svg className="absolute w-[0.75vw] h-[0.75vw] text-white pointer-events-none opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Category */}
                            <div className="p-[1.2vw] border-b border-gray-200 space-y-[1.5vh]">
                                <h3 className="font-semibold text-[0.95vw] text-black">Category</h3>
                                <div className="space-y-[1.2vh]">
                                    {['Brochure', 'Catalog', 'Magazine', 'Portfolio', 'Storybook', 'Photography Book', 'Product Catalog'].map((cat, i) => (
                                        <label key={i} className="flex items-center justify-between cursor-pointer group">
                                            <span className="text-[0.85vw] text-gray-800">{cat}</span>
                                            <div className="relative flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    className="peer appearance-none w-[1.1vw] h-[1.1vw] border-[1.5px] border-black rounded-[3px] checked:bg-[#5551ff] checked:border-[#5551ff] cursor-pointer transition-colors"
                                                    checked={selectedCategories.includes(cat)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedCategories([...selectedCategories, cat]);
                                                        else setSelectedCategories(selectedCategories.filter(c => c !== cat));
                                                    }}
                                                />
                                                <svg className="absolute w-[0.75vw] h-[0.75vw] text-white pointer-events-none opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Ratings */}
                            {exploreMode === 'books' && (
                                <div className="p-[1.2vw] border-b border-gray-200 space-y-[1.5vh] relative">
                                    <svg width="0" height="0" className="absolute">
                                        <defs>
                                            <linearGradient id="star-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#FFCA44" />
                                                <stop offset="50%" stopColor="#FFE091" />
                                                <stop offset="100%" stopColor="#FFCA44" />
                                            </linearGradient>
                                            <linearGradient id="half-star" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#FFCA44" />
                                                <stop offset="25%" stopColor="#FFE091" />
                                                <stop offset="50%" stopColor="#FFCA44" />
                                                <stop offset="50%" stopColor="#ffffff" />
                                                <stop offset="100%" stopColor="#ffffff" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <h3 className="font-semibold text-[0.95vw] text-black">Ratings</h3>
                                    <div className="space-y-[1.2vh]">
                                        {[
                                            { val: 5, stars: [1, 1, 1, 1, 1], label: "5 Star" },
                                            { val: 4.5, stars: [1, 1, 1, 1, 0.5], label: "4.5 Star" },
                                            { val: 4, stars: [1, 1, 1, 1, 0], label: "4 Star" },
                                            { val: 3.5, stars: [1, 1, 1, 0.5, 0], label: "3.5 Star" },
                                            { val: 3, stars: [1, 1, 1, 0, 0], label: "3 Star" },
                                            { val: 2.5, stars: [1, 1, 0.5, 0, 0], label: "2.5 Star" },
                                            { val: 2, stars: [1, 1, 0, 0, 0], label: "2 Star" },
                                            { val: 1.5, stars: [1, 0.5, 0, 0, 0], label: "1.5 Star" },
                                            { val: 1, stars: [1, 0, 0, 0, 0], label: "1 Star" }
                                        ].slice(0, showMoreRatings ? 9 : 3).map((rate, i) => (
                                            <label key={i} className="flex items-center justify-between cursor-pointer group">
                                                <div className="flex items-center gap-[0.8vw]">
                                                    <div className="relative flex items-center justify-center shrink-0 w-[1.1vw] h-[1.1vw] min-w-[18px] min-h-[18px]">
                                                        <input
                                                            type="radio"
                                                            name="rating"
                                                            className="sr-only"
                                                            checked={selectedRating === rate.val}
                                                            onChange={() => setSelectedRating(selectedRating === rate.val ? null : rate.val)}
                                                        />
                                                        <svg
                                                            onClick={() => setSelectedRating(selectedRating === rate.val ? null : rate.val)}
                                                            className="w-full h-full cursor-pointer overflow-visible"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                        >
                                                            {selectedRating === rate.val ? (
                                                                <>
                                                                    <circle cx="12" cy="12" r="10" stroke="#5551ff" strokeWidth="2" fill="none" />
                                                                    <circle cx="12" cy="12" r="5" fill="#5551ff" />
                                                                </>
                                                            ) : (
                                                                <circle cx="12" cy="12" r="10" stroke="#374151" strokeWidth="1.8" fill="none" />
                                                            )}
                                                        </svg>
                                                    </div>
                                                    <span className="text-[0.85vw] text-gray-800">{rate.label}</span>
                                                </div>
                                                <div className="flex gap-[0.2vw]">
                                                    {rate.stars.map((s, idx) => (
                                                        <svg key={idx} className="w-[1.1vw] h-[1.1vw] overflow-visible" fill={s === 1 ? "url(#star-gradient)" : s === 0.5 ? "url(#half-star)" : "white"} stroke="url(#star-gradient)" strokeWidth="1" viewBox="0 0 20 20">
                                                            <path d="M10 1L12.7 6.5L19 7.4L14.5 11.8L15.6 18.1L10 15.2L4.4 18.1L5.5 11.8L1 7.4L7.3 6.5Z"></path>
                                                        </svg>
                                                    ))}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setShowMoreRatings(!showMoreRatings)}
                                        className="text-[#5551ff] text-[0.85vw] mt-[1vh] font-medium hover:underline focus:outline-none cursor-pointer"
                                    >
                                        {showMoreRatings ? 'Less' : 'More'}
                                    </button>
                                </div>
                            )}

                            {/* Max Pages */}
                            {exploreMode === 'books' && (
                                <div className="p-[1.2vw] space-y-[1.5vh]">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-semibold text-[0.95vw] text-black">Max Pages</h3>
                                        <span className="text-[0.8vw] text-gray-400">4 - 100</span>
                                    </div>
                                    <div className="flex items-center gap-[1vw] pt-[1vh] pb-[0.5vh]">
                                        <input type="range" min="4" max="100" value={maxPages} onChange={(e) => setMaxPages(Number(e.target.value))} className="w-full cursor-pointer custom-range-slider" style={{ backgroundImage: `linear-gradient(to right, #4D47FF 0%, #4D47FF ${((maxPages - 4) / 96) * 100}%, #E2E8F0 ${((maxPages - 4) / 96) * 100}%, #E2E8F0 100%)` }} />
                                        <span className="text-[0.8vw] text-black font-medium whitespace-nowrap min-w-[3.5vw]">{maxPages} pages</span>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* Right Area (Books + Creators) */}
                    <div className="flex-1 flex flex-col">
                        {/* MODE 1: BOOKS GRID */}
                        {exploreMode === 'books' && (
                            <>
                                {isLoading ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-[1.5vw]">
                                        {[...Array(10)].map((_, idx) => (
                                            <FlipbookCardSkeleton key={idx} />
                                        ))}
                                    </div>
                                ) : error ? (
                                    <div className="w-full py-[10vh] flex flex-col items-center justify-center text-red-500">
                                        <svg className="w-[3vw] h-[3vw] mb-[1vh]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        <span className="text-[1.2vw] font-medium">{error}</span>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-[1.5vw]">
                                        {filteredBooks.map((book, index) => (
                                            <FlipbookCard
                                                key={book.v_id || index}
                                                v_id={book.v_id}
                                                shareId={book.shareId}
                                                access={book.access}
                                                rawBook={book.rawBook}
                                                coverImg={covers[index % 5]}
                                                profileImg={profiles[index % 5]}
                                                authorPicture={book.authorPicture}
                                                authorBgColor={book.authorBgColor}
                                                bookName={book.bookName}
                                                authorName={book.authorName}
                                                location={book.location}
                                                pages={book.pages}
                                                views={book.views}
                                                rating={book.rating}
                                                description={book.description}
                                                onShare={handleOpenShareModal}
                                                onDownload={handleOpenExportModal}
                                                onProfileClick={handleProfileClick}
                                                onAddToShelf={handleAddToShelf}
                                            />
                                        ))}
                                        {filteredBooks.length === 0 && (
                                            <div className="col-span-full py-[5vh] text-center font-semibold text-gray-700 text-[1vw]">
                                                No flipbooks found matching your filters.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}

                        {/* MODE 2: CREATORS GRID */}
                        {exploreMode === 'creators' && (
                            <div className="w-full">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-[1.5vw]">
                                    {isCreatorsLoading ? (
                                        Array.from({ length: 10 }).map((_, idx) => (
                                            <div key={idx} className="bg-white border border-gray-100 rounded-[1vw] overflow-hidden flex flex-col shadow-[0_2px_10px_rgba(0,0,0,0.06)] animate-pulse">
                                                <div className="h-[14vh] w-full bg-gray-200"></div>
                                                <div className="px-[1.2vw] pb-[1.2vw] relative bg-white flex-1 flex flex-col">
                                                    <div className="flex justify-between items-end -mt-[2.5vw] mb-[1vh]">
                                                        <div className="w-[6vw] h-[6vw] rounded-full border-[0.25vw] border-white bg-gray-300"></div>
                                                        <div className="h-[1.5vw] w-[4vw] bg-gray-200 rounded-full mb-[1vw]"></div>
                                                    </div>
                                                    <div className="h-[1vw] bg-gray-200 rounded w-3/4 mt-[0.5vh]"></div>
                                                    <div className="h-[0.7vw] bg-gray-100 rounded w-1/2 mt-[0.5vh]"></div>
                                                    <div className="h-[0.7vw] bg-gray-100 rounded w-full mt-[1vh]"></div>
                                                    <div className="w-full h-[1px] bg-gray-100 my-[1.5vh]"></div>
                                                    <div className="flex items-center justify-between px-[0.5vw]">
                                                        <div className="h-[1vw] w-[3vw] bg-gray-200 rounded"></div>
                                                        <div className="w-[1px] h-[2.5vh] bg-gray-200"></div>
                                                        <div className="h-[1vw] w-[3vw] bg-gray-200 rounded"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        filteredCreators.map((creator, idx) => {
                                            const bannerStyle = {
                                                background: creator.bannerBg?.type === 'solid' ? creator.bannerBg?.value : undefined,
                                                backgroundImage: (creator.bannerBg?.type === 'gradient' || creator.bannerBg?.type === 'media')
                                                    ? creator.bannerBg?.value
                                                    : (creator.bannerBg?.value || defaultGradients[idx % defaultGradients.length]),
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center'
                                            };
                                            const displayAvatar = (creator.picture && creator.picture !== 'color_only') ? creator.picture : null;
                                            const avatarColor = getAvatarColor(creator.name || creator.email, creator.avatarBgColor);

                                            return (
                                                <div
                                                    key={creator.emailId || idx}
                                                    className="bg-white border border-gray-100 rounded-[1vw] overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-300 shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
                                                >
                                                    {/* Banner */}
                                                    <div className="h-[14vh] w-full relative" style={bannerStyle}></div>

                                                    {/* Body */}
                                                    <div className="px-[1.2vw] pb-[1.2vw] relative bg-white flex-1 flex flex-col">
                                                        {/* Avatar & Follow Button */}
                                                        <div className="flex justify-between items-end -mt-[2.5vw] mb-[1vh]">
                                                            <div
                                                                className="relative shrink-0 z-10 cursor-pointer hover:opacity-90 transition-opacity"
                                                                onClick={() => handleProfileClick(creator)}
                                                            >
                                                                <div className="w-[6vw] h-[6vw] rounded-full border-[0.25vw] border-white overflow-hidden bg-white relative z-10 flex items-center justify-center shadow-sm">
                                                                    {displayAvatar ? (
                                                                        <img src={displayAvatar} alt={creator.name} className="w-full h-full object-cover bg-gray-50" />
                                                                    ) : (
                                                                        <div
                                                                            className="w-full h-full flex items-center justify-center text-white text-[2.2vw] font-bold"
                                                                            style={{ backgroundColor: avatarColor }}
                                                                        >
                                                                            {creator.name ? creator.name.charAt(0).toUpperCase() : 'U'}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {/* Left Smooth Corner */}
                                                                <svg className="absolute top-[1.8vw] -left-[0.56vw] w-[0.8vw] h-[0.8vw] z-10" viewBox="0 0 10 10">
                                                                    <path d="M0,10 L10,10 L10,0 A10,10 0 0,1 0,10 Z" fill="white" />
                                                                </svg>
                                                                {/* Right Smooth Corner */}
                                                                <svg className="absolute top-[1.8vw] -right-[0.56vw] w-[0.8vw] h-[0.8vw] z-10" viewBox="0 0 10 10">
                                                                    <path d="M10,10 L0,10 L0,0 A10,10 0 0,0 10,10 Z" fill="white" />
                                                                </svg>
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleToggleFollow(creator.emailId || creator.email);
                                                                }}
                                                                disabled={followingLoadingMap[(creator.emailId || creator.email)?.toLowerCase()]}
                                                                className={`w-[5.2vw] h-[1.7vw] rounded-full text-[0.85vw] font-medium transition-colors z-10 mb-[1vw] cursor-pointer flex items-center justify-center gap-[0.3vw] ${creator.isFollowing
                                                                        ? 'bg-white text-black border border-gray-200 shadow-inner hover:bg-gray-50'
                                                                        : 'bg-black text-white hover:bg-gray-800 shadow-sm'
                                                                    }`}
                                                            >
                                                                {followingLoadingMap[(creator.emailId || creator.email)?.toLowerCase()] ? (
                                                                    <Icon icon="line-md:loading-loop" className="w-[0.9vw] h-[0.9vw]" />
                                                                ) : creator.isFollowing ? (
                                                                    <span>Unfollow</span>
                                                                ) : (
                                                                    <span>Follow</span>
                                                                )}
                                                            </button>
                                                        </div>

                                                        {/* Info */}
                                                        <h4
                                                            className="text-[1vw] font-semibold text-gray-900 mt-[0.5vh] truncate cursor-pointer hover:text-indigo-600 transition-colors"
                                                            onClick={() => handleProfileClick(creator)}
                                                        >
                                                            {creator.name || 'Creator'}
                                                        </h4>
                                                        <p className="text-[0.7vw] text-gray-400 truncate">{creator.industryType || creator.companyName || 'Product Designer'}</p>
                                                        <p className="text-[0.7vw] text-gray-500 mt-[1vh] leading-relaxed line-clamp-3 flex-1">
                                                            {creator.about || '“Bring your content to life with a real, interactive experience”'}
                                                        </p>

                                                        {/* Divider */}
                                                        <div className="w-full h-[1px] bg-gray-100 mt-[1.5vh] mb-[1vh]"></div>

                                                        {/* Stats */}
                                                        <div className="flex items-center justify-between px-[0.5vw]">
                                                            <div className="flex flex-col items-center">
                                                                <div className="flex items-center gap-[0.3vw] text-gray-800 font-semibold text-[0.85vw]">
                                                                    <Icon icon="boxicons:book" className="w-[1.1vw] h-[1.1vw]" />
                                                                    <span>{creator.totalBooks || 0}</span>
                                                                </div>
                                                                <span className="text-[0.65vw] text-gray-400 mt-[0.2vh]">Total Books</span>
                                                            </div>
                                                            <div className="w-[1px] h-[2.5vh] bg-gray-200"></div>
                                                            <div className="flex flex-col items-center">
                                                                <div className="flex items-center gap-[0.3vw] text-gray-800 font-semibold text-[0.85vw]">
                                                                    <Icon icon="lucide:user" className="w-[1vw] h-[1vw]" />
                                                                    <span>{creator.followersCount || (creator.followers?.length || 0)}</span>
                                                                </div>
                                                                <span className="text-[0.65vw] text-gray-400 mt-[0.2vh]">Followers</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <Footer />

            {/* Share Modal */}
            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                currentBook={selectedBookForModal}
            />

            {/* Export Modal */}
            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                currentBook={selectedBookForModal}
                isFromMyFlipbooks={true}
            />

            {/* Profile Modal */}
            <CreatorProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                creator={selectedCreator}
            />
        </div>
    );
};

export default Explore;
