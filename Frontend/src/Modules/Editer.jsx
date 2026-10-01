import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import ExportModal from '../components/ExportModal';
import PublishModal from '../components/PublishModal';
import AlertModal from '../components/AlertModal';
import axios from 'axios';

import { getFromDB, saveToDB } from '../utils/dbUtils';

const STATE_KEY = 'threed_editor_state';


const Editor = () => {
  // Auto Save Preferences
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(() => {
    // Priority: Local Storage -> User Data (if available) -> Default True
    const stored = localStorage.getItem('isAutoSaveEnabled');
    if (stored !== null) return JSON.parse(stored);
    
    // Fallback: Default true (Effect will sync with backend)
    return true;
  });

  // Sync state with backend on mount
  useEffect(() => {
      const fetchSettings = async () => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
                const res = await axios.get(`${backendUrl}/api/usersetting/get-settings`, {
                    params: { emailId: user.emailId }
                });
                
                if (res.data) {
                    const editorSettings = res.data.editorSettings;
                    const autoSaveVal = editorSettings?.isAutoSaveEnabled ?? res.data.isAutoSaveEnabled;
                    if (autoSaveVal !== undefined) {
                        setIsAutoSaveEnabled(autoSaveVal);
                        localStorage.setItem('isAutoSaveEnabled', JSON.stringify(autoSaveVal));
                    }
                    if (editorSettings) {
                        if (editorSettings.isTrimViewEnabled !== undefined) {
                            localStorage.setItem('isTrimViewEnabled', JSON.stringify(editorSettings.isTrimViewEnabled));
                            window.dispatchEvent(new CustomEvent('editor_toggleTrimView', { detail: editorSettings.isTrimViewEnabled }));
                        }
                        if (editorSettings.isRulerEnabled !== undefined) {
                            localStorage.setItem('isRulerEnabled', JSON.stringify(editorSettings.isRulerEnabled));
                            window.dispatchEvent(new CustomEvent('editor_toggleRuler', { detail: editorSettings.isRulerEnabled }));
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to fetch user settings", err);
            }
        }
      };
      fetchSettings();
  }, []);

  const toggleAutoSave = async (value) => {
    setIsAutoSaveEnabled(value);
    localStorage.setItem('isAutoSaveEnabled', JSON.stringify(value));
    
    // Sync with Backend
    try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
            
            await axios.post(`${backendUrl}/api/usersetting/update-editor-settings`, {
                emailId: user.emailId,
                editorSettings: { isAutoSaveEnabled: value }
            });
        }
    } catch (error) {
        console.error("Failed to sync auto-save preference:", error);
    }
  };

  const navigate = useNavigate();
  const [exportHandler, setExportHandler] = useState(null);
  const [saveHandler, setSaveHandler] = useState(null);
  const [previewHandler, setPreviewHandler] = useState(null);
  const [clearHandler, setClearHandler] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [canSave, setCanSave] = useState(true);
  const [currentBook, setCurrentBook] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Prevent closing the tab if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // Save Success State for Toast
  const [saveSuccessInfo, setSaveSuccessInfo] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportContext, setExportContext] = useState({ pages: [], activePageIndex: 0 });

  const handleSaveSuccess = (info) => {
      setSaveSuccessInfo(info);
      setTimeout(() => {
          setSaveSuccessInfo(null);
      }, 3000);
  };

  const handleExport = () => {
    setIsExportModalOpen(true);
    if (exportHandler) {
      exportHandler();
    }
  };

  const handleSave = () => {
    if (saveHandler) {
      saveHandler();
    } else {
      console.warn("Save handler is not attached.");
    }
  };

  const handlePreview = () => {
    if (previewHandler) {
      previewHandler();
    } else {
      console.warn("Preview handler is not attached.");
    }
  };

  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isUnpublishWarningOpen, setIsUnpublishWarningOpen] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);

  const handlePublish = () => {
    const isBookPublished = Boolean(
      currentBook?.isPublished || 
      currentBook?.published || 
      currentBook?.is_published || 
      currentBook?.status === 'publish' ||
      currentBook?.status === 'published' ||
      currentBook?.meta?.isPublished
    );

    if (isBookPublished) {
      setIsUnpublishWarningOpen(true);
    } else {
      setIsPublishModalOpen(true);
    }
  };

  const confirmUnpublish = async () => {
    setIsUnpublishing(true);
    try {
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const v_id = currentBook?.v_id || currentBook?.realName;
      const userEmail = user?.emailId || currentBook?.userEmail;

      if (userEmail && v_id) {
        await axios.post(`${backendUrl}/api/flipbook/unpublish`, {
          emailId: userEmail,
          v_id: v_id
        });
      }
      setCurrentBook(prev => ({
        ...(prev || {}),
        isPublished: false,
        tags: [],
        meta: {
          ...(prev?.meta || {}),
          tags: [],
          isPublished: false
        }
      }));
    } catch (err) {
      console.error("Failed to unpublish flipbook:", err);
    } finally {
      setIsUnpublishing(false);
      setIsUnpublishWarningOpen(false);
    }
  };

  const [isClearWarningOpen, setIsClearWarningOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isDeleteWarningOpen, setIsDeleteWarningOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClearFlipbook = () => {
    setIsClearWarningOpen(true);
  };

  const confirmClear = async () => {
    setIsClearing(true);
    try {
      if (clearHandler) {
        clearHandler();
      } else {
        window.dispatchEvent(new CustomEvent('trigger-clear-flipbook'));
      }
    } catch (err) {
      console.error("Failed to clear flipbook:", err);
    } finally {
      setIsClearing(false);
      setIsClearWarningOpen(false);
    }
  };

  const handleDeleteFlipbook = () => {
    setIsDeleteWarningOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const storedUser = localStorage.getItem('user');
      const user = storedUser ? JSON.parse(storedUser) : null;
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const emailId = user?.emailId || currentBook?.userEmail;

      const pathParts = window.location.pathname.split('/');
      const folderName = currentBook?.folder || currentBook?.folderName || (pathParts.length >= 4 ? decodeURIComponent(pathParts[3]) : 'My_Flipbooks');
      const bookName = currentBook?.flipbookName || currentBook?.realName || currentBook?.title || (pathParts.length >= 5 ? decodeURIComponent(pathParts[4]) : '');

      if (emailId && bookName) {
        await axios.delete(`${backendUrl}/api/flipbook/delete`, {
          data: {
            emailId: emailId,
            folderName: Array.isArray(folderName) ? folderName[0] : folderName,
            bookName: bookName
          }
        });
      }
      navigate('/my-flipbooks');
    } catch (err) {
      console.error("Failed to delete flipbook:", err);
    } finally {
      setIsDeleting(false);
      setIsDeleteWarningOpen(false);
    }
  };

  // 3D Editor Persistence State
  const [threedState, setThreedState] = useState({
      modelUrl: null,
      modelFile: null,
      modelType: 'glb',
      modelStats: {
        vertexCount: "0",
        polygonCount: "0",
        materialCount: "0",
        fileSize: "0 MB",
        dimensions: "0 X 0 X 0 unit"
      },
      transformValues: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      },
      materialSettings: {
        alpha: 100, metallic: 0, roughness: 50, normal: 100, bump: 100, scale: 4, rotation: 0,
        specular: 50, reflection: 50, shadow: 50, softness: 50, ao: 100, environment: 'studio',
        worldOpacity: 0, worldBlur: 0,
        color: '#ffffff', useFactorColor: false, autoUnwrap: false, envRotation: 0, offset: { x: 0, y: 0 },
        lightPosition: { x: 10, y: 10, z: 10 }
      },
      modelName: "",
      materialList: [],
  });

  const [activeDevice, setActiveDevice] = useState('Desktop');
  const [isRestoring, setIsRestoring] = useState(true);

  // Restore State from IndexedDB on Mount
  useEffect(() => {
      const loadState = async () => {
          try {
              const savedState = await getFromDB(STATE_KEY);
              if (savedState) {
                  // Reconstruct URL from Blob if present
                  let restoredUrl = null;
                  if (savedState.modelFile instanceof Blob) {
                      restoredUrl = URL.createObjectURL(savedState.modelFile);
                  }
                  
                  let restoredModels = savedState.models;
                  if (restoredModels && Array.isArray(restoredModels)) {
                      restoredModels = restoredModels.map(m => {
                          if (m.file instanceof Blob) {
                              return { ...m, url: URL.createObjectURL(m.file) };
                          }
                          // If it's not a blob, keep the URL that was saved (likely a remote backend URL)
                          return m;
                      });
                  }
                  
                  setThreedState({
                      ...savedState,
                      modelUrl: restoredUrl || savedState.modelUrl, // Use saved URL as fallback
                      models: restoredModels
                  });
              }
          } catch (e) {
              console.error("Failed to restore 3D state", e);
          } finally {
              setIsRestoring(false);
          }
      };
      
      loadState();
  }, []);

  // Save State to IndexedDB on Change
  useEffect(() => {
      if (isRestoring) return; // Don't save while restoring

      const saveTimer = setTimeout(() => {
          // Prepare state for saving (exclude transient blob URLs)
          const stateToSave = {
              ...threedState,
              modelUrl: threedState.modelUrl?.startsWith('blob:') ? null : threedState.modelUrl
          };
          if (stateToSave.models && Array.isArray(stateToSave.models)) {
              stateToSave.models = stateToSave.models.map(m => ({ 
                  ...m, 
                  url: m.url?.startsWith('blob:') ? null : m.url 
              }));
          }
          saveToDB(STATE_KEY, stateToSave);
      }, 1000); // Debounce saves

      return () => clearTimeout(saveTimer);
  }, [threedState, isRestoring]);

  // Cleanup 3D Model URL on Editor Unmount (Global cleanup)
  useEffect(() => {
     return () => {
         if (threedState.modelUrl) {
             URL.revokeObjectURL(threedState.modelUrl);
         }
         if (threedState.models && Array.isArray(threedState.models)) {
             threedState.models.forEach(m => {
                 if (m.url) URL.revokeObjectURL(m.url);
             });
         }
     };
  }, []); // Only on unmount of the Layout

  // Memoize context - include threedState
  const contextValue = React.useMemo(() => ({ 
    setExportHandler, 
    setSaveHandler,
    setPreviewHandler,
    setClearHandler,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    canSave,
    setCanSave,
    triggerSaveSuccess: handleSaveSuccess,
    isAutoSaveEnabled,
    isSaving,
    setIsSaving,
    threedState,        // 3D State getter
    setThreedState,      // 3D State setter
    currentBook,
    setCurrentBook,
    activeDevice,
    setActiveDevice,
    isExportModalOpen,
    setExportContext
  }), [isAutoSaveEnabled, isSaving, hasUnsavedChanges, canSave, threedState, currentBook, activeDevice, isExportModalOpen]);

  // if (isRestoring) {
  //     return (
  //         <AnimatePresence>
  //             <motion.div
  //                 key="restore-loader"
  //                 initial={{ opacity: 1 }}
  //                 exit={{ opacity: 0 }}
  //                 transition={{ duration: 0.5, ease: 'easeInOut' }}
  //                 className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white gap-3"
  //             >
  //                 <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
  //                 <span className="text-[0.85vw] font-semibold text-gray-600 tracking-wide">Restoring Editor Session...</span>
  //             </motion.div>
  //         </AnimatePresence>
  //     );
  // }

  return (
    <div className="flex flex-col h-screen">
      <Navbar 
        onExport={handleExport} 
        onSave={handleSave}
        onPreview={handlePreview}
        onPublish={handlePublish}
        onClearFlipbook={handleClearFlipbook}
        onDeleteFlipbook={handleDeleteFlipbook}
        hasUnsavedChanges={hasUnsavedChanges}
        canSave={canSave}
        saveSuccessInfo={saveSuccessInfo}
        isAutoSaveEnabled={isAutoSaveEnabled}
        onToggleAutoSave={toggleAutoSave}
        currentBook={currentBook}
        isSaving={isSaving}
        activeDevice={activeDevice}
        setActiveDevice={setActiveDevice}
      />
      <div className="flex-1 overflow-hidden">
        <Outlet context={contextValue} />
      </div>
      
      {/* Export Modal */}
      <ExportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)}
        currentBook={currentBook}
        pages={exportContext.pages}
        currentPageIndex={exportContext.activePageIndex}
      />

      {/* Publish Modal */}
      <PublishModal 
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        currentBook={currentBook}
        onPublishSuccess={(data) => {
          setCurrentBook(prev => ({
            ...(prev || {}),
            ...(data || {}),
            isPublished: true
          }));
        }}
      />

      {/* Unpublish Warning Modal */}
      <AlertModal 
        isOpen={isUnpublishWarningOpen}
        onClose={() => setIsUnpublishWarningOpen(false)}
        onConfirm={confirmUnpublish}
        type="warning"
        title="Unpublish Flipbook"
        message="Are you sure you want to unpublish this flipbook? Unpublishing will clear all tags."
        showCancel={true}
        confirmText="Yes, Unpublish"
        cancelText="Cancel"
        isLoading={isUnpublishing}
      />

      {/* Clear Warning Modal */}
      <AlertModal 
        isOpen={isClearWarningOpen}
        onClose={() => setIsClearWarningOpen(false)}
        onConfirm={confirmClear}
        type="warning"
        title="Clear Flipbook"
        message="Are you sure you want to clear all page content from this flipbook? All page elements will be reset."
        showCancel={true}
        confirmText="Yes, Clear"
        cancelText="Cancel"
        isLoading={isClearing}
      />

      {/* Delete Warning Modal */}
      <AlertModal 
        isOpen={isDeleteWarningOpen}
        onClose={() => setIsDeleteWarningOpen(false)}
        onConfirm={confirmDelete}
        type="error"
        title="Delete Flipbook"
        message="Are you sure you want to delete this flipbook? This action cannot be undone."
        showCancel={true}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default Editor;
