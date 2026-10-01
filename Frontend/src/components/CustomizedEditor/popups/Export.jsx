import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Download, X, Loader2, Check } from 'lucide-react';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';

// Export Component handling Button + Popup + Download Logic
const Export = ({
    isOpen,
    onClose,
    hideButton = false,
    pages = [],
    bookName = "Flipbook",
    currentPage = 1,
    isThreedEditor = false,
    isMobile = false,
    isLandscape = false,
    isTablet = false
}) => {
    // Internal state for popup visibility if not controlled externally
    const [internalShow, setInternalShow] = useState(false);

    // Derived visibility: External 'isOpen' takes precedence if defined
    const show = isOpen !== undefined ? isOpen : internalShow;

    const handleOpen = () => {
        if (!isThreedEditor) {
            setInternalShow(true);
        }
    };

    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            setInternalShow(false);
        }
    };

    // --- Popup State ---
    const [exportType, setExportType] = useState('current'); // current, all, custom
    const [selectedPages, setSelectedPages] = useState([]);
    const [isExporting, setIsExporting] = useState(false);
    const [exportingFormat, setExportingFormat] = useState(null); // 'jpg', 'png', 'pdf'

    // Reset selections when opening
    useEffect(() => {
        if (show) {
            // Optional: reset or keep state? ExportModal kept state.
            // keeping state for now.
        }
    }, [show]);

    const totalPages = pages.length;

    const togglePage = (pageNum) => {
        if (selectedPages.includes(pageNum)) {
            setSelectedPages(selectedPages.filter(p => p !== pageNum));
        } else {
            setSelectedPages([...selectedPages, pageNum]);
        }
    };

    // --- Download Logic (Ported from MainEditor.jsx) ---
    const handleDownloadPages = async (pagesToExport, format = 'png') => {
        try {
            const PAGE_WIDTH = 595;
            const PAGE_HEIGHT = 842;

            // Helper to sanitize filenames
            const sanitizeName = (name) => (name || 'Untitled').replace(/[^a-z0-9 _-]/gi, '_').replace(/\s+/g, '_');
            const bookNameClean = sanitizeName(bookName) || 'Flipbook';

            // Helper to render page to canvas
            const renderPageToCanvas = async (html, scale = 4) => {
                const hiddenFrame = document.createElement('iframe');
                hiddenFrame.style.width = `${PAGE_WIDTH}px`;
                hiddenFrame.style.height = `${PAGE_HEIGHT}px`;
                hiddenFrame.style.position = 'fixed';
                hiddenFrame.style.top = '0';
                hiddenFrame.style.left = '0';
                hiddenFrame.style.zIndex = '-9999';
                hiddenFrame.style.border = 'none';
                document.body.appendChild(hiddenFrame);

                const doc = hiddenFrame.contentDocument;
                if (!doc) throw new Error("Could not create iframe document");

                doc.write(html);
                doc.close();

                // Inject styles
                const style = doc.createElement('style');
                style.innerHTML = `
                    html, body {
                        width: 595px !important;
                        height: 842px !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        background: white !important;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                `;

                if (doc.head) doc.head.appendChild(style);
                else if (doc.body) doc.body.appendChild(style);
                else {
                    const head = doc.createElement('head');
                    doc.documentElement.appendChild(head);
                    head.appendChild(style);
                }

                // Wait for images/content to load
                await new Promise(resolve => setTimeout(resolve, 1500));

                const canvas = await html2canvas(doc.documentElement, {
                    scale: scale,
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                    width: PAGE_WIDTH,
                    height: PAGE_HEIGHT,
                    x: 0,
                    y: 0,
                    backgroundColor: '#ffffff'
                });

                document.body.removeChild(hiddenFrame);
                return canvas;
            };

            if (format === 'pdf') {
                const pdf = new jsPDF('p', 'pt', [PAGE_WIDTH, PAGE_HEIGHT]);

                for (let i = 0; i < pagesToExport.length; i++) {
                    const pageNum = pagesToExport[i];
                    const page = pages.find((p, idx) => (idx + 1) === pageNum);
                    const pageHTML = page?.html || page?.content || '';

                    const canvas = await renderPageToCanvas(pageHTML, 4);
                    const imgData = canvas.toDataURL('image/jpeg', 0.95);

                    if (i > 0) pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
                    pdf.addImage(imgData, 'JPEG', 0, 0, PAGE_WIDTH, PAGE_HEIGHT);
                }

                pdf.save(`${bookNameClean}.pdf`);

            } else {
                const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
                const ext = format === 'jpg' ? 'jpg' : 'png';

                if (pagesToExport.length === 1) {
                    const pageNum = pagesToExport[0];
                    const page = pages.find((p, i) => (i + 1) === pageNum);
                    const pageNameClean = sanitizeName(page?.name || `Page_${pageNum}`);

                    const canvas = await renderPageToCanvas(page?.html || page?.content || '', 4);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            saveAs(blob, `${bookNameClean}_${pageNameClean}.${ext}`);
                        } else {
                            throw new Error("Failed to generate image blob");
                        }
                    }, mimeType);

                } else {
                    const zip = new JSZip();

                    for (const pageNum of pagesToExport) {
                        const page = pages.find((p, i) => (i + 1) === pageNum);
                        const pageNameClean = sanitizeName(page?.name || `Page_${pageNum}`);

                        const canvas = await renderPageToCanvas(page?.html || page?.content || '', 4);

                        const blob = await new Promise(resolve => canvas.toBlob(resolve, mimeType));
                        if (blob) {
                            zip.file(`${pageNameClean}.${ext}`, blob);
                        }
                    }

                    const content = await zip.generateAsync({ type: 'blob' });
                    saveAs(content, `${bookNameClean}.zip`);
                }
            }
        } catch (error) {
            console.error("Export failed:", error);
            alert("Export failed. See console for details.");
        }
    };

    const handleExportClick = async (format) => {
        setIsExporting(true);
        setExportingFormat(format);

        let pagesToExport = [];

        if (exportType === 'current') {
            pagesToExport = [currentPage + 1]; // currentPage is 0-indexed usually in PreviewArea, adjust if needed
            // Wait, PreviewArea passes currentPage (0-indexed). Logic below expects 1-based page numbers?
            // "const page = pages.find((p, idx) => (idx + 1) === pageNum);"
            // So if currentPage is 0, pageNum should be 1.
        } else if (exportType === 'all') {
            pagesToExport = Array.from({ length: totalPages }, (_, i) => i + 1);
        } else {
            // Custom
            pagesToExport = selectedPages.sort((a, b) => a - b);
        }

        try {
            await handleDownloadPages(pagesToExport, format);
        } catch (error) {
            console.error("Export process error:", error);
        } finally {
            setIsExporting(false);
            setExportingFormat(null);
            handleClose();
        }
    };


    return (
        <>
            {/* Export Button (Optional, can be hidden) */}
            {!hideButton && (
                <button
                    onClick={handleOpen}
                    disabled={isThreedEditor}
                    className={`bg-black text-white rounded-lg flex items-center justify-center transition-colors px-5 py-2.5 ml-1 ${isThreedEditor
                        ? 'opacity-50 cursor-not-allowed pointer-events-none'
                        : 'hover:bg-gray-800'
                        }`}
                    style={{ gap: '0.5rem' }}
                >
                    <Download size={18} />
                    <span className="font-medium text-sm">Export</span>
                </button>
            )}

            {/* Export Modal UI */}
            {show && (
                isTablet ? (
                    ReactDOM.createPortal(
                        <div 
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34cqw] bg-[#f9fafb] rounded-[1.4cqw] shadow-[0_1cqw_3cqw_rgba(0,0,0,0.15)] flex flex-col pointer-events-auto z-50 border-[1px] border-white/20 animate-in fade-in zoom-in-95 duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-[1.7cqw] pb-[0.8cqw]">
                                <h2 className="text-[1.7cqw] font-bold text-gray-900">
                                    Export File
                                </h2>
                                <button 
                                    onClick={handleClose} 
                                    className="rounded-full transition-colors flex items-center justify-center p-[0.3cqw] hover:bg-gray-200 text-gray-500"
                                >
                                    <X className="w-[1.7cqw] h-[1.7cqw]" />
                                </button>
                            </div>

                            <div className="px-[1.7cqw]">
                                <div className="h-px bg-gray-200 w-full mb-[1.4cqw]"></div>
                            </div>

                            <div className="px-[1.7cqw] flex-1 overflow-y-auto custom-scrollbar">
                                <p className="text-[1.2cqw] font-medium text-gray-600 mb-[1cqw]">
                                    Select the Export type <span className="text-red-500">*</span>
                                </p>

                                <div className="space-y-[1.2cqw] mb-[1.7cqw]">
                                    {[
                                        { id: 'current', label: 'Export Current Pages' },
                                        { id: 'all', label: 'Export Entire Pages' },
                                        { id: 'custom', label: 'Export Custom Selection Pages' }
                                    ].map((option) => (
                                        <label key={option.id} className="flex items-center gap-[0.9cqw] cursor-pointer group">
                                            <div className="relative flex items-center justify-center">
                                                <input
                                                    type="radio"
                                                    name="exportType"
                                                    value={option.id}
                                                    checked={exportType === option.id}
                                                    onChange={(e) => setExportType(e.target.value)}
                                                    className="peer appearance-none border-gray-400 rounded-full transition-all w-[1.6cqw] h-[1.6cqw] border-[1px] checked:border-[#6366f1] checked:border-[3px]"
                                                />
                                            </div>
                                            <span className="text-[1.2cqw] font-medium text-gray-700">{option.label}</span>
                                        </label>
                                    ))}
                                </div>

                                {/* Custom Selection List */}
                                {exportType === 'custom' && (
                                    <div className="border mt-[0.9cqw] animate-in slide-in-from-top-2 duration-200 bg-white border-gray-200 rounded-[1cqw] shadow-sm overflow-hidden mb-[1.4cqw]">
                                        <div className="px-[1.4cqw] py-[0.9cqw] border-b border-gray-100">
                                            <span className="text-gray-800 text-[1.2cqw] font-semibold">Select Pages</span>
                                        </div>
                                        <div className="max-h-[14cqw] p-[0.6cqw] overflow-y-auto custom-scrollbar">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                                                <label
                                                    key={pageNum}
                                                    className="flex items-center gap-[0.9cqw] px-[0.9cqw] py-[0.7cqw] hover:bg-gray-50 rounded-[0.7cqw] cursor-pointer transition-colors"
                                                >
                                                    <div className="relative flex items-center justify-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedPages.includes(pageNum)}
                                                            onChange={() => togglePage(pageNum)}
                                                            className="peer appearance-none border-gray-300 rounded-[3px] transition-all w-[1.4cqw] h-[1.4cqw] border-[1.5px] checked:bg-[#6366f1] border-gray-300"
                                                        />
                                                        <Check className="w-[1cqw] h-[1cqw] text-white absolute opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={2} />
                                                    </div>
                                                    <span className={`text-[1.2cqw] ${selectedPages.includes(pageNum) ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                                                        Page {pageNum}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer Area - Buttons */}
                            <div className="p-[1.7cqw] pt-0 flex flex-col gap-[0.9cqw]">
                                {['jpg', 'png', 'pdf'].map((fmt) => (
                                    <button
                                        key={fmt}
                                        onClick={() => handleExportClick(fmt)}
                                        disabled={isExporting}
                                        className="w-full flex items-center justify-center gap-[0.9cqw] transition-all active:scale-[0.98] disabled:opacity-50 py-[1.1cqw] bg-black text-white rounded-[0.8cqw] font-semibold text-[1.3cqw] tracking-wide shadow-md hover:bg-gray-900"
                                    >
                                        {isExporting && exportingFormat === fmt ? <Loader2 className="w-[1.5cqw] h-[1.5cqw] animate-spin" /> : null}
                                        {fmt.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>,
                        document.getElementById('tablet-download-portal') || document.body
                    )
                ) : (
                    <div 
                        className={`absolute inset-0 z-[5000] flex items-center justify-center p-4 font-sans bg-transparent pointer-events-auto`} 
                        onClick={handleClose}
                    >
                        <div 
                            className={`
                                ${isMobile 
                                    ? `bg-[#f9fafb] ${isLandscape ? 'w-[300px] p-3' : 'w-[210px] p-3.5'} rounded-2xl shadow-2xl border border-gray-200` 
                                    : 'bg-[#f9fafb] rounded-[1vw] shadow-2xl w-[22vw] border border-white/20'
                                }
                                flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200
                            `} 
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className={`flex items-center justify-between ${isMobile ? (isLandscape ? 'mb-2' : 'mb-3') : 'p-[1.2vw] pb-[0.5vw]'}`}>
                                <h2 className={`${isMobile ? (isLandscape ? 'text-[14px]' : 'text-[14px]') : 'text-[1.1vw]'} font-bold text-gray-900`}>
                                    {isMobile ? 'Download File' : 'Export File'}
                                </h2>
                                <button 
                                    onClick={handleClose} 
                                    className={`rounded-full transition-colors flex items-center justify-center ${isMobile ? (isLandscape ? 'w-6 h-6 bg-gray-100' : 'w-7 h-7 bg-gray-100') + ' hover:bg-gray-200 text-gray-500' : 'p-[0.2vw] hover:bg-gray-200 text-gray-500'}`}
                                >
                                    <X className={isMobile ? (isLandscape ? 'w-3 h-3' : 'w-3.5 h-3.5') : 'w-[1.2vw] h-[1.2vw]'} />
                                </button>
                            </div>

                            {!isMobile && (
                                <div className="px-[1.2vw]">
                                    <div className="h-px bg-gray-200 w-full mb-[1vw]"></div>
                                </div>
                            )}

                            <div className={`${isMobile ? (isLandscape ? 'mb-2' : 'mb-4') : 'px-[1.2vw] flex-1 overflow-y-auto custom-scrollbar'}`}>
                                <p className={`${isMobile ? (isLandscape ? 'text-[11px]' : 'text-[11px]') : 'text-[0.75vw]'} font-medium text-gray-600 mb-2`}>
                                    Select the Export type <span className="text-red-500">*</span>
                                </p>

                                <div className={`${isMobile ? (isLandscape ? 'space-y-1.5' : 'space-y-3') : 'space-y-[0.8vw] mb-[1.2vw]'}`}>
                                    {[
                                        { id: 'current', label: 'Export Current Pages' },
                                        { id: 'all', label: 'Export Entire Pages' },
                                        { id: 'custom', label: 'Export Custom Selection Pages' }
                                    ].map((option) => (
                                        <label key={option.id} className="flex items-center gap-2.5 cursor-pointer group">
                                            <div className="relative flex items-center justify-center">
                                                <input
                                                    type="radio"
                                                    name="exportType"
                                                    value={option.id}
                                                    checked={exportType === option.id}
                                                    onChange={(e) => setExportType(e.target.value)}
                                                    className={`peer appearance-none border-gray-400 rounded-full transition-all ${isMobile ? (isLandscape ? 'w-3 h-3 border-[1.5px] checked:border-[3px]' : 'w-4 h-4 border-[1.5px] checked:border-[4px]') + ' checked:border-[#6366f1]' : 'w-[1.1vw] h-[1.1vw] border-[1.5px] border-gray-400 checked:border-[#6366f1] checked:border-[4px]'}`}
                                                />
                                            </div>
                                            <span className={`${isMobile ? (isLandscape ? 'text-[11px]' : 'text-[11.5px]') : 'text-[0.8vw]'} font-medium text-gray-700`}>{option.label}</span>
                                        </label>
                                    ))}
                                </div>

                                {/* Custom Selection List */}
                                {exportType === 'custom' && (
                                    <div className={`border mt-3 animate-in slide-in-from-top-2 duration-200 ${isMobile ? 'bg-white border-gray-200 rounded-xl overflow-hidden mb-2 shadow-sm' : 'bg-white border-gray-200 rounded-[0.5vw] shadow-sm overflow-hidden mb-[1vw]'}`}>
                                        <div className={`${isMobile ? 'px-3 py-2 border-b border-gray-100' : 'px-[1vw] py-[0.6vw] border-b border-gray-100'}`}>
                                            <span className={`${isMobile ? 'text-gray-800 text-[12px]' : 'text-gray-800 text-[0.75vw]'} font-semibold`}>Select Pages</span>
                                        </div>
                                        <div className={`${isMobile ? 'max-h-[140px] p-2' : 'max-h-[9vw] p-[0.4vw]'} overflow-y-auto custom-scrollbar`}>
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                                                <label
                                                    key={pageNum}
                                                    className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                                                >
                                                    <div className="relative flex items-center justify-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedPages.includes(pageNum)}
                                                            onChange={() => togglePage(pageNum)}
                                                            className={`peer appearance-none border-gray-300 rounded-[4px] transition-all ${isMobile ? 'w-4 h-4 border-[1.5px] checked:bg-[#6366f1] checked:border-[#6366f1]' : 'w-[1vw] h-[1vw] border-[1.5px] checked:bg-[#6366f1] border-gray-300'}`}
                                                        />
                                                        <Check className={`${isMobile ? 'w-3 h-3 text-white' : 'w-[0.7vw] h-[0.7vw] text-white'} absolute opacity-0 peer-checked:opacity-100 pointer-events-none`} strokeWidth={3} />
                                                    </div>
                                                    <span className={`${isMobile ? 'text-gray-900 text-[13px]' : 'text-[0.75vw]'} ${selectedPages.includes(pageNum) ? (isMobile ? 'text-gray-900 font-medium' : 'text-gray-900 font-medium') : (isMobile ? 'text-gray-600' : 'text-gray-600')}`}>
                                                        Page {pageNum}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer Area - Buttons */}
                            <div className={`${isMobile ? (isLandscape ? 'grid grid-cols-2 gap-2 mt-1' : 'flex flex-col gap-3') : 'p-[1.2vw] pt-0 flex flex-col gap-[0.6vw]'}`}>
                                {['jpg', 'png', 'pdf'].map((fmt) => (
                                    <button
                                        key={fmt}
                                        onClick={() => handleExportClick(fmt)}
                                        disabled={isExporting}
                                        className={`
                                            w-full flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50
                                            ${isMobile 
                                                ? (isLandscape ? 'py-1.5' : 'py-2') + ' bg-black text-white rounded-xl font-bold ' + (isLandscape ? 'text-[11px]' : 'text-[11.5px]') + ' shadow-sm hover:bg-gray-900' 
                                                : 'py-[0.6vw] bg-black text-white rounded-[0.4vw] font-semibold text-[0.8vw] tracking-wide shadow-lg hover:bg-gray-900'
                                            }
                                            ${isLandscape && fmt === 'pdf' ? 'col-span-2' : ''}
                                        `}
                                    >
                                        {isExporting && exportingFormat === fmt ? <Loader2 className={isMobile ? (isLandscape ? 'w-3 h-3 animate-spin' : 'w-4 h-4 animate-spin') : 'w-[1vw] h-[1vw] animate-spin'} /> : null}
                                        {fmt.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            )}
        </>
    );
};

export default Export;
