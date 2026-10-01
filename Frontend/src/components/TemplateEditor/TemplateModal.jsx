import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Upload, AlertCircle, ArrowLeft, Check, ChevronDown, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { getBookPageUrl } from '../../utils/templateAssets';

// Global cache to store fetched template SVG strings so they load instantly on subsequent opens
const templateCache = {};

// Rich curated metadata matching backend book folders
const TEMPLATE_METADATA = {
  interior_book: {
    title: 'Corporate Modern',
    category: 'Industrial',
    badge: 'Industrial',
    dim: 'A4 (Portrait)',
    desc: 'A clean and professional template perfect for company profiles, business presentations and corporate brochures.',
    popular: true,
    popularity: 100
  },
  mobile_book: {
    title: 'Mobile App & Tech Showcase',
    category: 'Product Catalog',
    badge: 'Product Catalog',
    dim: 'A4 (Portrait)',
    desc: 'Full 12-page digital mobile app, tech device showcase and modern product catalog booklet.',
    popular: true,
    popularity: 99
  }
};

// Default fallback list of verified backend templates
const DEFAULT_BACKEND_BOOKS = [
  {
    id: 'interior_book',
    folder: 'Interior_Book',
    title: 'Corporate Modern',
    category: 'Industrial',
    badge: 'Industrial',
    dim: 'A4 (Portrait)',
    desc: 'A clean and professional template perfect for company profiles, business presentations and corporate brochures.',
    pagesCount: 12,
    thumbnail: getBookPageUrl('Interior_Book', 1),
    pages: Array.from({ length: 12 }, (_, i) => getBookPageUrl('Interior_Book', i + 1)),
    isMultiPageBook: true
  },
  {
    id: 'mobile_book',
    folder: 'Mobile_Book',
    title: 'Mobile App & Tech Showcase',
    category: 'Product Catalog',
    badge: 'Product Catalog',
    dim: 'A4 (Portrait)',
    desc: 'Full 12-page digital mobile app, tech device showcase and modern product catalog booklet.',
    pagesCount: 12,
    thumbnail: getBookPageUrl('Mobile_Book', 1),
    pages: Array.from({ length: 12 }, (_, i) => getBookPageUrl('Mobile_Book', i + 1)),
    isMultiPageBook: true
  }
];

const PAPER_SIZES = [
  { id: 'a4_portrait', label: 'A4 (Portrait)', width: 210, height: 297 },
  { id: 'a4_landscape', label: 'A4 (Landscape)', width: 297, height: 210 },
  { id: 'a3_landscape', label: 'A3 (297 × 420 mm)', width: 420, height: 297 },
  { id: 'square', label: 'Square (210 × 210 mm)', width: 210, height: 210 },
  { id: 'letter', label: 'Letter (216 × 279 mm)', width: 216, height: 279 }
];

const TemplateModal = ({
  showTemplateModal,
  setShowTemplateModal,
  clearCanvas,
  loadTemplate,
  pages = [],
  activePageIndex = 0,
  templateTargetIndex = null,
  currentBook = null,
  flipbookDimensions = null,
  onAddTemplatePages
}) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  // Step state: null = template list view; object = page selection view
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Gallery filters & state
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dynamicBooks, setDynamicBooks] = useState(DEFAULT_BACKEND_BOOKS);
  const [uploadedTemplates, setUploadedTemplates] = useState([]);
  const [uploadError, setUploadError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Existing flipbook paper size & orientation calculation (read-only)
  const existingPaperSizeLabel = useMemo(() => {
    if (currentBook?.paperSize) return currentBook.paperSize;
    if (currentBook?.meta?.paperSize) return currentBook.meta.paperSize;

    let w = flipbookDimensions?.width;
    let h = flipbookDimensions?.height;

    if (!w || !h) {
      for (const p of pages) {
        const htmlStr = p.html || p.content || '';
        const match = htmlStr.match(/viewBox=["']\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*["']/i);
        if (match && parseFloat(match[3]) > 0 && parseFloat(match[4]) > 0) {
          w = parseFloat(match[3]);
          h = parseFloat(match[4]);
          break;
        }
      }
    }

    if (!w || !h) {
      w = currentBook?.width || 210;
      h = currentBook?.height || 297;
    }

    const bookOrientation = (
      currentBook?.orientation ||
      currentBook?.meta?.orientation ||
      (w > h ? 'landscape' : w === h ? 'square' : 'portrait')
    ).toLowerCase();

    const isClose = (val, target) => Math.abs(val - target) <= 2;

    if (isClose(w, 210) && isClose(h, 297)) return 'A4 (Portrait)';
    if (isClose(w, 297) && isClose(h, 210)) return 'A4 (Landscape)';
    if (isClose(w, 210) && isClose(h, 210)) return 'Square (210 × 210 mm)';
    if (isClose(w, 420) && isClose(h, 297)) return 'A3 (Landscape)';
    if (isClose(w, 297) && isClose(h, 420)) return 'A3 (Portrait)';
    if (isClose(w, 216) && isClose(h, 279)) return 'Letter (Portrait)';
    if (isClose(w, 279) && isClose(h, 216)) return 'Letter (Landscape)';
    if (isClose(w, 148) && isClose(h, 210)) return 'A5 (Portrait)';
    if (isClose(w, 210) && isClose(h, 148)) return 'A5 (Landscape)';

    const capitalizedOri = bookOrientation.charAt(0).toUpperCase() + bookOrientation.slice(1);
    return `${Math.round(w)} × ${Math.round(h)} mm (${capitalizedOri})`;
  }, [currentBook, flipbookDimensions, pages]);

  // Page Selection View State (Step 2)
  const [selectedPageIndices, setSelectedPageIndices] = useState(new Set());
  const [activePreviewPageIndex, setActivePreviewPageIndex] = useState(0);
  const [placement, setPlacement] = useState('start_at');
  const [targetPageIndex, setTargetPageIndex] = useState(() =>
    templateTargetIndex !== null ? templateTargetIndex : activePageIndex
  );
  const [paperSize, setPaperSize] = useState(existingPaperSizeLabel);
  const [isApplying, setIsApplying] = useState(false);

  // Sync paperSize with existingPaperSizeLabel
  useEffect(() => {
    setPaperSize(existingPaperSizeLabel);
  }, [existingPaperSizeLabel]);

  // Fetch dynamic books from backend
  useEffect(() => {
    let isMounted = true;
    const fetchBooks = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/templates/books`);
        if (isMounted && res.data?.books && Array.isArray(res.data.books) && res.data.books.length > 0) {
          const parsed = res.data.books.map(b => {
            const meta = TEMPLATE_METADATA[b.id] || {};
            const fullThumb = b.thumbnail.startsWith('http') ? b.thumbnail : `${backendUrl}${b.thumbnail}`;
            const fullPages = (b.pages || []).map(p => (p.startsWith('http') ? p : `${backendUrl}${p}`));
            return {
              id: b.id,
              folder: b.folder,
              title: meta.title || b.title || b.folder || 'Template Book',
              category: meta.category || 'Product Catalog',
              badge: meta.badge || `${b.pagesCount || 1} Pages Book`,
              dim: meta.dim || 'A4 (Portrait)',
              desc: meta.desc || `Full ${b.pagesCount || 1} page template book.`,
              pagesCount: b.pagesCount || (fullPages.length || 1),
              thumbnail: fullThumb,
              pages: fullPages,
              isMultiPageBook: b.isMultiPageBook
            };
          });
          setDynamicBooks(parsed);
        }
      } catch (err) {
        console.warn('Could not load backend template books:', err);
      }
    };
    fetchBooks();
    return () => {
      isMounted = false;
    };
  }, [backendUrl]);

  // Keep targetPageIndex in sync when opened from a specific page
  useEffect(() => {
    const activeIdx = templateTargetIndex !== null ? templateTargetIndex : activePageIndex;
    setTargetPageIndex(activeIdx >= 0 ? activeIdx : 0);
  }, [templateTargetIndex, activePageIndex]);

  // When selectedTemplate changes, initialize page selection state
  useEffect(() => {
    if (selectedTemplate) {
      const pCount = selectedTemplate.pages?.length || selectedTemplate.pagesCount || 1;
      // Default: all pages selected
      setSelectedPageIndices(new Set(Array.from({ length: pCount }, (_, i) => i)));
      setActivePreviewPageIndex(0);
    }
  }, [selectedTemplate]);

  // All combined templates
  const allTemplates = useMemo(() => {
    return [...uploadedTemplates, ...dynamicBooks];
  }, [uploadedTemplates, dynamicBooks]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(['All']);
    if (uploadedTemplates.length > 0) set.add('Uploaded');
    allTemplates.forEach(t => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [allTemplates, uploadedTemplates.length]);

  // Filtered templates in Gallery View
  const filteredTemplates = useMemo(() => {
    return allTemplates.filter(t => {
      const matchesCategory = activeTab === 'All' || t.category === activeTab;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || t.title.toLowerCase().includes(q) || (t.desc && t.desc.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [allTemplates, activeTab, searchQuery]);

  // Handle uploading custom SVG
  const handleSvgFileUpload = async (file) => {
    if (!file) return;
    setUploadError(null);

    const isSvgExt = file.name.toLowerCase().endsWith('.svg');
    const isSvgMime = file.type === 'image/svg+xml' || file.type.includes('svg');

    if (!isSvgExt && !isSvgMime) {
      setUploadError('Invalid file format. Please select an SVG file (.svg).');
      return;
    }

    try {
      const text = await file.text();
      if (!text || !text.toLowerCase().includes('<svg')) {
        setUploadError('The selected file does not contain valid SVG content.');
        return;
      }

      const newId = `upload_${Date.now()}`;
      const newTemplate = {
        id: newId,
        title: file.name.replace(/\.svg$/i, '') || 'Custom SVG Template',
        category: 'Uploaded',
        badge: 'Custom SVG',
        dim: 'A4 (Portrait)',
        desc: 'User uploaded custom SVG vector template.',
        pagesCount: 1,
        thumbnail: `data:image/svg+xml;utf8,${encodeURIComponent(text)}`,
        pages: [`data:image/svg+xml;utf8,${encodeURIComponent(text)}`],
        rawSvg: text,
        isMultiPageBook: false
      };

      templateCache[newId] = text;
      setUploadedTemplates(prev => [newTemplate, ...prev]);
      setSelectedTemplate(newTemplate);
    } catch (err) {
      console.error('Error uploading SVG template:', err);
      setUploadError('Failed to read or parse the SVG file.');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      handleSvgFileUpload(file);
    }
    e.target.value = '';
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleSvgFileUpload(file);
    }
  };

  // Compute pages list for selectedTemplate
  const currentTemplatePages = useMemo(() => {
    if (!selectedTemplate) return [];
    if (Array.isArray(selectedTemplate.pages) && selectedTemplate.pages.length > 0) {
      return selectedTemplate.pages.map((urlOrData, idx) => ({
        index: idx,
        pageNumber: idx + 1,
        name: `Page ${idx + 1}`,
        url: urlOrData,
        rawSvg: selectedTemplate.rawSvg || null
      }));
    }
    const pCount = selectedTemplate.pagesCount || 1;
    return Array.from({ length: pCount }, (_, idx) => ({
      index: idx,
      pageNumber: idx + 1,
      name: `Page ${idx + 1}`,
      url: selectedTemplate.folder ? getBookPageUrl(selectedTemplate.folder, idx + 1) : selectedTemplate.thumbnail,
      rawSvg: selectedTemplate.rawSvg || null
    }));
  }, [selectedTemplate]);

  // Toggle single page selection
  const togglePageSelection = (idx, e) => {
    if (e) e.stopPropagation();
    setActivePreviewPageIndex(idx);
    setSelectedPageIndices(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedPageIndices.size === currentTemplatePages.length) {
      setSelectedPageIndices(new Set());
    } else {
      setSelectedPageIndices(new Set(currentTemplatePages.map((_, i) => i)));
    }
  };

  // Submit adding selected pages into flipbook
  const handleConfirmAddPages = async () => {
    if (selectedPageIndices.size === 0) return;
    setIsApplying(true);

    const sortedIndices = Array.from(selectedPageIndices).sort((a, b) => a - b);
    const chosenPages = sortedIndices.map(idx => currentTemplatePages[idx]).filter(Boolean);

    try {
      if (typeof onAddTemplatePages === 'function') {
        await onAddTemplatePages({
          selectedPages: chosenPages,
          placement,
          targetIndex: parseInt(targetPageIndex, 10),
          paperSize
        });
      } else if (typeof loadTemplate === 'function') {
        // Fallback for direct load
        const firstPage = chosenPages[0];
        await loadTemplate(firstPage.url, firstPage.rawSvg);
        setShowTemplateModal(false);
      }
    } catch (err) {
      console.error('Failed to add template pages:', err);
    } finally {
      setIsApplying(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100000] w-screen h-screen bg-black/60 flex items-center justify-center p-[2vw] backdrop-blur-sm select-none animate-in fade-in duration-200"
      onClick={() => setShowTemplateModal(false)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className="bg-white rounded-[1.2vw] shadow-2xl w-full max-w-[78vw] h-[86vh] max-h-[86vh] flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Loading Overlay */}
        {isApplying && (
          <div className="absolute inset-0 z-[300] bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-[3vw] w-[3vw] border-4 border-gray-200 border-t-[#ea543a] mb-[1vw]" />
            <p className="text-gray-900 font-bold text-[1.1vw]">Adding Pages to Flipbook...</p>
            <p className="text-gray-400 text-[0.75vw] mt-[0.2vw]">Formatting vector canvas and layer structures</p>
          </div>
        )}

        {/* Drag & Drop Overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-[350] bg-black/75 backdrop-blur-md flex flex-col items-center justify-center border-4 border-dashed border-white/80 rounded-[1.2vw]">
            <div className="w-[4.5vw] h-[4.5vw] rounded-full bg-white/20 flex items-center justify-center mb-[1vw] text-white animate-bounce">
              <Upload size="2.2vw" />
            </div>
            <p className="text-white text-[1.3vw] font-bold">Drop your SVG template here</p>
            <p className="text-white/80 text-[0.8vw] mt-[0.3vw]">Instant vector import onto your canvas</p>
          </div>
        )}

        {/* VIEW 2: PAGE SELECTION VIEW (Exact match to uploaded user screenshot) */}
        {selectedTemplate ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden p-[1.5vw] bg-white">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-[1vw] border-b border-gray-100 flex-shrink-0">
              <div>
                <div className="flex items-center gap-[0.75vw]">
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="flex items-center gap-[0.3vw] text-[0.75vw] font-medium text-gray-400 hover:text-gray-800 transition-colors cursor-pointer mr-[0.4vw]"
                    title="Back to All Templates"
                  >
                    <ArrowLeft size="1vw" />
                    <span>Templates</span>
                  </button>
                  <span className="text-gray-300">|</span>
                  <h2 className="text-[1.4vw] font-bold text-gray-900 tracking-tight leading-tight">
                    {selectedTemplate.title}
                  </h2>
                  <span className="px-[0.6vw] py-[0.15vw] bg-[#FEF2F2] text-[#ea543a] text-[0.7vw] font-semibold rounded-[0.3vw]">
                    {selectedTemplate.badge || selectedTemplate.category}
                  </span>
                </div>
                <p className="text-[0.75vw] text-gray-400 font-normal mt-[0.3vw] leading-relaxed max-w-[55vw]">
                  {selectedTemplate.desc}
                </p>
              </div>

              {/* Red Close Button */}
              <button
                onClick={() => setShowTemplateModal(false)}
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
                    onClick={toggleSelectAll}
                    className="flex items-center gap-[0.4vw] text-[0.75vw] font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                  >
                    <div
                      className={`w-[1.2vw] h-[1.2vw] rounded-full flex items-center justify-center transition-all ${
                        selectedPageIndices.size === currentTemplatePages.length && currentTemplatePages.length > 0
                          ? 'bg-[#ea543a] text-white'
                          : 'border-2 border-[#ea543a] bg-white'
                      }`}
                    >
                      {selectedPageIndices.size === currentTemplatePages.length && currentTemplatePages.length > 0 && (
                        <Check size="0.75vw" strokeWidth={3} />
                      )}
                    </div>
                    <span>Select All ({currentTemplatePages.length})</span>
                  </button>
                </div>

                {/* Pages Grid (4 Columns as in screenshot) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-[0.4vw]">
                  <div className="grid grid-cols-4 gap-[0.8vw] pb-[1vw]">
                    {currentTemplatePages.map((page, idx) => {
                      const isSelected = selectedPageIndices.has(idx);
                      const isPreviewed = activePreviewPageIndex === idx;

                      return (
                        <div
                          key={idx}
                          onClick={() => togglePageSelection(idx)}
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
                            onClick={(e) => togglePageSelection(idx, e)}
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

              {/* Right Column: Preview, Settings & Add Action */}
              <div className="w-[42%] flex flex-col justify-between h-full overflow-y-auto custom-scrollbar pl-[0.5vw]">
                {/* Large Preview Box */}
                <div className="w-full bg-[#f8fafc] border border-gray-100 rounded-[0.9vw] p-[1.2vw] flex items-center justify-center max-h-[38vh] min-h-[30vh] overflow-hidden flex-shrink-0 relative">
                  {currentTemplatePages[activePreviewPageIndex] ? (
                    <img
                      src={currentTemplatePages[activePreviewPageIndex].url}
                      alt={`Page ${activePreviewPageIndex + 1} Preview`}
                      className="max-h-[34vh] max-w-full object-contain rounded-[0.4vw] shadow-lg border border-gray-200 bg-white"
                    />
                  ) : (
                    <div className="text-gray-400 text-[0.8vw]">No page selected</div>
                  )}

                  {/* Active Page Badge */}
                  <div className="absolute bottom-[0.8vw] right-[0.8vw] px-[0.6vw] py-[0.2vw] rounded-[0.3vw] bg-black/70 text-white text-[0.7vw] font-medium backdrop-blur-sm">
                    Page {activePreviewPageIndex + 1} of {currentTemplatePages.length}
                  </div>
                </div>

                {/* Insertion Controls Form */}
                <div className="flex flex-col gap-[0.9vw] mt-[1vw]">
                  {/* Selected Pages Counter */}
                  <div className="text-[0.85vw] font-bold text-gray-800">
                    Selected Pages :{' '}
                    <span className="text-[#ea543a]">
                      {selectedPageIndices.size} {selectedPageIndices.size === 1 ? 'page' : 'pages'}
                    </span>
                  </div>

                  {/* Paper Size Display (Locked to existing flipbook size & orientation) */}
                  <div className="flex items-center gap-[0.8vw]">
                    <label className="text-[0.8vw] font-bold text-gray-800 whitespace-nowrap">Paper Size :</label>
                    <div className="relative flex-1">
                      <div
                        className="w-full bg-gray-50 border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.42vw] text-[0.75vw] text-gray-700 font-medium flex items-center justify-between cursor-not-allowed select-none"
                        title="Paper size and orientation are locked to the current flipbook"
                      >
                        <span className="font-semibold text-gray-800 truncate">{existingPaperSizeLabel}</span>
                        <span className="text-[0.62vw] text-gray-500 bg-gray-200/70 border border-gray-300 px-[0.4vw] py-[0.1vw] rounded-[0.2vw] font-medium tracking-wide flex-shrink-0 ml-[0.3vw]">
                          Current Flipbook
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons Row */}
                <div className="flex items-center gap-[0.8vw] pt-[1.2vw] mt-auto">
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="px-[1.4vw] py-[0.6vw] rounded-[0.5vw] bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[0.8vw] flex items-center justify-center gap-[0.3vw] transition-colors cursor-pointer"
                  >
                    CANCEL <X size="0.9vw" />
                  </button>

                  <button
                    onClick={handleConfirmAddPages}
                    disabled={selectedPageIndices.size === 0 || isApplying}
                    className={`flex-1 py-[0.6vw] rounded-[0.5vw] bg-[#ea543a] hover:bg-[#d9482f] text-white font-bold text-[0.8vw] flex items-center justify-center gap-[0.4vw] shadow-md transition-all cursor-pointer ${
                      selectedPageIndices.size === 0 || isApplying ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <span>ADD TO FLIPBOOK</span>
                    <ArrowRight size="0.9vw" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* VIEW 1: TEMPLATE GALLERY (Only existing backend templates + Custom SVG upload) */
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
            {/* Modal Header */}
            <div className="px-[2vw] py-[1.5vw] border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-[1.5vw] font-bold text-gray-900 tracking-tight">Template Gallery</h2>
                <p className="text-[0.8vw] text-gray-400 mt-[0.2vw]">
                  Select a template to choose pages, or upload your own SVG template
                </p>
              </div>
              <div className="flex items-center gap-[1vw]">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".svg,image/svg+xml"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-[0.4vw] px-[1vw] py-[0.5vw] bg-[#ea543a] text-white hover:bg-[#d9482f] active:scale-95 rounded-[0.6vw] text-[0.75vw] font-semibold transition-all shadow-sm cursor-pointer whitespace-nowrap"
                  title="Upload SVG File"
                >
                  <Upload size="1vw" />
                  <span>Upload SVG</span>
                </button>

                <div className="relative">
                  <Search size="1vw" className="absolute left-[0.8vw] top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search templates..."
                    className="pl-[2.2vw] pr-[1vw] py-[0.45vw] bg-gray-50 border border-gray-200 rounded-[0.6vw] text-[0.75vw] w-[15vw] focus:outline-none focus:bg-white focus:border-[#ea543a] transition-all"
                  />
                </div>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="p-[0.4vw] hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                >
                  <X size="1.4vw" className="text-gray-400 hover:text-gray-700" />
                </button>
              </div>
            </div>

            {/* Error Notification */}
            {uploadError && (
              <div className="mx-[2vw] mt-[1vw] p-[0.8vw] bg-red-50 border border-red-200 text-red-700 rounded-[0.6vw] flex items-center justify-between text-[0.75vw]">
                <div className="flex items-center gap-[0.5vw]">
                  <AlertCircle size="1vw" className="text-red-500 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
                <button onClick={() => setUploadError(null)} className="p-[0.2vw] hover:bg-red-100 rounded-full cursor-pointer">
                  <X size="0.9vw" />
                </button>
              </div>
            )}

            {/* Category Pills */}
            <div className="px-[2vw] py-[0.8vw] flex gap-[0.6vw] overflow-x-auto border-b border-gray-100 flex-shrink-0 bg-white">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={`px-[1vw] py-[0.35vw] rounded-[0.4vw] text-[0.75vw] font-medium whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === cat
                      ? 'bg-[#ea543a] text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {cat} {cat === 'Uploaded' && `(${uploadedTemplates.length})`}
                </button>
              ))}
            </div>

            {/* Templates Grid */}
            <div className="flex-1 overflow-y-auto p-[2vw] bg-[#fafafa]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[1.5vw] pb-[2.5vw]">
                {/* Upload SVG Card */}
                {(activeTab === 'All' || activeTab === 'Uploaded') && !searchQuery && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="group bg-white border-2 border-dashed border-gray-300 hover:border-[#ea543a] hover:bg-orange-50/20 rounded-[0.8vw] overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-[0.2vw] flex flex-col items-center justify-center p-[1.5vw] text-center aspect-[1/1.3]"
                  >
                    <div className="w-[3.5vw] h-[3.5vw] rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center text-[#ea543a] group-hover:scale-110 transition-transform mb-[0.8vw]">
                      <Upload size="1.6vw" />
                    </div>
                    <h4 className="font-bold text-gray-900 text-[0.85vw]">Upload Custom SVG</h4>
                    <p className="text-[0.7vw] text-gray-400 mt-[0.3vw]">Click or drop an SVG file here</p>
                    <span className="mt-[0.8vw] px-[0.8vw] py-[0.3vw] bg-[#ea543a] text-white text-[0.7vw] font-semibold rounded-[0.4vw]">
                      Browse Files
                    </span>
                  </div>
                )}

                {/* Backend Server Templates */}
                {filteredTemplates.map(tpl => (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl)}
                    className="group bg-white rounded-[0.8vw] border border-gray-200 hover:border-[#ea543a] overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-[0.2vw] flex flex-col"
                  >
                    {/* Thumbnail Cover */}
                    <div className="relative w-full aspect-[4/3] bg-gray-50 flex items-center justify-center overflow-hidden border-b border-gray-100">
                      <img
                        src={tpl.thumbnail}
                        alt={tpl.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="px-[1vw] py-[0.4vw] bg-[#ea543a] text-white font-semibold text-[0.75vw] rounded-[0.4vw] shadow-md flex items-center gap-[0.3vw]">
                          Select Pages <ArrowRight size="0.8vw" />
                        </span>
                      </div>
                    </div>

                    {/* Card Meta */}
                    <div className="p-[0.8vw] flex flex-col flex-1 justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900 text-[0.8vw] truncate" title={tpl.title}>
                          {tpl.title}
                        </h4>
                        <p className="text-[0.68vw] text-gray-400 line-clamp-2 mt-[0.2vw]">
                          {tpl.desc}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-[0.6vw] pt-[0.4vw] border-t border-gray-50 text-[0.68vw]">
                        <span className="text-gray-500 font-medium">
                          {tpl.pagesCount || (tpl.pages ? tpl.pages.length : 1)} Pages
                        </span>
                        <span className="px-[0.4vw] py-[0.1vw] bg-orange-50 text-[#ea543a] rounded-[0.2vw] font-semibold">
                          {tpl.badge || tpl.category}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty state */}
              {filteredTemplates.length === 0 && (
                <div className="py-[6vw] flex flex-col items-center justify-center text-center">
                  <div className="w-[4vw] h-[4vw] bg-red-50 text-[#ea543a] rounded-full flex items-center justify-center mb-[1vw]">
                    <Search size="1.8vw" />
                  </div>
                  <p className="text-[1.1vw] font-bold text-gray-800">No templates found</p>
                  <p className="text-[0.75vw] text-gray-400 mt-[0.3vw]">
                    No templates matched "{searchQuery}" in category "{activeTab}".
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default TemplateModal;
