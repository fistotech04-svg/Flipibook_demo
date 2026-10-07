import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, X, SkipBack, SkipForward } from 'lucide-react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { resolveUploadsPath } from '../../../utils/supabaseUtils';

const AudioProperties = ({ selectedElement, selectedLayerId, activePageIndex, updateElementAttribute }) => {
  const fileInputRef = useRef(null);
  
  // State for the uploaded file(s)
  const [audioFiles, setAudioFiles] = useState([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const { v_id: paramVId } = useParams();

  const currentFile = audioFiles[currentFileIndex] || { name: '', url: '' };

  useEffect(() => {
    if (selectedElement) {
      const filesAttr = selectedElement.getAttribute('data-audio-files');
      if (filesAttr) {
        try {
          const files = JSON.parse(filesAttr);
          setAudioFiles(files);
          const indexAttr = parseInt(selectedElement.getAttribute('data-current-index') || '0', 10);
          setCurrentFileIndex(indexAttr);
        } catch (e) {
          console.error("Error parsing audio files", e);
        }
      } else {
        const url = selectedElement.getAttribute('data-audio-src') || '';
        const name = selectedElement.getAttribute('data-filename') || '';
        if (url) {
          setAudioFiles([{ url, name }]);
          setCurrentFileIndex(0);
        } else {
          setAudioFiles([]);
          setCurrentFileIndex(0);
        }
      }
    }
  }, [selectedElement]);

  useEffect(() => {
    if (currentFile.url) {
      if (!audioRef.current) {
        audioRef.current = new Audio(currentFile.url);
        audioRef.current.onended = () => {
          if (audioFiles.length > 1 && currentFileIndex < audioFiles.length - 1) {
            handleNext();
          } else {
            setIsPlaying(false);
          }
        };
      } else {
        const wasPlaying = isPlaying;
        audioRef.current.src = currentFile.url;
        if (wasPlaying) {
          audioRef.current.play().catch(e => console.error(e));
        }
      }
    }
  }, [currentFile.url, currentFileIndex]); // eslint-disable-line

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Ref to access current toggle function inside event listeners
  const togglePlayPauseRef = useRef(null);
  const nextRef = useRef(null);
  const prevRef = useRef(null);

  useEffect(() => {
    togglePlayPauseRef.current = togglePlayPause;
    nextRef.current = handleNext;
    prevRef.current = handlePrev;
  }, [isPlaying, currentFile.url, currentFileIndex, audioFiles]);

  useEffect(() => {
    if (selectedElement) {
      const iconContainer = selectedElement.querySelector('.play-pause-icon');
      const isSquare = selectedElement.querySelector('.audio-fill-layer')?.getAttribute('height') === '48';
      if (iconContainer) {
        if (isPlaying) {
          if (isSquare) {
            iconContainer.innerHTML = '<rect x="18" y="16" width="4" height="16" fill="#737373" rx="1" /><rect x="26" y="16" width="4" height="16" fill="#737373" rx="1" />';
          } else {
            iconContainer.innerHTML = '<rect x="5" y="4" width="4" height="14" fill="#333" rx="1" /><rect x="15" y="4" width="4" height="14" fill="#333" rx="1" />';
          }
        } else {
          if (isSquare) {
            iconContainer.innerHTML = '<polygon points="20 16 32 24 20 32" fill="#737373" stroke="#737373" stroke-width="2" stroke-linejoin="round"></polygon>';
          } else {
            iconContainer.innerHTML = '<polygon points="5 3 19 12 5 21 5 3" fill="#333"></polygon>';
          }
        }
      }
    }
  }, [isPlaying, selectedElement]);

  useEffect(() => {
    if (!selectedElement) return;

    const handlePlayPauseClick = (e) => {
      // Check if clicked on next/prev
      const target = e.target;
      if (target.closest('.next-icon')) {
        e.stopPropagation();
        if (nextRef.current) nextRef.current();
        return;
      }
      if (target.closest('.prev-icon')) {
        e.stopPropagation();
        if (prevRef.current) prevRef.current();
        return;
      }

      if (togglePlayPauseRef.current) {
        togglePlayPauseRef.current();
      }
    };

    selectedElement.addEventListener('click', handlePlayPauseClick);
    return () => {
      selectedElement.removeEventListener('click', handlePlayPauseClick);
    };
  }, [selectedElement]);

  const updateAttribute = (attr, value) => {
    if (selectedElement) {
      selectedElement.setAttribute(attr, value);
      if (updateElementAttribute) {
        updateElementAttribute(attr, value);
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !selectedElement) return;

    setIsUploading(true);
    let newFiles = [...audioFiles];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          const formData = new FormData();
          formData.append('emailId', user.emailId);
          if (paramVId) formData.append('v_id', paramVId);
          formData.append('type', 'audio');
          formData.append('file', file);

          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
          const res = await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData);
          
          if (res.data.url) {
            const serverUrl = resolveUploadsPath(res.data.url);
            newFiles.push({ url: serverUrl, name: file.name });
          }
        } else {
            const localUrl = URL.createObjectURL(file);
            newFiles.push({ url: localUrl, name: file.name });
        }
      }
      
      applyFilesToElement(newFiles, newFiles.length > files.length ? currentFileIndex : newFiles.length - files.length);

    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const applyFilesToElement = (files, index = 0) => {
    setAudioFiles(files);
    setCurrentFileIndex(index);
    if (selectedElement) {
      updateAttribute('data-audio-files', JSON.stringify(files));
      updateAttribute('data-current-index', index.toString());
      if (files.length > 0) {
        updateAttribute('data-audio-src', files[index].url);
        updateAttribute('data-filename', files[index].name);
        updateAttribute('data-interaction', 'audio');
        updateAttribute('data-interaction-value', files[index].url);
      }
      
      const textEl = selectedElement.querySelector('.audio-time-text');
      if (textEl && files.length > 0) {
        textEl.textContent = files[index].name || 'Audio Player';
      }

      // Show or hide prev/next icons
      const prevIcon = selectedElement.querySelector('.prev-icon');
      const nextIcon = selectedElement.querySelector('.next-icon');
      const playPauseIcon = selectedElement.querySelector('.play-pause-icon');
      const audioFill = selectedElement.querySelector('.audio-fill-layer');
      const strokeOverlay = selectedElement.querySelector('.svg-image-stroke-overlay');
      const isIcon = audioFill && audioFill.getAttribute('height') === '48';

      if (files.length > 1) {
        if (prevIcon) prevIcon.setAttribute('display', 'block');
        if (nextIcon) nextIcon.setAttribute('display', 'block');
        if (prevIcon) prevIcon.style.pointerEvents = 'all';
        if (nextIcon) nextIcon.style.pointerEvents = 'all';
        
        if (isIcon) {
          audioFill.setAttribute('width', '96');
          if (strokeOverlay) strokeOverlay.setAttribute('width', '96');
          if (prevIcon) prevIcon.setAttribute('transform', 'translate(11, 0)');
          if (playPauseIcon) playPauseIcon.setAttribute('transform', 'translate(24, 0)');
          if (nextIcon) nextIcon.setAttribute('transform', 'translate(37, 0)');
        }
      } else {
        if (prevIcon) prevIcon.setAttribute('display', 'none');
        if (nextIcon) nextIcon.setAttribute('display', 'none');

        if (isIcon) {
          audioFill.setAttribute('width', '48');
          if (strokeOverlay) strokeOverlay.setAttribute('width', '48');
          if (prevIcon) prevIcon.removeAttribute('transform');
          if (playPauseIcon) playPauseIcon.removeAttribute('transform');
          if (nextIcon) nextIcon.removeAttribute('transform');
        }
      }
    }
  };

  const handleRemoveAudio = (indexToRemove) => {
    const newFiles = audioFiles.filter((_, idx) => idx !== indexToRemove);
    if (newFiles.length === 0) {
      setAudioFiles([]);
      setCurrentFileIndex(0);
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      }
      if (selectedElement) {
        updateAttribute('data-audio-files', '');
        updateAttribute('data-current-index', '0');
        updateAttribute('data-audio-src', '');
        updateAttribute('data-filename', '');
        selectedElement.removeAttribute('data-interaction');
        selectedElement.removeAttribute('data-interaction-value');
        
        const textEl = selectedElement.querySelector('.audio-time-text');
        if (textEl) {
          textEl.textContent = 'Audio Player';
        }

        const prevIcon = selectedElement.querySelector('.prev-icon');
        const nextIcon = selectedElement.querySelector('.next-icon');
        if (prevIcon) prevIcon.setAttribute('display', 'none');
        if (nextIcon) nextIcon.setAttribute('display', 'none');
      }
    } else {
      let newIndex = currentFileIndex;
      if (indexToRemove < currentFileIndex) {
        newIndex--;
      } else if (indexToRemove === currentFileIndex && newIndex >= newFiles.length) {
        newIndex = newFiles.length - 1;
      }
      applyFilesToElement(newFiles, newIndex);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !currentFile.url || !selectedElement) return;
    
    const iconContainer = selectedElement.querySelector('.play-pause-icon');
    if (!iconContainer) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      // Wait for re-render to update the icon (handled by useEffect)
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    if (audioFiles.length > 1) {
      const newIndex = (currentFileIndex + 1) % audioFiles.length;
      applyFilesToElement(audioFiles, newIndex);
      if (isPlaying && audioRef.current) {
        // Will play automatically via useEffect
      }
    }
  };

  const handlePrev = () => {
    if (audioFiles.length > 1) {
      const newIndex = (currentFileIndex - 1 + audioFiles.length) % audioFiles.length;
      applyFilesToElement(audioFiles, newIndex);
    }
  };

  return (
    <div className="flex flex-col text-gray-700 font-sans p-[0.5vw] text-[0.85vw]">
      {/* Title Header */}
      <div className="flex items-center gap-[0.75vw] mb-[0.5vw]">
        <span className="text-[0.9vw] font-semibold text-gray-900 whitespace-nowrap tracking-wider">
          Audio Properties
        </span>
        <div className="h-[0.1vw] flex-1 bg-gray-200 mr-[-3vw]"></div>
      </div>

      <div className="mb-[1.5vw] p-[1vw]">
        <button 
          onClick={handleUploadClick}
          disabled={isUploading}
          className="w-full py-[0.5vw] border border-gray-300 rounded-[0.4vw] text-[#34495e] font-medium hover:bg-gray-50 flex items-center justify-center mb-[0.8vw]"
        >
          {isUploading ? 'Uploading...' : 'Upload MP3/MP4'}
        </button>

        {audioFiles.length > 0 && (
          <div className="flex flex-col gap-[0.5vw]">
            {audioFiles.map((file, idx) => (
              <div key={idx} className={`flex items-center justify-between border ${idx === currentFileIndex ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'} rounded-[0.4vw] p-[0.6vw]`}>
                <div className="flex items-center gap-[0.6vw] flex-1 overflow-hidden">
                  <button onClick={() => { if (idx !== currentFileIndex) applyFilesToElement(audioFiles, idx); else togglePlayPause(); }} className="text-gray-700 hover:text-gray-900 focus:outline-none flex items-center justify-center">
                    {idx === currentFileIndex && isPlaying ? (
                      <Pause size="1vw" className="fill-current" />
                    ) : (
                      <Play size="1vw" className="fill-current" />
                    )}
                  </button>
                  <span className="text-gray-700 text-[0.85vw] truncate" title={file.name}>{file.name}</span>
                </div>
                <button onClick={() => handleRemoveAudio(idx)} className="text-gray-500 hover:text-gray-800 focus:outline-none flex items-center justify-center ml-[0.5vw]">
                  <X size="1vw" />
                </button>
              </div>
            ))}
            

          </div>
        )}
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="audio/*,video/*" 
        multiple
        className="hidden" 
      />
    </div>
  );
};

export default AudioProperties;
