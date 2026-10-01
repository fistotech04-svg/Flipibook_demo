// usePages.js
import { useState, useCallback } from 'react';

const usePages = () => {
  const [pages, setPages] = useState([{ 
    id: 1, 
    name: 'Page 1', 
    canvasJSON: null, 
    thumbnail: null,
    svgData: null 
  }]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageName, setPageName] = useState("Untitled Document");
  const [isEditingPageName, setIsEditingPageName] = useState(false);

  const switchToPage = useCallback((pageIndex) => {
    if (pageIndex === currentPage || pageIndex < 0 || pageIndex >= pages.length) return;
    setCurrentPage(pageIndex);
  }, [currentPage, pages.length]);

  const addNewPage = useCallback(() => {
    const newPage = {
      id: Date.now(),
      name: `Page ${pages.length + 1}`,
      canvasJSON: null,
      thumbnail: null,
      svgData: null
    };

    setPages(prev => [...prev, newPage]);
    setCurrentPage(pages.length);
  }, [pages.length]);

  const deletePage = useCallback((pageIndex) => {
    if (pages.length <= 1) {
      alert('Cannot delete the last page');
      return;
    }

    const newPages = pages.filter((_, idx) => idx !== pageIndex);
    setPages(newPages);

    if (pageIndex === currentPage) {
      const newCurrentPage = Math.max(0, pageIndex - 1);
      setCurrentPage(newCurrentPage);
    } else if (pageIndex < currentPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [pages, currentPage]);

  const duplicatePage = useCallback(() => {
    const duplicatedPage = {
      id: Date.now(),
      name: `${pages[currentPage]?.name || 'Page'} (Copy)`,
      canvasJSON: pages[currentPage]?.canvasJSON,
      thumbnail: pages[currentPage]?.thumbnail,
      svgData: null
    };

    setPages(prev => [...prev, duplicatedPage]);
  }, [pages, currentPage]);

  const renamePage = useCallback((pageIndex, newName) => {
    setPages(prev => {
      const updated = [...prev];
      if (updated[pageIndex]) {
        updated[pageIndex] = {
          ...updated[pageIndex],
          name: newName
        };
      }
      return updated;
    });
  }, []);

  const updatePageThumbnail = useCallback((pageIndex) => {
    // Implementation for thumbnail update
    console.log('Update thumbnail for page', pageIndex);
  }, []);

  const saveCurrentPage = useCallback(() => {
    // Implementation for saving current page
    console.log('Save current page');
    return null;
  }, []);

  return {
    pages,
    currentPage,
    pageName,
    isEditingPageName,
    switchToPage,
    addNewPage,
    deletePage,
    duplicatePage,
    renamePage,
    setPageName,
    setIsEditingPageName,
    updatePageThumbnail,
    saveCurrentPage
  };
};

export default usePages;