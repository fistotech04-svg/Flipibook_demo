import React, { useState, useEffect } from 'react';
import TypographyPanel from './TypographyPanel';
import { createPortal } from 'react-dom';
import { X, ChevronDown, Info, Check, Plus, Upload, Edit2, Sliders, MoreVertical, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useToast } from './CustomToast';
import { Icon } from '@iconify/react';
import PremiumDropdown from './CustomizedEditor/PremiumDropdown';
import { ImageCropOverlay } from './CustomizedEditor/AppearanceShared';
import ColorPicker from './ThreedEditor/ColorPicker';
import cover1 from '../assets/cover/cover1.svg';
import cover2 from '../assets/cover/cover2.svg';
import cover3 from '../assets/cover/cover3.svg';
import cover4 from '../assets/cover/cover4.svg';
import cover5 from '../assets/cover/cover5.svg';

const scrollbarStyles = `
  .custom-popup-scrollbar::-webkit-scrollbar {
    width: 0.35vw;
  }
  .custom-popup-scrollbar::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 10px;
  }
  .custom-popup-scrollbar::-webkit-scrollbar-thumb {
    background: #292a2bff;
    border-radius: 10px;
  }
  .custom-popup-scrollbar::-webkit-scrollbar-button {
    display: none !important;
    height: 0 !important;
    width: 0 !important;
  }
  .custom-popup-scrollbar::-webkit-scrollbar-button:vertical:decrement,
  .custom-popup-scrollbar::-webkit-scrollbar-button:vertical:increment,
  .custom-popup-scrollbar::-webkit-scrollbar-button:horizontal:decrement,
  .custom-popup-scrollbar::-webkit-scrollbar-button:horizontal:increment {
    display: none !important;
  }
  ::-webkit-scrollbar-button {
    display: none !important;
    height: 0 !important;
    width: 0 !important;
  }
  .custom-popup-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #475569 transparent;
  }
`;

const COVER_TEMPLATES = [
  { id: 1, src: cover1, label: 'Cover 1' },
  { id: 2, src: cover2, label: 'Cover 2' },
  { id: 3, src: cover3, label: 'Cover 3' },
  { id: 4, src: cover4, label: 'Cover 4' },
  { id: 5, src: cover5, label: 'Cover 5' },
];

const TemplatePreview = ({ 
    selectedTemplate, 
    bgColor, bgOpacity, 
    shadowX, shadowY, shadowBlur, shadowColor,
    logoUrl,
    text1, text1FontFamily, text1FontSize, text1FontWeight, text1LetterSpacing, text1LineHeight, text1Align, text1Color, text1ColorOpacity, text1Italic, text1Underline, text1Linethrough,
    text2, text2FontFamily, text2FontSize, text2FontWeight, text2LetterSpacing, text2LineHeight, text2Align, text2Color, text2ColorOpacity, text2Italic, text2Underline, text2Linethrough,
    selectedPages = [], pages = []
}) => (
    <div className="relative w-full h-full bg-gray-100 overflow-hidden" style={{ backgroundColor: bgColor }}>
        {selectedTemplate?.id === 1 ? (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none transform scale-[1.05]">
                {/* Back book */}
                <div className={`absolute w-[10vw] h-[13.5vw] ${selectedPages.length > 0 ? 'bg-white border-gray-200' : 'bg-gradient-to-br from-orange-500 to-amber-600 border-orange-400 p-[0.7vw]'} rounded-[0.6vw] shadow-xl transform -rotate-6 border flex flex-col justify-between text-white overflow-hidden`}>
                   <div className="absolute top-0 right-0 w-[4vw] h-[14vw] bg-white opacity-10 transform rotate-12 -translate-y-[1vw] translate-x-[1vw] z-10 pointer-events-none"></div>
                   {selectedPages.length > 0 && pages[selectedPages[0] - 1] ? (
                       <div className="absolute inset-0 pointer-events-none bg-white" style={{ transformOrigin: 'top left', transform: 'scale(0.35)', width: '285.7%', height: '285.7%' }}>
                          <div dangerouslySetInnerHTML={{ __html: pages[selectedPages[0] - 1].html }} />
                       </div>
                   ) : (
                       <>
                           <span className="text-[0.7vw] font-bold tracking-widest uppercase opacity-85 relative z-10">HARD.COVER</span>
                           <div className="relative z-10">
                              <h3 className="text-[0.85vw] font-black leading-tight">Hard.Cover Book</h3>
                              <p className="text-[0.6vw] opacity-90 mt-[0.1vw]">Free .psd Mockup</p>
                           </div>
                       </>
                   )}
                </div>
                
                {/* Front book */}
                <div className={`absolute w-[10vw] h-[13.5vw] ${selectedPages.length > 0 ? 'bg-white border-gray-200' : 'bg-gradient-to-br from-amber-600 to-orange-500 border-amber-400 p-[0.7vw]'} rounded-[0.6vw] shadow-2xl transform rotate-6 border flex flex-col justify-between text-white overflow-hidden`}>
                   <div className="absolute top-0 left-0 w-[3vw] h-[14vw] bg-black opacity-10 filter blur-[0.2vw] -translate-x-[0.5vw] z-10 pointer-events-none"></div>
                   <div className="absolute top-0 right-0 w-[5vw] h-[14vw] bg-white opacity-20 transform rotate-12 -translate-y-[1vw] translate-x-[2vw] z-10 pointer-events-none"></div>
                   {selectedPages.length > 0 && pages[selectedPages[1] ? selectedPages[1] - 1 : selectedPages[0] - 1] ? (
                       <div className="absolute inset-0 pointer-events-none bg-white" style={{ transformOrigin: 'top left', transform: 'scale(0.35)', width: '285.7%', height: '285.7%' }}>
                          <div dangerouslySetInnerHTML={{ __html: pages[selectedPages[1] ? selectedPages[1] - 1 : selectedPages[0] - 1].html }} />
                       </div>
                   ) : (
                       <>
                           <span className="text-[0.7vw] font-bold tracking-widest uppercase opacity-85 relative z-10">HARD.COVER</span>
                           <div className="relative z-10">
                              <h3 className="text-[0.85vw] font-black leading-tight">Hard.Cover Book</h3>
                              <p className="text-[0.6vw] opacity-90 mt-[0.1vw]">Free .psd Mockup</p>
                           </div>
                       </>
                   )}
                </div>
             </div>
        ) : (
            <img
              src={selectedTemplate?.src}
              className="absolute inset-0 pointer-events-none transition-all duration-300 z-0 w-full h-full object-cover"
              style={{ opacity: (bgOpacity !== undefined ? bgOpacity : 100) / 100, filter: `drop-shadow(${shadowX || 0}px ${shadowY || 0}px ${(shadowBlur || 35) / 10}px ${shadowColor || '#000000'})` }}
              alt={selectedTemplate?.label || 'Template'}
            />
        )}
        
        {logoUrl && (
            <img 
                src={logoUrl} 
                alt="Logo" 
                className="absolute top-[1vw] left-[1vw] z-[20] rounded-[0.5vw] w-[4vw] h-[4vw] object-contain" 
            />
        )}

        <div className="absolute left-0 right-0 text-center z-10 flex flex-col items-center" style={{ bottom: '1.5vw', paddingLeft: '0.8vw', paddingRight: '0.8vw' }}>
            <h4 className="leading-tight break-words w-full" style={{
                fontFamily: text1FontFamily,
                fontSize: typeof text1FontSize === 'number' ? `${(text1FontSize / 15) * 1.1}vw` : '1.3vw',
                fontWeight: text1FontWeight === 'Regular' ? '400' : text1FontWeight === 'Medium' ? '500' : text1FontWeight === 'Semi Bold' ? '600' : text1FontWeight === 'Bold' ? '700' : '900',
                letterSpacing: text1LetterSpacing === 'Auto' ? 'normal' : `${(text1LetterSpacing || 0) / 10}em`,
                lineHeight: text1LineHeight === 'Auto' ? '1.1' : String(text1LineHeight || 1.1),
                textAlign: text1Align || 'center',
                color: text1Color || '#000000',
                opacity: (text1ColorOpacity !== undefined ? text1ColorOpacity : 100) / 100,
                fontStyle: text1Italic ? 'italic' : 'normal',
                textDecoration: [text1Underline ? 'underline' : '', text1Linethrough ? 'line-through' : ''].filter(Boolean).join(' ') || 'none'
            }}>{text1 || 'Title'}</h4>
            <p className="whitespace-pre-wrap break-words w-full" style={{
                marginTop: '0.2vw',
                fontFamily: text2FontFamily,
                fontSize: typeof text2FontSize === 'number' ? `${(text2FontSize / 15) * 1.1}vw` : '0.7vw',
                fontWeight: text2FontWeight === 'Regular' ? '400' : text2FontWeight === 'Medium' ? '500' : text2FontWeight === 'Semi Bold' ? '600' : text2FontWeight === 'Bold' ? '700' : '900',
                letterSpacing: text2LetterSpacing === 'Auto' ? '0.2em' : `${(text2LetterSpacing || 0) / 10}em`,
                lineHeight: text2LineHeight === 'Auto' ? 'normal' : String(text2LineHeight || 'normal'),
                textAlign: text2Align || 'center',
                color: text2Color || '#000000',
                opacity: (text2ColorOpacity !== undefined ? text2ColorOpacity : 100) / 100,
                fontStyle: text2Italic ? 'italic' : 'normal',
                textDecoration: [text2Underline ? 'underline' : '', text2Linethrough ? 'line-through' : ''].filter(Boolean).join(' ') || 'none'
            }}>{text2 || 'Supporting Text'}</p>
        </div>
    </div>
);

export const CoverPicturePopup = ({ onClose, onSave, onPreview, settings, pages = [], zIndex = 'z-[200]', inline = false }) => {
  const [option, setOption] = useState(settings.coverPicture?.type || 'template');
  const [activeTab, setActiveTab] = useState(settings.coverPicture?.activeTab || 'cover');
  const [selectedTemplate, setSelectedTemplate] = useState(settings.coverPicture?.selectedTemplate || COVER_TEMPLATES[0]);

  const [uploadedImage, setUploadedImage] = useState(settings.coverPicture?.type === 'upload' ? settings.coverPicture.url : null);
  const [originalImage, setOriginalImage] = useState(settings.coverPicture?.type === 'upload' ? settings.coverPicture.url : null);
  const [isCropping, setIsCropping] = useState(false);
  const previewImgRef = React.useRef(null);
  const [rawFile, setRawFile] = useState(null);
  const [imageFixType, setImageFixType] = useState(settings.coverPicture?.fit || 'Fit');
  const [showMenu, setShowMenu] = useState(false);

  const [text1, setText1] = useState(settings.coverPicture?.text1 || 'Title');
  const [text2, setText2] = useState(settings.coverPicture?.text2 || 'Supporting Text');
  const [bgColor, setBgColor] = useState(settings.coverPicture?.bgColor || '#D7D8E8');
  const [bgOpacity, setBgOpacity] = useState(settings.coverPicture?.bgOpacity || 100);
  const [shadowColor, setShadowColor] = useState(settings.coverPicture?.shadowColor || '#000000');
  const [shadowOpacity, setShadowOpacity] = useState(settings.coverPicture?.shadowOpacity || 80);
  const [shadowX, setShadowX] = useState(settings.coverPicture?.shadowX || 0);
  const [shadowY, setShadowY] = useState(settings.coverPicture?.shadowY || 0);
  const [shadowBlur, setShadowBlur] = useState(settings.coverPicture?.shadowBlur || 35);
  const [logoUrl, setLogoUrl] = useState(settings.coverPicture?.logoUrl || null);
  const logoInputRef = React.useRef(null);

  // Typography states for Text 1
  const [text1FontFamily, setText1FontFamily] = useState(settings.coverPicture?.text1FontFamily || 'Poppins');
  const [text1FontSize, setText1FontSize] = useState(settings.coverPicture?.text1FontSize || 16);
  const [text1FontWeight, setText1FontWeight] = useState(settings.coverPicture?.text1FontWeight || 'Bold');
  const [text1LetterSpacing, setText1LetterSpacing] = useState(settings.coverPicture?.text1LetterSpacing || 'Auto');
  const [text1LineHeight, setText1LineHeight] = useState(settings.coverPicture?.text1LineHeight || 'Auto');
  const [text1Align, setText1Align] = useState(settings.coverPicture?.text1Align || 'center');
  const [text1Bold, setText1Bold] = useState(settings.coverPicture?.text1Bold || false);
  const [text1Italic, setText1Italic] = useState(settings.coverPicture?.text1Italic || false);
  const [text1Underline, setText1Underline] = useState(settings.coverPicture?.text1Underline || false);
  const [text1Linethrough, setText1Linethrough] = useState(settings.coverPicture?.text1Linethrough || false);
  const [text1Color, setText1Color] = useState(settings.coverPicture?.text1Color || '#FFFFFF');
  const [text1ColorOpacity, setText1ColorOpacity] = useState(settings.coverPicture?.text1ColorOpacity || 100);

  // Typography states for Text 2
  const [text2FontFamily, setText2FontFamily] = useState(settings.coverPicture?.text2FontFamily || 'Outfit');
  const [text2FontSize, setText2FontSize] = useState(settings.coverPicture?.text2FontSize || 12);
  const [text2FontWeight, setText2FontWeight] = useState(settings.coverPicture?.text2FontWeight || 'Regular');
  const [text2LetterSpacing, setText2LetterSpacing] = useState(settings.coverPicture?.text2LetterSpacing || 'Auto');
  const [text2LineHeight, setText2LineHeight] = useState(settings.coverPicture?.text2LineHeight || 'Auto');
  const [text2Align, setText2Align] = useState(settings.coverPicture?.text2Align || 'center');
  const [text2Bold, setText2Bold] = useState(settings.coverPicture?.text2Bold || false);
  const [text2Italic, setText2Italic] = useState(settings.coverPicture?.text2Italic || true);
  const [text2Underline, setText2Underline] = useState(settings.coverPicture?.text2Underline || false);
  const [text2Linethrough, setText2Linethrough] = useState(settings.coverPicture?.text2Linethrough || false);
  const [text2Color, setText2Color] = useState(settings.coverPicture?.text2Color || '#FFFFFF');
  const [text2ColorOpacity, setText2ColorOpacity] = useState(settings.coverPicture?.text2ColorOpacity || 90);

  // Typography UI states
  const [activeTextEditor, setActiveTextEditor] = useState(null);
  const [showFontFamilyDropdown, setShowFontFamilyDropdown] = useState(false);
  const [showFontSizeDropdown, setShowFontSizeDropdown] = useState(false);
  const [showFontWeightDropdown, setShowFontWeightDropdown] = useState(false);
  const [showLetterSpacingSlider, setShowLetterSpacingSlider] = useState(false);
  const [showLineHeightSlider, setShowLineHeightSlider] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showShadowColorPicker, setShowShadowColorPicker] = useState(false);

  const [selectedPages, setSelectedPages] = useState(settings.coverPicture?.selectedPages || []);

  // Notify parent of changes for real-time preview
  React.useEffect(() => {
    if (onPreview) {
      onPreview({
        type: option,
        activeTab,
        selectedTemplate,
        url: option === 'upload' ? uploadedImage : (selectedTemplate?.src || ''),
        fit: imageFixType,
        text1,
        text2,
        bgColor,
        bgOpacity,
        shadowColor,
        shadowOpacity,
        shadowX,
        shadowY,
        shadowBlur,
        logoUrl,
        text1FontFamily,
        text1FontSize,
        text1FontWeight,
        text1LetterSpacing,
        text1LineHeight,
        text1Align,
        text1Bold,
        text1Italic,
        text1Underline,
        text1Linethrough,
        text1Color,
        text1ColorOpacity,
        text2FontFamily,
        text2FontSize,
        text2FontWeight,
        text2LetterSpacing,
        text2LineHeight,
        text2Align,
        text2Bold,
        text2Italic,
        text2Underline,
        text2Linethrough,
        text2Color,
        text2ColorOpacity,
        selectedPages
      });
    }
  }, [option, activeTab, selectedTemplate, uploadedImage, imageFixType, text1, text2, bgColor, bgOpacity, shadowColor, shadowOpacity, shadowX, shadowY, shadowBlur, logoUrl, text1FontFamily, text1FontSize, text1FontWeight, text1LetterSpacing, text1LineHeight, text1Align, text1Bold, text1Italic, text1Underline, text1Linethrough, text1Color, text1ColorOpacity, text2FontFamily, text2FontSize, text2FontWeight, text2LetterSpacing, text2LineHeight, text2Align, text2Bold, text2Italic, text2Underline, text2Linethrough, text2Color, text2ColorOpacity, selectedPages, onPreview]);

  const handleCoverUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
       const file = e.target.files[0];
       setRawFile(file);
       const url = URL.createObjectURL(file);
       setUploadedImage(url);
       setOriginalImage(url);
       setShowMenu(false);
    }
  };

  const handleLogoUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
       const file = e.target.files[0];
       const url = URL.createObjectURL(file);
       setLogoUrl(url);
    }
  };
  const togglePageSelection = (pageNum) => {
     setSelectedPages(prev => 
       prev.includes(pageNum) 
         ? prev.filter(p => p !== pageNum) 
         : [...prev, pageNum]
     );
  };
    const innerContent = (
    <div className={`${inline ? 'px-[0.2vw] pt-[0.2vw]' : 'px-[1.5vw]'} pb-[1vw] flex flex-col h-[32.2vw] overflow-hidden`}>
      {/* Options */}
      <div className="flex items-center gap-[0.8vw] mb-[0.8vw] shrink-0">
        <button 
          onClick={() => setOption('template')}
          className={`px-[1.2vw] py-[0.5vw] rounded-[0.5vw] font-semibold text-[0.75vw] transition-all cursor-pointer ${option === 'template' ? 'bg-white text-gray-900 shadow-[0_2px_10px_rgba(0,0,0,0.08)] border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Add from Templates
        </button>
        <button 
          onClick={() => setOption('upload')}
          className={`px-[1.2vw] py-[0.5vw] rounded-[0.5vw] font-semibold text-[0.75vw] transition-all cursor-pointer ${option === 'upload' ? 'bg-white text-gray-900 shadow-[0_2px_10px_rgba(0,0,0,0.08)] border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Upload cover picture
        </button>

         {option === 'upload' && (
          <div className="flex items-center gap-[0.8vw] ml-[2vw]">
             <label className="text-[0.75vw] font-semibold text-gray-700">Image fix type : </label>
      <PremiumDropdown 
        options={['Fit', 'Fill', 'Stretch', 'Crop']}
        value={imageFixType || 'Fit'}
        onChange={(val) => {
            setImageFixType(val);
            if (val === 'Crop' && uploadedImage) {
                setIsCropping(true);
            }
        }}
        width="6vw"
        align="right"
      />
          </div>
        )}
      </div>

      {option === 'upload' ? (
          <div className="flex gap-[2vw] flex-1 min-h-0">
            {/* Left Upload/Preview Area */}
            <div className="w-[50%] flex items-start justify-center pt-[0.5vw] relative">
               {!uploadedImage ? (
                  <div className="w-[23vw] h-[17.5vw] border-[0.15vw] border-dashed border-gray-300 rounded-[0.9vw] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors relative">
                     <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleCoverUpload} />
                     <span className="text-[0.75vw] text-gray-400 font-semibold mb-[1vw]">Drag & Drop or <span className="text-[#4A3AFF] font-bold">Upload</span></span>
                     <Upload size="1.8vw" className="text-gray-400 mb-[1vw]" strokeWidth={1.5} />
                     <span className="text-[0.6vw] text-gray-400 mb-[0.3vw]">Dimensions 1080 X 880 px</span>
                     <span className="text-[0.6vw] text-gray-400">Supported File Format : JPG, PNG</span>
                  </div>
               ) : (
                  <div className="w-[23vw] h-[17.5vw] bg-[#edd8cd] rounded-[0.9vw] overflow-hidden relative group shadow-inner flex items-center justify-center border border-amber-100/40">
                     <img 
                         ref={previewImgRef}
                         src={uploadedImage} 
                         className="w-full h-full object-cover" 
                         alt="Uploaded Cover" 
                     />
                     <button 
                         onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                         className="absolute top-[0.8vw] right-[0.8vw] w-[2.2vw] h-[2.2vw] bg-white rounded-full flex items-center justify-center text-gray-600 shadow-lg hover:bg-gray-100 transition-all z-30"
                         title="More Options"
                     >
                         <MoreVertical size="1.2vw" />
                     </button>

                     {showMenu && (
                         <div className="absolute top-[2vw] right-[0.8vw] bg-white rounded-[0.4vw] shadow-[0_4px_15px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center py-[0.5vw] border border-gray-100 z-20 overflow-hidden">
                            <button 
                               className="px-[1.2vw] py-[0.5vw] hover:bg-gray-50 text-[0.75vw] font-semibold text-gray-700 w-full text-center border-b border-gray-100 whitespace-nowrap" 
                               onClick={() => {
                                   document.getElementById('replace-cover-input').click();
                                   setShowMenu(false);
                               }}
                            >
                               Replace Image
                            </button>
                            <button 
                               className="px-[1.2vw] py-[0.5vw] hover:bg-gray-50 text-[0.75vw] font-semibold text-red-500 w-full text-center whitespace-nowrap" 
                               onClick={() => { 
                                   setUploadedImage(null); 
                                   setOriginalImage(null); 
                                   setRawFile(null); 
                                   setShowMenu(false); 
                               }}
                            >
                               Delete Image
                            </button>
                         </div>
                     )}
                     <input type="file" id="replace-cover-input" className="hidden" accept="image/*" onChange={handleCoverUpload} />
                  </div>
               )}
            </div>

            {/* Right Area */}
            <div className="w-[50%] flex flex-col justify-end mb-[2.5vw] pl-[1vw]">
              <p className="text-[0.65vw] text-gray-500 font-medium mb-[1vw] pr-[0.5vw]">
                 <span className="text-red-500">*</span> Your selected or uploaded image will be saved as the flipbook cover after clicking <strong>"Change Cover"</strong>
              </p>
              <div className="flex gap-[0.8vw] ">
                 <button 
                     onClick={onClose} 
                     className="flex-1 py-[0.6vw] border border-gray-900 rounded-[0.5vw] text-[0.8vw] font-semibold text-gray-900 hover:bg-gray-50 transition-colors flex items-center justify-center gap-[0.4vw] shadow-sm"
                 >
                    <X size="1vw" strokeWidth={2.5} /> Cancel
                 </button>
                 <button 
                     onClick={() => { 
                         onSave({ 
                             type: 'upload', 
                             url: uploadedImage, 
                             fit: imageFixType,
                             rawFile: rawFile
                         }); 
                         onClose(); 
                     }} 
                     className="flex-1 py-[0.6vw] bg-black text-white rounded-[0.5vw] text-[0.8vw] font-semibold hover:bg-zinc-800 transition-colors flex items-center justify-center gap-[0.4vw] shadow-sm"
                 >
                    <Check size="1vw" strokeWidth={3} /> Change Cover
                 </button>
              </div>
            </div>
         </div>
      ) : (
      <div className="flex flex-col flex-1 min-h-0">
          <div className="flex gap-[1vw] flex-1 min-h-0">
            {/* Left Preview */}
            <div className="w-[45%] flex items-start justify-center pt-[0.5vw] relative">
               <div className="relative group rounded-[0.9vw] bg-[#edd8cd] w-[23vw] h-[17.5vw] flex items-center justify-center shadow-inner overflow-hidden border border-amber-100/40">
                  {option === 'template' && selectedTemplate ? (
                     <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-gray-100 rounded-[0.5vw]">
                        <TemplatePreview 
                            selectedTemplate={selectedTemplate}
                            bgColor={bgColor} bgOpacity={bgOpacity}
                            shadowX={shadowX} shadowY={shadowY} shadowBlur={shadowBlur} shadowColor={shadowColor}
                            logoUrl={logoUrl}
                            text1={text1} text1FontFamily={text1FontFamily} text1FontSize={text1FontSize} text1FontWeight={text1FontWeight} text1LetterSpacing={text1LetterSpacing} text1LineHeight={text1LineHeight} text1Align={text1Align} text1Color={text1Color} text1ColorOpacity={text1ColorOpacity} text1Italic={text1Italic} text1Underline={text1Underline} text1Linethrough={text1Linethrough}
                            text2={text2} text2FontFamily={text2FontFamily} text2FontSize={text2FontSize} text2FontWeight={text2FontWeight} text2LetterSpacing={text2LetterSpacing} text2LineHeight={text2LineHeight} text2Align={text2Align} text2Color={text2Color} text2ColorOpacity={text2ColorOpacity} text2Italic={text2Italic} text2Underline={text2Underline} text2Linethrough={text2Linethrough}
                            selectedPages={selectedPages} pages={pages}
                        />
                     </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-[0.75vw] font-medium">
                      No preview
                    </div>
                  )}
               </div>
            </div>

            {/* Right Controls */}
            <div className="w-[55%] flex flex-col bg-gray-200/60 rounded-[1.2vw] border-[0.12vw] border-gray-300 overflow-hidden relative">
               {/* Tabs Header */}
               <div className="flex bg-gray-200/90 border-b border-gray-300 shrink-0">
                  <button 
                    onClick={() => setActiveTab('cover')} 
                    className={`flex-1 py-[0.5vw] text-[0.75vw] font-semibold transition-all relative ${activeTab === 'cover' ? 'text-gray-900 bg-white/20' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Cover Template
                    {activeTab === 'cover' && <div className="absolute bottom-0 left-0 right-0 h-[0.1vw] bg-black rounded-full" />}
                  </button>
                  <button 
                    onClick={() => setActiveTab('edit')} 
                    className={`flex-1 py-[0.5vw] text-[0.75vw] font-semibold transition-all relative ${activeTab === 'edit' ? 'text-gray-900 bg-white/20' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Edit Template
                    {activeTab === 'edit' && <div className="absolute bottom-0 left-0 right-0 h-[0.1vw] bg-black rounded-full" />}
                  </button>
               </div>

               {/* White Content Container */}
               <div className="flex-1 bg-white overflow-hidden m-[0.1vw] rounded-b-[1.1vw] relative shadow-inner flex flex-col">
                  <div className="flex-1 overflow-y-auto px-[1vw] py-[1.2vw] pr-[1.2vw] custom-popup-scrollbar">
                     {activeTab === 'cover' ? (
                        <div className="grid grid-cols-3 gap-[0.5vw]">
                           {COVER_TEMPLATES.map((tpl) => (
                              <div
                                 key={tpl.id}
                                 onClick={() => setSelectedTemplate(tpl)}
                                 className={`aspect-[3/4] rounded-[0.4vw] cursor-pointer overflow-hidden border-[0.15vw] transition-all hover:scale-[1.03] hover:shadow-md relative group ${
                                 selectedTemplate?.id === tpl.id
                                    ? 'border-[#4A3AFF] shadow-[0_0_0_0.15vw_rgba(74,58,255,0.3)]'
                                    : 'border-transparent hover:border-gray-400'
                                 }`}
                                 title={tpl.label}
                              >
                                 {tpl.id === 1 ? (
                                    <div className="w-full h-full bg-[#edd8cd] flex items-center justify-center relative overflow-hidden">
                                       <div className="relative w-[5vw] h-[5.5vw] flex items-center justify-center scale-[0.45]">
                                          <div className="absolute w-[10vw] h-[13.5vw] bg-gradient-to-br from-orange-500 to-amber-600 rounded-[0.6vw] shadow-xl transform -rotate-6 border border-orange-400 p-[0.7vw] flex flex-col justify-between text-white">
                                             <span className="text-[0.7vw] font-bold tracking-widest uppercase opacity-85">HARD.COVER</span>
                                             <div>
                                                <h3 className="text-[0.85vw] font-black leading-tight">Hard.Cover Book</h3>
                                                <p className="text-[0.6vw] opacity-90 mt-[0.1vw]">Free .psd Mockup</p>
                                             </div>
                                          </div>
                                          <div className="absolute w-[10vw] h-[13.5vw] bg-gradient-to-br from-amber-600 to-orange-500 rounded-[0.6vw] shadow-2xl transform rotate-6 border border-amber-400 p-[0.7vw] flex flex-col justify-between text-white">
                                             <span className="text-[0.7vw] font-bold tracking-widest uppercase opacity-85">HARD.COVER</span>
                                             <div>
                                                <h3 className="text-[0.85vw] font-black leading-tight">Hard.Cover Book</h3>
                                                <p className="text-[0.6vw] opacity-90 mt-[0.1vw]">Free .psd Mockup</p>
                                             </div>
                                          </div>
                                       </div>
                                    </div>
                                 ) : (
                                    <img src={tpl.src} alt={tpl.label} className="w-full h-full object-cover" />
                                 )}
                                 {selectedTemplate?.id === tpl.id && (
                                    <div className="absolute inset-0 bg-[#4A3AFF]/15 flex items-start justify-end p-[0.3vw]">
                                    <div className="w-[1vw] h-[1vw] bg-[#4A3AFF] rounded-full flex items-center justify-center shadow-md">
                                       <svg viewBox="0 0 10 10" className="w-[0.6vw] h-[0.6vw]" fill="none">
                                          <polyline points="2,5 4.5,7.5 8,3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                       </svg>
                                    </div>
                                    </div>
                                 )}
                                 <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[0.5vw] font-semibold text-center py-[0.2vw] opacity-0 group-hover:opacity-100 transition-opacity">
                                    {tpl.label}
                                 </div>
                              </div>
                           ))}
                        </div>
                     ) : (
                        <div className="space-y-[1.2vw]">
                           {/* Text 1 Row */}
                           <div className="flex items-center gap-[0.5vw] min-w-0">
                              <span className="text-[0.7vw] font-semibold text-gray-700 w-[6vw] shrink-0">Enter Text 1 :</span>
                              <div className="flex-1 flex gap-[0.5vw] items-center relative">
                                 <div className="flex-1 bg-white border border-gray-400 rounded-[0.6vw] flex items-center px-[0.8vw] h-[2.2vw] relative">
                                    <input type="text" value={text1} onChange={e => setText1(e.target.value)} className="flex-1 bg-transparent text-[0.8vw] outline-none text-gray-700 font-medium focus:border-black transition-colors pr-[1.8vw]" placeholder="Title" />
                                    <Edit2 size="0.8vw" className="text-gray-400 absolute right-[0.6vw]" />
                                 </div>
                                 <button 
                                    onClick={() => setActiveTextEditor(activeTextEditor === 'text1' ? null : 'text1')}
                                    className={`p-[0.4vw] rounded-[0.4vw] transition-colors cursor-pointer ${activeTextEditor === 'text1' ? 'bg-[#4A3AFF] text-white hover:bg-blue-700 shadow-sm' : 'text-gray-700 hover:bg-gray-100'}`}
                                 >
                                    <Sliders size="1vw" />
                                 </button>
                                 {activeTextEditor === 'text1' && (
                                     <TypographyPanel
                                         isT1={true}
                                         fontFamily={text1FontFamily} setFontFamily={setText1FontFamily}
                                         fontSize={text1FontSize} setFontSize={setText1FontSize}
                                         fontWeight={text1FontWeight} setFontWeight={setText1FontWeight}
                                         letterSpacing={text1LetterSpacing} setLetterSpacing={setText1LetterSpacing}
                                         lineHeight={text1LineHeight} setLineHeight={setText1LineHeight}
                                         align={text1Align} setAlign={setText1Align}
                                         italic={text1Italic} setItalic={setText1Italic}
                                         underline={text1Underline} setUnderline={setText1Underline}
                                         linethrough={text1Linethrough} setLinethrough={setText1Linethrough}
                                         color={text1Color} setColor={setText1Color}
                                         opacity={text1ColorOpacity} setOpacity={setText1ColorOpacity}
                                         onClose={() => setActiveTextEditor(null)}
                                     />
                                 )}
                              </div>
                           </div>

                           {/* Text 2 Row */}
                           <div className="flex items-start gap-[0.5vw] min-w-0">
                              <span className="text-[0.7vw] font-semibold text-gray-700 w-[6vw] shrink-0 mt-[0.5vw]">Enter Text 2 :</span>
                              <div className="flex-1 flex gap-[0.5vw] items-start relative">
                                 <div className="flex-1 bg-white border border-gray-400 rounded-[0.6vw] flex flex-col p-[0.7vw] min-h-[5.5vw] relative">
                                    <textarea value={text2} onChange={e => setText2(e.target.value)} className="flex-1 bg-transparent text-[0.8vw] outline-none text-gray-700 resize-none h-full font-medium pr-[1.8vw]" placeholder="Supporting Text" />
                                    <Edit2 size="0.8vw" className="text-gray-400 absolute bottom-[0.7vw] right-[0.7vw]" />
                                 </div>
                                 <button 
                                    onClick={() => setActiveTextEditor(activeTextEditor === 'text2' ? null : 'text2')}
                                    className={`p-[0.4vw] rounded-[0.4vw] transition-colors cursor-pointer ${activeTextEditor === 'text2' ? 'bg-[#4A3AFF] text-white hover:bg-blue-700 shadow-sm' : 'text-gray-700 hover:bg-gray-100'}`}
                                 >
                                    <Sliders size="1vw" />
                                 </button>
                                 {activeTextEditor === 'text2' && (
                                     <TypographyPanel
                                         isT1={false}
                                         fontFamily={text2FontFamily} setFontFamily={setText2FontFamily}
                                         fontSize={text2FontSize} setFontSize={setText2FontSize}
                                         fontWeight={text2FontWeight} setFontWeight={setText2FontWeight}
                                         letterSpacing={text2LetterSpacing} setLetterSpacing={setText2LetterSpacing}
                                         lineHeight={text2LineHeight} setLineHeight={setText2LineHeight}
                                         align={text2Align} setAlign={setText2Align}
                                         italic={text2Italic} setItalic={setText2Italic}
                                         underline={text2Underline} setUnderline={setText2Underline}
                                         linethrough={text2Linethrough} setLinethrough={setText2Linethrough}
                                         color={text2Color} setColor={setText2Color}
                                         opacity={text2ColorOpacity} setOpacity={setText2ColorOpacity}
                                         onClose={() => setActiveTextEditor(null)}
                                     />
                                 )}
                              </div>
                           </div>

                           {/* Background Color Row */}
                           <div className="flex items-center gap-[0.5vw] min-w-0">
                              <span className="text-[0.7vw] font-semibold text-gray-700 w-[6vw] shrink-0">Background :</span>
                              <div className="flex gap-[0.5vw] items-center flex-1">
                                 <div className="relative">
                                    <div 
                                      onClick={() => setShowBgColorPicker(!showBgColorPicker)}
                                      className="w-[2vw] h-[2vw] border border-gray-200 rounded-[0.5vw] shadow-[0_2px_4px_rgba(0,0,0,0.06)] cursor-pointer hover:border-indigo-400 transition-colors shrink-0"
                                      style={{ backgroundColor: bgColor }}
                                    ></div>
                                    {showBgColorPicker && createPortal(
                                        <>
                                            <div className="fixed inset-0 z-[999990]" onClick={() => setShowBgColorPicker(false)} />
                                            <div className="fixed top-1/2 -translate-y-1/2 left-[calc(50%+16.5vw)] z-[999999] w-[14vw]">
                                                <ColorPicker 
                                                    color={bgColor}
                                                    onChange={(newCol) => setBgColor(newCol)}
                                                    opacity={bgOpacity}
                                                    onOpacityChange={(newOp) => setBgOpacity(newOp)}
                                                    onClose={() => setShowBgColorPicker(false)}
                                                    className="w-full"
                                                    smallMode={true}
                                                    inline={true}
                                                />
                                            </div>
                                        </>, document.body
                                    )}
                                 </div>
                                 <div className="flex-1 h-[2vw] border border-gray-200 rounded-[0.5vw] flex items-center px-[0.75vw] justify-between bg-white hover:border-indigo-400 transition-colors shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
                                    <span className="text-[0.85vw] font-medium text-[#2563EB] font-mono uppercase">{bgColor}</span>
                                    <span className="text-[0.85vw] font-medium text-gray-400 font-mono">{bgOpacity}%</span>
                                 </div>
                                 {window.EyeDropper && (
                                   <button
                                     onClick={async () => {
                                       try {
                                         const eyeDropper = new window.EyeDropper();
                                         const result = await eyeDropper.open();
                                         setBgColor(result.sRGBHex.toUpperCase());
                                       } catch (e) {
                                         console.log(e);
                                       }
                                     }}
                                     className="w-[2vw] h-[2vw] border border-gray-200 rounded-[0.5vw] flex items-center justify-center bg-white shadow-sm hover:border-indigo-400 hover:bg-gray-50 transition-all cursor-pointer shrink-0"
                                     title="Eye Dropper"
                                   >
                                     <Icon icon="lucide:pipette" className="w-[1vw] h-[1vw] text-gray-500 hover:text-gray-800" />
                                   </button>
                                 )}
                              </div>
                           </div>

                    {/* Shadow Color & Sliders */}
                     <div className="space-y-[1.2vw]">
                        <div className="flex items-center gap-[0.5vw] min-w-0">
                           <span className="text-[0.7vw] font-semibold text-gray-700 w-[6vw] shrink-0">Shadow :</span>
                           <div className="flex gap-[0.5vw] items-center flex-1">
                              <div className="relative">
                                 <div 
                                    onClick={() => setShowShadowColorPicker(!showShadowColorPicker)}
                                    className="w-[2vw] h-[2vw] border border-gray-200 rounded-[0.5vw] shadow-[0_2px_4px_rgba(0,0,0,0.06)] cursor-pointer hover:border-indigo-400 transition-colors shrink-0" 
                                    style={{ backgroundColor: shadowColor }}
                                 ></div>
                                 {showShadowColorPicker && createPortal(
                                     <>
                                         <div className="fixed inset-0 z-[999990]" onClick={() => setShowShadowColorPicker(false)} />
                                         <div className="fixed top-1/2 -translate-y-1/2 left-[calc(50%+16.5vw)] z-[999999] w-[14vw]">
                                             <ColorPicker 
                                                 color={shadowColor}
                                                 onChange={(newCol) => setShadowColor(newCol)}
                                                 opacity={shadowOpacity}
                                                 onOpacityChange={(newOp) => setShadowOpacity(newOp)}
                                                 onClose={() => setShowShadowColorPicker(false)}
                                                 className="w-full"
                                                 smallMode={true}
                                                 inline={true}
                                             />
                                         </div>
                                     </>, document.body
                                 )}
                              </div>
                              <div className="flex-1 h-[2vw] border border-gray-200 rounded-[0.5vw] flex items-center px-[0.75vw] justify-between bg-white hover:border-indigo-400 transition-colors shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
                                 <span className="text-[0.85vw] font-medium text-[#2563EB] font-mono uppercase">{shadowColor}</span>
                                 <span className="text-[0.85vw] font-medium text-gray-400 font-mono">{shadowOpacity}%</span>
                              </div>
                              {window.EyeDropper && (
                                <button
                                  onClick={async () => {
                                    try {
                                      const eyeDropper = new window.EyeDropper();
                                      const result = await eyeDropper.open();
                                      setShadowColor(result.sRGBHex.toUpperCase());
                                    } catch (e) {
                                      console.log(e);
                                    }
                                  }}
                                  className="w-[2vw] h-[2vw] border border-gray-200 rounded-[0.5vw] flex items-center justify-center bg-white shadow-sm hover:border-indigo-400 hover:bg-gray-50 transition-all cursor-pointer shrink-0"
                                  title="Eye Dropper"
                                >
                                  <Icon icon="lucide:pipette" className="w-[1vw] h-[1vw] text-gray-500 hover:text-gray-800" />
                                </button>
                              )}
                           </div>
                        </div>
                        
                        <style>{`
                           .custom-range-slider { -webkit-appearance: none; width: 100%; background: transparent; position: relative; }
                           .custom-range-slider::before { content: ""; position: absolute; top: -0.75vw; bottom: -0.75vw; left: 0; right: 0; cursor: pointer; z-index: 1; }
                           .custom-range-slider::-webkit-slider-runnable-track { height: 0.2vw; border-radius: 0.1vw; background: inherit; }
                           .custom-range-slider::-webkit-slider-thumb { -webkit-appearance: none; height: 1vw; width: 1vw; border-radius: 50%; background: #4D47FF; border: 0.02vw solid #ffffff; box-shadow: 0 0.15vw 0.5vw rgba(77,71,255,0.4); margin-top: -0.4vw; cursor: pointer; transition: box-shadow 0.15s ease; position: relative; z-index: 2; }
                           .custom-range-slider::-webkit-slider-thumb:hover { box-shadow: 0 0.15vw 0.75vw rgba(77,71,255,0.6); }
                           .custom-range-slider::-moz-range-track { height: 0.2vw; border-radius: 0.1vw; background: inherit; }
                           .custom-range-slider::-moz-range-thumb { height: 1vw; width: 1vw; border-radius: 50%; background: #4D47FF; border: 0.02vw solid #ffffff; box-shadow: 0 0.15vw 0.5vw rgba(77,71,255,0.4); cursor: pointer; }
                           .custom-range-slider::-moz-range-thumb:hover { box-shadow: 0 0.15vw 0.75vw rgba(77,71,255,0.6); }
                        `}</style>
                        <div className="space-y-[0.8vw] pl-[6.5vw] pr-[0.5vw]">
                           <div className="flex items-center gap-[0.8vw]">
                              <span className="text-[0.7vw] font-semibold text-gray-700 w-[2vw] shrink-0 text-left">X Axis </span>
                              <div className="flex-1 flex items-center h-[1.5vw] gap-[0.8vw]">
                                 <input 
                                    type="range" 
                                    min="-50" 
                                    max="50" 
                                    value={shadowX}
                                    onChange={(e) => setShadowX(parseInt(e.target.value))}
                                    className="flex-1 cursor-pointer custom-range-slider"
                                    style={{
                                      backgroundImage: `linear-gradient(to right, #4D47FF 0%, #4D47FF ${shadowX + 50}%, #E2E8F0 ${shadowX + 50}%, #E2E8F0 100%)`
                                    }}
                                 />
                                 <span className="text-[0.7vw] font-bold text-gray-500 w-[1vw] text-right">{shadowX}</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-[0.8vw]">
                              <span className="text-[0.7vw] font-semibold text-gray-700 w-[2vw] shrink-0 text-left">Y Axis </span>
                              <div className="flex-1 flex items-center h-[1.5vw] gap-[0.8vw]">
                                 <input 
                                    type="range" 
                                    min="-50" 
                                    max="50" 
                                    value={shadowY}
                                    onChange={(e) => setShadowY(parseInt(e.target.value))}
                                    className="flex-1 cursor-pointer custom-range-slider"
                                    style={{
                                      backgroundImage: `linear-gradient(to right, #4D47FF 0%, #4D47FF ${shadowY + 50}%, #E2E8F0 ${shadowY + 50}%, #E2E8F0 100%)`
                                    }}
                                 />
                                 <span className="text-[0.7vw] font-bold text-gray-500 w-[1vw] text-right">{shadowY}</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-[0.8vw]">
                              <span className="text-[0.7vw] font-semibold text-gray-700 w-[2vw] shrink-0 text-left">Blur </span>
                              <div className="flex-1 flex items-center h-[1.5vw] gap-[0.8vw]">
                                 <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={shadowBlur}
                                    onChange={(e) => setShadowBlur(parseInt(e.target.value))}
                                    className="flex-1 cursor-pointer custom-range-slider"
                                    style={{
                                      backgroundImage: `linear-gradient(to right, #4D47FF 0%, #4D47FF ${shadowBlur}%, #E2E8F0 ${shadowBlur}%, #E2E8F0 100%)`
                                    }}
                                 />
                                 <span className="text-[0.7vw] font-bold text-gray-500 w-[1vw] text-right">{shadowBlur}%</span>
                              </div>
                           </div>
                        </div>
                     </div>

                    {/* Upload Logo Box */}
                    <div className="flex items-start gap-[0.5vw]">
                       <div className="w-[6.5vw] flex items-start justify-between shrink-0 pt-[0.5vw]">
                           <span className="text-[0.75vw] font-semibold text-gray-900">Upload Logo : </span>
                       </div>
                       <div className="flex-1 flex flex-col items-center">
                          <input 
                              type="file" 
                              ref={logoInputRef} 
                              accept="image/png, image/jpeg, image/jpg" 
                              className="hidden" 
                              onChange={handleLogoUpload} 
                          />
                          {logoUrl ? (
                              <div className="w-full border-[0.15vw] border-solid border-gray-300 rounded-[1vw] flex items-center justify-between p-[1vw] bg-white">
                                  <img src={logoUrl} alt="Logo" className="h-[2vw] object-contain" />
                                  <button onClick={() => setLogoUrl(null)} className="p-[0.4vw] bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors">
                                      <Trash2 size="1vw" />
                                  </button>
                              </div>
                          ) : (
                              <div onClick={() => logoInputRef.current?.click()} className="w-full border-[0.15vw] border-dashed border-gray-400 rounded-[1vw] flex flex-col items-center justify-center py-[1.5vw] bg-white cursor-pointer hover:bg-gray-50 transition-colors">
                                 <p className="text-[0.75vw] text-gray-500 font-medium whitespace-nowrap">
                                  + Add Logo 
                                 </p>
                              </div>
                          )}
                          </div>
                    </div>

                    {/* Select Pages Component */}
                    <div className="flex items-start gap-[0.5vw] pt-[1vw]">
                       <span className="text-[0.75vw] font-semibold text-gray-900 w-[6.5vw] shrink-0 pt-[0.5vw]">Select pages:</span>
                       <div className="bg-[#F2F2F2] rounded-[0.5vw] flex-1 border border-white shadow-sm overflow-hidden flex flex-col">
                          {/* Header */}
                          <div className="px-[0.8vw] py-[0.6vw] border-b border-gray-200">
                             <h3 className="text-[0.75vw] font-semibold text-gray-900">Select any - {selectedPages.length || 3} Pages</h3>
                          </div>
                          
                          <div className="flex w-full">
                             {/* Pages List */}
                             <div className="flex-1 py-[0.8vw] px-[1vw] space-y-[0.5vw] relative">
                                {pages.length > 0 ? pages.map((page, index) => {
                                   const pageNum = index + 1;
                                   const isChecked = selectedPages.includes(pageNum);
                                   return (
                                      <label key={pageNum} className="flex items-center gap-[0.8vw] cursor-pointer group" onClick={(e) => { e.preventDefault(); togglePageSelection(pageNum); }}>
                                         <div className={`w-[0.9vw] h-[0.9vw] rounded-[0.2vw] flex items-center justify-center transition-colors ${isChecked ? 'bg-black text-white' : 'border-[0.15vw] border-gray-400 bg-white group-hover:border-gray-500'}`}>
                                            {isChecked && <span className="text-[0.6vw] font-semibold ">{selectedPages.indexOf(pageNum) !== -1 ? selectedPages.indexOf(pageNum) + 1 : pageNum}</span>}
                                         </div>
                                         <span className={`text-[0.7vw] font-medium transition-colors ${isChecked ? 'text-gray-900' : 'text-gray-400'}`}>Page {pageNum}</span>
                                      </label>
                                   )
                                }) : (
                                   <span className="text-gray-400 text-[0.7vw] font-medium">No pages available</span>
                                )}
                             </div>

                             {/* Preview Image */}
                             <div className="w-[4vw] m-[0.8vw] ml-0 aspect-[3.5/5] bg-white border border-gray-200 rounded-[0.2vw] overflow-hidden shadow-md flex-shrink-0 relative">
                                {pages.length > 0 ? (
                                   <div className="absolute inset-0 pointer-events-none" style={{ transformOrigin: 'top left', transform: 'scale(0.2)', width: '500%', height: '500%' }}>
                                      <div dangerouslySetInnerHTML={{ __html: pages[selectedPages[selectedPages.length - 1] - 1]?.html || pages[0].html }} />
                                   </div>
                                ) : (
                                   <div className="w-full h-full bg-gray-50 flex items-center justify-center text-[0.5vw] text-gray-400 text-center">Preview</div>
                                )}
                             </div>
                          </div>
                        </div>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>
   </div>

       {/* Template Footer */}
       <div className="pt-[1vw] mb-[-1vw] flex items-center justify-between mt-[0.5vw] border-t border-gray-200 shrink-0">
         <p className="text-[0.65vw] text-gray-500 font-medium">
           <span className="text-red-500">*</span> Choose and customize a template, then click "Change Cover" to save as your flipbook cover
         </p>
         <div className="flex gap-[0.8vw]">
            <button 
                onClick={onClose} 
                className="px-[2vw] py-[0.6vw] border border-gray-400 rounded-[0.5vw] text-[0.8vw] font-semibold text-gray-900 hover:bg-gray-50 transition-colors flex items-center gap-[0.4vw] shadow-sm"
            >
               <X size="1vw" strokeWidth={2.5} /> Cancel
            </button>
            <button 
                onClick={() => { 
                    onSave({ 
                        type: 'template',
                        activeTab,
                        selectedTemplate,
                        url: selectedTemplate?.id === 1 ? '' : (selectedTemplate?.src || ''),
                        text1,
                        text2,
                        bgColor,
                        bgOpacity,
                        shadowColor,
                        shadowOpacity,
                        shadowX,
                        shadowY,
                        shadowBlur,
                        logoUrl,
                        text1FontFamily,
                        text1FontSize,
                        text1FontWeight,
                        text1LetterSpacing,
                        text1LineHeight,
                        text1Align,
                        text1Bold,
                        text1Italic,
                        text1Underline,
                        text1Linethrough,
                        text1Color,
                        text1ColorOpacity,
                        text2FontFamily,
                        text2FontSize,
                        text2FontWeight,
                        text2LetterSpacing,
                        text2LineHeight,
                        text2Align,
                        text2Bold,
                        text2Italic,
                        text2Underline,
                        text2Linethrough,
                        text2Color,
                        text2ColorOpacity,
                        selectedPages
                    });
                    onClose(); 
                }} 
                className="px-[3vw] py-[0.6vw] bg-black text-white rounded-[0.5vw] text-[0.8vw] font-semibold hover:bg-zinc-800 transition-colors flex items-center gap-[0.4vw] shadow-sm"
            >
               <Check size="1vw" strokeWidth={3} /> Save Changes
             </button>
          </div>
        </div>



          </div>
      )}
    </div>
  );

  if (inline) {
    return (
      <div className="w-full flex flex-col overflow-hidden relative mt-[1vw]" style={{ height: '32.2vw' }}>
        {innerContent}
        {isCropping && (
          <ImageCropOverlay 
            imageSrc={originalImage || uploadedImage}
            element={previewImgRef.current}
            onSave={({ crop }) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const sw = (crop.width / 100) * img.naturalWidth;
                    const sh = (crop.height / 100) * img.naturalHeight;
                    const sx = (crop.left / 100) * img.naturalWidth;
                    const sy = (crop.top / 100) * img.naturalHeight;
                    canvas.width = sw;
                    canvas.height = sh;
                    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
                    const croppedSrc = canvas.toDataURL('image/png');
                    setUploadedImage(croppedSrc);
                    canvas.toBlob((blob) => {
                       const file = new File([blob], "cover_cropped.png", { type: "image/png" });
                       setRawFile(file);
                    }, 'image/png');
                    setIsCropping(false);
                };
                img.src = originalImage || uploadedImage;
            }}
            onCancel={() => {
                setIsCropping(false);
                setImageFixType('Fit');
            }}
          />
        )}
      </div>
    );
  }

  return ReactDOM.createPortal(
    <div className={`fixed inset-0 ${zIndex} bg-black/40 flex items-center justify-center animate-in fade-in duration-200`}>
      <div className="bg-white rounded-[1vw] shadow-2xl max-h-[94vh] w-[65vw] max-w-[700px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-[1.5vw] py-[1.2vw]">
          <div className="flex items-center gap-[1vw] flex-1">
             <h2 className="text-[1vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Cover Picture Customization</h2>
             <div className="h-[0.0925vw] bg-gray-200 w-full"> </div>
          </div>
          <button onClick={onClose} className="w-[1.8vw] h-[1.8vw] rounded-[0.4vw] border border-red-200 flex items-center justify-center text-red-500 hover:bg-red-50 ml-[1vw] shrink-0 transition-colors">
            <X size="1.2vw" />
          </button>
        </div>

        {/* Content */}
        {innerContent}
      </div>
    </div>,
    document.body
  );
};

const CoverPicturePopupWithStyles = (props) => (
  <>
    <style>{scrollbarStyles}</style>
    <CoverPicturePopup {...props} />
  </>
);

const FlipbookInfoModal = ({ isOpen, onClose, currentBook, onSaveSuccess }) => {
  const toast = useToast();

  const [bookName, setBookName] = useState('');
  const [quotes, setQuotes] = useState('');
  const [about, setAbout] = useState('');
  const [category, setCategory] = useState('Product Based');
  const [language, setLanguage] = useState('English');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [showCoverPopup, setShowCoverPopup] = useState(false);
  const [coverPicture, setCoverPicture] = useState(null);

  const bookId = currentBook?.v_id || currentBook?.id || currentBook?.realName || currentBook?.flipbookName || currentBook?.title || '';

  // Sync state when book ID changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setBookName(currentBook?.flipbookName || currentBook?.realName || currentBook?.title || '');
      setQuotes(currentBook?.quotes || currentBook?.quote || currentBook?.tagline || currentBook?.meta?.quotes || currentBook?.meta?.quote || currentBook?.meta?.tagline || '');
      setAbout(currentBook?.about || currentBook?.meta?.about || '');
      setCategory(currentBook?.category || currentBook?.meta?.category || 'Product Based');
      setLanguage(currentBook?.language || currentBook?.meta?.language || 'English');
      setErrors({});

      const cp = currentBook?.settings?.othersetup?.coverPicture || currentBook?.coverPicture || {
        type: 'template',
        url: '',
        selectedTemplate: COVER_TEMPLATES[0],
        fit: 'Fit'
      };
      setCoverPicture(cp);
    }
  }, [isOpen, bookId]);

  if (!isOpen) return null;

  const visibilityMode = currentBook?.share?.access || currentBook?.settings?.visibility?.type || 'Public';
  const pageCount = currentBook?.pages?.length || currentBook?.pageCount || 12;
  const thumbnailUrl = currentBook?.thumbnail || currentBook?.coverImage || null;

  const uploadFile = async (file) => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;

    const user = JSON.parse(storedUser);
    const formData = new FormData();
    formData.append('emailId', user.emailId || currentBook?.userEmail);
    formData.append('folderName', currentBook?.folder || 'My_Flipbooks');
    formData.append('flipbookName', currentBook?.flipbookName || currentBook?.realName || bookName || 'Untitled Document');
    formData.append('type', 'image');
    formData.append('assetType', 'Image');
    formData.append('page_v_id', 'popup_gallery');
    formData.append('file', file);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const res = await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData);
      if (res.data.url) {
        const fullUrl = res.data.url.startsWith('http') ? res.data.url : `${backendUrl}${res.data.url}`;
        return {
          url: fullUrl,
          file_v_id: res.data.file_v_id,
          name: res.data.filename
        };
      }
    } catch (err) {
      console.error("Cover image upload failed:", err);
    }
    return null;
  };

  const handleSaveClick = async () => {
    // Validate required fields
    const newErrors = {};
    if (!bookName.trim()) newErrors.bookName = "Flipbook Name is required.";
    if (!quotes.trim()) newErrors.quotes = "Quote / Tagline is required.";
    if (!about.trim()) newErrors.about = "About description is required.";
    if (!category.trim()) newErrors.category = "Category is required.";
    if (!language.trim()) newErrors.language = "Language is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstErr = Object.values(newErrors)[0];
      toast?.error?.(firstErr || "Please fill in all required fields.");
      return;
    }

    setErrors({});
    setIsSaving(true);
    try {
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const v_id = currentBook?.v_id || currentBook?.realName;
      const userEmail = user?.emailId || currentBook?.userEmail;

      if (userEmail && v_id) {
        await axios.post(`${backendUrl}/api/flipbook/update-settings`, {
          emailId: userEmail,
          v_id: v_id,
          newName: bookName.trim(),
          category: category.trim(),
          language: language.trim(),
          quotes: quotes.trim(),
          about: about.trim(),
          settings: {
            ...(currentBook?.settings || {}),
            othersetup: {
              ...(currentBook?.settings?.othersetup || {}),
              coverPicture: coverPicture
            }
          }
        });
      }

      toast?.success?.("Flipbook information updated successfully!");
      if (onSaveSuccess) {
        onSaveSuccess({ 
          bookName: bookName.trim(), 
          quotes: quotes.trim(), 
          about: about.trim(), 
          category: category.trim(), 
          language: language.trim(), 
          coverPicture 
        });
      }
      onClose();
    } catch (err) {
      console.error("Save info failed:", err);
      toast?.error?.("Failed to update flipbook information.");
    } finally {
      setIsSaving(false);
    }
  };

  const modalJsx = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-[1vw]">
      <style>{scrollbarStyles}</style>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div 
        className="relative bg-white w-[54vw] max-h-[94vh] rounded-[1.2vw] shadow-2xl animate-in fade-in zoom-in-95 duration-300 font-sans p-[1.6vw] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-[1vw] mb-[0.2vw]">
          <h2 className="text-[1.2vw] font-bold text-gray-900 whitespace-nowrap tracking-tight">
            {showCoverPopup ? (
              <>
                Flipbook Information <span className="text-gray-400 font-medium mx-[0.4vw]">&rarr;</span> Cover Picture Customization
              </>
            ) : (
              "Flipbook Information"
            )}
          </h2>
          <div className="flex-1 h-[1px] bg-gray-200" />
          <button
            onClick={showCoverPopup ? () => setShowCoverPopup(false) : onClose}
            className="p-[0.35vw] rounded-full hover:bg-gray-100 transition-colors border border-red-200 text-red-500 cursor-pointer flex-shrink-0"
          >
            <X size="1vw" />
          </button>
        </div>

        <p className="text-[0.78vw] text-gray-400 font-medium mb-[0.6vw]">
          {showCoverPopup 
            ? "Choose and customize cover template or upload a cover image" 
            : "Add basic details about your flipbook"}
        </p>

        {showCoverPopup ? (
          <CoverPicturePopup
            inline={true}
            settings={{ coverPicture }}
            pages={currentBook?.pages || []}
            onClose={() => setShowCoverPopup(false)}
            onSave={async (coverData) => {
              let finalUrl = coverData.url;

              // If it's an uploaded image, we must upload it to the server to get a permanent URL
              if (coverData.type === 'upload' && coverData.rawFile) {
                try {
                  const uploaded = await uploadFile(coverData.rawFile);
                  if (uploaded && uploaded.url) {
                    finalUrl = uploaded.url;
                  }
                } catch (err) {
                  console.error("Failed to upload cover picture", err);
                }
              }

              setCoverPicture({
                ...coverData,
                url: finalUrl,
                rawFile: null // Clear file object from state
              });
              setShowCoverPopup(false);
            }}
          />
        ) : (
          <>
            {/* 2-Column Grid Layout */}
            <div className="grid grid-cols-2 gap-[1.5vw]">
              {/* Left Column */}
              <div className="flex flex-col justify-between gap-[0.9vw]">
                <div className="relative group rounded-[0.9vw] bg-gray-50 h-[17.5vw] flex items-center justify-center shadow-inner overflow-hidden border border-gray-200/50">
                  {coverPicture?.type === 'template' ? (
                     <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-gray-100 rounded-[0.5vw]">
                        <TemplatePreview 
                            {...coverPicture} 
                            pages={currentBook?.pages || []} 
                        />
                     </div>
                  ) : coverPicture?.url ? (
                    <img 
                      src={coverPicture.url} 
                      alt="Flipbook Cover" 
                      className="w-full h-full object-cover"
                    />
                  ) : thumbnailUrl ? (
                    <img 
                      src={thumbnailUrl} 
                      alt="Flipbook Cover" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="relative w-[14vw] h-[15vw] flex items-center justify-center">
                      <div className="absolute w-[10vw] h-[13.5vw] bg-gradient-to-br from-orange-500 to-amber-600 rounded-[0.6vw] shadow-xl transform -rotate-6 border border-orange-400 p-[0.7vw] flex flex-col justify-between text-white">
                        <span className="text-[0.7vw] font-bold tracking-widest uppercase opacity-85">HARD.COVER</span>
                        <div>
                          <h3 className="text-[0.85vw] font-black leading-tight">Hard.Cover Book</h3>
                          <p className="text-[0.6vw] opacity-90 mt-[0.1vw]">Free .psd Mockup</p>
                        </div>
                      </div>
                      <div className="absolute w-[10vw] h-[13.5vw] bg-gradient-to-br from-amber-600 to-orange-500 rounded-[0.6vw] shadow-2xl transform rotate-6 border border-amber-400 p-[0.7vw] flex flex-col justify-between text-white">
                        <span className="text-[0.7vw] font-bold tracking-widest uppercase opacity-85">HARD.COVER</span>
                        <div>
                          <h3 className="text-[0.85vw] font-black leading-tight">Hard.Cover Book</h3>
                          <p className="text-[0.6vw] opacity-90 mt-[0.1vw]">Free .psd Mockup</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Replace Button Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                    <button
                      type="button"
                      onClick={() => setShowCoverPopup(true)}
                      className="px-[1.2vw] py-[0.6vw] bg-white text-black font-semibold text-[0.8vw] rounded-[0.5vw] hover:bg-gray-100 transition-all flex items-center gap-[0.4vw] shadow-lg cursor-pointer"
                    >
                      <Plus size="1vw" />
                      <span>Replace Cover</span>
                    </button>
                  </div>
                </div>

                {/* Bottom Input Group */}
                <div className="flex flex-col gap-[0.8vw]">
                  {/* Flipbook Name */}
                  <div>
                    <label className="text-[0.82vw] font-bold text-gray-900 mb-[0.3vw] block">
                      Flipbook Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        disabled
                        maxLength={20}
                        value={bookName}
                        onChange={(e) => {
                          setBookName(e.target.value);
                          if (errors.bookName) setErrors(prev => ({ ...prev, bookName: null }));
                        }}
                        placeholder="Name of the book"
                        className={`w-full border rounded-[0.5vw] px-[0.8vw] py-[0.5vw] pr-[3.2vw] text-[0.8vw] font-normal text-gray-600 bg-gray-50/70 cursor-not-allowed placeholder-gray-300 focus:outline-none shadow-xs transition-colors ${errors.bookName ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}`}
                      />
                      <span className="absolute right-[0.8vw] top-1/2 -translate-y-1/2 text-[0.7vw] text-gray-300 font-normal select-none">
                        {bookName.length}/20
                      </span>
                    </div>
                    {errors.bookName && <p className="text-[0.68vw] text-red-500 font-medium mt-[0.2vw]">{errors.bookName}</p>}
                  </div>

                  {/* Quote / Tagline */}
                  <div>
                    <label className="text-[0.82vw] font-bold text-gray-900 mb-[0.3vw] block">
                      Quote / Tagline <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={20}
                        value={quotes}
                        onChange={(e) => {
                          setQuotes(e.target.value);
                          if (errors.quotes) setErrors(prev => ({ ...prev, quotes: null }));
                        }}
                        placeholder="Quotes About Book"
                        className={`w-full border rounded-[0.5vw] px-[0.8vw] py-[0.5vw] pr-[3.2vw] text-[0.8vw] font-normal text-gray-800 placeholder-gray-300 focus:outline-none shadow-xs transition-colors ${errors.quotes ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:border-gray-400'}`}
                      />
                      <span className="absolute right-[0.8vw] top-1/2 -translate-y-1/2 text-[0.7vw] text-gray-300 font-normal select-none">
                        {quotes.length}/20
                      </span>
                    </div>
                    {errors.quotes && <p className="text-[0.68vw] text-red-500 font-medium mt-[0.2vw]">{errors.quotes}</p>}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="flex flex-col gap-[0.8vw]">
                {/* About */}
                <div>
                  <label className="text-[0.82vw] font-bold text-gray-900 mb-[0.3vw] block">
                    About <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <textarea
                      rows={3}
                      maxLength={100}
                      value={about}
                      onChange={(e) => {
                        setAbout(e.target.value);
                        if (errors.about) setErrors(prev => ({ ...prev, about: null }));
                      }}
                      placeholder="About Book"
                      className={`w-full border rounded-[0.5vw] px-[0.8vw] py-[0.5vw] pb-[1.5vw] text-[0.8vw] font-normal text-gray-800 placeholder-gray-300 focus:outline-none shadow-xs resize-none h-[5.5vw] transition-colors ${errors.about ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:border-gray-400'}`}
                    />
                    <span className="absolute right-[0.8vw] bottom-[0.5vw] text-[0.7vw] text-gray-300 font-normal select-none">
                      {about.length}/100
                    </span>
                  </div>
                  {errors.about && <p className="text-[0.68vw] text-red-500 font-medium mt-[0.2vw]">{errors.about}</p>}
                </div>

                {/* Category */}
                <div>
                  <label className="text-[0.82vw] font-bold text-gray-900 mb-[0.3vw] block">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        if (errors.category) setErrors(prev => ({ ...prev, category: null }));
                      }}
                      className={`w-full border rounded-[0.5vw] px-[0.8vw] py-[0.5vw] text-[0.8vw] font-normal text-gray-800 bg-white focus:outline-none appearance-none cursor-pointer shadow-xs transition-colors ${errors.category ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:border-gray-400'}`}
                    >
                      <option value="Product Based">Product Based</option>
                      <option value="Business">Business</option>
                      <option value="Catalog">Catalog</option>
                      <option value="Brochure">Brochure</option>
                      <option value="Magazine">Magazine</option>
                      <option value="Portfolio">Portfolio</option>
                      <option value="Education">Education</option>
                      <option value="Other">Other</option>
                    </select>
                    <ChevronDown size="1vw" className="text-gray-500 absolute right-[0.8vw] top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {errors.category && <p className="text-[0.68vw] text-red-500 font-medium mt-[0.2vw]">{errors.category}</p>}
                </div>

                {/* Language */}
                <div>
                  <label className="text-[0.82vw] font-bold text-gray-900 mb-[0.3vw] block">
                    Language <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={language}
                      onChange={(e) => {
                        setLanguage(e.target.value);
                        if (errors.language) setErrors(prev => ({ ...prev, language: null }));
                      }}
                      className={`w-full border rounded-[0.5vw] px-[0.8vw] py-[0.5vw] text-[0.8vw] font-normal text-gray-800 bg-white focus:outline-none appearance-none cursor-pointer shadow-xs transition-colors ${errors.language ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:border-gray-400'}`}
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Italian">Italian</option>
                      <option value="Portuguese">Portuguese</option>
                      <option value="Tamil">Tamil</option>
                      <option value="Japanese">Japanese</option>
                      <option value="Chinese">Chinese</option>
                    </select>
                    <ChevronDown size="1vw" className="text-gray-500 absolute right-[0.8vw] top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {errors.language && <p className="text-[0.68vw] text-red-500 font-medium mt-[0.2vw]">{errors.language}</p>}
                </div>

                {/* Total Pages */}
                <div>
                  <label className="text-[0.82vw] font-bold text-gray-900 mb-[0.3vw] block">Total Pages</label>
                  <input
                    type="text"
                    disabled
                    value={`${pageCount} Pages`}
                    className="w-full border border-gray-300 rounded-[0.5vw] px-[0.8vw] py-[0.5vw] text-[0.8vw] font-normal text-gray-600 bg-gray-50/70 cursor-not-allowed shadow-xs"
                  />
                </div>

                {/* Visibility Info Box */}
                <div className="bg-[#f0f4fe] border border-blue-100/60 rounded-[0.8vw] p-[0.7vw] space-y-[0.2vw]">
                  <div className="flex items-center gap-[0.4vw]">
                    <Info size="0.9vw" className="text-[#4338ca] flex-shrink-0" />
                    <span className="text-[0.78vw] font-semibold text-gray-800">
                      Visibility : <span className="text-[#4338ca] font-bold">{visibilityMode}</span>
                    </span>
                  </div>
                  <p className="text-[0.68vw] text-gray-500 leading-snug pl-[1.3vw]">
                    This flipbook will be published as {visibilityMode}.<br />
                    Change later from: <strong className="text-gray-700 font-semibold">Customize &gt; Visibility</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Divider Line */}
            <div className="w-full h-[1px] bg-gray-200 mt-[1.4vw] mb-[1.2vw]" />

            {/* Footer Action Buttons */}
            <div className="grid grid-cols-2 gap-[1.2vw]">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-[0.65vw] rounded-[0.5vw] border border-gray-300 bg-white text-gray-800 text-[0.85vw] font-semibold flex items-center justify-center gap-[0.4vw] hover:bg-gray-50 transition-all cursor-pointer shadow-xs"
              >
                <X size="0.95vw" />
                <span>Cancel</span>
              </button>

              <button
                type="button"
                onClick={handleSaveClick}
                disabled={isSaving}
                className="w-full py-[0.65vw] rounded-[0.5vw] bg-black hover:bg-gray-900 text-white text-[0.85vw] font-semibold flex items-center justify-center gap-[0.4vw] transition-all shadow-md cursor-pointer disabled:opacity-70"
              >
                {isSaving ? (
                  <div className="w-[0.95vw] h-[0.95vw] border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check size="0.95vw" />
                    <span>Save Info Changes</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modalJsx, document.body);
};

export default FlipbookInfoModal;
