import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Icon } from '@iconify/react';
import { resolveUploadsPath, getSupabaseBaseUrl } from '../../utils/supabaseUtils';

import bookShelf1 from '../../assets/Bookshelf/Book_shelf1.webp';
import textureScreen2 from '../../assets/Bookshelf/classicwood/classic woodtexture.webp';
import bookShelf2 from '../../assets/Bookshelf/classicwood/classicwoodshelf.webp';
import darkOakTex1 from '../../assets/Bookshelf/Darkoak/texture_screen1.webp';
import darkOakTex2 from '../../assets/Bookshelf/Darkoak/texture_screen2.webp';
import darkOakTex3 from '../../assets/Bookshelf/Darkoak/texture_screen3.webp';
import darkOakShelf from '../../assets/Bookshelf/Darkoak/darkoakshelf.webp';

import mwWall1 from '../../assets/Bookshelf/modernwhite/wall1.webp';
import book1 from '../../assets/Bookshelf/Bookcover/book1.webp';
import book2 from '../../assets/Bookshelf/Bookcover/book2.webp';
import book3 from '../../assets/Bookshelf/Bookcover/book3.webp';
import book4 from '../../assets/Bookshelf/Bookcover/book4.webp';
import book5 from '../../assets/Bookshelf/Bookcover/book5.webp';
import book6 from '../../assets/Bookshelf/Bookcover/book6.webp';

const initialBooks = [
  book1, book2, book3, book4, book5, book6,
  book1, book2, book3, book4, book5, book6,
  book1, book2, book3, book4, book5, book6,
  book1
];

import customize1 from '../../assets/Bookshelf/customize_shelf/customize1.svg';
import customize2 from '../../assets/Bookshelf/customize_shelf/customize2.svg';
import customize3 from '../../assets/Bookshelf/customize_shelf/customize3.svg';
import listFrame from '../../assets/Bookshelf/list_frame.svg';

import cover1 from '../../assets/Explore/c-bg1.png';
import cover2 from '../../assets/Explore/c-bg2.png';
import cover3 from '../../assets/Explore/c-bg3.png';
import cover4 from '../../assets/Explore/c-bg4.png';
import cover5 from '../../assets/Explore/c-bg5.png';

const covers = [cover1, cover2, cover3, cover4, cover5];

const shelfOptions = [
  { id: 'customize1', name: 'Modern White', img: customize1 },
  { id: 'customize2', name: 'Classic Wood', img: customize2 },
  { id: 'customize3', name: 'Dark Oak', img: customize3 },
];

const MyShelf = () => {
  const [view, setView] = useState('shelf');
  const [showShelfModal, setShowShelfModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [hoveredInfoId, setHoveredInfoId] = useState(null);
  const [folders, setFolders] = useState([
    { name: 'My Flipbooks', books: [] }
  ]);
  const [selectedFolder, setSelectedFolder] = useState('My Flipbooks');
  const [showAddShelfModal, setShowAddShelfModal] = useState(false);
  const [newShelfName, setNewShelfName] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [draggedBookIndex, setDraggedBookIndex] = useState(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [bookToMoveIndex, setBookToMoveIndex] = useState(null);
  const [targetMoveFolder, setTargetMoveFolder] = useState('');

  // State for the currently applied shelf and the draft shelf in the modal
  const [activeShelfStyle, setActiveShelfStyle] = useState(shelfOptions[0].id);
  const [draftShelfStyle, setDraftShelfStyle] = useState(shelfOptions[0].id);

  const [booksData, setBooksData] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  const currentUserEmail = (() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        if (u?.emailId || u?.email) return (u.emailId || u.email).toLowerCase();
      }
      const storedProfile = localStorage.getItem('user_profile');
      if (storedProfile) {
        const p = JSON.parse(storedProfile);
        if (p?.emailId || p?.email) return (p.emailId || p.email).toLowerCase();
      }
    } catch (e) { }
    return '';
  })();

  useEffect(() => {
    const fetchMyBooks = async () => {
      setIsLoading(true);
      try {
        if (!currentUserEmail) {
          setIsLoading(false);
          return;
        }
        const timestamp = Date.now();
        const [creatorRes, listRes, shelfRes] = await Promise.all([
          axios.get(`${backendUrl}/api/explore/creator`, { params: { emailId: currentUserEmail, t: timestamp } }).catch(() => ({ data: {} })),
          axios.get(`${backendUrl}/api/flipbook/list`, { params: { emailId: currentUserEmail, t: timestamp } }).catch(() => ({ data: {} })),
          axios.get(`${backendUrl}/api/profile/my-shelf-books`, { params: { emailId: currentUserEmail, t: timestamp } }).catch(() => ({ data: {} }))
        ]);

        if (creatorRes.data?.profile) {
          setProfileData(creatorRes.data.profile);
        }

        const rawBooks = listRes.data?.books || [];
        const shelfBooks = shelfRes.data?.books || [];

        // Filter out 'Recent Book' virtual tags so we only show actual folder contents, or filter by specific folder
        const actualCreatedBooks = rawBooks.filter(b => b.folder !== 'Recent Book');

        // Combine created books and shelf books, avoiding duplicates if a user somehow added their own book to the shelf
        const combinedBooksMap = new Map();
        actualCreatedBooks.forEach(b => {
          combinedBooksMap.set(b.v_id, b);
        });
        shelfBooks.forEach(b => {
          if (!combinedBooksMap.has(b.v_id)) {
            combinedBooksMap.set(b.v_id, b);
          } else {
            // Update folder if the shelf explicitly categorized it differently
            const existing = combinedBooksMap.get(b.v_id);
            existing.folder = b.folder;
          }
        });

        const actualBooks = Array.from(combinedBooksMap.values());
        const fetchedProfile = creatorRes.data?.profile || profileData;

        const formatted = actualBooks.map((b, idx) => {
          const isMyBook = !b.isAddedToShelf || (b.userEmail && b.userEmail.toLowerCase() === currentUserEmail);

          let aName = b.authorName;
          let aPic = b.authorPicture;
          let aBg = b.authorBgColor;
          let aLoc = b.city || b.location;

          if (isMyBook && fetchedProfile) {
            aName = aName || fetchedProfile.name;
            aPic = aPic || (fetchedProfile.picture !== 'color_only' ? fetchedProfile.picture : null);
            aBg = aBg || fetchedProfile.avatarBgColor;
            aLoc = aLoc || fetchedProfile.city || fetchedProfile.state;
          }

          aName = aName || (b.userEmail ? b.userEmail.split('@')[0] : 'Creator');
          aBg = aBg || '#4c5add';
          aLoc = aLoc || 'Coimbatore';

          return {
            rawBook: b,
            v_id: b.v_id,
            shareId: b.Customized_Settings?.Visibility?.shareId || b.Visibility?.shareId || b.v_id,
            access: b.Customized_Settings?.Visibility?.access || b.Visibility?.access || 'public',
            title: b.title || b.flipbookName || `Flipbook ${idx + 1}`,
            cover: b.image || covers[idx % covers.length],
            pages: typeof b.pages === 'number' ? b.pages : (b.pages?.length || 0),
            views: b.views || '1.2k',
            rating: b.rating || 4.5,
            description: b.Customized_Settings?.FlipbookInfo?.quotes || b.quotes || '“Bring your content to life with a real, interactive experience”',
            category: b.Customized_Settings?.FlipbookInfo?.category || b.category || 'Product Catalogue',
            authorName: aName,
            authorPicture: aPic,
            authorBgColor: aBg,
            location: aLoc
          };
        });

        setBooksData(formatted);

        // Re-group books into folders
        const folderMap = {};

        // First, initialize folderMap with any existing folders from the profile
        const actualMyShelf = shelfRes.data?.myShelf || (fetchedProfile && fetchedProfile.myShelf);
        const folderDesignMap = {};
        const bookToFolderMap = new Map();
        
        if (actualMyShelf && actualMyShelf.folders) {
          actualMyShelf.folders.forEach(f => {
            const fName = f.folderName === 'My_Flipbooks' ? 'My Flipbooks' : (f.folderName || 'My Flipbooks');
            if (!folderMap[fName]) folderMap[fName] = [];
            folderDesignMap[fName] = f.shelf_design || 1;
            
            if (f.books && Array.isArray(f.books)) {
              f.books.forEach(b => {
                const v_id = typeof b === 'string' ? b : b.v_id;
                if (v_id) bookToFolderMap.set(v_id, fName);
              });
            }
          });
        }

        formatted.forEach(b => {
          let folderName = bookToFolderMap.get(b.v_id) || b.rawBook.folder || 'My Flipbooks';
          if (folderName === 'My_Flipbooks') {
            folderName = 'My Flipbooks';
          }
          if (!folderMap[folderName]) folderMap[folderName] = [];
          folderMap[folderName].push(b);
        });

        // Sort books based on their row and order from DB
        if (actualMyShelf && actualMyShelf.folders) {
          const globalDbOrder = new Map();
          actualMyShelf.folders.forEach(f => {
            const fName = f.folderName === 'My_Flipbooks' ? 'My Flipbooks' : (f.folderName || 'My Flipbooks');
            if (f.books && Array.isArray(f.books)) {
              f.books.forEach((b) => {
                const v_id = typeof b === 'string' ? b : b.v_id;
                if (v_id) {
                  globalDbOrder.set(`${fName}_${v_id}`, { row: b.row || 0, order: b.order || 0 });
                }
              });
            }
          });

          // Apply sorting based on folder mapping
          Object.keys(folderMap).forEach(fName => {
            folderMap[fName].sort((a, b) => {
              const aOrder = globalDbOrder.get(`${fName}_${a.v_id}`);
              const bOrder = globalDbOrder.get(`${fName}_${b.v_id}`);
              if (aOrder && bOrder) {
                if (aOrder.row !== bOrder.row) return aOrder.row - bOrder.row;
                return aOrder.order - bOrder.order;
              }
              if (aOrder) return -1;
              if (bOrder) return 1;
              return 0; // Keep existing order if both missing
            });
          });
        }

        const newFolders = Object.keys(folderMap).map(folderName => ({
          name: folderName,
          books: folderMap[folderName],
          shelf_design: folderDesignMap[folderName] || 1
        }));

        // Ensure 'My Flipbooks' always exists
        if (!newFolders.some(f => f.name === 'My Flipbooks')) {
          newFolders.unshift({ name: 'My Flipbooks', books: [], shelf_design: folderDesignMap['My Flipbooks'] || 1 });
        }

        setFolders(newFolders);

        // The active shelf style will be synced by the useEffect depending on selectedFolder

        // Auto-sync migration for missing legacy books or removed books
        if (actualMyShelf && actualMyShelf.folders) {
          newFolders.forEach(folder => {
            const dbFolder = actualMyShelf.folders.find(f => f.folderName === folder.name || (folder.name === 'My Flipbooks' && f.folderName === 'My_Flipbooks'));
            const dbBookCount = dbFolder && dbFolder.books ? dbFolder.books.length : 0;
            
            if (folder.books.length !== dbBookCount) {
              try {
                const bookIds = folder.books.map(b => b.v_id);
                axios.post(`${backendUrl}/api/profile/update-shelf-order`, {
                  emailId: currentUserEmail,
                  folderName: folder.name,
                  bookIds
                }).catch(e => console.warn("Auto-sync warning:", e));
              } catch (e) { }
            }
          });
        }
      } catch (err) {
        console.error("Error fetching my shelf books:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyBooks();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchMyBooks();
      }
    };

    const handlePageShow = (e) => {
      if (e.persisted) {
        fetchMyBooks();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [backendUrl, currentUserEmail]);

  const handleRemoveBook = async (v_id) => {
    if (!v_id) return;
    try {
      await axios.post(`${backendUrl}/api/profile/remove-from-shelf`, {
        emailId: currentUserEmail,
        bookId: v_id
      });

      // Remove from local state
      setBooksData(prev => prev.filter(b => b.v_id !== v_id));
      setFolders(prev => prev.map(f => ({
        ...f,
        books: f.books.filter(b => b.v_id !== v_id)
      })));
    } catch (err) {
      console.error("Failed to remove book:", err);
    }
  };

  // Sync active shelf style with the selected folder
  useEffect(() => {
    const currentFolder = folders.find(f => f.name === selectedFolder);
    if (currentFolder) {
      setActiveShelfStyle(`customize${currentFolder.shelf_design || 1}`);
    }
  }, [folders, selectedFolder]);

  const handleFlipbookSelect = (e) => {
    if (e.target.value === 'add_shelf') {
      setShowAddShelfModal(true);
    } else {
      setSelectedFolder(e.target.value);
      const targetFolder = folders.find(f => f.name === e.target.value);
      if (targetFolder) {
        setActiveShelfStyle(`customize${targetFolder.shelf_design || 1}`);
      }
    }
  };

  const openShelfModal = () => {
    setDraftShelfStyle(activeShelfStyle);
    setShowShelfModal(true);
  };

  const applyShelfStyle = async () => {
    setActiveShelfStyle(draftShelfStyle);
    setShowShelfModal(false);

    if (!currentUserEmail || !selectedFolder) return;
    try {
      const shelfDesignNum = parseInt(draftShelfStyle.replace('customize', '')) || 1;
      await axios.post(`${backendUrl}/api/profile/update-shelf-design`, {
        emailId: currentUserEmail,
        folderName: selectedFolder,
        shelf_design: shelfDesignNum
      });

      setFolders(prev => prev.map(f => f.name === selectedFolder ? { ...f, shelf_design: shelfDesignNum } : f));
    } catch (err) {
      console.error("Failed to update shelf design:", err);
    }
  };

  const handleMoveSubmit = async () => {
    if (targetMoveFolder === '__add_shelf__') {
      if (!newShelfName.trim()) return;
      const newFolderName = newShelfName.trim();
      let updatedSourceBooks = [];
      let newFolderBooks = [];

      setFolders(prev => {
        const sourceFolderIdx = prev.findIndex(f => f.name === selectedFolder);
        if (sourceFolderIdx === -1) return prev;

        const newSourceBooks = [...prev[sourceFolderIdx].books];
        const [movedBook] = newSourceBooks.splice(bookToMoveIndex, 1);

        updatedSourceBooks = newSourceBooks;
        newFolderBooks = [movedBook];

        const updatedFolders = prev.map((f, idx) =>
          idx === sourceFolderIdx ? { ...f, books: newSourceBooks } : f
        );

        return [{ name: newFolderName, books: newFolderBooks }, ...updatedFolders];
      });

      if (currentUserEmail) {
        try {
          await axios.post(`${backendUrl}/api/profile/update-shelf-order`, {
            emailId: currentUserEmail,
            folderName: newFolderName,
            bookIds: newFolderBooks.map(b => b.v_id)
          });
          await axios.post(`${backendUrl}/api/profile/update-shelf-order`, {
            emailId: currentUserEmail,
            folderName: selectedFolder,
            bookIds: updatedSourceBooks.map(b => b.v_id)
          });
        } catch (e) {
          console.error("Failed to sync move", e);
        }
      }

      setNewShelfName('');
      setShowMoveModal(false);
      setBookToMoveIndex(null);
      return;
    }

    if (!targetMoveFolder || targetMoveFolder === selectedFolder) {
      setShowMoveModal(false);
      return;
    }

    let updatedSourceBooks = [];
    let updatedTargetBooks = [];

    setFolders(prev => {
      const sourceFolderIdx = prev.findIndex(f => f.name === selectedFolder);
      const targetFolderIdx = prev.findIndex(f => f.name === targetMoveFolder);
      if (sourceFolderIdx === -1 || targetFolderIdx === -1) return prev;

      const newFolders = [...prev];
      const newSourceBooks = [...newFolders[sourceFolderIdx].books];
      const [movedBook] = newSourceBooks.splice(bookToMoveIndex, 1);

      const newTargetBooks = [...newFolders[targetFolderIdx].books];
      newTargetBooks.push(movedBook);

      updatedSourceBooks = newSourceBooks;
      updatedTargetBooks = newTargetBooks;

      newFolders[sourceFolderIdx] = { ...newFolders[sourceFolderIdx], books: newSourceBooks };
      newFolders[targetFolderIdx] = { ...newFolders[targetFolderIdx], books: newTargetBooks };
      return newFolders;
    });

    if (currentUserEmail) {
      try {
        await axios.post(`${backendUrl}/api/profile/update-shelf-order`, {
          emailId: currentUserEmail,
          folderName: targetMoveFolder,
          bookIds: updatedTargetBooks.map(b => b.v_id)
        });
        await axios.post(`${backendUrl}/api/profile/update-shelf-order`, {
          emailId: currentUserEmail,
          folderName: selectedFolder,
          bookIds: updatedSourceBooks.map(b => b.v_id)
        });
      } catch (e) {
        console.error("Failed to sync move", e);
      }
    }

    setShowMoveModal(false);
    setBookToMoveIndex(null);
  };



  const handleDragStart = (e, index) => {
    setDraggedBookIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetIndex) => {
    e.preventDefault();
    if (draggedBookIndex === null || draggedBookIndex === targetIndex) return;

    const currentFolder = folders.find(f => f.name === selectedFolder);
    if (!currentFolder) return;

    const draggedBookObj = filteredBooks[draggedBookIndex];
    if (!draggedBookObj) return;

    const actualDraggedIndex = currentFolder.books.findIndex(b => b.v_id === draggedBookObj.v_id);
    if (actualDraggedIndex === -1) return;

    const newBooks = [...currentFolder.books];
    const [draggedBook] = newBooks.splice(actualDraggedIndex, 1);

    const targetBookObj = filteredBooks[targetIndex];
    let actualTargetIndex;
    if (targetBookObj) {
      actualTargetIndex = currentFolder.books.findIndex(b => b.v_id === targetBookObj.v_id);
    } else {
      actualTargetIndex = newBooks.length;
    }

    newBooks.splice(actualTargetIndex, 0, draggedBook);

    setFolders(prev => prev.map(folder => {
      if (folder.name === selectedFolder) {
        return { ...folder, books: newBooks };
      }
      return folder;
    }));
    
    setDraggedBookIndex(null);

    try {
      const bookIds = newBooks.map(b => b.v_id);
      await axios.post(`${backendUrl}/api/profile/update-shelf-order`, {
        emailId: currentUserEmail,
        folderName: selectedFolder,
        bookIds
      });
    } catch (err) {
      console.error("Failed to update shelf order:", err);
    }
  };

  const handleDragEnd = () => {
    setDraggedBookIndex(null);
  };

  const activeFolderGlobal = folders.find(f => f.name === selectedFolder);
  
  const filteredBooks = activeFolderGlobal 
    ? activeFolderGlobal.books.filter(b => {
        if (selectedStatus === 'All Status') return true;
        
        const isPublic = String(b.access).toLowerCase() === 'public';
        const isPrivate = String(b.access).toLowerCase() === 'private';
        const isPublished = b.rawBook?.isPublished === true || b.rawBook?.isPublished === 'true';

        if (selectedStatus === 'Published - Public' && isPublished && isPublic) return true;
        if (selectedStatus === 'Published - Private' && isPublished && isPrivate) return true;
        if (selectedStatus === 'Unpublished - Public' && !isPublished && isPublic) return true;
        if (selectedStatus === 'Unpublished - Private' && !isPublished && isPrivate) return true;

        if (selectedStatus === 'Private' && isPrivate) return true;
        if (selectedStatus === 'Public' && isPublic) return true;

        return false;
      })
    : [];

  const getShelfAssets = (style) => {
    const bookCount = filteredBooks.length;
    const calculatedRowCount = Math.max(3, Math.ceil(bookCount / 6));

    switch (style) {
      case 'customize1':
        return {
          type: 'rows',
          bg: mwWall1,
          rowAsset: bookShelf1,
          rowCount: calculatedRowCount,
          bgStretch: false,
          noZone: true,
          padding: 'px-6',
          topOffset: 6,
          spacing: 32,
          bookWidth: '11.5%',
          bookStyle: { bottom: '21%', padding: '0 14%' }
        };
      case 'customize2':
        return {
          type: 'rows',
          bg: textureScreen2,
          rowAsset: bookShelf2,
          rowCount: calculatedRowCount,
          bgStretch: true,
          noZone: true,
          padding: 'px-0',
          rowPadding: '0 1.5%',
          topOffset: 29.7,
          spacing: 32.15,
          bookWidth: '13%',
          bookStyle: { bottom: '76%', padding: '0 10%' }
        };
      case 'customize3':
        return {
          type: 'rows',
          bg: [darkOakTex1, darkOakTex2, darkOakTex3],
          rowAsset: darkOakShelf,
          rowCount: calculatedRowCount,
          bgStretch: false,
          noZone: true,
          padding: 'px-0',
          rowPadding: '0 4%',
          topOffset: 5,
          spacing: 33,
          bookWidth: '11.5%',
          bookStyle: { bottom: '10%', padding: '0 10%' }
        };
      default:
        return {
          type: 'rows',
          bg: mwWall1,
          rowAsset: bookShelf1,
          rowCount: calculatedRowCount,
          bgStretch: false,
          noZone: true,
          padding: 'px-6',
          topOffset: 6,
          spacing: 32,
          bookWidth: '11.5%',
          bookStyle: { bottom: '21%', padding: '0 14%' }
        };
    }
  };

  const activeAssets = getShelfAssets(activeShelfStyle);

  // Global variables for height and scroll calculation
  const globalBookCount = filteredBooks.length;
  const globalRowCount = Math.max(3, Math.ceil(globalBookCount / 6));

  // Calculate dynamic shelf positioning to perfectly preserve physical pixels
  const spacing = activeAssets.spacing ?? 32;
  const topOffset = activeAssets.topOffset ?? 6;
  // Container grows exactly by 'spacing' for each new shelf, plus a tiny 3% extra for breathing room
  const heightRatio = globalRowCount <= 3 ? 1 : (100 + (globalRowCount - 3) * spacing + 3) / 100;

  // Scale percentages inversely so physical positions remain identical
  const newTopOffset = topOffset / heightRatio;
  const newSpacing = spacing / heightRatio;

  return (
    <div className="flex flex-col w-full h-full px-4 pb-0 pt-1 overflow-visible font-sans text-gray-800">

      {/* Header */}
      <div className="flex justify-between items-start mb-3 -mt-2">
        <div>
          <h1 className="text-2xl font-bold mb-1">My Shelf</h1>
          <p className="text-[11px] mt-0.5 text-[#94a3b8]">PNG format keeps your logo clean and background-free</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setView('shelf')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border ${view === 'shelf' ? 'bg-gray-50 text-[#1e293b] shadow-inner border-gray-200' : 'bg-white text-[#94a3b8] hover:text-[#64748b] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border-transparent hover:border-gray-50'}`}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 ${view === 'shelf' ? 'text-gray-500' : 'text-[#94a3b8]'}`}>
              <path fillRule="evenodd" clipRule="evenodd" d="M 2 3 h 20 v 5 H 2 Z M 13.5 4 h 1.2 v 4 h -1.2 Z M 15.1 4 h 1.2 v 4 h -1.2 Z M 16.7 4 h 1.2 v 4 h -1.2 Z M 18.3 4 h 1.2 v 4 h -1.2 Z M 2 9.5 h 20 v 5 H 2 Z M 3.5 10.5 h 1.2 v 4 h -1.2 Z M 5.1 10.5 h 1.2 v 4 h -1.2 Z M 6.7 10.5 h 1.2 v 4 h -1.2 Z M 8.5 14.5 L 9.7 10.5 h 1.2 L 9.7 14.5 Z M 2 16 h 20 v 5 H 2 Z M 3.5 17 h 1.2 v 4 h -1.2 Z M 5.1 17 h 1.2 v 4 h -1.2 Z M 13.5 18.4 h 4 v 1.2 h -4 Z M 14.5 19.8 h 4 v 1.2 h -4 Z" />
            </svg>
            <span>Shelf View</span>
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border ${view === 'list' ? 'bg-gray-50 text-[#1e293b] shadow-inner border-gray-200' : 'bg-white text-[#94a3b8] hover:text-[#64748b] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border-transparent hover:border-gray-50'}`}
          >
            <Icon icon="circum:box-list" className={`w-5 h-5 ${view === 'list' ? 'text-gray-500' : 'text-[#94a3b8]'}`} />
            <span>List View</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      {openDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setOpenDropdown(null)}
        />
      )}
      <div className="flex gap-4 mb-4 relative z-20">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" placeholder="Search Flipbook..." className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none" />
        </div>

        {/* Flipbook Dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'flipbooks' ? null : 'flipbooks')}
            className="flex items-center justify-between w-40 px-4 py-1.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none"
          >
            <span className="text-[#5B738B]">{selectedFolder === 'add_shelf' ? 'Add Shelf' : selectedFolder}</span>
            <Icon icon={openDropdown === 'flipbooks' ? "mdi:chevron-up" : "mdi:chevron-down"} className="w-4 h-4 text-[#8BA3BA]" />
          </button>

          {openDropdown === 'flipbooks' && (
            <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-100 rounded-lg shadow-[0_4px_20px_rgb(0,0,0,0.08)] py-1 overflow-hidden">
              {folders.map(folder => (
                <div
                  key={folder.name}
                  className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors ${selectedFolder === folder.name ? 'bg-gray-50 text-[#334155]' : 'text-[#475569]'}`}
                  onClick={() => {
                    handleFlipbookSelect({ target: { value: folder.name } });
                    setOpenDropdown(null);
                  }}
                >
                  {folder.name}
                </div>
              ))}
              <div
                className={`px-4 py-2 text-sm cursor-pointer border-t border-gray-100 hover:bg-gray-50 transition-colors ${selectedFolder === 'add_shelf' ? 'bg-gray-50 text-[#334155]' : 'text-[#475569]'}`}
                onClick={() => {
                  handleFlipbookSelect({ target: { value: 'add_shelf' } });
                  setOpenDropdown(null);
                }}
              >
                + Add Shelf
              </div>
            </div>
          )}
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
            className="flex items-center justify-between w-48 px-4 py-1.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none"
          >
            <span className="text-[#5B738B] truncate mr-2 text-left w-full">{selectedStatus}</span>
            <Icon icon={openDropdown === 'status' ? "mdi:chevron-up" : "mdi:chevron-down"} className="w-4 h-4 text-[#8BA3BA] shrink-0" />
          </button>

          {openDropdown === 'status' && (
            <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-100 rounded-lg shadow-[0_4px_20px_rgb(0,0,0,0.08)] py-1 overflow-hidden">
              {['All Status', 'Published - Public', 'Published - Private', 'Unpublished - Public', 'Unpublished - Private'].map((status) => (
                <div
                  key={status}
                  className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors ${selectedStatus === status ? 'bg-gray-50 text-[#334155]' : 'text-[#475569]'}`}
                  onClick={() => {
                    setSelectedStatus(status);
                    setOpenDropdown(null);
                  }}
                >
                  {status}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-6 h-[calc(100vh-40px)]  mt[1vw] relative">
        {view === 'shelf' ? (
          /* Outer Scrollable Container */
          <div className={`relative flex-1 h-full overflow-x-hidden ${globalRowCount <= 3 ? 'overflow-y-hidden' : 'overflow-y-auto pr-2'}`}>
            {isLoading && (
              <div className="absolute inset-0 z-50 flex gap-[0.5vw] items-center justify-center bg-white/50 backdrop-blur-sm rounded-xl">
                 <Icon icon="eos-icons:loading" className="w-8 h-8 text-blue-600" />
                  <span className="text-[1vw] font-semibold text-gray-700">Shelf Loading...</span>
                </div>
            )}
            {/* The White Rounded Box (Grows in height) */}
            <div
              className="w-full rounded-xl bg-white shadow-inner overflow-hidden flex flex-col"
              style={{
                minHeight: '100%',
                height: `${heightRatio * 100}%`
              }}
            >
              <div
                className={`relative flex-1 w-full bg-top rounded-xl`}
                style={{
                  backgroundImage: (!Array.isArray(activeAssets.bg) && activeAssets.bg) ? `url('${activeAssets.bg}')` : 'none',
                  backgroundSize: activeAssets.bgStretch ? '100% 100%' : '100% auto',
                  backgroundRepeat: activeAssets.bgStretch ? 'no-repeat' : 'repeat',
                }}
              >
                {/* If bg is an array, map over it to render wall blocks */}
                {Array.isArray(activeAssets.bg) && (
                  <div className="absolute inset-0 flex flex-col rounded-xl overflow-hidden pointer-events-none">
                    {Array.from({ length: activeAssets.rowCount }, (_, i) => (
                      <div
                        key={i}
                        className="w-full flex-1 bg-center"
                        style={{
                          backgroundImage: `url('${activeAssets.bg[i % activeAssets.bg.length]}')`,
                          backgroundSize: activeAssets.bgStretch ? '100% 100%' : '100% auto',
                          backgroundRepeat: activeAssets.bgStretch ? 'no-repeat' : 'repeat',
                          backgroundPosition: 'center',
                        }}
                      />
                    ))}
                  </div>
                )}
                {openMenuId && (
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setOpenMenuId(null)}
                  />
                )}
                <div className="absolute right-4 top-4 z-20">
                  <div
                    className="bg-white/80 backdrop-blur p-2 rounded-full cursor-pointer hover:bg-white shadow-sm transition-all"
                    onClick={openShelfModal}
                    title="Change Shelf"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                  </div>
                </div>

                {activeAssets.type === 'rows' && activeAssets.rowAsset && (
                  <div className="absolute inset-0 w-full h-full">
                    {Array.from({ length: activeAssets.rowCount }, (_, i) => (
                      <div
                        key={i}
                        className={`absolute left-0 w-full ${activeAssets.rowPadding ? '' : (activeAssets.padding || 'px-12')}`}
                        style={{
                          top: `${newTopOffset + (i * newSpacing) - (activeShelfStyle === 'customize2' && i !== activeAssets.rowCount - 1 ? 3.5 : 0)}%`,
                          padding: activeAssets.rowPadding || undefined
                        }}
                      >
                        {!(activeShelfStyle === 'customize2' && i === activeAssets.rowCount - 1) && (
                          <img src={activeAssets.rowAsset} alt="Shelf" className="w-full h-auto drop-shadow-lg" />
                        )}
                        {/* Books Container */}
                        {!activeAssets.hideBooks && (
                          <div
                            className="absolute inset-0 flex justify-between items-end"
                            style={activeAssets.bookStyle || { bottom: '15%', padding: '0 5%' }}
                          >
                            {(() => {
                              const rowBooks = filteredBooks.slice(i * 6, (i + 1) * 6) || [];
                              const paddedBooks = [...rowBooks, ...Array.from({ length: 6 - rowBooks.length }).fill(null)];
                              
                              return paddedBooks.map((book, bIdx) => {
                                if (!book) {
                                  return (
                                    <div
                                      key={`empty-${i}-${bIdx}`}
                                      onDragOver={handleDragOver}
                                      onDrop={(e) => handleDrop(e, i * 6 + bIdx)}
                                      className={`relative flex justify-center items-end ${activeShelfStyle === 'customize2' ? (i === activeAssets.rowCount - 1 ? 'translate-y-4' : 'translate-y-0') : 'translate-y-2'} ${bIdx === 0 ? 'translate-x-3' : bIdx === 1 ? 'translate-x-3' : bIdx === 2 ? 'translate-x-4' : ''}`}
                                      style={{ width: activeAssets.bookWidth || '12%' }}
                                    />
                                  );
                                }

                                const emailFolder = book.rawBook?.userEmail ? book.rawBook.userEmail.replace(/[@.]/g, "_") : '';
                                const folderName = (book.rawBook?.folderName && book.rawBook.folderName.length > 0) ? book.rawBook.folderName[0] : (book.rawBook?.folder || '');
                                const bookName = book.rawBook?.flipbookName || book.rawBook?.title || '';
                                const basePath = getSupabaseBaseUrl(emailFolder, folderName, bookName);

                                return (
                                  <div
                                    key={book.v_id || bIdx}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, i * 6 + bIdx)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, i * 6 + bIdx)}
                                    onDragEnd={handleDragEnd}
                                    className={`relative group cursor-pointer flex justify-center items-end ${activeShelfStyle === 'customize2' ? (i === activeAssets.rowCount - 1 ? 'translate-y-4' : 'translate-y-0') : 'translate-y-2'} ${openMenuId === `${i}-${bIdx}` ? 'z-40' : 'hover:z-30'} ${bIdx === 0 ? 'translate-x-3' : bIdx === 1 ? 'translate-x-3' : bIdx === 2 ? 'translate-x-4' : ''} ${draggedBookIndex === (i * 6 + bIdx) ? 'opacity-50' : ''}`}
                                    style={{ width: activeAssets.bookWidth || '12%' }}
                                  >
                                    <div className="w-[100%] aspect-[2.5/3.5] relative rounded-[3px] drop-shadow-md transition-transform origin-bottom group-hover:scale-105 overflow-hidden">
                                      <LazyPreview
                                        v_id={book.v_id}
                                        emailId={book.rawBook?.userEmail || currentUserEmail}
                                        backendUrl={backendUrl}
                                        iframeBaseUrl={basePath}
                                        title={book.title}
                                        imageUrl={null}
                                      />
                                    </div>

                                {/* Hover Menu Pill */}
                                <div className="absolute top-[2%] right-[0vw] w-[1vw] h-[3vw] bg-[#E8E6E1] rounded-full flex flex-col items-center justify-between py-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-30 pointer-events-none group-hover:pointer-events-auto">
                                  <button
                                    onClick={() => setOpenMenuId(openMenuId === `${i}-${bIdx}` ? null : `${i}-${bIdx}`)}
                                    className="text-black hover:bg-gray-300 rounded-full w-4 h-4 flex items-center justify-center mt-0.5 transition-colors"
                                  >
                                    <Icon icon="mdi:dots-vertical" className="text-[14px]" />
                                  </button>
                                  <div
                                    className="text-[#4A4A4A] hover:text-black flex items-center justify-center mb-0.5 transition-colors relative cursor-pointer"
                                    onMouseEnter={() => setHoveredInfoId(`${i}-${bIdx}`)}
                                    onMouseLeave={() => setHoveredInfoId(null)}
                                  >
                                    <Icon icon="si:info-fill" className="w-4 h-4" />

                                    {/* Info Tooltip Bridge & Container */}
                                    <div className={`absolute top-1/2 right-full pr-3 -translate-y-1/2 ${hoveredInfoId === `${i}-${bIdx}` ? 'block' : 'hidden'} z-[60]`}>
                                      <div className="w-[170px] bg-white rounded-xl p-4 text-gray-800 shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex flex-col gap-3 cursor-default text-left border border-gray-100 relative">
                                        {/* Author Info */}
                                        <div className="flex items-center gap-2">
                                          {book.authorPicture && book.authorPicture !== 'color_only' ? (
                                            <img
                                              src={book.authorPicture}
                                              alt={book.authorName}
                                              className="w-8 h-8 rounded-full border border-gray-200 object-cover shrink-0"
                                            />
                                          ) : (
                                            <div
                                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0 shadow-inner"
                                              style={{ backgroundColor: book.authorBgColor }}
                                            >
                                              {(book.authorName || 'U').charAt(0).toUpperCase()}
                                            </div>
                                          )}
                                          <div className="flex flex-col min-w-0 pr-1">
                                            <span className="text-[13px] font-semibold text-gray-900 leading-tight truncate">{book.authorName}</span>
                                            <span className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5 truncate">
                                              <Icon icon="lucide:map-pin" className="w-3 h-3 text-gray-400 shrink-0" />
                                              <span className="truncate">{String(book.location).replace(/📍/g, '').trim()}</span>
                                            </span>
                                          </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex items-center gap-2 justify-start text-[11px] text-gray-700 font-medium whitespace-nowrap">
                                          <div className="flex items-center gap-1">
                                            <span className="text-black font-semibold">{book.pages || 0}</span>
                                            <span className="font-normal text-gray-500">Pages</span>
                                          </div>
                                          <span className="text-gray-300">|</span>
                                          <span className="flex items-center gap-1">
                                            <Icon icon="lucide:eye" className="w-3.5 h-3.5 text-gray-400" />
                                            {book.views || '1.2k'}
                                          </span>
                                          <span className="text-gray-300">|</span>
                                          <span className="flex items-center gap-1">
                                            <Icon icon="material-symbols:star" className="w-3.5 h-3.5 text-yellow-400" />
                                            {book.rating || 4.5}
                                          </span>
                                        </div>

                                        {/* Title & Desc & Button */}
                                        <div className="relative">
                                          <h4 className="text-[14px] font-semibold text-black truncate tracking-tight mb-1">{book.title}</h4>
                                          <p className="text-[11px] text-gray-500 leading-relaxed pr-10 line-clamp-2">{book.description}</p>

                                          {/* Action Button */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const targetShareId = book.shareId || book.v_id;
                                              const rawAcc = String(book.access || 'public').toLowerCase();
                                              if (targetShareId) {
                                                window.open(`/share=${rawAcc}/${targetShareId}`, '_blank');
                                              }
                                            }}
                                            className="absolute bottom-0 right-0 bg-black text-white w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors shadow-md cursor-pointer"
                                          >
                                            <Icon icon="mdi:arrow-top-right" className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                                  
                                {openMenuId === `${i}-${bIdx}` && (
                                  <div className="absolute top-[2%] -right-[0.5vw] bg-white rounded-[0.5vw] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 py-[0.2vw] w-[7vw] z-50 overflow-hidden">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const targetShareId = book.shareId || book.v_id;
                                        const rawAcc = String(book.access || 'public').toLowerCase();
                                        if (targetShareId) {
                                          window.open(`/share=${rawAcc}/${targetShareId}`, '_blank');
                                        }
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full text-left px-[1vw] py-[0.3vw] text-[0.75vw] font-medium text-gray-600 hover:text-black hover:bg-gray-50 transition-colors"
                                    >
                                      Open Book
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setBookToMoveIndex(activeFolderGlobal.books.findIndex(b => b.v_id === book.v_id));
                                        setTargetMoveFolder(selectedFolder);
                                        setShowMoveModal(true);
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full text-left px-[1vw] py-[0.3vw] text-[0.75vw] font-medium text-gray-600 hover:text-black hover:bg-gray-50 transition-colors"
                                    >
                                      Move Folder
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveBook(book.v_id);
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full text-left px-[1vw] py-[0.3vw] text-[0.75vw] font-medium text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                      Remove Book
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
              </div>
            </div>
          </div>
        ) : (
          /* List View Grid */
          <div className="flex-1 overflow-y-auto pr-2 pb-4">
            {openMenuId && (
              <div
                className="fixed inset-0 z-20"
                onClick={() => setOpenMenuId(null)}
              />
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {isLoading ? (
                <div className="col-span-full py-20 flex justify-center items-center">
                  <div className="flex flex-col items-center gap-3 bg-white px-6 py-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100">
                    <Icon icon="eos-icons:loading" className="w-8 h-8 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-700">Loading Flipbooks...</span>
                  </div>
                </div>
              ) : filteredBooks.length === 0 ? (
                <div className="col-span-full py-10 flex justify-center text-gray-500">No flipbooks found.</div>
              ) : (
                filteredBooks.map((book, idx) => (
                  <div key={book.v_id || idx} className="bg-white rounded-2xl overflow-hidden flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-shadow border border-transparent hover:border-gray-100">
                    {/* Image Area Wrapper */}
                    <div className="relative w-full aspect-square bg-[#e2b58d] overflow-hidden">
                      <img src={book.cover || listFrame} alt={book.title || "Flipbook"} className="w-full h-full object-cover" />

                      <button
                        onClick={() => setOpenMenuId(openMenuId === book.v_id ? null : book.v_id)}
                        className="absolute top-3 right-3 text-white hover:text-gray-200 bg-black/20 rounded-md p-0.5 transition-colors z-30"
                      >
                        <Icon icon="mdi:dots-vertical" className="w-5 h-5" />
                      </button>

                      {openMenuId === book.v_id && (
                        <div className="absolute top-[2.5vw] right-[0.8vw] bg-white rounded-[0.5vw] shadow-xl border border-gray-100 py-[0.5vw] w-[9vw] z-40 overflow-hidden">
                          <button
                            onClick={() => {
                              const targetShareId = book.shareId || book.v_id;
                              const rawAcc = String(book.access || 'public').toLowerCase();
                              if (targetShareId) {
                                window.open(`/share=${rawAcc}/${targetShareId}`, '_blank');
                              }
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-[1vw] py-[0.5vw] text-[0.75vw] font-medium text-gray-600 hover:text-black hover:bg-gray-50 flex items-center gap-[0.5vw] transition-colors"
                          >
                            <Icon icon="mdi:book-open-outline" className="w-[1vw] h-[1vw] text-gray-400" />
                            Open Book
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setBookToMoveIndex(activeFolderGlobal.books.findIndex(b => b.v_id === book.v_id));
                              setTargetMoveFolder(selectedFolder);
                              setShowMoveModal(true);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-[1vw] py-[0.5vw] text-[0.75vw] font-medium text-gray-600 hover:text-black hover:bg-gray-50 flex items-center gap-[0.5vw] transition-colors"
                          >
                            <Icon icon="mdi:folder-move-outline" className="w-[1vw] h-[1vw] text-gray-400" />
                            Move Folder
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveBook(book.v_id);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-[1vw] py-[0.5vw] text-[0.75vw] font-medium text-red-500 hover:text-red-600 hover:bg-red-50 flex items-center gap-[0.5vw] transition-colors"
                          >
                            <Icon icon="mdi:trash-can-outline" className="w-[1vw] h-[1vw] text-red-400" />
                            Remove Book
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Card Details */}
                    <div className="p-4 flex flex-col flex-1 bg-white">
                      {/* Author Info */}
                      <div className="flex items-center gap-3">
                        {book.authorPicture && book.authorPicture !== 'color_only' ? (
                          <img
                            src={book.authorPicture}
                            alt={book.authorName}
                            className="w-9 h-9 rounded-full border border-gray-200 object-cover shrink-0"
                          />
                        ) : (
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-inner"
                            style={{ backgroundColor: book.authorBgColor }}
                          >
                            {(book.authorName || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col min-w-0 pr-1">
                          <span className="text-sm font-semibold text-gray-900 leading-tight truncate">{book.authorName}</span>
                          <span className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5 truncate">
                            <Icon icon="lucide:map-pin" className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="truncate">{String(book.location).replace(/📍/g, '').trim()}</span>
                          </span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-2 justify-start text-xs text-gray-700 font-medium mt-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span className="text-black font-semibold">{book.pages || 0}</span>
                          <span className="font-normal text-gray-500">Pages</span>
                        </div>
                        <span className="text-gray-300">|</span>
                        <span className="flex items-center gap-1">
                          <Icon icon="lucide:eye" className="w-3.5 h-3.5 text-gray-400" />
                          {book.views || '1.2k'}
                        </span>
                        <span className="text-gray-300">|</span>
                        <span className="flex items-center gap-1">
                          <Icon icon="material-symbols:star" className="w-4 h-4 text-yellow-400" />
                          {book.rating || 4.5}
                        </span>
                      </div>

                      {/* Title & Desc & Button */}
                      <div className="relative flex-1 mt-3">
                        <h4 className="text-[15px] font-semibold text-black truncate tracking-tight mb-1">{book.title}</h4>
                        <p className="text-[12px] text-gray-500 leading-relaxed pr-10 line-clamp-2">{book.description}</p>

                        {/* Action Button */}
                        <button
                          onClick={() => {
                            const targetShareId = book.shareId || book.v_id;
                            const rawAcc = String(book.access || 'public').toLowerCase();
                            if (targetShareId) {
                              window.open(`/share=${rawAcc}/${targetShareId}`, '_blank');
                            }
                          }}
                          className="absolute bottom-0 right-0 bg-black text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors shadow-md cursor-pointer"
                        >
                          <Icon icon="mdi:arrow-top-right" className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )))}
            </div>
          </div>
        )}

        {/* Sidebar */}
        <div className="w-64 flex flex-col justify-end gap-6 h-full pb-4">

          {/* Shelf Usage */}
          <div className="bg-white border border-gray-200 rounded-[14px] p-5">
            <h3 className="font-medium text-[#475569] mb-4 text-[15px]">Shelf Usage</h3>
            <div className="h-1.5 w-full bg-[#E2E8F0] rounded-full mb-4">
              <div className="h-1.5 bg-[#4F46E5] rounded-full" style={{ width: `${Math.min(100, (booksData.length / 50) * 100)}%` }}></div>
            </div>
            <div className="flex justify-between text-[13.5px] text-[#475569]">
              <span>{booksData.length} of 50 Flipbooks Used</span>
              <span>{Math.round(Math.min(100, (booksData.length / 50) * 100))}%</span>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-[#fef9f4] border border-[#faedd9] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">💡</span>
              <h3 className="font-semibold text-sm">Tips</h3>
            </div>
            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              Drag and Drop flipbooks to rearrange them on your shelf
            </p>
            <div className="flex justify-center items-end gap-3 relative px-2 mt-2">
              <Icon icon="duo-icons:book" className="w-10 h-10 text-gray-600" />
              <Icon icon="duo-icons:book" className="w-10 h-10 text-gray-600" />

              <div className="relative z-10 -translate-y-2">
                <Icon icon="duo-icons:book" className="w-14 h-14 text-yellow-500 drop-shadow-md" />
                <Icon icon="game-icons:click" className="absolute -bottom-3 -right-3 w-8 h-8 text-black" />
              </div>

              <Icon icon="duo-icons:book" className="w-10 h-10 text-gray-600" />
            </div>
          </div>

        </div>
      </div>

      {/* Change Shelf Modal */}
      {showShelfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowShelfModal(false)}>
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-[700px] max-w-[90vw] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Change Shelf</h2>
                <p className="text-sm text-gray-500 mt-1">Choose a shelf style for your My Shelf</p>
              </div>
              <button
                onClick={() => setShowShelfModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 rounded-full p-2"
              >
                <Icon icon="mdi:close" className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col md:flex-row justify-center items-center gap-6 bg-gray-50/50">
              {shelfOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => setDraftShelfStyle(option.id)}
                  className={`w-full md:w-[220px] cursor-pointer rounded-xl border-2 overflow-hidden transition-all duration-200 group relative bg-white shadow-sm ${draftShelfStyle === option.id
                    ? 'border-blue-500 ring-2 ring-blue-100'
                    : 'border-transparent hover:border-gray-200 hover:shadow-md'
                    }`}
                >
                  <div className="bg-[#f0ece6] aspect-[4/3] flex items-center justify-center p-4 relative">
                    <img src={option.img} alt={option.name} className="w-full h-auto object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-105" />
                    {draftShelfStyle === option.id && (
                      <div className="absolute inset-0 bg-blue-500/10"></div>
                    )}
                  </div>
                  <div className={`p-3 text-center border-t transition-colors ${draftShelfStyle === option.id ? 'bg-blue-50/50 border-blue-100' : 'bg-white border-gray-100'}`}>
                    <p className={`text-sm font-semibold ${draftShelfStyle === option.id ? 'text-blue-700' : 'text-gray-700'}`}>
                      {option.name}
                    </p>
                  </div>
                  {draftShelfStyle === option.id && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1 shadow-sm">
                      <Icon icon="mdi:check-bold" className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-white">
              <button
                onClick={() => setShowShelfModal(false)}
                className="px-5 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={applyShelfStyle}
                className="px-5 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow transition-all"
              >
                Apply Shelf
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Shelf/Folder Modal */}
      {showAddShelfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowAddShelfModal(false)}>
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-[400px] max-w-[90vw] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Create New Shelf</h2>
              <button onClick={() => setShowAddShelfModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 rounded-full p-2">
                <Icon icon="mdi:close" className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Shelf Name</label>
              <input
                type="text"
                value={newShelfName}
                onChange={(e) => setNewShelfName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter shelf name"
                autoFocus
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-white">
              <button onClick={() => setShowAddShelfModal(false)} className="px-5 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-800 transition-colors">Cancel</button>
              <button
                onClick={() => {
                  if (newShelfName.trim()) {
                    setFolders(prev => [{ name: newShelfName.trim(), books: [] }, ...prev]);
                    setSelectedFolder(newShelfName.trim());
                    setNewShelfName('');
                    setShowAddShelfModal(false);
                  }
                }}
                className="px-5 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Folder Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={() => setShowMoveModal(false)}>
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-[400px] max-w-[90vw] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Move to Folder</h2>
              <button onClick={() => setShowMoveModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 rounded-full p-2">
                <Icon icon="mdi:close" className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Destination Folder</label>
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'move_folder' ? null : 'move_folder')}
                  className="flex items-center justify-between w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none"
                >
                  <span className="text-[#5B738B]">{targetMoveFolder === '__add_shelf__' ? '+ Add Shelf' : targetMoveFolder}</span>
                  <Icon icon={openDropdown === 'move_folder' ? "mdi:chevron-up" : "mdi:chevron-down"} className="w-4 h-4 text-[#8BA3BA]" />
                </button>

                {openDropdown === 'move_folder' && (
                  <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-100 rounded-lg shadow-[0_4px_20px_rgb(0,0,0,0.08)] py-1 overflow-hidden">
                    {folders.map(folder => (
                      <div
                        key={folder.name}
                        className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors ${targetMoveFolder === folder.name ? 'bg-gray-50 text-[#334155]' : 'text-[#475569]'}`}
                        onClick={() => {
                          setTargetMoveFolder(folder.name);
                          setOpenDropdown(null);
                        }}
                      >
                        {folder.name}
                      </div>
                    ))}
                    <div
                      className={`px-4 py-2 text-sm cursor-pointer border-t border-gray-100 hover:bg-gray-50 transition-colors ${targetMoveFolder === '__add_shelf__' ? 'bg-gray-50 text-[#334155]' : 'text-[#475569]'}`}
                      onClick={() => {
                        setTargetMoveFolder('__add_shelf__');
                        setOpenDropdown(null);
                      }}
                    >
                      + Add Shelf
                    </div>
                  </div>
                )}
              </div>

              {targetMoveFolder === '__add_shelf__' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Folder Name</label>
                  <input
                    type="text"
                    value={newShelfName}
                    onChange={(e) => setNewShelfName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Enter new folder name"
                    autoFocus
                  />
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-white">
              <button onClick={() => setShowMoveModal(false)} className="px-5 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-800 transition-colors">Cancel</button>
              <button
                onClick={handleMoveSubmit}
                className="px-5 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors"
              >
                {targetMoveFolder === '__add_shelf__' ? 'Create & Move' : 'Move'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LazyPreview = ({ v_id, emailId, backendUrl, iframeBaseUrl, title, imageUrl }) => {
  const containerRef = useRef(null);
  const [html, setHtml] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!v_id || loaded) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loaded && !fetching) {
          observer.disconnect();
          setFetching(true);
          axios
            .get(`${backendUrl}/api/flipbook/preview/${v_id}`, { params: { emailId } })
            .then((res) => {
              if (res.data?.html) {
                const fontsToLoad = new Set();
                const cssRegex = /font-family\s*:\s*(?:['"]([^'"]+)['"]|([^;}'"\s]+))/g;
                const attrRegex = /font-family\s*=\s*['"]([^'"]+)['"]/g;
                let match;
                while ((match = cssRegex.exec(res.data.html)) !== null) {
                  let f = match[1] || match[2];
                  if (f) f = f.split(',')[0].replace(/['"]/g, '').trim();
                  if (f && !['sans-serif', 'serif', 'monospace', 'inherit'].includes(f.toLowerCase())) fontsToLoad.add(f);
                }
                while ((match = attrRegex.exec(res.data.html)) !== null) {
                  let f = match[1].split(',')[0].replace(/['"]/g, '').trim();
                  if (f && !['sans-serif', 'serif', 'monospace', 'inherit'].includes(f.toLowerCase())) fontsToLoad.add(f);
                }

                let fontImports = '';
                if (fontsToLoad.size > 0) {
                  const fontList = Array.from(fontsToLoad).map(f => f.replace(/\s+/g, '+')).join('|');
                  fontImports = `<link href="https://fonts.googleapis.com/css?family=${fontList}:300,400,500,600,700,800,900&display=swap" rel="stylesheet">`;
                }

                setHtml({ content: res.data.html, fontImports });
              }
            })
            .catch(() => { })
            .finally(() => { setFetching(false); setLoaded(true); });
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [v_id, loaded, fetching, backendUrl, emailId]);

  const isLoading = !loaded || fetching;

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center relative bg-white overflow-hidden rounded-[3px]">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-[0.4vw] bg-[#E8E6E1] overflow-hidden border border-[#d5d2c9]">
          <Icon icon="eos-icons:loading" className="w-[1.5vw] h-[1.5vw] text-gray-400" />
        </div>
      )}

      {html ? (
        <iframe
          title={`Preview of ${title}`}
          className="w-full h-full border-none pointer-events-none object-fill"
          srcDoc={`<!DOCTYPE html><html><head>${html.fontImports}<base href="${iframeBaseUrl}"><style>html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;display:flex;align-items:center;justify-content:center;background:white;}svg{width:100%;height:100%;max-width:100%;max-height:100%;}[data-name="Free Frame"]{stroke:transparent !important;fill:transparent !important;}</style></head><body>${html.content.replace(/<svg/, '<svg preserveAspectRatio="none"')}</body></html>`}
        />
      ) : loaded && imageUrl ? (
        <img src={resolveUploadsPath(imageUrl)} alt={title} className="w-full h-full object-fill bg-white" />
      ) : loaded && !html ? (
        <div className="flex flex-col items-center justify-center text-gray-400 w-full h-full bg-white border border-[#d5d2c9]">
          <Icon icon="mdi:book-open-blank-variant" className="w-[2vw] h-[2vw] text-gray-400 mb-1" />
          <span className="text-[0.7vw] font-medium leading-tight text-gray-500">No Preview</span>
        </div>
      ) : null}
    </div>
  );
};

export default MyShelf;