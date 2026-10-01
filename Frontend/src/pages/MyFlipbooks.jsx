import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Folder, Plus, ArrowLeft, Search, MoreVertical, Trash2, Edit2, Copy, Eye, Wrench, PenTool, BarChart2, Share2, Download, FolderInput, SlidersHorizontal, CheckSquare, Check, X, Home, Library, ArrowRight, UploadCloud, Upload, ChevronLeft, ChevronRight, ChevronDown, ArrowDownUp, Globe, Lock, Settings, CloudUpload, GripVertical, RotateCcw, Heart } from 'lucide-react';
import { Icon } from '@iconify/react';

import AlertModal from '../components/AlertModal';
import CreateFlipbookModal from '../components/CreateFlipbookModal';
import { convertPdfToImages, convertPdfWithInkscape, getPdfPageCount, getDocumentDetails, generatePdfPageSvg, getOfficeDocType, svgToDataUrl } from '../utils/pdfUtils';
import PdfProcessingLoader from '../components/PdfProcessingLoader';
import ShareModal from '../components/ShareModal';
import ExportModal from '../components/ExportModal';
import { getSupabaseBaseUrl, resolveUploadsPath } from '../utils/supabaseUtils';
import dashboardBannerImg from '../assets/Dashboard/Main.png';


// Lazy-load preview iframe: only fetches HTML when card is visible in viewport
const LazyPreview = ({ v_id, emailId, backendUrl, iframeBaseUrl, title, imageUrl }) => {
    const containerRef = useRef(null);
    const [html, setHtml] = useState(null);
    const [loaded, setLoaded] = useState(false);
    const [fetching, setFetching] = useState(false);

    useEffect(() => {
        if (!v_id || loaded) return;
        const el = containerRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loaded && !fetching) {
                    observer.disconnect();
                    setFetching(true);
                    // Always fetch first-page HTML for both PDF and template books
                    axios
                        .get(`${backendUrl}/api/flipbook/preview/${v_id}`, { params: { emailId } })
                        .then((res) => {
                            if (res.data?.html) {
                                // Extract and dynamically load Google Fonts found in the SVG
                                const fontsToLoad = new Set();
                                const cssRegex = /font-family\s*:\s*(?:['"]([^'"]+)['"]|([^;}'"\s]+))/g;
                                const attrRegex = /font-family\s*=\s*['"]([^'"]+)['"]/g;
                                let match;
                                while ((match = cssRegex.exec(res.data.html)) !== null) {
                                    let f = match[1] || match[2];
                                    if (f) f = f.split(',')[0].replace(/['"]/g, '').trim();
                                    if (f && !['sans-serif', 'serif', 'monospace', 'inherit'].includes(f.toLowerCase())) fontsToLoad.add(f);
                                }
                                while ((match = attrRegex.exec(res.data.html)) !== null) {
                                    let f = match[1].split(',')[0].replace(/['"]/g, '').trim();
                                    if (f && !['sans-serif', 'serif', 'monospace', 'inherit'].includes(f.toLowerCase())) fontsToLoad.add(f);
                                }
                                
                                let fontImports = '';
                                if (fontsToLoad.size > 0) {
                                    const fontList = Array.from(fontsToLoad).map(f => f.replace(/\s+/g, '+')).join('|');
                                    fontImports = `<link href="https://fonts.googleapis.com/css?family=${fontList}:300,400,500,600,700,800,900&display=swap" rel="stylesheet">`;
                                }
                                
                                setHtml({ content: res.data.html, fontImports });
                            }
                        })
                        .catch(() => {})
                        .finally(() => { setFetching(false); setLoaded(true); });
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [v_id, loaded, fetching, backendUrl, emailId]);

    const isLoading = !loaded || fetching;

    return (
        <div ref={containerRef} className="w-full h-full flex items-center justify-center relative">
            {/* Skeleton shimmer — visible while loading */}
            {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-[0.4vw] bg-gradient-to-br from-gray-100 to-gray-200 rounded-[0.5vw] overflow-hidden">
                    {/* Animated sweep */}
                    <div
                        className="absolute inset-0 opacity-60"
                        style={{
                            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 1.4s infinite linear',
                        }}
                    />
                    <style>{`@keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }`}</style>
                    {/* Spinning icon */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-400 relative z-10"
                        style={{ width: '1.75vw', height: '1.75vw', animation: 'spin 1.2s linear infinite' }}
                    >
                        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    <span className="text-[0.55vw] text-gray-400 font-semibold uppercase tracking-wider relative z-10">
                        Loading preview...
                    </span>
                </div>
            )}

            {/* Actual preview — rendered on top once ready */}
            {html ? (
                <iframe
                    title={`Preview of ${title}`}
                    className="w-full h-full border-none pointer-events-none"
                    srcDoc={`<!DOCTYPE html><html><head>${html.fontImports}<base href="${iframeBaseUrl}"><style>html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;display:flex;align-items:center;justify-content:center;background:transparent;}svg{width:100%;height:100%;max-width:100%;max-height:100%;}[data-name="Free Frame"]{stroke:transparent !important;fill:transparent !important;}</style></head><body>${html.content.replace(/<svg/, '<svg preserveAspectRatio="xMidYMid meet"')}</body></html>`}
                />
            ) : loaded && imageUrl ? (
                // Fallback: asset image if no HTML was found
                <img src={resolveUploadsPath(imageUrl)} alt={title} className="w-full h-full object-contain" />
            ) : loaded && !html ? (
                // Loaded but nothing available
                <div className="flex flex-col items-center justify-center text-gray-400 w-full h-full">
                    <BookOpen size="2vw" strokeWidth={1.5} />
                    <span className="text-[0.6vw] mt-1 uppercase font-bold tracking-wider">No Preview</span>
                </div>
            ) : null}
        </div>
    );
};

const sortCategories = [
    {
        id: 'recent',
        title: 'Recent Activity',
        subtitle: 'Recent Activity',
        options: ['Recently Opened', 'Recently Modified', 'Recently Created']
    },
    {
        id: 'name',
        title: 'Name',
        subtitle: 'Recent Activity',
        options: ['Name (A → Z)', 'Name (Z → A)']
    },
    {
        id: 'performance',
        title: 'Performance',
        subtitle: 'Recent Activity',
        options: ['Most Viewed', 'Most Shared', 'Most Downloaded', 'Most Liked']
    },
    {
        id: 'size',
        title: 'File & Size',
        subtitle: 'Recent Activity',
        options: ['Largest File Size', 'Smallest File Size', 'Total Pages (High → Low)', 'Total Pages (Low → High)']
    }
];

const templates = [
    { id: 'corporate', label: 'A4', title: 'A4 Page', dim: '210 × 297 mm', width: 'w-[2.0vw]', height: 'h-[2.8vw]' },
    { id: 'large_catalogue', label: 'A3', title: 'A3 Page', dim: '297 × 420 mm', width: 'w-[2.7vw]', height: 'h-[3.8vw]' },
    { id: 'mini', label: 'A5', title: 'A5 Page', dim: '148 × 210 mm', width: 'w-[1.4vw]', height: 'h-[2.0vw]' },
    { id: 'letter', label: 'Letter', title: 'Letter Page', dim: '216 × 279 mm', width: 'w-[2.1vw]', height: 'h-[2.7vw]' },
    { id: 'legal', label: 'Legal', title: 'Legal Page', dim: '216 × 356 mm', width: 'w-[2.0vw]', height: 'h-[3.4vw]' },
    { id: 'dl', label: 'DL', title: 'DL Flyer', dim: '99 × 210 mm', width: 'w-[1.0vw]', height: 'h-[2.1vw]' },
    { id: 'square', label: 'Square', title: 'Square Page', dim: '210 × 210 mm', width: 'w-[2.1vw]', height: 'h-[2.1vw]' },
];


const FOLDER_COLORS = [
    '#f59e0b', // Yellow / Amber
    '#f43f5e', // Coral / Red / Rose
    '#10b981', // Emerald / Green
    '#38bdf8', // Sky Blue
    '#8b5cf6', // Violet / Purple
    '#f97316', // Orange
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#6366f1', // Indigo
];

export default function MyFlipbooks() {
    const navigate = useNavigate();

    // User Data
    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;
    const emailId = user?.emailId;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || '';

    // Storage Analysis State (Synced with /api/usersetting/get-settings like ProfileModal)
    const [storage, setStorage] = useState(() => {
        try {
            const cached = localStorage.getItem('user_storage_settings');
            if (cached) return JSON.parse(cached);
        } catch (e) {}
        return { used: 0, total: 300 * 1024 * 1024 };
    });
    const [isLoadingStorage, setIsLoadingStorage] = useState(false);
    const [isUpgradeCardClosed, setIsUpgradeCardClosed] = useState(() => {
        try {
            return localStorage.getItem('hide_upgrade_card') === 'true' || sessionStorage.getItem('hide_upgrade_card') === 'true';
        } catch (e) {
            return false;
        }
    });

    const fetchLiveStorageSettings = useCallback(async () => {
        let targetEmail = emailId;
        if (!targetEmail) {
            try {
                const u = JSON.parse(localStorage.getItem('user') || localStorage.getItem('user_profile'));
                targetEmail = u?.emailId || u?.email;
            } catch (e) {}
        }
        if (!targetEmail || targetEmail === 'No Email' || targetEmail === 'guest@example.com') return;

        setIsLoadingStorage(true);
        try {
            const response = await fetch(`${backendUrl}/api/usersetting/get-settings?emailId=${encodeURIComponent(targetEmail)}`);
            if (response.ok) {
                const data = await response.json();
                if (data) {
                    const newStorage = {
                        used: typeof data.usedStorage === 'number' ? data.usedStorage : 0,
                        total: typeof data.maxStorage === 'number' ? data.maxStorage : 300 * 1024 * 1024
                    };
                    setStorage(newStorage);
                    try {
                        localStorage.setItem('user_storage_settings', JSON.stringify(newStorage));
                        window.dispatchEvent(new Event('storage'));
                    } catch (e) {}
                }
            }
        } catch (error) {
            console.error("Error fetching live storage settings in MyFlipbooks:", error);
        } finally {
            setIsLoadingStorage(false);
        }
    }, [emailId, backendUrl]);

    useEffect(() => {
        fetchLiveStorageSettings();
    }, [fetchLiveStorageSettings]);

    const [activeFolder, setActiveFolder] = useState(() => {
        const saved = localStorage.getItem('last_active_folder');
        if (saved === 'Recent Book') return 'Recent';
        return saved || 'All Flipbook';
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [sortOption, setSortOption] = useState('Recently Created');
    const [activeSortCategory, setActiveSortCategory] = useState(null);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false);
    const [showUpgradeCard, setShowUpgradeCard] = useState(() => localStorage.getItem('hide_upgrade_card') !== 'true');
    const statusDropdownRef = useRef(null);
    const sortDropdownRef = useRef(null);
    const folderDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
                setIsStatusDropdownOpen(false);
            }
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
                setIsSortDropdownOpen(false);
            }
            if (folderDropdownRef.current && !folderDropdownRef.current.contains(event.target)) {
                setIsFolderDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Template Carousel State
    const [templateIndex, setTemplateIndex] = useState(0);

    const nextTemplate = () => {
        if (templateIndex < templates.length - 5) {
            setTemplateIndex(templateIndex + 1);
        }
    };

    const prevTemplate = () => {
        if (templateIndex > 0) {
            setTemplateIndex(templateIndex - 1);
        }
    };

    // Persist Active Folder
    useEffect(() => {
        localStorage.setItem('last_active_folder', activeFolder);
    }, [activeFolder]);
    const [folders, setFolders] = useState([]);
    const [books, setBooks] = useState([]);

    // Data Fetching
    const fetchData = async () => {
        if (!emailId) return;
        setIsLoading(true);
        try {
            // Fetch Folders (already ordered with id and name according to UserFolder MongoDB schema)
            const folderRes = await axios.get(`${backendUrl}/api/flipbook/folders`, { params: { emailId } });
            // Filter out Quick Access / System Folders and map properly with persistent id
            let fetchedFolders = (folderRes.data.folders || []).filter(f => {
                const name = typeof f === 'string' ? f : f?.name;
                const lower = String(name || '').toLowerCase().trim();
                return (
                    lower !== 'public book' &&
                    lower !== 'recent book' &&
                    lower !== 'recent' &&
                    lower !== 'all flipbook' &&
                    lower !== 'all flipbooks' &&
                    lower !== 'favorites' &&
                    lower !== 'trash'
                );
            }).map(f => {
                if (typeof f === 'string') return { id: f, name: f };
                return { id: f.id || f.name, name: f.name };
            });

            // Ensure the default folder 'My_Flipbooks' is always present
            const hasDefaultFolder = fetchedFolders.some(f => f.name.toLowerCase() === 'my_flipbooks');
            if (!hasDefaultFolder) {
                fetchedFolders.unshift({ id: 'default_my_flipbooks', name: 'My_Flipbooks' });
            }

            setFolders(fetchedFolders);

            // Fetch Books
            const booksRes = await axios.get(`${backendUrl}/api/flipbook/list`, { params: { emailId } });
            const rawBooks = booksRes.data.books || [];
            const sanitizedBooks = rawBooks.map(b => {
                const f = b.folder || b.folderName;
                if (!f || f === 'All Flipbook' || f === 'All Flipbooks') {
                    return { ...b, folder: 'My_Flipbooks' };
                }
                return b;
            });
            setBooks(sanitizedBooks);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [emailId]);

    useEffect(() => {
        setSelectedBooks([]);
    }, [activeFolder]);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createModalInitialView, setCreateModalInitialView] = useState('selection');
    const [selectedTemplateIdForModal, setSelectedTemplateIdForModal] = useState('corporate');
    const [initialDroppedFiles, setInitialDroppedFiles] = useState(null);

    const handleUploadBoxDragOver = (e) => {
        e.preventDefault();
    };

    const handleUploadBoxDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setInitialDroppedFiles(Array.from(e.dataTransfer.files));
            setCreateModalInitialView('upload');
            setIsCreateModalOpen(true);
        }
    };

    // Inline Folder Creation State
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderInputName, setNewFolderInputName] = useState('');
    const [creatingFolderName, setCreatingFolderName] = useState(null);
    const isSavingFolderRef = useRef(false);
    const folderListRef = useRef(null);

    // Auto-scroll to bottom when creating folder or loading item appears
    useEffect(() => {
        if ((isCreatingFolder || creatingFolderName) && folderListRef.current) {
            folderListRef.current.scrollTo({
                top: folderListRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [isCreatingFolder, creatingFolderName]);

    const [isLoading, setIsLoading] = useState(false);
    const [processingProgress, setProcessingProgress] = useState(null);
    const isUploadCancelledRef = useRef(false);
    const createdFlipbookVIdRef = useRef(null);
    const [alertState, setAlertState] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'error',
        showCancel: false,
        onConfirm: null
    });

    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [selectedFlipbook, setSelectedFlipbook] = useState(null);

    const handleShareClick = (book) => {
        let resolvedBook = { ...book };
        if (resolvedBook.folder === 'Recent Book' || resolvedBook.folder === 'Recent book') {
            const physicalBook = books.find(b => b.realName === book.realName && b.folder !== 'Recent Book' && b.folder !== 'Recent book');
            if (physicalBook) resolvedBook.folder = physicalBook.folder;
        }
        setSelectedFlipbook(resolvedBook);
        setIsShareModalOpen(true);
    };

    const handleDownloadClick = (book) => {
        let resolvedBook = { ...book };
        if (resolvedBook.folder === 'Recent Book' || resolvedBook.folder === 'Recent book') {
            const physicalBook = books.find(b => b.realName === book.realName && b.folder !== 'Recent Book' && b.folder !== 'Recent book');
            if (physicalBook) resolvedBook.folder = physicalBook.folder;
        }
        setSelectedFlipbook(resolvedBook);
        setIsExportModalOpen(true);
    };


    const showAlert = (title, message, type = 'error') => {
        setAlertState({
            isOpen: true,
            title,
            message,
            type,
            showCancel: false,
            onConfirm: () => setAlertState(prev => ({ ...prev, isOpen: false }))
        });
    };

    const blobToBase64 = (blob) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const handleUploadPDF = async (files, customName) => {
        if (!files || files.length === 0) return;
        setIsCreateModalOpen(false);
        setIsLoading(true);
        isUploadCancelledRef.current = false;
        createdFlipbookVIdRef.current = null;

        const firstFile = files[0];
        const initialDocType = firstFile._docType || getOfficeDocType(firstFile.name);
        const initialDocLabel = initialDocType === 'word' ? 'Word document' : initialDocType === 'powerpoint' ? 'PowerPoint presentation' : 'file';
        const initialPageCount = firstFile._pageCount || 1;

        // INSTANT LOADER APPEARANCE (0ms latency - immediately on button click!)
        setProcessingProgress({
            current: 1,
            total: files.length,
            fileIndex: 0,
            totalFiles: files.length,
            pageCount: initialPageCount,
            message: files.length > 1
                ? `Converting queued ${initialDocLabel} 1 of ${files.length} (${firstFile.name})...`
                : `Converting ${initialDocLabel}: ${firstFile.name}...`,
            fileName: firstFile.name,
            stage: 'converting'
        });

        try {
            let totalPdfSize = 0;
            for (const file of files) {
                totalPdfSize += file.size || 0;
            }
            let allImages = [];

            // Step 1 — Extract all PDF pages into SVG blobs
            for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
                if (isUploadCancelledRef.current) return;
                const file = files[fileIndex];

                const docType = file._docType || getOfficeDocType(file.name);
                const docLabel = docType === 'word' ? 'Word document' : docType === 'powerpoint' ? 'PowerPoint presentation' : 'file';
                const detectedCount = file._pageCount || 1;

                setProcessingProgress({
                    current: fileIndex + 1,
                    total: files.length,
                    fileIndex,
                    totalFiles: files.length,
                    pageCount: detectedCount,
                    message: files.length > 1
                        ? `Converting queued ${docLabel} ${fileIndex + 1} of ${files.length} (${file.name})...`
                        : `Converting ${docLabel}: ${file.name}...`,
                    fileName: file.name,
                    stage: 'converting'
                });
                const images = await convertPdfWithInkscape(file, Infinity, backendUrl);
                if (isUploadCancelledRef.current) return;
                allImages = [...allImages, ...images];
            }

            if (isUploadCancelledRef.current) return;

            if (allImages.length === 0) {
                showAlert("Error", "No pages could be extracted from the selected files.");
                return;
            }

            const firstW = allImages[0].width;
            const firstH = allImages[0].height;
            const isUniform = allImages.every(img =>
                Math.abs(img.width - firstW) < 1 &&
                Math.abs(img.height - firstH) < 1
            );
            if (!isUniform) {
                showAlert("Uniformity Error", "Selected PDF pages have different dimensions. All pages in a flipbook must have the same size to ensure a professional layout.");
                return;
            }
            const maxWidth = firstW;
            const maxHeight = firstH;

            const now = new Date();
            const timeString = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);
            const defaultPrefix = initialDocType === 'word' ? 'Word_Flipbook_' : initialDocType === 'powerpoint' ? 'PPT_Flipbook_' : 'PDF_Flipbook_';
            let uniqueName = customName;
            if (!uniqueName || (uniqueName.startsWith('PDF_Flipbook_') && initialDocType !== 'pdf')) {
                uniqueName = customName ? customName.replace(/^PDF_Flipbook_/, defaultPrefix) : `${defaultPrefix}${timeString}`;
            }
            const targetFolder = (!activeFolder || activeFolder === 'All Flipbook' || activeFolder === 'All Flipbooks' || activeFolder === 'Recent Book' || activeFolder === 'Recent' || activeFolder === 'Trash' || activeFolder === 'Favorites') ? 'My_Flipbooks' : activeFolder;

            // Step 2 — Encode pages and save flipbook in a single high-speed request
            setProcessingProgress({
                current: 0,
                total: allImages.length,
                totalFiles: files.length,
                message: 'Saving pages & binding flipbook...',
                fileName: uniqueName,
                stage: 'saving'
            });
            const allPages = await Promise.all(allImages.map(async (img, idx) => {
                const pageIndex = idx + 1;
                const base64Url = img.dataUrl || (img.content ? svgToDataUrl(img.content) : "") || (img.blob ? await blobToBase64(img.blob) : "");
                const html = img.content || generatePdfPageSvg(base64Url, `Page ${pageIndex}`, maxWidth, maxHeight, true);
                return {
                    pageName: `Page ${pageIndex}`,
                    content: html,
                    pageNumber: pageIndex
                };
            }));

            if (isUploadCancelledRef.current) return;

            // For standard flipbooks (up to 20 pages), save in a single request!
            if (allPages.length <= 20) {
                setProcessingProgress({
                    current: allPages.length,
                    total: allPages.length,
                    totalFiles: files.length,
                    message: 'Saving pages & binding flipbook...',
                    fileName: uniqueName,
                    stage: 'saving'
                });
                const createRes = await axios.post(`${backendUrl}/api/flipbook/save`, {
                    emailId,
                    flipbookName: uniqueName,
                    pages: allPages,
                    overwrite: true,
                    folderName: targetFolder,
                    keepBase64: true,
                    fileSize: totalPdfSize || allImages.reduce((sum, img) => sum + (img.blob?.size || 0), 0)
                });
                const v_id = createRes.data.v_id;
                createdFlipbookVIdRef.current = v_id;

                if (isUploadCancelledRef.current) {
                    axios.delete(`${backendUrl}/api/flipbook/delete/${v_id}`, { params: { emailId } }).catch(() => {});
                    return;
                }

                setProcessingProgress({
                    current: allPages.length,
                    total: allPages.length,
                    totalFiles: files.length,
                    message: 'Opening flipbook...',
                    fileName: uniqueName,
                    stage: 'done'
                });

                // Navigate to the customized editor
                navigate(`/editor/customized_editor/${encodeURIComponent(targetFolder)}/${v_id}`);
                return;
            }

            // For extra large flipbooks (> 20 pages), save initial batch then batch remaining
            const initialBatch = allPages.slice(0, 20);
            const createRes = await axios.post(`${backendUrl}/api/flipbook/save`, {
                emailId,
                flipbookName: uniqueName,
                pages: initialBatch,
                overwrite: true,
                folderName: targetFolder,
                keepBase64: true,
                fileSize: totalPdfSize || allImages.reduce((sum, img) => sum + (img.blob?.size || 0), 0)
            });
            const v_id = createRes.data.v_id;
            createdFlipbookVIdRef.current = v_id;

            const BATCH_SIZE = 15;
            for (let i = 20; i < allPages.length; i += BATCH_SIZE) {
                if (isUploadCancelledRef.current) {
                    axios.delete(`${backendUrl}/api/flipbook/delete/${v_id}`, { params: { emailId } }).catch(() => {});
                    return;
                }
                const batchPages = allPages.slice(i, i + BATCH_SIZE);
                setProcessingProgress({
                    current: Math.min(i + BATCH_SIZE, allPages.length),
                    total: allPages.length,
                    totalFiles: files.length,
                    message: `Saving pages ${i + 1} to ${Math.min(i + BATCH_SIZE, allPages.length)} of ${allPages.length}...`,
                    fileName: uniqueName,
                    stage: 'saving'
                });
                await axios.post(`${backendUrl}/api/flipbook/save-pages-batch`, {
                    emailId,
                    v_id,
                    pages: batchPages,
                    keepBase64: true,
                    fileSize: totalPdfSize
                });
            }

            if (isUploadCancelledRef.current) {
                axios.delete(`${backendUrl}/api/flipbook/delete/${v_id}`, { params: { emailId } }).catch(() => {});
                return;
            }

            setProcessingProgress({
                current: allPages.length,
                total: allPages.length,
                totalFiles: files.length,
                message: 'Opening flipbook...',
                fileName: uniqueName,
                stage: 'done'
            });

            // Step 4 — Navigate to the customized editor
            navigate(`/editor/customized_editor/${encodeURIComponent(targetFolder)}/${v_id}`);

        } catch (error) {
            if (!isUploadCancelledRef.current) {
                console.error("PDF/Document conversion error:", error);
                const rawMsg = error.response?.data?.message || error.message || "";
                const isCorrupt = error.response?.data?.isCorrupted ||
                                  /corrupt|cannot be read|not be loaded|damaged|password|format error|failed to parse|invalid pdf|syntax error/i.test(rawMsg);
                const userMessage = isCorrupt
                    ? (rawMsg.includes("is corrupted") || rawMsg.includes("corrupted, unreadable") ? rawMsg : "Your file is corrupted, unreadable, or password-protected. Please check your document and try again.")
                    : (rawMsg || "Failed to process document. Please try again.");
                showAlert(isCorrupt ? "File Corrupted" : "Error", userMessage);
            }
        } finally {
            setIsLoading(false);
            setProcessingProgress(null);
            isUploadCancelledRef.current = false;
        }
    };

    const handleCancelUploadPDF = () => {
        isUploadCancelledRef.current = true;
        setIsLoading(false);
        setProcessingProgress(null);
        if (createdFlipbookVIdRef.current) {
            axios.delete(`${backendUrl}/api/flipbook/delete/${createdFlipbookVIdRef.current}`, { params: { emailId } }).catch(() => {});
            createdFlipbookVIdRef.current = null;
        }
    };

    const handleUseTemplate = async (templateData) => {
        setIsCreateModalOpen(false);
        if (!templateData) return;

        // Check Auto-Save Preference
        let isAutoSave = true;
        try {
            const storedSetting = localStorage.getItem('isAutoSaveEnabled');
            if (storedSetting !== null) isAutoSave = JSON.parse(storedSetting);
        } catch (e) { console.warn("Error reading auto-save setting", e); }

        // Check for Email - Mandatory for backend creation
        if (!emailId) {
            console.error("Cannot pre-create flipbook: No user email found.");
            navigate('/editor', { state: templateData });
            return;
        }

        // Always pre-create the flipbook record to ensure we have a stable v_id
        // for assets and saves, regardless of whether periodic auto-save is enabled.
        setIsLoading(true);
        console.log("Pre-creating flipbook record...");

        try {
            const pageCount = templateData.pageCount || 12;
            const pages = Array.from({ length: pageCount }, (_, i) => ({
                pageName: `Page ${i + 1}`,
                content: ''
            }));

            const now = new Date();
            const timeString = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);
            const uniqueName = templateData.flipbookName || `Flipbook_${timeString}`;
            const targetFolder = (!activeFolder || activeFolder === 'All Flipbook' || activeFolder === 'All Flipbooks' || activeFolder === 'Recent Book' || activeFolder === 'Recent' || activeFolder === 'Trash' || activeFolder === 'Favorites') ? 'My_Flipbooks' : activeFolder;

            console.log(`Saving new flipbook "${uniqueName}" to "${targetFolder}"...`);
            const res = await axios.post(`${backendUrl}/api/flipbook/save`, {
                emailId,
                flipbookName: uniqueName,
                pages: pages,
                overwrite: true,
                folderName: targetFolder,
                meta: {
                    width: templateData.width,
                    height: templateData.height,
                    templateId: templateData.templateId,
                    orientation: templateData.orientation
                }
            });

            console.log("Creation result:", res.data);

            if (res.data && res.data.v_id) {
                const redirectUrl = `/editor/${encodeURIComponent(targetFolder)}/${res.data.v_id}`;
                console.log("Navigating with v_id:", redirectUrl);
                navigate(redirectUrl, { state: templateData });
            } else {
                console.warn("Backend didn't return v_id, using fallback editor route");
                navigate('/editor', { state: templateData });
            }
        } catch (e) {
            console.error("Creation failed", e);
            showAlert('Creation Error', 'Backend creation failed. You can still edit, but must save manually.', 'warning');
            navigate('/editor', { state: templateData });
        } finally {
            setIsLoading(false);
        }
    };

    // Renaming States
    const [editingId, setEditingId] = useState(null);
    const [tempName, setTempName] = useState('');

    // Folder Drag & Drop to Rearrange State
    const [dragFolderIndex, setDragFolderIndex] = useState(null);
    const [dragOverFolderIndex, setDragOverFolderIndex] = useState(null);

    // Save custom folder order to MongoDB UserFolder schema in backend
    const saveFolderOrder = async (updatedFolders) => {
        if (!emailId) return;
        const customOrder = updatedFolders
            .filter(f => f.name !== 'Recent Book')
            .map(f => ({ id: f.id, name: f.name }));
        try {
            await axios.post(`${backendUrl}/api/flipbook/folder/reorder`, {
                emailId,
                folders: customOrder
            });
        } catch (err) {
            console.error("Error persisting folder order in db:", err);
        }
    };

    const handleFolderDragStart = (e, index, folder) => {
        if (folder.name === 'Recent Book') {
            e.preventDefault();
            return;
        }
        setDragFolderIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(index));
    };

    const handleFolderDragOver = (e, index, folder) => {
        if (folder.name === 'Recent Book' || dragFolderIndex === null) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverFolderIndex !== index) {
            setDragOverFolderIndex(index);
        }
    };

    const handleFolderDragLeave = (e, index) => {
        if (dragOverFolderIndex === index) {
            setDragOverFolderIndex(null);
        }
    };

    const handleFolderDrop = (e, dropIndex, targetFolder) => {
        e.preventDefault();
        if (targetFolder.name === 'Recent Book' || dragFolderIndex === null || dragFolderIndex === dropIndex) {
            setDragFolderIndex(null);
            setDragOverFolderIndex(null);
            return;
        }

        setFolders(prev => {
            const next = [...prev];
            const [movedItem] = next.splice(dragFolderIndex, 1);
            next.splice(dropIndex, 0, movedItem);
            saveFolderOrder(next);
            return next;
        });

        setDragFolderIndex(null);
        setDragOverFolderIndex(null);
    };

    const handleFolderDragEnd = () => {
        setDragFolderIndex(null);
        setDragOverFolderIndex(null);
    };

    // Menu Action State
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [folderMenuPos, setFolderMenuPos] = useState({ top: 0, left: 0, isDropup: false });

    // Open Inline Create
    const handleAddFolderClick = () => {
        setIsCreatingFolder(true);
        setNewFolderInputName('');
    };

    const saveNewFolder = async () => {
        if (isSavingFolderRef.current) return;
        const nameToCreate = newFolderInputName.trim();
        if (!nameToCreate) {
            setIsCreatingFolder(false);
            setNewFolderInputName('');
            return;
        }
        isSavingFolderRef.current = true;
        setIsCreatingFolder(false);
        setNewFolderInputName('');
        try {
            await handleCreateFolder(nameToCreate);
        } finally {
            isSavingFolderRef.current = false;
        }
    };

    // Create Folder - Fast, responsive, and shows inline loader
    const handleCreateFolder = async (name) => {
        setCreatingFolderName(name);
        try {
            const res = await axios.post(`${backendUrl}/api/flipbook/folder/create`, { emailId, folderName: name });
            const createdId = res.data?.id || name;
            
            // Instantly update folder list locally without heavy fetchData() flipbook reloads
            setFolders(prev => {
                const existing = prev.filter(f => f.name.toLowerCase() !== name.toLowerCase());
                const updated = [...existing, { id: createdId, name }];
                saveFolderOrder(updated);
                return updated;
            });
            setActiveFolder(name);
        } catch (err) {
            console.error(err);
            showAlert('Create Failed', err.response?.data?.message || err.message);
        } finally {
            setCreatingFolderName(null);
        }
    };

    const startEditing = (folder) => {
        setEditingId(folder.id);
        setTempName(folder.name);
    };

    const saveEdit = async () => {
        if (!editingId || !tempName.trim()) {
            setEditingId(null);
            return;
        }

        const folder = folders.find(f => f.id === editingId);
        const oldName = folder?.name;
        const newName = tempName.trim();
        const currentFolderId = folder?.id;

        if (!folder || oldName === newName) {
            setEditingId(null);
            return;
        }

        // Close editing immediately for instant UX
        setEditingId(null);

        // Optimistic UI updates: update folder name and matching books immediately
        setFolders(prev => prev.map(f => f.id === currentFolderId ? { ...f, name: newName } : f));
        if (activeFolder === oldName) setActiveFolder(newName);
        setBooks(prev => prev.map(b => b.folder === oldName ? { ...b, folder: newName } : b));

        try {
            await axios.post(`${backendUrl}/api/flipbook/folder/rename`, {
                emailId,
                oldName,
                newName,
                folderId: currentFolderId
            });
        } catch (err) {
            console.error(err);
            // Revert state on failure
            setFolders(prev => prev.map(f => f.id === currentFolderId ? { ...f, name: oldName } : f));
            if (activeFolder === newName) setActiveFolder(oldName);
            setBooks(prev => prev.map(b => b.folder === newName ? { ...b, folder: oldName } : b));
            const msg = err.response?.status === 409 ? 'Folder name already exists.' : (err.response?.data?.message || err.message);
            showAlert('Rename Failed', msg);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEdit();
        }
    };

    // Delete Confirmation State
    const [deleteConfirmation, setDeleteConfirmation] = useState({
        isOpen: false,
        folderId: null,
        folderName: ''
    });

    const handleDeleteFolderClick = (folder) => {
        setActiveMenuId(null);
        if (folder.name?.toLowerCase() === 'my_flipbooks') {
            showAlert('Cannot Delete', 'My_Flipbooks is the default folder and cannot be deleted.');
            return;
        }
        setDeleteConfirmation({
            isOpen: true,
            folderId: folder.id,
            folderName: folder.name
        });
    };

    const confirmDelete = async () => {
        const folderId = deleteConfirmation.folderId;
        const folderName = deleteConfirmation.folderName;

        // Close modal immediately for instant response
        setDeleteConfirmation({ isOpen: false, folderId: null, folderName: '' });

        if (folderId && folderName) {
            // Optimistic update: remove folder and its books instantly
            setFolders(prev => {
                const next = prev.filter(f => f.name !== folderName && f.id !== folderId);
                saveFolderOrder(next);
                return next;
            });
            if (activeFolder === folderName) {
                setActiveFolder('Recent Book');
            }
            setBooks(prev => prev.filter(b => b.folder !== folderName));

            try {
                await axios.delete(`${backendUrl}/api/flipbook/folder`, {
                    data: { emailId, folderName, folderId }
                });
            } catch (err) {
                console.error("Delete folder error:", err);
                showAlert('Delete Failed', err.response?.data?.message || err.message);
                fetchData(); // Rollback / sync with server if failed
            }
        }
    };

    const handleDuplicateFolder = async (folder) => {
        setActiveMenuId(null);
        setIsLoading(true);
        try {
            const res = await axios.post(`${backendUrl}/api/flipbook/folder/duplicate`, {
                emailId, folderName: folder.name
            });
            const newName = res.data.newFolderName;

            await fetchData();

            startEditing({ id: newName, name: newName });

        } catch (err) {
            console.error(err);
            showAlert('Duplicate Failed', err.response?.data?.message || err.message);
        } finally {
            setIsLoading(false);
        }
    };

    /* Selection State */
    const [selectedBooks, setSelectedBooks] = useState([]);

    /* Menu State */
    const [activeBookMenu, setActiveBookMenu] = useState(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, isDropup: false });

    // Book Renaming State
    const [editingBookId, setEditingBookId] = useState(null);
    const [tempBookTitle, setTempBookTitle] = useState('');

    // Book Delete Confirmation
    const [deleteBookConfirmation, setDeleteBookConfirmation] = useState({
        isOpen: false,
        bookId: null,
        bookTitle: ''
    });

    // Book Move State
    const [moveBookModal, setMoveBookModal] = useState({
        isOpen: false,
        bookId: null,
        isBulk: false // Added to track bulk move
    });

    // Conflict / Rename & Move State
    const [conflictModal, setConflictModal] = useState({
        isOpen: false,
        book: null,
        targetFolder: '',
        newName: ''
    });

    // --- Selection Logic ---
    const handleSelectAll = () => {
        if (selectedBooks.length === filteredBooks.length) {
            setSelectedBooks([]);
        } else {
            setSelectedBooks(filteredBooks.map(b => b.id));
        }
    };

    const toggleBookSelection = (id) => {
        setSelectedBooks(prev =>
            prev.includes(id) ? prev.filter(bookId => bookId !== id) : [...prev, id]
        );
    };

    const handleBulkTrash = () => {
        if (selectedBooks.length === 0) return;
        const targetBooks = books.filter(b => selectedBooks.includes(b.id));
        const publishedCount = targetBooks.filter(b => b.isPublished || b.published || b.is_published || b.status === 'publish' || b.meta?.isPublished).length;
        setDeleteBookConfirmation({
            isOpen: true,
            bookId: 'BULK',
            bookTitle: `${selectedBooks.length} Selected Books`,
            isTrash: true,
            isPublished: publishedCount > 0,
            publishedCount: publishedCount
        });
    };

    const handleBulkDelete = () => {
        if (selectedBooks.length === 0) return;
        if (activeFolder === 'Trash') {
            setDeleteBookConfirmation({
                isOpen: true,
                bookId: 'BULK',
                bookTitle: `${selectedBooks.length} Selected Books`,
                isTrash: false,
                isPermanent: true
            });
        } else if (activeFolder === 'Recent Book' || activeFolder === 'Recent') {
            setDeleteBookConfirmation({
                isOpen: true,
                bookId: 'BULK',
                bookTitle: `${selectedBooks.length} Selected Books`,
                isTrash: false,
                isRecent: true
            });
        } else {
            handleBulkTrash();
        }
    };

    const handleBulkPermanentDelete = () => {
        if (selectedBooks.length === 0) return;
        setDeleteBookConfirmation({
            isOpen: true,
            bookId: 'BULK',
            bookTitle: `${selectedBooks.length} Selected Books`,
            isTrash: false,
            isPermanent: true
        });
    };

    const handleBulkRestore = async () => {
        if (selectedBooks.length === 0) return;
        const selectedIds = [...selectedBooks];
        const targetBooks = books.filter(b => selectedIds.includes(b.id));
        const prevBooks = [...books];
        setBooks(prev => prev.map(b => selectedIds.includes(b.id) ? { ...b, trash: false, folder: b.originalFolder || 'My_Flipbooks' } : b));
        setSelectedBooks([]);
        try {
            await Promise.all(targetBooks.map(book =>
                axios.post(`${backendUrl}/api/flipbook/restore`, {
                    emailId,
                    bookName: book.realName,
                    v_id: book.v_id
                })
            ));
        } catch (err) {
            console.error(err);
            setBooks(prevBooks);
            showAlert('Restore Failed', err.response?.data?.message || err.message);
        }
    };

    const handleBulkMove = () => {
        if (selectedBooks.length === 0) return;
        setMoveBookModal({
            isOpen: true,
            bookId: 'BULK',
            isBulk: true
        });
    };

    // --- Book Handlers ---

    const handleDuplicateBook = async (book) => {
        setActiveBookMenu(null);
        setIsLoading(true);
        try {
            const res = await axios.post(`${backendUrl}/api/flipbook/duplicate`, {
                emailId,
                folderName: book.folder,
                bookName: book.realName
            });

            // Optimistic / Instant update: Insert the duplicated book into local state
            const newName = res.data.newBookName;
            const newId = `${book.folder}_${newName}`;
            const duplicatedBook = {
                ...book,
                id: newId,
                title: newName,
                realName: newName,
                created: new Date().toLocaleDateString("en-GB").replace(/\//g, "-") + " " + new Date().toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' }),
                views: 0,
                viewsCount: 0,
                viewersCount: 0,
                mtime: new Date().toISOString()
            };

            setBooks(prev => [duplicatedBook, ...prev]);

            startEditingBook({ id: newId, title: newName, folder: book.folder, realName: newName });
        } catch (err) {
            console.error(err);
            showAlert('Duplicate Failed', err.response?.data?.message || err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleFavorite = async (book) => {
        const nextFav = !book.isFavorite;
        // Optimistically update all occurrences of this book in state (both real folder and recent view)
        setBooks(prev => prev.map(b => (b.v_id && b.v_id === book.v_id) || (book.realName && b.realName === book.realName) ? { ...b, isFavorite: nextFav } : b));
        try {
            await axios.post(`${backendUrl}/api/flipbook/favorite`, {
                emailId,
                bookName: book.realName || book.title,
                v_id: book.v_id,
                isFavorite: nextFav
            });
        } catch (err) {
            console.error("Failed to toggle favorite:", err);
            // Revert if failed
            setBooks(prev => prev.map(b => (b.v_id && b.v_id === book.v_id) || (book.realName && b.realName === book.realName) ? { ...b, isFavorite: !nextFav } : b));
        }
    };

    const handleRemoveFromRecent = async (book) => {
        setActiveBookMenu(null);
        setIsLoading(true);
        try {
            await axios.post(`${backendUrl}/api/flipbook/remove-recent`, {
                emailId,
                bookName: book.realName
            });
            await fetchData();
        } catch (err) {
            console.error(err);
            showAlert('Remove Failed', err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTrashBookClick = (book) => {
        setActiveBookMenu(null);
        const isPub = Boolean(book.isPublished || book.published || book.is_published || book.status === 'publish' || book.meta?.isPublished);
        setDeleteBookConfirmation({
            isOpen: true,
            bookId: book.id,
            bookTitle: book.title,
            isTrash: true,
            isPublished: isPub
        });
    };

    const handlePermanentDeleteBookClick = (book) => {
        setActiveBookMenu(null);
        setDeleteBookConfirmation({
            isOpen: true,
            bookId: book.id,
            bookTitle: book.title,
            isTrash: false,
            isPermanent: true
        });
    };

    const handleRestoreBook = async (book) => {
        setActiveBookMenu(null);
        const prevBooks = [...books];
        const restoreFolder = book.originalFolder || 'My_Flipbooks';
        setBooks(prev => prev.map(b => b.id === book.id ? { ...b, trash: false, folder: restoreFolder } : b));
        try {
            await axios.post(`${backendUrl}/api/flipbook/restore`, {
                emailId,
                bookName: book.realName,
                v_id: book.v_id
            });
        } catch (err) {
            console.error(err);
            setBooks(prevBooks);
            showAlert('Restore Failed', err.response?.data?.message || err.message);
        }
    };

    const handleEmptyTrashClick = () => {
        setDeleteBookConfirmation({
            isOpen: true,
            bookId: 'EMPTY_TRASH',
            bookTitle: 'All items in Trash',
            isEmptyTrash: true
        });
    };

    const confirmDeleteBook = async () => {
        const isTrashAction = Boolean(deleteBookConfirmation.isTrash);
        const isEmptyTrashAction = Boolean(deleteBookConfirmation.isEmptyTrash);
        const isRecent = activeFolder === 'Recent Book' || activeFolder === 'Recent' || Boolean(deleteBookConfirmation.isRecent);

        if (isEmptyTrashAction) {
            const previousBooks = [...books];
            const trashedBooks = books.filter(b => b.trash || b.folder === 'Trash');
            const freedBytes = trashedBooks.reduce((sum, b) => sum + (b.sizeBytes || b.fileSize || 0), 0);

            // Optimistically remove all trashed books
            setBooks(prev => prev.filter(b => !b.trash && b.folder !== 'Trash'));
            setSelectedBooks([]);
            setDeleteBookConfirmation({ isOpen: false, bookId: null, bookTitle: '' });

            // Optimistically update storage
            if (freedBytes > 0) {
                setStorage(prev => {
                    const updatedUsed = Math.max(0, (prev?.used || 0) - freedBytes);
                    const updated = { ...prev, used: updatedUsed };
                    try {
                        localStorage.setItem('user_storage_settings', JSON.stringify(updated));
                        window.dispatchEvent(new Event('storage'));
                    } catch (e) {}
                    return updated;
                });
            }

            try {
                await axios.post(`${backendUrl}/api/flipbook/empty-trash`, { emailId });
                await fetchLiveStorageSettings();
            } catch (err) {
                console.error(err);
                setBooks(previousBooks);
                showAlert('Empty Trash Failed', err.response?.data?.message || err.message);
                fetchLiveStorageSettings();
            }
            return;
        }

        const idsToProcess =
            deleteBookConfirmation.bookId === 'BULK'
                ? [...selectedBooks]
                : deleteBookConfirmation.bookId
                ? [deleteBookConfirmation.bookId]
                : [];

        const targetBooks = books.filter(b => idsToProcess.includes(b.id));
        const targetVIds = new Set(targetBooks.map(b => b.v_id).filter(Boolean));
        const targetRealNames = new Set(targetBooks.map(b => b.realName || b.title).filter(Boolean));

        const isTargetBook = (b) => {
            if (idsToProcess.includes(b.id)) return true;
            if (b.v_id && targetVIds.has(b.v_id)) return true;
            if ((b.realName && targetRealNames.has(b.realName)) || (b.title && targetRealNames.has(b.title))) return true;
            return false;
        };

        if (isTrashAction) {
            // Optimistic update: mark physical book as trashed and unpublished, and REMOVE completely from Recent list
            const previousBooks = [...books];
            setBooks(prev => {
                const matching = prev.filter(isTargetBook);
                const hasPhysicalMatch = matching.some(b => b.folder !== 'Recent Book' && b.folder !== 'Recent' && !String(b.id).startsWith('Recent_'));

                return prev.flatMap(b => {
                    if (!isTargetBook(b)) return [b];

                    const isRecentEntry = b.folder === 'Recent Book' || b.folder === 'Recent' || String(b.id).startsWith('Recent_');
                    if (isRecentEntry) {
                        // Virtual recent entry: drop it completely if physical counterpart exists
                        if (hasPhysicalMatch) return [];
                        // Otherwise convert it to trash entry
                        return [{
                            ...b,
                            id: b.id.replace(/^Recent_/, ''),
                            trash: true,
                            isPublished: false,
                            published: false,
                            folder: 'Trash',
                            originalFolder: b.actualFolder || b.originalFolder || 'My_Flipbooks'
                        }];
                    }

                    // Physical book: move to Trash
                    return [{
                        ...b,
                        trash: true,
                        isPublished: false,
                        published: false,
                        folder: 'Trash',
                        originalFolder: (b.folder !== 'Trash' && b.folder !== 'Recent Book' && b.folder !== 'Recent')
                            ? b.folder
                            : (b.originalFolder || 'My_Flipbooks')
                    }];
                });
            });

            if (deleteBookConfirmation.bookId === 'BULK') setSelectedBooks([]);
            else setSelectedBooks(prev => prev.filter(id => !idsToProcess.includes(id)));
            setDeleteBookConfirmation({ isOpen: false, bookId: null, bookTitle: '', isPublished: false });

            try {
                await Promise.all(targetBooks.map(async (book) => {
                    const isPub = Boolean(book.isPublished || book.published || book.is_published || book.status === 'publish');
                    if (isPub) {
                        await axios.post(`${backendUrl}/api/flipbook/unpublish`, {
                            emailId,
                            v_id: book.v_id
                        }).catch(e => console.warn("Unpublish during trash warning:", e));
                    }
                    return axios.post(`${backendUrl}/api/flipbook/trash`, {
                        emailId,
                        folderName: book.folder,
                        bookName: book.realName,
                        v_id: book.v_id
                    });
                }));
            } catch (err) {
                console.error(err);
                setBooks(previousBooks);
                showAlert('Move to Trash Failed', err.response?.data?.message || err.message);
            }
            return;
        }

        // Permanent Delete or Remove from Recent
        const endpoint = isRecent ? `${backendUrl}/api/flipbook/remove-recent` : `${backendUrl}/api/flipbook/delete`;
        const removedBooks = books.filter(b => idsToProcess.includes(b.id));
        const freedBytes = !isRecent ? removedBooks.reduce((sum, b) => sum + (b.sizeBytes || b.fileSize || 0), 0) : 0;

        setBooks(prev => prev.filter(b => !idsToProcess.includes(b.id)));
        if (deleteBookConfirmation.bookId === 'BULK') setSelectedBooks([]);
        else setSelectedBooks(prev => prev.filter(id => !idsToProcess.includes(id)));
        setDeleteBookConfirmation({ isOpen: false, bookId: null, bookTitle: '' });

        // Optimistically update storage if permanently deleting
        if (!isRecent && freedBytes > 0) {
            setStorage(prev => {
                const updatedUsed = Math.max(0, (prev?.used || 0) - freedBytes);
                const updated = { ...prev, used: updatedUsed };
                try {
                    localStorage.setItem('user_storage_settings', JSON.stringify(updated));
                    window.dispatchEvent(new Event('storage'));
                } catch (e) {}
                return updated;
            });
        }

        try {
            await Promise.all(removedBooks.map(book => {
                if (isRecent) {
                    return axios.post(endpoint, { emailId, bookName: book.realName });
                } else {
                    return axios.delete(endpoint, {
                        data: {
                            emailId,
                            folderName: book.originalFolder || book.folder,
                            bookName: book.realName,
                            v_id: book.v_id
                        }
                    });
                }
            }));
            if (!isRecent) {
                await fetchLiveStorageSettings();
            }
        } catch (err) {
            console.error(err);
            setBooks(prev => [...prev, ...removedBooks]);
            showAlert('Delete Failed', err.response?.data?.message || err.message);
            if (!isRecent) {
                fetchLiveStorageSettings();
            }
        }
    };

    const startEditingBook = (book) => {
        setActiveBookMenu(null);
        setEditingBookId(book.id);
        setTempBookTitle(book.title);
    };

    const saveBookEdit = async () => {
        if (editingBookId && tempBookTitle.trim()) {
            const book = books.find(b => b.id === editingBookId);

            // Frontend duplicate check (Global Uniqueness)
            const isDuplicate = books.some(b =>
                b.title.toLowerCase() === tempBookTitle.trim().toLowerCase() &&
                b.id !== editingBookId
            );

            if (isDuplicate) {
                showAlert('Name Exists', 'A flipbook with this name already exists (possibly in another folder). Please choose a unique name.');
                setEditingBookId(null); // Revert to previous name
                return; // Stop execution
            }

            if (book && book.title !== tempBookTitle.trim()) {
                setIsLoading(true);
                try {
                    await axios.post(`${backendUrl}/api/flipbook/rename`, {
                        emailId,
                        folderName: book.folder,
                        oldName: book.realName,
                        newName: tempBookTitle.trim()
                    });
                    await fetchData();
                } catch (err) {
                    console.error(err);
                    const msg = err.response?.status === 409 ? 'Flipbook name already exists.' : (err.response?.data?.message || err.message);
                    showAlert('Rename Failed', msg);
                } finally {
                    setIsLoading(false);
                }
            }
        }
        setEditingBookId(null);
    };

    const handleBookKeyDown = (e) => {
        if (e.key === 'Enter') {
            saveBookEdit();
        }
    };

    const handleMoveBookClick = (book) => {
        setActiveBookMenu(null);
        setMoveBookModal({
            isOpen: true,
            bookId: book.id
        });
    };

    const confirmMoveBook = async (targetFolder) => {
        // Helper to perform the actual move request
        const performMove = async (book, targetId) => {
            await axios.post(`${backendUrl}/api/flipbook/move`, {
                emailId,
                bookName: book.realName,
                currentFolder: book.folder,
                targetFolder: targetId
            });
        };

        const isBulk = moveBookModal.bookId === 'BULK';
        const booksToMove = isBulk 
            ? books.filter(b => selectedBooks.includes(b.id)) 
            : books.filter(b => b.id === moveBookModal.bookId);

        // Close modal immediately so UI is instant
        setMoveBookModal({ isOpen: false, bookId: null, isBulk: false });
        setIsCreatingInMove(false);
        setNewMoveFolderName('');

        if (booksToMove.length === 0) return;

        // Optimistic UI update: instantly update folder for moved books
        const movedBookIds = booksToMove.map(b => b.id);
        setBooks(prev => prev.map(b => movedBookIds.includes(b.id) ? { ...b, folder: targetFolder } : b));
        if (isBulk) {
            setSelectedBooks([]);
        }

        try {
            for (const book of booksToMove) {
                await performMove(book, targetFolder);
            }
        } catch (err) {
            console.error("Move error:", err);
            if (err.response?.status === 409) {
                setConflictModal({
                    isOpen: true,
                    book: booksToMove[0],
                    targetFolder,
                    newName: booksToMove[0]?.realName
                });
            } else {
                showAlert('Move Failed', err.response?.data?.message || err.message);
            }
            fetchData();
        }
    };

    const handleRenameAndMove = async () => {
        const { book, newName, targetFolder } = conflictModal;
        if (!book || !newName.trim() || !targetFolder) return;

        // Close conflict modal immediately
        setConflictModal({ isOpen: false, book: null, targetFolder: '', newName: '' });

        const trimmedNewName = newName.trim();
        if (trimmedNewName === book.realName) {
            showAlert("Name Exists", "Please choose a different name to resolve the conflict.");
            return;
        }

        // Optimistic UI update
        setBooks(prev => prev.map(b => b.id === book.id ? { ...b, title: trimmedNewName, realName: trimmedNewName, folder: targetFolder } : b));

        try {
            // 1. Rename in Source
            await axios.post(`${backendUrl}/api/flipbook/rename`, {
                emailId,
                folderName: book.folder,
                oldName: book.realName,
                newName: trimmedNewName
            });

            // 2. Move to Target
            await axios.post(`${backendUrl}/api/flipbook/move`, {
                emailId,
                bookName: trimmedNewName,
                currentFolder: book.folder,
                targetFolder
            });
        } catch (err) {
            console.error(err);
            const msg = err.response?.status === 409 ? 'Name still conflicts (in source or target).' : err.message;
            showAlert('Action Failed', msg);
            fetchData();
        }
    };

    // --- Create Folder in Move Modal Logic ---
    const [isCreatingInMove, setIsCreatingInMove] = useState(false);
    const [newMoveFolderName, setNewMoveFolderName] = useState('');
    const moveModalListRef = useRef(null);

    useEffect(() => {
        if (isCreatingInMove && moveModalListRef.current) {
            moveModalListRef.current.scrollTo({
                top: moveModalListRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [isCreatingInMove]);

    const handleCreateFolderAndMove = async () => {
        if (!newMoveFolderName.trim()) return;
        const name = newMoveFolderName.trim();
        setFolders(prev => {
            const existing = prev.filter(f => f.name.toLowerCase() !== name.toLowerCase());
            const updated = [...existing, { id: name, name }];
            return updated.sort((a, b) => a.name.localeCompare(b.name));
        });
        try {
            axios.post(`${backendUrl}/api/flipbook/folder/create`, { emailId, folderName: name }).catch(console.error);
            await confirmMoveBook(name);
        } catch (err) { console.error(err); }
    };



    // Filter books by active folder, search query, and status
    const seenVIds = new Set();
    const filteredBooks = books.filter(book => {
        let matchesFolder = false;
        if (activeFolder === 'Trash') {
            matchesFolder = Boolean(book.trash || book.folder === 'Trash') && book.folder !== 'Recent Book' && book.folder !== 'Recent';
        } else if (activeFolder === 'All Flipbook' || activeFolder === 'All Flipbooks') {
            matchesFolder = !book.trash && book.folder !== 'Trash' && book.folder !== 'Recent Book' && book.folder !== 'Recent';
        } else if (activeFolder === 'Recent' || activeFolder === 'Recent Book') {
            matchesFolder = !book.trash && (book.folder === 'Recent Book' || book.folder === 'Recent');
        } else if (activeFolder === 'Favorites') {
            matchesFolder = !book.trash && book.folder !== 'Trash' && book.folder !== 'Recent Book' && book.folder !== 'Recent' && Boolean(book.isFavorite || book.favorite || book.isFav);
        } else {
            matchesFolder = !book.trash && book.folder === activeFolder;
        }

        if (activeFolder === 'All Flipbook' || activeFolder === 'All Flipbooks' || activeFolder === 'Favorites') {
            const key = book.v_id || `${book.realName}_${book.title}`;
            if (seenVIds.has(key)) return false;
            if (matchesFolder) seenVIds.add(key);
        }

        const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            book.realName.toLowerCase().includes(searchQuery.toLowerCase());

        let matchesStatus = true;
        if (statusFilter !== 'All Status') {
            const rawAcc = String(
                book.Visibility?.access || 
                book.Visibility?.type || 
                book.Customized_Settings?.Visibility?.access || 
                book.Customized_Settings?.Visibility?.type || 
                book.settings?.Visibility?.access || 
                book.settings?.Visibility?.type || 
                book.share?.access || 
                book.share?.type || 
                book.access || 
                (book.isPublic === false ? 'private' : 'public')
            ).toLowerCase().trim();

            if (statusFilter === 'Public') matchesStatus = rawAcc.includes('public') && !rawAcc.includes('private') && !rawAcc.includes('password') && !rawAcc.includes('invite');
            else if (statusFilter === 'Private') matchesStatus = rawAcc.includes('private') || book.isPublic === false;
            else if (statusFilter === 'Protected') matchesStatus = rawAcc.includes('password') || rawAcc.includes('protect');
            else if (statusFilter === 'Email' || statusFilter === 'Invite') matchesStatus = rawAcc.includes('invite') || rawAcc.includes('email');
        }
        return matchesFolder && matchesSearch && matchesStatus;
    }).sort((a, b) => {
        const parseDate = (dateVal) => {
            if (!dateVal) return 0;
            // Handle numeric timestamps
            if (!isNaN(dateVal) && typeof dateVal !== 'boolean') {
                return new Date(Number(dateVal)).getTime();
            }

            if (typeof dateVal === 'string') {
                const [datePart, timePart, ampm] = dateVal.split(' ');
                const parts = datePart ? datePart.split(/[-/]/) : [];
                
                // Only if it looks like DD-MM-YYYY (year is at the end)
                if (parts.length === 3 && parts[2].length === 4) {
                    let year = parseInt(parts[2], 10);
                    let month = parseInt(parts[1], 10) - 1; // JS months are 0-11
                    let day = parseInt(parts[0], 10);
                    let hours = 0;
                    let minutes = 0;
                    
                    if (timePart) {
                        const timeSplit = timePart.split(':');
                        hours = parseInt(timeSplit[0] || '0', 10);
                        minutes = parseInt(timeSplit[1] || '0', 10);
                        
                        if (ampm) {
                            if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
                            if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
                        }
                    }
                    
                    let customParsed = new Date(year, month, day, hours, minutes).getTime();
                    if (!isNaN(customParsed)) return customParsed;
                }
            }

            // Fallback for standard strings like ISO
            let parsed = new Date(dateVal).getTime();
            if (!isNaN(parsed)) return parsed;

            return 0;
        };

        if (sortOption === 'Recently Created') {
            if (activeFolder === 'Recent Book') {
                return parseDate(b.mtime || b.created) - parseDate(a.mtime || a.created);
            }
            return parseDate(b.createdAt || b.created) - parseDate(a.createdAt || a.created);
        }
        if (sortOption === 'Recently Opened' || sortOption === 'Recently Modified') {
            // Fallback to created date if opened/modified fields don't exist
            return parseDate(b.mtime || b.updatedAt || b.createdAt || b.created) - parseDate(a.mtime || a.updatedAt || a.createdAt || a.created);
        }
        if (sortOption === 'Name (A → Z)') {
            return (a.title || '').localeCompare(b.title || '');
        }
        if (sortOption === 'Name (Z → A)') {
            return (b.title || '').localeCompare(a.title || '');
        }
        if (sortOption === 'Most Viewed' || sortOption === 'Most Shared' || sortOption === 'Most Downloaded' || sortOption === 'Most Liked') {
            const getViews = (item) => (item.viewsCount !== undefined ? item.viewsCount : item.views) || 0;
            return getViews(b) - getViews(a);
        }
        if (sortOption === 'Largest File Size') {
            const getBytes = (b) => {
                if (b.sizeBytes && b.sizeBytes > 0) return b.sizeBytes;
                if (typeof b.size === 'string' && b.size !== '0 B' && b.size !== '0B') {
                    const num = parseFloat(b.size) || 0;
                    if (b.size.toUpperCase().includes('GB')) return num * 1024 * 1024 * 1024;
                    if (b.size.toUpperCase().includes('MB')) return num * 1024 * 1024;
                    if (b.size.toUpperCase().includes('KB')) return num * 1024;
                    return num;
                }
                return (b.pages || 1) * 450 * 1024;
            };
            return getBytes(b) - getBytes(a);
        }
        if (sortOption === 'Smallest File Size') {
            const getBytes = (b) => {
                if (b.sizeBytes && b.sizeBytes > 0) return b.sizeBytes;
                if (typeof b.size === 'string' && b.size !== '0 B' && b.size !== '0B') {
                    const num = parseFloat(b.size) || 0;
                    if (b.size.toUpperCase().includes('GB')) return num * 1024 * 1024 * 1024;
                    if (b.size.toUpperCase().includes('MB')) return num * 1024 * 1024;
                    if (b.size.toUpperCase().includes('KB')) return num * 1024;
                    return num;
                }
                return (b.pages || 1) * 450 * 1024;
            };
            return getBytes(a) - getBytes(b);
        }
        if (sortOption === 'Total Pages (High → Low)') {
            return (parseInt(b.pages) || 0) - (parseInt(a.pages) || 0);
        }
        if (sortOption === 'Total Pages (Low → High)') {
            return (parseInt(a.pages) || 0) - (parseInt(b.pages) || 0);
        }
        return 0;
    });

    const formatDisplayDate = (dateVal) => {
        if (!dateVal) return '';
        if (typeof dateVal === 'string' && dateVal.includes('-') && dateVal.includes(' ')) {
            const parts = dateVal.split(' ')[0].split('-');
            if (parts.length === 3 && parts[2].length === 4) return dateVal;
        }
        
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return dateVal;
        
        const pad = (n) => n.toString().padStart(2, '0');
        const day = pad(d.getDate());
        const month = pad(d.getMonth() + 1);
        const year = d.getFullYear();
        
        let hours = d.getHours();
        const minutes = pad(d.getMinutes());
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        
        return `${day}-${month}-${year} ${pad(hours)}:${minutes} ${ampm}`;
    };

    const formatDisplaySize = (book) => {
        if (book.size && book.size !== '0 B' && book.size !== '0B' && book.size !== '0 Bytes') {
            return book.size;
        }
        if (book.sizeBytes && book.sizeBytes > 0) {
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(book.sizeBytes) / Math.log(k));
            return `${parseFloat((book.sizeBytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
        }
        if (book.fileSize && book.fileSize > 0) {
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(book.fileSize) / Math.log(k));
            return `${parseFloat((book.fileSize / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
        }
        return '0 B';
    };

    const isAllSelected = filteredBooks.length > 0 && selectedBooks.length === filteredBooks.length;

    return (
        <div className="flex bg-[#eef0f8] h-full">
            {/* Sidebar */}
            <aside className="w-[18vw] bg-white h-[92vh] fixed left-0 top-[8vh] border-r border-gray-100 flex flex-col p-[1.5vw] z-20 select-none">

                {/* Folders Section */}
                <div className="flex-1 flex flex-col min-h-0">
                    {/* Quick Access List */}
                    <div className="space-y-[0.2vw] flex-none">
                        {/* All Flipbook */}
                        {(() => {
                            const isActive = activeFolder === 'All Flipbook' || activeFolder === 'All Flipbooks';
                            const count = books.filter(b => !b.trash && b.folder !== 'Trash' && b.folder !== 'Recent Book' && b.folder !== 'Recent').length;
                            return (
                                <div
                                    onClick={() => { setActiveFolder('All Flipbook'); setSelectedBooks([]); }}
                                    className={`w-full flex items-center justify-between px-[0.85vw] py-[0.55vw] rounded-[0.5vw] transition-all text-[0.875vw] cursor-pointer select-none ${
                                        isActive
                                            ? 'bg-[#fef2f0] text-[#ec5137] font-semibold'
                                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-normal'
                                    }`}
                                >
                                    <div className="flex items-center gap-[0.75vw]">
                                        <BookOpen size="1.15vw" className={`shrink-0 ${isActive ? 'text-[#ec5137]' : 'text-gray-700'}`} />
                                        <span>All Flipbook</span>
                                    </div>
                                    <span className={`text-[0.8vw] ${isActive ? 'text-[#ec5137] font-semibold' : 'text-gray-500'}`}>
                                        {count}
                                    </span>
                                </div>
                            );
                        })()}

                        {/* Recent */}
                        {(() => {
                            const isActive = activeFolder === 'Recent' || activeFolder === 'Recent Book';
                            const count = books.filter(b => !b.trash && (b.folder === 'Recent Book' || b.folder === 'Recent')).length;
                            return (
                                <div
                                    onClick={() => { setActiveFolder('Recent'); setSelectedBooks([]); }}
                                    className={`w-full flex items-center justify-between px-[0.85vw] py-[0.55vw] rounded-[0.5vw] transition-all text-[0.875vw] cursor-pointer select-none ${
                                        isActive
                                            ? 'bg-[#fef2f0] text-[#ec5137] font-semibold'
                                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-normal'
                                    }`}
                                >
                                    <div className="flex items-center gap-[0.75vw]">
                                        <Icon icon="codicon:history" className={`w-[1.15vw] h-[1.15vw] shrink-0 ${isActive ? 'text-[#ec5137]' : 'text-gray-700'}`} />
                                        <span>Recent</span>
                                    </div>
                                    <span className={`text-[0.8vw] ${isActive ? 'text-[#ec5137] font-semibold' : 'text-gray-500'}`}>
                                        {count}
                                    </span>
                                </div>
                            );
                        })()}

                        {/* Favorites */}
                        {(() => {
                            const isActive = activeFolder === 'Favorites';
                            const count = books.filter(b => !b.trash && b.folder !== 'Trash' && b.folder !== 'Recent Book' && b.folder !== 'Recent' && Boolean(b.isFavorite || b.favorite || b.isFav)).length;
                            return (
                                <div
                                    onClick={() => { setActiveFolder('Favorites'); setSelectedBooks([]); }}
                                    className={`w-full flex items-center justify-between px-[0.85vw] py-[0.55vw] rounded-[0.5vw] transition-all text-[0.875vw] cursor-pointer select-none ${
                                        isActive
                                            ? 'bg-[#fef2f0] text-[#ec5137] font-semibold'
                                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-normal'
                                    }`}
                                >
                                    <div className="flex items-center gap-[0.75vw]">
                                        <Heart size="1.15vw" className={`shrink-0 ${isActive ? 'text-[#ec5137]' : 'text-gray-700'}`} />
                                        <span>Favorites</span>
                                    </div>
                                    <span className={`text-[0.8vw] ${isActive ? 'text-[#ec5137] font-semibold' : 'text-gray-500'}`}>
                                        {count}
                                    </span>
                                </div>
                            );
                        })()}

                        {/* Trash */}
                        {(() => {
                            const isActive = activeFolder === 'Trash';
                            const count = books.filter(b => Boolean(b.trash || b.folder === 'Trash') && b.folder !== 'Recent Book' && b.folder !== 'Recent').length;
                            return (
                                <div
                                    onClick={() => { setActiveFolder('Trash'); setSelectedBooks([]); }}
                                    className={`w-full flex items-center justify-between px-[0.85vw] py-[0.55vw] rounded-[0.5vw] transition-all text-[0.875vw] cursor-pointer select-none ${
                                        isActive
                                            ? 'bg-[#fef2f0] text-[#ec5137] font-semibold'
                                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-normal'
                                    }`}
                                >
                                    <div className="flex items-center gap-[0.75vw]">
                                        <Trash2 size="1.15vw" className={`shrink-0 ${isActive ? 'text-[#ec5137]' : 'text-gray-700'}`} />
                                        <span>Trash</span>
                                    </div>
                                    <span className={`text-[0.8vw] ${isActive ? 'text-[#ec5137] font-semibold' : 'text-gray-500'}`}>
                                        {count}
                                    </span>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Divider */}
                    <div className="my-[1.1vw] border-b border-gray-100 flex-none"></div>

                    {/* Your Folders Header */}
                    <div className="flex items-center justify-between mb-[0.85vw] flex-none">
                        <span className="text-[0.95vw] font-bold text-gray-800">Your Folders</span>
                        <button
                            onClick={handleAddFolderClick}
                            className="flex items-center gap-[0.25vw] px-[0.6vw] py-[0.25vw] rounded-[0.4vw] bg-gray-100 hover:bg-gray-200 text-gray-700 text-[0.75vw] font-medium transition-colors cursor-pointer"
                        >
                            <Plus size="0.85vw" /> Add
                        </button>
                    </div>

                    {/* Scrollable Folder List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-[0.25vw] pb-[1vw]" ref={folderListRef}>
                        <div className="space-y-[0.2vw]">
                            {folders.map((folder, index) => {
                                const isEditing = editingId === folder.id;
                                const isActive = activeFolder === folder.name;
                                const isDragging = dragFolderIndex === index;
                                const isDragOver = dragOverFolderIndex === index && dragFolderIndex !== null && dragFolderIndex !== index;
                                const folderCount = books.filter(b => b.folder === folder.name && !b.trash).length;
                                const folderColor = FOLDER_COLORS[index % FOLDER_COLORS.length];

                                return isEditing ? (
                                    <div key={folder.id} className="w-full px-[0.85vw] py-[0.55vw] rounded-[0.5vw] border border-[#ec5137] bg-white shadow-sm">
                                        <input
                                            autoFocus
                                            type="text"
                                            value={tempName}
                                            onChange={(e) => setTempName(e.target.value)}
                                            onBlur={saveEdit}
                                            onKeyDown={handleKeyDown}
                                            className="w-full text-[0.875vw] font-medium text-gray-900 focus:outline-none"
                                        />
                                    </div>
                                ) : (
                                    <div
                                        key={folder.id}
                                        draggable={!isEditing}
                                        onDragStart={(e) => handleFolderDragStart(e, index, folder)}
                                        onDragOver={(e) => handleFolderDragOver(e, index, folder)}
                                        onDragLeave={(e) => handleFolderDragLeave(e, index)}
                                        onDrop={(e) => handleFolderDrop(e, index, folder)}
                                        onDragEnd={handleFolderDragEnd}
                                        onClick={() => { setActiveFolder(folder.name); setSelectedBooks([]); }}
                                        className={`relative group w-full flex items-center gap-[0.75vw] px-[0.85vw] py-[0.55vw] rounded-[0.5vw] transition-all text-[0.875vw] text-left cursor-pointer select-none
                                            ${isDragging ? 'opacity-40 scale-[0.98] border border-dashed border-[#ec5137]' : ''}
                                            ${isDragOver ? 'border-t-2 border-t-[#ec5137] bg-red-50/40' : ''}
                                            ${isActive
                                                ? 'bg-[#fef2f0] text-[#ec5137] font-semibold'
                                                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-normal'
                                            }
                                        `}
                                    >
                                        {/* Colorful filled folder icon */}
                                        <Folder
                                            size="1.15vw"
                                            className="shrink-0 fill-current"
                                            style={{ color: folderColor }}
                                        />

                                        <span className="truncate flex-1 font-medium">{folder.name}</span>

                                        <div className="relative flex items-center justify-end h-[1.5vw] min-w-[1.5vw]">
                                            <span className={`text-[0.8vw] transition-all duration-200 ease-in-out ${isActive ? 'text-[#ec5137] font-semibold' : 'text-gray-400 font-normal'} ${activeMenuId === folder.id ? 'pr-[2vw]' : 'pr-[0.25vw] group-hover:pr-[2vw]'}`}>
                                                {folderCount}
                                            </span>

                                            {/* Options Menu Trigger */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (activeMenuId === folder.id) {
                                                        setActiveMenuId(null);
                                                    } else {
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        const spaceBelow = window.innerHeight - rect.bottom;
                                                        const isDropup = spaceBelow < 120;
                                                        setFolderMenuPos({
                                                            top: isDropup ? rect.top - 5 : rect.bottom + 5,
                                                            left: rect.right,
                                                            isDropup
                                                        });
                                                        setActiveMenuId(folder.id);
                                                    }
                                                }}
                                                className={`absolute right-0 p-[0.3vw] flex items-center justify-center rounded-[0.4vw] bg-transparent transition-all ${
                                                    isActive ? 'hover:bg-red-100/70 text-[#ec5137]' : 'hover:bg-gray-200 text-gray-500'
                                                } ${activeMenuId === folder.id ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'}`}
                                            >
                                                <MoreVertical size="0.9vw" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* New Folder Input */}
                            {isCreatingFolder && (
                                <div className="w-full px-[0.85vw] py-[0.55vw] rounded-[0.5vw] border border-[#ec5137] bg-white shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Folder Name..."
                                        value={newFolderInputName}
                                        onChange={(e) => setNewFolderInputName(e.target.value)}
                                        onBlur={saveNewFolder}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                saveNewFolder();
                                            }
                                            if (e.key === 'Escape') {
                                                setIsCreatingFolder(false);
                                                setNewFolderInputName('');
                                            }
                                        }}
                                        className="w-full text-[0.875vw] font-medium text-gray-900 focus:outline-none placeholder-gray-400"
                                    />
                                </div>
                            )}

                            {/* Creating Folder Loading Row */}
                            {creatingFolderName && (
                                <div className="w-full flex items-center justify-between gap-[0.75vw] px-[0.85vw] py-[0.55vw] rounded-[0.5vw] border border-[#ec5137] bg-white text-[#ec5137] text-[0.875vw] font-medium shadow-sm animate-in fade-in duration-200">
                                    <div className="flex items-center gap-[0.75vw] min-w-0 flex-1">
                                        <Folder size="1.15vw" className="text-[#ec5137] fill-current shrink-0" />
                                        <span className="truncate">{creatingFolderName}</span>
                                    </div>
                                    <div className="w-[1.1vw] h-[1.1vw] border-[2px] border-[#ec5137] border-t-transparent rounded-full animate-spin shrink-0"></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Storage & Upgrade Profile Card */}
                {(() => {
                    // Fallback to local books sum if backend hasn't returned used storage yet
                    const fallbackBooksSize = Array.isArray(books) ? books.reduce((acc, b) => acc + (b.sizeBytes || b.fileSize || 0), 0) : 0;
                    const effectiveUsed = (typeof storage.used === 'number' && !isNaN(storage.used)) ? storage.used : fallbackBooksSize;
                    const effectiveTotal = storage.total > 0 ? storage.total : (300 * 1024 * 1024);

                    const formatMB = (bytes) => {
                        if (!bytes || bytes <= 0) return '0 MB';
                        const mb = bytes / (1024 * 1024);
                        if (mb < 0.1) return '0.1 MB';
                        if (mb < 100) return `${parseFloat(mb.toFixed(1))} MB`;
                        return `${Math.round(mb)} MB`;
                    };

                    const usedFormatted = formatMB(effectiveUsed);
                    const totalFormatted = effectiveTotal >= 1024 * 1024 * 1024
                        ? `${Math.round(effectiveTotal / (1024 * 1024 * 1024))} GB`
                        : `${Math.round(effectiveTotal / (1024 * 1024))} MB`;
                    const storagePercent = effectiveTotal > 0 ? Math.min(100, Math.round((effectiveUsed / effectiveTotal) * 100)) : 0;

                    return (
                        <div className="mt-auto relative z-30 pt-[0.6vw]">
                            <div className="w-full bg-white rounded-[1vw] p-[0.8vw] border border-gray-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col select-none relative">
                                {/* Top Header: Database/Storage Icon + Title + Close Button (closes upgrade button) */}
                                <div className="flex items-center justify-between mb-[0.55vw]">
                                    <div className="flex items-center gap-[0.5vw]">
                                        <div className="relative flex items-center justify-center">
                                            <svg width="0.95vw" height="0.95vw" viewBox="0 0 24 24" fill="none" stroke="#ea543a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <ellipse cx="12" cy="5" rx="8.5" ry="2.8" />
                                                <path d="M3.5 5v7c0 1.55 3.8 2.8 8.5 2.8s8.5-1.25 8.5-2.8V5" />
                                                <path d="M3.5 12v7c0 1.55 3.8 2.8 8.5 2.8s8.5-1.25 8.5-2.8v-7" />
                                            </svg>
                                            {/* Red notification dot on top right */}
                                            <div className="absolute -top-[0.08vw] -right-[0.1vw] w-[0.32vw] h-[0.32vw] bg-[#ea543a] rounded-full ring-2 ring-white"></div>
                                        </div>
                                        <span className="text-[0.82vw] font-semibold text-[#374151]">Storage</span>
                                    </div>

                                    {/* Close Button on Corner (closes only the upgrade button) */}
                                    {!isUpgradeCardClosed && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsUpgradeCardClosed(true);
                                                try {
                                                    localStorage.setItem('hide_upgrade_card', 'true');
                                                    sessionStorage.setItem('hide_upgrade_card', 'true');
                                                } catch (err) {}
                                            }}
                                            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-[0.2vw] rounded-full transition-colors cursor-pointer flex items-center justify-center -mr-[0.2vw] -mt-[0.2vw]"
                                            title="Close Upgrade"
                                            aria-label="Close Upgrade"
                                        >
                                            <X size="0.85vw" strokeWidth={2.2} />
                                        </button>
                                    )}
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full h-[0.32vw] bg-[#e5e7eb] rounded-full overflow-hidden mb-[0.45vw]">
                                    <div
                                        className="h-full bg-[#ea543a] rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${storagePercent}%` }}
                                    ></div>
                                </div>

                                {/* Storage Usage Stats */}
                                <div className="flex items-center justify-between text-[0.7vw] text-[#4b5563] font-semibold mb-[0.6vw]">
                                    <span>
                                        {isLoadingStorage ? 'Calculating...' : `${usedFormatted} of ${totalFormatted} used`}
                                    </span>
                                    <span className="text-[#374151] font-semibold">{storagePercent}%</span>
                                </div>

                                {/* Divider line & Upgrade Profile Button (closable) */}
                                {!isUpgradeCardClosed && (
                                    <>
                                        {/* Divider line */}
                                        <div className="border-t border-[#f3f4f6] mb-[0.65vw]"></div>

                                        {/* Upgrade Profile Button with Royal Gold Crown */}
                                        <div className="relative">
                                            {/* 3D Realistic Gold Crown */}
                                            <div className="absolute -top-[1.05vw] -left-[0.5vw] w-[2.35vw] h-[1.88vw] -rotate-[16deg] z-20 select-none pointer-events-none drop-shadow-[0_3px_8px_rgba(0,0,0,0.35)]">
                                                <svg viewBox="0 0 68 54" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                                                    <defs>
                                                        {/* Gold Primary Gradient */}
                                                        <linearGradient id="goldGradMain" x1="0%" y1="0%" x2="100%" y2="100%">
                                                            <stop offset="0%" stopColor="#FFF7C2" />
                                                            <stop offset="20%" stopColor="#FAD04C" />
                                                            <stop offset="50%" stopColor="#E5A620" />
                                                            <stop offset="80%" stopColor="#FCE082" />
                                                            <stop offset="100%" stopColor="#A86B06" />
                                                        </linearGradient>
                                                        {/* Gold Shimmer Gradient */}
                                                        <linearGradient id="goldShine" x1="0%" y1="100%" x2="100%" y2="0%">
                                                            <stop offset="0%" stopColor="#7A4B00" />
                                                            <stop offset="35%" stopColor="#FFDE6A" />
                                                            <stop offset="65%" stopColor="#CF8B13" />
                                                            <stop offset="100%" stopColor="#FFFDF2" />
                                                        </linearGradient>
                                                        {/* Red Velvet / Cushion Inner */}
                                                        <radialGradient id="crownVelvet" cx="50%" cy="40%" r="60%">
                                                            <stop offset="0%" stopColor="#8A151B" />
                                                            <stop offset="70%" stopColor="#5E0B10" />
                                                            <stop offset="100%" stopColor="#3B0508" />
                                                        </radialGradient>
                                                        {/* Gem Gradients */}
                                                        <radialGradient id="rubyGem" cx="35%" cy="35%" r="65%">
                                                            <stop offset="0%" stopColor="#FF6B6B" />
                                                            <stop offset="40%" stopColor="#DC2626" />
                                                            <stop offset="100%" stopColor="#7F1D1D" />
                                                        </radialGradient>
                                                        <radialGradient id="blueGem" cx="35%" cy="35%" r="65%">
                                                            <stop offset="0%" stopColor="#60A5FA" />
                                                            <stop offset="50%" stopColor="#2563EB" />
                                                            <stop offset="100%" stopColor="#1E3A8A" />
                                                        </radialGradient>
                                                        <radialGradient id="emeraldGem" cx="35%" cy="35%" r="65%">
                                                            <stop offset="0%" stopColor="#34D399" />
                                                            <stop offset="50%" stopColor="#059669" />
                                                            <stop offset="100%" stopColor="#064E3B" />
                                                        </radialGradient>
                                                        {/* Pearl Gradient */}
                                                        <radialGradient id="pearlSphere" cx="35%" cy="35%" r="65%">
                                                            <stop offset="0%" stopColor="#FFFFFF" />
                                                            <stop offset="60%" stopColor="#FFF3D6" />
                                                            <stop offset="100%" stopColor="#D4A747" />
                                                        </radialGradient>
                                                    </defs>

                                                    {/* Velvet Interior Dome */}
                                                    <path d="M 12 40 C 14 26, 54 26, 56 40 Z" fill="url(#crownVelvet)" opacity="0.9" />

                                                    {/* Filigree Arches */}
                                                    <path d="M 10 40 Q 34 20 34 11 Q 34 20 58 40" stroke="url(#goldGradMain)" strokeWidth="2.5" fill="none" strokeLinecap="round" />

                                                    {/* Crown Base Rim */}
                                                    <path d="M 7 42 Q 34 47 61 42 L 59 50 Q 34 54 9 50 Z" fill="url(#goldShine)" stroke="#7A4B00" strokeWidth="0.8" />
                                                    {/* Rim Jewels */}
                                                    <circle cx="16" cy="46.5" r="2" fill="url(#rubyGem)" stroke="#FFEAA7" strokeWidth="0.5" />
                                                    <circle cx="28" cy="48" r="2" fill="url(#blueGem)" stroke="#FFEAA7" strokeWidth="0.5" />
                                                    <circle cx="40" cy="48" r="2" fill="url(#rubyGem)" stroke="#FFEAA7" strokeWidth="0.5" />
                                                    <circle cx="52" cy="46.5" r="2" fill="url(#emeraldGem)" stroke="#FFEAA7" strokeWidth="0.5" />

                                                    {/* 5-Point Crown Body */}
                                                    <path d="M 7 42 L 3 19 L 20 30 L 34 11 L 48 30 L 65 19 L 61 42 Q 34 47 7 42 Z" fill="url(#goldGradMain)" stroke="#8A5A00" strokeWidth="0.9" />
                                                    <path d="M 10 40 L 7 24 L 20 32 L 34 15 L 48 32 L 61 24 L 58 40 Q 34 44 10 40 Z" fill="url(#goldShine)" opacity="0.6" />

                                                    {/* Pearls atop the 5 points */}
                                                    <circle cx="3" cy="18" r="3.2" fill="url(#pearlSphere)" stroke="#B3770E" strokeWidth="0.7" />
                                                    <circle cx="20" cy="29" r="2.8" fill="url(#pearlSphere)" stroke="#B3770E" strokeWidth="0.7" />
                                                    <circle cx="34" cy="10" r="4.1" fill="url(#pearlSphere)" stroke="#B3770E" strokeWidth="0.7" />
                                                    <circle cx="48" cy="29" r="2.8" fill="url(#pearlSphere)" stroke="#B3770E" strokeWidth="0.7" />
                                                    <circle cx="65" cy="18" r="3.2" fill="url(#pearlSphere)" stroke="#B3770E" strokeWidth="0.7" />

                                                    {/* Center Imperial Ruby Diamond */}
                                                    <polygon points="34,22 38.5,28 34,34 29.5,28" fill="url(#rubyGem)" stroke="#FFF3B0" strokeWidth="0.8" />
                                                    {/* Side Gems */}
                                                    <circle cx="20" cy="36" r="1.6" fill="url(#blueGem)" />
                                                    <circle cx="48" cy="36" r="1.6" fill="url(#emeraldGem)" />
                                                </svg>
                                            </div>

                                            {/* Textured Dark button */}
                                            <button
                                                onClick={() => navigate('/settings/profile')}
                                                className="w-full relative overflow-hidden py-[0.52vw] px-[0.8vw] rounded-[0.65vw] text-[0.78vw] font-medium text-white flex items-center justify-center gap-[0.45vw] shadow-[0_4px_14px_rgba(0,0,0,0.25)] hover:shadow-[0_6px_18px_rgba(0,0,0,0.35)] active:scale-[0.99] transition-all cursor-pointer group"
                                                style={{
                                                    background: 'radial-gradient(ellipse at 50% 30%, #25282d 0%, #15171a 70%, #0d0e10 100%)'
                                                }}
                                            >
                                                <span className="tracking-wide">Upgrade Profile</span>
                                                <ArrowRight size="0.85vw" strokeWidth={2.4} className="transition-transform group-hover:translate-x-[0.15vw]" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {/* Global Folder Dropdown Portal */}
                {activeMenuId && (
                    <>
                        <div className="fixed inset-0 z-[100]" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }}></div>
                        <div
                            className="fixed z-[101] w-[12vw] min-w-[165px] bg-white rounded-[0.75vw] shadow-xl border border-gray-500 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                            style={{
                                top: folderMenuPos.top,
                                left: folderMenuPos.left,
                                transform: folderMenuPos.isDropup ? 'translate(-100%, -100%)' : 'translate(-100%, 0)'
                            }}
                        >
                            {(() => {
                                const folder = folders.find(f => f.id === activeMenuId);
                                if (!folder) return null;
                                return (
                                    <>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                startEditing(folder);
                                                setActiveMenuId(null);
                                            }}
                                            className="w-full flex items-center gap-[0.5vw] px-[0.75vw] py-[0.625vw] text-[0.75vw] font-semibold text-gray-700 hover:bg-black hover:text-white transition-colors border-b border-gray-50 group cursor-pointer"
                                        >
                                            <Edit2 size="0.9vw" className="group-hover:text-white" />
                                            Rename
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDuplicateFolder(folder);
                                                setActiveMenuId(null);
                                            }}
                                            className="w-full flex items-center gap-[0.5vw] px-[0.75vw] py-[0.625vw] text-[0.75vw] font-medium text-gray-600 hover:bg-black hover:text-white transition-colors border-b border-gray-50 group cursor-pointer"
                                        >
                                            <Copy size="0.9vw" className="group-hover:text-white" />
                                            Duplicate
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteFolderClick(folder);
                                                setActiveMenuId(null);
                                            }}
                                            className="w-full flex items-center gap-[0.5vw] px-[0.75vw] py-[0.625vw] text-[0.75vw] font-medium text-red-500 hover:bg-red-500 hover:text-white transition-colors group cursor-pointer"
                                        >
                                            <Trash2 size="0.9vw" className="group-hover:text-white" />
                                            Delete
                                        </button>
                                    </>
                                );
                            })()}
                        </div>
                    </>
                )}
            </aside>

            {/* Main Content */}
            <main
                className="flex-1 ml-[18vw] px-[1vw] pt-[1vw] pb-[1vw] relative bg-[#f8f9fb] flex flex-col select-none h-[92vh] max-h-[92vh] overflow-hidden"
            >
                {/* Welcome Banner */}
                {(() => {
                    const rawName = user?.name || user?.fullName || user?.firstName || (user?.emailId ? user.emailId.split('@')[0] : 'Naveen');
                    const displayName = rawName ? (rawName.charAt(0).toUpperCase() + rawName.slice(1)) : 'Naveen';

                    return (
                        <div className="w-full bg-white rounded-[1vw] py-[0.95vw] px-[1.4vw] border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex justify-between items-center relative overflow-hidden mb-[0.9vw] flex-shrink-0">
                            {/* Left Side: Greeting & Quick Action Cards */}
                            <div className="flex flex-col z-10">
                                <h1 className="text-[1.45vw] font-bold text-[#1f2937] leading-tight">
                                    Welcome back, <span className="text-[#ea543a]">{displayName}</span>
                                </h1>
                                <p className="text-[0.78vw] text-gray-400 font-normal mt-[0.15vw] mb-[0.8vw]">
                                    Ready to create something amazing today?
                                </p>

                                {/* 3 Action Cards */}
                                <div className="flex items-center gap-[0.9vw]">
                                    {/* 1. Drag & Drop or Upload */}
                                    <div
                                        onClick={() => { setCreateModalInitialView('upload'); setIsCreateModalOpen(true); }}
                                        onDragOver={handleUploadBoxDragOver}
                                        onDrop={handleUploadBoxDrop}
                                        className="w-[16.2vw] h-[5.4vw] bg-[#fafafa]/70 hover:bg-white rounded-[0.7vw] border-[1.5px] border-dashed border-gray-300 hover:border-[#ea543a] flex flex-col items-center justify-center p-[0.45vw] cursor-pointer transition-all shadow-sm group"
                                    >
                                        <p className="text-[0.8vw] font-semibold text-gray-500 mb-[0.2vw]">
                                            Drag & Drop or <span className="text-[#ea543a]">Upload</span>
                                        </p>
                                        <div className="mb-[0.25vw] transition-transform group-hover:-translate-y-[0.1vw]">
                                            <UploadCloud size="1.2vw" className="text-[#ea543a]" strokeWidth={2} />
                                        </div>
                                        <div className="flex items-center gap-[0.3vw] text-[0.58vw] text-gray-400 font-medium">
                                            <span>Supported File format -</span>
                                            <div className="flex items-center gap-[0.25vw]">
                                                <Icon icon="vscode-icons:file-type-pdf2" className="w-[0.85vw] h-[0.85vw]" />
                                                <Icon icon="vscode-icons:file-type-word" className="w-[0.85vw] h-[0.85vw]" />
                                                <Icon icon="vscode-icons:file-type-powerpoint" className="w-[0.85vw] h-[0.85vw]" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Create From Scratch */}
                                    <div
                                        onClick={() => {
                                            setSelectedTemplateIdForModal('corporate'); // default A4
                                            setCreateModalInitialView('template');
                                            setIsCreateModalOpen(true);
                                        }}
                                        className="w-[16.2vw] h-[5.4vw] bg-white rounded-[0.7vw] border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md px-[0.9vw] py-[0.5vw] flex items-center justify-between cursor-pointer transition-all group"
                                    >
                                        <div className="flex items-center gap-[0.75vw] min-w-0">
                                            <div className="w-[2.2vw] h-[2.2vw] rounded-[0.55vw] bg-[#fff2ef] flex items-center justify-center text-[#ea543a] flex-shrink-0">
                                                <Icon icon="lucide:file-text" className="w-[1.1vw] h-[1.1vw]" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-[0.88vw] font-bold text-gray-800 leading-tight">Create From Scratch</h3>
                                                <p className="text-[0.66vw] text-gray-400 font-normal mt-[0.12vw]">Start with a blank canvas</p>
                                            </div>
                                        </div>
                                        <div className="w-[1.45vw] h-[1.45vw] rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#ea543a] group-hover:text-white transition-all flex-shrink-0 shadow-sm ml-[0.6vw]">
                                            <ArrowRight size="0.72vw" />
                                        </div>
                                    </div>

                                    {/* 3. Use a Template */}
                                    <div
                                        onClick={() => {
                                            navigate('/templates');
                                        }}
                                        className="w-[16.2vw] h-[5.4vw] bg-white rounded-[0.7vw] border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md px-[0.9vw] py-[0.5vw] flex items-center justify-between cursor-pointer transition-all group"
                                    >
                                        <div className="flex items-center gap-[0.75vw] min-w-0">
                                            <div className="w-[2.2vw] h-[2.2vw] rounded-[0.55vw] bg-[#fff2ef] flex items-center justify-center text-[#ea543a] flex-shrink-0">
                                                <Icon icon="lucide:layout-template" className="w-[1.1vw] h-[1.1vw]" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-[0.88vw] font-bold text-gray-800 leading-tight">Use a Template</h3>
                                                <p className="text-[0.66vw] text-gray-400 font-normal mt-[0.12vw]">Choose from professional templates</p>
                                            </div>
                                        </div>
                                        <div className="w-[1.45vw] h-[1.45vw] rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#ea543a] group-hover:text-white transition-all flex-shrink-0 shadow-sm ml-[0.6vw]">
                                            <ArrowRight size="0.72vw" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: 3D Flipbook Illustration Graphic */}
                            <div className="flex-shrink-0 relative pointer-events-none select-none flex items-center justify-end -my-[1.2vw] -mr-[0.6vw]">
                                <img
                                    src={dashboardBannerImg}
                                    alt="Bring your ideas to life"
                                    className="h-[12vw] w-auto object-contain max-w-[27vw]"
                                />
                            </div>
                        </div>
                    );
                })()}

                {/* Title & Filters Row */}
                <div className="w-full mb-[0.8vw] relative z-20 flex-shrink-0">
                    <h2 className="text-[1.15vw] font-bold text-[#1f2937] mb-[0.6vw]">
                        {activeFolder === 'All Flipbook' || activeFolder === 'All' || !activeFolder ? 'All Flipbooks' : (activeFolder === 'Recent Book' ? 'Recent' : activeFolder)}
                    </h2>

                    <div className="flex items-center justify-between w-full">
                        {/* Left: Search & Filter Dropdowns */}
                        <div className="flex items-center gap-[0.75vw]">
                            {/* Search Input */}
                            <div className="relative w-[15vw]">
                                <Search className="absolute left-[0.9vw] top-1/2 -translate-y-1/2 text-[#ea543a]" size="0.95vw" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-[2.4vw] pr-[1vw] py-[0.5vw] rounded-[0.6vw] border border-gray-200 text-[0.84vw] focus:outline-none focus:ring-1 focus:ring-[#ea543a] bg-white text-gray-700 placeholder-gray-400 shadow-sm"
                                />
                            </div>

                            {/* All Folders Dropdown */}
                            <div className="relative" ref={folderDropdownRef}>
                                <button
                                    onClick={() => { setIsFolderDropdownOpen(!isFolderDropdownOpen); setIsStatusDropdownOpen(false); setIsSortDropdownOpen(false); }}
                                    className="flex items-center gap-[0.45vw] px-[0.9vw] py-[0.5vw] bg-white border border-gray-200 rounded-[0.6vw] text-[0.84vw] text-gray-700 hover:bg-gray-50 shadow-sm font-medium cursor-pointer"
                                >
                                    <Folder size="0.9vw" className="text-[#ea543a]" />
                                    <span>{activeFolder === 'All Flipbook' || activeFolder === 'All' ? 'All Folders' : activeFolder}</span>
                                    <ChevronDown size="0.85vw" className="text-gray-400 ml-[0.3vw]" />
                                </button>
                                {isFolderDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-[0.25vw] min-w-[10vw] bg-white border border-gray-200 rounded-[0.6vw] shadow-xl z-50 py-[0.3vw] max-h-[14vw] overflow-y-auto custom-scrollbar">
                                        <button
                                            onClick={() => { setActiveFolder('All Flipbook'); setIsFolderDropdownOpen(false); }}
                                            className="w-full text-left px-[1vw] py-[0.45vw] text-[0.8vw] text-gray-700 hover:bg-orange-50 hover:text-[#ea543a] transition-colors cursor-pointer"
                                        >
                                            All Folders
                                        </button>
                                        {folders.map(f => (
                                            <button
                                                key={f.id}
                                                onClick={() => { setActiveFolder(f.name); setIsFolderDropdownOpen(false); }}
                                                className="w-full text-left px-[1vw] py-[0.45vw] text-[0.8vw] text-gray-700 hover:bg-orange-50 hover:text-[#ea543a] transition-colors truncate cursor-pointer"
                                            >
                                                {f.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* All Status Dropdown */}
                            <div className="relative" ref={statusDropdownRef}>
                                <button
                                    onClick={() => { setIsStatusDropdownOpen(!isStatusDropdownOpen); setIsSortDropdownOpen(false); setIsFolderDropdownOpen(false); }}
                                    className="flex items-center gap-[0.45vw] px-[0.9vw] py-[0.5vw] bg-white border border-gray-200 rounded-[0.6vw] text-[0.84vw] text-gray-700 hover:bg-gray-50 shadow-sm font-medium cursor-pointer"
                                >
                                    <Icon icon="lucide:disc" className="w-[0.9vw] h-[0.9vw] text-[#ea543a]" />
                                    <span>{statusFilter}</span>
                                    <ChevronDown size="0.85vw" className="text-gray-400 ml-[0.3vw]" />
                                </button>
                                {isStatusDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-[0.25vw] min-w-[9vw] bg-white border border-gray-200 rounded-[0.6vw] shadow-xl z-50 py-[0.3vw]">
                                        {['All Status', 'Public', 'Private', 'Protected', 'Email'].map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => { setStatusFilter(status); setIsStatusDropdownOpen(false); }}
                                                className="w-full text-left px-[1vw] py-[0.45vw] text-[0.8vw] text-gray-700 hover:bg-orange-50 hover:text-[#ea543a] transition-colors cursor-pointer"
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Sort by Dropdown */}
                            <div className="relative" ref={sortDropdownRef}>
                                <button
                                    onClick={() => { setIsSortDropdownOpen(!isSortDropdownOpen); setIsStatusDropdownOpen(false); setIsFolderDropdownOpen(false); }}
                                    className="flex items-center gap-[0.45vw] px-[0.9vw] py-[0.5vw] bg-white border border-gray-200 rounded-[0.6vw] text-[0.84vw] text-gray-700 hover:bg-gray-50 shadow-sm font-medium cursor-pointer"
                                >
                                    <ArrowDownUp size="0.9vw" className="text-[#ea543a]" />
                                    <span>Sort by - <span className="text-gray-500 font-normal">{sortOption}</span></span>
                                    <ChevronDown size="0.85vw" className="text-gray-400 ml-[0.3vw]" />
                                </button>
                                {isSortDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-[0.25vw] min-w-[13vw] bg-white border border-gray-200 rounded-[0.6vw] shadow-xl z-50 py-[0.3vw]">
                                        {['Recently Created', 'Recently Modified', 'Alphabetical (A-Z)', 'Alphabetical (Z-A)', 'Most Viewed'].map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => { setSortOption(opt); setIsSortDropdownOpen(false); }}
                                                className="w-full text-left px-[1vw] py-[0.45vw] text-[0.8vw] text-gray-700 hover:bg-orange-50 hover:text-[#ea543a] transition-colors cursor-pointer"
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Selected Actions & Multiple Selection */}
                        <div className="flex items-center gap-[1vw]">
                            {/* Empty Trash button when in Trash and no books selected */}
                            {activeFolder === 'Trash' && selectedBooks.length === 0 && filteredBooks.length > 0 && (
                                <button
                                    onClick={handleEmptyTrashClick}
                                    className="flex items-center gap-[0.35vw] px-[0.75vw] py-[0.4vw] bg-white text-red-500 border border-red-200 hover:bg-red-50 hover:border-red-300 rounded-[0.5vw] transition-all shadow-sm text-[0.75vw] font-semibold cursor-pointer"
                                >
                                    <Trash2 size="0.85vw" /> Empty Trash
                                </button>
                            )}

                            {selectedBooks.length > 0 && (
                                <div className="flex items-center gap-[0.5vw]">
                                    {activeFolder === 'Trash' ? (
                                        <>
                                            <button
                                                onClick={handleBulkRestore}
                                                className="flex items-center gap-[0.4vw] px-[0.75vw] py-[0.4vw] bg-blue-600 text-white rounded-[0.5vw] hover:bg-blue-700 transition-colors shadow-sm text-[0.75vw] font-semibold cursor-pointer"
                                            >
                                                <RotateCcw size="0.9vw" /> Restore ({selectedBooks.length})
                                            </button>
                                            <button
                                                onClick={handleBulkPermanentDelete}
                                                className="flex items-center gap-[0.4vw] px-[0.75vw] py-[0.4vw] bg-white text-red-500 border border-red-200 rounded-[0.5vw] hover:bg-red-50 transition-colors shadow-sm text-[0.75vw] font-semibold cursor-pointer"
                                            >
                                                <Trash2 size="0.9vw" /> Delete Permanently ({selectedBooks.length})
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={handleBulkDelete}
                                                className="flex items-center gap-[0.5vw] px-[0.75vw] py-[0.4vw] bg-white text-red-500 border border-red-200 rounded-[0.5vw] hover:bg-red-50 transition-colors shadow-sm text-[0.75vw] font-semibold cursor-pointer"
                                            >
                                                <Trash2 size="0.9vw" /> {(activeFolder === 'Recent Book' || activeFolder === 'Recent') ? 'Remove' : 'Move to trash'}
                                            </button>
                                            {activeFolder !== 'Recent Book' && activeFolder !== 'Recent' && (
                                                <button
                                                    onClick={handleBulkMove}
                                                    className="flex items-center gap-[0.5vw] px-[0.75vw] py-[0.4vw] bg-[#ea543a] text-white rounded-[0.5vw] hover:bg-[#d4452d] transition-colors shadow-sm text-[0.75vw] font-semibold cursor-pointer"
                                                >
                                                    <FolderInput size="0.9vw" /> Move
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Checkbox for multiple selection */}
                            <label className="flex items-center gap-[0.5vw] cursor-pointer select-none" onClick={(e) => { e.preventDefault(); handleSelectAll(); }}>
                                <div className={`w-[1.1vw] h-[1.1vw] rounded-[0.2vw] border flex items-center justify-center transition-all ${isAllSelected ? 'bg-gray-700 border-gray-700' : 'border-gray-400 bg-white'}`}>
                                    {isAllSelected && <Check size="0.75vw" className="text-white" strokeWidth={3} />}
                                </div>
                                <span className="text-[0.85vw] font-medium text-gray-600">Multiple Selection</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-[5vw]">
                        <div className="animate-spin rounded-full h-[3vw] w-[3vw] border-[0.25vw] border-orange-200 border-t-[#ea543a]"></div>
                        <p className="text-gray-500 mt-[1vw] font-medium text-[0.875vw]">Loading Flipbooks...</p>
                    </div>
                ) : filteredBooks.length > 0 ? (
                    <div
                        className="flex-1 overflow-y-auto custom-scrollbar pr-[0.3vw] pb-[2vw] z-10 space-y-[0.85vw] min-h-0"
                        onScroll={() => setActiveBookMenu(null)}
                    >
                        {filteredBooks.map((book) => {
                            const isBookEditing = editingBookId === book.id;
                            const isSelected = selectedBooks.includes(book.id);

                            let actualFolder = book.folder;
                            if (actualFolder === 'Recent Book' || actualFolder === 'Recent book') {
                                const physicalBook = books.find(b => b.realName === book.realName && b.folder !== 'Recent Book' && b.folder !== 'Recent book');
                                if (physicalBook) actualFolder = physicalBook.folder;
                            }

                            const iframeBaseUrl = getSupabaseBaseUrl(
                                user?.emailId?.replace(/[@.]/g, "_"),
                                actualFolder,
                                book.realName
                            );

                            return (
                                <div
                                    key={book.id}
                                    className="flex items-center gap-[0.75vw] group w-full"
                                >
                                    {/* Checkbox Outside Card - Visible on Select */}
                                    <div
                                        className={`transition-all duration-200 ease-in-out cursor-pointer flex items-center justify-center overflow-hidden
                                            ${selectedBooks.length > 0 ? 'w-[1.8vw] opacity-100 mr-[0.2vw]' : 'w-0 opacity-0'}
                                        `}
                                        onClick={(e) => { e.stopPropagation(); toggleBookSelection(book.id); }}
                                    >
                                        <div className={`w-[1.15vw] h-[1.15vw] rounded-[0.2vw] border flex items-center justify-center transition-colors flex-shrink-0
                                            ${isSelected
                                                ? 'bg-gray-800 border-gray-800 text-white'
                                                : 'border-gray-400 bg-white hover:bg-gray-50'
                                            }`}
                                        >
                                            {isSelected && <Check size="0.75vw" className="text-white" strokeWidth={3} />}
                                        </div>
                                    </div>

                                    {/* The Card */}
                                    <div
                                        onDoubleClick={() => toggleBookSelection(book.id)}
                                        className="flex-1 bg-white rounded-[0.9vw] p-[0.9vw] flex gap-[1.2vw] items-center border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-md transition-all relative"
                                    >
                                        {/* Thumbnail (Square with rounded corners) */}
                                        <div className="w-[6vw] h-[6vw] bg-gray-100 rounded-[0.6vw] overflow-hidden flex-shrink-0 border border-gray-100 flex items-center justify-center relative">
                                            <LazyPreview
                                                v_id={book.v_id}
                                                emailId={emailId}
                                                backendUrl={backendUrl}
                                                iframeBaseUrl={iframeBaseUrl}
                                                title={book.title}
                                                imageUrl={book.image || null}
                                            />
                                        </div>

                                        {/* Content Details */}
                                        <div className="flex-1 flex flex-col justify-between min-h-[5.8vw] py-[0.1vw]">
                                            {/* Top Line: Title + Status + Heart & Meta (Created on / Views / Size) */}
                                            <div className="flex items-start justify-between w-full">
                                                <div className="flex items-center gap-[0.5vw]">
                                                    {isBookEditing ? (
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            value={tempBookTitle}
                                                            onChange={(e) => setTempBookTitle(e.target.value)}
                                                            onBlur={saveBookEdit}
                                                            onKeyDown={handleBookKeyDown}
                                                            className="text-[1.1vw] font-bold text-gray-800 border-b border-[#ea543a] focus:outline-none w-[16vw]"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center gap-[0.4vw]">
                                                            <h3 className="text-[1.1vw] font-bold text-[#1f2937] leading-tight">{book.title}</h3>
                                                            {activeFolder !== 'Trash' && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleToggleFavorite(book);
                                                                    }}
                                                                    className="p-[0.15vw] text-gray-300 hover:text-red-500 transition-colors cursor-pointer"
                                                                    title={book.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                                                                >
                                                                    <Heart
                                                                        size="0.85vw"
                                                                        className={book.isFavorite ? "text-red-500 fill-red-500" : "hover:text-red-500"}
                                                                    />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Visibility Pill Badge */}
                                                    {(() => {
                                                        const rawAcc = String(
                                                            book.Visibility?.access || 
                                                            book.Visibility?.type || 
                                                            book.Customized_Settings?.Visibility?.access || 
                                                            book.Customized_Settings?.Visibility?.type || 
                                                            book.settings?.Visibility?.access || 
                                                            book.settings?.Visibility?.type || 
                                                            book.share?.access || 
                                                            book.share?.type || 
                                                            book.access || 
                                                            (book.isPublic === false ? 'private' : 'public')
                                                        ).toLowerCase().trim();

                                                        if (rawAcc.includes('password') || rawAcc.includes('protect')) {
                                                            return (
                                                                <span className="flex items-center gap-[0.25vw] px-[0.5vw] py-[0.12vw] rounded-full text-[0.62vw] font-semibold bg-amber-50 text-amber-600 border border-amber-200/60">
                                                                    <Icon icon="lucide:key-round" className="w-[0.6vw] h-[0.6vw]" />
                                                                    <span>Password</span>
                                                                </span>
                                                            );
                                                        }

                                                        if (rawAcc.includes('invite') || rawAcc.includes('email')) {
                                                            return (
                                                                <span className="flex items-center gap-[0.25vw] px-[0.5vw] py-[0.12vw] rounded-full text-[0.62vw] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-200/60">
                                                                    <Icon icon="lucide:user-check" className="w-[0.6vw] h-[0.6vw]" />
                                                                    <span>Invite</span>
                                                                </span>
                                                            );
                                                        }

                                                        if (rawAcc.includes('private') || book.isPublic === false) {
                                                            return (
                                                                <span className="flex items-center gap-[0.25vw] px-[0.55vw] py-[0.12vw] rounded-full text-[0.62vw] font-semibold bg-gray-100 text-gray-600">
                                                                    <Lock size="0.6vw" />
                                                                    <span>Private</span>
                                                                </span>
                                                            );
                                                        }

                                                        return (
                                                            <span className="flex items-center gap-[0.25vw] px-[0.55vw] py-[0.12vw] rounded-full text-[0.62vw] font-semibold bg-[#e8f7ee] text-[#16a34a]">
                                                                <Globe size="0.6vw" />
                                                                <span>Public</span>
                                                            </span>
                                                        );
                                                    })()}
                                                </div>

                                                {/* Right: Meta Details */}
                                                <div className="flex items-center gap-[1.5vw] text-[0.72vw] text-gray-400 font-medium">
                                                    <span>
                                                        {(activeFolder === 'Recent Book' || activeFolder === 'Recent') ? 'Last Updated on' : 'Created on'} : {(activeFolder === 'Recent Book' || activeFolder === 'Recent') ? formatDisplayDate(book.mtime || book.updatedAt || book.updated || book.createdAt || book.created) : (book.created || '20-11-2025')}
                                                    </span>
                                                    <span>Views : {book.viewsCount !== undefined ? book.viewsCount : (book.views !== undefined ? book.views : 245)}</span>
                                                    <span>Size : {formatDisplaySize(book)}</span>
                                                </div>
                                            </div>

                                            {/* Subtitle: Pages */}
                                            <p className="text-[0.72vw] text-gray-400 font-normal mt-[0.1vw] mb-[0.6vw]">
                                                {book.pages || 12} Pages
                                            </p>

                                            {/* Action Buttons Row */}
                                             <div className={`w-full flex items-center ${activeFolder === 'Trash' ? 'justify-end gap-[1.25vw]' : 'justify-between'} pt-[0.2vw]`}>
                                                 {activeFolder === 'Trash' ? (
                                                     <div className="flex items-center gap-[1.25vw] ml-auto">
                                                         <button
                                                             onClick={() => handleRestoreBook(book)}
                                                             className="flex items-center gap-[0.35vw] cursor-pointer text-[0.75vw] font-medium text-blue-600 hover:text-blue-700 transition-colors whitespace-nowrap shrink-0"
                                                         >
                                                             <RotateCcw size="0.85vw" /> Restore
                                                         </button>
                                                         <button
                                                             onClick={() => handlePermanentDeleteBookClick(book)}
                                                             className="flex items-center gap-[0.35vw] cursor-pointer text-[0.75vw] font-medium text-red-500 hover:text-red-700 transition-colors whitespace-nowrap shrink-0"
                                                         >
                                                             <Trash2 size="0.85vw" /> Delete Permanently
                                                         </button>
                                                     </div>
                                                 ) : (
                                                     <>
                                                         <button 
                                                             onClick={() => {
                                                                 const shareId = book.Visibility?.shareId || book.Customized_Settings?.Visibility?.shareId || book.shareId || book.share?.shareId || book.v_id || encodeURIComponent(book.realName);
                                                                 const rawAcc = String(book.Visibility?.access || book.Customized_Settings?.Visibility?.access || book.share?.access || 'public').toLowerCase();
                                                                 const accessPrefix = rawAcc.includes('private')
                                                                     ? 'share=private'
                                                                     : rawAcc.includes('password')
                                                                     ? 'share=password'
                                                                     : rawAcc.includes('invite')
                                                                     ? 'share=invite'
                                                                     : 'share=public';
                                                                 window.open(`/${accessPrefix}/${shareId}`, '_blank');
                                                             }}
                                                             className="flex items-center cursor-pointer gap-[0.35vw] text-[0.75vw] font-medium text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap shrink-0"
                                                         >
                                                             <Eye size="0.85vw" /> View Book
                                                         </button>

                                                         <button
                                                             onClick={() => {
                                                                 let targetFolder = book.folder;
                                                                 if (targetFolder === 'Recent Book') {
                                                                     const physicalBook = books.find(b => b.realName === book.realName && b.folder !== 'Recent Book');
                                                                     if (physicalBook) targetFolder = physicalBook.folder;
                                                                 }
                                                                 const identifier = book.v_id || encodeURIComponent(book.realName);
                                                                 navigate(`/editor/customized_editor/${encodeURIComponent(targetFolder)}/${identifier}`, { state: { flipbookName: book.realName, pageCount: book.pages } });
                                                             }}
                                                             className="flex items-center gap-[0.35vw] cursor-pointer text-[0.75vw] font-medium text-[#ea543a] hover:text-[#d4452d] transition-colors whitespace-nowrap shrink-0"
                                                         >
                                                             <Wrench size="0.85vw" className="text-[#ea543a]" /> Customize
                                                         </button>

                                                         <button
                                                             onClick={() => {
                                                                 let targetFolder = book.folder;
                                                                 if (targetFolder === 'Recent Book') {
                                                                     const physicalBook = books.find(b => b.realName === book.realName && b.folder !== 'Recent Book');
                                                                     if (physicalBook) targetFolder = physicalBook.folder;
                                                                 }
                                                                 const identifier = book.v_id || encodeURIComponent(book.realName);
                                                                 navigate(`/editor/${encodeURIComponent(targetFolder)}/${identifier}`, { state: { flipbookName: book.realName } });
                                                             }}
                                                             className="flex items-center gap-[0.35vw] cursor-pointer text-[0.75vw] font-medium text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap shrink-0"
                                                         >
                                                             <PenTool size="0.85vw" /> Open in Editor
                                                         </button>

                                                         <button className="flex items-center gap-[0.35vw] cursor-pointer text-[0.75vw] font-medium text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap shrink-0">
                                                             <BarChart2 size="0.85vw" /> Statistic
                                                         </button>

                                                         <button
                                                             onClick={() => handleShareClick(book)}
                                                             className="flex items-center gap-[0.35vw] cursor-pointer text-[0.75vw] font-medium text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap shrink-0"
                                                         >
                                                             <Share2 size="0.85vw" /> Share
                                                         </button>

                                                         <button
                                                             onClick={() => handleDownloadClick(book)}
                                                             className="flex items-center gap-[0.35vw] cursor-pointer text-[0.75vw] font-medium text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap shrink-0"
                                                         >
                                                             <Download size="0.85vw" /> Download
                                                         </button>

                                                         {/* More Options */}
                                                         <div className="relative shrink-0">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                                    const screenHeight = window.innerHeight;
                                                                    const spaceBelow = screenHeight - rect.bottom;
                                                                    const menuHeight = 160;
                                                                    const showAbove = spaceBelow < menuHeight;

                                                                    setMenuPosition({
                                                                        top: showAbove ? (rect.top - 5) : (rect.bottom + 5),
                                                                        left: rect.right,
                                                                        isDropup: showAbove,
                                                                        activeId: book.id
                                                                    });

                                                                    setActiveBookMenu(activeBookMenu === book.id ? null : book.id);
                                                                }}
                                                                className="flex items-center gap-[0.25vw] cursor-pointer text-[0.75vw] font-medium text-gray-600 hover:text-gray-900 transition-colors"
                                                            >
                                                                <MoreVertical size="0.85vw" /> More
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="flex-1 flex flex-col items-center justify-center text-center z-10 py-[5vw]">
                        {activeFolder === 'Recent Book' || activeFolder === 'Recent' ? (
                            <>
                                <div
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="w-[4vw] h-[4vw] rounded-full bg-[#ea543a]/10 flex items-center justify-center mb-[1vw] border border-[#ea543a]/20 cursor-pointer hover:bg-[#ea543a]/20 transition-all"
                                >
                                    <Plus size="2vw" className="text-[#ea543a]" />
                                </div>
                                <h3 className="text-[1.25vw] font-medium text-gray-800 mb-[0.25vw]">Create Flipbook</h3>
                                <p className="text-gray-400 text-[0.875vw]">There are no recent flipbooks</p>
                            </>
                        ) : activeFolder === 'Trash' ? (
                            <>
                                <div className="w-[4vw] h-[4vw] rounded-full bg-red-50 flex items-center justify-center mb-[1vw] border border-red-100">
                                    <Trash2 size="2vw" className="text-red-400" />
                                </div>
                                <h3 className="text-[1.25vw] font-medium text-gray-800 mb-[0.25vw]">Trash is Empty</h3>
                                <p className="text-gray-400 text-[0.875vw]">There are no flipbooks in Trash</p>
                            </>
                        ) : activeFolder === 'Favorites' ? (
                            <>
                                <div className="w-[4vw] h-[4vw] rounded-full bg-rose-50 flex items-center justify-center mb-[1vw] border border-rose-100">
                                    <Heart size="2vw" className="text-rose-400" />
                                </div>
                                <h3 className="text-[1.25vw] font-medium text-gray-800 mb-[0.25vw]">No Favorites Yet</h3>
                                <p className="text-gray-400 text-[0.875vw]">Click the heart icon on any flipbook to add it to Favorites</p>
                            </>
                        ) : activeFolder === 'All Flipbook' || activeFolder === 'All Flipbooks' ? (
                            <>
                                <div
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="w-[4vw] h-[4vw] rounded-full bg-[#ea543a]/10 flex items-center justify-center mb-[1vw] border border-[#ea543a]/20 cursor-pointer hover:bg-[#ea543a]/20 transition-all"
                                >
                                    <Plus size="2vw" className="text-[#ea543a]" />
                                </div>
                                <h3 className="text-[1.25vw] font-medium text-gray-800 mb-[0.25vw]">No Flipbooks Yet</h3>
                                <p className="text-gray-400 text-[0.875vw]">Upload a PDF or choose a template to create your first flipbook</p>
                            </>
                        ) : (
                            <>
                                <div className="w-[4vw] h-[4vw] rounded-full bg-[#ea543a]/5 flex items-center justify-center mb-[1vw] border border-[#ea543a]/10">
                                    <Folder size="2vw" className="text-[#ea543a]/60" />
                                </div>
                                <h3 className="text-[1.25vw] font-medium text-gray-800 mb-[0.25vw]">No Flipbooks Found</h3>
                                <p className="text-gray-400 text-[0.875vw]">This folder is empty</p>
                            </>
                        )}
                    </div>
                )}
            </main>

            {/* Fixed Book Menu Portal */}
            {activeBookMenu && (
                <>
                    <div className="fixed inset-0 z-[100]" onClick={(e) => { e.stopPropagation(); setActiveBookMenu(null); }}></div>
                    <div
                        className="fixed z-[101] w-[12vw] min-w-[165px] bg-white rounded-[0.75vw] shadow-xl border border-gray-500 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                        style={{
                            top: menuPosition.top,
                            left: menuPosition.left,
                            transform: menuPosition.isDropup ? 'translate(-100%, -100%)' : 'translate(-100%, 0)'
                        }}
                    >
                        {/* Find active book */}
                        {(() => {
                            const book = books.find(b => b.id === activeBookMenu);
                            if (!book) return null;
                            return (
                                <>
                                    {activeFolder === 'Trash' ? (
                                        <>
                                            <button
                                                onClick={() => handleRestoreBook(book)}
                                                className="w-full flex items-center gap-[0.5vw] px-[0.75vw] py-[0.625vw] text-[0.75vw] font-medium text-gray-700 hover:bg-blue-600 hover:text-white transition-colors border-b border-gray-50 group cursor-pointer"
                                            >
                                                <RotateCcw size="0.9vw" className="text-blue-600 group-hover:text-white" />
                                                Restore
                                            </button>
                                            <button
                                                onClick={() => handlePermanentDeleteBookClick(book)}
                                                className="w-full flex items-center gap-[0.5vw] px-[0.75vw] py-[0.625vw] text-[0.75vw] font-medium text-red-500 hover:bg-red-500 hover:text-white transition-colors group cursor-pointer"
                                            >
                                                <Trash2 size="0.9vw" className="group-hover:text-white" />
                                                Delete Permanently
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => startEditingBook(book)}
                                                className="w-full flex items-center gap-[0.5vw] px-[0.75vw] py-[0.625vw] text-[0.75vw] font-semibold text-gray-700 hover:bg-black hover:text-white transition-colors border-b border-gray-50 group cursor-pointer"
                                            >
                                                <Edit2 size="0.9vw" className="group-hover:text-white" />
                                                Rename
                                            </button>
                                            <button
                                                onClick={() => handleMoveBookClick(book)}
                                                className="w-full flex items-center gap-[0.5vw] px-[0.75vw] py-[0.625vw] text-[0.75vw] font-medium text-gray-600 hover:bg-black hover:text-white transition-colors border-b border-gray-50 group cursor-pointer"
                                            >
                                                <FolderInput size="0.9vw" className="group-hover:text-white" />
                                                Move to folder
                                            </button>
                                            {activeFolder !== 'Recent Book' && activeFolder !== 'Recent' && (
                                                <button
                                                    onClick={() => handleDuplicateBook(book)}
                                                    className="w-full flex items-center gap-[0.5vw] px-[0.75vw] py-[0.625vw] text-[0.75vw] font-medium text-gray-600 hover:bg-black hover:text-white transition-colors border-b border-gray-50 group cursor-pointer"
                                                >
                                                    <Plus size="0.9vw" className="border border-current rounded-[0.125vw] p-[0.0625vw] group-hover:border-white" />
                                                    Duplicate
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    handleToggleFavorite(book);
                                                    setActiveBookMenu(null);
                                                }}
                                                className="w-full flex items-center gap-[0.5vw] px-[0.75vw] py-[0.625vw] text-[0.75vw] font-medium text-gray-600 hover:bg-black hover:text-white transition-colors border-b border-gray-50 group cursor-pointer"
                                            >
                                                <Heart size="0.9vw" className={book.isFavorite ? "text-red-500 fill-red-500" : "group-hover:text-white"} />
                                                {book.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (activeFolder === 'Recent Book' || activeFolder === 'Recent') {
                                                        handleRemoveFromRecent(book);
                                                    } else {
                                                        handleTrashBookClick(book);
                                                    }
                                                }}
                                                className="w-full flex items-center gap-[0.5vw] px-[0.75vw] py-[0.625vw] text-[0.75vw] font-medium text-red-500 hover:bg-red-500 hover:text-white transition-colors group cursor-pointer"
                                            >
                                                <Trash2 size="0.9vw" className="group-hover:text-white" />
                                                {(activeFolder === 'Recent Book' || activeFolder === 'Recent') ? 'Remove' : 'Move to trash'}
                                            </button>
                                        </>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                </>
            )}



            {/* Move Book Modal */}
            {moveBookModal.isOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[1.5vw] w-full max-w-[25vw] p-[1.5vw] shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-[1vw]">
                            <h3 className="text-[1.25vw] font-bold text-[#343868]">Move to Folder</h3>
                            {!isCreatingInMove ? (
                                <button
                                    onClick={() => setIsCreatingInMove(true)}
                                    className="flex items-center gap-[0.35vw] px-[0.75vw] py-[0.35vw] rounded-full border border-gray-200 shadow-sm text-gray-600 font-medium text-[0.75vw] bg-white hover:bg-gray-50 transition-colors"
                                >
                                    <Plus size="0.85vw" /> New Folder
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsCreatingInMove(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X size="1vw" />
                                </button>
                            )}
                        </div>

                        <div className="space-y-[0.5vw] max-h-[15vw] overflow-y-auto custom-scrollbar pr-[0.25vw] mb-[1.25vw] scroll-smooth" ref={moveModalListRef}>
                            {/* Create Folder Input */}
                            {isCreatingInMove && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300 mb-[0.75vw]">
                                    <label className="block text-[0.75vw] font-medium text-gray-500 mb-[0.25vw]">New Folder Name</label>
                                    <div className="w-full flex items-center gap-[0.5vw] p-[0.35vw] rounded-[0.75vw] border border-[#3b4190] bg-[#3b4190]/5">
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Enter folder name..."
                                            value={newMoveFolderName}
                                            onChange={(e) => setNewMoveFolderName(e.target.value)}
                                            className="flex-1 px-[0.5vw] py-[0.25vw] bg-transparent text-[0.85vw] font-medium focus:outline-none text-[#343868] placeholder-gray-400"
                                            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolderAndMove()}
                                        />
                                        <button onClick={handleCreateFolderAndMove} className="p-[0.35vw] bg-[#3b4190] text-white rounded-[0.5vw] hover:bg-[#2f3575] transition-colors">
                                            <Check size="0.9vw" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {folders.filter(f => f.name !== 'Recent Book').map(folder => {
                                let isCurrent = false;

                                if (moveBookModal.bookId === 'BULK') {
                                    if (activeFolder !== 'Recent Book') {
                                        isCurrent = folder.name === activeFolder;
                                    }
                                } else {
                                    const book = books.find(b => b.id === moveBookModal.bookId);
                                    if (book) {
                                        let currentRealFolder = book.folder;
                                        if (book.folder === 'Recent Book') {
                                            const physicalBook = books.find(b => b.realName === book.realName && b.folder !== 'Recent Book');
                                            if (physicalBook) currentRealFolder = physicalBook.folder;
                                        }
                                        isCurrent = folder.name === currentRealFolder;
                                    }
                                }

                                return (
                                    <button
                                        key={folder.id}
                                        onClick={() => confirmMoveBook(folder.name)}
                                        disabled={isCurrent}
                                        className={`w-full flex items-center gap-[0.75vw] px-[1vw] py-[0.75vw] rounded-[0.75vw] border text-[0.85vw] font-medium transition-all group text-left
                                       ${isCurrent
                                                ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                                                : 'bg-white border-gray-200 text-gray-700 hover:border-[#3b4190] hover:bg-blue-50/50 hover:text-[#3b4190]'
                                            }
                                   `}
                                    >
                                        <Folder size="1vw" className={isCurrent ? "text-gray-300" : "text-gray-400 group-hover:text-[#3b4190]"} />
                                        <span className="truncate flex-1">{folder.name}</span>
                                        {isCurrent && <span className="text-[0.65vw] text-gray-400 font-normal ml-2">(Current)</span>}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => {
                                setMoveBookModal({ isOpen: false, bookId: null, isBulk: false });
                                setIsCreatingInMove(false);
                                setNewMoveFolderName('');
                            }}
                            className="w-full py-[0.65vw] rounded-[0.75vw] border border-gray-300 text-gray-600 text-[0.85vw] font-semibold hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Folder Delete Alert */}
            <AlertModal
                isOpen={deleteConfirmation.isOpen}
                onClose={() => setDeleteConfirmation({ isOpen: false, folderId: null, folderName: '' })}
                onConfirm={confirmDelete}
                type="error"
                title="Delete Folder"
                message={`Are you sure you want to delete "${deleteConfirmation.folderName}"? This action cannot be undone.`}
                showCancel={true}
                confirmText="Delete"
                cancelText="Cancel"
                isLoading={isLoading}
            />

            {/* Book Delete Alert */}
            <AlertModal
                isOpen={deleteBookConfirmation.isOpen}
                onClose={() => setDeleteBookConfirmation({ isOpen: false, bookId: null, bookTitle: '', isPublished: false })}
                onConfirm={confirmDeleteBook}
                type={deleteBookConfirmation.isTrash ? "warning" : "error"}
                title={
                    deleteBookConfirmation.isEmptyTrash
                        ? "Empty Trash"
                        : deleteBookConfirmation.isTrash
                        ? (deleteBookConfirmation.isPublished
                            ? (deleteBookConfirmation.bookId === 'BULK' ? "Unpublish & Move to Trash" : "Unpublish & Move to Trash")
                            : (deleteBookConfirmation.bookId === 'BULK' ? "Move Selected Flipbooks to Trash" : "Move Flipbook to Trash"))
                        : (deleteBookConfirmation.isRecent || activeFolder === 'Recent Book')
                        ? (deleteBookConfirmation.bookId === 'BULK' ? "Remove Selected Flipbooks" : "Remove Flipbook from Recent")
                        : (deleteBookConfirmation.bookId === 'BULK' ? "Permanently Delete Flipbooks" : "Permanently Delete Flipbook")
                }
                message={
                    deleteBookConfirmation.isEmptyTrash
                        ? "Are you sure you want to permanently delete all flipbooks in Trash? This action cannot be undone."
                        : deleteBookConfirmation.isTrash
                        ? (deleteBookConfirmation.isPublished
                            ? (deleteBookConfirmation.bookId === 'BULK'
                                ? `${deleteBookConfirmation.publishedCount} of the selected flipbooks are currently published. If you move them to Trash, they will be automatically unpublished and readers won't be able to access them. Do you want to unpublish and move to Trash?`
                                : `"${deleteBookConfirmation.bookTitle}" is currently published. If you move it to Trash, the flipbook will be unpublished and readers won't be able to access it. Do you want to unpublish and move to Trash?`)
                            : (deleteBookConfirmation.bookId === 'BULK'
                                ? `Are you sure you want to move ${deleteBookConfirmation.bookTitle} to Trash? You can restore them anytime.`
                                : `Are you sure you want to move "${deleteBookConfirmation.bookTitle}" to Trash? You can restore it anytime from the Trash folder.`))
                        : (deleteBookConfirmation.isRecent || activeFolder === 'Recent Book')
                        ? `Are you sure you want to remove "${deleteBookConfirmation.bookTitle}" from Recent Books?`
                        : `Are you sure you want to permanently delete "${deleteBookConfirmation.bookTitle}"? This action cannot be undone.`
                }
                showCancel={true}
                confirmText={
                    deleteBookConfirmation.isEmptyTrash
                        ? "Empty Trash"
                        : deleteBookConfirmation.isTrash
                        ? (deleteBookConfirmation.isPublished ? "Unpublish & Move" : "Move to trash")
                        : (deleteBookConfirmation.isRecent || activeFolder === 'Recent Book')
                        ? "Remove"
                        : "Delete Permanently"
                }
                cancelText="Cancel"
                isLoading={isLoading}
            />

            {/* Create Flipbook Modal */}
            <CreateFlipbookModal
                isOpen={isCreateModalOpen}
                onClose={() => { setIsCreateModalOpen(false); setInitialDroppedFiles(null); }}
                onUpload={handleUploadPDF}
                onTemplate={handleUseTemplate}
                initialView={createModalInitialView}
                initialTemplateId={selectedTemplateIdForModal}
                existingFlipbooks={books.map(b => b.realName || b.title)}
                initialFiles={initialDroppedFiles}
            />

            {/* PDF Processing Overlay */}
            <PdfProcessingLoader progress={processingProgress} onCancel={handleCancelUploadPDF} />

            {/* General Loading Overlay (without specific progress) */}
            <AnimatePresence>
                {isLoading && !processingProgress && (
                    <motion.div
                        key="myflipbooks-loader"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="fixed top-[8vh] left-0 right-0 bottom-0 z-40 flex flex-col items-center justify-center bg-white gap-3"
                    >
                        <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
                        <span className="text-[0.85vw] font-semibold text-gray-600 tracking-wide">Loading Flipbooks...</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Generic Alert Modal */}
            <AlertModal
                isOpen={alertState.isOpen}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                type={alertState.type}
                title={alertState.title}
                message={alertState.message}
                showCancel={alertState.showCancel}
                onConfirm={alertState.onConfirm}
                isLoading={isLoading}
            />

            {/* Conflict / Rename & Move Modal */}
            {conflictModal.isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[1vw] w-full max-w-[28vw] p-[1.5vw] shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="text-center mb-[1.5vw]">
                            <div className="w-[3vw] h-[3vw] bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-[0.75vw]">
                                <CheckSquare size="1.5vw" className="text-orange-600" />
                            </div>
                            <h3 className="text-[1.25vw] font-semibold text-gray-900 mb-[0.5vw]">Flipbook Already Exists</h3>
                            <p className="text-[0.875vw] text-gray-500">
                                A flipbook named <span className="font-semibold text-gray-800">"{conflictModal.book?.realName}"</span> already exists in <span className="font-semibold text-[#3b4190]">{conflictModal.targetFolder}</span>.
                            </p>
                            <p className="text-[0.875vw] text-gray-500 mt-[0.25vw]">Please rename it to continue moving.</p>
                        </div>

                        <div className="mb-[1.5vw]">
                            <label className="block text-[0.75vw] font-semibold text-gray-700 uppercase mb-[0.5vw]">New Name</label>
                            <input
                                autoFocus
                                type="text"
                                value={conflictModal.newName}
                                onChange={(e) => setConflictModal(prev => ({ ...prev, newName: e.target.value }))}
                                className="w-full px-[1vw] py-[0.75vw] rounded-[0.75vw] border border-gray-300 focus:border-[#3b4190] focus:ring-2 focus:ring-blue-100 outline-none text-gray-800 font-medium transition-all text-[0.875vw]"
                            />
                        </div>

                        <div className="flex gap-[0.75vw]">
                            <button
                                onClick={() => setConflictModal({ isOpen: false, book: null, targetFolder: '', newName: '' })}
                                className="flex-1 py-[0.625vw] rounded-[0.75vw] border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors text-[0.875vw]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRenameAndMove}
                                className="flex-1 py-[0.625vw] rounded-[0.75vw] bg-[#3b4190] text-white font-semibold hover:bg-[#323675] transition-colors shadow-lg shadow-blue-900/20 text-[0.875vw]"
                            >
                                Rename & Move
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Share Modal */}
            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                currentBook={selectedFlipbook}
                flipbookThumbnail={selectedFlipbook?.image ? resolveUploadsPath(selectedFlipbook.image) : null}
            />

            {/* Export Modal */}
            <ExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                currentBook={selectedFlipbook}
                isFromMyFlipbooks={true}
            />
        </div>
    );
}