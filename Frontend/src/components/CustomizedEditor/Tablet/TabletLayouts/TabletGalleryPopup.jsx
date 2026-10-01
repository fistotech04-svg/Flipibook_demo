import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Play, Pause } from 'lucide-react';
import { NavIconRenderer } from '../../popups/NavIconStylesPopup';

const TRANSITION_DURATION = 450; // ms

/* ─── Main Component ─────────────────────────────────────────────────────────── */
const TabletGalleryPopup = ({ onClose, settings = {}, popupSettings = {} }) => {
  const gallerySettings = settings?.gallery || settings || {};
  const images = gallerySettings.images || [];
  const effectiveAutoPlay = gallerySettings.autoPlay ?? true;
  const speed = gallerySettings.speed || 3;
  const infiniteLoop = gallerySettings.infiniteLoop ?? true;
  const showDots = gallerySettings.showDots ?? true;
  const imageFit = gallerySettings.imageFitType === 'Fit All' ? 'contain' : 'cover';
  const dragToSlide = true;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPlaying, setIsPlaying] = useState(effectiveAutoPlay);

  useEffect(() => {
    setIsPlaying(effectiveAutoPlay);
  }, [effectiveAutoPlay]);

  const intervalRef = useRef(null);
  const dragStartX = useRef(null);
  const containerRef = useRef(null);

  /* ── Navigation ──────────────────────────────────────────────────────── */
  const goTo = useCallback((newIndex) => {
    if (isTransitioning || images.length <= 1) return;
    setDirection(newIndex > currentIndex ? 1 : -1);
    setCurrentIndex(newIndex);
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), TRANSITION_DURATION + 50);
  }, [isTransitioning, currentIndex, images.length]);

  const goNext = useCallback(() => {
    const next = currentIndex + 1;
    if (next >= images.length) {
      if (infiniteLoop) goTo(0);
    } else {
      goTo(next);
    }
  }, [currentIndex, images.length, infiniteLoop, goTo]);

  const goPrev = useCallback(() => {
    const prev = currentIndex - 1;
    if (prev < 0) {
      if (infiniteLoop) goTo(images.length - 1);
    } else {
      goTo(prev);
    }
  }, [currentIndex, images.length, infiniteLoop, goTo]);

  /* ── Auto-play ───────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isPlaying || images.length <= 1) return;
    intervalRef.current = setInterval(goNext, speed * 1000);
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed, goNext, images.length]);

  /* ── Keyboard ────────────────────────────────────────────────────────── */
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, onClose]);

  /* ── Drag-to-slide (Manual mode) ─────────────────────────────────────── */
  const handleDragStart = (e) => {
    if (!dragToSlide) return;
    dragStartX.current = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
  };
  const handleDragEnd = (e) => {
    if (dragStartX.current === null || !dragToSlide) return;
    const endX = e.type === 'touchend' ? e.changedTouches[0].clientX : e.clientX;
    const diff = endX - dragStartX.current;
    if (Math.abs(diff) > 50) {
      diff < 0 ? goNext() : goPrev();
      setIsPlaying(false);
    }
    dragStartX.current = null;
  };

  const hexToRgba = (hex, opacity = 100) => {
    if (!hex) return `rgba(0, 0, 0, ${opacity / 100})`;
    if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    if (c.length !== 6 && c.length !== 8) return hex;
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
  };

  const primaryColor = hexToRgba(settings.primaryColor || '#000000', settings.primaryOpacity ?? 100);
  const secondaryColor = hexToRgba(settings.secondaryColor || '#D7DBE8', settings.secondaryOpacity ?? 100);

  const overlayBgColor = popupSettings?.backgroundColor?.fill
    ? `${popupSettings.backgroundColor.fill}50`
    : 'rgba(0,0,0,0.5)';

  const popupBgColor = hexToRgba(settings.bgColor || popupSettings?.backgroundColor?.fill || '#FFFFFF', settings.bgOpacity ?? 80);

  if (!images || images.length === 0) {
    return (
      <div
        className="absolute inset-0 z-[200] flex flex-col items-center justify-center p-[2cqw]"
        style={{ backgroundColor: overlayBgColor, backdropFilter: 'blur(5px)' }}
        onClick={onClose}
      >
        <div
          className="relative w-full shadow-2xl flex flex-col items-center justify-center overflow-hidden max-w-[85cqw] h-[57cqh] rounded-[1cqw]"
          style={{
            backgroundColor: popupBgColor,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: popupSettings?.backgroundColor?.stroke && popupSettings.backgroundColor.stroke !== '#' ? `1px solid ${popupSettings.backgroundColor.stroke}` : 'none',
            fontFamily: popupSettings?.textProperties?.font || 'Poppins'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute flex items-center justify-center bg-white border border-red-500 text-red-500 hover:bg-red-50 transition-all z-[210] shadow-sm cursor-pointer top-[1.2cqw] right-[1.2cqw] w-[1.4cqw] h-[1.4cqw] rounded-[0.3cqw]"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
          >
            <X size="0.8cqw" strokeWidth={2} />
          </button>
          <p className="text-gray-500 font-medium text-[1.2cqw]">Images are not found</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 z-[200] flex flex-col items-center justify-center p-[2cqw]"
      style={{ backgroundColor: overlayBgColor, backdropFilter: 'blur(5px)' }}
      onClick={onClose}
    >
      {/* The White Box */}
      <div
        className="relative w-full shadow-2xl flex flex-col overflow-hidden max-w-[85cqw] h-[57cqh] rounded-[1cqw]"
        style={{
          backgroundColor: popupBgColor,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: popupSettings?.backgroundColor?.stroke && popupSettings.backgroundColor.stroke !== '#' ? `1px solid ${popupSettings.backgroundColor.stroke}` : 'none',
          fontFamily: popupSettings?.textProperties?.font || 'Poppins'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button at top-right */}
        <button
          className="absolute flex items-center justify-center bg-white border border-red-500 text-red-500 hover:bg-red-50 transition-all z-[210] shadow-sm cursor-pointer top-[1.2cqw] right-[1.2cqw] w-[1.4cqw] h-[1.4cqw] rounded-[0.3cqw]"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
        >
          <X size="0.8cqw" strokeWidth={2} />
        </button>

        {/* Carousel Area */}
        <div
          className="flex-1 w-full relative flex items-center justify-center mt-[2cqw]"
          ref={containerRef}
          onMouseDown={handleDragStart}
          onMouseUp={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchEnd={handleDragEnd}
        >
          {images.length > 1 && (
            <button
              className="absolute z-[210] transition-all cursor-pointer left-[3cqw] p-[1cqw]"
              style={{ color: primaryColor, backgroundColor: 'transparent' }}
              onClick={(e) => { e.stopPropagation(); goPrev(); setIsPlaying(false); }}
            >
              {NavIconRenderer({
                styleId: settings.navStyle || 1,
                size: "2cqw",
                color: primaryColor
              }).left}
            </button>
          )}

          {/* Slides container */}
          <div className="relative w-full h-full flex items-center justify-center perspective-[1200px]" style={{ cursor: dragToSlide ? 'grab' : 'default' }}>
            {images.map((img, index) => {
              const total = images.length;
              const isCurrent = index === currentIndex;
              const isPrev = index === (currentIndex - 1 + total) % total;
              const isNext = index === (currentIndex + 1) % total;
              const effect = settings.transitionEffect || 'Linear';

              let transform = 'translateX(0) scale(0) opacity-0';
              let zIndex = 0;
              let opacity = 0;

              if (effect === 'Fade') {
                transform = 'translateX(0) scale(1)';
                opacity = isCurrent ? 1 : 0;
                zIndex = isCurrent ? 10 : 1;
              } else if (effect === 'Flip') {
                transform = isCurrent ? 'rotateY(0deg) scale(1)' : isPrev ? 'rotateY(-180deg) scale(1)' : 'rotateY(180deg) scale(1)';
                opacity = isCurrent ? 1 : 0;
                zIndex = isCurrent ? 10 : 1;
              } else if (effect === 'Reveal') {
                transform = isCurrent ? 'scale(1)' : 'scale(0.85)';
                opacity = isCurrent ? 1 : 0;
                zIndex = isCurrent ? 10 : 1;
              } else if (effect === 'Slide' || effect === 'Push') {
                if (isCurrent) {
                  transform = 'translateX(0) scale(1)';
                  opacity = 1;
                  zIndex = 10;
                } else if (isPrev) {
                  transform = 'translateX(-100%) scale(1)';
                  opacity = 0;
                  zIndex = 5;
                } else if (isNext) {
                  transform = 'translateX(100%) scale(1)';
                  opacity = 0;
                  zIndex = 5;
                } else {
                  transform = `translateX(${direction > 0 ? '100%' : '-100%'}) scale(1)`;
                  opacity = 0;
                  zIndex = 1;
                }
              } else {
                // Linear (Coverflow) default
                if (isCurrent) {
                  transform = 'translateX(0) scale(1)';
                  zIndex = 10;
                  opacity = 1;
                } else if (isPrev) {
                  transform = `translateX(-15cqw) scale(0.65)`;
                  zIndex = 5;
                  opacity = 0.8;
                } else if (isNext) {
                  transform = `translateX(15cqw) scale(0.65)`;
                  zIndex = 5;
                  opacity = 0.8;
                } else {
                  transform = `translateX(${direction > 0 ? '15cqw' : '-15cqw'}) scale(0.65)`;
                  zIndex = 0;
                  opacity = 0;
                }
              }

              return (
                <div
                  key={index}
                  className="absolute transition-all ease-out"
                  style={{
                    transitionDuration: `${TRANSITION_DURATION}ms`,
                    transform,
                    zIndex,
                    opacity,
                    width: '20cqw',
                    height: '26cqh',
                    pointerEvents: isCurrent ? 'auto' : 'none'
                  }}
                >
                  <img
                    src={img.url}
                    alt={img.name || `Slide ${index + 1}`}
                    className="w-full h-full rounded-[1cqw]"
                    style={{ objectFit: imageFit, display: 'block', userSelect: 'none' }}
                    draggable={false}
                  />
                </div>
              );
            })}
          </div>

          {images.length > 1 && (
            <button
              className="absolute z-[210] transition-all cursor-pointer right-[3cqw] p-[1cqw]"
              style={{ color: primaryColor, backgroundColor: 'transparent' }}
              onClick={(e) => { e.stopPropagation(); goNext(); setIsPlaying(false); }}
            >
              {NavIconRenderer({
                styleId: settings.navStyle || 1,
                size: "2cqw",
                color: primaryColor
              }).right}
            </button>
          )}
        </div>

        {/* Dots (Centered Below Image) */}
        {showDots && images.length > 1 && (
          <div className="flex justify-center items-center z-[210] gap-[0.6cqw] mb-[2cqw]">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => { goTo(i); setIsPlaying(false); }}
                className="rounded-full transition-all duration-300 cursor-pointer"
                style={{
                  width: '0.5cqw',
                  height: '0.5cqw',
                  backgroundColor: i === currentIndex ? primaryColor : secondaryColor,
                  border: 'none'
                }}
              />
            ))}
          </div>
        )}

        {/* Bottom Bar: Play, Progress, Counter */}
        <div className="w-full flex items-center justify-between h-[6cqw] px-[4cqw] pb-[2cqw]">
          <div className="flex items-center flex-1 gap-[1.5cqw]">
            {images.length > 1 && (
              <button
                className="transition-colors cursor-pointer"
                style={{ color: primaryColor }}
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause fill="currentColor" size="1.2cqw" /> : <Play fill="currentColor" size="1.2cqw" />}
              </button>
            )}

            {/* Progress Bar */}
            <div
              className="relative flex-1 rounded-full overflow-hidden h-[0.15cqw] mr-[4cqw]"
              style={{ backgroundColor: secondaryColor }}
            >
              <div
                className="absolute top-0 left-0 h-full transition-all duration-300 ease-linear rounded-full"
                style={{ width: `${((currentIndex + 1) / images.length) * 100}%`, backgroundColor: primaryColor }}
              />
            </div>
          </div>

          <div className="font-medium text-gray-700 font-sans min-w-max text-[0.85cqw]">
            Image {currentIndex + 1} / {images.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabletGalleryPopup;
