import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { X, Plus, Copy, Check, Trash2, Edit3, Search, Sparkles, FileText, CornerDownLeft, Pipette } from 'lucide-react';

const STORAGE_KEY = 'fisto_template_editor_notes';

export const isColorCode = (input) => {
  if (!input || typeof input !== 'string') return false;
  const s = input.trim();
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/i.test(s) ||
         /^rgba?\((\s*\d+\s*,){2,3}\s*[\d.]+\s*\)$/i.test(s) ||
         /^hsla?\((\s*\d+\s*,){2,3}\s*[\d.]+\s*\)$/i.test(s);
};

/**
 * Robust cleaner that guarantees only plain text string is saved:
 * - Strips all SVG/HTML tags (<text>, <style>, <div>, etc.)
 * - Strips CSS rules and inline properties (e.g. --stroke-width, color: ..., fill: ...)
 * - Decodes HTML entities and normalizes whitespace while preserving paragraphs
 * - Preserves hex / rgb color codes
 */
export const cleanNoteText = (input) => {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (isColorCode(trimmed)) {
    return trimmed.toUpperCase();
  }
  let text = input;

  // 1. Remove style and script blocks completely
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  // 2. Remove HTML / SVG tags
  text = text.replace(/<[^>]+>/g, ' ');

  // 3. Remove CSS declarations like color: #...; background: ...; or --var: ...;
  text = text.replace(/--?[a-zA-Z-]+:\s*[^;]+;?/gi, '');

  // 4. Decode common HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  // 5. Clean up whitespace per line and preserve paragraphs
  text = text
    .split('\n')
    .map(line => line.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');

  return text.trim();
};

/**
 * Automatically cleans and adds color into persistent Notes storage
 */
export const addColorToNotes = (colorCode) => {
  if (!colorCode || typeof colorCode !== 'string') return;
  const hex = colorCode.trim().toUpperCase();
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    let notes = [];
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) notes = parsed;
    }

    if (notes.length > 0 && notes[0].text === hex) {
      return;
    }

    const newNote = {
      id: 'note_' + Date.now(),
      text: hex,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const updated = [newNote, ...notes];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('notes-updated', { detail: { notes: updated } }));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error('Failed to add color to notes:', e);
  }
};

/**
 * Automatically cleans and adds copied text into persistent Notes storage,
 * and notifies active components.
 */
export const addTextToNotes = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return;
  const cleaned = cleanNoteText(rawText);
  if (!cleaned || cleaned.trim().length === 0) return;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    let notes = [];
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) notes = parsed;
    }

    // Prevent immediate duplicate if top note already has this exact text
    if (notes.length > 0 && notes[0].text === cleaned) {
      return;
    }

    const newNote = {
      id: 'note_' + Date.now(),
      text: cleaned,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const updated = [newNote, ...notes];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('notes-updated', { detail: { notes: updated } }));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error('Failed to auto-add text to notes:', e);
  }
};

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const NotesPopup = ({ isOpen, onClose, selectedLayerId }) => {
  const [notes, setNotes] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [noteInput, setNoteInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [canvasText, setCanvasText] = useState('');

  const textareaRef = useRef(null);
  const colorInputRef = useRef(null);

  // Load persisted notes and listen for live updates
  useEffect(() => {
    const loadNotes = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setNotes(parsed);
          }
        } else {
          setNotes([]);
        }
      } catch (e) {
        console.error('Failed to load notes from localStorage:', e);
      }
    };

    loadNotes();

    const handleNotesUpdated = (e) => {
      if (e.detail?.notes && Array.isArray(e.detail.notes)) {
        setNotes(e.detail.notes);
      } else {
        loadNotes();
      }
    };

    window.addEventListener('notes-updated', handleNotesUpdated);
    window.addEventListener('storage', loadNotes);
    return () => {
      window.removeEventListener('notes-updated', handleNotesUpdated);
      window.removeEventListener('storage', loadNotes);
    };
  }, []);

  // Automatically add copied text from template into Notes
  useEffect(() => {
    const handleGlobalCopy = (e) => {
      // Exclude copy events triggered from within NotesPopup itself
      if (e.target && e.target.closest && e.target.closest('.notes-popup-panel')) {
        return;
      }

      let copiedText = '';

      // Check current window selection
      const selection = window.getSelection()?.toString();
      if (selection && selection.trim()) {
        copiedText = selection;
      }

      // Check editor iframe text selection if available
      if (!copiedText) {
        try {
          const editorIframe = document.getElementById('main-flipbook-editor');
          const iframeSel = editorIframe?.contentWindow?.getSelection()?.toString();
          if (iframeSel && iframeSel.trim()) {
            copiedText = iframeSel;
          }
        } catch (err) {}
      }

      // Check clipboardData fallback
      if (!copiedText && e.clipboardData) {
        copiedText = e.clipboardData.getData('text/plain') || '';
      }

      if (copiedText && copiedText.trim()) {
        addTextToNotes(copiedText);
      }
    };

    window.addEventListener('copy', handleGlobalCopy);
    document.addEventListener('copy', handleGlobalCopy);
    return () => {
      window.removeEventListener('copy', handleGlobalCopy);
      document.removeEventListener('copy', handleGlobalCopy);
    };
  }, []);

  // Save notes to localStorage whenever updated
  const persistNotes = (updatedNotes) => {
    setNotes(updatedNotes);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    } catch (e) {
      console.error('Failed to save notes to localStorage:', e);
    }
  };

  // Check if currently selected layer has text in the canvas
  useEffect(() => {
    if (!isOpen) return;

    if (selectedLayerId) {
      try {
        const editorDoc = document.getElementById('main-flipbook-editor')?.contentDocument || document;
        const el = editorDoc.getElementById(selectedLayerId);
        if (el) {
          const textNodes = Array.from(el.querySelectorAll('text, tspan, div, p, span, h1, h2, h3, h4, h5, h6'));
          let raw = '';
          if (textNodes.length > 0) {
            raw = textNodes.map(t => t.textContent || '').join(' ');
          } else {
            raw = el.textContent || '';
          }
          const cleaned = cleanNoteText(raw);
          setCanvasText(cleaned);
          return;
        }
      } catch (e) {
        // Ignore error
      }
    }
    setCanvasText('');
  }, [isOpen, selectedLayerId]);

  // Focus textarea when adding or editing
  useEffect(() => {
    if ((isAdding || editingId) && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isAdding, editingId]);

  // Handle Toast Notifications
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  // Intercept Paste in textarea to enforce pure plain text
  const handlePaste = (e) => {
    e.preventDefault();
    const rawPasted = e.clipboardData.getData('text/plain') || e.clipboardData.getData('text/html') || '';
    const cleaned = cleanNoteText(rawPasted);
    
    const target = e.target;
    const start = target.selectionStart || 0;
    const end = target.selectionEnd || 0;
    const currentVal = target.value;
    const nextVal = currentVal.substring(0, start) + cleaned + currentVal.substring(end);
    setNoteInput(nextVal);
  };

  // Save or Update Note
  const handleSaveNote = () => {
    const cleaned = cleanNoteText(noteInput);
    if (!cleaned) {
      showToast('Note cannot be empty');
      return;
    }

    if (editingId) {
      const updated = notes.map(n => n.id === editingId ? {
        ...n,
        text: cleaned,
        updatedAt: Date.now()
      } : n);
      persistNotes(updated);
      showToast('Note updated');
      setEditingId(null);
    } else {
      const newNote = {
        id: 'note_' + Date.now(),
        text: cleaned,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      persistNotes([newNote, ...notes]);
      showToast('Note saved');
      setIsAdding(false);
    }
    setNoteInput('');
  };

  // Import Selected Text from Canvas
  const handleImportCanvasText = () => {
    if (!canvasText) return;
    const newNote = {
      id: 'note_' + Date.now(),
      text: canvasText,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    persistNotes([newNote, ...notes]);
  };

  // Save Picked Color directly to Notes
  const saveColorToNotes = (colorCode) => {
    if (!colorCode) return;
    const hex = colorCode.trim().toUpperCase();
    const newNote = {
      id: 'note_' + Date.now(),
      text: hex,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const updated = [newNote, ...notes];
    persistNotes(updated);
    if (isAdding && !noteInput.trim()) {
      setIsAdding(false);
    }
    try {
      window.dispatchEvent(new CustomEvent('notes-updated', { detail: { notes: updated } }));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}
  };

  // Handle color eyedropper activation
  const handlePickColor = async () => {
    if (window.EyeDropper) {
      try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
          saveColorToNotes(result.sRGBHex);
        }
      } catch (err) {
        // User cancelled by pressing Escape or clicking outside
        console.log('EyeDropper cancelled or dismissed', err);
      }
    } else if (colorInputRef.current) {
      colorInputRef.current.click();
    } else {
      showToast('Color eyedropper is not supported in this browser');
    }
  };

  const escapeXml = (unsafe) => {
    return (unsafe || '').replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  };

  const getNoteSvgCode = (text) => {
    const cleaned = cleanNoteText(text);
    if (!cleaned) return '';

    const uniqueId = Date.now();
    const lines = cleaned.split('\n').filter(Boolean);
    if (lines.length === 0) return '';

    const isColor = isColorCode(cleaned);
    const fontSize = 18;
    const lineHeight = 24;
    const longestLine = Math.max(...lines.map(l => l.length));
    const estW = Math.max(160, Math.min(longestLine * fontSize * 0.65 + 40, 800));
    const estH = Math.max(60, lines.length * lineHeight + 20);

    const textNodes = lines.map((line, idx) => (
      `<text x="${Math.round(estW / 2)}" y="${Math.round((idx + 1) * lineHeight)}" font-size="${fontSize}" font-family="Inter, sans-serif" font-weight="600" fill="${isColor ? cleaned : '#111827'}" text-anchor="middle">${escapeXml(line)}</text>`
    )).join('\n');

    return `
      <g id="typography-${uniqueId}" data-type="text" cursor="pointer" style="--stroke-width: 0; --shadow-x: 0px; --shadow-y: 0px; --skew-angle: 0deg;">
        <rect width="${Math.round(estW)}" height="${Math.round(estH)}" fill="transparent" pointer-events="none" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&amp;display=swap');
          #typography-${uniqueId} text, #typography-${uniqueId} div {
            font-family: 'Inter', sans-serif;
            letter-spacing: 0.02em;
          }
        </style>
        ${textNodes}
      </g>
    `;
  };

  // Add note text element directly to editor page
  const handleAddNoteToPage = (text) => {
    const svgCode = getNoteSvgCode(text);
    if (!svgCode) return;
    window.dispatchEvent(new CustomEvent('add-element-to-editor', {
      detail: { svgContent: svgCode }
    }));
  };

  // Copy note plain text to clipboard quietly (no toast banner)
  const handleCopyNote = async (note) => {
    try {
      const textToCopy = cleanNoteText(note.text);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedId(note.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      // Quiet fallback
    }
  };

  // Delete note
  const handleDeleteNote = (id) => {
    const updated = notes.filter(n => n.id !== id);
    persistNotes(updated);
    if (editingId === id) {
      setEditingId(null);
      setNoteInput('');
    }
    showToast('Note deleted');
  };

  // Start editing a note
  const handleStartEdit = (note) => {
    setEditingId(note.id);
    setNoteInput(note.text);
    setIsAdding(false);
  };

  // Cancel add/edit
  const handleCancelInput = () => {
    setIsAdding(false);
    setEditingId(null);
    setNoteInput('');
  };

  if (!isOpen) return null;

  const filteredNotes = notes.filter(n => 
    !searchQuery.trim() || n.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div 
      onClick={(e) => e.stopPropagation()}
      className="notes-popup-panel absolute right-0 top-[3.2vw] w-[18vw] min-w-[320px] max-w-[420px] bg-white/95 backdrop-blur-md rounded-[1vw] shadow-[0_12px_36px_rgba(0,0,0,0.18)] border border-gray-200/80 z-[1000] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 select-text"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between px-[1vw] py-[0.75vw] border-b border-gray-100 bg-gray-50/70 select-none">
        <div className="flex items-center gap-[0.5vw]">
          <div className="w-[1.8vw] h-[1.8vw] rounded-[0.4vw] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Icon icon="solar:notes-bold" className="w-[1.1vw] h-[1.1vw]" />
          </div>
          <div>
            <div className="flex items-center gap-[0.4vw]">
              <h3 className="text-[0.85vw] font-bold text-gray-900 leading-tight">Notes</h3>
              <span className="text-[0.65vw] font-semibold px-[0.4vw] py-[0.1vw] rounded-full bg-gray-200/70 text-gray-700">
                {notes.length}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-[0.35vw]">
          {/* Pipette / Color Picker Button */}
          <button
            type="button"
            onClick={handlePickColor}
            className="flex items-center justify-center p-[0.35vw] text-gray-600 hover:text-indigo-600 bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 rounded-[0.4vw] transition-all shadow-2xs active:scale-95 cursor-pointer"
            title="Pick color from editor to notes"
          >
            <Pipette size="0.85vw" strokeWidth={2.2} />
          </button>

          {!isAdding && !editingId && (
            <button
              onClick={() => {
                setIsAdding(true);
                setEditingId(null);
                setNoteInput('');
              }}
              className="flex items-center gap-[0.25vw] bg-indigo-600 hover:bg-indigo-700 text-white text-[0.7vw] font-semibold px-[0.6vw] py-[0.3vw] rounded-[0.4vw] transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus size="0.8vw" strokeWidth={2.5} />
              <span>New</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-[0.35vw] text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 rounded-[0.4vw] transition-colors cursor-pointer"
            title="Close"
          >
            <X size="1vw" />
          </button>
        </div>
      </div>

      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="bg-indigo-600 text-white text-[0.7vw] font-medium px-[0.8vw] py-[0.35vw] text-center flex items-center justify-center gap-[0.4vw] animate-in fade-in duration-150">
          <Check size="0.8vw" strokeWidth={3} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Add / Edit Note Input Box */}
      {(isAdding || editingId) && (
        <div className="p-[0.9vw] bg-white border-b border-gray-100 flex flex-col gap-[0.5vw] animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[0.7vw] font-bold text-gray-700">
              {editingId ? 'Edit Note' : 'Create New Note'}
            </span>
            <span className="text-[0.6vw] text-gray-400 font-medium">Press Ctrl+Enter to save</span>
          </div>

          <div className="relative">
            <textarea
              ref={textareaRef}
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveNote();
                } else if (e.key === 'Escape') {
                  handleCancelInput();
                }
              }}
              rows={4}
              placeholder="Type or paste text here... (Color codes & styling are automatically stripped)"
              className="w-full text-[0.75vw] text-gray-800 bg-gray-50 border border-gray-200 rounded-[0.5vw] p-[0.6vw] outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none placeholder:text-gray-400 placeholder:text-[0.7vw]"
            />
          </div>

          <div className="flex items-center justify-between pt-[0.2vw]">
            <span className="text-[0.6vw] text-gray-400">
              {cleanNoteText(noteInput).length} characters (text only)
            </span>
            <div className="flex items-center gap-[0.4vw]">
              <button
                onClick={handleCancelInput}
                className="text-[0.7vw] font-medium text-gray-500 hover:text-gray-800 px-[0.5vw] py-[0.25vw] rounded-[0.35vw] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="flex items-center gap-[0.25vw] bg-indigo-600 hover:bg-indigo-700 text-white text-[0.7vw] font-semibold px-[0.7vw] py-[0.3vw] rounded-[0.4vw] transition-all shadow-sm cursor-pointer"
              >
                <CornerDownLeft size="0.75vw" />
                <span>{editingId ? 'Update' : 'Save Note'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Input when 2+ notes exist */}
      {notes.length >= 2 && !isAdding && !editingId && (
        <div className="px-[0.9vw] pt-[0.6vw] pb-[0.3vw]">
          <div className="flex items-center bg-gray-50 border border-gray-200/80 rounded-[0.4vw] px-[0.5vw] py-[0.3vw] focus-within:border-indigo-400 focus-within:bg-white transition-colors">
            <Search size="0.75vw" className="text-gray-400 flex-shrink-0 mr-[0.3vw]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full bg-transparent outline-none text-[0.7vw] text-gray-800 placeholder:text-gray-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size="0.7vw" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Notes List Area */}
      <div className="p-[0.9vw] flex flex-col gap-[0.4vw] max-h-[36vh] overflow-y-auto overscroll-contain">
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-[2vw] text-center">
            <div className="w-[3vw] h-[3vw] rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-[0.6vw]">
              <FileText className="w-[1.6vw] h-[1.6vw]" />
            </div>
            <p className="text-[0.8vw] font-bold text-gray-700">
              {searchQuery ? 'No matching notes' : 'No notes yet'}
            </p>
            <p className="text-[0.65vw] text-gray-400 max-w-[14vw] mt-[0.2vw] leading-relaxed">
              {searchQuery 
                ? 'Try a different search keyword' 
                : 'Click "New" to create a note or import selected text from your design.'}
            </p>
            {!searchQuery && !isAdding && !editingId && (
              <div className="flex items-center gap-[0.4vw] mt-[0.8vw]">
                <button
                  onClick={() => setIsAdding(true)}
                  className="inline-flex items-center gap-[0.3vw] text-[0.7vw] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-[0.7vw] py-[0.35vw] rounded-[0.4vw] transition-colors cursor-pointer"
                >
                  <Plus size="0.8vw" />
                  <span>Create first note</span>
                </button>
                <button
                  type="button"
                  onClick={handlePickColor}
                  className="inline-flex items-center gap-[0.3vw] text-[0.7vw] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 px-[0.6vw] py-[0.35vw] rounded-[0.4vw] transition-colors cursor-pointer"
                  title="Pick color from editor"
                >
                  <Pipette size="0.75vw" />
                  <span>Pick color</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          filteredNotes.map((note) => {
            const isCopied = copiedId === note.id;
            const isColor = isColorCode(note.text);
            return (
              <div
                key={note.id}
                onClick={() => handleAddNoteToPage(note.text)}
                className="group relative bg-gray-50/70 hover:bg-indigo-50/30 border border-gray-100 hover:border-indigo-200 rounded-[0.5vw] px-[0.6vw] py-[0.4vw] transition-all flex items-center justify-between gap-[0.5vw] cursor-pointer"
                title={isColor ? `Click to add color "${note.text}" to page` : `Click to add "${note.text}" to page`}
              >
                {/* Note Content (Pure Plain Text or Color Swatch) - Single line with drag & drop */}
                <div
                  draggable="true"
                  onDragStart={(e) => {
                    const svgCode = getNoteSvgCode(note.text);
                    if (svgCode) {
                      e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({
                        type: 'text',
                        svgContent: svgCode
                      }));
                    }
                  }}
                  className="flex-1 min-w-0 flex items-center gap-[0.4vw] select-none"
                >
                  {isColor && (
                    <span
                      className="w-[0.9vw] h-[0.9vw] rounded-[0.2vw] border border-black/15 shadow-2xs shrink-0"
                      style={{ backgroundColor: note.text }}
                      title={note.text}
                    />
                  )}
                  <span className={`truncate text-[0.75vw] text-gray-800 group-hover:text-indigo-950 ${isColor ? 'font-mono font-semibold tracking-wider text-[0.72vw]' : 'font-normal'}`}>
                    {note.text}
                  </span>
                </div>

                {/* Note Actions in single line */}
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-[0.3vw] shrink-0 select-none cursor-default"
                >

                  {/* Copy Plain Text Button */}
                  <button
                    onClick={() => handleCopyNote(note)}
                    className={`p-[0.25vw] rounded-[0.25vw] transition-colors border border-transparent cursor-pointer ${
                      isCopied
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : 'hover:bg-white text-gray-500 hover:text-indigo-600 hover:border-gray-200'
                    }`}
                    title={isCopied ? "Copied!" : (isColor ? "Copy color code" : "Copy note")}
                  >
                    {isCopied ? (
                      <Check size="0.65vw" strokeWidth={2.5} />
                    ) : (
                      <Copy size="0.65vw" />
                    )}
                  </button>

                  {/* Edit Note Button */}
                  <button
                    onClick={() => handleStartEdit(note)}
                    className="p-[0.25vw] hover:bg-white text-gray-500 hover:text-indigo-600 rounded-[0.25vw] transition-colors border border-transparent hover:border-gray-200 cursor-pointer"
                    title="Edit note"
                  >
                    <Edit3 size="0.65vw" />
                  </button>

                  {/* Delete Note Button */}
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-[0.25vw] hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-[0.25vw] transition-colors border border-transparent hover:border-red-100 cursor-pointer"
                    title="Delete note"
                  >
                    <Trash2 size="0.65vw" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Hidden Fallback Color Input */}
      <input
        ref={colorInputRef}
        type="color"
        className="hidden"
        onChange={(e) => {
          if (e.target.value) {
            saveColorToNotes(e.target.value);
          }
        }}
      />

    </div>
  );
};

export default NotesPopup;
