import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown, Plus, Info, Upload } from 'lucide-react';
import axios from 'axios';
import { useToast } from './CustomToast';

const PublishModal = ({ isOpen, onClose, currentBook, onPublishSuccess }) => {
  const toast = useToast();

  const [bookName, setBookName] = useState('');
  const [quotes, setQuotes] = useState('');
  const [about, setAbout] = useState('');
  const [category, setCategory] = useState('Product Based');
  const [language, setLanguage] = useState('English');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [errors, setErrors] = useState({});

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
      setTagInput('');
      
      if (currentBook?.tags && Array.isArray(currentBook.tags)) {
        setTags(currentBook.tags);
      } else if (currentBook?.meta?.tags && Array.isArray(currentBook.meta.tags)) {
        setTags(currentBook.meta.tags);
      } else {
        setTags([]);
      }
    }
  }, [isOpen, bookId]);

  if (!isOpen) return null;

  const visibilityMode = currentBook?.share?.access || currentBook?.settings?.visibility?.type || 'Public';
  const pageCount = currentBook?.pages?.length || currentBook?.pageCount || 12;
  const thumbnailUrl = currentBook?.thumbnail || currentBook?.coverImage || null;
  const coverPicture = currentBook?.settings?.othersetup?.coverPicture || currentBook?.coverPicture || currentBook?.meta?.coverPicture;

  const handleAddTag = () => {
    if (tags.length >= 5) {
      toast?.error?.("Maximum 5 search tags allowed.");
      return;
    }
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      setTagInput('');
      return;
    }
    setTags([...tags, trimmed]);
    setTagInput('');
  };

  const handleRemoveTag = (indexToRemove) => {
    setTags(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const handlePublishClick = async () => {
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
    setIsPublishing(true);
    try {
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const v_id = currentBook?.v_id || currentBook?.realName;
      const userEmail = user?.emailId || currentBook?.userEmail;

      if (userEmail && v_id) {
        await axios.post(`${backendUrl}/api/flipbook/publish`, {
          emailId: userEmail,
          v_id: v_id,
          bookName: bookName.trim(),
          category: category.trim(),
          language: language.trim(),
          tags: tags,
          quotes: quotes.trim(),
          about: about.trim(),
          meta: {
            ...(currentBook?.meta || {}),
            quotes: quotes.trim(),
            about: about.trim(),
            category: category.trim(),
            language: language.trim(),
            tags: tags
          }
        });
      }

      toast?.success?.("Flipbook published successfully!");
      if (onPublishSuccess) {
        onPublishSuccess({
          bookName: bookName.trim(),
          category: category.trim(),
          language: language.trim(),
          tags,
          quotes: quotes.trim(),
          about: about.trim()
        });
      }
      onClose();
    } catch (err) {
      console.error("Publish failed:", err);
      toast?.error?.("Failed to publish flipbook.");
    } finally {
      setIsPublishing(false);
    }
  };

  const modalJsx = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-[1vw]">
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
          <h2 className="text-[1.2vw] font-bold text-gray-900 whitespace-nowrap tracking-tight">Publish Flipbook</h2>
          <div className="flex-1 h-[1px] bg-gray-200" />
          <button
            onClick={onClose}
            className="p-[0.35vw] rounded-full hover:bg-gray-100 transition-colors border border-red-200 text-red-500 cursor-pointer flex-shrink-0"
          >
            <X size="1vw" />
          </button>
        </div>

        <p className="text-[0.78vw] text-gray-400 font-medium mb-[1.2vw]">
          Make your flipbook live and share it with your audience
        </p>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-2 gap-[1.5vw]">
          {/* Left Column */}
          <div className="flex flex-col justify-between gap-[0.9vw]">
            {/* Book Preview Image Card */}
            <div className="relative rounded-[0.9vw] bg-gray-50 h-[17.5vw] flex items-center justify-center shadow-inner overflow-hidden border border-gray-200/50" style={{ backgroundColor: coverPicture?.bgColor || '#edd8cd' }}>
              {coverPicture?.type === 'template' ? (
                <div className="w-full h-[25vw] flex flex-col items-center justify-center p-[1vw] text-center relative overflow-hidden bg-[#F2F2F2] rounded-[1.2vw] shadow-inner" style={{ backgroundColor: coverPicture.bgColor || '#D7D8E8' }}>
                  {coverPicture.selectedTemplate?.id === 1 ? (
                     <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none" style={{ opacity: (coverPicture.bgOpacity !== undefined ? coverPicture.bgOpacity : 100) / 100, filter: `drop-shadow(${coverPicture.shadowX || 0}px ${coverPicture.shadowY || 0}px ${(coverPicture.shadowBlur || 35) / 10}px ${coverPicture.shadowColor || '#000000'})` }}>
                        {/* Back book */}
                        <div className={`absolute w-[14vw] h-[18.9vw] ${coverPicture.selectedPages?.length > 0 ? 'bg-white border-gray-200' : 'bg-gradient-to-br from-orange-500 to-amber-600 border-orange-400 p-[1vw]'} rounded-[0.8vw] shadow-xl transform -rotate-6 border flex flex-col justify-between text-white overflow-hidden`}>
                           <div className="absolute top-0 right-0 w-[5.6vw] h-[19.6vw] bg-white opacity-10 transform rotate-12 -translate-y-[1.4vw] translate-x-[1.4vw] z-10 pointer-events-none"></div>
                           {coverPicture.selectedPages?.length > 0 && currentBook?.pages?.[coverPicture.selectedPages[0] - 1] ? (
                               <div className="absolute inset-0 pointer-events-none bg-white" style={{ transformOrigin: 'top left', transform: 'scale(0.35)', width: '285.7%', height: '285.7%' }}>
                                  <div dangerouslySetInnerHTML={{ __html: currentBook.pages[coverPicture.selectedPages[0] - 1].html }} />
                               </div>
                           ) : (
                               <>
                                   <span className="text-[0.98vw] font-bold tracking-widest uppercase opacity-85 relative z-10">HARD.COVER</span>
                                   <div className="relative z-10">
                                      <h3 className="text-[1.19vw] font-black leading-tight">Hard.Cover Book</h3>
                                      <p className="text-[0.84vw] opacity-90 mt-[0.14vw]">Free .psd Mockup</p>
                                   </div>
                               </>
                           )}
                        </div>
                        
                        {/* Front book */}
                        <div className={`absolute w-[14vw] h-[18.9vw] ${coverPicture.selectedPages?.length > 0 ? 'bg-white border-gray-200' : 'bg-gradient-to-br from-amber-600 to-orange-500 border-amber-400 p-[1vw]'} rounded-[0.8vw] shadow-2xl transform rotate-6 border flex flex-col justify-between text-white overflow-hidden`}>
                           <div className="absolute top-0 left-0 w-[4.2vw] h-[19.6vw] bg-black opacity-10 filter blur-[0.28vw] -translate-x-[0.7vw] z-10 pointer-events-none"></div>
                           <div className="absolute top-0 right-0 w-[7vw] h-[19.6vw] bg-white opacity-20 transform rotate-12 -translate-y-[1.4vw] translate-x-[2.8vw] z-10 pointer-events-none"></div>
                           {coverPicture.selectedPages?.length > 0 && currentBook?.pages?.[coverPicture.selectedPages[1] ? coverPicture.selectedPages[1] - 1 : coverPicture.selectedPages[0] - 1] ? (
                               <div className="absolute inset-0 pointer-events-none bg-white" style={{ transformOrigin: 'top left', transform: 'scale(0.35)', width: '285.7%', height: '285.7%' }}>
                                  <div dangerouslySetInnerHTML={{ __html: currentBook.pages[coverPicture.selectedPages[1] ? coverPicture.selectedPages[1] - 1 : coverPicture.selectedPages[0] - 1].html }} />
                               </div>
                           ) : (
                               <>
                                   <span className="text-[0.98vw] font-bold tracking-widest uppercase opacity-85 relative z-10">HARD.COVER</span>
                                   <div className="relative z-10">
                                      <h3 className="text-[1.19vw] font-black leading-tight">Hard.Cover Book</h3>
                                      <p className="text-[0.84vw] opacity-90 mt-[0.14vw]">Free .psd Mockup</p>
                                   </div>
                               </>
                           )}
                        </div>
                     </div>
                  ) : coverPicture.selectedTemplate?.src && (
                    <img 
                      src={coverPicture.selectedTemplate.src} 
                      alt="Cover Background" 
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
                      style={{ opacity: (coverPicture.bgOpacity !== undefined ? coverPicture.bgOpacity : 100) / 100, filter: `drop-shadow(${coverPicture.shadowX || 0}px ${coverPicture.shadowY || 0}px ${(coverPicture.shadowBlur || 35) / 10}px ${coverPicture.shadowColor || '#000000'})` }}
                    />
                  )}

                  {/* Uploaded Logo Rendering */}
                  {coverPicture.logoUrl && (
                      <img 
                          src={coverPicture.logoUrl} 
                          alt="Logo" 
                          className="absolute top-[1vw] left-[1vw] z-[20] w-[4vw] h-[4vw] object-contain" 
                      />
                  )}

                  <div className="absolute left-0 right-0 text-center z-10 flex flex-col items-center" style={{ bottom: '2vw', paddingLeft: '1vw', paddingRight: '1vw' }}>
                    <h3 className="leading-tight break-words w-full" style={{
                      fontFamily: coverPicture.text1FontFamily || 'Poppins',
                      fontSize: coverPicture.text1FontSize ? `${(coverPicture.text1FontSize / 16) * 1.5}vw` : '1.2vw',
                      fontWeight: coverPicture.text1FontWeight === 'Regular' ? '400' : coverPicture.text1FontWeight === 'Medium' ? '500' : coverPicture.text1FontWeight === 'Semi Bold' ? '600' : coverPicture.text1FontWeight === 'Bold' ? '700' : '900',
                      letterSpacing: coverPicture.text1LetterSpacing === 'Auto' ? 'normal' : `${coverPicture.text1LetterSpacing / 10}em`,
                      lineHeight: coverPicture.text1LineHeight === 'Auto' ? '1.1' : String(coverPicture.text1LineHeight),
                      textAlign: coverPicture.text1Align || 'center',
                      color: coverPicture.text1Color || '#FFFFFF',
                      opacity: (coverPicture.text1ColorOpacity !== undefined ? coverPicture.text1ColorOpacity : 100) / 100,
                      fontStyle: coverPicture.text1Italic ? 'italic' : 'normal',
                      textDecoration: [coverPicture.text1Underline ? 'underline' : '', coverPicture.text1Linethrough ? 'line-through' : ''].filter(Boolean).join(' ') || 'none'
                    }}>{coverPicture.text1 || 'Title'}</h3>
                    <p className="whitespace-pre-wrap break-words w-full" style={{
                      marginTop: '0.2vw',
                      fontFamily: coverPicture.text2FontFamily || 'Outfit',
                      fontSize: coverPicture.text2FontSize ? `${(coverPicture.text2FontSize / 16) * 1.5}vw` : '0.8vw',
                      fontWeight: coverPicture.text2FontWeight === 'Regular' ? '400' : coverPicture.text2FontWeight === 'Medium' ? '500' : coverPicture.text2FontWeight === 'Semi Bold' ? '600' : coverPicture.text2FontWeight === 'Bold' ? '700' : '900',
                      letterSpacing: coverPicture.text2LetterSpacing === 'Auto' ? '0.2em' : `${coverPicture.text2LetterSpacing / 10}em`,
                      lineHeight: coverPicture.text2LineHeight === 'Auto' ? 'normal' : String(coverPicture.text2LineHeight),
                      textAlign: coverPicture.text2Align || 'center',
                      color: coverPicture.text2Color || '#FFFFFF',
                      opacity: (coverPicture.text2ColorOpacity !== undefined ? coverPicture.text2ColorOpacity : 90) / 100,
                      fontStyle: coverPicture.text2Italic ? 'italic' : 'normal',
                      textDecoration: [coverPicture.text2Underline ? 'underline' : '', coverPicture.text2Linethrough ? 'line-through' : ''].filter(Boolean).join(' ') || 'none'
                    }}>{coverPicture.text2 || 'Supporting Text'}</p>
                  </div>
                </div>
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

              {/* Pages Badge */}
              <div className="absolute bottom-[0.6vw] right-[0.6vw] bg-white/90 backdrop-blur-md px-[0.6vw] py-[0.25vw] rounded-[0.4vw] text-[0.7vw] font-bold text-gray-800 shadow-xs border border-white/50">
                {pageCount} Pages
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
                    maxLength={20}
                    value={bookName}
                    onChange={(e) => {
                      setBookName(e.target.value);
                      if (errors.bookName) setErrors(prev => ({ ...prev, bookName: null }));
                    }}
                    placeholder="Name of the book"
                    className={`w-full border rounded-[0.5vw] px-[0.8vw] py-[0.5vw] pr-[3.2vw] text-[0.8vw] font-normal text-gray-800 placeholder-gray-300 focus:outline-none shadow-xs transition-colors ${errors.bookName ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:border-gray-400'}`}
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

            {/* Select Category */}
            <div>
              <label className="text-[0.82vw] font-bold text-gray-900 mb-[0.3vw] block">
                Select Category <span className="text-red-500">*</span>
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

            {/* Add 5 Search Tags */}
            <div>
              <label className="text-[0.82vw] font-bold text-gray-900 mb-[0.3vw] block">Add 5 Search Tags</label>
              <div className="relative border border-gray-300 rounded-[0.5vw] p-[0.3vw] pr-[2.4vw] bg-white flex items-center shadow-xs min-h-[2.2vw]">
                <div className="flex items-center gap-[0.4vw] overflow-x-auto flex-1 py-[0.1vw]">
                  {tags.map((tag, idx) => (
                    <div key={idx} className="bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-[0.35vw] px-[0.5vw] py-[0.2vw] flex items-center gap-[0.3vw] text-[0.72vw] font-semibold text-gray-700 whitespace-nowrap transition-colors flex-shrink-0">
                      <span>{tag}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveTag(idx)}
                        className="text-gray-400 hover:text-gray-700 cursor-pointer"
                      >
                        <X size="0.7vw" />
                      </button>
                    </div>
                  ))}

                  {tags.length < 5 && (
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="Add tag..."
                      className="text-[0.72vw] font-medium px-[0.4vw] py-[0.2vw] outline-none text-gray-800 flex-1 min-w-[5vw]"
                    />
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={tags.length >= 5}
                  className="absolute right-[0.3vw] top-1/2 -translate-y-1/2 w-[1.6vw] h-[1.6vw] bg-[#2b308b] hover:bg-[#20246a] text-white rounded-[0.35vw] flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size="0.9vw" />
                </button>
              </div>
            </div>

            {/* Visibility Info Box */}
            <div className="bg-[#edf2fe] border border-blue-100 rounded-[0.8vw] p-[0.7vw] space-y-[0.2vw]">
              <div className="flex items-center gap-[0.4vw]">
                <Info size="0.9vw" className="text-[#4338ca] flex-shrink-0" />
                <span className="text-[0.75vw] font-semibold text-gray-800">
                  Visibility : <span className="text-[#4338ca] font-bold">{visibilityMode}</span>
                </span>
              </div>
              <p className="text-[0.68vw] text-gray-500 leading-normal pl-[1.3vw]">
                This flipbook will be published as {visibilityMode}.<br />
                Change later from: <strong className="text-gray-700 font-semibold">Customize &gt; Visibility</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-[0.6vw] pt-[1.2vw] mt-[0.8vw] border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-[1.2vw] py-[0.55vw] rounded-[0.4vw] border border-gray-900 bg-white text-gray-900 text-[0.8vw] font-semibold flex items-center gap-[0.4vw] hover:bg-gray-50 transition-all cursor-pointer shadow-xs"
          >
            <X size="0.9vw" />
            <span>Cancel</span>
          </button>

          <button
            type="button"
            onClick={handlePublishClick}
            disabled={isPublishing}
            className="px-[1.2vw] py-[0.55vw] rounded-[0.4vw] bg-[#00a58e] hover:bg-[#008a76] text-white text-[0.8vw] font-semibold flex items-center gap-[0.4vw] transition-all shadow-md cursor-pointer disabled:opacity-70"
          >
            {isPublishing ? (
              <div className="w-[0.9vw] h-[0.9vw] border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Upload size="0.9vw" />
                <span>Publish Book</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalJsx, document.body);
};

export default PublishModal;
