import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumDropdown from './PremiumDropdown';
import { Plus, Trash2, Edit2, ChevronDown, ChevronRight } from 'lucide-react';
import BookmarkStylesPopup, { getBookmarkClipPath, getBookmarkBorderRadius } from './BookmarkStylesPopup';
import OtherSetup from './OtherSetup';
import ColorPicker from './ColorPallet';


const fontFamilies = [
  'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
  'Helvetica', 'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
  'Inter', 'Playfair Display', 'Oswald', 'Merriweather'
];

const Switch = ({ enabled, onChange, variant = 'primary' }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onChange(!enabled);
    }}
    className={`relative block w-[1.8vw] h-[1vw] rounded-[1vw] transition-all duration-200 ease-in-out shadow-[inset_0_0.05vw_0.1vw_rgba(0,0,0,0.3)] outline-none shrink-0 cursor-pointer ${enabled ? 'bg-[#4A3AFF]' : 'bg-[#bbbbbb]'}`}
  >
    <div
      className={`absolute top-[0.1vw] w-[0.8vw] h-[0.8vw] bg-white rounded-full transition-all duration-200 ease-in-out shadow-[0_0.05vw_0.1vw_rgba(0,0,0,0.4)] ${enabled ? 'left-[0.9vw]' : 'left-[0.1vw]'}`}
    />
  </button>
);

// Reusable Section Header
const SectionHeader = ({ title }) => (
  <div className="flex items-center gap-[0.5vw] mt-[1.2vw] mb-[0.8vw]">
    <h4 className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">{title}</h4>
    <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1vw' }}> </div>
  </div>
);

const Stepper = ({ value, onChange, unit = 's', min = 1, max = 20 }) => (
  <div className="flex items-center gap-[0.4vw]">
    <button
      onClick={(e) => { e.stopPropagation(); onChange(Math.max(min, value - 1)); }}
      className="text-gray-300 hover:text-gray-500 transition-colors"
    >
      <Icon icon="lucide:chevron-left" className="w-[1vw] h-[1vw]" />
    </button>
    <div
      className="w-[3.2vw] h-[2vw] border border-gray-100 rounded-[0.4vw] flex items-center justify-center bg-white cursor-ew-resize select-none text-[0.85vw] text-gray-800 font-semibold shadow-sm"
      onMouseDown={(e) => {
        e.preventDefault();
        const startX = e.clientX;
        const startVal = value;
        const handleMove = (moveEvent) => {
          const dx = moveEvent.clientX - startX;
          const newVal = Math.max(min, Math.min(max, startVal + Math.round(dx)));
          onChange(newVal);
        };
        const handleUp = () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
      }}
    >
      {value}{unit}
    </div>
    <button
      onClick={(e) => { e.stopPropagation(); onChange(Math.min(max, value + 1)); }}
      className="text-gray-300 hover:text-gray-500 transition-colors"
    >
      <Icon icon="lucide:chevron-right" className="w-[1vw] h-[1vw]" />
    </button>
  </div>
);

const SettingRow = ({ label, children, className = "" }) => (
  <div className={`flex items-center justify-between gap-[1vw] ${className}`}>
    <span className="text-[0.75vw] font-semibold text-gray-700 whitespace-nowrap">{label}</span>
    {children}
  </div>
);

// Menu Item Component (Card Style)
const MenuItem = ({ label, enabled, onChange, hasSettings, isExpanded, onToggleSettings, onRedirect, children }) => (
  <div
    className={`bg-white rounded-[0.8vw] shadow-[0_0.9vw_1.2vw_rgba(0,0,0,0.05)] transition-all duration-300 relative ${isExpanded ? 'ring-1 ring-gray-200 z-[100] !overflow-visible' : 'z-0 !overflow-visible'}`}
  >
    <div className={`flex items-center justify-between px-[0.5vw] py-[0.8vw] pl-[1vw] pr-[1vw] border border-gray-100 transition-all duration-300 ${isExpanded ? 'rounded-t-[0.8vw] border-b-transparent' : 'rounded-[0.8vw]'}`}>
      <span className="text-[0.75vw] font-medium text-gray-800 whitespace-nowrap">{label}</span>
      <div className="flex items-center gap-[0.75vw]">
        {hasSettings && (
          <button
            onClick={onToggleSettings}
            className={`p-[0.25vw] rounded-[0.7vw] transition-colors ${isExpanded ? 'bg-gray-100 text-[#5551FF]' : 'hover:bg-gray-100 text-gray-400'
              }`}
          >
            <Icon
              icon="tdesign:adjustment-filled"
              className={`w-[1vw] h-[1vw] rotate-90 transition-colors ${isExpanded ? 'text-[#5551FF]' : 'text-gray-800'}`}
            />
          </button>
        )}

        {onRedirect && (
          <button
            onClick={onRedirect}
            className=" rounded-[0.7vw] transition-colors hover:bg-gray-100 text-gray-800"
            title="Go to Other Setup"
          >
            <Icon
              icon="lucide:external-link"
              className="w-[1vw] h-[1vw] text-gray-800"
            />
          </button>
        )}

        <Switch enabled={enabled} onChange={onChange} />
      </div>
    </div>
    {children}
  </div>
);

// TOC Item Component for Editor
const TocItem = ({ item, index, isEditing, onUpdate, onDelete, activeTOCItem, setActiveTOCItem, onToggleEdit, onAddHead, onAddSub }) => {
  const isHeadActive = activeTOCItem?.type === 'head' && activeTOCItem?.index === index;

  return (
    <div className="mb-[1vw] relative flex gap-[0.6vw]">
      <div className="relative flex flex-col items-center w-[1.4vw] shrink-0">
        <div className="w-[1.4vw] h-[1.4vw] rounded-full bg-[#525252] text-white flex items-center justify-center text-[0.8vw] font-medium z-10 shrink-0">
          {index + 1}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-[0.6vw]">
        <div
          className={`flex items-center gap-[0.3vw] relative group ${isHeadActive ? 'p-[0.3vw] bg-[#3F37C9] rounded-[0.5vw] border-[1px] border-[#3F37C9] shadow-sm' : ''}`}
          onClick={() => setActiveTOCItem({ type: 'head', index })}
        >
          <div className={`flex-1 relative ${isHeadActive ? 'bg-white rounded-[0.3vw] flex items-center px-[0.8vw]' : 'flex items-center'}`}>
            <input
              type="text"
              placeholder={`Heading ${index + 1}`}
              value={item.title || ''}
              onChange={(e) => onUpdate({ ...item, title: e.target.value })}
              className={`w-full h-[2.6vw] text-[0.85vw] transition-all placeholder-[#BCC2CF] outline-none ${isHeadActive
                ? 'text-gray-900 h-[2.6vw]  gap-[0.3vw] w-full bg-transparent border-none'
                : 'px-[0.8vw] text-gray-700 border border-[#BCBCBC] rounded-[0.6vw] hover:border-[#3F37C9] focus:border-[#3F37C9] shadow-sm'
                }`}
            />

            <div className={`flex items-center gap-[0.2vw] ml-auto ${isHeadActive ? '' : 'absolute right-[0.5vw] opacity-0 group-hover:opacity-100 transition-opacity'}`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-red-500 hover:text-red-600 p-[0.2vw] "
                title="Delete Heading"
              >
                <Trash2 size="1vw" strokeWidth={2} />
              </button>
            </div>
          </div>
          <div className={`${isHeadActive ? 'w-[2.6vw] h-[2.6vw]  bg-white rounded-[0.3vw] flex items-center justify-center' : ''}`}>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={item.page || ''}
              placeholder={`Page-${index + 1}`}
              onChange={(e) => {
                const numericVal = e.target.value.replace(/\D/g, '');
                onUpdate({ ...item, page: numericVal });
              }}
              onKeyDown={(e) => {
                if (
                  ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) ||
                  (e.ctrlKey || e.metaKey)
                ) {
                  return;
                }
                if (!/^[0-9]$/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              className={`text-center text-[0.85vw] transition-all outline-none ${isHeadActive
                ? 'w-full text-gray-900 bg-transparent border-none'
                : 'w-[3.8vw] h-[2.6vw] text-gray-700 border border-[#BCBCBC] rounded-[0.6vw] hover:border-[#3F37C9] focus:border-[#3F37C9] shadow-sm'
                }`}
            />
          </div>
        </div>

        {item.subheadings?.map((sub, sIdx) => {
          const isSubActive = activeTOCItem?.type === 'sub' && activeTOCItem?.index === index && activeTOCItem?.sIdx === sIdx;
          return (
            <div
              key={sub.id || sIdx}
              className="flex items-center relative ml-[1.8vw]"
              onClick={(e) => {
                e.stopPropagation();
                setActiveTOCItem({ type: 'sub', index, sIdx });
              }}
            >
              <div
                className={`absolute left-[-1.1vw] w-[1.1vw] border-l-[1.8px] border-b-[1.8px] border-dashed border-[#373D8A] rounded-bl-[0.2vw] pointer-events-none ${sIdx === 0 ? 'top-[-0.6vw] h-[2.1vw]' : 'top-[-1.3vw] h-[3.1vw]'
                  }`}
              ></div>

              <div className={`flex-1 flex items-center gap-[0.3vw] relative group ${isSubActive ? 'p-[0.3vw] bg-[#3F37C9] rounded-[0.5vw] border-[1px] border-[#3F37C9] shadow-sm' : ''}`}>
                <div className={`flex-1 relative ${isSubActive ? 'bg-white rounded-[0.3vw] flex items-center px-[0.6vw]' : 'flex items-center'}`}>
                  <input
                    type="text"
                    placeholder={`Subheading ${sIdx + 1}`}
                    value={sub.title || ''}
                    onChange={(e) => {
                      const newSubs = [...item.subheadings];
                      newSubs[sIdx] = { ...sub, title: e.target.value };
                      onUpdate({ ...item, subheadings: newSubs });
                    }}
                    className={`w-full h-[2.4vw] text-[0.85vw] transition-all placeholder-[#BCC2CF] outline-none ${isSubActive
                      ? 'text-gray-900 h-[2.4vw] gap-[0.3vw] bg-transparent border-none'
                      : 'px-[0.6vw] text-gray-700 border border-[#BCBCBC] rounded-[0.6vw] hover:border-[#3F37C9] focus:border-[#3F37C9] shadow-sm'
                      }`}
                  />

                  <div className={`flex items-center ml-auto ${isSubActive ? '' : 'absolute right-[0.5vw] opacity-0 group-hover:opacity-100 transition-opacity'}`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newSubs = item.subheadings.filter((_, i) => i !== sIdx);
                        onUpdate({ ...item, subheadings: newSubs });
                      }}
                      className="text-red-500 hover:text-red-600 p-[0.2vw]"
                      title="Delete Subheading"
                    >
                      <Trash2 size="1vw" strokeWidth={2} />
                    </button>
                  </div>
                </div>
                <div className={`${isSubActive ? 'w-[2.6vw] h-[2.4vw] bg-white rounded-[0.3vw] flex items-center justify-center' : ''}`}>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={sub.page || ''}
                    placeholder={`Page-${sIdx + 1}`}
                    onChange={(e) => {
                      const numericVal = e.target.value.replace(/\D/g, '');
                      const newSubs = [...item.subheadings];
                      newSubs[sIdx] = { ...sub, page: numericVal };
                      onUpdate({ ...item, subheadings: newSubs });
                    }}
                    onKeyDown={(e) => {
                      if (
                        ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) ||
                        (e.ctrlKey || e.metaKey)
                      ) {
                        return;
                      }
                      if (!/^[0-9]$/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    className={`text-center p-[0.3vw] text-[0.85vw] transition-all outline-none ${isSubActive
                      ? 'w-full text-gray-900 bg-transparent border-none'
                      : 'w-[3.8vw] h-[2.4vw] text-gray-700 border border-[#BCBCBC] rounded-[0.6vw] hover:border-[#3F37C9] focus:border-[#3F37C9] '
                      }`}
                  />
                </div>
              </div>
            </div>
          )
        })}

        {isEditing ? (
          <div className="flex gap-[0.3vw] mt-[0.5vw] justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddHead();
              }}
              className="bg-black text-white px-[0.8vw] py-[0.25vw] rounded-lg text-[0.75vw] font-semibold flex items-center justify-center gap-[0.3vw] hover:bg-gray-800 transition-all shadow-md"
            >
              <Icon icon="lucide:plus" className="w-[0.9vw] h-[0.9vw]" strokeWidth={3} /> Head
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddSub();
              }}
              className="bg-black text-white px-[0.8vw] py-[0.25vw] rounded-lg text-[0.75vw] font-semibold flex items-center justify-center gap-[0.3vw] hover:bg-gray-800 transition-all shadow-md"
            >
              <Icon icon="lucide:plus" className="w-[0.9vw] h-[0.9vw]" strokeWidth={3} /> Sub
            </button>
          </div>
        ) : (
          <div className="flex justify-end pt-[0.2vw]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleEdit();
              }}
              className="text-gray-400 hover:text-gray-800 transition-colors p-[0.2vw]"
              title="Edit TOC"
            >
              <Edit2 size="1vw" strokeWidth={2} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
};


const MenuBar = ({ onBack, settings, onUpdate, otherSettings, onUpdateOther, pages = [], folderName, bookName, activeLayout, onNavigateToOtherSetup, onTocSettingsClick }) => {
  const [expandedSection, setExpandedSection] = useState(null);
  const [showStylesPopup, setShowStylesPopup] = useState(false);
  const [activeTOCItem, setActiveTOCItem] = useState(null); // { type: 'head'|'sub', index, sIdx }
  
  const isPdfProject = pages?.some(p => p.html && p.html.includes('data-name="PDF Background"'));
  const activeTocSettings = settings?.tocSettings || settings?.navigation?.tocSettings || {};
  const [editingTOCIndex, setEditingTOCIndex] = useState((activeTocSettings.content?.length || 0) > 0 ? 0 : null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pickerPos, setPickerPos] = useState({ x: 0, y: 0 });

  const toggleSection = (section) => {
    const willOpen = expandedSection !== section;
    setExpandedSection(willOpen ? section : null);
    // Notify parent when TOC settings panel opens so it can show the TOC popup
    if (section === 'toc' && willOpen && onTocSettingsClick) {
      onTocSettingsClick();
    }
  };

  const updateSection = (section, field, value) => {
    onUpdate(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [field]: value
      }
    }));
  };

  const updateNestedSetting = (section, nestedObject, field, value) => {
    onUpdate(prev => {
      const sectionState = prev[section] || {};
      const nestedState = sectionState[nestedObject] || {};
      const newNestedState = { ...nestedState, [field]: value };
      return {
        ...prev,
        [section]: {
          ...sectionState,
          [nestedObject]: newNestedState
        },
        [nestedObject]: newNestedState
      };
    });
  };

  // Helper for direct property updates in settings root (like tocSettings which is separate)
  const updateRootSetting = (rootKey, field, value) => {
    if (rootKey === 'tocSettings' && onTocSettingsClick) {
      onTocSettingsClick();
    }
    
    onUpdate(prev => {
      const currentRoot = prev[rootKey] || (prev.navigation && prev.navigation[rootKey]) || {};
      const newRoot = { ...currentRoot, [field]: value };
      const currentNav = prev.navigation || {};
      
      let updatedNav = {
        ...currentNav,
        [rootKey]: newRoot
      };

      if (rootKey === 'tocSettings') {
        updatedNav.tableOfContents = true;
      }
      
      return {
        ...prev,
        [rootKey]: newRoot,
        navigation: updatedNav
      };
    });
  };

  return (
    <div className="flex flex-col h-full bg-white relative overflow-visible">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Sub-header */}
      <div className="h-[8vh] flex items-center justify-between px-[1vw] border-b border-gray-100">
        <div className="flex items-center gap-[0.5vw]">
          <Icon icon="ant-design:control-outlined" className="w-[1.2vw] h-[1.2vw] text-gray-800 font-semibold" />
          <span className="text-[1vw] font-semibold text-gray-900">Layout Settings</span>
        </div>
        <button onClick={onBack} className="text-gray-600 hover:text-gray-900">
          <Icon icon="ic:round-arrow-back" className="w-[1.25vw] h-[1.25vw]" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-[1vw] pb-[1vw] hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>


        {/* Navigation Section */}
        <SectionHeader title="Navigation" />
        <div className="space-y-[0.325vw]">
          <MenuItem
            label="Add Text to the Icons"
            enabled={otherSettings?.toolbar?.addTextBelowIcons ?? false}
            hasSettings={true}
            isExpanded={expandedSection === 'addTextToIcons'}
            onToggleSettings={() => toggleSection('addTextToIcons')}
            onChange={(val) => {
              updateSection('navigation', 'addTextToIcons', val);
              if (onUpdateOther) {
                onUpdateOther(prev => ({
                  ...prev,
                  toolbar: {
                    ...(prev?.toolbar || {}),
                    addTextBelowIcons: val
                  }
                }));
              }
            }}
          >
            <AnimatePresence>
              {expandedSection === 'addTextToIcons' && (
                <motion.div
                  initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
                  animate={{ 
                    height: 'auto', 
                    opacity: 1,
                    transitionEnd: { overflow: 'visible' }
                  }}
                  exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.3 }}
                  className="bg-gray-50/50 rounded-b-[0.8vw] relative z-10 !overflow-visible"
                >
                  <div className="px-[1.25vw] pb-[1vw] pt-0 border-t border-gray-50">
                    <div className="flex items-center justify-between gap-[0.5vw] mt-[1vw]">
                      <span className="text-[0.75vw] font-medium text-gray-700 whitespace-nowrap">Text style :</span>
                      <PremiumDropdown
                        options={fontFamilies}
                        value={settings?.navigation?.addTextToIconsSettings?.font || settings?.addTextToIconsSettings?.font || otherSettings?.toolbar?.textProperties?.font || 'Arial'}
                        onChange={(val) => {
                          updateNestedSetting('navigation', 'addTextToIconsSettings', 'font', val);
                          if (onUpdateOther) {
                            onUpdateOther(prev => ({
                              ...prev,
                              toolbar: {
                                ...(prev?.toolbar || {}),
                                textProperties: { ...(prev?.toolbar?.textProperties || {}), font: val }
                              }
                            }));
                          }
                        }}
                        width="10vw"
                        className="shrink-0"
                        isFont={true}
                        buttonClassName="!border-gray-600 !rounded-[0.5vw]"
                        align="right"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </MenuItem>
          <MenuItem
            label="Next / Previous Buttons"
            enabled={settings.navigation?.nextPrevButtons}
            onChange={(val) => updateSection('navigation', 'nextPrevButtons', val)}
          />
          <MenuItem
            label="Mouse Wheel Navigation"
            enabled={settings.navigation?.mouseWheel}
            onChange={(val) => updateSection('navigation', 'mouseWheel', val)}
          />
          <MenuItem
            label="Drag to Turn Pages"
            enabled={settings.navigation?.dragToTurn}
            onChange={(val) => updateSection('navigation', 'dragToTurn', val)}
          />
          <MenuItem
            label="Page Quick Access"
            enabled={settings.navigation?.pageQuickAccess}
            onChange={(val) => updateSection('navigation', 'pageQuickAccess', val)}
          />

          {/* Table of Contents with Settings */}
          <MenuItem
            label="Table of Contents"
            enabled={settings.navigation?.tableOfContents ?? true}
            hasSettings={true}
            isExpanded={expandedSection === 'toc'}
            onToggleSettings={() => toggleSection('toc')}
            onChange={(val) => updateSection('navigation', 'tableOfContents', val)}
          >
            <AnimatePresence>
              {expandedSection === 'toc' && (
                <motion.div
                  initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
                  animate={{
                    height: 'auto',
                    opacity: 1,
                    transitionEnd: { overflow: 'visible' }
                  }}
                  exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
                  className="border-t border-gray-200 bg-gray-50/50 relative z-10 !overflow-visible rounded-b-[0.8vw]"
                >
                  <div className={`p-[1vw] ${!(settings.navigation?.tableOfContents ?? true) ? 'opacity-50 pointer-events-none select-none' : ''}`}>
                    <div className="space-y-[0.85vw] mb-[1.5vw]">
                      <div className="flex items-center justify-between">
                        <span className="text-[0.75vw] font-semibold text-gray-700">Add Search to the TOC</span>
                        <Switch
                          enabled={Boolean(activeTocSettings.addSearch)}
                          onChange={(val) => updateRootSetting('tocSettings', 'addSearch', val)}
                          variant="secondary"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[0.75vw] font-semibold text-gray-700">Add Page Number to the TOC</span>
                        <Switch
                          enabled={Boolean(activeTocSettings.addPageNumber)}
                          onChange={(val) => updateRootSetting('tocSettings', 'addPageNumber', val)}
                          variant="secondary"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[0.75vw] font-semibold text-gray-700">Add Serial Number to the Heading</span>
                        <Switch
                          enabled={Boolean(activeTocSettings.addSerialNumberHeading)}
                          onChange={(val) => updateRootSetting('tocSettings', 'addSerialNumberHeading', val)}
                          variant="secondary"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[0.75vw] font-semibold text-gray-700">Add Serial Number to the Subheading</span>
                        <Switch
                          enabled={Boolean(activeTocSettings.addSerialNumberSubheading)}
                          onChange={(val) => updateRootSetting('tocSettings', 'addSerialNumberSubheading', val)}
                          variant="secondary"
                        />
                      </div>
                      <div className="flex items-center justify-between mt-[0.85vw]">
                        <span className="text-[0.75vw] font-semibold text-gray-700">Read TOC with Male Voice</span>
                        <Switch
                          enabled={Boolean(activeTocSettings.useMaleVoice)}
                          onChange={(val) => updateRootSetting('tocSettings', 'useMaleVoice', val)}
                          variant="secondary"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-[0.8vw] mb-[1.2vw] pr-[0.4vw]">
                      <h5 className="text-[0.75vw] font-semibold text-gray-700">TOC Content</h5>
                      <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.4vw' }}> </div>
                    </div>

                    <div
                      className="space-y-[0.2vw] max-h-[30vw] overflow-y-auto pr-[0.4vw] hide-scrollbar"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {activeTocSettings.content?.map((item, idx) => (
                        <TocItem
                          key={item.id || idx}
                          item={item}
                          index={idx}
                          isEditing={editingTOCIndex === idx}
                          onUpdate={(updatedItem) => {
                            const newContent = [...(activeTocSettings.content || [])];
                            newContent[idx] = updatedItem;
                            updateRootSetting('tocSettings', 'content', newContent);
                          }}
                          onDelete={() => {
                            const newContent = (activeTocSettings.content || []).filter((_, i) => i !== idx);
                            updateRootSetting('tocSettings', 'content', newContent);
                            if (editingTOCIndex === idx) setEditingTOCIndex(newContent.length > 0 ? 0 : null);
                          }}
                          activeTOCItem={activeTOCItem}
                          setActiveTOCItem={setActiveTOCItem}
                          onToggleEdit={() => {
                            setEditingTOCIndex(idx);
                            setActiveTOCItem({ type: 'head', index: idx });
                          }}
                          onAddHead={() => {
                            const content = activeTocSettings.content || [];
                            const nextIdx = idx + 1;
                            const newContent = [...content];
                            newContent.splice(nextIdx, 0, {
                              id: Date.now(),
                              title: `Heading ${content.length + 1}`,
                              page: `Page-${nextIdx + 1}`,
                              subheadings: []
                            });
                            updateRootSetting('tocSettings', 'content', newContent);
                            setActiveTOCItem({ type: 'head', index: nextIdx });
                            setEditingTOCIndex(nextIdx);
                          }}
                          onAddSub={() => {
                            const content = activeTocSettings.content || [];
                            if (content.length > 0) {
                              const newContent = [...content];
                              const targetItem = newContent[idx];
                              const updatedItem = {
                                ...targetItem,
                                subheadings: [...(targetItem.subheadings || []), {
                                  id: Date.now() + 1,
                                  title: `Subheading ${(targetItem.subheadings || []).length + 1}`,
                                  page: `Page-${(targetItem.subheadings || []).length + 1}`
                                }]
                              };
                              newContent[idx] = updatedItem;
                              updateRootSetting('tocSettings', 'content', newContent);
                              setActiveTOCItem({
                                type: 'sub',
                                index: idx,
                                sIdx: updatedItem.subheadings.length - 1
                              });
                            }
                          }}
                        />
                      ))}
                      {(activeTocSettings.content?.length || 0) === 0 && (
                        <div className="flex justify-center py-[1vw]">
                          <button
                            onClick={() => {
                              const newContent = [{ id: Date.now(), title: 'Heading 1', page: 'Page-1', subheadings: [] }];
                              updateRootSetting('tocSettings', 'content', newContent);
                              setEditingTOCIndex(0);
                              setActiveTOCItem({ type: 'head', index: 0 });
                            }}
                            className="bg-black text-white px-[1.5vw] py-[0.5vw] rounded-lg text-[0.85vw] font-semibold flex items-center gap-[0.5vw] hover:bg-gray-800 transition-all"
                          >
                            <Icon icon="lucide:plus" className="w-[1vw] h-[1vw]" strokeWidth={3} /> Add Heading
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </MenuItem>

          <MenuItem
            label="Page Thumbnails"
            enabled={settings.navigation?.pageThumbnails ?? true}
            onChange={(val) => updateSection('navigation', 'pageThumbnails', val)}
          />

          {/* Bookmark */}
          <MenuItem
            label="Bookmark"
            enabled={settings.navigation?.bookmark}
            hasSettings={true}
            isExpanded={expandedSection === 'bookmark'}
            onToggleSettings={() => toggleSection('bookmark')}
            onChange={(val) => updateSection('navigation', 'bookmark', val)}
          >
            <AnimatePresence>
              {expandedSection === 'bookmark' && (
                <motion.div
                  initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
                  animate={{ 
                    height: 'auto', 
                    opacity: 1,
                    transitionEnd: { overflow: 'visible' }
                  }}
                  exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.3 }}
                  className="bg-gray-50/50 rounded-b-[0.8vw] relative z-10 !overflow-visible"
                >
                  <div className="px-[1.25vw] pb-[1vw] pt-0 border-t border-gray-50">
                    <BookmarkStylesPopup
                      settings={settings}
                      onUpdate={onUpdate}
                      pages={pages}
                      onClose={() => toggleSection('bookmark')}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </MenuItem>

          <MenuItem
            label="Start / End Navigation"
            enabled={settings.navigation?.startEndNav ?? true}
            onChange={(val) => updateSection('navigation', 'startEndNav', val)}
          />
        </div>

        {/* Viewing Section */}
        <SectionHeader title="Viewing" />
        <div className="space-y-[0.325vw]">
          <MenuItem
            label="Zoom In / Out Button"
            enabled={settings.viewing?.zoom}
            hasSettings={true}
            isExpanded={expandedSection === 'zoom'}
            onToggleSettings={() => toggleSection('zoom')}
            onChange={(val) => updateSection('viewing', 'zoom', val)}
          >
            <AnimatePresence>
              {expandedSection === 'zoom' && (
                <motion.div
                  initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
                  animate={{
                    height: 'auto',
                    opacity: 1,
                    transitionEnd: { overflow: 'visible' }
                  }}
                  exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
                  className="border-t border-gray-200 bg-gray-50/50 relative z-10 !overflow-visible rounded-b-[0.8vw]"
                >
                  <div className="p-[1vw]">
                    <div className="space-y-[0.85vw]">
                      <SettingRow label="Set Maximum Zoom">
                        <Stepper
                          value={settings.toolbar?.maximumZoom || 4}
                          unit="x"
                          min={1}
                          max={3}
                          onChange={(val) => updateRootSetting('toolbar', 'maximumZoom', val)}
                        />
                      </SettingRow>
                      <SettingRow label="Double tap to Zoom at Max">
                        <Switch
                          enabled={settings.toolbar?.twoClickToZoom ?? true}
                          onChange={(val) => updateRootSetting('toolbar', 'twoClickToZoom', val)}
                          variant="secondary"
                        />
                      </SettingRow>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </MenuItem>
          <MenuItem
            label="Full Screen View"
            enabled={settings.viewing?.fullScreen}
            onChange={(val) => updateSection('viewing', 'fullScreen', val)}
          />
        </div>

        {/* Interaction Tools Section */}
        <SectionHeader title="Interaction Tools" />
        <div className="space-y-[0.325vw]">
          {!isPdfProject && (
            <MenuItem
              label="Search Inside Book"
              enabled={settings.interaction?.search}
              onChange={(val) => updateSection('interaction', 'search', val)}
            />
          )}

          <MenuItem
            label="Gallery"
            enabled={settings.interaction?.gallery}
            hasSettings={true}
            isExpanded={expandedSection === 'gallery'}
            onToggleSettings={() => toggleSection('gallery')}
            onChange={(val) => updateSection('interaction', 'gallery', val)}
          >
            <AnimatePresence>
              {expandedSection === 'gallery' && (
                <motion.div
                  initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
                  animate={{ 
                    height: 'auto', 
                    opacity: 1,
                    transitionEnd: { overflow: 'visible' }
                  }}
                  exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.3 }}
                  className="bg-gray-50/50 rounded-b-[0.8vw] relative z-10 !overflow-visible"
                >
                  <div className="border-t border-gray-50">
                    <OtherSetup 
                      inlineMode="gallery" 
                      settings={otherSettings} 
                      onUpdate={onUpdateOther} 
                      folderName={folderName} 
                      bookName={bookName} 
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </MenuItem>
        </div>

        {/* Media Controls Section */}
        <SectionHeader title="Media Controls" />
        <div className="space-y-[0.325vw]">
          <MenuItem
            label="Auto Flip Features"
            enabled={settings.media?.autoFlip}
            hasSettings={true}
            isExpanded={expandedSection === 'autoFlip'}
            onToggleSettings={() => toggleSection('autoFlip')}
            onChange={(val) => updateSection('media', 'autoFlip', val)}
          >
            <AnimatePresence>
              {expandedSection === 'autoFlip' && (
                <motion.div
                  initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
                  animate={{
                    height: 'auto',
                    opacity: 1,
                    transitionEnd: { overflow: 'visible' }
                  }}
                  exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
                  className="border-t border-gray-200 bg-gray-50/50 relative z-10 !overflow-visible"
                >
                  <div className="p-[1vw]">
                    <div className="space-y-[0.85vw]">
                      <SettingRow label="Auto Flip Duration">
                        <Stepper
                          value={settings.media?.autoFlipSettings?.duration || 5}
                          onChange={(val) => updateNestedSetting('media', 'autoFlipSettings', 'duration', val)}
                        />
                      </SettingRow>
                      <SettingRow label="Next Flip Countdown">
                        <Switch
                          enabled={settings.media?.autoFlipSettings?.countdown ?? false}
                          onChange={(val) => updateNestedSetting('media', 'autoFlipSettings', 'countdown', val)}
                          variant="secondary"
                        />
                      </SettingRow>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </MenuItem>
          <MenuItem
            label="Audio Features"
            enabled={settings?.media?.backgroundAudio ?? settings?.media?.audio ?? true}
            hasSettings={true}
            isExpanded={expandedSection === 'sound'}
            onToggleSettings={() => toggleSection('sound')}
            onChange={(val) => {
              updateSection('media', 'backgroundAudio', val);
              updateSection('media', 'audio', val);
              if (onUpdateOther) {
                onUpdateOther(prev => ({
                  ...prev,
                  sound: {
                    ...(prev?.sound || {}),
                    bgSoundEnabled: val
                  }
                }));
              }
            }}
          >
            <AnimatePresence>
              {expandedSection === 'sound' && (
                <motion.div
                  initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
                  animate={{ 
                    height: 'auto', 
                    opacity: 1,
                    transitionEnd: { overflow: 'visible' }
                  }}
                  exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.3 }}
                  className="bg-gray-50/50 rounded-b-[0.8vw] relative z-10 !overflow-visible"
                >
                  <div className="border-t border-gray-50">
                    <OtherSetup 
                      inlineMode="sound" 
                      settings={otherSettings} 
                      onUpdate={onUpdateOther} 
                      folderName={folderName} 
                      bookName={bookName} 
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </MenuItem>
        </div>

        {/* Share & Export Section */}
        <SectionHeader title="Share & Export" />
        <div className="space-y-[0.325vw]">
          <MenuItem
            label="Share"
            enabled={settings.shareExport?.share}
            onChange={(val) => updateSection('shareExport', 'share', val)}
          />
          <MenuItem
            label="Download"
            enabled={settings.shareExport?.download}
            onChange={(val) => updateSection('shareExport', 'download', val)}
          />

        </div>

        {/* Branding & Profile Section */}
        <SectionHeader title="Branding & Profile" />
        <div className="space-y-[0.325vw]">
          <MenuItem
            label="Logo"
            enabled={settings.brandingProfile?.logo}
            onChange={(val) => updateSection('brandingProfile', 'logo', val)}
          />
          <MenuItem
            label="Profile"
            enabled={settings.brandingProfile?.profile}
            onChange={(val) => updateSection('brandingProfile', 'profile', val)}
          />
        </div>
      </div>
      {/* Extra padding to allow dropdown menus to scroll into view */}
      <div className="h-[0.1vw] shrink-0 pointer-events-none" />
      {showColorPicker && (
        <ColorPicker
          color={settings.navigation?.bookmarkSettings?.color || '#C45A5A'}
          onChange={(color) => updateNestedSetting('navigation', 'bookmarkSettings', 'color', color)}
          onClose={() => setShowColorPicker(false)}
          style={{ position: 'fixed', top: pickerPos.y, left: pickerPos.x, zIndex: 1000 }}
          opacity={100}
          onOpacityChange={() => { }} // Not used for bookmark yet
        />
      )}
    </div>
  );
};

export default MenuBar;
