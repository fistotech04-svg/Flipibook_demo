import React, { useState, useEffect, useRef } from 'react';
import { Upload } from 'lucide-react';
import { checkIsAnimatedWebp } from '../editorUtils';

const PropertySlider = ({ label, value, onChange, onPointerUp, min = 0, max = 100 }) => {
  return (
    <div className="flex items-center gap-[0.5vw] py-[0.4vw]">
      <span className="text-[0.8vw] font-semibold text-gray-600 whitespace-nowrap min-w-[5.5vw]">{label} :</span>
      <div className="flex-grow flex items-center gap-[1vw]">
        <input
          type="range"
          min={min}
          max={max}
          step="1"
          value={value || 0}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          onPointerUp={onPointerUp}
          className="flex-grow h-[0.25vw] appearance-none cursor-pointer bg-gray-200 rounded-full outline-none"
        />
        <div className="w-[2.8vw] h-[1.8vw] flex items-center justify-center bg-white border border-gray-100 rounded-[0.4vw] shadow-sm flex-shrink-0">
          <input
            type="number"
            min={min}
            max={max}
            value={value || 0}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            onBlur={onPointerUp}
            onKeyDown={(e) => { if (e.key === 'Enter') onPointerUp(); }}
            className="w-full text-center text-[0.8vw] text-gray-700 font-semibold outline-none bg-transparent"
          />
        </div>
      </div>
    </div>
  );
};

const ImageFramingProperties = ({ selectedElement, selectedLayerId, activePageIndex, updateElementAttribute, selectedElementProps }) => {
  const [slots, setSlots] = useState([]);
  const [gap, setGap] = useState(0);
  const [radius, setRadius] = useState(0);
  const [framePadding, setFramePadding] = useState(0);
  const [activeSlotId, setActiveSlotId] = useState(null);
  const [slotRadii, setSlotRadii] = useState({});
  const fileInputRefs = useRef({});
  const activeSlotRef = useRef(null);

  useEffect(() => {
    if (!selectedElement) return;

    // Find all paths that use a pattern for fill
    const paths = Array.from(selectedElement.querySelectorAll('path, polygon, rect, circle, ellipse'));
    const imageSlots = [];
    const listeners = [];

    paths.forEach((path, idx) => {
      const fill = path.getAttribute('fill');
      if (fill && fill.startsWith('url(#pattern')) {
        // Extract pattern ID
        const match = fill.match(/url\(#([^)]+)\)/);
        if (match && match[1]) {
          const patternId = match[1];
          let currentImage = null;
          
          // Try to find if this pattern has a user-uploaded image
          let svgRoot = selectedElement;
          while (svgRoot && svgRoot.tagName?.toLowerCase() !== 'svg') {
            svgRoot = svgRoot.parentElement;
          }
          if (svgRoot) {
            const pattern = svgRoot.querySelector(`pattern[id="${patternId}"]`);
            if (pattern) {
              const imgNode = pattern.querySelector('image, img');
              if (imgNode) {
                currentImage = imgNode.getAttribute('href') || imgNode.getAttribute('xlink:href');
              }
            }
          }

          imageSlots.push({
            id: patternId,
            path: path,
            index: idx,
            currentImage: currentImage
          });

          // Highlight overlay logic
          const highlightId = `highlight-${patternId}`;

          const addHighlight = () => {
            let highlight = selectedElement.querySelector(`[data-highlight-id="${highlightId}"]`);
            if (!highlight) {
              highlight = path.cloneNode();
              highlight.setAttribute('data-highlight-id', highlightId);
              highlight.setAttribute('pointer-events', 'none');
              highlight.setAttribute('fill', 'none');
              highlight.setAttribute('stroke', '#2563eb');
              highlight.setAttribute('stroke-width', '2');
              highlight.setAttribute('stroke-dasharray', '4,5');
              selectedElement.appendChild(highlight);
            }
          };

          const removeHighlight = () => {
            const highlight = selectedElement.querySelector(`[data-highlight-id="${highlightId}"]`);
            if (highlight) highlight.remove();
          };

          path.dataset.patternId = patternId;

          // Setup canvas interaction for this slot
          const handleMouseEnter = () => {
            addHighlight();
            path.style.cursor = 'pointer';
          };

          const handleMouseLeave = () => {
            if (activeSlotRef.current === patternId) return; // Keep highlight if active
            removeHighlight();
            path.style.cursor = '';
          };

          const handleSingleClick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            if (activeSlotRef.current === patternId) {
              // Deselect
              activeSlotRef.current = null;
              setActiveSlotId(null);
              removeHighlight();
            } else {
              // Deselect previous
              if (activeSlotRef.current) {
                const prevHighlightId = `highlight-${activeSlotRef.current}`;
                const prevHighlight = selectedElement.querySelector(`[data-highlight-id="${prevHighlightId}"]`);
                if (prevHighlight) prevHighlight.remove();
              }
              activeSlotRef.current = patternId;
              setActiveSlotId(patternId);
              addHighlight(); // Ensure it gets highlighted
            }
          };

          const handleDoubleClick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            if (fileInputRefs.current[patternId]) {
              fileInputRefs.current[patternId].click();
            }
          };

          path.addEventListener('mouseenter', handleMouseEnter);
          path.addEventListener('mouseleave', handleMouseLeave);
          path.addEventListener('click', handleSingleClick);
          path.addEventListener('dblclick', handleDoubleClick);

          listeners.push({ path, handleMouseEnter, handleMouseLeave, handleSingleClick, handleDoubleClick, removeHighlight });
        }
      }
    });

    setSlots(imageSlots);

    // Load initial gap and radius from the first valid path
    if (paths.length > 0) {
      const firstPath = paths[0];
      setGap(parseFloat(firstPath.getAttribute('stroke-width')) || 0);
      setRadius(parseFloat(firstPath.getAttribute('rx')) || parseFloat(firstPath.getAttribute('data-rx')) || 0);
    }
    
    // Load per-slot radii
    const initialRadii = {};
    paths.forEach(p => {
       const pId = p.dataset.patternId;
       if (pId) {
           initialRadii[pId] = parseFloat(p.getAttribute('rx')) || parseFloat(p.getAttribute('data-rx')) || 0;
       }
    });
    setSlotRadii(initialRadii);
    
    setFramePadding(parseFloat(selectedElement.getAttribute('data-frame-padding')) || 0);

    return () => {
      listeners.forEach(({ path, handleMouseEnter, handleMouseLeave, handleSingleClick, handleDoubleClick, removeHighlight }) => {
        path.removeEventListener('mouseenter', handleMouseEnter);
        path.removeEventListener('mouseleave', handleMouseLeave);
        path.removeEventListener('click', handleSingleClick);
        path.removeEventListener('dblclick', handleDoubleClick);
        removeHighlight();
      });
      activeSlotRef.current = null;
      setActiveSlotId(null);
    };
  }, [selectedElement, selectedLayerId]);

  const handleImageDrop = async (e, slotId) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileChange({ target: { files: files } }, slotId);
    }
  };

  const handleFileChange = async (e, slotId) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    let isGif = file.type === 'image/gif';
    if (!isGif && file.type.includes('webp')) {
      isGif = await checkIsAnimatedWebp(file);
    }

    if (!file.type.startsWith('image/') && !isVideo && !isGif) {
      alert('Only Image formats are allowed for slots.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      updateSlotImage(slotId, dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const syncDomChanges = () => {
    if (!selectedElement) return;
    window.__skipCanvasUpdateForPage = activePageIndex;
    let svgRoot = selectedElement;
    while (svgRoot && svgRoot.tagName?.toLowerCase() !== 'svg') {
      svgRoot = svgRoot.parentElement;
    }
    if (svgRoot) {
      const cloneSvg = svgRoot.cloneNode(true);
      cloneSvg.querySelectorAll('[data-highlight-id], .frame-boundary').forEach(el => el.remove());
      const serializer = new XMLSerializer();
      const html = serializer.serializeToString(cloneSvg);
      updateElementAttribute(activePageIndex, selectedLayerId, '__dom_sync__', html);
    }
  };

  const updateGapAndRadius = (newGap, newRadius, skipSync = false) => {
    if (!selectedElement) return;

    const paths = Array.from(selectedElement.querySelectorAll('path, polygon, rect, circle, ellipse'));
    paths.forEach(path => {
      // Gap translates to stroke-width with white stroke to create space between adjacent shapes
      if (newGap > 0) {
        path.setAttribute('stroke', '#ffffff'); // Use white as partition line
        path.setAttribute('stroke-width', newGap);
      } else {
        path.removeAttribute('stroke');
        path.removeAttribute('stroke-width');
      }

      // Radius translates to rx/ry for rect, or data-rx for shapes
      if (newRadius > 0) {
        if (path.tagName.toLowerCase() === 'rect') {
          path.setAttribute('rx', newRadius);
          path.setAttribute('ry', newRadius);
        } else {
          path.setAttribute('stroke-linejoin', 'round');
          path.setAttribute('data-rx', newRadius); // Keep track of it
        }
      } else {
        if (path.tagName.toLowerCase() === 'rect') {
          path.removeAttribute('rx');
          path.removeAttribute('ry');
        } else {
          path.removeAttribute('stroke-linejoin');
          path.removeAttribute('data-rx');
        }
      }
    });

    setGap(newGap);
    setRadius(newRadius);
    
    // Also update all slot radii state to match the global one
    const newSlotRadii = {};
    paths.forEach(p => {
       const pId = p.dataset.patternId;
       if (pId) newSlotRadii[pId] = newRadius;
    });
    setSlotRadii(newSlotRadii);
    
    if (!skipSync) {
      syncDomChanges();
    }
  };

  const updateSlotRadius = (patternId, newRadius, skipSync = false) => {
    if (!selectedElement) return;
    
    setSlotRadii(prev => ({...prev, [patternId]: newRadius}));
    
    const paths = Array.from(selectedElement.querySelectorAll('path, polygon, rect, circle, ellipse'));
    const path = paths.find(p => p.dataset.patternId === patternId);
    if (path) {
        if (newRadius > 0) {
          if (path.tagName.toLowerCase() === 'rect') {
            path.setAttribute('rx', newRadius);
            path.setAttribute('ry', newRadius);
          } else {
            path.setAttribute('stroke-linejoin', 'round');
            path.setAttribute('data-rx', newRadius);
          }
        } else {
          if (path.tagName.toLowerCase() === 'rect') {
            path.removeAttribute('rx');
            path.removeAttribute('ry');
          } else {
            path.removeAttribute('stroke-linejoin');
            path.removeAttribute('data-rx');
          }
        }
        
        // Also update highlight clone if it exists
        const highlightId = `highlight-${patternId}`;
        const highlight = selectedElement.querySelector(`[data-highlight-id="${highlightId}"]`);
        if (highlight) {
            if (newRadius > 0 && highlight.tagName.toLowerCase() === 'rect') {
                highlight.setAttribute('rx', newRadius);
                highlight.setAttribute('ry', newRadius);
            } else if (highlight.tagName.toLowerCase() === 'rect') {
                highlight.removeAttribute('rx');
                highlight.removeAttribute('ry');
            }
        }
    }
    
    if (!skipSync) syncDomChanges();
  };

  const updateFramePadding = (newPadding, skipSync = false) => {
    if (!selectedElement) return;
    
    setFramePadding(newPadding);
    selectedElement.setAttribute('data-frame-padding', newPadding);
    
    const scaleVal = (100 - newPadding) / 100;
    
    const paths = Array.from(selectedElement.querySelectorAll('path, polygon, rect, circle, ellipse'))
      .filter(p => !p.getAttribute('data-highlight-id') && !p.classList.contains('frame-boundary'));
      
    // Find or create boundary rect
    let boundary = selectedElement.querySelector('.frame-boundary');
    if (!boundary) {
      // Temporarily remove any transforms to get true full size
      const oldTransforms = [];
      paths.forEach(p => {
        oldTransforms.push(p.getAttribute('transform'));
        p.removeAttribute('transform');
      });
      
      const bbox = selectedElement.getBBox();
      boundary = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      boundary.setAttribute('class', 'frame-boundary');
      boundary.setAttribute('fill', 'none');
      boundary.setAttribute('stroke', 'none');
      boundary.setAttribute('pointer-events', 'none');
      boundary.setAttribute('x', bbox.x);
      boundary.setAttribute('y', bbox.y);
      boundary.setAttribute('width', bbox.width);
      boundary.setAttribute('height', bbox.height);
      selectedElement.insertBefore(boundary, selectedElement.firstChild);
      
      paths.forEach((p, i) => {
        if (oldTransforms[i]) p.setAttribute('transform', oldTransforms[i]);
      });
    }

    const frameCx = parseFloat(boundary.getAttribute('x')) + parseFloat(boundary.getAttribute('width')) / 2;
    const frameCy = parseFloat(boundary.getAttribute('y')) + parseFloat(boundary.getAttribute('height')) / 2;
    
    const transformStr = `translate(${frameCx}, ${frameCy}) scale(${scaleVal}) translate(${-frameCx}, ${-frameCy})`;
    
    paths.forEach(path => {
      path.setAttribute('transform', transformStr);
      
      const patternId = path.dataset.patternId;
      if (patternId) {
        const highlightId = `highlight-${patternId}`;
        const highlight = selectedElement.querySelector(`[data-highlight-id="${highlightId}"]`);
        if (highlight) {
          highlight.setAttribute('transform', transformStr);
        }
      }
    });

    if (!skipSync) {
      syncDomChanges();
    }
  };

  const updateSlotImage = (patternId, dataUrl, skipSync = false) => {
    if (!selectedElement) return;

    const pattern = selectedElement.querySelector(`pattern[id="${patternId}"]`);
    if (!pattern) return;

    // Find the shape that uses this pattern to get its aspect ratio
    const shapeEl = selectedElement.querySelector(`[fill="url(#${patternId})"]`);
    if (!shapeEl) return;

    // Load the image to get its width and height
    const img = new window.Image();
    img.onload = () => {
      const imgW = img.width;
      const imgH = img.height;

      // Compute the correct matrix to cover the slot (object-fit: cover equivalent in objectBoundingBox space)
      let bbox = { width: 100, height: 100 };
      try {
        bbox = shapeEl.getBBox();
      } catch(e) {}
      if (bbox.width === 0 || bbox.height === 0) bbox = { width: 100, height: 100 };

      const slotW = bbox.width;
      const slotH = bbox.height;

      const scale = Math.max(slotW / imgW, slotH / imgH);
      const finalW = imgW * scale;
      const finalH = imgH * scale;

      const scaleX_obb = scale / slotW;
      const scaleY_obb = scale / slotH;

      const tx_user = (slotW - finalW) / 2;
      const ty_user = (slotH - finalH) / 2;

      const tx_obb = tx_user / slotW;
      const ty_obb = ty_user / slotH;

      let imageNode = pattern.querySelector('image, img');
      const useNode = pattern.querySelector('use');
      
      if (!imageNode && useNode) {
        imageNode = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        pattern.removeChild(useNode);
        pattern.appendChild(imageNode);
      } else if (!imageNode) {
        imageNode = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        pattern.appendChild(imageNode);
      }

      imageNode.setAttribute('width', imgW);
      imageNode.setAttribute('height', imgH);
      imageNode.removeAttribute('preserveAspectRatio');
      imageNode.setAttribute('transform', `matrix(${scaleX_obb} 0 0 ${scaleY_obb} ${tx_obb} ${ty_obb})`);

      imageNode.setAttribute('href', dataUrl);
      imageNode.setAttribute('xlink:href', dataUrl);

      // Save changes
      if (!skipSync) {
        syncDomChanges();
      }
    };
    img.src = dataUrl;
  };

  return (
    <div className="flex flex-col gap-[1vw] p-[1vw]">
      {/* Title Header */}
      <div className="flex items-center gap-[0.75vw] mb-[0.5vw]">
        <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">
          Image Framing Properties
        </span>
        <div className="h-[0.1vw] flex-1 bg-gray-200 mr-[-3vw]"></div>
      </div>
      <div className="text-[0.8vw] font-semibold text-gray-800">Image Slots </div>
      <div className="grid grid-cols-2 gap-[1vw]">
        {slots.map((slot, i) => (
          <div key={slot.id} className="flex flex-col gap-[0.5vw]">
            <span className="text-[0.8vw] text-gray-600 font-medium flex items-center justify-between">
              Slot {i + 1}
              {slot.currentImage && (
                <span className="text-[0.6vw] text-green-600 bg-green-50 px-[0.3vw] py-[0.1vw] rounded">Filled</span>
              )}
            </span>
            <div
              className={`border-2 border-dashed rounded-[0.5vw] flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden group ${
                activeSlotId === slot.id ? 'ring-2 ring-offset-2 ring-blue-500 border-blue-500 ' : ''
              } ${
                slot.currentImage 
                  ? (activeSlotId === slot.id ? 'bg-blue-50 h-[5vw]' : 'border-gray-300 hover:border-[#4c5add] bg-gray-50 h-[5vw]')
                  : (activeSlotId === slot.id ? 'bg-blue-100 p-[1vw]' : 'border-[#4c5add] bg-blue-50/30 hover:bg-blue-50 p-[1vw]')
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => handleImageDrop(e, slot.id)}
              onClick={() => {
                if (fileInputRefs.current[slot.id]) {
                  fileInputRefs.current[slot.id].click();
                }
              }}
            >
              {slot.currentImage ? (
                <>
                  <img src={slot.currentImage} alt={`Slot ${i+1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload size="1.2vw" className="text-white mb-[0.2vw]" />
                    <span className="text-[0.65vw] text-white font-medium">Replace</span>
                  </div>
                </>
              ) : (
                <>
                  <Upload size="1vw" className="text-[#4c5add] mb-[0.2vw]" />
                  <span className="text-[0.6vw] text-[#4c5add] font-semibold text-center leading-tight">Drop on Slot<br/>or Click</span>
                </>
              )}
              <input
                type="file"
                ref={(el) => fileInputRefs.current[slot.id] = el}
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFileChange(e, slot.id)}
              />
            </div>
          </div>
        ))}
      </div>
      {slots.length === 0 && (
        <div className="text-[0.8vw] text-gray-500 text-center py-[2vw]">
          No image slots found in this frame.
        </div>
      )}
      
      <div className="flex flex-col gap-[0.5vw] mt-[1vw]">
        <PropertySlider 
          label="Partition Gap" 
          value={gap} 
          onChange={(val) => updateGapAndRadius(val, radius, true)} 
          onPointerUp={syncDomChanges}
          min={0} 
          max={50} 
        />
        <PropertySlider 
          label="Padding" 
          value={framePadding} 
          onChange={(val) => updateFramePadding(val, true)} 
          onPointerUp={syncDomChanges}
          min={0} 
          max={50} 
        />
        <PropertySlider 
          label="Corner Radius" 
          value={activeSlotId ? (slotRadii[activeSlotId] || 0) : radius} 
          onChange={(val) => {
            if (activeSlotId) {
              updateSlotRadius(activeSlotId, val, true);
            } else {
              updateGapAndRadius(gap, val, true);
            }
          }} 
          onPointerUp={syncDomChanges}
          min={0} 
          max={100} 
        />
      </div>
    </div>
  );
};

export default ImageFramingProperties;
