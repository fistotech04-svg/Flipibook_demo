import React from 'react';

const defaultSampleImages = [
  { id: 1, url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600&auto=format&fit=crop&q=80', name: 'Slide 1', heading: '', subtext: '' },
  { id: 2, url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80', name: 'Slide 2', heading: '', subtext: '' },
  { id: 3, url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80', name: 'Slide 3', heading: '', subtext: '' }
];

const defaultSlideshowSettings = {
  autoPlay: true,
  speed: 3,
  infiniteLoop: true,
  showArrows: true,
  showDots: true,
  imageFitType: 'Fill All',
  transitionEffect: 'Linear',
  dragToSlide: false,
  dotColor: '#4F46E5',
  dotOpacity: 100,
  dotStyle: 1,
  dotButtonSize: 100,
  navIconColor: '#4F46E5',
  navIconOpacity: 100,
  navStyle: 1,
  navButtonSize: 100,
  autoSlide: true,
  bgColor: '#000000',
  bgOpacity: 100,
  strokeColor: '#9ca3af',
  strokeOpacity: 100,
  strokeAlignment: 'Center',
  strokeWidth: 1,
  strokeLineStyle: 'Solid',
  strokeDashLength: 8,
  strokeDashGap: 4,
  strokeLineCorner: 'Rounded',
};

const escapeXml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const get3DCoverflowSvg = (uniqueId, transformAttr = '') => {
  const dataJson = escapeXml(JSON.stringify({ settings: defaultSlideshowSettings, images: defaultSampleImages }));
  const img0 = escapeXml(defaultSampleImages[0].url);
  const img1 = escapeXml(defaultSampleImages[1].url);
  const img2 = escapeXml(defaultSampleImages[2].url);

  return `
    <g id="slideshow-${uniqueId}" data-type="slideshow" data-is-slideshow="true" data-active-index="0" data-slideshow="${dataJson}" cursor="pointer" ${transformAttr}>
      <defs>
        <pattern id="slideshow-pattern-${uniqueId}" patternUnits="userSpaceOnUse" patternTransform="translate(40, 0)" width="130" height="140" viewBox="0 0 130 140">
          <image href="${img0}" xlink:href="${img0}" x="0" y="0" width="130" height="140" preserveAspectRatio="xMidYMid slice" />
          <g class="overlay-text-group"></g>
        </pattern>
        <pattern id="slideshow-pattern-center-${uniqueId}" patternUnits="userSpaceOnUse" patternTransform="translate(40, 0)" width="130" height="140" viewBox="0 0 130 140">
          <image href="${img0}" xlink:href="${img0}" x="0" y="0" width="130" height="140" preserveAspectRatio="xMidYMid slice" />
          <g class="overlay-text-group"></g>
        </pattern>
        <pattern id="slideshow-pattern-left-${uniqueId}" patternUnits="userSpaceOnUse" patternTransform="translate(0, 8)" width="80" height="124">
          <image href="${img2}" xlink:href="${img2}" x="0" y="0" width="80" height="124" preserveAspectRatio="xMidYMid slice" />
        </pattern>
        <pattern id="slideshow-pattern-right-${uniqueId}" patternUnits="userSpaceOnUse" patternTransform="translate(120, 8)" width="110" height="124">
          <image href="${img1}" xlink:href="${img1}" x="0" y="0" width="110" height="124" preserveAspectRatio="xMidYMid slice" />
        </pattern>
      </defs>
      <!-- Container Background -->
      <rect class="slideshow-container-bg" x="-5" y="-5" width="220" height="150" rx="12" fill="transparent" />
      <!-- Left frame -->
      <rect x="0" y="8" width="80" height="124" rx="10" stroke="#9ca3af" stroke-width="1" fill="url(#slideshow-pattern-left-${uniqueId})" style="transform: perspective(400px) rotateY(25deg); transform-origin: 100% 50%; transform-box: fill-box; transition: all 0.3s ease;"/>
      <!-- Right frame -->
      <rect x="120" y="8" width="110" height="124" rx="10" stroke="#9ca3af" stroke-width="1" fill="url(#slideshow-pattern-right-${uniqueId})" style="transform: perspective(400px) rotateY(-22deg); transform-origin: 0% 50%; transform-box: fill-box; transition: all 0.3s ease;"/>
      <!-- Center frame -->
      <rect x="40" y="0" width="130" height="140" rx="12" stroke="#9ca3af" stroke-width="2" fill="url(#slideshow-pattern-center-${uniqueId})" style="transform: perspective(400px) rotateY(0deg); transform-origin: 50% 50%; transform-box: fill-box; transition: all 0.3s ease;"/>
      <!-- Invisible bounding box for selection/interaction -->
      <rect class="bbox-anchor" x="-5" y="-5" width="220" height="150" fill="transparent" />
    </g>
  `;
};

const getFlatGallerySvg = (uniqueId, transformAttr = '') => {
  const dataJson = escapeXml(JSON.stringify({ settings: defaultSlideshowSettings, images: defaultSampleImages }));
  const img0 = escapeXml(defaultSampleImages[0].url);
  const img1 = escapeXml(defaultSampleImages[1].url);
  const img2 = escapeXml(defaultSampleImages[2].url);

  return `
    <g id="slideshow-${uniqueId}" data-type="slideshow" data-is-slideshow="true" data-style="flat" data-active-index="0" data-slideshow="${dataJson}" cursor="pointer" ${transformAttr}>
      <defs>
        <pattern id="slideshow-pattern-${uniqueId}" patternUnits="userSpaceOnUse" patternTransform="translate(50, 0)" width="110" height="140" viewBox="0 0 110 140">
          <image href="${img0}" xlink:href="${img0}" x="0" y="0" width="110" height="140" preserveAspectRatio="xMidYMid slice" />
          <g class="overlay-text-group"></g>
        </pattern>
        <pattern id="slideshow-pattern-center-${uniqueId}" patternUnits="userSpaceOnUse" patternTransform="translate(50, 0)" width="110" height="140" viewBox="0 0 110 140">
          <image href="${img0}" xlink:href="${img0}" x="0" y="0" width="110" height="140" preserveAspectRatio="xMidYMid slice" />
          <g class="overlay-text-group"></g>
        </pattern>
        <pattern id="slideshow-pattern-left-${uniqueId}" patternUnits="userSpaceOnUse" patternTransform="translate(0, 0)" width="46" height="140">
          <image href="${img2}" xlink:href="${img2}" x="0" y="0" width="46" height="140" preserveAspectRatio="xMidYMid slice" />
        </pattern>
        <pattern id="slideshow-pattern-right-${uniqueId}" patternUnits="userSpaceOnUse" patternTransform="translate(164, 0)" width="46" height="140">
          <image href="${img1}" xlink:href="${img1}" x="0" y="0" width="46" height="140" preserveAspectRatio="xMidYMid slice" />
        </pattern>
        <pattern id="slideshow-pattern-thumb-0-${uniqueId}" patternUnits="userSpaceOnUse" patternTransform="translate(0, 150)" width="34" height="24">
          <image href="${img1}" xlink:href="${img1}" x="0" y="0" width="34" height="24" preserveAspectRatio="xMidYMid slice" />
        </pattern>
        <pattern id="slideshow-pattern-thumb-1-${uniqueId}" patternUnits="userSpaceOnUse" patternTransform="translate(44, 150)" width="34" height="24">
          <image href="${img2}" xlink:href="${img2}" x="0" y="0" width="34" height="24" preserveAspectRatio="xMidYMid slice" />
        </pattern>
        <pattern id="slideshow-pattern-thumb-2-${uniqueId}" patternUnits="userSpaceOnUse" patternTransform="translate(88, 150)" width="34" height="24">
          <image href="${img0}" xlink:href="${img0}" x="0" y="0" width="34" height="24" preserveAspectRatio="xMidYMid slice" />
        </pattern>
        <pattern id="slideshow-pattern-thumb-3-${uniqueId}" patternUnits="userSpaceOnUse" patternTransform="translate(132, 150)" width="34" height="24">
          <image href="${img1}" xlink:href="${img1}" x="0" y="0" width="34" height="24" preserveAspectRatio="xMidYMid slice" />
        </pattern>
        <pattern id="slideshow-pattern-thumb-4-${uniqueId}" patternUnits="userSpaceOnUse" patternTransform="translate(176, 150)" width="34" height="24">
          <image href="${img2}" xlink:href="${img2}" x="0" y="0" width="34" height="24" preserveAspectRatio="xMidYMid slice" />
        </pattern>
      </defs>
      <!-- Container Background -->
      <rect class="slideshow-container-bg" x="-5" y="-5" width="220" height="200" rx="12" fill="transparent" />
      <!-- Left frame -->
      <rect class="main-frame" x="0" y="0" width="46" height="140" rx="6" stroke="#9ca3af" stroke-width="1" fill="url(#slideshow-pattern-left-${uniqueId})" style="opacity: 0.5; transition: all 0.3s ease;"/>
      <!-- Right frame -->
      <rect class="main-frame" x="164" y="0" width="46" height="140" rx="6" stroke="#9ca3af" stroke-width="1" fill="url(#slideshow-pattern-right-${uniqueId})" style="opacity: 0.5; transition: all 0.3s ease;"/>
      <!-- Center frame -->
      <rect class="main-frame" x="50" y="0" width="110" height="140" rx="8" stroke="#9ca3af" stroke-width="2" fill="url(#slideshow-pattern-center-${uniqueId})" style="transition: all 0.3s ease; box-shadow: 0 0 10px rgba(0,0,0,0.5);"/>
      
      <!-- Thumbnails -->
      <rect class="thumb-frame" x="0" y="150" width="34" height="24" rx="2" stroke="#9ca3af" stroke-width="1" fill="url(#slideshow-pattern-thumb-0-${uniqueId})" />
      <rect class="thumb-frame" x="44" y="150" width="34" height="24" rx="2" stroke="#9ca3af" stroke-width="1" fill="url(#slideshow-pattern-thumb-1-${uniqueId})" />
      <rect class="thumb-frame" x="88" y="150" width="34" height="24" rx="2" stroke="#0ea5e9" stroke-width="2" fill="url(#slideshow-pattern-thumb-2-${uniqueId})" />
      <rect class="thumb-frame" x="132" y="150" width="34" height="24" rx="2" stroke="#9ca3af" stroke-width="1" fill="url(#slideshow-pattern-thumb-3-${uniqueId})" />
      <rect class="thumb-frame" x="176" y="150" width="34" height="24" rx="2" stroke="#9ca3af" stroke-width="1" fill="url(#slideshow-pattern-thumb-4-${uniqueId})" />
      <!-- Invisible bounding box for selection/interaction -->
      <rect class="bbox-anchor" x="-5" y="-5" width="220" height="200" fill="transparent" />
      
    </g>
  `;
};

const SlideShowStyle = ({ isFullView }) => {
  return (
    <div className={`grid grid-cols-2 gap-[0.5vw] ${isFullView ? 'p-[0.5vw]' : ''}`}>
      <button
        draggable="true"
        onDragStart={(e) => {
          const uniqueId = Date.now();
          const svgCode = get3DCoverflowSvg(uniqueId, '');
          e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({
            type: 'slideshow',
            svgContent: svgCode
          }));
          e.dataTransfer.setData('text/plain', 'slideshow');
        }}
        onClick={() => {
          const uniqueId = Date.now();
          const svgCode = get3DCoverflowSvg(uniqueId, 'transform="translate(100, 150)"');
          window.dispatchEvent(new CustomEvent('add-element-to-editor', {
            detail: { svgContent: svgCode }
          }));
        }}
        className="flex flex-col items-center justify-center p-[1vw] bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50/30 transition-all group"
      >
        <svg width="40" height="30" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-[0.5vw] text-gray-400 group-hover:text-blue-500 transition-colors">
          <rect x="2" y="8" width="20" height="24" rx="2" stroke="currentColor" strokeWidth="2" fill="#f3f4f6"/>
          <rect x="38" y="8" width="20" height="24" rx="2" stroke="currentColor" strokeWidth="2" fill="#f3f4f6"/>
          <rect x="15" y="2" width="30" height="36" rx="3" stroke="currentColor" strokeWidth="2" fill="white" />
          <path d="M22 20L25 17V23L22 20Z" fill="currentColor"/>
          <path d="M38 20L35 17V23L38 20Z" fill="currentColor"/>
        </svg>
        <span className="text-[0.7vw] font-medium text-gray-700 group-hover:text-blue-600 transition-colors">3D Coverflow</span>
      </button>

      {/* Second Slideshow Style: Flat Gallery */}
      <button
        draggable="true"
        onDragStart={(e) => {
          const uniqueId = Date.now();
          const svgCode = getFlatGallerySvg(uniqueId, '');
          e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({
            type: 'slideshow',
            svgContent: svgCode
          }));
          e.dataTransfer.setData('text/plain', 'slideshow');
        }}
        onClick={() => {
          const uniqueId = Date.now();
          const svgCode = getFlatGallerySvg(uniqueId, 'transform="translate(100, 150)"');
          window.dispatchEvent(new CustomEvent('add-element-to-editor', {
            detail: { svgContent: svgCode }
          }));
        }}
        className="flex flex-col items-center justify-center p-[1vw] bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50/30 transition-all group"
      >
        <svg width="40" height="30" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-[0.5vw] text-gray-400 group-hover:text-blue-500 transition-colors">
          <rect x="2" y="2" width="14" height="36" rx="2" stroke="currentColor" strokeWidth="2" fill="#f3f4f6" opacity="0.5"/>
          <rect x="44" y="2" width="14" height="36" rx="2" stroke="currentColor" strokeWidth="2" fill="#f3f4f6" opacity="0.5"/>
          <rect x="20" y="2" width="20" height="36" rx="3" stroke="currentColor" strokeWidth="2" fill="white" />
        </svg>
        <span className="text-[0.7vw] font-medium text-gray-700 group-hover:text-blue-600 transition-colors">Flat Gallery</span>
      </button>
    </div>
  );
};

export default SlideShowStyle;
