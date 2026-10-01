import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  ArrowLeft, MoreVertical, Layers, Plus, Copy, Edit2,
  Layout, ArrowUp, ArrowDown, ArrowUpToLine, ArrowDownToLine,
  Ban, Trash2, FilePlus, GripVertical,
  Folder, Type, Image as ImageIcon, Square, Circle, Triangle, Star, Minus,
  Video, ImagePlay,
  ChevronRight, ChevronDown, Eye, EyeOff, Lock, Unlock,
  Scissors, Clipboard, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import axios from 'axios';
import AlertModal from '../AlertModal';
import { Icon as FileReplaceIcon, Icon } from '@iconify/react';
import pageCacheManager from './PageCacheManager';
import { parseLayersFromSVG } from './editorUtils';

// Memoized isolated vector SVG preview container with CSS containment
const MemoizedPagePreview = React.memo(({ pageId, pageHtml, isHidden }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !pageHtml) return;
    let cleanSvg = pageHtml.replace(/<svg\b([^>]*)>/i, (match, attrs) => {
      const cleanAttrs = attrs
        .replace(/\bwidth=["'][^"']*["']/gi, '')
        .replace(/\bheight=["'][^"']*["']/gi, '')
        .replace(/\bpreserveAspectRatio=["'][^"']*["']/gi, '');
      return `<svg${cleanAttrs} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">`;
    });

    // Namespace all IDs and internal references in preview to avoid collisions with editor canvas
    const prefix = `prev-${pageId}-`;
    cleanSvg = cleanSvg
      .replace(/\bid=(["'])(.*?)\1/gi, (m, q, id) => `id=${q}${prefix}${id}${q}`)
      .replace(/\bhref=(["'])#(.*?)\1/gi, (m, q, id) => `href=${q}#${prefix}${id}${q}`)
      .replace(/\bxlink:href=(["'])#(.*?)\1/gi, (m, q, id) => `xlink:href=${q}#${prefix}${id}${q}`)
      .replace(/url\((['"]?)#([^)'"]+)\1\)/gi, (m, q, id) => `url(${q}#${prefix}${id}${q})`);

    containerRef.current.innerHTML = `<style>#preview-${pageId} [data-name="Free Frame"] { display: none !important; }</style>` + cleanSvg;
  }, [pageId, pageHtml]);

  return (
    <div
      id={`preview-${pageId}`}
      ref={containerRef}
      className="w-full h-full flex items-center justify-center pointer-events-none select-none"
      style={{
        contain: 'strict',
        contentVisibility: 'auto'
      }}
    />
  );
}, (prevProps, nextProps) => {
  return prevProps.pageId === nextProps.pageId &&
         prevProps.pageHtml === nextProps.pageHtml &&
         prevProps.isHidden === nextProps.isHidden;
});

const PageThumbnail = ({ page, index, activePageIndex }) => {
  const [imgError, setImgError] = useState(false);

  if (!page || !page.html) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400 gap-1 select-none">
        <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-[0.65vw] font-medium">Loading...</span>
      </div>
    );
  }

  // If page contains vector shapes, MemoizedPagePreview renders real vector graphics directly
  const hasVectorData = page.html.includes('<path') || page.html.includes('<polygon') || page.html.includes('<polyline');

  if (!hasVectorData && !imgError) {
    const pdfImgMatch = page.html.match(/<image[^>]+(?:href|xlink:href)=["']([^"']+)["'][^>]*data-name=["']PDF Background["']/i) ||
                        page.html.match(/<g\b[^>]*data-name=["']PDF Background["'][^>]*>[\s\S]*?<image[^>]+(?:href|xlink:href)=["']([^"']+)["']/i);
    const pdfImgUrl = pdfImgMatch ? pdfImgMatch[1] : null;

    if (pdfImgUrl) {
      return (
        <img
          src={pdfImgUrl}
          alt={page.name || `Page ${index + 1}`}
          className="w-full h-full object-contain pointer-events-none select-none"
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
        />
      );
    }
  }

  return (
    <MemoizedPagePreview
      pageId={page.id}
      pageHtml={page.html}
      isHidden={page.isHidden}
    />
  );
};

const LayerItem = ({
  layer,
  depth = 0,
  isBaseLayer = false,
  onToggleVisibility,
  onToggleLock,
  selectedLayerId,
  setSelectedLayerId,
  multiSelectedIds = new Set(),
  setMultiSelectedIds,
  renameLayer,
  pageIndex,
  onLayerContextMenu,
  onReorderLayer,
  currentFrameId,
  setCurrentFrameId
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(layer.name);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef(null);
  const isGroup = layer.type === 'g' || (layer.children && layer.children.length > 0);
  const itemRef = useRef(null);

  // Listen for custom trigger to start editing from context menu
  useEffect(() => {
    const handleTriggerRename = (e) => {
      if (e.detail.layerId === layer.id) {
        setIsEditing(true);
        setEditName(layer.name);
      }
    };
    window.addEventListener('trigger-rename-layer', handleTriggerRename);
    return () => window.removeEventListener('trigger-rename-layer', handleTriggerRename);
  }, [layer.id, layer.name]);

  // Determine if this item should be styled as "Selected"
  // In spread mode, we treat both root folders as "selected" if they are both in the set
  const isSelected = selectedLayerId === layer.id || (multiSelectedIds.size > 1 && multiSelectedIds.has(layer.id) && depth === 0);

  // Is it part of multi-selection but not the primary?
  const isMultiOnly = multiSelectedIds.has(layer.id) && !isSelected && multiSelectedIds.size > 1;

  // Auto-scroll to selected layer
  useEffect(() => {
    if (selectedLayerId === layer.id && itemRef.current) {
      // Small timeout to allow parent folder expansion animation to progress
      // Delay matched with 0.3s animation to ensure layout is stable
      const timer = setTimeout(() => {
        itemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedLayerId, layer.id]);

  // Listen for external expand trigger (e.g. from Pencil tool drawing)
  useEffect(() => {
    const handleExpandChain = (e) => {
      if (!isGroup) return;

      const hasDescendant = (node, id) => {
        if (!node.children) return false;
        for (const child of node.children) {
          if (child.id === id) return true;
          if (hasDescendant(child, id)) return true;
        }
        return false;
      };

      if (hasDescendant(layer, e.detail.id)) {
        setIsOpen(true);
      }
    };
    window.addEventListener('expand-layer-parent', handleExpandChain);
    return () => window.removeEventListener('expand-layer-parent', handleExpandChain);
  }, [layer, isGroup]);

  // Auto-expand folder if a child is selected
  useEffect(() => {
    if (selectedLayerId && isGroup && !isOpen) {
      const hasSelectedDescendant = (node, id) => {
        if (!node.children) return false;
        for (const child of node.children) {
          if (child.id === id) return true;
          if (hasSelectedDescendant(child, id)) return true;
        }
        return false;
      };
      if (hasSelectedDescendant(layer, selectedLayerId)) {
        setIsOpen(true);
      }
    }
  }, [selectedLayerId, layer, isGroup, isOpen]);

  // Auto-collapse if selection is cleared (click outside workspace)
  useEffect(() => {
    if (!selectedLayerId && multiSelectedIds.size === 0 && isOpen) {
      setIsOpen(false);
    }
  }, [selectedLayerId, multiSelectedIds]);

  // Icon Helper based on element type
  const getLayerIcon = () => {
    const nameLower = (layer.name || '').toLowerCase();
    const typeLower = (layer.type || '').toLowerCase();

    // 1. Check Video
    const isVideo = typeLower === 'video' || nameLower.includes('video') || typeLower === 'foreignobject' || layer['data-type'] === 'video';
    if (isVideo) {
      return <Video size="0.85vw" className="text-gray-400 group-hover/layer:text-[#6366F1]" />;
    }

    // 2. Check GIF
    const isGif = typeLower === 'gif' || nameLower.includes('gif') || layer['data-type'] === 'gif' || layer['data-is-gif-group'] === 'true';
    if (isGif) {
      return <ImagePlay size="0.85vw" className="text-gray-400 group-hover/layer:text-[#6366F1]" />;
    }

    // 3. Check Image
    const isImageByName = typeLower === 'image' || nameLower.includes('image');
    if (isImageByName) {
      return <ImageIcon size="0.85vw" className="text-gray-400 group-hover/layer:text-[#6366F1]" />;
    }

    switch (typeLower) {
      case 'g': return <Folder size="0.85vw" className="text-gray-400 group-hover/layer:text-[#6366F1]" />;
      case 'text': return <Type size="0.85vw" className="text-gray-400 group-hover/layer:text-[#6366F1]" />;
      case 'rect': return <Square size="0.85vw" className="text-gray-400 group-hover/layer:text-[#6366F1]" />;
      case 'circle':
      case 'ellipse': return <Circle size="0.85vw" className="text-gray-400 group-hover/layer:text-[#6366F1]" />;
      case 'triangle':
      case 'path': return <Triangle size="0.85vw" className="text-gray-400 group-hover/layer:text-[#6366F1]" />;
      case 'star': return <Star size="0.85vw" className="text-gray-400 group-hover/layer:text-[#6366F1]" />;
      case 'line': return <Minus size="0.85vw" className="text-gray-400 group-hover/layer:text-[#6366F1]" />;
      default: return <Layers size="0.85vw" className="text-gray-400 group-hover/layer:text-[#6366F1]" />;
    }
  };

  const isPdfBackgroundLayer = (layer.name && layer.name.toLowerCase().endsWith('-pdf')) || layer.name === 'PDF Background' || layer['data-type'] === 'pdf-background';

  const handleItemClick = (e) => {
    e.stopPropagation();
    if (isPdfBackgroundLayer) return;
    
    const targetId = layer.isVirtualImageChild ? layer.parentId : layer.id;

    if (e.shiftKey) {
      // ── Shift+Click: Multi-select block ───────────────────────────────────
      const newSet = new Set(multiSelectedIds);
      if (newSet.has(targetId)) newSet.delete(targetId);
      else newSet.add(targetId);
      if (setMultiSelectedIds) setMultiSelectedIds(newSet);
    } else {
      // ── Plain click: single select, clear multi-selection ─────────────
      if (setSelectedLayerId) setSelectedLayerId(targetId);
      if (setMultiSelectedIds) setMultiSelectedIds(new Set([targetId]));
      if (isGroup) setIsOpen(!isOpen);
    }
  };

const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isPdfBackgroundLayer) return;
    if (onLayerContextMenu) {
      const targetId = layer.isVirtualImageChild ? layer.parentId : layer.id;
      onLayerContextMenu(targetId, e.clientX, e.clientY);
    }
  };

  const handleDragStart = (e) => {
    if (layer.isVirtualImageChild || isPdfBackgroundLayer) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', JSON.stringify({ pageIndex, layerId: layer.id }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    if (data.pageIndex === pageIndex && onReorderLayer) {
      onReorderLayer(pageIndex, data.layerId, layer.id);
    }
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (layer.isVirtualImageChild || isPdfBackgroundLayer) return; // Disallow renaming effect layers and PDF Backgrounds
    setIsEditing(true);
  };

  const handleRenameSubmit = () => {
    if (editName.trim() !== '' && editName !== layer.name) {
      renameLayer(pageIndex, layer.id, editName);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleRenameSubmit();
    if (e.key === 'Escape') setIsEditing(false);
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <div className="flex flex-col select-none">
      <div
        ref={itemRef}
        draggable={!isEditing && !isPdfBackgroundLayer}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex items-center gap-[0.4vw] py-[0.5vh] pr-[0.5vw] rounded-[0.3vw] group/layer transition-all border-l-2 ${isDragOver ? 'border-l-[#6366F1] bg-[#EEF2FF]' : 'border-l-transparent'
          } ${isSelected
            ? 'bg-[#E0E7FF] ring-1 ring-[#6366F1]/30'   // primary selection — solid indigo tint
            : layer.id === currentFrameId
              ? 'bg-[#F5F3FF] border-l-[#A78BFA] ring-1 ring-dashed ring-[#A78BFA]/50' // Entered Frame style
              : isMultiOnly
                ? 'bg-[#EEF2FF]'                             // part of multi-set — lighter tint
                : isPdfBackgroundLayer
                  ? 'opacity-60 cursor-not-allowed bg-gray-50' // Unselectable styling for PDF Background
                  : 'hover:bg-[#F3F4F6] cursor-pointer'
          }`}
        style={{ paddingLeft: `${depth * 0.8 + 0.5}vw` }}
        onClick={handleItemClick}
        onContextMenu={handleContextMenu}
      >
        {/* Expand/Collapse Chevron */}
        <div className="w-[1vw] flex items-center justify-center">
          {isGroup && (
            isOpen ? <ChevronDown size="0.7vw" className="text-gray-400" /> : <ChevronRight size="0.7vw" className="text-gray-400" />
          )}
        </div>

        {/* Layer Type Icon */}
        <div className="w-[1.2vw] h-[1.2vw] flex items-center justify-center">
          {getLayerIcon()}
        </div>

        {/* Layer Name */}
        <div className="flex-1 min-w-0" onDoubleClick={handleDoubleClick}>
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="block w-full bg-transparent p-0 m-0 border-b border-none outline-none focus:outline-none focus:ring-0 text-[0.7vw] font-medium text-gray-900"
            />
          ) : (
            <span className="block text-[0.7vw] font-medium text-gray-700 truncate group-hover/layer:text-[#111827]">
              {layer.name}
            </span>
          )}
        </div>

        {/* Selection indicator dot - only for primary selection */}
        {selectedLayerId === layer.id && (
          <div className="w-[0.4vw] h-[0.4vw] rounded-full bg-[#6366F1] flex-shrink-0" title="Primary selection" />
        )}

        {/* Secondary Visibility/Lock Status (Small) */}
        {!isBaseLayer && (
          <div className="flex items-center gap-[0.3vw]">
          <button
            className={`text-gray-400 hover:text-indigo-600 transition-opacity ${layer.visible === false ? 'opacity-100' : 'opacity-0 group-hover/layer:opacity-100'}`}
            onClick={(e) => {
              e.stopPropagation();
              const targetId = layer.isVirtualImageChild ? layer.parentId : layer.id;
              const ids = multiSelectedIds.has(targetId) ? Array.from(multiSelectedIds) : [targetId];
              onToggleVisibility && onToggleVisibility(ids);
            }}
          >
            {layer.visible === false ? <EyeOff size="0.7vw" /> : <Eye size="0.7vw" />}
          </button>
          <button
            className={`text-gray-400 hover:text-indigo-600 transition-opacity ${layer.locked === true ? 'opacity-100' : 'opacity-0 group-hover/layer:opacity-100'}`}
            onClick={(e) => {
              e.stopPropagation();
              const targetId = layer.isVirtualImageChild ? layer.parentId : layer.id;
              const ids = multiSelectedIds.has(targetId) ? Array.from(multiSelectedIds) : [targetId];
              onToggleLock && onToggleLock(ids);
            }}
          >
            {layer.locked === true ? <Lock size="0.7vw" /> : <Unlock size="0.7vw" />}
          </button>
        </div>
        )}
      </div>

      <AnimatePresence>
        {isGroup && isOpen && layer.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex flex-col overflow-hidden"
          >
            {[...layer.children].filter(c => c.name !== 'Free Frame' && !c.name?.toLowerCase().startsWith('hotspot-')).reverse().map((child, idx) => (
              <LayerItem
                key={child.id || idx}
                layer={child}
                depth={depth + 1}
                onToggleVisibility={onToggleVisibility}
                onToggleLock={onToggleLock}
                selectedLayerId={selectedLayerId}
                setSelectedLayerId={setSelectedLayerId}
                multiSelectedIds={multiSelectedIds}
                setMultiSelectedIds={setMultiSelectedIds}
                renameLayer={renameLayer}
                pageIndex={pageIndex}
                onLayerContextMenu={onLayerContextMenu}
                onReorderLayer={onReorderLayer}
                currentFrameId={currentFrameId}
                setCurrentFrameId={setCurrentFrameId}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main Layer Component ---
const Layer = ({
  pages,
  activePageIndex,
  setActivePageIndex,
  isDoublePage,
  insertPageAfter,
  duplicatePage,
  renamePage,
  renameLayer,
  deletePage,
  movePageUp,
  movePageDown,
  movePageToFirst,
  movePageToLast,
  movePage,
  clearPage,
  togglePageVisibility,
  onOpenTemplateModal,
  toggleLayerVisibility,
  toggleLayerLock,
  bringLayerToFront,
  sendLayerToBack,
  moveLayerForward,
  moveLayerBackward,
  reorderLayer,
  deleteLayer,
  copyLayer,
  cutLayer,
  pasteLayer,
  duplicateLayer,
  selectedLayerId,
  setSelectedLayerId,
  multiSelectedIds = new Set(),
  setMultiSelectedIds,
  currentFrameId,
  setCurrentFrameId,
  clipboard,
  currentBook,
  setCurrentBook,
  onSave,
  onAddFile,
  onReplaceFile,
  isExportModalOpen
}) => {
  const navigate = useNavigate();
  const { folder, v_id } = useParams();
  const { hasUnsavedChanges } = useOutletContext() || {};
  const [activeLayerMenu, setActiveLayerMenu] = useState(null); // { layerId, x, y }
  const layerMenuRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const isPdfProject = pages.some(p => p.html && (
    p.html.includes('data-name="PDF Background"') ||
    p.html.includes('PDF Background') ||
    p.html.includes('pdf-vector-layer') ||
    p.html.includes('Document Shield')
  )) || Boolean(currentBook?.type === 'pdf' || (currentBook?.flipbookName && currentBook.flipbookName.toLowerCase().startsWith('pdf_')));
  const [activeTab, setActiveTab] = useState(isPdfProject ? 'pages' : 'layers');

  useEffect(() => {
    if (isPdfProject && activeTab !== 'pages') {
      setActiveTab('pages');
    }
  }, [isPdfProject, activeTab]);

  // Menu State
  const [activeMenuPageId, setActiveMenuPageId] = useState(null);
  const menuRef = useRef(null);

  // Renaming State
  const [editingPageId, setEditingPageId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const renameInputRef = useRef(null);

  // Drag Reorder State
  const [draggedPageIndex, setDraggedPageIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Use a motion value for persistent Y
  const y = useMotionValue(0);

  // Rename Validation State
  const [allBooks, setAllBooks] = useState([]);
  const [isNameDuplicate, setIsNameDuplicate] = useState(false);
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'error'
  });

  const handleGoToCustomize = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm("Leave site?\n\nChanges you made may not be saved.")) {
        return;
      }
    }
    const path = folder
      ? `/editor/customized_editor/${folder}/${v_id}`
      : `/editor/customized_editor/${v_id}`;
    navigate(path);
  };

  const nameInputRef = useRef(null);

  // Listen for export modal opening to switch to page tab and back
  const [previousTab, setPreviousTab] = useState(null);

  useEffect(() => {
    if (isExportModalOpen) {
      setPreviousTab(activeTab);
      setActiveTab('pages');
      setIsVisible(true);
    } else if (previousTab && !isPdfProject) {
      setActiveTab(previousTab);
      setPreviousTab(null);
    }
  }, [isExportModalOpen, isPdfProject]);

  // Auto-scroll to active page
  const activePageId = pages[activePageIndex]?.id;
  useEffect(() => {
    if (activePageId && isVisible) {
      const elementId = activeTab === 'layers' 
        ? `page-card-${activePageId}` 
        : `page-card-preview-${activePageId}`;
      
      const el = document.getElementById(elementId);
      if (el) {
        // Small timeout for layout stabilization
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
      }
    }
  }, [activePageId, activeTab, isVisible]);

  // Switch to layers tab when an element is selected on canvas
  const prevSelectedLayerIdRef = useRef(selectedLayerId);
  useEffect(() => {
    const isRootLayer = pages.some(p => p.layers?.[0]?.id === selectedLayerId);
    if (selectedLayerId && !isRootLayer && selectedLayerId !== prevSelectedLayerIdRef.current && activeTab === 'pages' && !isPdfProject) {
      setActiveTab('layers');
    }
    prevSelectedLayerIdRef.current = selectedLayerId;
  }, [selectedLayerId, isPdfProject, pages, activeTab]);

  // Fetch all books for uniqueness validation
  useEffect(() => {
    const fetchBooks = async () => {
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      if (user?.emailId) {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        try {
          const res = await axios.get(`${backendUrl}/api/flipbook/list`, { params: { emailId: user.emailId } });
          if (res.data && res.data.books) {
            setAllBooks(res.data.books);
          }
        } catch (err) {
          console.error("Error fetching books for validation:", err);
        }
      }
    };
    fetchBooks();
  }, []);


  const checkDuplicate = (name) => {
    if (!name.trim()) return false;
    const isDup = allBooks.some(b =>
      b.title.toLowerCase() === name.trim().toLowerCase() &&
      (currentBook?.v_id ? b.v_id !== currentBook.v_id : b.realName !== currentBook?.flipbookName)
    );
    setIsNameDuplicate(isDup);
    return isDup;
  };

  // Sync check: if activePageIndex is out of bounds, reset it
  useEffect(() => {
    if (pages && pages.length > 0 && activePageIndex >= pages.length) {
      setActivePageIndex(0);
    }
  }, [pages, activePageIndex]);

  // Force activeTab to 'pages' if it's a PDF project and user somehow switches (though UI is hidden)
  useEffect(() => {
    if (isPdfProject && activeTab !== 'pages') {
      setActiveTab('pages');
    }
  }, [isPdfProject, activeTab]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuPageId(null);
      }
      if (layerMenuRef.current && !layerMenuRef.current.contains(event.target)) {
        setActiveLayerMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for canvas context menu trigger
  useEffect(() => {
    const handleCanvasContextMenu = (event) => {
      const { e, layerId, isOverlay } = event.detail;
      setActiveLayerMenu({ layerId, x: e.clientX, y: e.clientY, isOverlay });
    };
    window.addEventListener('show-layer-context-menu', handleCanvasContextMenu);
    return () => window.removeEventListener('show-layer-context-menu', handleCanvasContextMenu);
  }, []);

  const handleLayerContextMenu = (layerId, x, y) => {
    setActiveLayerMenu({ layerId, x, y });
  };

  // Determine if a page index should be expanded/active in the sidebar
  const checkIsExpanded = (index) => {
    if (!isDoublePage) return activePageIndex === index;
    if (activePageIndex === 0) return index === 0;

    // Spread Logic: Odd index is Left, Even index is Right
    // Find the left-side index of the current spread
    const spreadStart = activePageIndex % 2 === 0 ? activePageIndex - 1 : activePageIndex;

    // Check if both sides of the spread exist
    if (spreadStart > 0 && spreadStart + 1 < pages.length) {
      return index === spreadStart || index === spreadStart + 1;
    }

    return activePageIndex === index;
  };

  const handleMenuClick = (e, pageId) => {
    e.stopPropagation();
    setActiveMenuPageId(activeMenuPageId === pageId ? null : pageId);
  };

  const handleRenameStart = (e, page) => {
    setEditingPageId(page.id);
    setEditingName(page.name);
    setActiveMenuPageId(null);
  };

  const handleRenameSubmit = (pageId) => {
    if (editingName.trim()) {
      renamePage(pageId, editingName.trim());
    }
    setEditingPageId(null);
  };

  const handleRenameCancel = () => {
    setEditingPageId(null);
    setEditingName('');
  };

  // Drag Handlers
  const handleDragStart = (e, index) => {
    setDraggedPageIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedPageIndex !== null && draggedPageIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedPageIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    if (draggedPageIndex !== null && draggedPageIndex !== index) {
      movePage(draggedPageIndex, index);
    }
    setDraggedPageIndex(null);
    setDragOverIndex(null);
  };

  return (
    <motion.div
      initial={false}
      animate={{ width: isVisible ? '16vw' : '0vw' }}
      className="relative h-[92vh] bg-white border-r border-[#EEEEEE] overflow-visible flex-shrink-0"
    >
      {/* Floating Button Drag Area (Hidden when sidebar is open) */}
      {!isVisible && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[85vh] w-[2.5vw] z-50 pointer-events-none flex items-center justify-center">
          <motion.div
            drag="y"
            dragConstraints={{ top: -300, bottom: 300 }}
            dragElastic={0}
            dragMomentum={false}
            style={{ y }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => {
              setTimeout(() => setIsDragging(false), 100);
            }}
            onClick={() => {
              if (!isDragging) {
                setIsVisible(true);
              }
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="pointer-events-auto cursor-pointer group select-none relative"
          >
            <svg width="2.5vw" height="auto" viewBox="0 0 60 82" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg filter transition-transform duration-300">
              <path d="M0 0C0 11.5 10 11.5 10 11.5H48C54.6274 11.5 60 16.8726 60 23.5V59.5C60 66.1274 54.6274 71.5 48 71.5H10C10 71.5 0 71.5 0 82C0 80 0 1.5 0 0Z" fill="black" />
              <path d="M22.979 35.315C20.993 36.109 20 36.506 20 37C20 37.4925 20.987 37.8876 22.961 38.6778L22.979 38.685L25.787 39.809C27.773 40.603 28.767 41 30 41C31.233 41 32.227 40.603 34.213 39.809L37.021 38.685C39.007 37.891 40 37.494 40 37C40 36.5075 39.013 36.1124 37.039 35.3222L37.021 35.315L34.213 34.192C32.227 33.397 31.233 33 30 33C29.046 33 28.236 33.237 27 33.712L22.979 35.315Z" fill="white" />
              <path d="M40 41C40 41 39.007 41.89 37.021 42.685L34.213 43.809C32.227 44.603 31.233 45 30 45C28.767 45 27.773 44.603 25.787 43.809L22.98 42.685C20.993 41.891 20 41 20 41M20 45C20 45 20.993 45.89 22.979 46.685L25.787 47.809C27.773 48.603 28.767 49 30 49C30.954 49 31.764 48.763 33 48.288M37.021 46.685C39.007 45.891 40 45 40 45M22.979 38.685L25.787 39.809C27.773 40.603 28.767 41 30 41C31.233 41 32.227 40.603 34.213 39.809L37.021 38.685C39.007 37.891 40 37.494 40 37C40 36.5075 39.013 36.1124 37.039 35.3222M22.979 38.685L22.961 38.6778M22.979 38.685C22.973 38.6826 22.967 38.6802 22.961 38.6778M37.021 35.315L34.213 34.192C32.227 33.397 31.233 33 30 33C29.046 33 28.236 33.237 27 33.712L22.979 35.315C20.993 36.109 20 36.506 20 37C20 37.4925 20.987 37.8876 22.961 38.6778M37.021 35.315L37.039 35.3222M37.021 35.315C37.027 35.3174 37.033 35.3198 37.039 35.3222" stroke="white" stroke-width="1.125" stroke-linecap="round" />
            </svg>
          </motion.div>
        </div>
      )}

      {/* Layer Context Menu (createPortal) */}
      {activeLayerMenu && createPortal(
        <AnimatePresence>
          <motion.div
            key="layer-context-menu"
            ref={layerMenuRef}
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={(() => {
              // Safely clamp the menu within the viewport
              // Menu width is roughly 10vw, height is estimated higher to accommodate new options
              const menuWidth = window.innerWidth * 0.11;
              const menuHeight = 450;
              return {
                position: 'fixed',
                left: `${Math.min(activeLayerMenu.x, window.innerWidth - menuWidth)}px`,
                top: `${Math.min(activeLayerMenu.y, window.innerHeight - menuHeight)}px`
              };
            })()}
            className="w-[10vw] bg-white rounded-[0.8vw] shadow-2xl border border-gray-100 p-[0.4vw] z-[9999] flex flex-col gap-[0.2vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const targetIds = multiSelectedIds.has(activeLayerMenu.layerId)
                ? Array.from(multiSelectedIds)
                : [activeLayerMenu.layerId];

              const page = pages[activePageIndex];
              const clickedLayerName = page?.layers?.find(l => l.id === activeLayerMenu.layerId)?.name;
              
              const realLayers = page?.layers ? page.layers.filter(l => l.name !== 'Free Frame' && !l.name?.toLowerCase().startsWith('hotspot-')) : [];
              const rootGroupLayer = (realLayers.length === 1 && (realLayers[0].name === page?.name || realLayers[0].name?.startsWith('Page '))) ? realLayers[0] : null;
              
              const isPageBackground = activeLayerMenu.isOverlay || 
                                       (page && activeLayerMenu.layerId === page.id) || 
                                       clickedLayerName === 'Free Frame' || clickedLayerName?.toLowerCase().startsWith('hotspot-') ||
                                       (rootGroupLayer && activeLayerMenu.layerId === rootGroupLayer.id);

              const isRootLayer = isPageBackground ||
                (page && page.layers && page.layers.some(l => l.id === activeLayerMenu.layerId));

              if (isRootLayer) {
                let pageLayerIds = [];
                if (rootGroupLayer) {
                  pageLayerIds = (rootGroupLayer.children || []).filter(c => c.name !== 'Free Frame' && !c.name?.toLowerCase().startsWith('hotspot-')).map(l => l.id);
                } else {
                  pageLayerIds = realLayers.map(l => l.id);
                }
                
                const cutCopyTargets = isPageBackground ? pageLayerIds : targetIds;
                const disableCutCopy = isPageBackground && cutCopyTargets.length === 0;

                return (
                  <>
                    <button
                      disabled={disableCutCopy}
                      onClick={() => {
                        cutLayer(activePageIndex, cutCopyTargets);
                        setActiveLayerMenu(null);
                      }}
                      className={`flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium rounded-[0.4vw] text-left transition-colors ${disableCutCopy ? 'text-gray-400 cursor-not-allowed grayscale-[0.5] opacity-60' : 'text-gray-700 hover:bg-gray-50 cursor-pointer'}`}
                    >
                      <Scissors size="0.9vw" /> Cut
                    </button>
                    <button
                      disabled={disableCutCopy}
                      onClick={() => {
                        copyLayer(activePageIndex, cutCopyTargets);
                        setActiveLayerMenu(null);
                      }}
                      className={`flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium rounded-[0.4vw] text-left transition-colors ${disableCutCopy ? 'text-gray-400 cursor-not-allowed grayscale-[0.5] opacity-60' : 'text-gray-700 hover:bg-gray-50 cursor-pointer'}`}
                    >
                      <Copy size="0.9vw" /> Copy
                    </button>
                    <button
                      disabled={!clipboard || (Array.isArray(clipboard) && clipboard.length === 0)}
                      onClick={() => {
                        pasteLayer(activePageIndex);
                        setActiveLayerMenu(null);
                      }}
                      className={`flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium rounded-[0.4vw] text-left transition-colors ${(!clipboard || (Array.isArray(clipboard) && clipboard.length === 0))
                        ? 'text-gray-400 cursor-not-allowed grayscale-[0.5] opacity-60'
                        : 'text-gray-700 hover:bg-gray-50 cursor-pointer'
                        }`}
                    >
                      <Clipboard size="0.9vw" /> Paste
                    </button>
                    {!isPageBackground && (
                      <button
                        onClick={() => {
                          if (duplicateLayer) duplicateLayer(activePageIndex, cutCopyTargets);
                          setActiveLayerMenu(null);
                        }}
                        className={`flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium rounded-[0.4vw] text-left transition-colors text-gray-700 hover:bg-gray-50 cursor-pointer`}
                      >
                        <Copy size="0.9vw" /> Duplicate
                      </button>
                    )}

                    {isPageBackground && (
                      <>
                        <div className="h-px bg-gray-100 my-[0.2vw]"></div>
                        {!isPdfProject && (
                          <button
                            onClick={() => { insertPageAfter && insertPageAfter(activePageIndex); setActiveLayerMenu(null); }}
                            className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium rounded-[0.4vw] text-left transition-colors text-gray-700 hover:bg-gray-50 cursor-pointer"
                          >
                            <Plus size="0.9vw" /> Add Page
                          </button>
                        )}
                        <button
                          onClick={() => { onAddFile && onAddFile(activePageIndex); setActiveLayerMenu(null); }}
                          className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium rounded-[0.4vw] text-left transition-colors text-gray-700 hover:bg-gray-50 cursor-pointer"
                        >
                          <FilePlus size="0.9vw" /> Add File
                        </button>
                        <button
                          onClick={() => { duplicatePage && duplicatePage(activePageIndex); setActiveLayerMenu(null); }}
                          className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium rounded-[0.4vw] text-left transition-colors text-gray-700 hover:bg-gray-50 cursor-pointer"
                        >
                          <Copy size="0.9vw" /> Duplicate
                        </button>
                        {!isPdfProject && (
                          <button
                            onClick={() => { onOpenTemplateModal && onOpenTemplateModal(activePageIndex); setActiveLayerMenu(null); }}
                            className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium rounded-[0.4vw] text-left transition-colors text-gray-700 hover:bg-gray-50 cursor-pointer"
                          >
                            <Layout size="0.9vw" /> Template
                          </button>
                        )}
                        <div className="h-px bg-gray-100 my-[0.2vw]"></div>
                        {!isPdfProject && (
                          <button
                            onClick={() => { clearPage && clearPage(activePageIndex); setActiveLayerMenu(null); }}
                            className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium rounded-[0.4vw] text-left transition-colors text-gray-700 hover:bg-gray-50 cursor-pointer"
                          >
                            <Ban size="0.9vw" /> Clear
                          </button>
                        )}
                        <button
                          onClick={() => { deletePage && deletePage(activePageIndex); setActiveLayerMenu(null); }}
                          className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium rounded-[0.4vw] text-left transition-colors text-red-500 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 size="0.9vw" /> Delete
                        </button>
                      </>
                    )}
                  </>
                );
              }

              const hasGroup = targetIds.some(id => {
                const el = document.getElementById(id);
                if (!el || el.tagName.toLowerCase() !== 'g') return false;
                const isMedia = el.getAttribute('data-is-image-group') || el.getAttribute('data-is-video-group') || el.getAttribute('data-is-gif-group');
                return !isMedia;
              });
              const canUngroup = hasGroup;
              const canGroup = targetIds.length > 0 && !(targetIds.length === 1 && hasGroup);

              return (
                <>
                  {multiSelectedIds.size <= 1 && (
                    <>
                      <button
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('trigger-rename-layer', { detail: { layerId: activeLayerMenu.layerId } }));
                          setActiveLayerMenu(null);
                        }}
                        className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"
                      >
                        <Edit2 size="0.9vw" /> Rename
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => {
                      if (!canGroup) return;
                      window.dispatchEvent(new CustomEvent('trigger-group'));
                      setActiveLayerMenu(null);
                    }}
                    disabled={!canGroup}
                    className={`flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium rounded-[0.4vw] text-left ${
                      !canGroup ? 'text-gray-400 cursor-not-allowed opacity-60' : 'text-gray-700 hover:bg-gray-50 cursor-pointer'
                    }`}
                  >
                    <Icon icon="mdi-light:group" className="w-[0.9vw] h-[0.9vw] min-w-[0.9vw] min-h-[0.9vw]" />
                    Group
                  </button>
                  <button
                    onClick={() => {
                      if (!canUngroup) return;
                      window.dispatchEvent(new CustomEvent('trigger-ungroup'));
                      setActiveLayerMenu(null);
                    }}
                    disabled={!canUngroup}
                    className={`flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium rounded-[0.4vw] text-left ${
                      !canUngroup ? 'text-gray-400 cursor-not-allowed opacity-60' : 'text-gray-700 hover:bg-gray-50 cursor-pointer'
                    }`}
                  >
                    <Icon icon="mdi-light:ungroup" className="w-[0.9vw] h-[0.9vw] min-w-[0.9vw] min-h-[0.9vw]" />
                    Ungroup
                  </button>

                  <div className="h-px bg-gray-100 my-[0.2vw]"></div>

                  <button
                    onClick={() => {
                      moveLayerForward(activePageIndex, targetIds);
                      setActiveLayerMenu(null);
                    }}
                    className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"
                  >
                    <ArrowUp size="0.9vw" /> Move Front
                  </button>
                  <button
                    onClick={() => {
                      moveLayerBackward(activePageIndex, targetIds);
                      setActiveLayerMenu(null);
                    }}
                    className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"
                  >
                    <ArrowDown size="0.9vw" /> Move Back
                  </button>
                  <button
                    onClick={() => {
                      bringLayerToFront(activePageIndex, targetIds);
                      setActiveLayerMenu(null);
                    }}
                    className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"
                  >
                    <ArrowUpToLine size="0.9vw" /> Bring to front
                  </button>
                  <button
                    onClick={() => {
                      sendLayerToBack(activePageIndex, targetIds);
                      setActiveLayerMenu(null);
                    }}
                    className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"
                  >
                    <ArrowDownToLine size="0.9vw" /> Send to back
                  </button>

                  <div className="h-px bg-gray-100 my-[0.2vw]"></div>

                  <button
                    onClick={() => {
                      cutLayer(activePageIndex, targetIds);
                      setActiveLayerMenu(null);
                    }}
                    className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"
                  >
                    <Scissors size="0.9vw" /> Cut
                  </button>
                  <button
                    onClick={() => {
                      copyLayer(activePageIndex, targetIds);
                      setActiveLayerMenu(null);
                    }}
                    className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"
                  >
                    <Copy size="0.9vw" /> Copy
                  </button>
                  <button
                    disabled={!clipboard || (Array.isArray(clipboard) && clipboard.length === 0)}
                    onClick={() => {
                      pasteLayer(activePageIndex);
                      setActiveLayerMenu(null);
                    }}
                    className={`flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium rounded-[0.4vw] text-left transition-colors ${(!clipboard || (Array.isArray(clipboard) && clipboard.length === 0))
                      ? 'text-gray-400 cursor-not-allowed grayscale-[0.5] opacity-60'
                      : 'text-gray-700 hover:bg-gray-50 cursor-pointer'
                      }`}
                  >
                    <Clipboard size="0.9vw" /> Paste
                  </button>
                  <button
                    onClick={() => {
                      if (duplicateLayer) duplicateLayer(activePageIndex, targetIds);
                      setActiveLayerMenu(null);
                    }}
                    className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"
                  >
                    <Copy size="0.9vw" /> Duplicate
                  </button>

                  <div className="h-px bg-gray-100 my-[0.2vw]"></div>

                  <button
                    onClick={() => {
                      deleteLayer(activePageIndex, targetIds);
                      setActiveLayerMenu(null);
                    }}
                    className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-red-500 hover:bg-red-50 rounded-[0.4vw] text-left cursor-pointer"
                  >
                    <Trash2 size="0.9vw" /> Delete
                  </button>
                </>
              );
            })()}
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Sidebar Content */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col px-[0.8vw] pb-[1.5vh] select-none h-full w-[16vw] overflow-hidden"
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between px-[0.2vw] flex-shrink-0" style={{ height: '8vh', gap: '0.8vw' }}>
              <div className={`flex-1 min-w-0 flex items-center bg-[#F1F3F4] px-[0.6vw] py-[0.5vh] rounded-[0.5vw] border transition-all ${isNameDuplicate ? 'border-red-500 bg-red-50' : 'border-transparent focus-within:border-indigo-400 focus-within:bg-white'
                }`}>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={currentBook?.flipbookName || ''}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setCurrentBook(prev => ({ ...(prev || {}), flipbookName: newName }));
                    checkDuplicate(newName);
                  }}
                  onBlur={() => {
                    if (isNameDuplicate) {
                      setAlertState({
                        isOpen: true,
                        title: 'Duplicate Name',
                        message: 'Book name already exists. Please choose a different name.',
                        type: 'error'
                      });
                      if (nameInputRef.current) nameInputRef.current.select();
                    } else if (onSave) {
                      onSave(false);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (isNameDuplicate) {
                        setAlertState({
                          isOpen: true,
                          title: 'Duplicate Name',
                          message: 'Book name already exists. Please choose a different name.',
                          type: 'error'
                        });
                        if (nameInputRef.current) nameInputRef.current.select();
                      } else {
                        e.target.blur();
                        if (onSave) onSave(true);
                      }
                    }
                  }}
                  className={`w-full bg-transparent border-none outline-none text-[0.75vw] font-bold truncate ${isNameDuplicate ? 'text-red-600 placeholder-red-300' : 'text-[#374151] placeholder-gray-400'
                    }`}
                  placeholder="Flipbook Name..."
                />
              </div>
              <button
                onClick={() => setIsVisible(false)}
                className="text-[#374151] hover:bg-gray-100 p-[0.4vw] rounded-full transition-colors flex items-center justify-center cursor-pointer"
              >
                <ArrowLeft size="1.2vw" strokeWidth={2.5} />
              </button>
            </div>

            {/* Tabs for Pages and Layers */}
            {!isPdfProject && (
              <div className="flex bg-gray-100/50 p-[0.4vw] rounded-[0.8vw] mb-[2vh] gap-[0.4vw]">
                <button
                  onClick={() => {
                    setActiveTab('pages');
                    setSelectedLayerId(null);
                    setMultiSelectedIds(new Set());
                  }}
                  className={`flex-1 py-[0.8vh] rounded-[0.6vw] text-[0.8vw] font-semibold transition-all ${activeTab === 'pages'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                  Pages
                </button>
                <button
                  onClick={() => setActiveTab('layers')}
                  className={`flex-1 py-[0.8vh] rounded-[0.6vw] text-[0.8vw] font-semibold transition-all ${activeTab === 'layers'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                  Layers
                </button>
              </div>
            )}
            <div className="h-[1px] bg-[#EEEEEE] mx-[-0.8vw] mb-[2vh]"></div>

            {/* Scrollable Area for Pages and Layers */}
            <div
              className="flex-1 overflow-y-auto pr-[0.2vw] space-y-[1.2vh] no-scrollbar pb-[2vh]"
              onClick={() => setActiveMenuPageId(null)}
            >
              {(!isPdfProject && activeTab === 'layers') ?
                pages.map((page, index) => {
                  const isExpanded = checkIsExpanded(index);

                  return (
                    <div
                      key={page.id}
                      className="flex flex-col relative"
                      id={`page-card-${page.id}`}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      {/* Rebuild Indicator (Top) */}
                      {dragOverIndex === index && draggedPageIndex !== index && draggedPageIndex > index && (
                        <div className="absolute -top-[0.4vh] left-0 right-0 h-[0.2vw] bg-indigo-500 rounded-full z-10" />
                      )}

                      <motion.div
                        layout="position"
                        className={`flex flex-col rounded-[0.6vw] transition-all duration-300 relative group 
                          ${draggedPageIndex === index ? 'opacity-40 scale-[0.98]' : ''} 
                          ${isExpanded
                            ? 'bg-white border border-[#E5E7EB] shadow-sm'
                            : 'bg-[#E5E7EB] hover:bg-[#DADADA]'
                          }`}
                      >
                        {/* Page Header (Collapsible) */}
                        <div
                          draggable={!editingPageId}
                          onDragStart={(e) => handleDragStart(e, index)}
                          onClick={() => {
                            if (editingPageId === page.id) return;
                            if (isDoublePage) {
                              if (index === 0) {
                                setActivePageIndex(0);
                              } else if (index === pages.length - 1) {
                                setActivePageIndex(index);
                              } else {
                                const potentialStart = index % 2 === 0 ? index - 1 : index;
                                const isStartASpread = potentialStart > 0 && potentialStart + 1 < pages.length - 1;
                                if (isStartASpread) {
                                  setActivePageIndex(potentialStart);
                                } else {
                                  setActivePageIndex(index);
                                }
                              }
                            } else {
                              setActivePageIndex(index);
                            }
                            const rootId = page.layers?.[0]?.id;
                            if (rootId) {
                              if (setSelectedLayerId) setSelectedLayerId(rootId);
                              if (setMultiSelectedIds) setMultiSelectedIds(new Set([rootId]));
                              if (setCurrentFrameId) setCurrentFrameId(rootId);
                            }
                          }}
                          onContextMenu={(e) => handleMenuClick(e, page.id)}
                          className="flex items-center py-[1.2vh] px-[1vw] relative group/pageitem"
                        >
                          {!editingPageId && (
                            <div className="absolute left-[0.2vw] overflow-hidden transition-all duration-300 w-0 group-hover/pageitem:w-[1.2vw] opacity-0 group-hover/pageitem:opacity-100 flex items-center justify-center pointer-events-none">
                              <GripVertical size="1vw" className="text-gray-400" />
                            </div>
                          )}

                          <div className={`flex-1 min-w-0 flex items-center transition-all duration-300 ${!editingPageId ? 'group-hover/pageitem:pl-[0.8vw]' : ''}`}>
                            {editingPageId === page.id ? (
                              <input
                                ref={renameInputRef}
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onBlur={() => handleRenameSubmit(page.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleRenameSubmit(page.id);
                                  if (e.key === 'Escape') handleRenameCancel();
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onFocus={(e) => e.target.select()}
                                autoFocus
                                className="w-full text-left text-[0.85vw] font-semibold border-b border-indigo-600 py-[0.1vw] focus:outline-none bg-transparent"
                              />
                            ) : (
                                <span className={`text-[0.85vw] font-semibold truncate tracking-tight transition-colors duration-300 ${page.isHidden ? 'text-gray-400' : (isExpanded ? 'text-[#111827]' : 'text-[#4B5563]')}`}>
                                  {page.name}
                                </span>
                            )}
                          </div>

                          <div className="flex items-center gap-[0.4vw] flex-shrink-0">
                            {page.isHidden && <EyeOff size="0.9vw" className="text-gray-400" />}
                            <Layers size="1.1vw" className={isExpanded ? 'text-[#6366F1]' : 'text-[#6B7280]'} strokeWidth={isExpanded ? 2.5 : 2} />
                            {!editingPageId && (
                              <button
                                onClick={(e) => handleMenuClick(e, page.id)}
                                className="p-[0.2vw] rounded-full transition-colors hover:bg-gray-200 flex items-center justify-center cursor-pointer"
                              >
                                <MoreVertical size="1.1vw" className="text-[#111827]" />
                              </button>
                            )}
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && !editingPageId && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2, ease: 'easeInOut' }}
                              className="overflow-hidden bg-white rounded-b-[0.6vw] border-t border-[#EEF2FF]"
                            >
                              <div className="py-[1vh] px-[0.6vw] flex flex-col gap-[0.2vh] max-h-[45vh] overflow-y-auto custom-scrollbar">
                                {page.isHidden ? (
                                  <div className="text-[0.75vw] text-gray-500 font-medium italic px-[0.8vw] py-[1vh] text-center bg-gray-50 rounded-[0.4vw]">
                                    Page is hidden
                                  </div>
                                ) : (() => {
                                  let effectiveLayers = (page.layers && page.layers.length > 0)
                                    ? page.layers
                                    : (pageCacheManager.getCachedLayers(page.id, page.html) || []);
                                  if ((!effectiveLayers || effectiveLayers.length === 0) && page.html) {
                                    try {
                                      const doc = new DOMParser().parseFromString(page.html, 'image/svg+xml');
                                      const svgEl = doc.querySelector('svg');
                                      if (svgEl) {
                                        effectiveLayers = parseLayersFromSVG(svgEl);
                                        pageCacheManager.setCachedLayers(page.id, page.html, effectiveLayers);
                                      }
                                    } catch (e) {}
                                  }
                                  const realLayers = (effectiveLayers || []).filter(l => l.name !== 'Free Frame' && !l.name?.toLowerCase().startsWith('hotspot-'));
                                  if (realLayers.length === 0) {
                                    return (
                                      <div className="text-[0.7vw] text-gray-400 italic px-[0.8vw] py-[0.5vh]">
                                        No layers found
                                      </div>
                                    );
                                  }
                                  const isSingleRoot = realLayers.length === 1;
                                  return [...realLayers].reverse().map((layer, idx) => {
                                    const isBaseLayer = isSingleRoot && (layer.name === page.name || layer.name?.startsWith('Page '));
                                    return (
                                      <LayerItem
                                        key={layer.id || idx}
                                        layer={layer}
                                        depth={0}
                                        isBaseLayer={isBaseLayer}
                                        onToggleVisibility={(layerId) => toggleLayerVisibility(index, layerId)}
                                        onToggleLock={(layerId) => toggleLayerLock(index, layerId)}
                                        selectedLayerId={selectedLayerId}
                                        setSelectedLayerId={setSelectedLayerId}
                                        multiSelectedIds={multiSelectedIds}
                                        setMultiSelectedIds={setMultiSelectedIds}
                                        renameLayer={renameLayer}
                                        pageIndex={index}
                                        onLayerContextMenu={handleLayerContextMenu}
                                        onReorderLayer={reorderLayer}
                                        currentFrameId={currentFrameId}
                                        setCurrentFrameId={setCurrentFrameId}
                                      />
                                    );
                                  });
                                })()}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>

                      {dragOverIndex === index && draggedPageIndex !== index && draggedPageIndex < index && (
                        <div className="absolute -bottom-[0.4vh] left-0 right-0 h-[0.2vw] bg-indigo-500 rounded-full z-10" />
                      )}
                    </div>
                  );
                })
                : (
                  <div className="flex flex-col gap-[2.5vh]">
                    {pages.map((page, index) => {
                      const viewBoxMatch = page.html ? page.html.match(/viewBox=["']\d+ \d+ (\d+(\.\d+)?) (\d+(\.\d+)?)["']/) : null;
                      const aspectRatio = viewBoxMatch ? parseFloat(viewBoxMatch[1]) / parseFloat(viewBoxMatch[3]) : 1 / 1.414;

                      const pdfImgMatch = page.html.match(/<image[^>]+(?:href|xlink:href)=["']([^"']+)["'][^>]*data-name=["']PDF Background["']/i) ||
                                          (!page.html.includes('<path') && page.html.match(/<g\b[^>]*data-name=["']PDF Background["'][^>]*>[\s\S]*?<image[^>]+(?:href|xlink:href)=["']([^"']+)["']/i));
                      const pdfImgUrl = pdfImgMatch ? pdfImgMatch[1] : null;

                      return (
                        <div
                          key={page.id}
                          className="flex flex-col relative"
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragLeave={handleDragLeave}
                          onDragEnd={handleDragEnd}
                          onDrop={(e) => handleDrop(e, index)}
                        >
                          {/* Drag Indicator Top */}
                          {dragOverIndex === index && draggedPageIndex !== index && draggedPageIndex > index && (
                            <div className="absolute -top-[1.25vh] left-0 right-0 h-[0.25vw] bg-indigo-500 rounded-full z-20 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                          )}

                          <div
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            className={`flex flex-col rounded-[1vw] overflow-hidden bg-white shadow-sm transition-all cursor-pointer relative border-[0.15vw] ${activePageIndex === index ? 'border-indigo-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
                              } ${draggedPageIndex === index ? 'opacity-40 grayscale-[0.5]' : ''}`}
                            id={`page-card-preview-${page.id}`}
                            onClick={() => {
                              setActivePageIndex(index);
                              const rootId = page.layers?.[0]?.id || pageCacheManager.getCachedLayers(page.id, page.html)?.[0]?.id;
                              if (rootId && setSelectedLayerId) {
                                setSelectedLayerId(rootId);
                                if (setMultiSelectedIds) setMultiSelectedIds(new Set([rootId]));
                                if (setCurrentFrameId) setCurrentFrameId(rootId);
                              }
                            }}
                          >
                            {/* Page Header */}
                            <div className={`flex items-center justify-between px-[1vw] py-[1vh] border-b transition-colors ${activePageIndex === index ? 'border-indigo-100 bg-[#EEF2FF]/50' : 'border-gray-100'
                              }`}>
                              <div className="flex-1 min-w-0 mr-[0.5vw]">
                                {editingPageId === page.id ? (
                                  <input
                                    ref={renameInputRef}
                                    type="text"
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    onBlur={() => handleRenameSubmit(page.id)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleRenameSubmit(page.id);
                                      if (e.key === 'Escape') handleRenameCancel();
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    onFocus={(e) => e.target.select()}
                                    autoFocus
                                    className="w-full text-left text-[0.8vw] font-semibold border-b border-indigo-600 py-[0.1vw] focus:outline-none bg-transparent"
                                  />
                                ) : (
                                  <span className={`text-[0.8vw] font-semibold text-gray-900 truncate block ${page.isHidden ? 'text-gray-400' : ''}`}>
                                    {page.name}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-[0.2vw]">
                                <button
                                  onClick={(e) => { e.stopPropagation(); togglePageVisibility && togglePageVisibility(index); }}
                                  className={`p-[0.4vw] hover:bg-gray-100 rounded-full transition-colors ${page.isHidden ? 'opacity-100' : 'opacity-0 group-hover/pageitem:opacity-100'} hover:opacity-100`}
                                  title={page.isHidden ? "Show Page" : "Hide Page"}
                                >
                                  {page.isHidden ? <EyeOff size="0.9vw" className="text-gray-500" /> : <Eye size="0.9vw" className="text-gray-400 hover:text-gray-600" />}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleMenuClick(e, page.id); }}
                                  className="p-[0.4vw] hover:bg-gray-100 rounded-full transition-colors"
                                >
                                  <MoreVertical size="1vw" className="text-gray-500" />
                                </button>
                              </div>
                            </div>

                            {/* Page Preview */}
                            <div
                              className={`relative flex items-center justify-center p-[1vw] overflow-hidden transition-all ${activePageIndex === index ? 'bg-[#EEF2FF]' : 'bg-gray-50'
                                }`}
                              style={{ aspectRatio: `${aspectRatio}` }}
                            >
                              <div className="w-full h-full bg-white shadow-sm overflow-hidden origin-top flex items-center justify-center relative">
                                <PageThumbnail page={page} index={index} activePageIndex={activePageIndex} />
                                {page.isHidden && (
                                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 pointer-events-none">
                                    <Icon icon="ant-design:eye-invisible-outlined" width="2vw" height="2vw" style={{ strokeWidth: 2.5 }} className="text-gray-500 svg-icon-override" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Drag Indicator Bottom */}
                          {dragOverIndex === index && draggedPageIndex !== index && draggedPageIndex < index && (
                            <div className="absolute -bottom-[1.25vh] left-0 right-0 h-[0.25vw] bg-indigo-500 rounded-full z-20 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

              {/* Shared Page Context Menu */}
              {activeMenuPageId && createPortal(
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`page-menu-${activeMenuPageId}`}
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    style={(() => {
                      // Try both ID types (Layer view and Preview view)
                      const element = document.getElementById(`page-card-${activeMenuPageId}`) ||
                        document.getElementById(`page-card-preview-${activeMenuPageId}`);
                      if (!element) return { display: 'none' };
                      
                      const rect = element.getBoundingClientRect();

                      return {
                        position: 'fixed',
                        left: `calc(${rect.right}px + 0.6vw)`,
                        maxHeight: 'calc(100vh - 20px)',
                        overflowY: 'auto',
                        transformOrigin: 'top left'
                      };
                    })()}
                    ref={(node) => {
                      // Preserve the existing menuRef for click-outside or other logic
                      if (menuRef) {
                        if (typeof menuRef === 'function') menuRef(node);
                        else menuRef.current = node;
                      }
                      if (!node) return;

                      const element = document.getElementById(`page-card-${activeMenuPageId}`) ||
                        document.getElementById(`page-card-preview-${activeMenuPageId}`);
                      if (!element) return;

                      // Use the ACTUAL rendered height of the menu
                      const actualHeight = node.scrollHeight;
                      const rect = element.getBoundingClientRect();
                      let topPos = rect.top;

                      // Shift up EXACTLY the amount needed if it overflows the bottom
                      if (topPos + actualHeight > window.innerHeight - 10) {
                        topPos = window.innerHeight - actualHeight - 10;
                      }

                      // Never overflow the top
                      if (topPos < 10) {
                        topPos = 10;
                      }

                      node.style.top = `${topPos}px`;
                    }}
                    className="w-[12vw] bg-white rounded-[0.8vw] shadow-2xl border border-gray-100 p-[0.4vw] z-[9999] flex flex-col gap-[0.2vw]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {(() => {
                      const index = pages.findIndex(p => p.id === activeMenuPageId);
                      const page = pages[index];
                      if (!page) return null;
                      return (
                        <>
                          <div className="px-[0.5vw] py-[0.2vw] text-[0.6vw] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-[0.5vw]">Page Settings <div className="h-px bg-gray-100 flex-1"></div></div>
                          {!isPdfProject && (
                            <button onClick={() => { insertPageAfter(index); setActiveMenuPageId(null); }} className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"><Plus size="0.9vw" /> Add Page</button>
                          )}
                          <button onClick={() => { onAddFile && onAddFile(index); setActiveMenuPageId(null); }} className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"><FilePlus size="0.9vw" /> Add File</button>
                          {isPdfProject && (
                            <button onClick={() => { onReplaceFile && onReplaceFile(index); setActiveMenuPageId(null); }} className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"><FileReplaceIcon icon="mdi:file-replace" className="w-[0.9vw] h-[0.9vw]" /> Replace File</button>
                          )}
                          <button onClick={() => { duplicatePage(index); setActiveMenuPageId(null); }} className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"><Copy size="0.9vw" /> Duplicate</button>
                          <button onClick={(e) => handleRenameStart(e, page)} className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"><Edit2 size="0.9vw" /> Rename</button>
                          {!isPdfProject && (
                            <button onClick={() => { setActivePageIndex(index); onOpenTemplateModal(); setActiveMenuPageId(null); }} className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"><Layout size="0.9vw" /> Template</button>
                          )}
                          <button onClick={() => { togglePageVisibility && togglePageVisibility(index); setActiveMenuPageId(null); }} className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer">{page.isHidden ? <Eye size="0.9vw" /> : <EyeOff size="0.9vw" />} {page.isHidden ? 'Show' : 'Hide'}</button>

                          <div className="px-[0.5vw] py-[0.2vw] mt-[0.2vw] text-[0.6vw] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-[0.5vw]">Page Order <div className="h-px bg-gray-100 flex-1"></div></div>
                          <button onClick={() => { movePageUp(index); setActiveMenuPageId(null); }} className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"><ArrowUp size="0.9vw" /> Move Up</button>
                          <button onClick={() => { movePageDown(index); setActiveMenuPageId(null); }} className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"><ArrowDown size="0.9vw" /> Move Down</button>
                          <button onClick={() => { movePageToFirst(index); setActiveMenuPageId(null); }} className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"><ArrowUpToLine size="0.9vw" /> Move to First</button>
                          <button onClick={() => { movePageToLast(index); setActiveMenuPageId(null); }} className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"><ArrowDownToLine size="0.9vw" /> Move to Last</button>

                          <div className="h-px bg-gray-100 my-[0.2vw]"></div>
                          {!isPdfProject && (
                            <button onClick={() => { clearPage(index); setActiveMenuPageId(null); }} className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-gray-700 hover:bg-gray-50 rounded-[0.4vw] text-left cursor-pointer"><Ban size="0.9vw" /> Clear</button>
                          )}
                          <button onClick={() => { deletePage(index); setActiveMenuPageId(null); }} className="flex items-center gap-[0.6vw] px-[0.6vw] py-[0.4vw] text-[0.75vw] font-medium text-red-500 hover:bg-red-50 rounded-[0.4vw] text-left cursor-pointer"><Trash2 size="0.9vw" /> Delete</button>
                        </>
                      );
                    })()}
                  </motion.div>
                </AnimatePresence>,
                document.body
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-[1vh] bg-white flex flex-col gap-[1vh] flex-shrink-0">
              {isPdfProject ? (
                <button
                  onClick={() => onAddFile(pages.length - 1)}
                  className="w-full bg-white border border-gray-200 text-gray-900 py-[1.2vh] rounded-[0.6vw] text-[0.8vw] font-semibold flex items-center justify-center gap-[0.8vw] hover:bg-gray-50 transition-all shadow-sm cursor-pointer"
                >
                  <FilePlus size="1.1vw" className="text-gray-400" />
                  <span>Add File</span>
                </button>
              ) : (
                <button
                  onClick={() => insertPageAfter(pages.length - 1)}
                  className="w-full bg-white border border-gray-200 text-gray-900 py-[1.2vh] rounded-[0.6vw] text-[0.8vw] font-semibold flex items-center justify-center gap-[0.8vw] hover:bg-gray-50 transition-all shadow-sm cursor-pointer"
                >
                  <FilePlus size="1.1vw" className="text-gray-400" />
                  <span>Add Pages</span>
                </button>
              )}

              <button
                onClick={handleGoToCustomize}
                className="w-full bg-black text-white py-[1.2vh] rounded-[0.6vw] text-[0.8vw] font-semibold flex items-center justify-center gap-[1vw] hover:bg-gray-900 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.4)] cursor-pointer"
              >
                <ArrowUpRight size="1.2vw" className="rotate-0" />
                <span>Go to Customize</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AlertModal
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onConfirm={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
      />
    </motion.div>
  );
};

export default Layer;
