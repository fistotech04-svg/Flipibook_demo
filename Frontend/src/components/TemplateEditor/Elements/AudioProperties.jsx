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
  const [isLooping, setIsLooping] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(1);
  const audioRef = useRef(null);

  const { v_id: paramVId } = useParams();

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds) || !isFinite(timeInSeconds)) return "0:00";
    const m = Math.floor(timeInSeconds / 60);
    const s = Math.floor(timeInSeconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

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
      
      const loopAttr = selectedElement.getAttribute('data-audio-loop') === 'true';
      setIsLooping(loopAttr);
      const mutedAttr = selectedElement.getAttribute('data-audio-muted') === 'true';
      setIsMuted(mutedAttr);
      const volAttr = selectedElement.getAttribute('data-audio-volume');
      setVolume(volAttr !== null ? parseFloat(volAttr) : 1);
      const speedAttr = selectedElement.getAttribute('data-audio-speed');
      setSpeed(speedAttr !== null ? parseFloat(speedAttr) : 1);
    }
  }, [selectedElement]);

  useEffect(() => {
    if (currentFile.url) {
      if (!audioRef.current) {
        audioRef.current = new Audio(currentFile.url);
        audioRef.current.loop = isLooping;
        audioRef.current.volume = volume;
        audioRef.current.playbackRate = speed;
        audioRef.current.onended = () => {
          if (audioFiles.length > 1 && currentFileIndex < audioFiles.length - 1) {
            handleNext();
          } else {
            setIsPlaying(false);
          }
        };
        audioRef.current.ontimeupdate = () => {
          if (!selectedElement || !audioRef.current) return;
          const currentTimeStr = formatTime(audioRef.current.currentTime);
          const durationStr = formatTime(audioRef.current.duration);
          
          const currentTimeEl = selectedElement.querySelector('.audio-current-time');
          if (currentTimeEl) currentTimeEl.textContent = currentTimeStr;
          
          const totalTimeEl = selectedElement.querySelector('.audio-total-time');
          if (totalTimeEl && durationStr !== "0:00" && durationStr !== "NaN:NaN") totalTimeEl.textContent = durationStr;
          
          const progressFill = selectedElement.querySelector('.progress-fill');
          const progressKnob = selectedElement.querySelector('.progress-knob');
          if (progressFill && progressKnob && audioRef.current.duration) {
            const ratio = audioRef.current.currentTime / audioRef.current.duration;
            const maxWidth = 125;
            const fillWidth = ratio * maxWidth;
            progressFill.setAttribute('width', fillWidth.toString());
            progressKnob.setAttribute('cx', (160 + fillWidth).toString());
          }
        };
        audioRef.current.onloadedmetadata = () => {
          if (!selectedElement || !audioRef.current) return;
          const durationStr = formatTime(audioRef.current.duration);
          const totalTimeEl = selectedElement.querySelector('.audio-total-time');
          if (totalTimeEl && durationStr !== "0:00" && durationStr !== "NaN:NaN") totalTimeEl.textContent = durationStr;
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

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping;
      audioRef.current.volume = volume;
      audioRef.current.playbackRate = speed;
      audioRef.current.muted = isMuted;
    }
    if (selectedElement) {
      const volFill = selectedElement.querySelector('.volume-fill');
      const volKnob = selectedElement.querySelector('.volume-knob');
      const volIcon = selectedElement.querySelector('.volume-icon');
      if (volFill && volKnob) {
        const maxWidth = 75;
        const effectiveVolume = isMuted ? 0 : volume;
        const fillWidth = effectiveVolume * maxWidth;
        volFill.setAttribute('width', fillWidth.toString());
        volKnob.setAttribute('cx', (370 + fillWidth).toString());
      }
      if (volIcon) {
        if (isMuted || volume === 0) {
          volIcon.innerHTML = `
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#222"></polygon>
            <line x1="19" y1="9" x2="15" y2="15" stroke="#222" stroke-width="2" stroke-linecap="round"></line>
            <line x1="15" y1="9" x2="19" y2="15" stroke="#222" stroke-width="2" stroke-linecap="round"></line>
          `;
        } else {
          volIcon.innerHTML = `
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#222"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" fill="none" stroke="#222" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
          `;
        }
      }
    }
  }, [isLooping, isMuted, volume, speed, selectedElement]);

  useEffect(() => {
    if (selectedElement) {
      const prevIcon = selectedElement.querySelector('.prev-icon');
      const nextIcon = selectedElement.querySelector('.next-icon');
      const hasAudio = audioFiles.length > 0;
      
      if (prevIcon) {
        prevIcon.style.pointerEvents = hasAudio ? 'all' : 'none';
        prevIcon.style.opacity = hasAudio ? '1' : '0.5';
        prevIcon.style.cursor = hasAudio ? 'pointer' : 'default';
      }
      if (nextIcon) {
        nextIcon.style.pointerEvents = hasAudio ? 'all' : 'none';
        nextIcon.style.opacity = hasAudio ? '1' : '0.5';
        nextIcon.style.cursor = hasAudio ? 'pointer' : 'default';
      }
    }
  }, [audioFiles.length, selectedElement]);

  // Ref to access current toggle function inside event listeners
  const togglePlayPauseRef = useRef(null);
  const nextRef = useRef(null);
  const prevRef = useRef(null);
  const handleProgressClickRef = useRef(null);
  const handleVolumeClickRef = useRef(null);
  const handleLoopClickRef = useRef(null);

  useEffect(() => {
    togglePlayPauseRef.current = togglePlayPause;
    nextRef.current = handleNext;
    prevRef.current = handlePrev;
    
    handleProgressClickRef.current = (e, groupEl) => {
      if (!audioRef.current || !audioRef.current.duration) return;
      const bg = groupEl.querySelector('.progress-bg');
      if (!bg) return;
      const rect = bg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      audioRef.current.currentTime = ratio * audioRef.current.duration;
    };
    
    handleVolumeClickRef.current = (e, groupEl) => {
      const bg = groupEl.querySelector('.volume-bg');
      if (!bg) return;
      const rect = bg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      
      if (x < -10) {
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        updateAttribute('data-audio-muted', newMuted.toString());
        return;
      }
      
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      setVolume(ratio);
      updateAttribute('data-audio-volume', ratio.toString());
      
      if (ratio > 0 && isMuted) {
        setIsMuted(false);
        updateAttribute('data-audio-muted', 'false');
      }
    };
    
    handleLoopClickRef.current = () => {
      const newLoop = !isLooping;
      setIsLooping(newLoop);
      updateAttribute('data-audio-loop', newLoop.toString());
    };
  }, [isPlaying, currentFile.url, currentFileIndex, audioFiles, isLooping, isMuted, volume]);

  useEffect(() => {
    if (selectedElement) {
      const iconContainer = selectedElement.querySelector('.play-pause-icon');
      const isSquare = selectedElement.querySelector('.audio-fill-layer')?.getAttribute('height') === '48';
      if (iconContainer) {
        if (isPlaying) {
          if (isSquare) {
            iconContainer.innerHTML = '<rect x="18" y="16" width="4" height="16" fill="#737373" rx="1" /><rect x="26" y="16" width="4" height="16" fill="#737373" rx="1" />';
          } else {
            iconContainer.innerHTML = '<rect x="6" y="4" width="4" height="14" fill="#ffffff" rx="1" /><rect x="14" y="4" width="4" height="14" fill="#ffffff" rx="1" />';
          }
        } else {
          if (isSquare) {
            iconContainer.innerHTML = '<polygon points="20 16 32 24 20 32" fill="#737373" stroke="#737373" stroke-width="2" stroke-linejoin="round"></polygon>';
          } else {
            iconContainer.innerHTML = '<polygon points="7 4 17 11 7 18 7 4" fill="#ffffff"></polygon>';
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
      
      const loopIcon = target.closest('.loop-icon');
      if (loopIcon) {
        e.stopPropagation();
        if (handleLoopClickRef.current) handleLoopClickRef.current();
        return;
      }

      const progressGroup = target.closest('.progress-group');
      if (progressGroup) {
        e.stopPropagation();
        if (handleProgressClickRef.current) handleProgressClickRef.current(e, progressGroup);
        return;
      }

      const volumeGroup = target.closest('.volume-group');
      if (volumeGroup) {
        e.stopPropagation();
        if (handleVolumeClickRef.current) handleVolumeClickRef.current(e, volumeGroup);
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
    let newFiles = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
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
          } catch (uploadErr) {
            console.error(`Upload error for ${file.name}, falling back to local URL:`, uploadErr);
            const localUrl = URL.createObjectURL(file);
            newFiles.push({ url: localUrl, name: file.name });
          }
        } else {
            const localUrl = URL.createObjectURL(file);
            newFiles.push({ url: localUrl, name: file.name });
        }
      }
      
      applyFilesToElement(newFiles, newFiles.length > files.length ? currentFileIndex : newFiles.length - files.length);

    } catch (err) {
      console.error("General error in file processing:", err);
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

      const hasAudio = files.length > 0;

      if (prevIcon) {
        prevIcon.setAttribute('display', 'block');
        prevIcon.style.pointerEvents = hasAudio ? 'all' : 'none';
        prevIcon.style.opacity = hasAudio ? '1' : '0.5';
        prevIcon.style.cursor = hasAudio ? 'pointer' : 'default';
      }
      if (nextIcon) {
        nextIcon.setAttribute('display', 'block');
        nextIcon.style.pointerEvents = hasAudio ? 'all' : 'none';
        nextIcon.style.opacity = hasAudio ? '1' : '0.5';
        nextIcon.style.cursor = hasAudio ? 'pointer' : 'default';
      }
      
      if (isIcon) {
        audioFill.setAttribute('width', '96');
        if (strokeOverlay) strokeOverlay.setAttribute('width', '96');
        if (prevIcon) prevIcon.setAttribute('transform', 'translate(11, 0)');
        if (playPauseIcon) playPauseIcon.setAttribute('transform', 'translate(24, 0)');
        if (nextIcon) nextIcon.setAttribute('transform', 'translate(37, 0)');
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
        if (prevIcon) {
          prevIcon.setAttribute('display', 'block');
          prevIcon.style.pointerEvents = 'none';
          prevIcon.style.opacity = '0.5';
          prevIcon.style.cursor = 'default';
        }
        if (nextIcon) {
          nextIcon.setAttribute('display', 'block');
          nextIcon.style.pointerEvents = 'none';
          nextIcon.style.opacity = '0.5';
          nextIcon.style.cursor = 'default';
        }
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
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 3);
    }
  };

  const handlePrev = () => {
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 3);
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

      <div className="mb-[0.5vw] p-[1vw]">
        <button 
          onClick={handleUploadClick}
          disabled={isUploading}
          className="w-full py-[1.5vw] border border-gray-300 rounded-[0.4vw] text-[#34495e] font-medium hover:bg-gray-50 flex items-center justify-center mb-[0.8vw]"
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

      <div className="px-[1vw] pb-[1vw] flex flex-col gap-[1vw]">
        
        <div className="flex items-center gap-[1vw]">
          <label className="text-[0.85vw] text-gray-700 w-[3.5vw]">Loop</label>
          <div className="flex-1 flex justify-end pr-[2vw]">
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={isLooping} 
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsLooping(checked);
                  updateAttribute('data-audio-loop', checked.toString());
                }}
                className="sr-only peer"
              />
              <div className="w-[2.2vw] h-[1.2vw] bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[1vw] peer-checked:after:border-white after:content-[''] after:absolute after:top-[0.1vw] after:left-[0.1vw] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-[1vw] after:w-[1vw] after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
        </div>
        
        <div className="flex items-center gap-[1vw]">
          <label className="text-[0.85vw] text-gray-700 w-[3.5vw]">Muted</label>
          <div className="flex-1 flex justify-end pr-[2vw]">
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={isMuted} 
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsMuted(checked);
                  updateAttribute('data-audio-muted', checked.toString());
                }}
                className="sr-only peer"
              />
              <div className="w-[2.2vw] h-[1.2vw] bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[1vw] peer-checked:after:border-white after:content-[''] after:absolute after:top-[0.1vw] after:left-[0.1vw] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-[1vw] after:w-[1vw] after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
        </div>
        
        <div className="flex items-center gap-[1vw]">
          <label className="text-[0.85vw] text-gray-700 w-[3.5vw]">Volume</label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={isMuted ? 0 : volume} 
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setVolume(val);
              updateAttribute('data-audio-volume', val.toString());
              if (val > 0 && isMuted) {
                setIsMuted(false);
                updateAttribute('data-audio-muted', 'false');
              }
            }}
            className="flex-1 cursor-pointer"
          />
          <span className="text-[0.85vw] w-[2vw] text-right">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
        </div>

        <div className="flex items-center gap-[1vw]">
          <label className="text-[0.85vw] text-gray-700 w-[3.5vw]">Speed</label>
          <select 
            value={speed} 
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setSpeed(val);
              updateAttribute('data-audio-speed', val.toString());
            }}
            className="flex-1 text-[0.85vw] p-[0.2vw] border border-gray-300 rounded-[0.2vw] outline-none"
          >
            <option value={0.5}>0.5x</option>
            <option value={0.75}>0.75x</option>
            <option value={1}>1x</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2x</option>
          </select>
          <div className="w-[2vw]"></div>
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="audio/*,video/*" 
        className="hidden" 
      />
    </div>
  );
};

export default AudioProperties;
