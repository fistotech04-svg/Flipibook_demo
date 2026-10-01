import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { ChevronLeft, ChevronRight, X, Play, Pause } from 'lucide-react';

const GalleryPopup = ({ onClose, settings }) => {
    const gallerySettings = settings?.gallery || settings || {};
    const images = gallerySettings.images || [];
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(gallerySettings.autoPlay ?? true);
    const [progress, setProgress] = useState(0);
    const progressIntervalRef = useRef(null);

    // Reset when images change
    useEffect(() => {
        setCurrentIndex(0);
        setProgress(0);
    }, [images]);

    const handleNext = () => {
        setCurrentIndex(prev => {
            if (prev < images.length - 1) return prev + 1;
            if (gallerySettings.infiniteLoop) return 0;
            setIsPlaying(false);
            return prev;
        });
        setProgress(0);
    };

    const handlePrev = () => {
        setCurrentIndex(prev => {
            if (prev > 0) return prev - 1;
            if (gallerySettings.infiniteLoop) return images.length - 1;
            return prev;
        });
        setProgress(0);
    };

    // Progress bar & Auto-play logic
    useEffect(() => {
        if (isPlaying && images.length > 1) {
            const speed = (gallerySettings.speed || 2) * 1000;
            const updateInterval = 50; // Update every 50ms for smoothness
            const step = 100 / (speed / updateInterval);

            progressIntervalRef.current = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        handleNext();
                        return 0;
                    }
                    return prev + step;
                });
            }, updateInterval);
        } else {
            clearInterval(progressIntervalRef.current);
        }
        return () => clearInterval(progressIntervalRef.current);
    }, [isPlaying, currentIndex, images.length, gallerySettings.speed, gallerySettings.infiniteLoop]);

    if (!images || images.length === 0) return null;

    const objectFit = gallerySettings.imageFitType === 'Fit All' ? 'contain' : 'cover';

    return (
        <div className="absolute inset-0 z-[100] bg-black/40 backdrop-blur-md flex items-center justify-center p-[2vw] animate-in fade-in duration-300" onClick={onClose}>
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-[2vw] right-[2vw] w-[3vw] h-[3vw] flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-[110] backdrop-blur-md border border-white/20"
            >
                <X size="1.5vw" />
            </button>

            <div
                className="relative w-full max-w-[90vw] flex flex-col items-center gap-[3vw]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Main Carousel Container */}
                <div className="relative w-full flex items-center justify-center h-[55vh] overflow-visible">

                    {/* Navigation Arrows */}
                    <button
                        onClick={handlePrev}
                        className="absolute left-[1vw] z-50 p-[1vw] text-white/40 hover:text-white transition-all bg-black/10 hover:bg-black/20 rounded-full backdrop-blur-sm"
                    >
                        <ChevronLeft size="2.5vw" strokeWidth={1.5} />
                    </button>

                    <button
                        onClick={handleNext}
                        className="absolute right-[1vw] z-50 p-[1vw] text-white/40 hover:text-white transition-all bg-black/10 hover:bg-black/20 rounded-full backdrop-blur-sm"
                    >
                        <ChevronRight size="2.5vw" strokeWidth={1.5} />
                    </button>

                    {/* 3D Carousel Implementation */}
                    <div className="relative w-full h-full flex items-center justify-center">
                        {images.map((img, index) => {
                            const isCurrent = index === currentIndex;
                            const isPrev = index === (currentIndex - 1 + images.length) % images.length;
                            const isNext = index === (currentIndex + 1) % images.length;

                            const isVisible = isCurrent || (images.length > 1 && (isPrev || isNext));
                            if (!isVisible) return null;

                            let transformStyle = "";
                            let opacity = 0;
                            let zIndex = 0;
                            let blur = "blur(0px)";

                            if (isCurrent) {
                                transformStyle = "translateX(0) scale(1) translateZ(0)";
                                opacity = 1;
                                zIndex = 30;
                            } else if (isPrev) {
                                transformStyle = "translateX(-28%) scale(0.8) rotateY(15deg)";
                                opacity = 0.5;
                                zIndex = 20;
                                blur = "blur(2px)";
                            } else if (isNext) {
                                transformStyle = "translateX(28%) scale(0.8) rotateY(-15deg)";
                                opacity = 0.5;
                                zIndex = 20;
                                blur = "blur(2px)";
                            }

                            return (
                                <div
                                    key={index}
                                    className="absolute transition-all duration-700 ease-[cubic-bezier(0.4, 0, 0.2, 1)] cursor-pointer select-none"
                                    style={{
                                        transform: transformStyle,
                                        opacity,
                                        zIndex,
                                        width: '45vw',
                                        height: '50vh',
                                        filter: blur,
                                        perspective: '1000px'
                                    }}
                                    onClick={() => !isCurrent && setCurrentIndex(index)}
                                >
                                    <div className={`w-full h-full rounded-[2vw] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-[1px] border-white/10`}>
                                        <img
                                            src={img.url}
                                            alt=""
                                            className="w-full h-full object-cover"
                                            style={{ objectFit }}
                                            draggable={false}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {images.length > 1 && (
                    <div className="flex items-center gap-[0.5vw]">
                        {images.map((_, index) => (
                            <div
                                key={index}
                                className={`w-[0.5vw] h-[0.5vw] rounded-full transition-all duration-300 ${index === currentIndex ? 'bg-indigo-500 scale-125' : 'bg-white/20'}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>

    );
};

export default GalleryPopup;
