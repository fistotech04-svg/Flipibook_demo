import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import HTMLFlipBook from 'react-pageflip';
import { 
  Search, Eye, ArrowRight, ChevronDown, Check, X, 
  Filter, ArrowUpDown, Heart, Loader2, ChevronLeft, ChevronRight,
  FileText, BookOpen
} from 'lucide-react';
import { formatTemplateSvgToPageSvg } from '../utils/editorUtils';

// Template Preview SVGs from Backend assets
import { getBookPageUrl } from '../utils/templateAssets';

// Interactive Flipbook Single Page component with forwardRef for HTMLFlipBook
const FlipBookPage = React.forwardRef(({ src, pageNum }, ref) => {
  return (
    <div ref={ref} className="w-full h-full bg-white overflow-hidden flex items-center justify-center relative shadow-sm select-none">
      {src ? (
        <img
          src={src}
          alt={`Page ${pageNum || ''}`}
          className="w-full h-full object-contain pointer-events-none"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-[#fcfcfc] flex items-center justify-center text-gray-300 text-[0.8vw]">
          Page {pageNum}
        </div>
      )}
      {/* Subtle paper spine gradient shadow */}
      <div className="absolute inset-y-0 right-0 w-[1.2vw] pointer-events-none bg-gradient-to-l from-black/[0.05] to-transparent" />
      <div className="absolute inset-y-0 left-0 w-[1.2vw] pointer-events-none bg-gradient-to-r from-black/[0.05] to-transparent" />
    </div>
  );
});
FlipBookPage.displayName = 'FlipBookPage';

const CATEGORIES = [
  'All',
  'Business',
  'Education',
  'Healthcare',
  'Industrial',
  'Product Catalog',
  'Real Estate',
  'Automotive',
  'More'
];

const SORT_OPTIONS = [
  { id: 'popular', label: 'Most Popular' },
  { id: 'newest', label: 'Newest' },
  { id: 'az', label: 'Alphabetical (A-Z)' },
  { id: 'pages_desc', label: 'Page Count: High to Low' },
  { id: 'pages_asc', label: 'Page Count: Low to High' },
];

const FORMAT_OPTIONS = [
  { id: 'all', label: 'All Formats' },
  { id: 'corporate', label: 'A4 (210 × 297 mm)', width: 210, height: 297 },
  { id: 'large_catalogue', label: 'A3 (297 × 420 mm)', width: 297, height: 420 },
  { id: 'mini', label: 'A5 (148 × 210 mm)', width: 148, height: 210 },
  { id: 'letter', label: 'Letter (216 × 279 mm)', width: 216, height: 279 },
  { id: 'legal', label: 'Legal (216 × 356 mm)', width: 216, height: 356 },
  { id: 'dl', label: 'DL Flyer (99 × 210 mm)', width: 99, height: 210 },
  { id: 'square', label: 'Square (210 × 210 mm)', width: 210, height: 210 }
];

const PAPER_SIZE_OPTIONS = [
  { id: 'corporate', label: 'A4 (210 × 297 mm)', width: 210, height: 297 },
  { id: 'large_catalogue', label: 'A3 (297 × 420 mm)', width: 297, height: 420 },
  { id: 'mini', label: 'A5 (148 × 210 mm)', width: 148, height: 210 },
  { id: 'letter', label: 'Letter (216 × 279 mm)', width: 216, height: 279 },
  { id: 'legal', label: 'Legal (216 × 356 mm)', width: 216, height: 356 },
  { id: 'dl', label: 'DL Flyer (99 × 210 mm)', width: 99, height: 210 },
  { id: 'square', label: 'Square (210 × 210 mm)', width: 210, height: 210 }
];

// Paper formats matching CreateFlipbookModal.jsx
const PREVIEW_PAPER_SIZES = [
  { id: 'corporate', label: 'A4 (210 × 297 mm)', shortLabel: 'A4', width: 210, height: 297 },
  { id: 'large_catalogue', label: 'A3 (297 × 420 mm)', shortLabel: 'A3', width: 297, height: 420 },
  { id: 'mini', label: 'A5 (148 × 210 mm)', shortLabel: 'A5', width: 148, height: 210 },
  { id: 'letter', label: 'Letter (216 × 279 mm)', shortLabel: 'Letter', width: 216, height: 279 },
  { id: 'legal', label: 'Legal (216 × 356 mm)', shortLabel: 'Legal', width: 216, height: 356 },
  { id: 'dl', label: 'DL Flyer (99 × 210 mm)', shortLabel: 'DL', width: 99, height: 210 },
  { id: 'square', label: 'Square (210 × 210 mm)', shortLabel: 'Square', width: 210, height: 210 }
];

// Calculate exact dimensions matching CreateFlipbookModal.jsx
const getTemplateDimensions = (tmplId, orient) => {
  let w = 210, h = 297;
  if (tmplId === 'corporate' || tmplId === 'a4') { w = 210; h = 297; }
  else if (tmplId === 'large_catalogue' || tmplId === 'a3') { w = 297; h = 420; }
  else if (tmplId === 'mini' || tmplId === 'a5') { w = 148; h = 210; }
  else if (tmplId === 'letter') { w = 216; h = 279; }
  else if (tmplId === 'legal') { w = 216; h = 356; }
  else if (tmplId === 'dl') { w = 99; h = 210; }
  else if (tmplId === 'square') { w = 210; h = 210; }

  if (tmplId !== 'square' && orient === 'landscape') {
    return { width: h, height: w };
  }
  return { width: w, height: h };
};

// Rich curated metadata for backend books
const TEMPLATE_METADATA = {
  interior_book: {
    title: 'Corporate Modern',
    category: 'Industrial',
    badge: 'Industrial',
    formatLabel: 'A4',
    dim: 'A4 (Portrait)',
    width: 210,
    height: 297,
    desc: 'A clean and professional template perfect for company profiles, business presentations and corporate brochures.',
    popular: true,
    popularity: 100,
    date: '2026-03-15'
  },
  mobile_book: {
    title: 'Mobile App & Tech Showcase',
    category: 'Product Catalog',
    badge: 'Product Catalog',
    formatLabel: 'A4',
    dim: 'A4 (Portrait)',
    width: 210,
    height: 297,
    desc: 'Full 12-page digital mobile app, tech device showcase and modern product catalog booklet.',
    popular: true,
    popularity: 99,
    date: '2026-03-14'
  }
};

// Initial templates list matching existing backend server templates
const TEMPLATE_LIST = [
  {
    id: 'interior_book',
    templateId: 'corporate',
    formatId: 'corporate',
    folder: 'Interior_Book',
    title: 'Corporate Modern',
    category: 'Industrial',
    badge: 'Industrial',
    formatLabel: 'A4',
    dim: 'A4 (Portrait)',
    width: 210,
    height: 297,
    pages: 24,
    pagesCount: 12,
    preview: getBookPageUrl('Interior_Book', 1),
    pageUrls: Array.from({ length: 12 }, (_, i) => getBookPageUrl('Interior_Book', i + 1)),
    desc: 'A clean and professional template perfect for company profiles, business presentations and corporate brochures.',
    popular: true,
    popularity: 100,
    date: '2026-03-15',
    isMultiPageBook: true
  },
  {
    id: 'mobile_book',
    templateId: 'corporate',
    formatId: 'corporate',
    folder: 'Mobile_Book',
    title: 'Mobile App & Tech Showcase',
    category: 'Product Catalog',
    badge: 'Product Catalog',
    formatLabel: 'A4',
    dim: 'A4 (Portrait)',
    width: 210,
    height: 297,
    pages: 12,
    pagesCount: 12,
    preview: getBookPageUrl('Mobile_Book', 1),
    pageUrls: Array.from({ length: 12 }, (_, i) => getBookPageUrl('Mobile_Book', i + 1)),
    desc: 'Full 12-page digital mobile app, tech device showcase and modern product catalog booklet.',
    popular: true,
    popularity: 99,
    date: '2026-03-14',
    isMultiPageBook: true
  }
];

export default function Template() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState('interior_book');
  const [favorites, setFavorites] = useState(() => new Set(['interior_book']));

  // Persistent Right Panel Book Preview States
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);
  const [currentFlipPage, setCurrentFlipPage] = useState(0);
  const [bookTranslateX, setBookTranslateX] = useState('-25%');
  const flipBookRef = useRef(null);
  const thumbCarouselRef = useRef(null);
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);
  const [selectedPaperSizeId, setSelectedPaperSizeId] = useState('corporate');
  const [selectedOrientation, setSelectedOrientation] = useState('portrait');
  const [previewSelectedPages, setPreviewSelectedPages] = useState(new Set());
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
  const [isOrientDropdownOpen, setIsOrientDropdownOpen] = useState(false);
  const sizeDropdownRef = useRef(null);
  const orientDropdownRef = useRef(null);

  // Close size and orientation dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sizeDropdownRef.current && !sizeDropdownRef.current.contains(e.target)) {
        setIsSizeDropdownOpen(false);
      }
      if (orientDropdownRef.current && !orientDropdownRef.current.contains(e.target)) {
        setIsOrientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Modal States
  const [selectedTemplateItem, setSelectedTemplateItem] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTemplateIdForModal, setSelectedTemplateIdForModal] = useState('corporate');
  const [existingFlipbooks, setExistingFlipbooks] = useState([]);
  const [dynamicBooks, setDynamicBooks] = useState([]);

  // Page Selection Modal States (Exact match to user screenshot)
  const [isPageSelectModalOpen, setIsPageSelectModalOpen] = useState(false);
  const [modalSelectedPages, setModalSelectedPages] = useState(new Set());
  const [modalPreviewPageIndex, setModalPreviewPageIndex] = useState(0);
  const [modalPaperSize, setModalPaperSize] = useState('A4 (Portrait)');
  const [modalPlacement, setModalPlacement] = useState('after');
  const [modalTargetPageIndex, setModalTargetPageIndex] = useState(3);

  // User Email & Backend URL
  const user = useMemo(() => {
    try {
      const stored = localStorage.getItem('user_profile') || localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);
  const emailId = user?.emailId || user?.email || 'naveen@fistotech.com';
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  // Fetch dynamic books and existing flipbooks
  useEffect(() => {
    const fetchExistingFlipbooks = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/flipbook/list`, {
          params: { emailId }
        });
        const rawBooks = res.data?.books || [];
        const names = rawBooks.map(b => b.realName || b.title).filter(Boolean);
        setExistingFlipbooks(names);
      } catch (err) {
        console.error('Failed to load existing flipbooks:', err);
      }
    };

    const fetchTemplateBooks = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/templates/books`);
        if (res.data?.books && Array.isArray(res.data.books)) {
          setDynamicBooks(res.data.books);
        }
      } catch (err) {
        console.warn('Failed to load dynamic template books:', err);
      }
    };

    fetchExistingFlipbooks();
    fetchTemplateBooks();
  }, [backendUrl, emailId]);

  // Toggle favorite heart
  const toggleFavorite = (id) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Only show templates that exist in Backend server
  const allTemplates = useMemo(() => {
    if (dynamicBooks && dynamicBooks.length > 0) {
      return dynamicBooks.map(b => {
        const fullThumbnailUrl = b.thumbnail.startsWith('http') ? b.thumbnail : `${backendUrl}${b.thumbnail}`;
        const fullPageUrls = (b.pages || []).map(p => p.startsWith('http') ? p : `${backendUrl}${p}`);
        const meta = TEMPLATE_METADATA[b.id] || {};

        return {
          id: b.id,
          folder: b.folder,
          templateId: meta.templateId || 'corporate',
          formatId: meta.formatId || 'corporate',
          title: meta.title || b.title || b.folder || 'Template Book',
          category: meta.category || 'Product Catalog',
          badge: meta.badge || `${b.pagesCount || 1} Pages Book`,
          formatLabel: meta.formatLabel || 'A4',
          dim: meta.dim || '210 × 297 mm',
          width: meta.width || 210,
          height: meta.height || 297,
          pages: b.pagesCount || 1,
          preview: fullThumbnailUrl,
          pageUrls: fullPageUrls,
          desc: meta.desc || `Full ${b.pagesCount || 1} page template book with complete spreads.`,
          popular: meta.popular !== undefined ? meta.popular : false,
          popularity: meta.popularity || 85,
          date: meta.date || '2026-03-10',
          isMultiPageBook: b.isMultiPageBook
        };
      });
    }

    return TEMPLATE_LIST;
  }, [dynamicBooks, backendUrl]);

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let result = allTemplates.filter(t => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        t.title.toLowerCase().includes(q) ||
        t.desc.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q);
      
      const matchesCategory = 
        selectedCategory === 'All' || 
        selectedCategory === 'More' ||
        (selectedCategory === 'Favorites' ? favorites.has(t.id) : t.category.toLowerCase().includes(selectedCategory.toLowerCase()));

      const matchesFormat = selectedFormat === 'all' || t.formatId === selectedFormat;

      return matchesSearch && matchesCategory && matchesFormat;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'popular') return (b.popularity || 0) - (a.popularity || 0);
      if (sortBy === 'newest') return new Date(b.date || 0) - new Date(a.date || 0);
      if (sortBy === 'az') return a.title.localeCompare(b.title);
      if (sortBy === 'pages_desc') return (b.pages || 0) - (a.pages || 0);
      if (sortBy === 'pages_asc') return (a.pages || 0) - (b.pages || 0);
      return 0;
    });

    return result;
  }, [searchQuery, selectedCategory, selectedFormat, sortBy, allTemplates, favorites]);

  // Selected template object for persistent right side panel
  const selectedTemplate = useMemo(() => {
    return allTemplates.find(t => t.id === selectedCardId) || allTemplates[0] || null;
  }, [allTemplates, selectedCardId]);

  // Page URLs for the currently selected template
  const currentTemplatePageUrls = useMemo(() => {
    if (!selectedTemplate) return [];
    if (Array.isArray(selectedTemplate.pageUrls) && selectedTemplate.pageUrls.length > 0) {
      return selectedTemplate.pageUrls;
    }
    if (Array.isArray(selectedTemplate.pages) && typeof selectedTemplate.pages[0] === 'string') {
      return selectedTemplate.pages;
    }
    if (selectedTemplate.folder) {
      const pCount = selectedTemplate.pagesCount || (typeof selectedTemplate.pages === 'number' ? selectedTemplate.pages : 12);
      return Array.from({ length: pCount }, (_, i) => getBookPageUrl(selectedTemplate.folder, i + 1));
    }
    return selectedTemplate.preview ? [selectedTemplate.preview] : [];
  }, [selectedTemplate]);

  // Flat list of pages for HTMLFlipBook
  const bookPages = useMemo(() => {
    let urls = currentTemplatePageUrls && currentTemplatePageUrls.length > 0 
      ? [...currentTemplatePageUrls] 
      : [selectedTemplate?.preview].filter(Boolean);

    // Make sure we have an even number of total pages so the book closes cleanly on the back cover
    if (urls.length > 1 && urls.length % 2 !== 0) {
      urls.push(null);
    }
    return urls;
  }, [currentTemplatePageUrls, selectedTemplate]);

  // Compute translation to center single page cover vs. double page spread
  const getTranslationForPage = useCallback((pageIndex) => {
    if (pageIndex === 0) return '-25%';
    if (bookPages.length > 1 && pageIndex >= bookPages.length - 1) return '25%';
    return '0%';
  }, [bookPages.length]);

  // Reset flipbook to centered cover page whenever template changes or preview is opened
  useEffect(() => {
    setCurrentFlipPage(0);
    setBookTranslateX('-25%');
    if (flipBookRef.current?.pageFlip()) {
      try {
        flipBookRef.current.pageFlip().turnToPage(0);
      } catch {}
    }
  }, [selectedCardId, isPreviewOpen]);

  // Sync selected pages and paper size whenever selected template changes
  useEffect(() => {
    if (currentTemplatePageUrls && currentTemplatePageUrls.length > 0) {
      setPreviewSelectedPages(new Set(Array.from({ length: currentTemplatePageUrls.length }, (_, i) => i)));
    } else {
      setPreviewSelectedPages(new Set([0]));
    }
    const fmt = selectedTemplate?.formatId || selectedTemplate?.templateId;
    if (fmt && PREVIEW_PAPER_SIZES.some(p => p.id === fmt)) {
      setSelectedPaperSizeId(fmt);
      if (fmt === 'square') {
        setSelectedOrientation('portrait');
      }
    }
  }, [selectedCardId, currentTemplatePageUrls, selectedTemplate]);

  const togglePreviewPageSelection = (idx, e) => {
    if (e) e.stopPropagation();
    setPreviewSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        if (next.size > 1) {
          next.delete(idx);
        }
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const handleThumbnailClick = (idx) => {
    if (flipBookRef.current?.pageFlip()) {
      try {
        setBookTranslateX(getTranslationForPage(idx));
        flipBookRef.current.pageFlip().turnToPage(idx);
        setCurrentFlipPage(idx);
      } catch {}
    }
  };

  const scrollThumbnails = (dir) => {
    if (thumbCarouselRef.current) {
      const scrollAmount = dir === 'left' ? -200 : 200;
      thumbCarouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Handle page flip completion
  const handleFlipChange = useCallback((e) => {
    const page = e.data;
    setCurrentFlipPage(page);
    setBookTranslateX(getTranslationForPage(page));
  }, [getTranslationForPage]);

  // Real-time animation sync: transition translation as soon as page-turn starts
  const handleFlipStateChange = useCallback((e) => {
    const state = e.data;
    const pageFlip = flipBookRef.current?.pageFlip();
    if (!pageFlip) return;

    if (state === 'flipping' || state === 'user_fold') {
      const currPage = pageFlip.getCurrentPageIndex();
      // When opening from front cover to double page spread
      if (currPage === 0) {
        setBookTranslateX('0%');
      }
      // When closing back to front cover (on spread 1, turning backwards)
      else if (currPage <= 2) {
        const calc = pageFlip.getFlipController()?.getCalculation();
        if (calc?.getDirection?.() === 1) {
          setBookTranslateX('-25%');
        }
      }
      // When opening backwards from back cover
      else if (bookPages.length > 1 && currPage >= bookPages.length - 1) {
        setBookTranslateX('0%');
      }
      // When closing forwards to back cover
      else if (bookPages.length > 1 && currPage >= bookPages.length - 3) {
        const calc = pageFlip.getFlipController()?.getCalculation();
        if (calc?.getDirection?.() === 0) {
          setBookTranslateX('25%');
        }
      }
    } else if (state === 'read') {
      const currPage = pageFlip.getCurrentPageIndex();
      setBookTranslateX(getTranslationForPage(currPage));
    }
  }, [bookPages.length, getTranslationForPage]);

  // Computed natural book spreads with pageIndex for turnToPage
  const spreads = useMemo(() => {
    if (!currentTemplatePageUrls || currentTemplatePageUrls.length === 0) return [];
    const list = [];

    // Spread 0: Cover (Page 1)
    list.push({
      index: 0,
      pageIndex: 0,
      type: 'cover',
      leftUrl: null,
      rightUrl: currentTemplatePageUrls[0],
      displayNumber: 1,
      label: 'Page 1'
    });

    // Subsequent double-page spreads
    let p = 1;
    while (p < currentTemplatePageUrls.length - 1) {
      list.push({
        index: list.length,
        pageIndex: p,
        type: 'spread',
        leftUrl: currentTemplatePageUrls[p],
        rightUrl: currentTemplatePageUrls[p + 1],
        displayNumber: p + 1,
        label: `Pages ${p + 1}-${p + 2}`
      });
      p += 2;
    }

    // Odd remaining page at the end (e.g. Back Cover)
    if (p < currentTemplatePageUrls.length) {
      list.push({
        index: list.length,
        pageIndex: p,
        type: 'back_cover',
        leftUrl: currentTemplatePageUrls[p],
        rightUrl: null,
        displayNumber: p + 1,
        label: `Page ${p + 1}`
      });
    }

    return list;
  }, [currentTemplatePageUrls]);

  const safeSpreadIndex = Math.min(Math.max(0, currentSpreadIndex), Math.max(0, spreads.length - 1));
  const activeSpread = spreads[safeSpreadIndex] || null;

  // Pages list for Page Selection Modal
  const modalTemplatePages = useMemo(() => {
    const tpl = selectedTemplateItem || selectedTemplate;
    if (!tpl) return [];
    if (Array.isArray(tpl.pageUrls) && tpl.pageUrls.length > 0) {
      return tpl.pageUrls.map((url, idx) => ({
        index: idx,
        pageNumber: idx + 1,
        name: `Page ${idx + 1}`,
        url
      }));
    }
    if (Array.isArray(tpl.pages) && typeof tpl.pages[0] === 'string') {
      return tpl.pages.map((url, idx) => ({
        index: idx,
        pageNumber: idx + 1,
        name: `Page ${idx + 1}`,
        url
      }));
    }
    if (tpl.folder) {
      const pCount = tpl.pagesCount || (typeof tpl.pages === 'number' ? tpl.pages : 12);
      return Array.from({ length: pCount }, (_, idx) => ({
        index: idx,
        pageNumber: idx + 1,
        name: `Page ${idx + 1}`,
        url: getBookPageUrl(tpl.folder, idx + 1)
      }));
    }
    return tpl.preview ? [{ index: 0, pageNumber: 1, name: 'Page 1', url: tpl.preview }] : [];
  }, [selectedTemplateItem, selectedTemplate]);

  // Open Page Selection Modal (Exact match to user screenshot)
  const handleOpenPageSelectModal = (tpl) => {
    const target = tpl || selectedTemplate;
    setSelectedCardId(target?.id);
    setSelectedTemplateItem(target);

    const count =
      target?.pageUrls?.length ||
      (Array.isArray(target?.pages)
        ? target.pages.length
        : typeof target?.pages === 'number'
        ? target.pages
        : target?.pagesCount || 12);

    // Default: all pages selected
    setModalSelectedPages(new Set(Array.from({ length: count }, (_, i) => i)));
    setModalPreviewPageIndex(0);
    setModalPaperSize(target?.dim || 'A4 (Portrait)');
    setModalPlacement('after');
    setModalTargetPageIndex(3);
    setIsPageSelectModalOpen(true);
  };

  const toggleModalPageSelection = (idx, e) => {
    if (e) e.stopPropagation();
    setModalPreviewPageIndex(idx);
    setModalSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const toggleModalSelectAll = () => {
    if (modalSelectedPages.size === modalTemplatePages.length) {
      setModalSelectedPages(new Set());
    } else {
      setModalSelectedPages(new Set(modalTemplatePages.map((_, i) => i)));
    }
  };

  // Directly create flipbook from preview panel with chosen pages, size, and orientation
  const handleDirectUseTemplate = async () => {
    if (!selectedTemplate) return;
    if (previewSelectedPages.size === 0) {
      alert('Please select at least one page to create your flipbook.');
      return;
    }

    setIsCreating(true);

    const chosenTpl = selectedTemplate;
    const sortedIndices = Array.from(previewSelectedPages).sort((a, b) => a - b);
    const chosenUrls = sortedIndices.map((idx) => currentTemplatePageUrls[idx]).filter(Boolean);

    // Get exact dimensions and orientation matching CreateFlipbookModal.jsx
    const dims = getTemplateDimensions(selectedPaperSizeId, selectedOrientation);
    const targetW = dims.width;
    const targetH = dims.height;
    const isSquare = selectedPaperSizeId === 'square';
    const finalOrientation = isSquare ? 'square' : selectedOrientation;

    // Fetch and format ONLY the SELECTED pages in parallel
    const formattedPagesContent = await Promise.all(
      chosenUrls.map(async (url, i) => {
        if (url) {
          try {
            const svgRes = await fetch(url);
            if (svgRes.ok) {
              const rawSvgText = await svgRes.text();
              return formatTemplateSvgToPageSvg(
                rawSvgText,
                targetW,
                targetH,
                `Page ${i + 1}`
              );
            }
          } catch (err) {
            console.error(`Failed to fetch page SVG from ${url}:`, err);
          }
        }
        return '';
      })
    );

    const pages = formattedPagesContent.map((content, i) => ({
      pageName: `Page ${i + 1}`,
      content: content || '',
      html: content || ''
    }));

    const finalFlipbookName = `${chosenTpl?.title || 'Flipbook'}_${Date.now()}`;
    const targetFolder = 'My_Flipbooks';

    const payload = {
      emailId,
      flipbookName: finalFlipbookName,
      pages,
      overwrite: true,
      folderName: targetFolder,
      meta: {
        width: targetW,
        height: targetH,
        templateId: selectedPaperSizeId,
        orientation: finalOrientation,
        templateName: chosenTpl?.title || ''
      }
    };

    const navState = {
      initialTemplateSvg: formattedPagesContent[0] || '',
      templatePages: formattedPagesContent,
      pageCount: chosenUrls.length,
      folderName: targetFolder,
      flipbookName: finalFlipbookName,
      templateName: chosenTpl?.title || '',
      width: targetW,
      height: targetH,
      orientation: finalOrientation,
      templateId: selectedPaperSizeId,
      paperSize: `${PREVIEW_PAPER_SIZES.find(p => p.id === selectedPaperSizeId)?.label || 'A4'} (${finalOrientation})`
    };

    try {
      const res = await axios.post(`${backendUrl}/api/flipbook/save`, payload);
      setIsCreating(false);
      if (res.data && res.data.v_id) {
        navigate(`/editor/${encodeURIComponent(targetFolder)}/${res.data.v_id}`, {
          state: navState
        });
      } else {
        navigate('/editor', {
          state: navState
        });
      }
    } catch (err) {
      console.error('Failed to create flipbook from template:', err);
      setIsCreating(false);
      navigate('/editor', {
        state: navState
      });
    }
  };

  // Submit adding selected pages into flipbook and navigate to Editor
  const handleConfirmAddToFlipbook = async () => {
    if (modalSelectedPages.size === 0) return;
    setIsPageSelectModalOpen(false);
    setIsCreating(true);

    const chosenTpl = selectedTemplateItem || selectedTemplate;
    const sortedIndices = Array.from(modalSelectedPages).sort((a, b) => a - b);
    const chosenPages = sortedIndices.map((idx) => modalTemplatePages[idx]).filter(Boolean);

    // Get width & height from modalPaperSize
    const chosenPaperOption =
      PAPER_SIZE_OPTIONS.find((p) => p.label === modalPaperSize) || PAPER_SIZE_OPTIONS[0];
    const targetW = chosenPaperOption.width || 210;
    const targetH = chosenPaperOption.height || 297;

    // Fetch and format the SELECTED pages in parallel
    const formattedPagesContent = await Promise.all(
      chosenPages.map(async (p, i) => {
        const url = p.url;
        if (url) {
          try {
            const svgRes = await fetch(url);
            if (svgRes.ok) {
              const rawSvgText = await svgRes.text();
              return formatTemplateSvgToPageSvg(
                rawSvgText,
                targetW,
                targetH,
                p.name || `Page ${i + 1}`
              );
            }
          } catch (err) {
            console.error(`Failed to fetch page SVG from ${url}:`, err);
          }
        }
        return '';
      })
    );

    const pages = formattedPagesContent.map((content, i) => ({
      pageName: `Page ${i + 1}`,
      content: content || '',
      html: content || ''
    }));

    const finalFlipbookName = `${chosenTpl?.title || 'Flipbook'}_${Date.now()}`;
    const targetFolder = 'My_Flipbooks';

    const payload = {
      emailId,
      flipbookName: finalFlipbookName,
      pages,
      overwrite: true,
      folderName: targetFolder,
      meta: {
        width: targetW,
        height: targetH,
        templateId: chosenTpl?.templateId || chosenTpl?.formatId || 'corporate',
        orientation: targetW > targetH ? 'landscape' : 'portrait',
        templateName: chosenTpl?.title || ''
      }
    };

    const navState = {
      initialTemplateSvg: formattedPagesContent[0] || '',
      templatePages: formattedPagesContent,
      pageCount: chosenPages.length,
      folderName: targetFolder,
      flipbookName: finalFlipbookName,
      templateName: chosenTpl?.title || '',
      width: targetW,
      height: targetH,
      orientation: targetW > targetH ? 'landscape' : 'portrait',
      paperSize: modalPaperSize
    };

    try {
      const res = await axios.post(`${backendUrl}/api/flipbook/save`, payload);
      setIsCreating(false);
      if (res.data && res.data.v_id) {
        navigate(`/editor/${encodeURIComponent(targetFolder)}/${res.data.v_id}`, {
          state: navState
        });
      } else {
        navigate('/editor', {
          state: navState
        });
      }
    } catch (err) {
      console.error('Failed to create flipbook from template:', err);
      setIsCreating(false);
      navigate('/editor', {
        state: navState
      });
    }
  };

  // Open / Focus Preview panel
  const handleOpenPreview = (tpl) => {
    if (tpl) {
      setSelectedCardId(tpl.id);
    }
    setCurrentFlipPage(0);
    setBookTranslateX('-25%');
    if (flipBookRef.current?.pageFlip()) {
      try {
        flipBookRef.current.pageFlip().turnToPage(0);
      } catch {}
    }
    setIsPreviewOpen(true);
  };

  // Submit template creation and navigate to Editor (loads ALL pages of the book)
  const handleUseTemplate = async (templateData) => {
    setIsCreateModalOpen(false);
    if (!templateData) return;
    setIsCreating(true);

    const chosenTpl = selectedTemplateItem || allTemplates.find(t => t.id === selectedCardId) || allTemplates[0];
    const targetW = templateData.width || chosenTpl?.width || 210;
    const targetH = templateData.height || chosenTpl?.height || 297;

    // Determine list of page URLs for this book
    let pageUrls = [];
    if (Array.isArray(chosenTpl?.pageUrls) && chosenTpl.pageUrls.length > 0) {
      pageUrls = chosenTpl.pageUrls;
    } else if (Array.isArray(chosenTpl?.pages) && typeof chosenTpl.pages[0] === 'string') {
      pageUrls = chosenTpl.pages;
    } else if (chosenTpl?.folder) {
      const pCount = chosenTpl.pagesCount || (typeof chosenTpl?.pages === 'number' ? chosenTpl.pages : 12);
      pageUrls = Array.from({ length: pCount }, (_, i) => getBookPageUrl(chosenTpl.folder, i + 1));
    } else if (chosenTpl?.preview) {
      pageUrls = [chosenTpl.preview];
    }

    // Always use all pages of the book (minimum of pageUrls.length or templateData.pageCount)
    const totalPageCount = Math.max(
      pageUrls.length,
      templateData.pageCount || 0,
      typeof chosenTpl?.pages === 'number' ? chosenTpl.pages : 1
    );

    // Fetch and format ALL pages in parallel
    const formattedPagesContent = await Promise.all(
      Array.from({ length: totalPageCount }, async (_, i) => {
        const url = pageUrls[i];
        if (url) {
          try {
            const svgRes = await fetch(url);
            if (svgRes.ok) {
              const rawSvgText = await svgRes.text();
              return formatTemplateSvgToPageSvg(
                rawSvgText,
                targetW,
                targetH,
                `Page ${i + 1}`
              );
            }
          } catch (err) {
            console.error(`Failed to fetch page ${i + 1} SVG from ${url}:`, err);
          }
        }
        return '';
      })
    );

    const pages = formattedPagesContent.map((content, i) => ({
      pageName: `Page ${i + 1}`,
      content: content || '',
      html: content || ''
    }));

    const finalFlipbookName = templateData.flipbookName || `Flipbook_${Date.now()}`;
    const targetFolder = 'My_Flipbooks';

    const payload = {
      emailId,
      flipbookName: finalFlipbookName,
      pages,
      overwrite: true,
      folderName: targetFolder,
      meta: {
        width: targetW,
        height: targetH,
        templateId: templateData.templateId || chosenTpl?.templateId || 'corporate',
        orientation: templateData.orientation || 'portrait',
        templateName: chosenTpl?.title || ''
      }
    };

    const navState = {
      ...templateData,
      initialTemplateSvg: formattedPagesContent[0] || '',
      templatePages: formattedPagesContent,
      pageCount: totalPageCount,
      folderName: targetFolder,
      flipbookName: finalFlipbookName,
      templateName: chosenTpl?.title || '',
      width: targetW,
      height: targetH
    };

    try {
      const res = await axios.post(`${backendUrl}/api/flipbook/save`, payload);
      setIsCreating(false);
      if (res.data && res.data.v_id) {
        navigate(`/editor/${encodeURIComponent(targetFolder)}/${res.data.v_id}`, {
          state: navState
        });
      } else {
        navigate('/editor', {
          state: navState
        });
      }
    } catch (err) {
      console.error('Failed to create flipbook from template:', err);
      setIsCreating(false);
      navigate('/editor', {
        state: navState
      });
    }
  };

  return (
    <div className="h-full max-h-[92vh] bg-[#fafafa] text-gray-800 flex flex-col select-none relative overflow-hidden">
      {/* Soft warm background aura matching screenshot */}
      <div className="absolute top-[4vw] left-1/2 -translate-x-1/2 w-[45vw] h-[22vw] bg-gradient-to-r from-red-100/30 via-orange-100/20 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Main 2-Column Responsive Layout with Smooth Synchronized Transition */}
      <div className="w-full px-[1.5vw] py-[0.8vw] flex-1 flex items-stretch overflow-hidden gap-[1.2vw]">
        {/* Left Section: Templates Header + Filter Toolbar + Categories + Grid */}
        <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
          {/* Header inside Left Column */}
          <div className="flex-shrink-0 pt-[0.2vw] pb-[0.6vw] border-b border-gray-200/80 mb-[0.8vw]">
            {/* Top Row: Title + Controls */}
            <div className="flex items-center justify-between gap-[0.8vw]">
              {/* Title & Subtitle */}
              <div className="flex-shrink-0">
                <h1 className="text-[1.85vw] font-bold text-gray-900 tracking-tight leading-tight">
                  Templates
                </h1>
                <p className="text-[0.85vw] text-gray-400 font-normal mt-[0.2vw] whitespace-nowrap">
                  Choose a template and create stunning flipbooks in seconds.
                </p>
              </div>

              {/* Right Controls: Search, Filter, Sort by */}
              <div className="flex items-center gap-[0.5vw] flex-shrink-0">
                {/* Search Input */}
                <div className="relative flex items-center">
                  <Search className="w-[0.9vw] h-[0.9vw] text-[#ea543a] absolute left-[0.75vw] pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search Flipbook..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-[11.5vw] 2xl:w-[13.5vw] pl-[2.2vw] pr-[1.8vw] py-[0.45vw] bg-white border border-gray-200 rounded-[0.55vw] text-[0.82vw] text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#ea543a] shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-[0.6vw] text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-[0.8vw] h-[0.8vw]" />
                    </button>
                  )}
                </div>

                {/* Filter Button & Popover */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setIsFilterOpen(!isFilterOpen);
                      setIsSortOpen(false);
                    }}
                    className="flex items-center gap-[0.45vw] px-[0.9vw] py-[0.48vw] bg-white border border-gray-200 rounded-[0.55vw] text-[0.82vw] text-gray-700 font-medium hover:bg-gray-50 shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer transition-colors"
                  >
                    <Filter className="w-[0.9vw] h-[0.9vw] text-[#ea543a]" />
                    <span>Filter</span>
                    <ChevronDown className="w-[0.85vw] h-[0.85vw] text-gray-500" />
                  </button>

                  {isFilterOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
                      <div className="absolute right-0 top-full mt-[0.4vw] bg-white border border-gray-200 rounded-[0.6vw] shadow-xl z-50 p-[0.75vw] min-w-[14vw]">
                        <span className="text-[0.72vw] font-bold text-gray-400 uppercase tracking-wider block mb-[0.5vw]">
                          Page Formats
                        </span>
                        <div className="flex flex-col gap-[0.3vw]">
                          {FORMAT_OPTIONS.map(fmt => (
                            <button
                              key={fmt.id}
                              onClick={() => {
                                setSelectedFormat(fmt.id);
                                setIsFilterOpen(false);
                              }}
                              className={`w-full text-left px-[0.7vw] py-[0.45vw] rounded-[0.45vw] text-[0.8vw] font-medium flex items-center justify-between transition-colors cursor-pointer ${
                                selectedFormat === fmt.id
                                  ? 'bg-red-50 text-[#ea543a] font-semibold'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <span>{fmt.label}</span>
                              {selectedFormat === fmt.id && <Check className="w-[0.85vw] h-[0.85vw] text-[#ea543a]" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Sort By Button & Popover */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setIsSortOpen(!isSortOpen);
                      setIsFilterOpen(false);
                    }}
                    className="flex items-center gap-[0.45vw] px-[0.9vw] py-[0.48vw] bg-white border border-gray-200 rounded-[0.55vw] text-[0.82vw] text-gray-700 font-medium hover:bg-gray-50 shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer transition-colors"
                  >
                    <ArrowUpDown className="w-[0.9vw] h-[0.9vw] text-[#ea543a]" />
                    <span className="text-gray-500">Sort by :</span>
                    <span className="font-semibold text-gray-800">
                      {SORT_OPTIONS.find(s => s.id === sortBy)?.label || 'Most Popular'}
                    </span>
                    <ChevronDown className="w-[0.85vw] h-[0.85vw] text-gray-500" />
                  </button>

                  {isSortOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
                      <div className="absolute right-0 top-full mt-[0.4vw] bg-white border border-gray-200 rounded-[0.6vw] shadow-xl z-50 p-[0.5vw] min-w-[13vw]">
                        {SORT_OPTIONS.map(opt => (
                          <button
                            key={opt.id}
                            onClick={() => {
                              setSortBy(opt.id);
                              setIsSortOpen(false);
                            }}
                            className={`w-full text-left px-[0.7vw] py-[0.45vw] rounded-[0.45vw] text-[0.8vw] font-medium flex items-center justify-between transition-colors cursor-pointer ${
                              sortBy === opt.id
                                ? 'bg-red-50 text-[#ea543a] font-semibold'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {sortBy === opt.id && <Check className="w-[0.85vw] h-[0.85vw] text-[#ea543a]" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Category Filter Pills Row */}
            <div className="flex items-center gap-[0.5vw] overflow-x-auto custom-scrollbar mt-[0.75vw] pb-[0.2vw]">
              {CATEGORIES.map(cat => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-[0.95vw] py-[0.45vw] rounded-[0.55vw] text-[0.82vw] font-medium whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#ea543a] text-white shadow-sm'
                        : 'bg-white border border-gray-200 hover:border-gray-300 text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Templates Grid with automatic responsive adjustment - ONLY scrollable container */}
          {filteredTemplates.length === 0 ? (
            <div className="w-full bg-white rounded-[0.8vw] border border-gray-200 p-[3vw] mt-[0.5vw] flex flex-col items-center justify-center text-center">
              <div className="w-[3vw] h-[3vw] rounded-full bg-red-50 text-[#ea543a] flex items-center justify-center mb-[0.8vw]">
                <Filter className="w-[1.5vw] h-[1.5vw]" />
              </div>
              <h3 className="text-[1vw] font-bold text-gray-900">No Templates Found</h3>
              <p className="text-[0.75vw] text-gray-500 max-w-[25vw] mt-[0.25vw] mb-[1vw]">
                No templates matched your search for "{searchQuery}" in category "{selectedCategory}".
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSelectedFormat('all');
                }}
                className="px-[1vw] py-[0.5vw] bg-[#ea543a] text-white rounded-[0.5vw] text-[0.75vw] font-semibold hover:bg-[#d9482f] transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-[0.4vw] pb-[1vw]">
              <div className="grid gap-[0.9vw] grid-cols-[repeat(auto-fill,12.8vw)]">
                {filteredTemplates.map((tpl) => {
                  const isSelected = selectedCardId === tpl.id;
                  const isLiked = favorites.has(tpl.id);

                  return (
                    <div
                      key={tpl.id}
                      onClick={() => {
                        handleOpenPreview(tpl);
                      }}
                      className={`w-[12.8vw] bg-white rounded-[0.8vw] border p-[0.6vw] flex flex-col hover:shadow-lg relative group cursor-pointer transition-shadow duration-150 ${
                        isSelected
                          ? 'border-[#ea543a] ring-2 ring-[#ea543a]/30 shadow-md'
                          : 'border-gray-200/90 hover:border-gray-300 shadow-sm'
                      }`}
                    >
                      {/* Card Visual / Thumbnail Cover */}
                      <div className="relative w-full aspect-[4/3.8] rounded-[0.6vw] overflow-hidden bg-gray-950 flex items-center justify-center">
                        <img
                          src={tpl.preview}
                          alt={tpl.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />

                        {/* Favorite Heart Icon Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(tpl.id);
                          }}
                          className="absolute top-[0.5vw] right-[0.5vw] w-[1.6vw] h-[1.6vw] rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm z-10 transition-colors cursor-pointer"
                          title={isLiked ? 'Remove from favorites' : 'Save to favorites'}
                        >
                          <Heart
                            className={`w-[0.9vw] h-[0.9vw] ${
                              isLiked
                                ? 'fill-[#ea543a] text-[#ea543a]'
                                : 'text-gray-700 hover:text-[#ea543a]'
                            }`}
                          />
                        </button>

                      </div>

                      {/* Card Details: Title, Page Count, Badge */}
                      <div className="pt-[0.5vw] px-[0.2vw] flex flex-col flex-1 justify-between">
                        <h3 
                          className="text-[0.8vw] font-semibold text-gray-900 truncate leading-snug"
                          title={tpl.title}
                        >
                          {tpl.title}
                        </h3>
                        <div className="flex items-center gap-[0.4vw] mt-[0.25vw] text-[0.7vw]">
                          <span className="text-gray-400 font-normal">
                            {tpl.pages} Pages
                          </span>
                          <span className="text-gray-300">|</span>
                          <span className="bg-[#FEF2F2] text-[#ea543a] px-[0.4vw] py-[0.1vw] rounded-[0.2vw] text-[0.65vw] font-medium leading-none">
                            {tpl.badge || tpl.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Section: Book View Flipbook Preview Panel - Full Height Locked with Padding */}
        <aside
          className={`flex-shrink-0 h-full flex flex-col transition-[width,margin,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isPreviewOpen && selectedTemplate
              ? 'w-[32vw] opacity-100 pointer-events-auto'
              : 'w-0 opacity-0 pointer-events-none'
          }`}
        >
          <div className="w-[32vw] h-full flex flex-col bg-white border border-gray-200/90 rounded-[0.8vw] px-[1.1vw] pt-[1.1vw] pb-[0.85vw] shadow-sm overflow-hidden">
                {/* Header: Title, Eye icon, Close/Collapse Button */}
                <div className="flex items-center justify-between pb-[0.5vw] border-b border-gray-100 flex-shrink-0">
                  <div>
                    <div className="flex items-center gap-[0.4vw]">
                      <Eye className="w-[1.1vw] h-[1.1vw] text-gray-800" />
                      <h2 className="text-[1.15vw] font-bold text-gray-900 leading-tight">Preview</h2>
                    </div>
                    <p className="text-[0.68vw] text-gray-400 mt-[0.15vw]">
                      Choose a template and create stunning flipbooks in seconds.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="p-[0.3vw] rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                    title="Close Preview"
                  >
                    <ArrowRight className="w-[1vw] h-[1vw]" />
                  </button>
                </div>

                {/* Center Book Spread View with 3D Flip Physics (TurnJS / HTMLFlipBook) */}
                <div className="w-full bg-[#f8fafc] border border-gray-100 rounded-[0.7vw] p-[0.5vw] flex flex-col items-center justify-center flex-1 min-h-[22vh] relative my-[0.35vw] overflow-hidden select-none">
                  {/* Navigation Left Arrow */}
                  <button
                    onClick={() => {
                      const pageFlip = flipBookRef.current?.pageFlip();
                      const curr = pageFlip?.getCurrentPageIndex() ?? currentFlipPage;
                      if (curr <= 2) {
                        setBookTranslateX('-25%');
                      } else if (bookPages.length > 1 && curr >= bookPages.length - 1) {
                        setBookTranslateX('0%');
                      }
                      pageFlip?.flipPrev();
                    }}
                    disabled={currentFlipPage <= 0}
                    className="absolute left-[0.5vw] top-1/2 -translate-y-1/2 z-30 w-[1.7vw] h-[1.7vw] rounded-full bg-white/95 hover:bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-900 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-[1vw] h-[1vw]" />
                  </button>

                  {/* Navigation Right Arrow */}
                  <button
                    onClick={() => {
                      const pageFlip = flipBookRef.current?.pageFlip();
                      const curr = pageFlip?.getCurrentPageIndex() ?? currentFlipPage;
                      if (curr === 0) {
                        setBookTranslateX('0%');
                      } else if (bookPages.length > 1 && curr >= bookPages.length - 3) {
                        setBookTranslateX('25%');
                      }
                      pageFlip?.flipNext();
                    }}
                    disabled={currentFlipPage >= bookPages.length - 1}
                    className="absolute right-[0.5vw] top-1/2 -translate-y-1/2 z-30 w-[1.7vw] h-[1.7vw] rounded-full bg-white/95 hover:bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-900 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
                    title="Next Page"
                  >
                    <ChevronRight className="w-[1vw] h-[1vw]" />
                  </button>

                  {/* 3D Interactive Flipbook Container with Smooth Auto-Centering */}
                  <div 
                    className="relative h-full aspect-[2/1.36] max-h-[38vh] flex items-center justify-center drop-shadow-[0_8px_18px_rgba(0,0,0,0.13)] transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] will-change-transform"
                    style={{
                      transform: `translateX(${bookTranslateX})`,
                    }}
                  >
                    <HTMLFlipBook
                      key={`${selectedTemplate.id}-${bookPages.length}`}
                      ref={flipBookRef}
                      width={380}
                      height={540}
                      size="stretch"
                      minWidth={130}
                      maxWidth={560}
                      minHeight={150}
                      maxHeight={460}
                      maxShadowOpacity={0.45}
                      showCover={true}
                      mobileScrollSupport={true}
                      useMouseEvents={true}
                      clickEventForward={true}
                      flippingTime={600}
                      usePortrait={false}
                      onChangeState={handleFlipStateChange}
                      onFlip={handleFlipChange}
                      style={{ background: 'transparent' }}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      {bookPages.map((url, idx) => (
                        <FlipBookPage key={idx} src={url} pageNum={idx + 1} />
                      ))}
                    </HTMLFlipBook>
                  </div>
                </div>

                {/* Spread Counter (e.g. 1 / 12 or 4-5 / 12) */}
                <div className="text-[0.72vw] text-gray-600 font-semibold text-center flex-shrink-0 leading-none mb-[0.35vw]">
                  {currentFlipPage === 0
                    ? `1 / ${currentTemplatePageUrls.length || selectedTemplate.pages}`
                    : currentFlipPage >= (currentTemplatePageUrls.length || selectedTemplate.pages) - 1
                      ? `${currentTemplatePageUrls.length || selectedTemplate.pages} / ${currentTemplatePageUrls.length || selectedTemplate.pages}`
                      : `${currentFlipPage + 1}-${Math.min(currentFlipPage + 2, currentTemplatePageUrls.length || selectedTemplate.pages)} / ${currentTemplatePageUrls.length || selectedTemplate.pages}`
                  }
                </div>

                {/* Horizontal Carousel of Individual Page Thumbnails with Selection Badges */}
                <div className="flex items-center gap-[0.4vw] w-full flex-shrink-0 mb-[0.6vw]">
                  {/* Carousel Scroll Left Button */}
                  <button
                    type="button"
                    onClick={() => scrollThumbnails('left')}
                    className="w-[1.6vw] h-[1.6vw] rounded-full border border-gray-200 hover:border-[#ea543a] bg-white flex items-center justify-center flex-shrink-0 text-[#ea543a] hover:bg-red-50 shadow-xs transition-all cursor-pointer"
                    title="Previous Thumbnails"
                  >
                    <ChevronLeft className="w-[0.9vw] h-[0.9vw]" />
                  </button>

                  {/* Horizontal Scrollable Thumbnails Strip */}
                  <div
                    ref={thumbCarouselRef}
                    className="flex items-center gap-[0.5vw] overflow-x-auto custom-scrollbar py-[0.25vw] px-[0.2vw] flex-1 scroll-smooth"
                  >
                    {currentTemplatePageUrls.map((url, idx) => {
                      const isSelected = previewSelectedPages.has(idx);
                      const isCurrentPage = currentFlipPage === idx || (currentFlipPage > 0 && (currentFlipPage === idx || currentFlipPage + 1 === idx));

                      return (
                        <div
                          key={idx}
                          onClick={() => handleThumbnailClick(idx)}
                          className={`relative flex-shrink-0 w-[3.2vw] aspect-[1/1.32] bg-white rounded-[0.4vw] border overflow-hidden cursor-pointer transition-all duration-150 flex flex-col items-center justify-between p-[0.25vw] shadow-2xs ${
                            isCurrentPage
                              ? 'border-[#ea543a] ring-2 ring-[#ea543a]/30 shadow-xs'
                              : isSelected
                                ? 'border-gray-200 hover:border-gray-300'
                                : 'border-gray-200 opacity-60 hover:opacity-100'
                          }`}
                        >
                          {/* Top-Right Round Selection Checkbox */}
                          <button
                            type="button"
                            onClick={(e) => togglePreviewPageSelection(idx, e)}
                            className="absolute top-[0.18vw] right-[0.18vw] z-10 cursor-pointer"
                            title={isSelected ? `Deselect Page ${idx + 1}` : `Select Page ${idx + 1}`}
                          >
                            {isSelected ? (
                              <div className="w-[0.95vw] h-[0.95vw] rounded-full bg-[#ea543a] text-white flex items-center justify-center shadow-xs transition-transform hover:scale-110">
                                <Check size="0.6vw" strokeWidth={3} />
                              </div>
                            ) : (
                              <div className="w-[0.95vw] h-[0.95vw] rounded-full border-[1.5px] border-[#ea543a] bg-white hover:bg-orange-50 transition-colors" />
                            )}
                          </button>

                          {/* Thumbnail Image */}
                          <div className="w-full flex-1 flex items-center justify-center overflow-hidden rounded-[0.2vw]">
                            <img
                              src={url}
                              alt={`Page ${idx + 1}`}
                              className="w-full h-full object-contain pointer-events-none"
                              loading="lazy"
                            />
                          </div>

                          {/* Page Number at bottom */}
                          <div className="text-[0.62vw] font-semibold text-gray-700 leading-none pt-[0.15vw]">
                            {idx + 1}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Carousel Scroll Right Button */}
                  <button
                    type="button"
                    onClick={() => scrollThumbnails('right')}
                    className="w-[1.6vw] h-[1.6vw] rounded-full border border-gray-200 hover:border-[#ea543a] bg-white flex items-center justify-center flex-shrink-0 text-[#ea543a] hover:bg-red-50 shadow-xs transition-all cursor-pointer"
                    title="Next Thumbnails"
                  >
                    <ChevronRight className="w-[0.9vw] h-[0.9vw]" />
                  </button>
                </div>

                {/* Bottom Controls Area: Title, Page Count, Dropdowns, and CTA Button with Equal Spacing */}
                <div className="flex flex-col gap-[0.65vw] flex-shrink-0 pt-[0.65vw] border-t border-gray-100">
                  {/* Row 1: Title & Badge Row with Favorite Heart Button */}
                  <div className="flex items-center justify-between w-full min-w-0">
                    <div className="flex items-center gap-[0.5vw] min-w-0">
                      <h2 className="text-[1.15vw] font-bold text-gray-900 tracking-tight leading-none truncate">
                        {selectedTemplate.title}
                      </h2>
                      <span className="px-[0.55vw] py-[0.18vw] bg-[#FEF2F2] text-[#ea543a] text-[0.7vw] font-semibold rounded-[0.28vw] leading-none flex-shrink-0">
                        {selectedTemplate.badge || selectedTemplate.category}
                      </span>
                    </div>

                    {/* Favorite Heart Button */}
                    <button
                      onClick={() => toggleFavorite(selectedTemplate.id)}
                      className="w-[1.7vw] h-[1.7vw] rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center flex-shrink-0 shadow-xs transition-colors cursor-pointer"
                      title={favorites.has(selectedTemplate.id) ? 'Remove from favorites' : 'Save to favorites'}
                    >
                      <Heart
                        className={`w-[0.85vw] h-[0.85vw] ${
                          favorites.has(selectedTemplate.id)
                            ? 'fill-[#ea543a] text-[#ea543a]'
                            : 'text-gray-400 hover:text-[#ea543a]'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Row 2: Page Count */}
                  <div className="flex items-center gap-[0.5vw] text-[0.75vw] text-gray-700 font-medium">
                    <div className="w-[1.1vw] text-gray-500 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-[0.9vw] h-[0.9vw]" />
                    </div>
                    <span>
                      <strong className="text-gray-900">{previewSelectedPages.size}</strong> {previewSelectedPages.size === 1 ? 'page' : 'pages'} selected
                      {previewSelectedPages.size !== currentTemplatePageUrls.length && (
                        <span className="text-gray-400 font-normal ml-[0.3vw]">
                          (of {currentTemplatePageUrls.length})
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Row 3: Size & Orientation Dropdowns with Equal 50/50 Grid Width */}
                  <div className="flex items-center gap-[0.5vw]">
                    <div className="w-[1.1vw] text-gray-500 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-[0.9vw] h-[0.9vw]" />
                    </div>

                    {/* Equal 50% / 50% 2-column grid */}
                    <div className="grid grid-cols-2 gap-[0.5vw] flex-1 min-w-0">
                      {/* Custom Paper Size Dropdown - 50% width */}
                      <div ref={sizeDropdownRef} className="relative w-full min-w-0">
                        <button
                          type="button"
                          onClick={() => {
                            setIsSizeDropdownOpen((prev) => !prev);
                            setIsOrientDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between bg-white border rounded-[0.4vw] pl-[0.7vw] pr-[0.6vw] py-[0.38vw] text-[0.75vw] font-medium transition-all shadow-2xs cursor-pointer select-none ${
                            isSizeDropdownOpen
                              ? 'border-[#ea543a] ring-2 ring-[#ea543a]/20 text-[#ea543a]'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <span className="truncate">
                            {PREVIEW_PAPER_SIZES.find((opt) => opt.id === selectedPaperSizeId)?.label || 'A4 (210 × 297 mm)'}
                          </span>
                          <ChevronDown
                            className={`w-[0.8vw] h-[0.8vw] flex-shrink-0 ml-[0.3vw] transition-transform duration-200 ${
                              isSizeDropdownOpen ? 'rotate-180 text-[#ea543a]' : 'text-gray-400'
                            }`}
                          />
                        </button>

                        {/* Custom Dropdown Menu (Opens Upward to prevent screen overflow) */}
                        {isSizeDropdownOpen && (
                          <div className="absolute bottom-full left-0 right-0 mb-[0.35vw] bg-white border border-gray-200 rounded-[0.5vw] shadow-xl py-[0.3vw] z-50 max-h-[14vw] overflow-y-auto custom-scrollbar">
                            {PREVIEW_PAPER_SIZES.map((opt) => {
                              const isSelected = selectedPaperSizeId === opt.id;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedPaperSizeId(opt.id);
                                    if (opt.id === 'square') {
                                      setSelectedOrientation('portrait');
                                    }
                                    setIsSizeDropdownOpen(false);
                                  }}
                                  className={`w-full px-[0.7vw] py-[0.38vw] text-left text-[0.75vw] flex items-center justify-between transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#FEF2F2] text-[#ea543a] font-semibold'
                                      : 'text-gray-700 hover:bg-gray-50 font-normal'
                                  }`}
                                >
                                  <span className="truncate">{opt.label}</span>
                                  {isSelected && (
                                    <Check className="w-[0.75vw] h-[0.75vw] text-[#ea543a] flex-shrink-0 ml-[0.3vw]" strokeWidth={2.5} />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Custom Orientation Dropdown - 50% width */}
                      <div ref={orientDropdownRef} className="relative w-full min-w-0">
                        <button
                          type="button"
                          disabled={selectedPaperSizeId === 'square'}
                          onClick={() => {
                            if (selectedPaperSizeId !== 'square') {
                              setIsOrientDropdownOpen((prev) => !prev);
                              setIsSizeDropdownOpen(false);
                            }
                          }}
                          className={`w-full flex items-center justify-between bg-white border rounded-[0.4vw] pl-[0.7vw] pr-[0.6vw] py-[0.38vw] text-[0.75vw] font-medium transition-all shadow-2xs select-none ${
                            selectedPaperSizeId === 'square'
                              ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-500'
                              : isOrientDropdownOpen
                                ? 'border-[#ea543a] ring-2 ring-[#ea543a]/20 text-[#ea543a] cursor-pointer'
                                : 'border-gray-200 hover:border-gray-300 text-gray-700 cursor-pointer'
                          }`}
                        >
                          <span className="truncate capitalize">
                            {selectedPaperSizeId === 'square' ? 'Square' : selectedOrientation}
                          </span>
                          <ChevronDown
                            className={`w-[0.8vw] h-[0.8vw] flex-shrink-0 ml-[0.3vw] transition-transform duration-200 ${
                              isOrientDropdownOpen ? 'rotate-180 text-[#ea543a]' : 'text-gray-400'
                            }`}
                          />
                        </button>

                        {/* Custom Dropdown Menu for Orientation */}
                        {isOrientDropdownOpen && selectedPaperSizeId !== 'square' && (
                          <div className="absolute bottom-full left-0 right-0 mb-[0.35vw] bg-white border border-gray-200 rounded-[0.5vw] shadow-xl py-[0.3vw] z-50 overflow-hidden">
                            {[
                              { id: 'portrait', label: 'Portrait' },
                              { id: 'landscape', label: 'Landscape' }
                            ].map((opt) => {
                              const isSelected = selectedOrientation === opt.id;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedOrientation(opt.id);
                                    setIsOrientDropdownOpen(false);
                                  }}
                                  className={`w-full px-[0.7vw] py-[0.38vw] text-left text-[0.75vw] flex items-center justify-between transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#FEF2F2] text-[#ea543a] font-semibold'
                                      : 'text-gray-700 hover:bg-gray-50 font-normal'
                                  }`}
                                >
                                  <span>{opt.label}</span>
                                  {isSelected && (
                                    <Check className="w-[0.75vw] h-[0.75vw] text-[#ea543a] flex-shrink-0 ml-[0.3vw]" strokeWidth={2.5} />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Bottom CTA Button: USE THIS TEMPLATE */}
                  <button
                    onClick={handleDirectUseTemplate}
                    disabled={isCreating || previewSelectedPages.size === 0}
                    className="w-full py-[0.7vw] bg-[#ea543a] hover:bg-[#d9482f] active:scale-[0.99] text-white font-bold text-[0.85vw] rounded-[0.5vw] flex items-center justify-center gap-[0.4vw] shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    {isCreating ? (
                      <>
                        <div className="w-[0.95vw] h-[0.95vw] border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Creating Flipbook ({previewSelectedPages.size} pages)...</span>
                      </>
                    ) : (
                      <>
                        <span>USE THIS TEMPLATE</span>
                        <ArrowRight className="w-[0.95vw] h-[0.95vw]" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </aside>
      </div>

      {/* Exact Page Selection Modal (Matching user screenshot) */}
      {isPageSelectModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-[2vw]"
          onClick={() => setIsPageSelectModalOpen(false)}
        >
          <div
            className="bg-white rounded-[1.2vw] shadow-2xl w-full max-w-[76vw] h-[84vh] max-h-[84vh] flex flex-col p-[1.5vw] overflow-hidden relative select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Template Title, Badge, Description, Close Button */}
            <div className="flex items-start justify-between pb-[1vw] border-b border-gray-100 flex-shrink-0">
              <div>
                <div className="flex items-center gap-[0.75vw]">
                  <h2 className="text-[1.4vw] font-bold text-gray-900 tracking-tight leading-tight">
                    {(selectedTemplateItem || selectedTemplate)?.title || 'Template Book'}
                  </h2>
                  <span className="px-[0.6vw] py-[0.15vw] bg-[#FEF2F2] text-[#ea543a] text-[0.7vw] font-semibold rounded-[0.3vw]">
                    {(selectedTemplateItem || selectedTemplate)?.badge || (selectedTemplateItem || selectedTemplate)?.category || 'Product Catalog'}
                  </span>
                </div>
                <p className="text-[0.75vw] text-gray-400 font-normal mt-[0.3vw] leading-relaxed max-w-[55vw]">
                  {(selectedTemplateItem || selectedTemplate)?.desc || 'A clean and professional template perfect for company profiles, business presentations and corporate brochures.'}
                </p>
              </div>

              {/* Red Close Button */}
              <button
                onClick={() => setIsPageSelectModalOpen(false)}
                className="p-[0.4vw] rounded-full hover:bg-red-50 text-[#ea543a] transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-[1.4vw] h-[1.4vw]" />
              </button>
            </div>

            {/* Modal Main Body: 2 Columns */}
            <div className="flex-1 flex gap-[1.8vw] pt-[1.2vw] overflow-hidden">
              {/* Left Column: Select Pages to Add Grid */}
              <div className="w-[58%] flex flex-col h-full overflow-hidden border-r border-gray-100 pr-[1.2vw]">
                {/* Header Row: Title & Select All (N) */}
                <div className="flex items-center justify-between mb-[0.8vw] flex-shrink-0">
                  <h3 className="text-[0.9vw] font-bold text-gray-800">Select Pages to Add</h3>
                  <button
                    onClick={toggleModalSelectAll}
                    className="flex items-center gap-[0.4vw] text-[0.75vw] font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                  >
                    <div
                      className={`w-[1.2vw] h-[1.2vw] rounded-full flex items-center justify-center transition-all ${
                        modalSelectedPages.size === modalTemplatePages.length && modalTemplatePages.length > 0
                          ? 'bg-[#ea543a] text-white'
                          : 'border-2 border-[#ea543a] bg-white'
                      }`}
                    >
                      {modalSelectedPages.size === modalTemplatePages.length && modalTemplatePages.length > 0 && (
                        <Check size="0.75vw" strokeWidth={3} />
                      )}
                    </div>
                    <span>Select All ({modalTemplatePages.length})</span>
                  </button>
                </div>

                {/* Pages Grid (4 Columns as in screenshot) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-[0.4vw]">
                  <div className="grid grid-cols-4 gap-[0.8vw] pb-[1vw]">
                    {modalTemplatePages.map((page, idx) => {
                      const isSelected = modalSelectedPages.has(idx);
                      const isPreviewed = modalPreviewPageIndex === idx;

                      return (
                        <div
                          key={idx}
                          onClick={() => toggleModalPageSelection(idx)}
                          className={`group aspect-[1/1.3] bg-white rounded-[0.5vw] border overflow-hidden relative cursor-pointer transition-all duration-200 flex flex-col items-center justify-center p-[0.3vw] shadow-sm hover:shadow-md ${
                            isPreviewed
                              ? 'border-[#ea543a] ring-2 ring-[#ea543a]/30'
                              : isSelected
                              ? 'border-[#ea543a]'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {/* Circular Selection Checkbox (Top-Left) */}
                          <button
                            onClick={(e) => toggleModalPageSelection(idx, e)}
                            className="absolute top-[0.4vw] left-[0.4vw] z-20 cursor-pointer"
                          >
                            <div
                              className={`w-[1.2vw] h-[1.2vw] rounded-full flex items-center justify-center transition-colors shadow-sm ${
                                isSelected
                                  ? 'bg-[#ea543a] text-white'
                                  : 'border-2 border-[#ea543a] bg-white hover:bg-orange-50'
                              }`}
                            >
                              {isSelected && <Check size="0.75vw" strokeWidth={3} />}
                            </div>
                          </button>

                          {/* Page Thumbnail Image */}
                          <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-[0.3vw] bg-white">
                            <img
                              src={page.url}
                              alt={page.name}
                              className="w-full h-full object-contain pointer-events-none"
                              loading="lazy"
                            />
                          </div>

                          {/* Page Number Indicator */}
                          <div className="absolute bottom-[0.3vw] right-[0.4vw] px-[0.4vw] py-[0.1vw] rounded-[0.2vw] bg-black/60 text-white text-[0.6vw] font-medium pointer-events-none">
                            {page.pageNumber}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Large Preview, Form Controls & Add Action */}
              <div className="w-[42%] flex flex-col justify-between h-full overflow-y-auto custom-scrollbar pl-[0.5vw]">
                {/* Large Preview Box */}
                <div className="w-full bg-[#f8fafc] border border-gray-100 rounded-[0.9vw] p-[1.2vw] flex items-center justify-center max-h-[38vh] min-h-[30vh] overflow-hidden flex-shrink-0 relative">
                  {modalTemplatePages[modalPreviewPageIndex] ? (
                    <img
                      src={modalTemplatePages[modalPreviewPageIndex].url}
                      alt={`Page ${modalPreviewPageIndex + 1} Preview`}
                      className="max-h-[34vh] max-w-full object-contain rounded-[0.4vw] shadow-lg border border-gray-200 bg-white"
                    />
                  ) : (
                    <div className="text-gray-400 text-[0.8vw]">No page selected</div>
                  )}

                  {/* Active Page Badge */}
                  <div className="absolute bottom-[0.8vw] right-[0.8vw] px-[0.6vw] py-[0.2vw] rounded-[0.3vw] bg-black/70 text-white text-[0.7vw] font-medium backdrop-blur-sm">
                    Page {modalPreviewPageIndex + 1} of {modalTemplatePages.length}
                  </div>
                </div>

                {/* Insertion Controls Form */}
                <div className="flex flex-col gap-[0.9vw] mt-[1vw]">
                  {/* Selected Pages Counter */}
                  <div className="text-[0.85vw] font-bold text-gray-800">
                    Selected Pages :{' '}
                    <span className="text-[#ea543a]">
                      {modalSelectedPages.size} {modalSelectedPages.size === 1 ? 'page' : 'pages'}
                    </span>
                  </div>

                  {/* Paper Size Selector */}
                  <div className="flex items-center gap-[0.8vw]">
                    <label className="text-[0.8vw] font-bold text-gray-800 whitespace-nowrap">Paper Size :</label>
                    <div className="relative flex-1">
                      <select
                        value={modalPaperSize}
                        onChange={(e) => setModalPaperSize(e.target.value)}
                        className="w-full appearance-none bg-white border border-gray-200 hover:border-gray-300 rounded-[0.4vw] px-[0.8vw] py-[0.4vw] text-[0.75vw] text-gray-700 font-medium focus:outline-none focus:border-[#ea543a] cursor-pointer"
                      >
                        {PAPER_SIZE_OPTIONS.map((opt) => (
                          <option key={opt.id} value={opt.label}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-[0.9vw] h-[0.9vw] text-gray-400 absolute right-[0.6vw] top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Add Pages To Section */}
                  <div>
                    <label className="block text-[0.8vw] font-bold text-gray-800 mb-[0.35vw]">Add Pages To :</label>
                    <div className="flex items-center gap-[0.6vw]">
                      {/* Placement Dropdown */}
                      <div className="relative flex-1">
                        <select
                          value={modalPlacement}
                          onChange={(e) => setModalPlacement(e.target.value)}
                          className="w-full appearance-none bg-white border border-gray-200 hover:border-gray-300 rounded-[0.4vw] px-[0.8vw] py-[0.45vw] text-[0.75vw] text-gray-700 font-medium focus:outline-none focus:border-[#ea543a] cursor-pointer"
                        >
                          <option value="after">After current page</option>
                          <option value="before">Before current page</option>
                          <option value="replace">Replace current page</option>
                          <option value="end">At the end of flipbook</option>
                          <option value="start">At the beginning of flipbook</option>
                        </select>
                        <ChevronDown className="w-[0.9vw] h-[0.9vw] text-gray-400 absolute right-[0.6vw] top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      {/* Target Page Selector */}
                      <div className="relative w-[38%]">
                        <select
                          value={modalTargetPageIndex}
                          onChange={(e) => setModalTargetPageIndex(Number(e.target.value))}
                          className="w-full appearance-none bg-white border border-gray-200 hover:border-gray-300 rounded-[0.4vw] px-[0.8vw] py-[0.45vw] text-[0.75vw] text-gray-700 font-medium focus:outline-none focus:border-[#ea543a] cursor-pointer"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                            <option key={num} value={num - 1}>
                              Page {num}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-[0.9vw] h-[0.9vw] text-gray-400 absolute right-[0.6vw] top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons Row */}
                <div className="flex items-center gap-[0.8vw] pt-[1.2vw] mt-auto">
                  <button
                    onClick={() => setIsPageSelectModalOpen(false)}
                    className="px-[1.4vw] py-[0.6vw] rounded-[0.5vw] bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[0.8vw] flex items-center justify-center gap-[0.3vw] transition-colors cursor-pointer"
                  >
                    <span>CANCEL</span>
                    <X size="0.9vw" />
                  </button>

                  <button
                    onClick={handleConfirmAddToFlipbook}
                    disabled={modalSelectedPages.size === 0}
                    className={`flex-1 py-[0.6vw] rounded-[0.5vw] bg-[#ea543a] hover:bg-[#d9482f] text-white font-bold text-[0.8vw] flex items-center justify-center gap-[0.4vw] shadow-md transition-all cursor-pointer ${
                      modalSelectedPages.size === 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <span>ADD TO FLIPBOOK</span>
                    <ArrowRight size="0.9vw" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay when generating template */}
      {isCreating && (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white select-none">
          <Loader2 className="animate-spin mb-[0.8vw] text-[#ea543a] w-[2.2vw] h-[2.2vw]" />
          <p className="text-[1vw] font-bold">Creating Flipbook with {previewSelectedPages.size} {previewSelectedPages.size === 1 ? 'Page' : 'Pages'}...</p>
          <p className="text-[0.75vw] text-gray-300 mt-[0.25vw]">Preparing canvas pages and vector artwork</p>
        </div>
      )}
    </div>
  );
}
