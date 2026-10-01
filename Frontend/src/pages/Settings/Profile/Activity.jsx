import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { Icon } from '@iconify/react';
import { Check, X } from 'lucide-react';

const activityOptions = [
  'All Activities',
  'Flipbook Creation',
  'Flipbook Updation',
  'Flipbook Deletion',
  'Profile Creation',
  'Profile Updation',
  'Published Flipbook',
  'Un-Published Flipbook'
];

const getActivityStyles = (type, item) => {
  const t = type || item?.type;
  switch (t) {
    case 'create':
    case 'create_flip':
      return {
        icon: item?.icon || 'lucide:book-open',
        colorClass: 'text-indigo-500',
        bgClass: 'bg-indigo-50',
        dotClass: 'bg-indigo-500',
        dotHex: '#6366f1',
        bgHex: '#eef2ff',
        colorHex: '#6366f1'
      };
    case 'edit_flip':
    case 'edit':
      return {
        icon: item?.icon || (t === 'edit_flip' ? 'lucide:edit-3' : 'lucide:user'),
        colorClass: 'text-yellow-500',
        bgClass: 'bg-yellow-50',
        dotClass: 'bg-yellow-500',
        dotHex: '#eab308',
        bgHex: '#fefce8',
        colorHex: '#eab308'
      };
    case 'delete_flip':
    case 'delete':
      return {
        icon: item?.icon || 'lucide:trash-2',
        colorClass: 'text-red-500',
        bgClass: 'bg-red-50',
        dotClass: 'bg-red-500',
        dotHex: '#ef4444',
        bgHex: '#fef2f2',
        colorHex: '#ef4444'
      };
    case 'create_profile':
      return {
        icon: item?.icon || 'lucide:user',
        colorClass: 'text-blue-500',
        bgClass: 'bg-blue-50',
        dotClass: 'bg-blue-500',
        dotHex: '#3b82f6',
        bgHex: '#eff6ff',
        colorHex: '#3b82f6'
      };
    case 'publish':
      return {
        icon: item?.icon || 'lucide:layout-template',
        colorClass: 'text-green-500',
        bgClass: 'bg-green-50',
        dotClass: 'bg-green-500',
        dotHex: '#22c55e',
        bgHex: '#f0fdf4',
        colorHex: '#22c55e'
      };
    case 'unpublish':
      return {
        icon: item?.icon || 'lucide:eye-off',
        colorClass: 'text-gray-500',
        bgClass: 'bg-gray-50',
        dotClass: 'bg-gray-500',
        dotHex: '#6b7280',
        bgHex: '#f9fafb',
        colorHex: '#6b7280'
      };
    case 'send':
      return {
        icon: item?.icon || 'lucide:send',
        colorClass: 'text-orange-500',
        bgClass: 'bg-orange-50',
        dotClass: 'bg-orange-500',
        dotHex: '#f97316',
        bgHex: '#fff7ed',
        colorHex: '#f97316'
      };
    default: {
      let dotColor = '#6366f1';
      if (item?.dot?.includes('yellow')) dotColor = '#eab308';
      else if (item?.dot?.includes('red')) dotColor = '#ef4444';
      else if (item?.dot?.includes('green')) dotColor = '#22c55e';
      else if (item?.dot?.includes('blue')) dotColor = '#3b82f6';
      else if (item?.dot?.includes('orange')) dotColor = '#f97316';
      else if (item?.dot?.includes('gray')) dotColor = '#6b7280';
      else if (item?.dot?.includes('indigo')) dotColor = '#6366f1';

      return {
        icon: item?.icon || 'lucide:activity',
        colorClass: item?.color || 'text-gray-500',
        bgClass: item?.bg || 'bg-gray-50',
        dotClass: item?.dot || 'bg-indigo-500',
        dotHex: dotColor,
        bgHex: undefined,
        colorHex: undefined
      };
    }
  }
};

const Activity = ({ userEmail: propEmail }) => {
  const [portalTarget, setPortalTarget] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState('All Activities');
  const dropdownRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Activities state
  const [activities, setActivities] = useState([]);
  const [rawItems, setRawItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Item menu state
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const menuRef = useRef(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || '';

  const effectiveEmail = propEmail || (() => {
    try {
      const stored = localStorage.getItem('user_profile') || localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.emailId || parsed.email || (typeof stored === 'string' && !stored.startsWith('{') ? stored : '');
      }
    } catch (e) {}
    return '';
  })();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPortalTarget(document.getElementById('save-buttons-portal-target'));
  }, []);

  // Close dropdown and action menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Helper to re-group flat items by date
  const groupItemsByDate = (items) => {
    const groupsMap = new Map();
    items.forEach((item) => {
      const dateKey = item.date || 'Today';
      if (!groupsMap.has(dateKey)) {
        groupsMap.set(dateKey, []);
      }
      groupsMap.get(dateKey).push(item);
    });
    return Array.from(groupsMap.entries()).map(([date, groupItems]) => ({
      date,
      items: groupItems
    }));
  };

  // Fetch activities from backend
  const fetchActivities = useCallback(async (pageNum = 1, isAppend = false) => {
    if (!effectiveEmail) {
      setIsLoading(false);
      return;
    }

    if (pageNum === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const res = await axios.get(`${backendUrl}/api/activity`, {
        params: {
          emailId: effectiveEmail,
          activityType: selectedActivity,
          search: debouncedSearch,
          page: pageNum,
          limit: 15
        }
      });

      if (res.data?.success) {
        const newRawItems = res.data.rawItems || [];
        const combinedRaw = isAppend ? [...rawItems, ...newRawItems] : newRawItems;
        setRawItems(combinedRaw);
        setActivities(groupItemsByDate(combinedRaw));
        setHasMore(Boolean(res.data.hasMore));
        setTotalCount(res.data.totalCount || combinedRaw.length);
        setPage(pageNum);
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [effectiveEmail, selectedActivity, debouncedSearch, backendUrl, rawItems]);

  // Initial & filter trigger fetch
  useEffect(() => {
    setRawItems([]);
    setActivities([]);
    setPage(1);
    fetchActivities(1, false);
  }, [effectiveEmail, selectedActivity, debouncedSearch]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchActivities(page + 1, true);
    }
  };

  const handleDeleteActivity = async (id, e) => {
    if (e) e.stopPropagation();
    if (!id) return;
    setDeletingId(id);
    try {
      const res = await axios.delete(`${backendUrl}/api/activity/${id}`, {
        params: { emailId: effectiveEmail }
      });
      if (res.data?.success) {
        const updatedRaw = rawItems.filter(item => item.id !== id && item._id !== id);
        setRawItems(updatedRaw);
        setActivities(groupItemsByDate(updatedRaw));
        setTotalCount(prev => Math.max(0, prev - 1));
        setActiveMenuId(null);
      }
    } catch (err) {
      console.error('Error deleting activity:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const filterSearchBar = (
    <div className="flex items-center gap-[1vw]">
      <div className="relative" ref={dropdownRef}>
        <div 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center px-[1vw] py-[0.59vw] border border-gray-200 rounded-[0.4vw] bg-white cursor-pointer hover:bg-gray-50 min-w-[12vw] shadow-sm select-none"
        >
          <span className="text-[0.85vw] font-medium text-gray-700">{selectedActivity}</span>
          <Icon icon={isDropdownOpen ? "lucide:chevron-up" : "lucide:chevron-down"} className="ml-auto w-[1vw] h-[1vw] text-gray-400" />
        </div>
        
        {isDropdownOpen && (
          <div className="absolute top-[calc(100%+0.5vw)] left-0 w-[14vw] bg-white border border-gray-100 rounded-[0.6vw] shadow-[0_8px_24px_rgba(0,0,0,0.08)] py-[0.5vw] z-50 animate-in fade-in zoom-in-95 duration-150">
            {activityOptions.map((option, idx) => (
              <div 
                key={idx}
                className={`px-[1.5vw] py-[0.6vw] text-[0.8vw] cursor-pointer transition-colors text-left ${selectedActivity === option ? 'text-[#312e81] font-medium bg-[#f8f8fc]' : 'text-gray-600 hover:text-[#312e81] hover:bg-[#f8f8fc]'}`}
                onClick={() => {
                  setSelectedActivity(option);
                  setIsDropdownOpen(false);
                }}
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center border border-gray-200 rounded-[0.4vw] bg-white w-[25vw] shadow-sm">
        <div className="flex-1 flex items-center px-[1vw]">
          <Icon icon="lucide:search" className="w-[1vw] h-[1vw] text-gray-400" />
          <input 
            type="text" 
            placeholder="Search activities..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent px-[0.5vw] py-[0.59vw] text-[0.85vw] text-gray-600 focus:outline-none" 
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 mr-[0.2vw]">
              <X className="w-[0.9vw] h-[0.9vw]" />
            </button>
          )}
        </div>
        <div className="px-[1vw] py-[0.59vw] border-l border-gray-200 flex items-center justify-center text-gray-500 rounded-r-[0.4vw]">
          <Icon icon="lucide:calendar" className="w-[1vw] h-[1vw]" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 w-full relative">
      {/* Header */}
      <div className="flex justify-between items-start mb-[1.5vw] pr-[1vw]">
        {portalTarget ? createPortal(filterSearchBar, portalTarget) : filterSearchBar}
      </div>

      {/* Activity Timeline Container */}
      <div className="p-[2vw] pt-0 flex-1">
        {isLoading ? (
          <div className="flex flex-col gap-[1.5vw] py-[2vw] pl-[2.5vw]">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-start gap-[1.5vw] animate-pulse">
                <div className="w-[2.8vw] h-[2.8vw] rounded-full bg-gray-200 shrink-0"></div>
                <div className="flex-1 flex flex-col gap-[0.5vw]">
                  <div className="h-[1vw] bg-gray-200 rounded w-[30%]"></div>
                  <div className="h-[0.8vw] bg-gray-100 rounded w-[50%]"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          <div className="flex flex-col">
            {activities.map((group, groupIdx) => (
              <div key={groupIdx} className="mb-[2.2vw] last:mb-0">
                {/* Date Header */}
                <div className="flex items-center gap-[0.8vw] mb-[1.2vw]">
                  <h3 className="text-[0.95vw] font-bold text-gray-900 tracking-tight">
                    {group.date}
                  </h3>
                  <div className="h-[1px] flex-1 bg-gray-100"></div>
                </div>

                {/* Items in date group */}
                <div className="relative pl-[2.2vw] flex flex-col gap-[1.6vw]">
                  {/* Perfect continuous line from first dot center to last dot center */}
                  {group.items.length > 1 && (
                    <div className="absolute left-[0.7vw] top-[1.4vw] bottom-[1.4vw] w-[2px] bg-gray-200 -translate-x-1/2 z-0"></div>
                  )}

                  {group.items.map((item) => {
                    const isItemMenuOpen = activeMenuId === (item.id || item._id);
                    const isDeletingThis = deletingId === (item.id || item._id);
                    const style = getActivityStyles(item.type, item);

                    return (
                      <div key={item.id || item._id} className="flex items-center gap-[1.2vw] relative z-10 group">
                        {/* Timeline Dot (Mathematically centered on the vertical line) */}
                        <div className="absolute left-[-2.2vw] w-[1.4vw] flex items-center justify-center top-[1.4vw] -translate-y-1/2 z-10">
                          <div 
                            className={`w-[0.55vw] h-[0.55vw] rounded-full ring-4 ring-white shadow-xs ${style.dotClass}`}
                            style={{ backgroundColor: style.dotHex }}
                          ></div>
                        </div>

                        {/* Icon */}
                        <div 
                          className={`w-[2.8vw] h-[2.8vw] rounded-full flex items-center justify-center shadow-xs shrink-0 z-10 transition-transform group-hover:scale-105 border border-white ${style.bgClass} ${style.colorClass}`}
                          style={style.bgHex ? { backgroundColor: style.bgHex, color: style.colorHex } : {}}
                        >
                          <Icon icon={style.icon} className="w-[1.25vw] h-[1.25vw]" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex justify-between items-center min-h-[2.8vw] pr-[0.5vw]">
                          <div className="flex flex-col justify-center">
                            <h4 className="text-[0.85vw] font-semibold text-gray-800 leading-tight">{item.title}</h4>
                            {item.desc && (
                              <div className="text-[0.75vw] text-gray-400 mt-[0.2vw] leading-relaxed whitespace-pre-line">
                                {item.desc}
                              </div>
                            )}
                          </div>

                          {/* Time & Options */}
                          <div className="flex items-center gap-[1.2vw] ml-auto shrink-0 relative" ref={isItemMenuOpen ? menuRef : null}>
                            <span className="text-[0.7vw] text-gray-400 font-medium uppercase tracking-wide">{item.time}</span>
                            
                            <button 
                              onClick={() => setActiveMenuId(isItemMenuOpen ? null : (item.id || item._id))}
                              className="text-gray-400 hover:text-gray-600 transition-colors p-[0.2vw] rounded hover:bg-gray-100 cursor-pointer"
                              title="Options"
                            >
                              <Icon icon="lucide:more-vertical" className="w-[1.1vw] h-[1.1vw]" />
                            </button>

                            {/* Dropdown Menu */}
                            {isItemMenuOpen && (
                              <div className="absolute right-0 top-[calc(100%+0.3vw)] w-[8vw] bg-white border border-gray-100 rounded-lg shadow-xl py-[0.3vw] z-50 animate-in fade-in zoom-in-95 duration-100">
                                <button
                                  onClick={(e) => handleDeleteActivity(item.id || item._id, e)}
                                  disabled={isDeletingThis}
                                  className="w-full px-[0.8vw] py-[0.4vw] text-[0.75vw] text-red-600 hover:bg-red-50 flex items-center gap-[0.4vw] transition-colors cursor-pointer text-left disabled:opacity-50"
                                >
                                  {isDeletingThis ? (
                                    <div className="animate-spin rounded-full h-[0.7vw] w-[0.7vw] border border-red-600 border-t-transparent" />
                                  ) : (
                                    <Icon icon="lucide:trash-2" className="w-[0.8vw] h-[0.8vw]" />
                                  )}
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-[5vw] text-gray-400 relative z-10">
            <Icon icon="lucide:search-x" className="w-[3vw] h-[3vw] mb-[1vw] text-gray-300" />
            <p className="text-[1vw] font-medium text-gray-500">No activities found matching your criteria</p>
            <p className="text-[0.75vw] text-gray-400 mt-[0.2vw]">Actions like creating/editing flipbooks and updating your profile will appear here.</p>
          </div>
        )}

        {/* Load More */}
        {activities.length > 0 && hasMore && (
          <div className="flex justify-center mt-[1.5vw]">
            <button 
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="flex items-center gap-[0.5vw] text-blue-600 px-[1.5vw] py-[0.6vw] text-[0.8vw] font-semibold hover:text-blue-700 transition-colors bg-transparent border-none cursor-pointer disabled:opacity-50"
            >
              {isLoadingMore ? (
                <div className="flex items-center gap-[0.4vw]">
                  <div className="animate-spin rounded-full h-[0.8vw] w-[0.8vw] border-2 border-blue-600 border-t-transparent" />
                  <span>Loading...</span>
                </div>
              ) : (
                <>
                  <span>Load More Activities</span>
                  <Icon icon="lucide:chevron-down" className="w-[1vw] h-[1vw]" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Activity;
