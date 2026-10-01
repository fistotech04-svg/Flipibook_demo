import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Icon } from '@iconify/react';
import axios from 'axios';
import SidebarItem from './SidebarItem';
import Appearance from './Appearance';
import MenuBar from './MenuBar';
import OtherSetup from './OtherSetup';
import LeadForm from './LeadForm';
import Visibility from './Visibility';
import Statistic from './Statistic';
import FlipbookInfoModal from '../FlipbookInfoModal';

const AttachedCurve = ({ position }) => {
  const isTop = position.includes('top');
  const isLeft = position.includes('left');
  
  const containerStyle = {
    position: 'absolute',
    width: '1vw',
    height: '1.5vw',
    pointerEvents: 'none',
    overflow: 'hidden',
    zIndex: 1998,
    ...(isTop ? { top: '-0.8vw' } : { bottom: '-0.8vw' }),
    ...(isLeft ? { left: '0' } : { right: '0' }),
  };

  const circleStyle = {
    position: 'absolute',
    width: '1.5vw',
    height: '1.6vw',
    borderRadius: '60%',
    boxShadow: '0 0 0 2vw black',
    ...(isTop ? { top: '-0.8vw' } : { bottom: '-0.8vw' }),
    ...(isLeft ? { right: '-0.8vw' } : { left: '-0.8vw' }),
  };

  return (
    <div style={containerStyle}>
      <div style={circleStyle} />
    </div>
  );
};

const SubNavItem = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-[0.75vw] px-[1vw] py-[0.6vw] rounded-[0.6vw] transition-all text-[0.75vw] font-semibold text-left ${isActive
      ? 'bg-[#DBDBEA] text-[#3E4491] active-sub-nav'
      : 'hover:bg-[#DBDBEA] text-[#3E4491]'
      }`}
  >
    <Icon
      icon={icon}
      className={`w-[1vw] h-[1vw] ${isActive ? 'text-[#3E4491]' : 'text-gray-700'}`}
    />
    <span className={`flex-1 ${isActive ? 'text-[#3E4491]' : 'text-gray-600'}`}>{label}</span>
  </button>
);

const Sidebar = ({ bookName, setBookName, activeSubView, setActiveSubView, isPanelCollapsed, setIsPanelCollapsed, pageCount, visibilitySettings, onUpdateVisibility, canUndo, canRedo, onUndo, onRedo, onPreview, onSave, currentBook, setCurrentBook, isLoading = false }) => {
  const navigate = useNavigate();
  const { folder, v_id } = useParams();
  const [openSection, setOpenSection] = useState(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const handleGoToPageEditor = () => {
    const path = folder ? `/editor/${folder}/${v_id}` : `/editor/${v_id}`;
    navigate(path);
  };

  const getParentSection = (subView) => {
    if (!subView) return null;
    if (subView === 'logo' || subView === 'profile') return 'branding';
    if (['background', 'layout', 'bookappearance'].includes(subView)) return 'appearance';
    if (['menubar', 'othersetup', 'leadform', 'visibility', 'statistic'].includes(subView)) return subView;
    return null;
  };

  const parentSection = getParentSection(activeSubView);

  const [tabTop, setTabTop] = useState(154);
  const [isDragging, setIsDragging] = useState(false);
  const sidebarRef = useRef(null);
  const bookNameInputRef = useRef(null);
  const hasMovedRef = useRef(false);
  const isManuallyPositioned = useRef(false); // true after user drags to a custom position

  const [allBooks, setAllBooks] = useState([]);
  const [isNameDuplicate, setIsNameDuplicate] = useState(false);

  // Fetch all user books for title uniqueness validation (matching main editor behavior)
  useEffect(() => {
    const fetchBooks = async () => {
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      if (user?.emailId) {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        try {
          const res = await axios.get(`${backendUrl}/api/flipbook/list`, { params: { emailId: user.emailId } });
          if (res.data && res.data.books) {
            setAllBooks(res.data.books);
          }
        } catch (err) {
          console.error("Error fetching books for validation:", err);
        }
      }
    };
    fetchBooks();
  }, []);

  const checkDuplicate = (name) => {
    if (!name || !name.trim()) return false;
    const isDup = allBooks.some(b => {
      const bTitle = b.title || b.flipbookName || b.realName || '';
      return bTitle.toLowerCase() === name.trim().toLowerCase() &&
        (v_id ? (b.v_id !== v_id && b.id !== v_id) : b.realName !== currentBook?.flipbookName);
    });
    setIsNameDuplicate(isDup);
    return isDup;
  };

  // Synchronize openSection with activeSubView
  useEffect(() => {
    const parent = getParentSection(activeSubView);
    if (parent) {
      setOpenSection(parent);
    }
    // Reset manual positioning when switching to a new sub-view
    isManuallyPositioned.current = false;
  }, [activeSubView]);

  // Dynamic Tab Positioning — skipped if user has manually dragged the tab
  useEffect(() => {
    const updateTabPos = () => {
      if (isDragging || isManuallyPositioned.current || !sidebarRef.current) return;

      let anchor = null;

      // 1. Try to find the visible active sub-nav item
      const subNav = sidebarRef.current.querySelector('.active-sub-nav');
      if (subNav) {
        const subNavParent = subNav.closest('.overflow-hidden');
        // Check if the accordion container is expanded (max-h > 0)
        if (subNavParent && !subNavParent.classList.contains('max-h-0')) {
          anchor = subNav;
        }
      }

      // 2. Fallback: Find the parent section button (it now has a section-specific ID)
      if (!anchor && parentSection) {
        anchor = sidebarRef.current.querySelector(`#section-${parentSection}`);
      }

      // 3. Last fallback: any active sidebar item
      if (!anchor) {
        anchor = sidebarRef.current.querySelector('.active-sidebar-item');
      }

      if (anchor) {
        const rect = anchor.getBoundingClientRect();
        const parentRect = sidebarRef.current.getBoundingClientRect();
        const relativeTop = rect.top - parentRect.top + (rect.height / 2) - 24;
        setTabTop(relativeTop);
      }
    };

    updateTabPos();
    const timer = setTimeout(updateTabPos, 300); // Wait for accordion transition

    window.addEventListener('resize', updateTabPos);
    return () => {
      window.removeEventListener('resize', updateTabPos);
      clearTimeout(timer);
    };
  }, [activeSubView, openSection, isDragging, parentSection]);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  const tabConfigs = {
    'logo': { icon: 'fluent-mdl2:verified-brand', top: 154 },
    'profile': { icon: 'lucide:user', top: 206 },
    'background': { icon: 'fa6-regular:image', top: 326 },
    'layout': { icon: 'lucide:layout-panel-left', top: 378 },
    'bookappearance': { icon: 'basil:book-open-outline', top: 430 },
    'menubar': { icon: 'ant-design:control-outlined', top: 482 },
    'othersetup': { icon: 'qlementine-icons:page-setup-16', top: 534 },
    'leadform': { icon: 'fluent:form-48-regular', top: 586 },
    'visibility': { icon: 'si:lock-line', top: 638 },
    'statistic': { icon: 'oui:ws-analytics', top: 690 },
  };

  const activeTab = tabConfigs[activeSubView];

  const handleMouseDown = (e) => {
    setIsDragging(true);
    hasMovedRef.current = false;
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !sidebarRef.current) return;
      hasMovedRef.current = true;
      isManuallyPositioned.current = true; // user is setting a custom position
      const rect = sidebarRef.current.getBoundingClientRect();
      const newTop = e.clientY - rect.top;
      setTabTop(Math.max(10, Math.min(newTop, rect.height - 60)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // If user just clicked (no drag movement), toggle the panel
      if (!hasMovedRef.current) {
        setIsPanelCollapsed(prev => !prev);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={sidebarRef}
      className="w-[16.25vw] h-full bg-white border-r border-gray-100 flex flex-col relative z-30 overflow-visible select-none"
    >

      {/* Draggable Tab Handle and Full-height Line — only visible when sub-panel is collapsed */}
      {activeSubView && activeTab && isPanelCollapsed && (
        <div className="absolute left-full top-0 w-[3.5vw] h-full pointer-events-none z-50">
          {/* The full-height vertical black line (0.25vw wide) */}
          <div className="absolute left-[-1px] top-0 w-[0.25vw] h-full bg-black pointer-events-auto select-none shadow-[0.1vw_0_0.5vw_rgba(0,0,0,0.1)]" />

          {/* The Draggable icon itself - repositioned to overlap with the line */}
          <div
            onMouseDown={handleMouseDown}
            className={`absolute flex items-stretch rounded-r-[0.6vw] cursor-pointer shadow-[0.2vw_0_1vw_rgba(0,0,0,0.2)] pointer-events-auto select-none group ${isDragging ? 'cursor-grabbing scale-100' : 'cursor-grab'
              }`}
            style={{
              top: `${tabTop}px`,
              left: '-1px',
              transition: isDragging ? 'none' : 'top 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 0.1s ease'
            }}
          >
            <AttachedCurve position="top-left" />
            <AttachedCurve position="bottom-left" />
            {/* Internal overflow-hidden container for icons/background */}
            <div className="flex items-stretch rounded-r-[0.6vw] overflow-hidden min-h-[2.6vw] ">
              {/* Connector strip to ensure no gap with the line */}
              <div className="w-[0.25vw] h-full bg-black flex-shrink-0 " />
              <div className="w-[2.6vw] h-[2.6vw] bg-black text-white flex items-center justify-center select-none">
                <Icon
                  icon={activeTab.icon}
                  className="w-[1.3vw] h-[1.3vw]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Book Title Section Card */}
      <div className="px-[0.75vw] py-[0.4vw] shrink-0 border-b border-gray-100">
        {isLoading ? (
          <div className="bg-white rounded-[0.6vw] border border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] px-[0.75vw] py-[0.55vw] flex flex-col justify-between gap-[0.4vw] animate-pulse">
            <div className="h-[1vw] bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-[0.3vw] w-4/5 animate-pulse"></div>
            <div className="flex items-center justify-between mt-[0.25vw]">
              <div className="h-[0.75vw] bg-gray-200/80 rounded-[0.25vw] w-1/3"></div>
              <div className="w-[0.95vw] h-[0.95vw] bg-gray-200/80 rounded-full"></div>
            </div>
          </div>
        ) : (
          <div className={`bg-white rounded-[0.6vw] border ${isNameDuplicate ? 'border-red-500 bg-red-50' : 'border-gray-200/80'} shadow-[0_2px_8px_rgba(0,0,0,0.04)] px-[0.75vw] py-[0.45vw] flex items-center gap-[0.75vw] transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]`}>
            {/* File Icon */}
            <div className="flex-shrink-0 text-[#EC5137]">
              <Icon icon="basil:document-outline" className="w-[1.8vw] h-[1.8vw]" />
            </div>

            <div className="flex flex-col flex-grow">
              <input
                ref={bookNameInputRef}
                type="text"
                value={bookName}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = e.target.value;
                  setBookName(val);
                  checkDuplicate(val);
                }}
                onBlur={() => {
                  if (isNameDuplicate) {
                    alert('Book name already exists. Please choose a different name.');
                    if (bookNameInputRef.current) bookNameInputRef.current.select();
                  } else if (onSave) {
                    onSave();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (isNameDuplicate) {
                      alert('Book name already exists. Please choose a different name.');
                      if (bookNameInputRef.current) bookNameInputRef.current.select();
                    } else {
                      e.target.blur();
                      if (onSave) onSave();
                    }
                  }
                }}
                className={`text-[0.92vw] font-medium bg-transparent border-none focus:ring-0 focus:outline-none w-full p-0 leading-snug tracking-tight ${isNameDuplicate ? 'text-red-600 placeholder-red-300 font-sans' : 'text-gray-900 placeholder-gray-400 font-sans'}`}
                placeholder="Name of the Book"
              />

              <div className="flex items-center justify-between mt-[0.25vw]">
                <span className="text-[0.72vw] text-gray-500 font-medium tracking-wide">
                  Pages : {pageCount || 10}
                </span>
                <div className="relative group/tooltip flex items-center">
                  <button
                    type="button"
                    onClick={() => setIsInfoModalOpen(true)}
                    className="text-[#EC5137] hover:text-[#d4432b] transition-colors cursor-pointer p-[0.1vw] rounded-[0.2vw] hover:bg-orange-50/80"
                  >
                    <Icon icon="mdi:rename" className="w-[0.95vw] h-[0.95vw]" />
                  </button>
                  {/* Styled Tooltip on Hover - Positioned below pen icon */}
                  <div className="absolute right-0 top-full mt-[0.4vw] hidden group-hover/tooltip:flex flex-col items-end pointer-events-none z-50 whitespace-nowrap">
                    <div className="w-0 h-0 border-x-[0.3vw] border-x-transparent border-b-[0.3vw] border-b-gray-900/90 mr-[0.3vw]" />
                    <div className="bg-gray-900/90 text-white text-[0.65vw] font-medium px-[0.5vw] py-[0.25vw] rounded-[0.3vw] shadow-md backdrop-blur-xs">
                      Edit Flipbook Information
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Navigation */}
      <div className="flex-1 overflow-y-auto pt-[0.5vw] custom-scrollbar px-[0.2vw] flex flex-col">
        {isLoading ? (
          <div className="flex flex-col">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="flex flex-col px-[0.75vw] py-[0.25vw]">
                <div className="w-full flex items-center gap-[1vw] p-[0.75vw] rounded-[0.75vw] bg-gray-50 border border-gray-100/80 animate-pulse">
                  <div className="w-[1.25vw] h-[1.25vw] bg-gray-200/80 rounded-[0.35vw] shrink-0" />
                  <div className="h-[0.85vw] bg-gray-200/80 rounded-[0.35vw] flex-1" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <SidebarItem
              id="section-background"
              icon="fa6-regular:image"
              label="Background"
              isActive={activeSubView === 'background'}
              onClick={() => setActiveSubView('background')}
              hasDropdown={false}
            />

            <SidebarItem
              id="section-layout"
              icon="lucide:layout-panel-left"
              label="Layout Design"
              isActive={activeSubView === 'layout'}
              onClick={() => setActiveSubView('layout')}
              hasDropdown={false}
            />

            <SidebarItem
              id="section-menubar"
              icon="ant-design:control-outlined"
              label="Layout Settings"
              isActive={activeSubView === 'menubar'}
              onClick={() => setActiveSubView('menubar')}
              hasDropdown={false}
            />

            <SidebarItem
              id="section-bookappearance"
              icon="basil:book-open-outline"
              label="Book Appearance"
              isActive={activeSubView === 'bookappearance'}
              onClick={() => setActiveSubView('bookappearance')}
              hasDropdown={false}
            />

            <SidebarItem
              id="section-leadform"
              icon="fluent:form-48-regular"
              label="Lead Form"
              isActive={activeSubView === 'leadform'}
              onClick={() => setActiveSubView('leadform')}
              hasDropdown={false}
            />

            <SidebarItem
              id="section-visibility"
              icon="si:lock-line"
              label="Visibility & Privacy"
              isActive={activeSubView === 'visibility'}
              onClick={() => setActiveSubView('visibility')}
              hasDropdown={false}
            />

            <SidebarItem
              id="section-statistic"
              icon="oui:ws-analytics"
              label="Analytics"
              isActive={activeSubView === 'statistic'}
              onClick={() => setActiveSubView('statistic')}
              hasDropdown={false}
            />

            <div className="w-[calc(100%-2vw)] h-[1px] bg-gray-200 mx-[1vw] my-[0.5vh]"></div>

            <SidebarItem
              id="section-branding"
              icon="fluent-mdl2:verified-brand"
              label="Branding"
              isActive={activeSubView === 'branding' || activeSubView === 'logo'}
              onClick={() => setActiveSubView('logo')}
              hasDropdown={false}
            />
          </>
        )}
      </div>
      {/* Go to Page Editor Button */}
      <div className="px-[1vw] py-[2vh] border-t border-gray-100 mt-auto bg-white">
        {isLoading ? (
          <div className="w-full h-[2.5vw] bg-gray-200/80 rounded-[0.6vw] animate-pulse"></div>
        ) : (
          <button
            onClick={handleGoToPageEditor}
            className="w-full bg-black text-white py-[1.2vh] rounded-[0.6vw] text-[0.8vw] font-semibold flex items-center justify-center gap-[0.8vw] hover:bg-gray-900 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.4)] cursor-pointer"
          >
            <ArrowUpRight size="1.2vw" className="rotate-0" />
            <span>Go to Page Editor</span>
          </button>
        )}
      </div>
      {/* Flipbook Information Modal */}
      <FlipbookInfoModal 
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        currentBook={currentBook || { flipbookName: bookName, pageCount: pageCount }}
        onSaveSuccess={(data) => {
          if (data?.bookName) setBookName(data.bookName);
          if (setCurrentBook) {
            setCurrentBook(prev => ({
              ...(prev || {}),
              flipbookName: data?.bookName || prev?.flipbookName,
              quotes: data?.quotes,
              about: data?.about,
              category: data?.category,
              language: data?.language,
              thumbnail: data?.coverPicture?.url || prev?.thumbnail,
              coverPicture: data?.coverPicture || prev?.coverPicture,
              meta: {
                ...(prev?.meta || {}),
                quotes: data?.quotes,
                about: data?.about,
                category: data?.category,
                language: data?.language,
                coverPicture: data?.coverPicture || prev?.meta?.coverPicture
              },
              settings: {
                ...(prev?.settings || {}),
                othersetup: {
                  ...(prev?.settings?.othersetup || {}),
                  coverPicture: data?.coverPicture || prev?.settings?.othersetup?.coverPicture
                }
              }
            }));
          }
        }}
      />
    </div>
  );
};

export default Sidebar;
