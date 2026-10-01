import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const PdfProcessingLoader = ({ progress, onCancel }) => {
    if (!progress) return null;

    const {
        current = 0,
        total = 0,
        fileIndex = 0,
        totalFiles = (progress.totalFiles || progress.total || 1),
        pageCount = 0,
        message = '',
        fileName = '',
        stage = 'converting',
        percent: explicitPercent
    } = progress;

    const isPpt = fileName && (fileName.toLowerCase().endsWith('.ppt') || fileName.toLowerCase().endsWith('.pptx'));
    const isWord = fileName && (fileName.toLowerCase().endsWith('.doc') || fileName.toLowerCase().endsWith('.docx'));

    // Dynamic rotating sub-phase ticker so user sees active progress during multi-second conversions
    const [tickerIndex, setTickerIndex] = useState(0);
    const convertingPhases = isPpt ? [
        'Analyzing slide structures & shapes...',
        'Converting vector paths and typography...',
        'Rendering high-fidelity vector slides...',
        'Optimizing slide graphics for sharp zoom...',
        'Assembling flipbook slides, almost ready...'
    ] : isWord ? [
        'Reading document pages & margins...',
        'Converting layout & typography...',
        'Optimizing text paths for crisp zoom...',
        'Rendering vector page elements...',
        'Assembling flipbook pages, almost ready...'
    ] : [
        'Reading document structure & fonts...',
        'Outlining fonts into clean vector paths...',
        'Rendering razor-sharp vector graphics...',
        'Optimizing vector layers for smooth zoom...',
        'Finalizing vector pages, almost ready...'
    ];

    useEffect(() => {
        if (stage === 'done') return;
        const timer = setInterval(() => {
            setTickerIndex(prev => (prev + 1) % convertingPhases.length);
        }, 2600);
        return () => clearInterval(timer);
    }, [stage, convertingPhases.length]);

    // Fluid continuous progress value:
    // - Starts at 15% immediately on upload so user sees instant responsiveness
    // - Smoothly and continuously glides forward through 50% -> 75% -> 85% -> 92% -> 94.5%
    // - NEVER gets stuck at 78% or any static ceiling
    // - Advances to 95% -> 98% during saving, and 100% on done
    const [fluidPercent, setFluidPercent] = useState(() => {
        if (stage === 'done') return 100;
        if (stage === 'saving') return 88;
        return 15;
    });

    useEffect(() => {
        if (stage === 'done') {
            setFluidPercent(100);
            return;
        }

        if (explicitPercent !== undefined && explicitPercent !== null) {
            setFluidPercent(prev => Math.max(prev, Math.min(100, Math.round(explicitPercent))));
            return;
        }

        const interval = setInterval(() => {
            setFluidPercent(prev => {
                if (prev >= 98 && stage !== 'done') return prev;

                if (stage === 'saving') {
                    const targetCap = 98;
                    const remaining = targetCap - prev;
                    if (remaining <= 0.1) return targetCap;
                    const step = Math.max(0.25, remaining * 0.12);
                    return Math.min(targetCap, Math.round((prev + step) * 10) / 10);
                }

                // Stage is 'converting' or default
                if (totalFiles > 1) {
                    const effectiveIdx = Math.max(0, fileIndex);
                    const slice = 78 / totalFiles;
                    const sliceStart = 8 + (effectiveIdx * slice);
                    const sliceCap = sliceStart + (slice * 0.94);

                    if (prev < sliceStart) return Math.round(sliceStart);
                    if (prev < sliceCap) {
                        const remaining = sliceCap - prev;
                        const step = Math.max(0.12, remaining * 0.08);
                        return Math.min(sliceCap, Math.round((prev + step) * 10) / 10);
                    }
                    return prev;
                } else {
                    // Single file conversion: NEVER gets stuck at 78%!
                    // Continuous asymptotic glide from 15% towards 94.8%
                    let step;
                    if (prev < 45) {
                        step = 0.85; // Initial steady movement
                    } else if (prev < 70) {
                        step = 0.52; // Steady advance
                    } else if (prev < 85) {
                        step = 0.32; // Glides smoothly past 78% without stopping!
                    } else if (prev < 92) {
                        step = 0.16; // Continual progression
                    } else if (prev < 94.8) {
                        step = 0.06; // Persistent live creep (92% -> 93% -> 94% -> 94.8%)
                    } else {
                        return prev;
                    }
                    return Math.round((prev + step) * 10) / 10;
                }
            });
        }, 180);

        return () => clearInterval(interval);
    }, [stage, fileIndex, totalFiles, explicitPercent]);

    const displayPercent = Math.min(100, Math.max(1, Math.round(fluidPercent)));

    // Dynamic message based on progress stage & caller's custom message
    const getDynamicMessage = () => {
        if (stage === 'done' || displayPercent >= 100) return 'Opening flipbook...';
        if (stage === 'saving') return 'Saving pages & binding flipbook...';
        if (message) return message;
        if (totalFiles > 1) {
            return `Converting file ${fileIndex + 1} of ${totalFiles} (${fileName || 'document'})...`;
        }
        return `Converting ${fileName || 'document'}...`;
    };

    // Sub-info row calculation with live micro-phase
    const getSubInfo = () => {
        if (stage === 'done' || displayPercent >= 100) return 'Ready';
        if (stage === 'saving') return 'Binding flipbook pages...';

        const unit = isPpt ? 'slides' : 'pages';
        const phaseText = convertingPhases[tickerIndex] || 'Converting vector graphics...';

        if (totalFiles > 1) {
            return `${fileIndex + 1} of ${totalFiles} files • ${phaseText}`;
        }
        if (pageCount > 0) {
            return `${pageCount} ${unit} • ${phaseText}`;
        }
        if (total > 1) {
            return current > 0 ? `${current} of ${total} ${unit} • ${phaseText}` : `${total} ${unit} • ${phaseText}`;
        }
        return phaseText;
    };

    return (
        <AnimatePresence>
            <motion.div
                className="fixed top-[8vh] left-0 right-0 bottom-0 z-[9999] flex flex-col items-center justify-center bg-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
                <div className="flex flex-col items-center max-w-[24vw] w-full text-center">
                    {/* Indigo Spinner */}
                    <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mb-[1vw]"></div>

                    {/* File Name Badge */}
                    {fileName && (
                        <span className="text-[0.7vw] font-semibold text-indigo-600 bg-indigo-50 px-[0.8vw] py-[0.2vw] rounded-full max-w-[18vw] truncate mb-[0.6vw]">
                            {fileName}
                        </span>
                    )}

                    {/* Dynamic Message */}
                    <p className="text-[0.95vw] font-semibold text-gray-700 mb-[0.4vw]">
                        {getDynamicMessage()}
                    </p>

                    {/* Progress Bar with Active Shimmer */}
                    <div className="w-full mt-[0.6vw]">
                        <div className="w-full h-[0.45vw] bg-gray-100 rounded-full overflow-hidden relative">
                            <motion.div 
                                className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-500 rounded-full relative overflow-hidden"
                                animate={{ width: `${displayPercent}%` }}
                                transition={{ duration: 0.35, ease: 'easeOut' }}
                            >
                                {/* Active shimmering light wave across the bar */}
                                <motion.div
                                    className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/35 to-transparent"
                                    initial={{ x: '-100%' }}
                                    animate={{ x: '100%' }}
                                    transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                                />
                            </motion.div>
                        </div>

                        {/* Progress Info Row */}
                        <div className="flex items-center justify-between mt-[0.4vw]">
                            <div className="flex items-center text-[0.7vw] font-medium text-gray-500 max-w-[20vw] truncate">
                                <span className="truncate">{getSubInfo()}</span>
                            </div>
                            <span className="text-[0.75vw] font-bold text-indigo-600 flex-shrink-0 ml-[0.5vw]">
                                {displayPercent}%
                            </span>
                        </div>
                    </div>

                    {/* Cancel Button */}
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="mt-[1.4vw] px-[1.2vw] py-[0.45vw] text-[0.75vw] font-semibold text-gray-600 hover:text-red-600 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-[0.5vw] transition-all cursor-pointer flex items-center gap-[0.35vw] active:scale-95 shadow-sm"
                        >
                            <X size="0.85vw" />
                            <span>Cancel Upload</span>
                        </button>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PdfProcessingLoader;

