import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { X, Link as LinkIcon, Copy, QrCode, Download, Share2, Mail, Instagram, Edit3, ArrowRight, ChevronRight, ChevronLeft, Check, Sliders, Upload, ChevronDown, BookOpen } from 'lucide-react';
import { Icon } from '@iconify/react';
import ColorPicker from './ThreedEditor/ColorPicker';
import TemplateColorPicker from './TemplateEditor/ColorPicker';
import QRCodeStyling from 'qr-code-styling';
import html2canvas from 'html2canvas';
import { getSupabaseBaseUrl } from '../utils/supabaseUtils';


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
                        .catch(() => { })
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
        <div ref={containerRef} className="w-full h-full flex items-center justify-center relative bg-white p-[0.8vw] rounded-[0.5vw] shadow-[0_0.4vw_1.2vw_rgba(0,0,0,0.08)] overflow-hidden">
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
                <img src={`${backendUrl}${imageUrl}`} alt={title} className="w-full h-full object-contain" />
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

// Custom QR Code component utilizing qr-code-styling for premium aesthetics
const CustomQRCode = React.forwardRef(({
    value,
    size = 256,
    fgColor = '#000000',
    bgColor = '#ffffff',
    dotType = 'square',
    cornerSquareType = 'square',
    cornerDotType = 'square',
    level = 'M',
    logo = '',
    style = {}
}, ref) => {
    const containerRef = useRef(null);
    const qrStylingRef = useRef(null);

    useEffect(() => {
        const qrCode = new QRCodeStyling({
            type: 'svg',
            width: size,
            height: size,
            data: value || 'https://google.com',
            margin: Math.max(2, Math.round(size * 0.05)),
            dotsOptions: {
                color: fgColor,
                type: dotType
            },
            backgroundOptions: {
                color: bgColor === 'transparent' ? 'rgba(0,0,0,0)' : bgColor
            },
            cornersSquareOptions: {
                color: fgColor,
                type: cornerSquareType
            },
            cornersDotOptions: {
                color: fgColor,
                type: cornerDotType
            },
            qrOptions: {
                errorCorrectionLevel: level
            },
            imageOptions: {
                crossOrigin: 'anonymous',
                margin: 5,
                hideBackgroundDots: true
            },
            image: logo || undefined
        });

        qrStylingRef.current = qrCode;

        if (containerRef.current) {
            containerRef.current.innerHTML = '';
            qrCode.append(containerRef.current);
        }

        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, []);

    useEffect(() => {
        if (!qrStylingRef.current) return;

        const animFrame = requestAnimationFrame(() => {
            qrStylingRef.current.update({
                type: 'svg',
                width: size,
                height: size,
                data: value || 'https://google.com',
                margin: Math.max(2, Math.round(size * 0.05)),
                dotsOptions: {
                    color: fgColor,
                    type: dotType
                },
                backgroundOptions: {
                    color: bgColor === 'transparent' ? 'rgba(0,0,0,0)' : bgColor
                },
                cornersSquareOptions: {
                    color: fgColor,
                    type: cornerSquareType
                },
                cornersDotOptions: {
                    color: fgColor,
                    type: cornerDotType
                },
                qrOptions: {
                    errorCorrectionLevel: level
                },
                image: logo || undefined
            });
        });

        return () => cancelAnimationFrame(animFrame);
    }, [value, size, fgColor, bgColor, dotType, cornerSquareType, cornerDotType, level, logo]);

    React.useImperativeHandle(ref, () => ({
        download: async (options) => {
            if (qrStylingRef.current) {
                try {
                    await qrStylingRef.current.download(options);
                } catch (e) {
                    console.error('Error downloading QR code via qr-code-styling:', e);
                }
            }
        }
    }));

    return (
        <div className="w-full h-full flex items-center justify-center overflow-hidden" style={style}>
            <style dangerouslySetInnerHTML={{
                __html: `
                .qr-styling-container-fisto canvas,
                .qr-styling-container-fisto svg {
                    width: 100% !important;
                    height: 100% !important;
                    max-width: 100% !important;
                    max-height: 100% !important;
                    display: block !important;
                }
            ` }} />
            <div
                ref={containerRef}
                className="qr-styling-container-fisto flex items-center justify-center w-full h-full"
            />
        </div>
    );
});


const ShareModal = ({ isOpen, onClose, flipbookUrl, flipbookThumbnail, currentBook, activeLayout, isTabletLayout = false, isMobileLayout = false, isAbsolutePosition = false }) => {
    const [addCover, setAddCover] = useState(false);

    const getResolvedFirstPageHtml = () => {
        if (!currentBook?.firstPageHtml) return '';
        const storedUser = localStorage.getItem('user');
        const user = storedUser ? JSON.parse(storedUser) : null;
        const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
        const emailFolder = user?.emailId ? user.emailId.replace(/[@.]/g, "_") : '';
        const folderName = currentBook?.folder || currentBook?.folderName || '';
        const bookName = currentBook?.realName || currentBook?.title || currentBook?.flipbookName || '';
        const basePath = getSupabaseBaseUrl(emailFolder, folderName, bookName);

        let resolvedHtml = currentBook.firstPageHtml;
        resolvedHtml = resolvedHtml.replace(/(href|src|xlink:href)=(["'])\.?\/?assets\//g, `$1=$2${basePath}assets/`);
        if (typeof rewriteHtmlUploadsToSupabase === 'function') {
            resolvedHtml = rewriteHtmlUploadsToSupabase(resolvedHtml);
        }
        return resolvedHtml;

    };
    const [copied, setCopied] = useState(false);
    const [embedCopied, setEmbedCopied] = useState(false);
    const [showEmbedCode, setShowEmbedCode] = useState(false);
    const [isEditingQR, setIsEditingQR] = useState(false);
    const [activeQRTab, setActiveQRTab] = useState('templates');
    const [selectedTemplateIdx, setSelectedTemplateIdx] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [exportFormat, setExportFormat] = useState('JPG');
    const [showExportDropdown, setShowExportDropdown] = useState(false);

    // Saved configuration for the main view (defaults to standard black & white)
    const [savedConfig, setSavedConfig] = useState({
        hasCustomized: false,
        qrColor: '#000000',
        qrBgColor: '#ffffff',
        qrDotType: 'square',
        qrCornerSquareType: 'square',
        qrCornerDotType: 'square',
        qrLevel: 'M',
        qrLogo: null,
        customBgColor: '#ffffff',
        qrBgType: 'Color',
        qrBgImage: null,
        qrBgOpacity: 100,
        qrBgFit: 'Fit',
        text1: 'ACCEPTING NEW CLIENTS',
        text2: 'Tap to scan',
        text1Color: '#000000',
        text2Color: '#000000',
        text1FontFamily: 'Poppins',
        text2FontFamily: 'Poppins',
        text1FontSize: 24,
        text2FontSize: 12,
        text1FontWeight: 'Semi Bold',
        text2FontWeight: 'Bold',
        text1Bold: true,
        text2Bold: true,
        text1Italic: false,
        text2Italic: false,
        text1Underline: false,
        text2Underline: false,
        text1Linethrough: false,
        text2Linethrough: false,
        selectedTemplateIdx: 0,
    });

    // Customization States
    const [qrColor, setQrColor] = useState('#2E7D32');
    const [qrBgColor, setQrBgColor] = useState('transparent');
    const [qrLevel, setQrLevel] = useState('M');
    const [qrBgType, setQrBgType] = useState('Color');
    const [customBgColor, setCustomBgColor] = useState('#D7D8E8');
    const [showBgTypeDropdown, setShowBgTypeDropdown] = useState(false);
    const [qrBgFit, setQrBgFit] = useState('Fit');
    const [qrBgOpacity, setQrBgOpacity] = useState(100);
    const [showBgFitDropdown, setShowBgFitDropdown] = useState(false);
    const [bgTypeDirection, setBgTypeDirection] = useState('down');
    const [bgFitDirection, setBgFitDirection] = useState('down');

    // Shape customization states
    const [qrDotType, setQrDotType] = useState('square');
    const [qrCornerSquareType, setQrCornerSquareType] = useState('square');
    const [qrCornerDotType, setQrCornerDotType] = useState('square');

    // Shape dropdown states
    const [showDotTypeDropdown, setShowDotTypeDropdown] = useState(false);
    const [showCornerSquareTypeDropdown, setShowCornerSquareTypeDropdown] = useState(false);
    const [showCornerDotTypeDropdown, setShowCornerDotTypeDropdown] = useState(false);
    const [dotTypeDirection, setDotTypeDirection] = useState('down');
    const [cornerSquareTypeDirection, setCornerSquareTypeDirection] = useState('down');
    const [cornerDotTypeDirection, setCornerDotTypeDirection] = useState('down');
    const [showQrColorPicker, setShowQrColorPicker] = useState(false);
    const [showQrBgColorPicker, setShowQrBgColorPicker] = useState(false);
    const [showCustomBgColorPicker, setShowCustomBgColorPicker] = useState(false);
    const [qrBgImage, setQrBgImage] = useState(null);
    const [qrLogo, setQrLogo] = useState(null);

    // New states for poster text and dimensions
    const [text1, setText1] = useState('ACCEPTING NEW CLIENTS');
    const [text2, setText2] = useState('Tap to scan');
    const [qrWidth, setQrWidth] = useState(1080);
    const [qrHeight, setQrHeight] = useState(880);

    // Typography States
    const [activeTextEditor, setActiveTextEditor] = useState(null); // 'text1' or 'text2' or null

    // Text 1 Typography states
    const [text1FontFamily, setText1FontFamily] = useState('Poppins');
    const [text1FontSize, setText1FontSize] = useState(24);
    const [text1FontWeight, setText1FontWeight] = useState('Semi Bold');
    const [text1LetterSpacing, setText1LetterSpacing] = useState('Auto');
    const [text1LineHeight, setText1LineHeight] = useState('Auto');
    const [text1Align, setText1Align] = useState('center');
    const [text1Bold, setText1Bold] = useState(true);
    const [text1Italic, setText1Italic] = useState(false);
    const [text1Underline, setText1Underline] = useState(false);
    const [text1Linethrough, setText1Linethrough] = useState(false);
    const [text1Color, setText1Color] = useState('#2E7D32');
    const [text1ColorOpacity, setText1ColorOpacity] = useState(100);

    // Text 2 Typography states
    const [text2FontFamily, setText2FontFamily] = useState('Poppins');
    const [text2FontSize, setText2FontSize] = useState(12);
    const [text2FontWeight, setText2FontWeight] = useState('Bold');
    const [text2LetterSpacing, setText2LetterSpacing] = useState('Auto');
    const [text2LineHeight, setText2LineHeight] = useState('Auto');
    const [text2Align, setText2Align] = useState('center');
    const [text2Bold, setText2Bold] = useState(true);
    const [text2Italic, setText2Italic] = useState(false);
    const [text2Underline, setText2Underline] = useState(false);
    const [text2Linethrough, setText2Linethrough] = useState(false);
    const [text2Color, setText2Color] = useState('#2E7D32');
    const [text2ColorOpacity, setText2ColorOpacity] = useState(90);

    // Dropdown toggle states for the Typography popup
    const [showFontFamilyDropdown, setShowFontFamilyDropdown] = useState(false);
    const [showFontSizeDropdown, setShowFontSizeDropdown] = useState(false);
    const [showFontWeightDropdown, setShowFontWeightDropdown] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showLetterSpacingSlider, setShowLetterSpacingSlider] = useState(false);
    const [showLineHeightSlider, setShowLineHeightSlider] = useState(false);

    const qrRef = useRef();
    const mainQrRef = useRef(null);
    const posterPreviewRef = useRef(null);
    const posterText1Ref = useRef(null);
    const posterText2Ref = useRef(null);
    const posterQrWrapRef = useRef(null);

    const hiddenPosterRef = useRef(null);
    const hiddenText1Ref = useRef(null);
    const hiddenText2Ref = useRef(null);
    const hiddenQrWrapRef = useRef(null);

    useEffect(() => {
        if (!isOpen) {
            setShowEmbedCode(false);
        }
    }, [isOpen]);

    const qrThemes = [
        { name: 'Classic Black', fg: '#000000', bg: '#ffffff', dotType: 'square', cornerSquareType: 'square', cornerDotType: 'square' },
        { name: 'Ocean Blue', fg: '#4A3AFF', bg: '#ffffff', dotType: 'rounded', cornerSquareType: 'extra-rounded', cornerDotType: 'dot' },
        { name: 'Forest Green', fg: '#2E7D32', bg: '#ffffff', dotType: 'classy', cornerSquareType: 'square', cornerDotType: 'square' },
        { name: 'Ruby Red', fg: '#D32F2F', bg: '#ffffff', dotType: 'extra-rounded', cornerSquareType: 'extra-rounded', cornerDotType: 'dot' },
        { name: 'Modern Dot', fg: '#000000', bg: '#ffffff', dotType: 'dots', cornerSquareType: 'dot', cornerDotType: 'dot' },
        { name: 'Royal Gold', fg: '#8C6B2D', bg: '#FFFDE7', dotType: 'classy-rounded', cornerSquareType: 'extra-rounded', cornerDotType: 'square' }
    ];

    const posterTemplates = [
        {
            name: 'Classic Emerald',
            bgType: 'Color',
            bgColor: '#D7D8E8',
            qrColor: '#2E7D32',
            qrBgColor: 'transparent',
            text1Color: '#2E7D32',
            text2Color: '#2E7D32',
            dotType: 'square',
            cornerSquareType: 'square',
            cornerDotType: 'square',
            fontFamily: 'Poppins'
        },
        {
            name: 'Ocean Breeze',
            bgType: 'Color',
            bgColor: 'linear-gradient(135deg, #1565C0 0%, #1E88E5 50%, #90CAF9 100%)',
            qrColor: '#0D47A1',
            qrBgColor: '#ffffff',
            text1Color: '#FFFFFF',
            text2Color: '#E3F2FD',
            dotType: 'rounded',
            cornerSquareType: 'extra-rounded',
            cornerDotType: 'dot',
            fontFamily: 'Montserrat'
        },
        {
            name: 'Sunset Glow',
            bgType: 'Color',
            bgColor: 'linear-gradient(135deg, #FF7B89 0%, #FF9A8B 40%, #FFD3B6 100%)',
            qrColor: '#880E4F',
            qrBgColor: '#ffffff',
            text1Color: '#4A0E17',
            text2Color: '#880E4F',
            dotType: 'classy-rounded',
            cornerSquareType: 'dot',
            cornerDotType: 'dot',
            fontFamily: 'Playfair Display'
        },
        {
            name: 'Midnight Luxury',
            bgType: 'Color',
            bgColor: 'linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%)',
            qrColor: '#FFD700',
            qrBgColor: '#102027',
            text1Color: '#FFD700',
            text2Color: '#ECEFF1',
            dotType: 'classy',
            cornerSquareType: 'square',
            cornerDotType: 'square',
            fontFamily: 'Outfit'
        },
        {
            name: 'Cyberpunk Neon',
            bgType: 'Color',
            bgColor: 'linear-gradient(135deg, #f72585 0%, #7209b7 50%, #3f37c9 100%)',
            qrColor: '#4CC9F0',
            qrBgColor: '#12061C',
            text1Color: '#4CC9F0',
            text2Color: '#F72585',
            dotType: 'dots',
            cornerSquareType: 'dot',
            cornerDotType: 'dot',
            fontFamily: 'Inter'
        },
        {
            name: 'Organic Terra',
            bgType: 'Color',
            bgColor: 'linear-gradient(135deg, #D4A373 0%, #E9D8A6 60%, #FEFAE0 100%)',
            qrColor: '#556B2F',
            qrBgColor: 'transparent',
            text1Color: '#432818',
            text2Color: '#556B2F',
            dotType: 'extra-rounded',
            cornerSquareType: 'extra-rounded',
            cornerDotType: 'dot',
            fontFamily: 'Poppins'
        },
        {
            name: 'Bubblegum Pop',
            bgType: 'Image',
            bgImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80',
            qrColor: '#D81B60',
            qrBgColor: '#ffffff',
            text1Color: '#880E4F',
            text2Color: '#D81B60',
            dotType: 'rounded',
            cornerSquareType: 'extra-rounded',
            cornerDotType: 'dot',
            fontFamily: 'Montserrat'
        },
        {
            name: 'Urban Brick',
            bgType: 'Image',
            bgImage: 'https://images.unsplash.com/photo-1560015534-cee980ba7e13?w=800&q=80',
            qrColor: '#1A237E',
            qrBgColor: '#ffffff',
            text1Color: '#1A237E',
            text2Color: '#B71C1C',
            dotType: 'square',
            cornerSquareType: 'square',
            cornerDotType: 'square',
            fontFamily: 'Outfit'
        },
        {
            name: 'Lavender Dream',
            bgType: 'Color',
            bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            qrColor: '#E0F7FA',
            qrBgColor: '#311B92',
            text1Color: '#FFFFFF',
            text2Color: '#E1BEE7',
            dotType: 'classy-rounded',
            cornerSquareType: 'dot',
            cornerDotType: 'dot',
            fontFamily: 'Playfair Display'
        }
    ];

    const applyPosterTemplate = (tpl, idx) => {
        setSelectedTemplateIdx(idx);
        setQrBgType(tpl.bgType);
        if (tpl.bgType === 'Color') {
            setCustomBgColor(tpl.bgColor);
            setQrBgImage(null);
        } else {
            setQrBgImage(tpl.bgImage);
            setQrBgOpacity(100);
            setQrBgFit('Fill');
        }
        setQrColor(tpl.qrColor);
        setQrBgColor(tpl.qrBgColor);
        setText1Color(tpl.text1Color);
        setText2Color(tpl.text2Color);
        setQrDotType(tpl.dotType);
        setQrCornerSquareType(tpl.cornerSquareType);
        setQrCornerDotType(tpl.cornerDotType);
        if (tpl.fontFamily) {
            setText1FontFamily(tpl.fontFamily);
            setText2FontFamily(tpl.fontFamily);
        }
    };

    const handleEnterEditor = () => {
        setIsEditingQR(true);
        if (!savedConfig.hasCustomized) {
            // Apply Classic Emerald template by default if not customized yet
            applyPosterTemplate(posterTemplates[0], 0);
        } else {
            // Load saved config into active editing states
            setQrColor(savedConfig.qrColor);
            setQrBgColor(savedConfig.qrBgColor);
            setQrDotType(savedConfig.qrDotType);
            setQrCornerSquareType(savedConfig.qrCornerSquareType);
            setQrCornerDotType(savedConfig.qrCornerDotType);
            setQrLevel(savedConfig.qrLevel);
            setQrLogo(savedConfig.qrLogo);
            setCustomBgColor(savedConfig.customBgColor);
            setQrBgType(savedConfig.qrBgType);
            setQrBgImage(savedConfig.qrBgImage);
            setQrBgOpacity(savedConfig.qrBgOpacity);
            setQrBgFit(savedConfig.qrBgFit);
            setText1(savedConfig.text1);
            setText2(savedConfig.text2);
            setText1Color(savedConfig.text1Color);
            setText2Color(savedConfig.text2Color);
            setText1FontFamily(savedConfig.text1FontFamily);
            setText2FontFamily(savedConfig.text2FontFamily);
            setText1FontSize(savedConfig.text1FontSize);
            setText2FontSize(savedConfig.text2FontSize);
            setText1FontWeight(savedConfig.text1FontWeight);
            setText2FontWeight(savedConfig.text2FontWeight);
            setText1Bold(savedConfig.text1Bold);
            setText2Bold(savedConfig.text2Bold);
            setText1Italic(savedConfig.text1Italic);
            setText2Italic(savedConfig.text2Italic);
            setText1Underline(savedConfig.text1Underline);
            setText2Underline(savedConfig.text2Underline);
            setText1Linethrough(savedConfig.text1Linethrough);
            setText2Linethrough(savedConfig.text2Linethrough);
            setSelectedTemplateIdx(savedConfig.selectedTemplateIdx);
        }
    };

    const handleSaveEditor = () => {
        setSavedConfig({
            hasCustomized: true,
            qrColor,
            qrBgColor,
            qrDotType,
            qrCornerSquareType,
            qrCornerDotType,
            qrLevel,
            qrLogo,
            customBgColor,
            qrBgType,
            qrBgImage,
            qrBgOpacity,
            qrBgFit,
            text1,
            text2,
            text1Color,
            text2Color,
            text1FontFamily,
            text2FontFamily,
            text1FontSize,
            text2FontSize,
            text1FontWeight,
            text2FontWeight,
            text1Bold,
            text2Bold,
            text1Italic,
            text2Italic,
            text1Underline,
            text2Underline,
            text1Linethrough,
            text2Linethrough,
            selectedTemplateIdx,
        });
        setIsEditingQR(false);
    };

    const handleCancelEditor = () => {
        setIsEditingQR(false);
    };

    const downloadQRCode = async () => {
        const targetPosterRef = isEditingQR ? posterPreviewRef : hiddenPosterRef;
        const targetText1Ref = isEditingQR ? posterText1Ref : hiddenText1Ref;
        const targetText2Ref = isEditingQR ? posterText2Ref : hiddenText2Ref;
        const targetQrWrapRef = isEditingQR ? posterQrWrapRef : hiddenQrWrapRef;

        if (!targetPosterRef.current || isDownloading) return;

        setIsDownloading(true);
        try {
            const vw = window.innerWidth; // Use actual viewport for vw→px conversion
            const rect = targetPosterRef.current.getBoundingClientRect();
            const elWidth = rect.width || 400;
            const elHeight = rect.height || 600;
            const scale = 3;

            // ── Snapshot live computed styles BEFORE html2canvas touches the DOM ──
            const snapText = (ref) => {
                if (!ref?.current) return null;
                const cs = window.getComputedStyle(ref.current);
                return {
                    fontFamily: cs.fontFamily,
                    fontSize: cs.fontSize,
                    fontWeight: cs.fontWeight,
                    letterSpacing: cs.letterSpacing,
                    lineHeight: cs.lineHeight,
                    textAlign: cs.textAlign,
                    color: cs.color,
                    opacity: cs.opacity,
                    fontStyle: cs.fontStyle,
                    textDecoration: cs.textDecoration,
                    textTransform: cs.textTransform,
                    whiteSpace: cs.whiteSpace,
                    wordBreak: cs.wordBreak,
                    padding: cs.padding,
                    width: cs.width,
                    textContent: ref.current.textContent,
                };
            };
            const text1Snap = snapText(targetText1Ref);
            const text2Snap = snapText(targetText2Ref);

            // ── Snapshot QR container size ──
            const qrWrapRect = targetQrWrapRef.current
                ? targetQrWrapRef.current.getBoundingClientRect()
                : null;

            // ── Snapshot the actual border-radius, border-color and border-width in px before capture ──
            const posterCs = window.getComputedStyle(targetPosterRef.current);
            const borderRadiusPx = parseFloat(posterCs.borderRadius) || 0;
            const borderWidthPx = parseFloat(posterCs.borderWidth) || 0;
            const borderColor = posterCs.borderColor || 'transparent';

            // ── Snapshot QR SVG BEFORE setting isCapturing (no overlay in DOM yet) ──
            const originalSvg = targetPosterRef.current.querySelector('svg');
            let svgDataUrl = null;
            let svgW = 0, svgH = 0;
            if (originalSvg) {
                try {
                    const svgRect = originalSvg.getBoundingClientRect();
                    svgW = svgRect.width;
                    svgH = svgRect.height;
                    svgDataUrl = 'data:image/svg+xml;charset=utf-8,' +
                        encodeURIComponent(new XMLSerializer().serializeToString(originalSvg));
                } catch (e) {
                    console.error('SVG snapshot error:', e);
                }
            }

            // ── Snapshot canvas pixels (fallback for non-SVG QR renderers) ──
            const origCanvasSnapshots = [];
            targetPosterRef.current.querySelectorAll('canvas').forEach((c) => {
                const snapCanvas = document.createElement('canvas');
                snapCanvas.width = c.width;
                snapCanvas.height = c.height;
                snapCanvas.getContext('2d').drawImage(c, 0, 0);
                origCanvasSnapshots.push(snapCanvas);
            });

            // ── NOW show the UI overlay (it won't be in the clone since we snapshot first) ──
            setIsCapturing(true);

            // ── html2canvas capture ──
            const isJpeg = exportFormat.toLowerCase() === 'jpg' || exportFormat.toLowerCase() === 'jpeg';
            const rawCanvas = await html2canvas(targetPosterRef.current, {
                useCORS: true,
                allowTaint: false,
                scale,
                backgroundColor: isJpeg ? '#ffffff' : null,
                logging: false,
                width: elWidth,
                height: elHeight,
                onclone: (clonedDoc, clonedElement) => {
                    if (!clonedElement) return;

                    // Fix container size and remove border-radius
                    // (we'll apply rounded corners manually on the final canvas)
                    clonedElement.style.width = `${elWidth}px`;
                    clonedElement.style.height = `${elHeight}px`;
                    clonedElement.style.overflow = 'hidden';
                    clonedElement.style.borderRadius = '0';

                    // Remove the loading overlay if it somehow got in
                    const overlay = clonedElement.querySelector('[data-loading-overlay]');
                    if (overlay) overlay.remove();

                    // ── Convert ALL vw values in inline styles using window.innerWidth ──
                    const resolveVw = (el) => {
                        if (!el || el.nodeType !== 1) return;
                        const raw = el.getAttribute('style') || '';
                        if (raw.includes('vw')) {
                            el.setAttribute('style', raw.replace(
                                /([\d.]+)vw/g,
                                (_, v) => `${(parseFloat(v) / 100) * vw}px`
                            ));
                        }
                        Array.from(el.children).forEach(resolveVw);
                    };
                    resolveVw(clonedElement);

                    // ── Stamp snapshotted computed styles onto the text elements ──
                    const applySnap = (id, snap) => {
                        if (!snap) return;
                        const el = clonedElement.querySelector(`[data-export-id="${id}"]`);
                        if (!el) return;
                        Object.assign(el.style, snap);
                        el.style.overflow = 'visible';
                        el.style.textOverflow = 'clip';
                        el.style.maxWidth = '100%';
                    };
                    applySnap('poster-text1', text1Snap);
                    applySnap('poster-text2', text2Snap);

                    // ── Fix QR wrapper to its live pixel size ──
                    if (qrWrapRect) {
                        const qrEl = clonedElement.querySelector('[data-export-id="poster-qr-wrap"]');
                        if (qrEl) {
                            qrEl.style.width = `${qrWrapRect.width}px`;
                            qrEl.style.height = `${qrWrapRect.height}px`;
                        }
                    }

                    // ── Replace the cloned SVG with our pre-snapshotted data-URL img ──
                    if (svgDataUrl) {
                        const clonedSvg = clonedElement.querySelector('svg');
                        if (clonedSvg) {
                            const img = clonedDoc.createElement('img');
                            img.src = svgDataUrl;
                            img.style.width = `${svgW}px`;
                            img.style.height = `${svgH}px`;
                            img.style.display = 'block';
                            clonedSvg.parentNode.replaceChild(img, clonedSvg);
                        }
                    }

                    // ── Restore snapshotted canvas pixels ──
                    const clonedCanvases = clonedElement.querySelectorAll('canvas');
                    origCanvasSnapshots.forEach((snapC, i) => {
                        const destC = clonedCanvases[i];
                        if (!destC) return;
                        const ctx = destC.getContext('2d');
                        destC.width = snapC.width;
                        destC.height = snapC.height;
                        ctx.drawImage(snapC, 0, 0);
                    });
                },
            });

            // ── Post-process: apply rounded corners via canvas clipping ──
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = rawCanvas.width;
            finalCanvas.height = rawCanvas.height;
            const fCtx = finalCanvas.getContext('2d');
            const r = borderRadiusPx * scale; // scale the radius to match the 3x canvas
            const w = finalCanvas.width;
            const h = finalCanvas.height;

            // For JPEG exports, fill white first — JPEG has no alpha channel
            // so any transparent pixel would otherwise render as black.
            if (isJpeg) {
                fCtx.fillStyle = '#ffffff';
                fCtx.fillRect(0, 0, w, h);
            }

            // ── Save state, clip to rounded rect, draw image, then restore to draw border on top ──
            fCtx.save();
            fCtx.beginPath();
            fCtx.moveTo(r, 0);
            fCtx.lineTo(w - r, 0);
            fCtx.quadraticCurveTo(w, 0, w, r);
            fCtx.lineTo(w, h - r);
            fCtx.quadraticCurveTo(w, h, w - r, h);
            fCtx.lineTo(r, h);
            fCtx.quadraticCurveTo(0, h, 0, h - r);
            fCtx.lineTo(0, r);
            fCtx.quadraticCurveTo(0, 0, r, 0);
            fCtx.closePath();
            fCtx.clip();
            fCtx.drawImage(rawCanvas, 0, 0);
            fCtx.restore(); // escape clip so we can stroke the border on top

            // ── Re-draw the poster border (was stripped when we zeroed borderRadius in the clone) ──
            if (borderWidthPx > 0) {
                const bw = borderWidthPx * scale;
                const halfBw = bw / 2;
                fCtx.save();
                fCtx.strokeStyle = borderColor;
                fCtx.lineWidth = bw;
                fCtx.beginPath();
                fCtx.moveTo(r + halfBw, halfBw);
                fCtx.lineTo(w - r - halfBw, halfBw);
                fCtx.quadraticCurveTo(w - halfBw, halfBw, w - halfBw, r + halfBw);
                fCtx.lineTo(w - halfBw, h - r - halfBw);
                fCtx.quadraticCurveTo(w - halfBw, h - halfBw, w - r - halfBw, h - halfBw);
                fCtx.lineTo(r + halfBw, h - halfBw);
                fCtx.quadraticCurveTo(halfBw, h - halfBw, halfBw, h - r - halfBw);
                fCtx.lineTo(halfBw, r + halfBw);
                fCtx.quadraticCurveTo(halfBw, halfBw, r + halfBw, halfBw);
                fCtx.closePath();
                fCtx.stroke();
                fCtx.restore();
            }

            const format = exportFormat.toLowerCase();
            const fileExt = format === 'jpeg' || format === 'jpg' ? 'jpg' : format === 'webp' ? 'webp' : 'png';
            const mimeType = fileExt === 'jpg' ? 'image/jpeg' : fileExt === 'webp' ? 'image/webp' : 'image/png';

            const dataUrl = finalCanvas.toDataURL(mimeType, 1.0);
            const link = document.createElement('a');
            link.download = `${currentBook?.flipbookName?.replace(/\s+/g, '-') || 'share'}-poster.${fileExt}`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error exporting poster image:', error);
            alert('Error generating poster image: ' + error.message);
        } finally {
            setIsDownloading(false);
            setIsCapturing(false);
        }
    };

    const toggleBgTypeDropdown = (e) => {
        if (!showBgTypeDropdown) {
            const button = e.currentTarget;
            const container = button.closest('.custom-scrollbar');
            if (container) {
                const containerRect = container.getBoundingClientRect();
                const buttonRect = button.getBoundingClientRect();
                const spaceBelow = containerRect.bottom - buttonRect.bottom;
                setBgTypeDirection(spaceBelow < 120 ? 'up' : 'down');
            } else {
                const spaceBelow = window.innerHeight - button.getBoundingClientRect().bottom;
                setBgTypeDirection(spaceBelow < 180 ? 'up' : 'down');
            }
        }
        setShowBgTypeDropdown(!showBgTypeDropdown);
    };

    const toggleBgFitDropdown = (e) => {
        if (!showBgFitDropdown) {
            const button = e.currentTarget;
            const container = button.closest('.custom-scrollbar');
            if (container) {
                const containerRect = container.getBoundingClientRect();
                const buttonRect = button.getBoundingClientRect();
                const spaceBelow = containerRect.bottom - buttonRect.bottom;
                setBgFitDirection(spaceBelow < 120 ? 'up' : 'down');
            } else {
                const spaceBelow = window.innerHeight - button.getBoundingClientRect().bottom;
                setBgFitDirection(spaceBelow < 180 ? 'up' : 'down');
            }
        }
        setShowBgFitDropdown(!showBgFitDropdown);
    };

    const toggleDotTypeDropdown = (e) => {
        if (!showDotTypeDropdown) {
            const button = e.currentTarget;
            const container = button.closest('.custom-scrollbar');
            if (container) {
                const containerRect = container.getBoundingClientRect();
                const buttonRect = button.getBoundingClientRect();
                const spaceBelow = containerRect.bottom - buttonRect.bottom;
                setDotTypeDirection(spaceBelow < 150 ? 'up' : 'down');
            } else {
                const spaceBelow = window.innerHeight - button.getBoundingClientRect().bottom;
                setDotTypeDirection(spaceBelow < 180 ? 'up' : 'down');
            }
        }
        setShowDotTypeDropdown(!showDotTypeDropdown);
        setShowCornerSquareTypeDropdown(false);
        setShowCornerDotTypeDropdown(false);
    };

    const toggleCornerSquareTypeDropdown = (e) => {
        if (!showCornerSquareTypeDropdown) {
            const button = e.currentTarget;
            const container = button.closest('.custom-scrollbar');
            if (container) {
                const containerRect = container.getBoundingClientRect();
                const buttonRect = button.getBoundingClientRect();
                const spaceBelow = containerRect.bottom - buttonRect.bottom;
                setCornerSquareTypeDirection(spaceBelow < 120 ? 'up' : 'down');
            } else {
                const spaceBelow = window.innerHeight - button.getBoundingClientRect().bottom;
                setCornerSquareTypeDirection(spaceBelow < 180 ? 'up' : 'down');
            }
        }
        setShowCornerSquareTypeDropdown(!showCornerSquareTypeDropdown);
        setShowDotTypeDropdown(false);
        setShowCornerDotTypeDropdown(false);
    };

    const toggleCornerDotTypeDropdown = (e) => {
        if (!showCornerDotTypeDropdown) {
            const button = e.currentTarget;
            const container = button.closest('.custom-scrollbar');
            if (container) {
                const containerRect = container.getBoundingClientRect();
                const buttonRect = button.getBoundingClientRect();
                const spaceBelow = containerRect.bottom - buttonRect.bottom;
                setCornerDotTypeDirection(spaceBelow < 120 ? 'up' : 'down');
            } else {
                const spaceBelow = window.innerHeight - button.getBoundingClientRect().bottom;
                setCornerDotTypeDirection(spaceBelow < 180 ? 'up' : 'down');
            }
        }
        setShowCornerDotTypeDropdown(!showCornerDotTypeDropdown);
        setShowDotTypeDropdown(false);
        setShowCornerSquareTypeDropdown(false);
    };

    if (!isOpen) return null;

    const accessVal = 
        currentBook?.type ||
        currentBook?.access ||
        currentBook?.Visibility?.type ||
        currentBook?.Visibility?.access ||
        currentBook?.Customized_Settings?.Visibility?.type ||
        currentBook?.Customized_Settings?.Visibility?.access ||
        currentBook?.share?.type ||
        currentBook?.share?.access ||
        currentBook?.shareAccess ||
        'public';

    const rawAcc = String(accessVal).toLowerCase();
    const accessPrefix = 
        (rawAcc.includes('private') && !rawAcc.includes('protect')) || rawAcc === 'private'
            ? 'share=private'
            : rawAcc.includes('password') || rawAcc.includes('protect')
            ? 'share=password'
            : rawAcc.includes('invite')
            ? 'share=invite'
            : 'share=public';

    const shareIdVal = 
        currentBook?.shareId || 
        currentBook?.share?.shareId || 
        currentBook?.Customized_Settings?.Visibility?.shareId || 
        currentBook?.Visibility?.shareId || 
        currentBook?.v_id || 
        '';

    let publicUrl = `${window.location.origin}/${accessPrefix}/${shareIdVal}`;

    if (activeLayout) {
        try {
            const urlObj = new URL(publicUrl);
            urlObj.searchParams.set('layout', activeLayout);
            publicUrl = urlObj.toString();
        } catch (e) {
            if (publicUrl.includes('?')) {
                publicUrl += `&layout=${activeLayout}`;
            } else {
                publicUrl += `?layout=${activeLayout}`;
            }
        }
    }

    const isBookPublished = Boolean(
        currentBook?.isPublished || 
        currentBook?.published || 
        currentBook?.is_published || 
        currentBook?.status === 'publish' ||
        currentBook?.status === 'published' ||
        currentBook?.meta?.isPublished
    );

    const handleCopy = () => {
        if (!isBookPublished) {
            alert("Please publish your flipbook first to copy or share the link.");
            return;
        }
        navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareModel = async (platform = 'native') => {
        if (!isBookPublished) {
            alert("Please publish your flipbook first to copy or share the link.");
            return;
        }
        const shareTitle = currentBook?.flipbookName || 'Check out my flipbook!';
        const shareUrl = publicUrl;

        if (platform === 'native' && navigator.share) {
            try {
                await navigator.share({
                    title: shareTitle,
                    text: 'I created a flipbook on Fisto. Take a look!',
                    url: shareUrl
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Error sharing:', err);
                }
            }
        } else {
            let url = '';
            switch (platform) {
                case 'whatsapp':
                    url = `https://wa.me/?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`;
                    break;
                case 'facebook':
                    url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
                    break;
                case 'x':
                    url = `https://x.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`;
                    break;
                case 'mail':
                    url = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent('Check out this flipbook: ' + shareUrl)}`;
                    break;
                case 'linkedin':
                    url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
                    break;
                case 'drive':
                    // Just copy link for drive
                    handleCopy();
                    return;
                case 'instagram':
                    handleCopy();
                    return;
                default:
                    handleCopy();
                    return;
            }
            if (url) window.open(url, '_blank');
        }
    };

    if (isTabletLayout) {
        return (
            <div className="absolute inset-0 z-[5000] flex items-center justify-center p-[2cqw]">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
                    onClick={onClose}
                />

                {/* Responsive Tablet Modal Container */}
                <div className="relative bg-white w-[75cqw] max-h-[90vh] rounded-[1.5cqw] shadow-2xl animate-in fade-in zoom-in-95 duration-300 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="px-[2.5cqw] py-[1.5cqw] flex items-center gap-[1cqw] border-b border-gray-50 shrink-0">
                        <h2 className="text-[1.8cqw] font-bold text-gray-900 whitespace-nowrap">Share Flipbook</h2>
                        <div className="flex-1 h-[1px] bg-gray-200" />
                        <button
                            onClick={onClose}
                            className="p-[0.5cqw] rounded-full hover:bg-gray-100 transition-colors border border-red-200 text-red-500 cursor-pointer"
                        >
                            <X className="w-[1.5cqw] h-[1.5cqw]" />
                        </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-[2.5cqw] flex flex-row gap-[2.5cqw] overflow-y-auto custom-scrollbar">

                        {/* Left Column: Preview */}
                        <div className="flex-[0.8] flex flex-col w-full">
                            <div className="relative rounded-[1.2cqw] overflow-hidden shadow-lg aspect-[3/4] md:aspect-square bg-gray-100 w-full">
                                {(() => {
                                    const storedUser = localStorage.getItem('user');
                                    const user = storedUser ? JSON.parse(storedUser) : null;
                                    const emailId = user?.emailId || '';
                                    const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
                                    const emailFolder = emailId ? emailId.replace(/[@.]/g, "_") : '';
                                    const actualFolder = currentBook?.folder || currentBook?.folderName || '';
                                    const realName = currentBook?.realName || currentBook?.title || currentBook?.flipbookName || '';
                                    const iframeBaseUrl = getSupabaseBaseUrl(
                                        emailFolder,
                                        actualFolder,
                                        realName
                                    );

                                    return (
                                        <LazyPreview
                                            v_id={currentBook?.v_id}
                                            emailId={emailId}
                                            backendUrl={backendUrl}
                                            iframeBaseUrl={iframeBaseUrl}
                                            title={currentBook?.title}
                                            imageUrl={currentBook?.image || null}
                                        />
                                    );
                                })()}
                                {/* Footer Overlay */}
                                <div className="absolute bottom-0 left-0 right-0 bg-[#3d3331]/80 backdrop-blur-sm py-[1cqw] px-[1.5cqw] flex items-center justify-center gap-[1cqw] rounded-b-[1.2cqw]">
                                    <span className="text-white text-[1.1cqw] font-medium opacity-90">
                                        Add Cover picture while sharing
                                    </span>
                                    <div
                                        className={`w-[1.5cqw] h-[1.5cqw] rounded-[0.3cqw] border-[0.15cqw] border-white/50 flex items-center justify-center cursor-pointer transition-all ${addCover ? 'bg-white border-white' : 'hover:border-white'}`}
                                        onClick={() => setAddCover(!addCover)}
                                    >
                                        {addCover && <Icon icon="lucide:check" className="text-[#3d3331] w-[1cqw] h-[1cqw]" strokeWidth={4} />}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Share Options */}
                        <div className="flex-1 flex flex-col gap-[2cqw] w-full">
                            {/* Flipbook Link */}
                            <div className="flex flex-col gap-[1cqw]">
                                <div className="flex items-center gap-[1cqw]">
                                    <h3 className="text-[1.2cqw] font-bold text-gray-800 whitespace-nowrap">Flipbook Link</h3>
                                    <div className="flex-1 h-[1px] bg-gray-100" />
                                </div>
                                <div className="flex flex-row items-center gap-[1cqw]">
                                    <div className="flex-1 flex items-center gap-[0.8cqw] bg-white border border-gray-300 rounded-[0.8cqw] px-[1cqw] py-[0.8cqw] shadow-sm min-w-0">
                                        <LinkIcon className="w-[1.4cqw] h-[1.4cqw] text-gray-400 shrink-0" />
                                        <input
                                            type="text"
                                            readOnly
                                            value={publicUrl}
                                            className="flex-1 bg-transparent border-none outline-none text-[1.1cqw] font-medium text-gray-600 truncate min-w-0"
                                        />
                                    </div>
                                    <button
                                        onClick={handleCopy}
                                        className={`flex items-center justify-center gap-[0.8cqw] px-[1.5cqw] py-[0.8cqw] cursor-pointer rounded-[0.8cqw] transition-all active:scale-95 shadow-lg shrink-0 ${copied ? 'bg-green-500 text-white' : 'bg-[#4A3AFF] text-white hover:bg-blue-700'}`}
                                    >
                                        <Icon icon={copied ? "lucide:check" : "lucide:copy"} className="w-[1.2cqw] h-[1.2cqw]" />
                                        <span className="text-[1.1cqw] font-semibold">{copied ? 'Copied' : 'Copy'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Share QR */}
                            <div className="flex flex-col gap-[1cqw]">
                                <div className="flex items-center gap-[1cqw]">
                                    <h3 className="text-[1.2cqw] font-bold text-gray-800 whitespace-nowrap">Share QR</h3>
                                    <div className="flex-1 h-[1px] bg-gray-100" />
                                </div>
                                <div className="flex flex-row items-center gap-[1.5cqw]">
                                    <div
                                        className="relative w-[7cqw] h-[7cqw] bg-gray-100 rounded-[0.8cqw] overflow-hidden border border-gray-200 shadow-sm flex items-center justify-center shrink-0"
                                    >
                                        <CustomQRCode
                                            value={publicUrl}
                                            size={128}
                                            fgColor={savedConfig.qrColor}
                                            bgColor={savedConfig.qrBgColor}
                                            dotType={savedConfig.qrDotType}
                                            cornerSquareType={savedConfig.qrCornerSquareType}
                                            cornerDotType={savedConfig.qrCornerDotType}
                                            level={savedConfig.qrLevel}
                                            logo={savedConfig.qrLogo}
                                            style={{ width: '100%', height: '100%', padding: '0.5cqw' }}
                                        />
                                    </div>
                                    <div className="w-[18cqw] relative">
                                        <div className="flex items-center bg-white border border-gray-200 rounded-[0.8cqw] shadow-sm hover:border-gray-300 transition-all overflow-hidden h-[3cqw]">
                                            <button
                                                onClick={downloadQRCode}
                                                disabled={isDownloading}
                                                className={`flex-1 px-[1cqw] font-bold text-[1.1cqw] flex items-center justify-center gap-[0.5cqw] transition-colors h-full ${isDownloading
                                                        ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                                        : 'text-gray-700 cursor-pointer hover:bg-gray-50'
                                                    }`}
                                            >
                                                {isDownloading ? (
                                                    <Icon icon="lucide:loader-2" className="animate-spin text-[#4A3AFF] w-[1.2cqw] h-[1.2cqw] shrink-0" />
                                                ) : (
                                                    <Download className="text-gray-400 w-[1.2cqw] h-[1.2cqw] shrink-0" />
                                                )}
                                                <span className="truncate">
                                                    {isDownloading ? 'Generating...' : `Download ${exportFormat}`}
                                                </span>
                                            </button>
                                            <div className="w-[1px] h-[2cqw] bg-gray-200 shrink-0" />
                                            <button
                                                onClick={() => !isDownloading && setShowExportDropdown(!showExportDropdown)}
                                                disabled={isDownloading}
                                                className={`px-[0.8cqw] h-full transition-all shrink-0 flex items-center justify-center ${isDownloading
                                                        ? 'bg-gray-50 cursor-not-allowed opacity-50'
                                                        : showExportDropdown ? 'bg-gray-100 cursor-pointer' : 'hover:bg-gray-50 cursor-pointer'
                                                    }`}
                                            >
                                                <ChevronDown className={`text-gray-400 w-[1.2cqw] h-[1.2cqw] transition-transform duration-200 ${showExportDropdown ? 'rotate-180' : ''}`} />
                                            </button>
                                        </div>

                                        {showExportDropdown && (
                                            <>
                                                <div className="fixed inset-0 z-40 cursor-default" onClick={() => setShowExportDropdown(false)} />
                                                <div className="absolute top-[3.5cqw] left-0 right-0 bg-white border border-gray-100 rounded-[0.8cqw] shadow-xl z-50 py-[0.5cqw] animate-in fade-in slide-in-from-top-2 duration-200">
                                                    {['JPG', 'PNG', 'WebP'].map((format) => (
                                                        <button
                                                            key={format}
                                                            onClick={() => {
                                                                setExportFormat(format);
                                                                setShowExportDropdown(false);
                                                            }}
                                                            className={`w-full text-left px-[1.5cqw] py-[0.8cqw] text-[1.1cqw] font-bold transition-all hover:bg-gray-50 flex items-center justify-between cursor-pointer ${exportFormat === format ? 'text-[#4A3AFF]' : 'text-gray-600'}`}
                                                        >
                                                            {format}
                                                            {exportFormat === format && <Check className="w-[1cqw] h-[1cqw]" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Share Through */}
                            <div className="flex flex-col gap-[1cqw]">
                                <div className="flex items-center gap-[1cqw]">
                                    <h3 className="text-[1.2cqw] font-bold text-gray-800 whitespace-nowrap">Share Through</h3>
                                    <div className="flex-1 h-[1px] bg-gray-100" />
                                </div>
                                <div className="flex items-center justify-start gap-[1cqw] flex-wrap">
                                    {/* Embed */}
                                    <div
                                        onClick={() => setShowEmbedCode(!showEmbedCode)}
                                        title="Toggle Embed Code"
                                        className={`w-[4cqw] h-[4cqw] rounded-[0.8cqw] border flex items-center justify-center transition-all cursor-pointer shadow-sm group ${showEmbedCode ? 'bg-gray-100 border-gray-400' : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'}`}
                                    >
                                        <Icon icon="lucide:code-2" className={`w-[1.8cqw] h-[1.8cqw] ${showEmbedCode ? 'text-gray-800' : 'text-gray-600'} transition-transform`} />
                                    </div>

                                    {/* Facebook */}
                                    <div
                                        onClick={() => shareModel('facebook')}
                                        className="w-[4cqw] h-[4cqw] rounded-[0.8cqw] bg-[#1877F2] flex items-center justify-center transition-all cursor-pointer shadow-md hover:opacity-90"
                                        title="Share on Facebook"
                                    >
                                        <Icon icon="ri:facebook-fill" className="w-[2.2cqw] h-[2.2cqw] text-white" />
                                    </div>
                                    {/* WhatsApp */}
                                    <div
                                        onClick={() => shareModel('whatsapp')}
                                        className="w-[4cqw] h-[4cqw] rounded-[0.8cqw] bg-[#25D366] flex items-center justify-center transition-all cursor-pointer shadow-md"
                                    >
                                        <Icon icon="ic:baseline-whatsapp" className="w-[2cqw] h-[2cqw] text-white" />
                                    </div>
                                    {/* X */}
                                    <div
                                        onClick={() => shareModel('x')}
                                        className="w-[4cqw] h-[4cqw] rounded-[0.8cqw] bg-black flex items-center justify-center transition-all cursor-pointer shadow-md"
                                    >
                                        <Icon icon="ri:twitter-x-fill" className="w-[1.8cqw] h-[1.8cqw] text-white" />
                                    </div>
                                    {/* Gmail */}
                                    <div
                                        onClick={() => shareModel('mail')}
                                        className="w-[4cqw] h-[4cqw] rounded-[0.8cqw] border border-gray-200 flex items-center justify-center hover:border-gray-400 hover:bg-gray-50 transition-all cursor-pointer shadow-sm"
                                    >
                                        <Icon icon="logos:google-gmail" className="w-[1.8cqw] h-[1.8cqw]" />
                                    </div>
                                    {/* LinkedIn */}
                                    <div
                                        onClick={() => shareModel('linkedin')}
                                        className="w-[4cqw] h-[4cqw] rounded-[0.8cqw] bg-[#0A66C2] flex items-center justify-center transition-all cursor-pointer shadow-md"
                                    >
                                        <Icon icon="ri:linkedin-fill" className="w-[2cqw] h-[2cqw] text-white" />
                                    </div>
                                    {/* Instagram */}
                                    <div
                                        onClick={() => shareModel('instagram')}
                                        className="w-[4cqw] h-[4cqw] rounded-[0.8cqw] bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center transition-all cursor-pointer shadow-md"
                                    >
                                        <Icon icon="ri:instagram-line" className="w-[2.4cqw] h-[2.4cqw] text-white" />
                                    </div>
                                </div>

                                {/* Embed Code smoothly expanding */}
                                <div className={`grid transition-all duration-300 ease-in-out ${showEmbedCode ? 'grid-rows-[1fr] opacity-100 mt-[1cqw]' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                                    <div className="overflow-hidden flex flex-col gap-[1cqw]">
                                        <div className="flex items-center gap-[1cqw]">
                                            <h3 className="text-[1.2cqw] font-bold text-gray-800 whitespace-nowrap">Embed Code</h3>
                                            <div className="flex-1 h-[1px] bg-gray-100" />
                                        </div>
                                        <div className="relative w-full h-[8cqw] bg-white border border-gray-300 rounded-[0.8cqw] shadow-sm overflow-hidden flex shrink-0">
                                            <textarea
                                                readOnly
                                                value={`<iframe src="${publicUrl}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`}
                                                className="w-full h-full bg-transparent border-none outline-none text-[1.1cqw] font-medium text-gray-600 resize-none p-[1cqw] pr-[3cqw] custom-scrollbar"
                                            />
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(`<iframe src="${publicUrl}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`);
                                                    setEmbedCopied(true);
                                                    setTimeout(() => setEmbedCopied(false), 2000);
                                                }}
                                                className="absolute bottom-[0.5cqw] right-[0.5cqw] p-[0.4cqw] bg-white rounded-[0.4cqw] border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                                                title="Copy Embed Code"
                                            >
                                                <Icon icon={embedCopied ? "lucide:check" : "lucide:copy"} className={`w-[1.2cqw] h-[1.2cqw] ${embedCopied ? 'text-green-500' : 'text-[#4A3AFF]'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`${isAbsolutePosition ? 'absolute' : 'fixed'} inset-0 z-[5000] flex items-center justify-center`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className={`relative bg-white ${isMobileLayout ? 'w-[30vw]' : 'w-[52vw]'} rounded-[1vw] shadow-2xl animate-in fade-in zoom-in-95 duration-300`}>
                {/* Header */}
                <div className="px-[1.2vw] py-[0.8vw] flex items-center gap-[0.8vw] border-b border-gray-50">
                    {!isEditingQR ? (
                        <>
                            <h2 className="text-[1.1vw] font-bold text-gray-900 whitespace-nowrap">Share Flipbook</h2>
                        </>
                    ) : (
                        <div className="flex items-center gap-[0.5vw]">
                            <button
                                onClick={handleCancelEditor}
                                className="text-[1.1vw] font-semibold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                            >
                                Share Flipbook
                            </button>
                            <ChevronRight size="1vw" className="text-gray-300" />
                            <h2 className="text-[1.1vw] font-bold text-gray-800">Edit QR</h2>
                        </div>
                    )}
                    <div className="flex-1 h-[1px] bg-gray-200" />
                    <button
                        onClick={onClose}
                        className="p-[0.3vw] rounded-full hover:bg-gray-100 transition-colors border border-red-200 text-red-500 cursor-pointer"
                    >
                        <X size="1vw" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-[1.2vw] pt-[0.8vw] flex flex-col gap-[1.2vw]">
                    {!isEditingQR ? (
                        <div className="flex gap-[1.5vw]">
                            {/* Left Column: Preview */}
                            {!isMobileLayout && (
                                <div className="flex-[1.1] flex flex-col">
                                    <div className="relative rounded-[1vw] overflow-hidden shadow-lg aspect-square bg-gray-100">
                                        {(() => {
                                            const storedUser = localStorage.getItem('user');
                                            const user = storedUser ? JSON.parse(storedUser) : null;
                                            const emailId = user?.emailId || '';
                                            const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
                                            const emailFolder = emailId ? emailId.replace(/[@.]/g, "_") : '';
                                            const actualFolder = currentBook?.folder || currentBook?.folderName || '';
                                            const realName = currentBook?.realName || currentBook?.title || currentBook?.flipbookName || '';
                                            const iframeBaseUrl = getSupabaseBaseUrl(
                                                emailFolder,
                                                actualFolder,
                                                realName
                                            );

                                            return (
                                                <LazyPreview
                                                    v_id={currentBook?.v_id}
                                                    emailId={emailId}
                                                    backendUrl={backendUrl}
                                                    iframeBaseUrl={iframeBaseUrl}
                                                    title={currentBook?.title}
                                                    imageUrl={currentBook?.image || null}
                                                />
                                            );
                                        })()}
                                        {/* Footer Overlay */}
                                        <div className="absolute bottom-0 left-0 right-0 bg-[#3d3331]/80 backdrop-blur-sm py-[0.6vw] px-[0.8vw] flex items-center justify-center gap-[0.6vw] rounded-b-[1vw]">
                                            <span className="text-white text-[0.75vw] font-medium opacity-90">
                                                Add Cover picture while sharing
                                            </span>
                                            <div
                                                className={`w-[1vw] h-[1vw] rounded-[0.2vw] border-[0.1vw] border-white/50 flex items-center justify-center cursor-pointer transition-all ${addCover ? 'bg-white border-white' : 'hover:border-white'}`}
                                                onClick={() => setAddCover(!addCover)}
                                            >
                                                {addCover && <Icon icon="lucide:check" className="text-[#3d3331] w-[0.7vw] h-[0.7vw]" strokeWidth={4} />}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Right Column: Share Options */}
                            <div className="flex-1 flex flex-col gap-[1vw]">
                                {/* Flipbook Link */}
                                <div className="flex flex-col gap-[0.6vw]">
                                    <div className="flex items-center gap-[0.6vw]">
                                        <h3 className="text-[0.8vw] font-bold text-gray-800 whitespace-nowrap">Flipbook Link</h3>
                                        <div className="flex-1 h-[1px] bg-gray-100" />
                                    </div>
                                    <div className="flex items-center gap-[0.5vw]">
                                        <div className="flex-1 flex items-center gap-[0.5vw] bg-white border border-gray-300 rounded-[0.4vw] px-[0.6vw] py-[0.4vw] shadow-sm">
                                            <LinkIcon size="0.9vw" className="text-gray-400" />
                                            <input
                                                type="text"
                                                readOnly
                                                value={isBookPublished ? publicUrl : 'Publish flipbook to enable link sharing'}
                                                className={`flex-1 bg-transparent border-none outline-none text-[0.75vw] font-medium truncate ${isBookPublished ? 'text-gray-600' : 'text-amber-600 italic'}`}
                                            />
                                        </div>
                                        <button
                                            onClick={handleCopy}
                                            disabled={!isBookPublished}
                                            className={`flex items-center gap-[0.4vw] px-[1vw] py-[0.4vw] rounded-[0.4vw] transition-all shadow-lg ${
                                                !isBookPublished
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60 shadow-none'
                                                    : copied
                                                    ? 'bg-green-500 text-white cursor-pointer active:scale-95'
                                                    : 'bg-[#4A3AFF] text-white hover:bg-blue-700 cursor-pointer active:scale-95'
                                            }`}
                                            title={!isBookPublished ? "Please publish your flipbook first to copy link" : "Copy link"}
                                        >
                                            <Icon icon={copied ? "lucide:check" : "lucide:copy"} className="w-[0.9vw] h-[0.9vw]" />
                                            <span className="text-[0.75vw] font-semibold">{copied ? 'Copied' : 'Copy'}</span>
                                        </button>
                                    </div>
                                    {!isBookPublished && (
                                        <p className="text-[0.65vw] text-amber-600 font-medium mt-[0.1vw]">
                                            * Flipbook is currently unpublished. Click "Publish" in top bar to enable link sharing.
                                        </p>
                                    )}
                                </div>

                                {/* Share QR */}
                                <div className="flex flex-col gap-[0.6vw]">
                                    <div className="flex items-center gap-[0.6vw]">
                                        <h3 className="text-[0.8vw] font-bold text-gray-800 whitespace-nowrap">Share QR</h3>
                                        <div className="flex-1 h-[1px] bg-gray-100" />
                                    </div>
                                    <div className="flex items-center gap-[1vw]">
                                        <div
                                            ref={qrRef}
                                            className="relative w-[4.1vw] h-[4.1vw] bg-gray-100 rounded-[0.4vw] overflow-hidden border border-gray-200 group cursor-pointer shadow-sm flex items-center justify-center"
                                            onClick={handleEnterEditor}
                                        >
                                            <CustomQRCode
                                                ref={mainQrRef}
                                                value={publicUrl}
                                                size={128}
                                                fgColor={savedConfig.qrColor}
                                                bgColor={savedConfig.qrBgColor}
                                                dotType={savedConfig.qrDotType}
                                                cornerSquareType={savedConfig.qrCornerSquareType}
                                                cornerDotType={savedConfig.qrCornerDotType}
                                                level={savedConfig.qrLevel}
                                                logo={savedConfig.qrLogo}
                                                style={{ width: '100%', height: '100%', padding: '0.3vw' }}
                                            />
                                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Edit3 size="0.8vw" className="text-white" />
                                                <span className="text-white text-[0.5vw] font-bold mt-[0.1vw]">Edit</span>
                                            </div>
                                        </div>
                                        <div className="w-[12vw] relative">
                                            <div className="flex items-center bg-white border border-gray-200 rounded-[0.5vw] shadow-sm hover:border-gray-300 transition-all group overflow-hidden h-[2.8vw]">
                                                <button
                                                    onClick={downloadQRCode}
                                                    disabled={isDownloading}
                                                    className={`flex-1 px-[0.8vw] font-bold text-[0.8vw] flex items-center justify-center gap-[0.5vw] transition-colors h-full ${isDownloading
                                                            ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                                            : 'text-gray-700 cursor-pointer hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {isDownloading ? (
                                                        <Icon icon="lucide:loader-2" className="animate-spin text-[#4A3AFF] w-[0.9vw] h-[0.9vw] shrink-0" />
                                                    ) : (
                                                        <Download size="0.9vw" className="text-gray-400 shrink-0" />
                                                    )}
                                                    <span className="truncate">
                                                        {isDownloading ? 'Generating...' : `Download ${exportFormat}`}
                                                    </span>
                                                </button>
                                                <div className="w-[1px] h-[1.5vw] bg-gray-200 shrink-0" />
                                                <button
                                                    onClick={() => !isDownloading && setShowExportDropdown(!showExportDropdown)}
                                                    disabled={isDownloading}
                                                    className={`px-[0.6vw] h-full transition-all shrink-0 flex items-center justify-center ${isDownloading
                                                            ? 'bg-gray-50 cursor-not-allowed opacity-50'
                                                            : showExportDropdown ? 'bg-gray-100 cursor-pointer' : 'hover:bg-gray-50 cursor-pointer'
                                                        }`}
                                                >
                                                    <ChevronDown size="0.9vw" className={`text-gray-400 transition-transform duration-200 ${showExportDropdown ? 'rotate-180' : ''}`} />
                                                </button>
                                            </div>

                                            {showExportDropdown && (
                                                <>
                                                    <div className="fixed inset-0 z-40 cursor-default" onClick={() => setShowExportDropdown(false)} />
                                                    <div className="absolute top-[calc(100%+0.3vw)] left-0 right-0 bg-white border border-gray-100 rounded-[0.6vw] shadow-xl z-50 py-[0.4vw] animate-in fade-in slide-in-from-top-2 duration-200">
                                                        {['JPG', 'PNG', 'WebP'].map((format) => (
                                                            <button
                                                                key={format}
                                                                onClick={() => {
                                                                    setExportFormat(format);
                                                                    setShowExportDropdown(false);
                                                                }}
                                                                className={`w-full text-left px-[1vw] py-[0.5vw] text-[0.75vw] font-bold transition-all hover:bg-gray-50 flex items-center justify-between cursor-pointer ${exportFormat === format ? 'text-[#4A3AFF]' : 'text-gray-600'}`}
                                                            >
                                                                {format}
                                                                {exportFormat === format && <Check size="0.8vw" />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Share Through */}
                                <div className="flex flex-col gap-[0.8vw]">
                                    <div className="flex items-center gap-[0.6vw]">
                                        <h3 className="text-[0.8vw] font-bold text-gray-800 whitespace-nowrap">Share Through</h3>
                                        <div className="flex-1 h-[1px] bg-gray-100" />
                                    </div>
                                    <div className="flex items-center gap-[0.6vw]">
                                        {/* Embed */}
                                        <div
                                            onClick={() => setShowEmbedCode(!showEmbedCode)}
                                            title="Toggle Embed Code"
                                            className={`w-[2.8vw] h-[2.8vw] rounded-[0.5vw] border flex items-center justify-center transition-all cursor-pointer shadow-sm group ${showEmbedCode ? 'bg-gray-100 border-gray-400' : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'}`}
                                        >
                                            <Icon icon="lucide:code-2" className={`w-[1.2vw] h-[1.2vw] ${showEmbedCode ? 'text-gray-800' : 'text-gray-600'} transition-transform`} />
                                        </div>

                                        {/* Facebook */}
                                        <div
                                            onClick={() => shareModel('facebook')}
                                            className="w-[2.8vw] h-[2.8vw] rounded-[0.5vw] bg-[#1877F2] flex items-center justify-center transition-all cursor-pointer shadow-md hover:opacity-90"
                                            title="Share on Facebook"
                                        >
                                            <Icon icon="ri:facebook-fill" className="w-[1.6vw] h-[1.6vw] text-white" />
                                        </div>
                                        {/* WhatsApp */}
                                        <div
                                            onClick={() => shareModel('whatsapp')}
                                            className="w-[2.8vw] h-[2.8vw] rounded-[0.5vw] bg-[#25D366] flex items-center justify-center transition-all cursor-pointer shadow-md"
                                        >
                                            <Icon icon="ic:baseline-whatsapp" className="w-[1.5vw] h-[1.5vw] text-white" />
                                        </div>
                                        {/* X */}
                                        <div
                                            onClick={() => shareModel('x')}
                                            className="w-[2.8vw] h-[2.8vw] rounded-[0.5vw] bg-black flex items-center justify-center transition-all cursor-pointer shadow-md"
                                        >
                                            <Icon icon="ri:twitter-x-fill" className="w-[1.4vw] h-[1.4vw] text-white" />
                                        </div>
                                        {/* Gmail */}
                                        <div
                                            onClick={() => shareModel('mail')}
                                            className="w-[2.8vw] h-[2.8vw] rounded-[0.5vw] border border-gray-200 flex items-center justify-center hover:border-gray-400 hover:bg-gray-50 transition-all cursor-pointer shadow-sm"
                                        >
                                            <Icon icon="logos:google-gmail" className="w-[1.4vw] h-[1.4vw]" />
                                        </div>
                                        {/* LinkedIn */}
                                        <div
                                            onClick={() => shareModel('linkedin')}
                                            className="w-[2.8vw] h-[2.8vw] rounded-[0.5vw] bg-[#0A66C2] flex items-center justify-center transition-all cursor-pointer shadow-md"
                                        >
                                            <Icon icon="ri:linkedin-fill" className="w-[1.6vw] h-[1.6vw] text-white" />
                                        </div>
                                        {/* Instagram */}
                                        <div
                                            onClick={() => shareModel('instagram')}
                                            className="w-[2.8vw] h-[2.8vw] rounded-[0.5vw] bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center transition-all cursor-pointer shadow-md"
                                        >
                                            <Icon icon="ri:instagram-line" className="w-[2.2vw] h-[2.2vw] text-white" />
                                        </div>
                                    </div>

                                    {/* Embed Code smoothly expanding */}
                                    <div className={`grid transition-all duration-300 ease-in-out ${showEmbedCode ? 'grid-rows-[1fr] opacity-100 mt-[0.5vw]' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                                        <div className="overflow-hidden flex flex-col gap-[0.6vw]">
                                            <div className="flex items-center gap-[0.6vw]">
                                                <h3 className="text-[0.8vw] font-bold text-gray-800 whitespace-nowrap">Embed Code</h3>
                                                <div className="flex-1 h-[1px] bg-gray-100" />
                                            </div>
                                            <div className="relative w-full h-[5.5vw] bg-white border border-gray-300 rounded-[0.4vw] shadow-sm overflow-hidden flex shrink-0">
                                                <textarea
                                                    readOnly
                                                    value={`<iframe src="${publicUrl}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`}
                                                    className="w-full h-full bg-transparent border-none outline-none text-[0.75vw] font-medium text-gray-600 resize-none p-[0.6vw] pr-[2.5vw] custom-scrollbar"
                                                />
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(`<iframe src="${publicUrl}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`);
                                                        setEmbedCopied(true);
                                                        setTimeout(() => setEmbedCopied(false), 2000);
                                                    }}
                                                    className="absolute bottom-[0.4vw] right-[0.4vw] p-[0.3vw] bg-white rounded-[0.2vw] border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                                                    title="Copy Embed Code"
                                                >
                                                    <Icon icon={embedCopied ? "lucide:check" : "lucide:copy"} className={`w-[0.9vw] h-[0.9vw] ${embedCopied ? 'text-green-500' : 'text-[#4A3AFF]'}`} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* EDIT QR VIEW */
                        <div className="flex gap-[1.5vw] animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* Left Column: QR Poster Preview */}
                            <div className="flex-[0.75] flex flex-col min-w-0 relative">
                                <div
                                    ref={posterPreviewRef}
                                    id="poster-preview-container"
                                    className="relative w-full h-[25vw] rounded-[1vw] border-[0.1vw] border-[#A5D6A7] p-[1.5vw] flex flex-col items-center shadow-sm overflow-hidden ml-[0.5vw] bg-white"
                                >
                                    {/* High Quality Exporting Overlay — rendered inside poster-preview-container
                                         but ignored by html2canvas using data-html2canvas-ignore */}
                                    {(isDownloading || isCapturing) && (
                                        <div
                                            data-html2canvas-ignore="true"
                                            className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-[0.6vw] pointer-events-auto"
                                        >
                                            <div className="bg-[#4A3AFF]/10 p-[0.8vw] rounded-full">
                                                <Icon icon="lucide:loader-2" className="animate-spin text-[#4A3AFF] w-[1.8vw] h-[1.8vw]" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[0.8vw] font-black text-gray-800 tracking-tight">Generating HD Poster</p>
                                                <p className="text-[0.6vw] text-gray-500 font-bold mt-[0.1vw]">Applying 3x upscale render...</p>
                                            </div>
                                        </div>
                                    )}
                                    {/* Color Background Layer (Bottom) */}
                                    <div
                                        className="absolute inset-0 pointer-events-none transition-all duration-300 z-0"
                                        style={{
                                            backgroundColor: !customBgColor.includes('gradient') ? customBgColor : 'transparent',
                                            backgroundImage: customBgColor.includes('gradient') ? customBgColor : 'none',
                                        }}
                                    />

                                    {/* Image Background Layer (Top - rendered with dynamic opacity over the color layer) */}
                                    {qrBgType === 'Image' && qrBgImage && (
                                        <img
                                            src={qrBgImage.startsWith('data:') ? qrBgImage : `${qrBgImage}${qrBgImage.includes('?') ? '&' : '?'}cors=1`}
                                            crossOrigin="anonymous"
                                            className="absolute inset-0 pointer-events-none transition-all duration-300 z-[1]"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: qrBgFit === 'Fit' ? 'contain' : qrBgFit === 'Fill' ? 'cover' : 'fill',
                                                opacity: qrBgOpacity / 100,
                                            }}
                                        />
                                    )}

                                    {/* Top Text */}
                                    <div className="text-center mb-[2vw] shrink-0 relative z-10 w-full max-w-full px-[0.5vw]">
                                        <h3
                                            ref={posterText1Ref}
                                            data-export-id="poster-text1"
                                            className="text-center font-black break-words w-full"
                                            style={{
                                                fontFamily: text1FontFamily,
                                                fontSize: typeof text1FontSize === 'number' ? `${text1FontSize / 15}vw` : '1.6vw',
                                                fontWeight: text1Bold ? (text1FontWeight === 'Regular' ? '400' : text1FontWeight === 'Medium' ? '500' : text1FontWeight === 'Semi Bold' ? '600' : text1FontWeight === 'Bold' ? '700' : '900') : '400',
                                                letterSpacing: text1LetterSpacing === 'Auto' ? 'normal' : `${text1LetterSpacing / 10}em`,
                                                lineHeight: text1LineHeight === 'Auto' ? '1.1' : String(text1LineHeight),
                                                textAlign: text1Align,
                                                color: text1Color,
                                                opacity: text1ColorOpacity / 100,
                                                fontStyle: text1Italic ? 'italic' : 'normal',
                                                textDecoration: [
                                                    text1Underline ? 'underline' : '',
                                                    text1Linethrough ? 'line-through' : ''
                                                ].filter(Boolean).join(' ') || 'none',
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            {text1}
                                        </h3>
                                    </div>

                                    {/* QR Code Area */}
                                    <div className="flex-1 flex flex-col items-center justify-start w-full relative min-h-0 z-10">
                                        <span
                                            ref={posterText2Ref}
                                            data-export-id="poster-text2"
                                            className="mb-[1.5vw] uppercase text-center font-bold block w-full max-w-full px-[0.5vw]"
                                            style={{
                                                fontFamily: text2FontFamily,
                                                fontSize: typeof text2FontSize === 'number' ? `${text2FontSize / 15}vw` : '0.7vw',
                                                fontWeight: text2Bold ? (text2FontWeight === 'Regular' ? '400' : text2FontWeight === 'Medium' ? '500' : text2FontWeight === 'Semi Bold' ? '600' : text2FontWeight === 'Bold' ? '700' : '900') : '400',
                                                letterSpacing: text2LetterSpacing === 'Auto' ? '0.2em' : `${text2LetterSpacing / 10}em`,
                                                lineHeight: text2LineHeight === 'Auto' ? 'normal' : String(text2LineHeight),
                                                textAlign: text2Align,
                                                color: text2Color,
                                                opacity: text2ColorOpacity / 100,
                                                fontStyle: text2Italic ? 'italic' : 'normal',
                                                textDecoration: [
                                                    text2Underline ? 'underline' : '',
                                                    text2Linethrough ? 'line-through' : ''
                                                ].filter(Boolean).join(' ') || 'none',
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word',
                                            }}
                                        >
                                            {text2}
                                        </span>

                                        <div ref={posterQrWrapRef} data-export-id="poster-qr-wrap" className="relative p-[1.2vw] shrink-0">
                                            {/* Decorative Corners */}
                                            <div
                                                className="absolute top-0 left-0 w-[1.5vw] h-[1.5vw] border-t-[3px] border-l-[3px] rounded-tl-[0.8vw]"
                                                style={{ borderColor: qrColor }}
                                            />
                                            <div
                                                className="absolute top-0 right-0 w-[1.5vw] h-[1.5vw] border-t-[3px] border-r-[3px] rounded-tr-[0.8vw]"
                                                style={{ borderColor: qrColor }}
                                            />
                                            <div
                                                className="absolute bottom-0 left-0 w-[1.5vw] h-[1.5vw] border-b-[3px] border-l-[3px] rounded-bl-[0.8vw]"
                                                style={{ borderColor: qrColor }}
                                            />
                                            <div
                                                className="absolute bottom-0 right-0 w-[1.5vw] h-[1.5vw] border-b-[3px] border-r-[3px] rounded-br-[0.8vw]"
                                                style={{ borderColor: qrColor }}
                                            />

                                            {/* The QR Code - Styled to match image (no background box) */}
                                            <div className="flex items-center justify-center relative">
                                                <CustomQRCode
                                                    value={publicUrl}
                                                    size={300}
                                                    fgColor={qrColor}
                                                    bgColor={qrBgColor === '#ffffff' ? 'transparent' : qrBgColor}
                                                    dotType={qrDotType}
                                                    cornerSquareType={qrCornerSquareType}
                                                    cornerDotType={qrCornerDotType}
                                                    level={qrLevel}
                                                    logo={qrLogo}
                                                    style={{ width: '10vw', height: '10vw' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Templates & Customize */}
                            <div className="flex-[1.25] flex flex-col gap-[1vw] h-[25vw]">
                                <div className="flex-1 flex flex-col bg-gray-100 rounded-[1vw] border border-gray-200 shadow-sm relative">
                                    {/* Tabs Header */}
                                    <div className="flex bg-gray-200/90 border-b border-gray-300 shrink-0 rounded-t-[1vw]">
                                        <button
                                            onClick={() => setActiveQRTab('templates')}
                                            className={`flex-1 py-[0.5vw] text-[0.75vw] font-semibold transition-all relative ${activeQRTab === 'templates' ? 'text-gray-900 bg-white/20' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            Templates
                                            {activeQRTab === 'templates' && <div className="absolute bottom-0 left-0 right-0 h-[0.1vw] bg-black rounded-full" />}
                                        </button>
                                        <button
                                            onClick={() => setActiveQRTab('customize')}
                                            className={`flex-1 py-[0.5vw] text-[0.75vw] font-semibold transition-all relative ${activeQRTab === 'customize' ? 'text-gray-900 bg-white/20' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            Customize
                                            {activeQRTab === 'customize' && <div className="absolute bottom-0 left-0 right-0 h-[0.1vw] bg-black rounded-full" />}
                                        </button>
                                    </div>

                                    {/* Tab Content */}
                                    <div className="flex-1 overflow-hidden relative">
                                        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden p-[1vw] custom-scrollbar">
                                            {activeQRTab === 'templates' ? (
                                                <div className="grid grid-cols-3 gap-[0.8vw]">
                                                    {posterTemplates.map((tpl, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => applyPosterTemplate(tpl, idx)}
                                                            className={`aspect-[3/4] rounded-[0.8vw] overflow-hidden cursor-pointer active:scale-98 transition-all group relative w-full text-left outline-none flex flex-col items-center justify-between p-[0.6vw] ${selectedTemplateIdx === idx
                                                                    ? 'border-[0.18vw] border-[#4A3AFF] shadow-lg ring-[0.1vw] ring-[#4A3AFF]/20 scale-[1.02]'
                                                                    : 'border border-gray-200 hover:border-[#4A3AFF]/80 hover:shadow-sm'
                                                                }`}
                                                            style={tpl.bgType === 'Color' ? { background: tpl.bgColor } : {}}
                                                        >
                                                            {tpl.bgType === 'Image' && (
                                                                <img
                                                                    src={tpl.bgImage}
                                                                    alt={tpl.name}
                                                                    className="absolute inset-0 w-full h-full object-cover"
                                                                />
                                                            )}
                                                            {/* Dark glass overlay for image background readability */}
                                                            {tpl.bgType === 'Image' && <div className="absolute inset-0 bg-black/10" />}

                                                            {/* Active Template Floating Checkmark Badge */}
                                                            {selectedTemplateIdx === idx && (
                                                                <div className="absolute top-[0.4vw] right-[0.4vw] bg-[#4A3AFF] text-white w-[1.2vw] h-[1.2vw] rounded-full flex items-center justify-center shadow-md z-30 border border-white/30 animate-in zoom-in-50 duration-150">
                                                                    <Icon icon="lucide:check" className="w-[0.7vw] h-[0.7vw] text-white" strokeWidth={4} />
                                                                </div>
                                                            )}

                                                            {/* Mini Poster Content */}
                                                            <div className="relative w-full h-full flex flex-col items-center justify-between z-10 select-none pointer-events-none">
                                                                {/* Mini Title */}
                                                                <div className="text-center w-full leading-tight mt-[0.1vw]">
                                                                    <p
                                                                        style={{ color: tpl.text1Color, fontFamily: tpl.fontFamily }}
                                                                        className="text-[0.4vw] font-black tracking-tight uppercase line-clamp-1"
                                                                    >
                                                                        {text1 || 'ACCEPTING NEW CLIENTS'}
                                                                    </p>
                                                                </div>

                                                                {/* Mini QR Area */}
                                                                <div className="flex flex-col items-center justify-center relative my-auto p-[0.3vw]">
                                                                    {/* Decorative L-Corners in Mini */}
                                                                    <div className="absolute top-0 left-0 w-[0.4vw] h-[0.4vw] border-t-[1px] border-l-[1px]" style={{ borderColor: tpl.qrColor }} />
                                                                    <div className="absolute top-0 right-0 w-[0.4vw] h-[0.4vw] border-t-[1px] border-r-[1px]" style={{ borderColor: tpl.qrColor }} />
                                                                    <div className="absolute bottom-0 left-0 w-[0.4vw] h-[0.4vw] border-b-[1px] border-l-[1px]" style={{ borderColor: tpl.qrColor }} />
                                                                    <div className="absolute bottom-0 right-0 w-[0.4vw] h-[0.4vw] border-b-[1px] border-r-[1px]" style={{ borderColor: tpl.qrColor }} />

                                                                    {/* Stylized QR Code Icon */}
                                                                    <div
                                                                        className="w-[1.6vw] h-[1.6vw] flex flex-col justify-between p-[0.1vw] rounded-[0.1vw]"
                                                                        style={{ color: tpl.qrColor }}
                                                                    >
                                                                        <Icon icon="lucide:qr-code" className="w-full h-full" style={{ color: tpl.qrColor }} />
                                                                    </div>
                                                                </div>

                                                                {/* Mini Subtitle */}
                                                                <div className="text-center w-full leading-none mb-[1.2vw]">
                                                                    <p
                                                                        style={{ color: tpl.text2Color, fontFamily: tpl.fontFamily }}
                                                                        className="text-[0.28vw] font-bold tracking-widest uppercase truncate"
                                                                    >
                                                                        {text2 || 'TAP TO SCAN'}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Template Name Capsule Badge */}
                                                            <div className="absolute bottom-[0.4vw] left-[0.4vw] bg-[#2D3139]/80 rounded-[0.25vw] px-[0.4vw] py-[0.15vw] max-w-[85%] flex items-center shadow-md z-20">
                                                                <p className="text-[0.45vw] font-bold text-white tracking-wider truncate uppercase whitespace-nowrap leading-none">
                                                                    {tpl.name}
                                                                </p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-[0.8vw]">
                                                    {/* Dimensions */}
                                                    <div className="flex items-center gap-[0.5vw] min-w-0">
                                                        <span className="text-[0.7vw] font-semibold text-gray-700 w-[6vw] shrink-0">Dimension :</span>
                                                        <div className="flex items-center gap-[0.5vw]">
                                                            <div className="flex items-center gap-[0.4vw]">
                                                                <span className="text-[0.7vw] font-medium text-gray-500 uppercase whitespace-nowrap">w :</span>
                                                                <div className="flex items-center gap-[0.3vw]">
                                                                    <button className="p-[0.2vw] text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-[0.3vw] transition-all cursor-pointer"><ChevronLeft size="0.9vw" /></button>
                                                                    <div className="flex items-center border border-gray-300 rounded-[0.4vw] px-[0.4vw] py-[0.15vw] bg-white">
                                                                        <input
                                                                            type="number"
                                                                            value={qrWidth}
                                                                            onChange={(e) => setQrWidth(parseInt(e.target.value) || 0)}
                                                                            className="w-[3vw] text-center text-[0.8vw] font-semibold text-gray-700 outline-none no-spin"
                                                                        />
                                                                    </div>
                                                                    <button
                                                                        onClick={() => setQrWidth(prev => prev + 10)}
                                                                        className="p-[0.2vw] text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-[0.3vw] transition-all cursor-pointer"
                                                                    >
                                                                        <ChevronRight size="0.9vw" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-[0.4vw]">
                                                                <span className="text-[0.7vw] font-medium text-gray-500 uppercase whitespace-nowrap">h :</span>
                                                                <div className="flex items-center gap-[0.3vw]">
                                                                    <button
                                                                        onClick={() => setQrHeight(prev => Math.max(0, prev - 10))}
                                                                        className="p-[0.2vw] text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-[0.3vw] transition-all cursor-pointer"
                                                                    >
                                                                        <ChevronLeft size="0.9vw" />
                                                                    </button>
                                                                    <div className="flex items-center border border-gray-300 rounded-[0.4vw] px-[0.4vw] py-[0.15vw] bg-white">
                                                                        <input
                                                                            type="number"
                                                                            value={qrHeight}
                                                                            onChange={(e) => setQrHeight(parseInt(e.target.value) || 0)}
                                                                            className="w-[3vw] text-center text-[0.8vw] font-semibold text-gray-700 outline-none no-spin"
                                                                        />
                                                                    </div>
                                                                    <button
                                                                        onClick={() => setQrHeight(prev => prev + 10)}
                                                                        className="p-[0.2vw] text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-[0.3vw] transition-all cursor-pointer"
                                                                    >
                                                                        <ChevronRight size="0.9vw" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Text Inputs */}
                                                    <div className="flex flex-col gap-[0.6vw]">
                                                        <div className="flex items-start gap-[0.5vw] min-w-0">
                                                            <span className="text-[0.7vw] font-semibold text-gray-700 w-[6vw] shrink-0 mt-[0.5vw]">Enter Text 1 :</span>
                                                            <div className="flex-1 flex items-center gap-[0.5vw]">
                                                                <div className="flex-1 relative">
                                                                    <input
                                                                        type="text"
                                                                        className="w-full px-[0.8vw] py-[0.5vw] border border-gray-400 rounded-[0.6vw] text-[0.8vw] font-medium text-gray-700 outline-none focus:border-black transition-colors pr-[2.2vw]"
                                                                        placeholder="Title"
                                                                        value={text1}
                                                                        onChange={(e) => setText1(e.target.value)}
                                                                    />
                                                                    <Edit3 size="0.8vw" className="absolute right-[0.6vw] top-1/2 -translate-y-1/2 text-gray-400" />
                                                                </div>
                                                                <button
                                                                    onClick={() => setActiveTextEditor(activeTextEditor === 'text1' ? null : 'text1')}
                                                                    className={`p-[0.4vw] rounded-[0.4vw] transition-colors cursor-pointer ${activeTextEditor === 'text1' ? 'bg-[#4A3AFF] text-white hover:bg-blue-700 shadow-sm' : 'text-gray-700 hover:bg-gray-100'}`}
                                                                >
                                                                    <Sliders size="1vw" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-start gap-[0.5vw] min-w-0">
                                                            <span className="text-[0.7vw] font-semibold text-gray-700 w-[6vw] shrink-0 mt-[0.5vw]">Enter Text 2 :</span>
                                                            <div className="flex-1 flex items-center gap-[0.5vw]">
                                                                <div className="flex-1 relative">
                                                                    <textarea
                                                                        className="w-full px-[0.8vw] py-[0.6vw] border border-gray-400 rounded-[0.6vw] text-[0.8vw] font-medium text-gray-700 outline-none focus:border-black transition-colors pr-[2.2vw] resize-none h-[4vw]"
                                                                        placeholder="Supporting Text"
                                                                        value={text2}
                                                                        onChange={(e) => setText2(e.target.value)}
                                                                    />
                                                                    <Edit3 size="0.8vw" className="absolute right-[0.6vw] bottom-[0.6vw] text-gray-400" />
                                                                </div>
                                                                <button
                                                                    onClick={() => setActiveTextEditor(activeTextEditor === 'text2' ? null : 'text2')}
                                                                    className={`p-[0.4vw] rounded-[0.4vw] transition-colors cursor-pointer ${activeTextEditor === 'text2' ? 'bg-[#4A3AFF] text-white hover:bg-blue-700 shadow-sm' : 'text-gray-700 hover:bg-gray-100'}`}
                                                                >
                                                                    <Sliders size="1vw" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Edit QR Code */}
                                                    <div className="flex items-start gap-[0.5vw] min-w-0">
                                                        <span className="text-[0.7vw] font-semibold text-gray-700 w-[6vw] shrink-0 mt-[0.5vw]">Edit QR Code :</span>
                                                        <div className="flex-1 flex flex-col gap-[0.8vw] min-w-0">
                                                            <div className="bg-white border border-gray-200 rounded-[0.8vw] p-[0.8vw] flex gap-[1vw] relative overflow-hidden shadow-sm">
                                                                <div
                                                                    ref={qrRef}
                                                                    className="w-[10.5vw] h-[10.5vw] bg-gray-100 rounded-[0.5vw] flex items-center justify-center relative shrink-0"
                                                                >
                                                                    <CustomQRCode
                                                                        value={publicUrl}
                                                                        size={256}
                                                                        fgColor={qrColor}
                                                                        bgColor={qrBgColor}
                                                                        dotType={qrDotType}
                                                                        cornerSquareType={qrCornerSquareType}
                                                                        cornerDotType={qrCornerDotType}
                                                                        level={qrLevel}
                                                                        style={{ width: '100%', height: '100%', padding: '0.8vw' }}
                                                                    />
                                                                </div>
                                                                <div className="flex-1 grid grid-cols-2 gap-[0.5vw] min-w-0 h-[10.5vw] overflow-hidden pr-[0.4vw] content-start">
                                                                    {qrThemes.map((theme, i) => (
                                                                        <div
                                                                            key={i}
                                                                            onClick={() => {
                                                                                setQrColor(theme.fg);
                                                                                setQrBgColor(theme.bg);
                                                                                setQrDotType(theme.dotType || 'square');
                                                                                setQrCornerSquareType(theme.cornerSquareType || 'square');
                                                                                setQrCornerDotType(theme.cornerDotType || 'square');
                                                                            }}
                                                                            className="w-full h-[3.1vw] bg-white border border-gray-200 rounded-[0.5vw] cursor-pointer flex items-center justify-center p-[0.32vw] shadow-sm hover:border-[#4A3AFF] transition-all"
                                                                        >
                                                                            <CustomQRCode
                                                                                value="1"
                                                                                size={64}
                                                                                fgColor={theme.fg}
                                                                                bgColor={theme.bg}
                                                                                dotType={theme.dotType || 'square'}
                                                                                cornerSquareType={theme.cornerSquareType || 'square'}
                                                                                cornerDotType={theme.cornerDotType || 'square'}
                                                                                level="L"
                                                                                style={{ width: '100%', height: '100%' }}
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* QR Colors (Now under Edit QR Code) */}
                                                            <div className="flex flex-col gap-[0.8vw] mt-[0.2vw]">
                                                                <div className="flex items-center gap-[0.5vw] min-w-0">
                                                                    <span className="text-[0.7vw] font-semibold text-gray-700 w-[5.5vw] shrink-0">QR Color :</span>
                                                                    <div className="flex-1 flex items-center gap-[0.5vw] min-w-0 relative">
                                                                        <button
                                                                            onClick={() => {
                                                                                setShowQrColorPicker(!showQrColorPicker);
                                                                                setShowQrBgColorPicker(false);
                                                                            }}
                                                                            className="w-[1.8vw] h-[1.6vw] rounded-[0.3vw] border border-gray-400 shadow-sm shrink-0 cursor-pointer transition-all hover:scale-105 active:scale-95 outline-none"
                                                                            style={{ backgroundColor: qrColor }}
                                                                        />
                                                                        <div className="flex-1 flex items-center border border-gray-300 rounded-[0.4vw] bg-white overflow-hidden shadow-sm min-w-0">
                                                                            <input
                                                                                type="text"
                                                                                value={qrColor}
                                                                                onChange={(e) => setQrColor(e.target.value)}
                                                                                onClick={() => {
                                                                                    setShowQrColorPicker(true);
                                                                                    setShowQrBgColorPicker(false);
                                                                                }}
                                                                                className="flex-1 px-[0.6vw] py-[0.3vw] text-[0.75vw] font-bold text-gray-700 uppercase outline-none min-w-0 cursor-pointer"
                                                                            />
                                                                            <span className="px-[0.6vw] text-[0.75vw] font-semibold text-gray-400 border-l border-gray-100 shrink-0">100%</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-[0.5vw] min-w-0">
                                                                    <span className="text-[0.7vw] font-semibold text-gray-700 w-[5.5vw] shrink-0">BG Color :</span>
                                                                    <div className="flex-1 flex items-center gap-[0.5vw] min-w-0 relative">
                                                                        <button
                                                                            onClick={() => {
                                                                                setShowQrBgColorPicker(!showQrBgColorPicker);
                                                                                setShowQrColorPicker(false);
                                                                            }}
                                                                            className="w-[1.8vw] h-[1.6vw] rounded-[0.3vw] border border-gray-400 shadow-sm shrink-0 cursor-pointer transition-all hover:scale-105 active:scale-95 outline-none"
                                                                            style={{ backgroundColor: qrBgColor === 'transparent' ? '#ffffff' : qrBgColor }}
                                                                        />
                                                                        <div className="flex-1 flex items-center border border-gray-300 rounded-[0.4vw] bg-white overflow-hidden shadow-sm min-w-0">
                                                                            <input
                                                                                type="text"
                                                                                value={qrBgColor}
                                                                                onChange={(e) => setQrBgColor(e.target.value)}
                                                                                onClick={() => {
                                                                                    setShowQrBgColorPicker(true);
                                                                                    setShowQrColorPicker(false);
                                                                                }}
                                                                                className="flex-1 px-[0.6vw] py-[0.3vw] text-[0.75vw] font-bold text-gray-700 uppercase outline-none min-w-0 cursor-pointer"
                                                                            />
                                                                            <span className="px-[0.6vw] text-[0.75vw] font-semibold text-gray-400 border-l border-gray-100 shrink-0">100%</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-[0.5vw] min-w-0">
                                                                    <span className="text-[0.7vw] font-semibold text-gray-700 w-[5.5vw] shrink-0">QR Level :</span>
                                                                    <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-[0.6vw] p-[0.3vw] gap-[0.3vw] shadow-sm min-w-0">
                                                                        {[
                                                                            { label: 'Low', value: 'L' },
                                                                            { label: 'Medium', value: 'M' },
                                                                            { label: 'High', value: 'H' }
                                                                        ].map((level) => (
                                                                            <button
                                                                                key={level.value}
                                                                                onClick={() => setQrLevel(level.value)}
                                                                                className={`flex-1 px-[1vw] py-[0.3vw] rounded-[0.4vw] text-[0.75vw] cursor-pointer font-semibold transition-all ${qrLevel === level.value ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                                                                            >
                                                                                {level.label}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                {/* Dot Style Selection */}
                                                                <div className="flex items-center gap-[0.5vw] min-w-0">
                                                                    <span className="text-[0.7vw] font-semibold text-gray-700 w-[5.5vw] shrink-0">Dot Style :</span>
                                                                    <div className="flex-1 relative">
                                                                        <button
                                                                            onClick={toggleDotTypeDropdown}
                                                                            className="w-full bg-white border border-gray-300 rounded-[0.4vw] px-[0.6vw] py-[0.35vw] text-[0.75vw] font-semibold text-gray-700 outline-none flex items-center justify-between shadow-sm cursor-pointer hover:border-gray-400 transition-all"
                                                                        >
                                                                            <span className="capitalize">{qrDotType.replace('-', ' ')}</span>
                                                                            <ChevronDown size="0.8vw" className={`text-gray-400 transition-transform duration-200 ${showDotTypeDropdown ? 'rotate-180' : ''}`} />
                                                                        </button>
                                                                        {showDotTypeDropdown && (
                                                                            <>
                                                                                <div className="fixed inset-0 z-[55] cursor-default" onClick={() => setShowDotTypeDropdown(false)} />
                                                                                <div className={`absolute ${dotTypeDirection === 'up' ? 'bottom-[calc(100%+0.2vw)] animate-in fade-in slide-in-from-bottom-1' : 'top-[calc(100%+0.2vw)] animate-in fade-in slide-in-from-top-1'} left-0 w-full bg-white border border-gray-100 rounded-[0.5vw] shadow-xl z-[60] py-[0.3vw] max-h-[12vw] overflow-y-auto custom-scrollbar`}>
                                                                                    {['square', 'dots', 'rounded', 'extra-rounded', 'classy', 'classy-rounded'].map((type) => (
                                                                                        <button
                                                                                            key={type}
                                                                                            onClick={() => {
                                                                                                setQrDotType(type);
                                                                                                setShowDotTypeDropdown(false);
                                                                                            }}
                                                                                            className={`w-full text-left px-[0.6vw] py-[0.4vw] text-[0.7vw] font-semibold capitalize transition-all hover:bg-gray-50 flex items-center justify-between cursor-pointer ${qrDotType === type ? 'text-[#4A3AFF]' : 'text-gray-500 hover:text-gray-700'}`}
                                                                                        >
                                                                                            {type.replace('-', ' ')}
                                                                                            {qrDotType === type && <Check size="0.7vw" />}
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Eye Frame Style Selection */}
                                                                <div className="flex items-center gap-[0.5vw] min-w-0">
                                                                    <span className="text-[0.7vw] font-semibold text-gray-700 w-[5.5vw] shrink-0">Eye Frame :</span>
                                                                    <div className="flex-1 relative">
                                                                        <button
                                                                            onClick={toggleCornerSquareTypeDropdown}
                                                                            className="w-full bg-white border border-gray-300 rounded-[0.4vw] px-[0.6vw] py-[0.35vw] text-[0.75vw] font-semibold text-gray-700 outline-none flex items-center justify-between shadow-sm cursor-pointer hover:border-gray-400 transition-all"
                                                                        >
                                                                            <span className="capitalize">{qrCornerSquareType.replace('-', ' ')}</span>
                                                                            <ChevronDown size="0.8vw" className={`text-gray-400 transition-transform duration-200 ${showCornerSquareTypeDropdown ? 'rotate-180' : ''}`} />
                                                                        </button>
                                                                        {showCornerSquareTypeDropdown && (
                                                                            <>
                                                                                <div className="fixed inset-0 z-[55] cursor-default" onClick={() => setShowCornerSquareTypeDropdown(false)} />
                                                                                <div className={`absolute ${cornerSquareTypeDirection === 'up' ? 'bottom-[calc(100%+0.2vw)] animate-in fade-in slide-in-from-bottom-1' : 'top-[calc(100%+0.2vw)] animate-in fade-in slide-in-from-top-1'} left-0 w-full bg-white border border-gray-100 rounded-[0.5vw] shadow-xl z-[60] py-[0.3vw]`}>
                                                                                    {['square', 'dot', 'extra-rounded'].map((type) => (
                                                                                        <button
                                                                                            key={type}
                                                                                            onClick={() => {
                                                                                                setQrCornerSquareType(type);
                                                                                                setShowCornerSquareTypeDropdown(false);
                                                                                            }}
                                                                                            className={`w-full text-left px-[0.6vw] py-[0.4vw] text-[0.7vw] font-semibold capitalize transition-all hover:bg-gray-50 flex items-center justify-between cursor-pointer ${qrCornerSquareType === type ? 'text-[#4A3AFF]' : 'text-gray-500 hover:text-gray-700'}`}
                                                                                        >
                                                                                            {type.replace('-', ' ')}
                                                                                            {qrCornerSquareType === type && <Check size="0.7vw" />}
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Eye Ball Style Selection */}
                                                                <div className="flex items-center gap-[0.5vw] min-w-0">
                                                                    <span className="text-[0.7vw] font-semibold text-gray-700 w-[5.5vw] shrink-0">Eye Ball :</span>
                                                                    <div className="flex-1 relative">
                                                                        <button
                                                                            onClick={toggleCornerDotTypeDropdown}
                                                                            className="w-full bg-white border border-gray-300 rounded-[0.4vw] px-[0.6vw] py-[0.35vw] text-[0.75vw] font-semibold text-gray-700 outline-none flex items-center justify-between shadow-sm cursor-pointer hover:border-gray-400 transition-all"
                                                                        >
                                                                            <span className="capitalize">{qrCornerDotType.replace('-', ' ')}</span>
                                                                            <ChevronDown size="0.8vw" className={`text-gray-400 transition-transform duration-200 ${showCornerDotTypeDropdown ? 'rotate-180' : ''}`} />
                                                                        </button>
                                                                        {showCornerDotTypeDropdown && (
                                                                            <>
                                                                                <div className="fixed inset-0 z-[55] cursor-default" onClick={() => setShowCornerDotTypeDropdown(false)} />
                                                                                <div className={`absolute ${cornerDotTypeDirection === 'up' ? 'bottom-[calc(100%+0.2vw)] animate-in fade-in slide-in-from-bottom-1' : 'top-[calc(100%+0.2vw)] animate-in fade-in slide-in-from-top-1'} left-0 w-full bg-white border border-gray-100 rounded-[0.5vw] shadow-xl z-[60] py-[0.3vw]`}>
                                                                                    {['square', 'dot'].map((type) => (
                                                                                        <button
                                                                                            key={type}
                                                                                            onClick={() => {
                                                                                                setQrCornerDotType(type);
                                                                                                setShowCornerDotTypeDropdown(false);
                                                                                            }}
                                                                                            className={`w-full text-left px-[0.6vw] py-[0.4vw] text-[0.7vw] font-semibold capitalize transition-all hover:bg-gray-50 flex items-center justify-between cursor-pointer ${qrCornerDotType === type ? 'text-[#4A3AFF]' : 'text-gray-500 hover:text-gray-700'}`}
                                                                                        >
                                                                                            {type.replace('-', ' ')}
                                                                                            {qrCornerDotType === type && <Check size="0.7vw" />}
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-start gap-[0.5vw] min-w-0 mt-[0.2vw]">
                                                                    <span className="text-[0.7vw] font-semibold text-gray-700 w-[5.5vw] shrink-0 mt-[0.4vw]">Add Logo :</span>
                                                                    <div className="flex-1 flex flex-col items-center gap-[0.4vw]">
                                                                        <label className="w-full h-[4.5vw] border-[0.12vw] border-dashed border-gray-300 rounded-[0.6vw] flex flex-col items-center justify-center gap-[0.2vw] bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer group relative overflow-hidden">
                                                                            <input
                                                                                type="file"
                                                                                className="hidden"
                                                                                accept="image/*"
                                                                                onChange={(e) => {
                                                                                    const file = e.target.files?.[0];
                                                                                    if (file) {
                                                                                        const reader = new FileReader();
                                                                                        reader.onloadend = () => {
                                                                                            setQrLogo(reader.result);
                                                                                        };
                                                                                        reader.readAsDataURL(file);
                                                                                    }
                                                                                }}
                                                                            />
                                                                            {qrLogo ? (
                                                                                <div className="absolute inset-0 flex items-center justify-center bg-white p-[0.3vw]">
                                                                                    <img
                                                                                        src={qrLogo}
                                                                                        alt="Logo Preview"
                                                                                        className="h-full object-contain"
                                                                                    />
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={(e) => {
                                                                                            e.preventDefault();
                                                                                            e.stopPropagation();
                                                                                            setQrLogo(null);
                                                                                        }}
                                                                                        className="absolute top-[0.2vw] right-[0.2vw] p-[0.2vw] bg-red-50 hover:bg-red-100 text-red-500 rounded-full transition-colors z-10"
                                                                                    >
                                                                                        <X size="0.6vw" />
                                                                                    </button>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex flex-col items-center pointer-events-none">
                                                                                    <p className="text-[0.55vw] font-medium text-gray-500">Drag & Drop or <span className="text-blue-600">Upload</span></p>
                                                                                    <Upload size="0.9vw" className="text-gray-400 group-hover:text-gray-600 transition-colors mt-[0.2vw]" />
                                                                                    <p className="text-[0.5vw] text-gray-400 mt-[0.2vw]">Supported File Format : JPG, PNG</p>
                                                                                </div>
                                                                            )}
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Background Customize */}
                                                    <div className="flex items-start gap-[0.5vw] min-w-0 mt-[0.4vw]">
                                                        <span className="text-[0.7vw] font-semibold text-gray-700 w-[6vw] shrink-0 mt-[0.4vw]">Background :</span>
                                                        <div className="flex-1 bg-white border border-gray-200 rounded-[0.8vw] shadow-sm">
                                                            <div className="px-[0.8vw] py-[0.4vw] border-b border-gray-100 bg-gray-50/30">
                                                                <span className="text-[0.7vw] font-bold text-gray-800">Customize your BG</span>
                                                            </div>
                                                            <div className="p-[0.6vw] flex flex-col gap-[0.6vw]">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="relative w-[7.5vw]">
                                                                        <button
                                                                            onClick={toggleBgTypeDropdown}
                                                                            className="w-full bg-white border border-gray-200 rounded-[0.4vw] px-[0.6vw] py-[0.35vw] text-[0.75vw] font-semibold text-gray-700 outline-none flex items-center justify-between shadow-sm cursor-pointer hover:border-gray-300 transition-all"
                                                                        >
                                                                            <span>{qrBgType}</span>
                                                                            <ChevronDown size="0.8vw" className={`text-gray-400 transition-transform duration-200 ${showBgTypeDropdown ? 'rotate-180' : ''}`} />
                                                                        </button>

                                                                        {showBgTypeDropdown && (
                                                                            <>
                                                                                <div className="fixed inset-0 z-[55] cursor-default" onClick={() => setShowBgTypeDropdown(false)} />
                                                                                <div className={`absolute ${bgTypeDirection === 'up' ? 'bottom-[calc(100%+0.2vw)] animate-in fade-in slide-in-from-bottom-1' : 'top-[calc(100%+0.2vw)] animate-in fade-in slide-in-from-top-1'} left-0 w-full bg-white border border-gray-100 rounded-[0.5vw] shadow-xl z-[60] py-[0.3vw] duration-200`}>
                                                                                    {['Color', 'Image'].map((type) => (
                                                                                        <button
                                                                                            key={type}
                                                                                            onClick={() => {
                                                                                                setQrBgType(type);
                                                                                                setShowBgTypeDropdown(false);
                                                                                            }}
                                                                                            className={`w-full text-left px-[0.6vw] py-[0.4vw] text-[0.7vw] font-semibold transition-all hover:bg-gray-50 flex items-center justify-between cursor-pointer ${qrBgType === type ? 'text-[#4A3AFF]' : 'text-gray-500 hover:text-gray-700'}`}
                                                                                        >
                                                                                            {type}
                                                                                            {qrBgType === type && <Check size="0.7vw" />}
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </div>

                                                                    {qrBgType === 'Image' && (
                                                                        <div className="relative w-[6.5vw]">
                                                                            <button
                                                                                onClick={toggleBgFitDropdown}
                                                                                className="w-full bg-white border border-gray-200 rounded-[0.4vw] px-[0.6vw] py-[0.35vw] text-[0.75vw] font-semibold text-gray-700 outline-none flex items-center justify-between shadow-sm cursor-pointer hover:border-gray-300 transition-all"
                                                                            >
                                                                                <span>{qrBgFit}</span>
                                                                                <ChevronDown size="0.8vw" className={`text-gray-400 transition-transform duration-200 ${showBgFitDropdown ? 'rotate-180' : ''}`} />
                                                                            </button>

                                                                            {showBgFitDropdown && (
                                                                                <>
                                                                                    <div className="fixed inset-0 z-[55] cursor-default" onClick={() => setShowBgFitDropdown(false)} />
                                                                                    <div className={`absolute ${bgFitDirection === 'up' ? 'bottom-[calc(100%+0.2vw)] animate-in fade-in slide-in-from-bottom-1' : 'top-[calc(100%+0.2vw)] animate-in fade-in slide-in-from-top-1'} left-0 w-full bg-white border border-gray-100 rounded-[0.5vw] shadow-xl z-[60] py-[0.3vw] duration-200`}>
                                                                                        {['Fit', 'Fill', 'Stretch'].map((fit) => (
                                                                                            <button
                                                                                                key={fit}
                                                                                                onClick={() => {
                                                                                                    setQrBgFit(fit);
                                                                                                    setShowBgFitDropdown(false);
                                                                                                }}
                                                                                                className={`w-full text-left px-[0.6vw] py-[0.4vw] text-[0.7vw] font-semibold transition-all hover:bg-gray-50 flex items-center justify-between cursor-pointer ${qrBgFit === fit ? 'text-[#4A3AFF]' : 'text-gray-500 hover:text-gray-700'}`}
                                                                                            >
                                                                                                {fit}
                                                                                                {qrBgFit === fit && <Check size="0.7vw" />}
                                                                                            </button>
                                                                                        ))}
                                                                                    </div>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {qrBgType === 'Image' && (
                                                                    <>
                                                                        <label className="w-full h-[6vw] border-[0.12vw] border-dashed border-gray-300 rounded-[0.6vw] flex flex-col items-center justify-center gap-[0.2vw] bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer group relative overflow-hidden mt-[0.2vw]">
                                                                            <input
                                                                                type="file"
                                                                                accept="image/*"
                                                                                onChange={(e) => {
                                                                                    const file = e.target.files[0];
                                                                                    if (file) {
                                                                                        setQrBgImage(URL.createObjectURL(file));
                                                                                    }
                                                                                }}
                                                                                className="hidden"
                                                                            />
                                                                            {qrBgImage ? (
                                                                                <div className="w-full h-full relative">
                                                                                    <img src={qrBgImage} className="w-full h-full object-cover" alt="Background preview" />
                                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                                        <p className="text-[0.6vw] font-semibold text-white">Change Image</p>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex flex-col items-center pointer-events-none">
                                                                                    <Upload size="1.2vw" className="text-gray-400 group-hover:text-[#4A3AFF] transition-colors" />
                                                                                    <p className="text-[0.6vw] font-medium text-gray-500 mt-[0.3vw]">Drag & Drop or <span className="text-[#4A3AFF]">Upload</span></p>
                                                                                    <p className="text-[0.5vw] text-gray-400 mt-[0.1vw]">Supported File Format : JPG, PNG</p>
                                                                                </div>
                                                                            )}
                                                                        </label>

                                                                        <div className="flex items-center gap-[0.8vw] px-[0.2vw] mt-[0.2vw]">
                                                                            <span className="text-[0.75vw] font-semibold text-gray-700 w-[4.5vw] shrink-0">Opacity :</span>
                                                                            <div className="flex-1 flex items-center gap-[0.8vw]">
                                                                                <input
                                                                                    type="range"
                                                                                    min="0"
                                                                                    max="100"
                                                                                    value={qrBgOpacity}
                                                                                    onChange={(e) => setQrBgOpacity(e.target.value)}
                                                                                    className="flex-1 h-[0.25vw] bg-gray-200 rounded-full appearance-none cursor-pointer accent-[#4A3AFF] hover:accent-[#3b2fd9] transition-all"
                                                                                />
                                                                                <span className="text-[0.75vw] font-bold text-gray-500 w-[2.5vw] text-right">{qrBgOpacity}%</span>
                                                                            </div>
                                                                        </div>
                                                                    </>
                                                                )}

                                                                {qrBgType === 'Color' && (
                                                                    <div className="flex items-center gap-[0.6vw] mt-[0.2vw] relative">
                                                                        <button
                                                                            onClick={() => {
                                                                                setShowCustomBgColorPicker(!showCustomBgColorPicker);
                                                                                setShowQrColorPicker(false);
                                                                                setShowQrBgColorPicker(false);
                                                                            }}
                                                                            className="w-[1.8vw] h-[1.6vw] rounded-[0.3vw] border border-gray-400 shadow-sm shrink-0 cursor-pointer transition-all hover:scale-105 active:scale-95 outline-none animate-in fade-in duration-200"
                                                                            style={{ background: customBgColor }}
                                                                        />
                                                                        <div className="flex-1 flex items-center border border-gray-300 rounded-[0.4vw] bg-white overflow-hidden shadow-sm">
                                                                            <input
                                                                                type="text"
                                                                                value={customBgColor}
                                                                                onChange={(e) => setCustomBgColor(e.target.value)}
                                                                                onClick={() => {
                                                                                    setShowCustomBgColorPicker(true);
                                                                                    setShowQrColorPicker(false);
                                                                                    setShowQrBgColorPicker(false);
                                                                                }}
                                                                                className="flex-1 px-[0.6vw] py-[0.3vw] text-[0.75vw] font-bold text-gray-700 uppercase outline-none cursor-pointer font-mono"
                                                                            />
                                                                            <span className="px-[0.6vw] text-[0.75vw] font-semibold text-gray-400 border-l border-gray-100">100%</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Floating Color Pickers (Rendered at Right Column level to prevent overflow clipping) */}
                                    {showQrColorPicker && (
                                        <>
                                            <div className="fixed inset-0 z-[990] cursor-default" onClick={() => setShowQrColorPicker(false)} />
                                            <div className="absolute left-[-4vw] top-[2.2vw] z-[999] animate-in fade-in zoom-in-95 duration-200">
                                                <ColorPicker
                                                    color={qrColor}
                                                    onChange={(hex) => setQrColor(hex)}
                                                    opacity={100}
                                                    onClose={() => setShowQrColorPicker(false)}
                                                />
                                            </div>
                                        </>
                                    )}
                                    {showQrBgColorPicker && (
                                        <>
                                            <div className="fixed inset-0 z-[990] cursor-default" onClick={() => setShowQrBgColorPicker(false)} />
                                            <div className="absolute left-[-4vw] top-[4.8vw] z-[999] animate-in fade-in zoom-in-95 duration-200">
                                                <ColorPicker
                                                    color={qrBgColor === 'transparent' ? '#ffffff' : qrBgColor}
                                                    onChange={(hex) => setQrBgColor(hex)}
                                                    opacity={100}
                                                    onClose={() => setShowQrBgColorPicker(false)}
                                                />
                                            </div>
                                        </>
                                    )}
                                    {showCustomBgColorPicker && (
                                        <>
                                            <div className="fixed inset-0 z-[990] cursor-default" onClick={() => setShowCustomBgColorPicker(false)} />
                                            <div className="absolute left-[calc(100%+1.5vw)] top-[0vw] z-[999] animate-in fade-in zoom-in-95 duration-200">
                                                <TemplateColorPicker
                                                    color={customBgColor}
                                                    onChange={(val) => setCustomBgColor(val)}
                                                    opacity={qrBgOpacity}
                                                    onOpacityChange={(op) => setQrBgOpacity(op)}
                                                    onClose={() => setShowCustomBgColorPicker(false)}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Footer Buttons */}
                                <div className="flex items-center gap-[0.6vw] mt-auto shrink-0">
                                    <button
                                        onClick={handleCancelEditor}
                                        className="flex-1 py-[0.7vw] rounded-[0.5vw] border border-gray-200 text-gray-700 font-bold text-[0.8vw] hover:bg-gray-50 transition-all cursor-pointer flex items-center justify-center gap-[0.4vw] shadow-sm whitespace-nowrap"
                                    >
                                        <X size="0.9vw" className="text-gray-500" /> Cancel
                                    </button>

                                    <div className="flex-1 relative">
                                        <div className="flex items-center bg-white border border-gray-200 rounded-[0.5vw] shadow-sm hover:border-gray-300 transition-all group overflow-hidden h-full">
                                            <button
                                                onClick={downloadQRCode}
                                                disabled={isDownloading}
                                                className={`flex-1 py-[0.7vw] px-[0.5vw] font-bold text-[0.8vw] flex items-center justify-center gap-[0.5vw] whitespace-nowrap transition-colors ${isDownloading
                                                        ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                                        : 'text-gray-700 cursor-pointer hover:bg-gray-50'
                                                    }`}
                                            >
                                                {isDownloading ? (
                                                    <Icon icon="lucide:loader-2" className="animate-spin text-[#4A3AFF] w-[0.9vw] h-[0.9vw] shrink-0" />
                                                ) : (
                                                    <Download size="0.9vw" className="text-gray-400 shrink-0" />
                                                )}
                                                <span className="truncate">
                                                    {isDownloading ? 'Generating...' : `Export as ${exportFormat}`}
                                                </span>
                                            </button>
                                            <div className="w-[1px] h-[1vw] bg-gray-200 shrink-0" />
                                            <button
                                                onClick={() => !isDownloading && setShowExportDropdown(!showExportDropdown)}
                                                disabled={isDownloading}
                                                className={`px-[0.6vw] py-[0.7vw] transition-all shrink-0 ${isDownloading
                                                        ? 'bg-gray-50 cursor-not-allowed opacity-50'
                                                        : showExportDropdown ? 'bg-gray-100 cursor-pointer' : 'hover:bg-gray-50 cursor-pointer'
                                                    }`}
                                            >
                                                <ChevronRight size="0.9vw" className={`${showExportDropdown ? '-rotate-90' : 'rotate-90'} text-gray-400 transition-transform duration-200`} />
                                            </button>
                                        </div>

                                        {/* Dropdown Menu */}
                                        {showExportDropdown && (
                                            <>
                                                <div className="fixed inset-0 z-40 cursor-default" onClick={() => setShowExportDropdown(false)} />
                                                <div className="absolute bottom-[calc(100%+0.5vw)] right-0 w-full bg-white border border-gray-100 rounded-[0.6vw] shadow-xl z-50 py-[0.4vw] animate-in fade-in slide-in-from-bottom-2 duration-200">
                                                    {['JPG', 'PNG', 'WebP'].map((format) => (
                                                        <button
                                                            key={format}
                                                            onClick={() => {
                                                                setExportFormat(format);
                                                                setShowExportDropdown(false);
                                                            }}
                                                            className={`w-full text-left px-[1vw] py-[0.6vw] text-[0.75vw] font-bold transition-all hover:bg-gray-50 flex items-center justify-between cursor-pointer ${exportFormat === format ? 'text-[#4A3AFF]' : 'text-gray-600'}`}
                                                        >
                                                            {format}
                                                            {exportFormat === format && <Check size="0.8vw" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleSaveEditor}
                                        className="flex-1 py-[0.7vw] rounded-[0.5vw] bg-black text-white font-bold text-[0.8vw] hover:bg-gray-800 transition-all cursor-pointer shadow-md flex items-center justify-center gap-[0.5vw] whitespace-nowrap"
                                    >
                                        <Check size="1vw" /> Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Hidden Template for Main View Export */}
                    {!isEditingQR && (
                        <div className="absolute top-[-9999px] left-[-9999px] opacity-0 pointer-events-none -z-50 w-[20vw] flex-[0.75] flex flex-col min-w-0">
                            <div
                                ref={hiddenPosterRef}
                                id="hidden-poster-preview-container"
                                className="relative w-full h-[25vw] rounded-[1vw] border-[0.1vw] border-[#A5D6A7] p-[1.5vw] flex flex-col items-center shadow-sm overflow-hidden bg-white"
                            >
                                {/* Color Background Layer (Bottom) */}
                                <div
                                    className="absolute inset-0 pointer-events-none transition-all duration-300 z-0"
                                    style={{
                                        backgroundColor: !customBgColor.includes('gradient') ? customBgColor : 'transparent',
                                        backgroundImage: customBgColor.includes('gradient') ? customBgColor : 'none',
                                    }}
                                />

                                {/* Image Background Layer (Top - rendered with dynamic opacity over the color layer) */}
                                {qrBgType === 'Image' && qrBgImage && (
                                    <img
                                        src={qrBgImage.startsWith('data:') ? qrBgImage : `${qrBgImage}${qrBgImage.includes('?') ? '&' : '?'}cors=1`}
                                        crossOrigin="anonymous"
                                        className="absolute inset-0 pointer-events-none transition-all duration-300 z-[1]"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: qrBgFit === 'Fit' ? 'contain' : qrBgFit === 'Fill' ? 'cover' : 'fill',
                                            opacity: qrBgOpacity / 100,
                                        }}
                                    />
                                )}

                                {/* Top Text */}
                                <div className="text-center mb-[2vw] shrink-0 relative z-10 w-full max-w-full px-[0.5vw]">
                                    <h3
                                        ref={hiddenText1Ref}
                                        data-export-id="poster-text1"
                                        className="text-center font-black break-words w-full"
                                        style={{
                                            fontFamily: text1FontFamily,
                                            fontSize: typeof text1FontSize === 'number' ? `${text1FontSize / 15}vw` : '1.6vw',
                                            fontWeight: text1Bold ? (text1FontWeight === 'Regular' ? '400' : text1FontWeight === 'Medium' ? '500' : text1FontWeight === 'Semi Bold' ? '600' : text1FontWeight === 'Bold' ? '700' : '900') : '400',
                                            letterSpacing: text1LetterSpacing === 'Auto' ? 'normal' : `${text1LetterSpacing / 10}em`,
                                            lineHeight: text1LineHeight === 'Auto' ? '1.1' : String(text1LineHeight),
                                            textAlign: text1Align,
                                            color: text1Color,
                                            opacity: text1ColorOpacity / 100,
                                            fontStyle: text1Italic ? 'italic' : 'normal',
                                            textDecoration: [
                                                text1Underline ? 'underline' : '',
                                                text1Linethrough ? 'line-through' : ''
                                            ].filter(Boolean).join(' ') || 'none',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        {text1}
                                    </h3>
                                </div>

                                {/* QR Code Area */}
                                <div className="flex-1 flex flex-col items-center justify-start w-full relative min-h-0 z-10">
                                    <span
                                        ref={hiddenText2Ref}
                                        data-export-id="poster-text2"
                                        className="mb-[1.5vw] uppercase text-center font-bold block w-full max-w-full px-[0.5vw]"
                                        style={{
                                            fontFamily: text2FontFamily,
                                            fontSize: typeof text2FontSize === 'number' ? `${text2FontSize / 15}vw` : '0.7vw',
                                            fontWeight: text2Bold ? (text2FontWeight === 'Regular' ? '400' : text2FontWeight === 'Medium' ? '500' : text2FontWeight === 'Semi Bold' ? '600' : text2FontWeight === 'Bold' ? '700' : '900') : '400',
                                            letterSpacing: text2LetterSpacing === 'Auto' ? '0.2em' : `${text2LetterSpacing / 10}em`,
                                            lineHeight: text2LineHeight === 'Auto' ? 'normal' : String(text2LineHeight),
                                            textAlign: text2Align,
                                            color: text2Color,
                                            opacity: text2ColorOpacity / 100,
                                            fontStyle: text2Italic ? 'italic' : 'normal',
                                            textDecoration: [
                                                text2Underline ? 'underline' : '',
                                                text2Linethrough ? 'line-through' : ''
                                            ].filter(Boolean).join(' ') || 'none',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                        }}
                                    >
                                        {text2}
                                    </span>

                                    <div ref={hiddenQrWrapRef} data-export-id="poster-qr-wrap" className="relative p-[1.2vw] shrink-0">
                                        {/* Decorative Corners */}
                                        <div className="absolute top-0 left-0 w-[1.5vw] h-[1.5vw] border-t-[3px] border-l-[3px] rounded-tl-[0.8vw]" style={{ borderColor: qrColor }} />
                                        <div className="absolute top-0 right-0 w-[1.5vw] h-[1.5vw] border-t-[3px] border-r-[3px] rounded-tr-[0.8vw]" style={{ borderColor: qrColor }} />
                                        <div className="absolute bottom-0 left-0 w-[1.5vw] h-[1.5vw] border-b-[3px] border-l-[3px] rounded-bl-[0.8vw]" style={{ borderColor: qrColor }} />
                                        <div className="absolute bottom-0 right-0 w-[1.5vw] h-[1.5vw] border-b-[3px] border-r-[3px] rounded-br-[0.8vw]" style={{ borderColor: qrColor }} />

                                        {/* The QR Code - Styled to match image (no background box) */}
                                        <div className="flex items-center justify-center relative">
                                            <CustomQRCode
                                                value={publicUrl}
                                                size={300}
                                                fgColor={qrColor}
                                                bgColor={qrBgColor === '#ffffff' ? 'transparent' : qrBgColor}
                                                dotType={qrDotType}
                                                cornerSquareType={qrCornerSquareType}
                                                cornerDotType={qrCornerDotType}
                                                level={qrLevel}
                                                logo={qrLogo}
                                                style={{ width: '10vw', height: '10vw' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Typography Editor Popup floating on the right */}
                {activeTextEditor && (() => {
                    const isT1 = activeTextEditor === 'text1';
                    const fontFamily = isT1 ? text1FontFamily : text2FontFamily;
                    const setFontFamily = isT1 ? setText1FontFamily : setText2FontFamily;
                    const fontSize = isT1 ? text1FontSize : text2FontSize;
                    const setFontSize = isT1 ? setText1FontSize : setText2FontSize;
                    const fontWeight = isT1 ? text1FontWeight : text2FontWeight;
                    const setFontWeight = isT1 ? setText1FontWeight : setText2FontWeight;
                    const letterSpacing = isT1 ? text1LetterSpacing : text2LetterSpacing;
                    const setLetterSpacing = isT1 ? setText1LetterSpacing : setText2LetterSpacing;
                    const lineHeight = isT1 ? text1LineHeight : text2LineHeight;
                    const setLineHeight = isT1 ? setText1LineHeight : setText2LineHeight;
                    const align = isT1 ? text1Align : text2Align;
                    const setAlign = isT1 ? setText1Align : setText2Align;
                    const bold = isT1 ? text1Bold : text2Bold;
                    const setBold = isT1 ? setText1Bold : setText2Bold;
                    const italic = isT1 ? text1Italic : text2Italic;
                    const setItalic = isT1 ? setText1Italic : setText2Italic;
                    const underline = isT1 ? text1Underline : text2Underline;
                    const setUnderline = isT1 ? setText1Underline : setText2Underline;
                    const linethrough = isT1 ? text1Linethrough : text2Linethrough;
                    const setLinethrough = isT1 ? setText1Linethrough : setText2Linethrough;
                    const color = isT1 ? text1Color : text2Color;
                    const setColor = isT1 ? setText1Color : setText2Color;
                    const opacity = isT1 ? text1ColorOpacity : text2ColorOpacity;
                    const setOpacity = isT1 ? setText1ColorOpacity : setText2ColorOpacity;

                    const fontFamilies = ['Poppins', 'Inter', 'Roboto', 'Outfit', 'Montserrat', 'Playfair Display'];
                    const fontSizes = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 64];
                    const fontWeights = ['Regular', 'Medium', 'Semi Bold', 'Bold', 'Black'];

                    return (
                        <div className="absolute top-[1.2vw] left-[calc(100%+1vw)] z-[70] w-[21vw] bg-white border border-gray-200 rounded-[1.2vw] shadow-2xl p-[1.2vw] animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-[1vw]">
                            <style dangerouslySetInnerHTML={{
                                __html: `
                                .typography-color-picker > div:first-child > div:first-child > *:first-child {
                                    display: none !important;
                                }
                                .typography-color-picker > div:first-child > div:first-child::before {
                                    content: "Text Color";
                                    font-size: 0.85vw;
                                    font-weight: 600;
                                    color: #111827;
                                    font-family: inherit;
                                }
                            ` }} />
                            {/* Typography Header */}
                            <div className="flex items-center justify-between gap-[0.5vw]">
                                <span className="font-bold text-[0.85vw] text-gray-900 shrink-0">Typography</span>
                                <div className="flex-1 h-[1px] bg-gray-200" />
                                <button
                                    onClick={() => {
                                        setActiveTextEditor(null);
                                        setShowFontFamilyDropdown(false);
                                        setShowFontSizeDropdown(false);
                                        setShowFontWeightDropdown(false);
                                        setShowLetterSpacingSlider(false);
                                        setShowLineHeightSlider(false);
                                    }}
                                    className="p-[0.2vw] rounded-full hover:bg-gray-100 transition-colors text-red-500 cursor-pointer"
                                >
                                    <X size="0.9vw" />
                                </button>
                            </div>

                            {/* Row 1: Font Family & Size */}
                            <div className="flex items-center gap-[0.6vw] relative">
                                {/* Font Family Selector */}
                                <div className="relative flex-1">
                                    <button
                                        onClick={() => {
                                            setShowFontFamilyDropdown(!showFontFamilyDropdown);
                                            setShowFontSizeDropdown(false);
                                            setShowFontWeightDropdown(false);
                                            setShowLetterSpacingSlider(false);
                                            setShowLineHeightSlider(false);
                                        }}
                                        className="w-full h-[2.2vw] flex items-center justify-between px-[0.8vw] bg-white border border-gray-300 rounded-[0.6vw] text-[0.75vw] font-medium text-gray-700 hover:border-gray-400 transition-all cursor-pointer"
                                    >
                                        <span className="truncate" style={{ fontFamily: fontFamily }}>{fontFamily}</span>
                                        <ChevronDown size="0.8vw" className="text-gray-400 shrink-0" />
                                    </button>
                                    {showFontFamilyDropdown && (
                                        <div className="absolute left-0 right-0 top-[2.4vw] z-[80] bg-white border border-gray-200 rounded-[0.6vw] shadow-xl max-h-[10vw] overflow-y-auto custom-scrollbar">
                                            {fontFamilies.map((font) => (
                                                <button
                                                    key={font}
                                                    type="button"
                                                    onClick={() => {
                                                        setFontFamily(font);
                                                        setShowFontFamilyDropdown(false);
                                                    }}
                                                    className="w-full text-left px-[0.8vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                                                    style={{ fontFamily: font }}
                                                >
                                                    {font}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="relative w-[5.5vw]">
                                    <button
                                        onClick={() => {
                                            setShowFontSizeDropdown(!showFontSizeDropdown);
                                            setShowFontFamilyDropdown(false);
                                            setShowFontWeightDropdown(false);
                                            setShowLetterSpacingSlider(false);
                                            setShowLineHeightSlider(false);
                                        }}
                                        className="w-full h-[2.2vw] flex items-center justify-between px-[0.8vw] bg-white border border-gray-300 rounded-[0.6vw] text-[0.75vw] font-medium text-gray-700 hover:border-gray-400 transition-all cursor-pointer"
                                    >
                                        <span>{fontSize}</span>
                                        <ChevronDown size="0.8vw" className="text-gray-400 shrink-0" />
                                    </button>
                                    {showFontSizeDropdown && (
                                        <div className="absolute left-0 right-0 top-[2.4vw] z-[80] bg-white border border-gray-200 rounded-[0.6vw] shadow-xl max-h-[10vw] overflow-y-auto custom-scrollbar">
                                            {fontSizes.map((size) => (
                                                <button
                                                    key={size}
                                                    type="button"
                                                    onClick={() => {
                                                        setFontSize(size);
                                                        setShowFontSizeDropdown(false);
                                                    }}
                                                    className="w-full text-left px-[0.8vw] py-[0.4vw] text-[0.75vw] font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Row 2: Weight, Character Spacing, Line Height */}
                            <div className="flex items-center gap-[0.6vw] relative">
                                {/* Font Weight */}
                                <div className="relative flex-1">
                                    <button
                                        onClick={() => {
                                            setShowFontWeightDropdown(!showFontWeightDropdown);
                                            setShowFontFamilyDropdown(false);
                                            setShowFontSizeDropdown(false);
                                            setShowLetterSpacingSlider(false);
                                            setShowLineHeightSlider(false);
                                        }}
                                        className="w-full h-[2.2vw] flex items-center justify-between px-[0.8vw] bg-white border border-gray-300 rounded-[0.6vw] text-[0.75vw] font-medium text-gray-700 hover:border-gray-400 transition-all cursor-pointer"
                                    >
                                        <span>{fontWeight}</span>
                                        <ChevronDown size="0.8vw" className="text-gray-400 shrink-0" />
                                    </button>
                                    {showFontWeightDropdown && (
                                        <div className="absolute left-0 right-0 top-[2.4vw] z-[80] bg-white border border-gray-200 rounded-[0.6vw] shadow-xl max-h-[10vw] overflow-y-auto custom-scrollbar">
                                            {fontWeights.map((w) => (
                                                <button
                                                    key={w}
                                                    type="button"
                                                    onClick={() => {
                                                        setFontWeight(w);
                                                        setShowFontWeightDropdown(false);
                                                    }}
                                                    className="w-full text-left px-[0.8vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                                                >
                                                    {w}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Character Spacing */}
                                <div className="relative w-[5.5vw]">
                                    <div className="relative w-full h-[2.2vw] border border-gray-300 rounded-[0.6vw] bg-white flex items-center px-[0.6vw] hover:border-gray-400 transition-all group">
                                        <input
                                            type="text"
                                            value={letterSpacing === 'Auto' ? (isT1 ? 0 : 2) : letterSpacing}
                                            onChange={(e) => setLetterSpacing(e.target.value)}
                                            onFocus={(e) => e.target.select()}
                                            onBlur={() => {
                                                if (letterSpacing === 'Auto' || letterSpacing === '') {
                                                    setLetterSpacing('Auto');
                                                } else {
                                                    const parsed = parseInt(letterSpacing);
                                                    setLetterSpacing(isNaN(parsed) ? 'Auto' : parsed);
                                                }
                                            }}
                                            className="w-full text-center text-[0.7vw] font-semibold text-gray-700 outline-none bg-transparent"
                                        />
                                        <div
                                            onMouseDown={(e) => {
                                                if (e.button !== 0) return;

                                                // Lock global double arrow cursor and prevent text selection during scrubbing drag
                                                document.body.style.cursor = 'ew-resize';
                                                document.body.style.userSelect = 'none';

                                                const startX = e.clientX;
                                                const startVal = letterSpacing === 'Auto' ? (isT1 ? 0 : 2) : parseFloat(letterSpacing);

                                                const handleMouseMove = (moveEvent) => {
                                                    const deltaX = moveEvent.clientX - startX;
                                                    const change = Math.round(deltaX / 8);
                                                    const newVal = Math.min(40, Math.max(isT1 ? -5 : 0, startVal + change));
                                                    setLetterSpacing(newVal);
                                                };

                                                const handleMouseUp = () => {
                                                    window.removeEventListener('mousemove', handleMouseMove);
                                                    window.removeEventListener('mouseup', handleMouseUp);

                                                    // Reset global styles
                                                    document.body.style.cursor = '';
                                                    document.body.style.userSelect = '';
                                                };

                                                window.addEventListener('mousemove', handleMouseMove);
                                                window.addEventListener('mouseup', handleMouseUp);
                                            }}
                                            className="cursor-ew-resize p-[0.1vw] hover:bg-gray-100 rounded-[0.2vw] flex items-center justify-center shrink-0"
                                            title="Drag to adjust character spacing"
                                        >
                                            <Icon icon="solar:paragraph-spacing-linear" width="1.2vw" height="1.2vw" rotate={1} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                                        </div>
                                    </div>
                                </div>

                                {/* Line Height */}
                                <div className="relative w-[5.5vw]">
                                    <div className="relative w-full h-[2.2vw] border border-gray-300 rounded-[0.6vw] bg-white flex items-center px-[0.6vw] hover:border-gray-400 transition-all group">
                                        <input
                                            type="text"
                                            value={lineHeight === 'Auto' ? (isT1 ? 1.1 : 1.2) : lineHeight}
                                            onChange={(e) => setLineHeight(e.target.value)}
                                            onFocus={(e) => e.target.select()}
                                            onBlur={() => {
                                                if (lineHeight === 'Auto' || lineHeight === '') {
                                                    setLineHeight('Auto');
                                                } else {
                                                    const parsed = parseFloat(lineHeight);
                                                    setLineHeight(isNaN(parsed) ? 'Auto' : parseFloat(parsed.toFixed(1)));
                                                }
                                            }}
                                            className="w-full text-center text-[0.7vw] font-semibold text-gray-700 outline-none bg-transparent"
                                        />
                                        <div
                                            onMouseDown={(e) => {
                                                if (e.button !== 0) return;

                                                // Lock global double arrow cursor and prevent text selection during scrubbing drag
                                                document.body.style.cursor = 'ew-resize';
                                                document.body.style.userSelect = 'none';

                                                const startX = e.clientX;
                                                const startVal = lineHeight === 'Auto' ? (isT1 ? 1.1 : 1.2) : parseFloat(lineHeight);

                                                const handleMouseMove = (moveEvent) => {
                                                    const deltaX = moveEvent.clientX - startX;
                                                    const change = deltaX / 100;
                                                    const newVal = parseFloat(Math.min(3.0, Math.max(0.5, startVal + change)).toFixed(1));
                                                    setLineHeight(newVal);
                                                };

                                                const handleMouseUp = () => {
                                                    window.removeEventListener('mousemove', handleMouseMove);
                                                    window.removeEventListener('mouseup', handleMouseUp);

                                                    // Reset global styles
                                                    document.body.style.cursor = '';
                                                    document.body.style.userSelect = '';
                                                };

                                                window.addEventListener('mousemove', handleMouseMove);
                                                window.addEventListener('mouseup', handleMouseUp);
                                            }}
                                            className="cursor-ew-resize p-[0.1vw] hover:bg-gray-100 rounded-[0.2vw] flex items-center justify-center shrink-0"
                                            title="Drag to adjust line height"
                                        >
                                            <Icon icon="solar:paragraph-spacing-linear" width="1.2vw" height="1.2vw" className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Row 3: Align, Underline/Italic */}
                            <div className="flex items-center gap-[0.5vw]">
                                <button
                                    onClick={() => setAlign('left')}
                                    className={`w-[2.2vw] h-[2.2vw] flex items-center justify-center rounded-[0.5vw] transition-all cursor-pointer shadow-sm ${align === 'left' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    <Icon icon="lucide:align-left" className="w-[1vw] h-[1vw]" />
                                </button>

                                <button
                                    onClick={() => setAlign('center')}
                                    className={`w-[2.2vw] h-[2.2vw] flex items-center justify-center rounded-[0.5vw] transition-all cursor-pointer shadow-sm ${align === 'center' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    <Icon icon="lucide:align-center" className="w-[1vw] h-[1vw]" />
                                </button>

                                <button
                                    onClick={() => setAlign('right')}
                                    className={`w-[2.2vw] h-[2.2vw] flex items-center justify-center rounded-[0.5vw] transition-all cursor-pointer shadow-sm ${align === 'right' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    <Icon icon="lucide:align-right" className="w-[1vw] h-[1vw]" />
                                </button>

                                <button
                                    onClick={() => setAlign('justify')}
                                    className={`w-[2.2vw] h-[2.2vw] flex items-center justify-center rounded-[0.5vw] transition-all cursor-pointer shadow-sm ${align === 'justify' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    <Icon icon="lucide:align-justify" className="w-[1vw] h-[1vw]" />
                                </button>

                                <div className="w-[1px] h-[1.2vw] bg-gray-200 mx-[0.2vw]" />

                                <button
                                    onClick={() => setUnderline(!underline)}
                                    className={`w-[2.2vw] h-[2.2vw] flex items-center justify-center rounded-[0.5vw] transition-all cursor-pointer shadow-sm ${underline ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                    title="Underline"
                                >
                                    <span className="font-semibold underline text-[0.85vw] leading-none">U</span>
                                </button>

                                <button
                                    onClick={() => setItalic(!italic)}
                                    className={`w-[2.2vw] h-[2.2vw] flex items-center justify-center rounded-[0.5vw] transition-all cursor-pointer shadow-sm ${italic ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                    title="Italic"
                                >
                                    <span className="font-semibold italic text-[0.85vw] leading-none">I</span>
                                </button>

                                <button
                                    onClick={() => setLinethrough(!linethrough)}
                                    className={`w-[2.2vw] h-[2.2vw] flex items-center justify-center rounded-[0.5vw] transition-all cursor-pointer shadow-sm ${linethrough ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                    title="Strikethrough"
                                >
                                    <span className="font-semibold line-through text-[0.85vw] leading-none">S</span>
                                </button>
                            </div>

                            {/* Text Color Section */}
                            <div className="flex flex-col gap-[0.8vw]">
                                <div className="flex items-center gap-[0.5vw]">
                                    <span className="font-bold text-[0.8vw] text-gray-900 shrink-0">Text Color</span>
                                    <div className="flex-1 h-[1px] bg-gray-200" />
                                </div>

                                <div className="flex items-center gap-[0.6vw]">
                                    <span className="text-[0.75vw] font-bold text-gray-600 min-w-[2vw]">Fill :</span>

                                    <div className="relative">
                                        <div
                                            onClick={() => setShowColorPicker(!showColorPicker)}
                                            className="w-[2vw] h-[2vw] rounded-[0.4vw] border border-gray-300 shadow-sm cursor-pointer hover:scale-105 transition-all"
                                            style={{ backgroundColor: color }}
                                        />
                                        {showColorPicker && (
                                            <>
                                                <div className="fixed inset-0 z-[80]" onClick={() => setShowColorPicker(false)} />
                                                <ColorPicker
                                                    color={color}
                                                    onChange={(newCol) => setColor(newCol)}
                                                    opacity={opacity}
                                                    onOpacityChange={(newOp) => setOpacity(newOp)}
                                                    onClose={() => setShowColorPicker(false)}
                                                    className="absolute right-[calc(100%+0.8vw)] top-1/2 -translate-y-1/2 z-[90] typography-color-picker"
                                                />
                                            </>
                                        )}
                                    </div>

                                    <div className="w-[10.5vw] flex items-center border border-gray-300 rounded-[0.6vw] bg-white overflow-hidden shadow-sm h-[2.2vw] px-[0.6vw]">
                                        <input
                                            type="text"
                                            value={color}
                                            onChange={(e) => setColor(e.target.value)}
                                            className="w-[4vw] text-[0.75vw] font-bold text-gray-700 uppercase outline-none bg-transparent"
                                            maxLength={7}
                                        />
                                        <div className="flex-1 flex items-center justify-end gap-[0.1vw] border-l border-gray-200 pl-[0.5vw] ml-[0.5vw] shrink-0">
                                            <input
                                                type="number"
                                                value={opacity}
                                                onChange={(e) => setOpacity(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                                className="w-[1.8vw] text-center text-[0.75vw] font-bold text-gray-700 outline-none bg-transparent no-spin"
                                            />
                                            <span className="text-[0.75vw] font-bold text-gray-400 shrink-0 select-none">%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
};

export default ShareModal;
