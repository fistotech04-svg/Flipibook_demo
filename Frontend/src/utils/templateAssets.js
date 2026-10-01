// Frontend/src/utils/templateAssets.js

export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000')
  .trim()
  .replace(/\/+$/, '');

/**
 * Returns the full backend URL for a template in Backend/assets/Templates/
 * @param {string} fileName e.g. "Template_1.svg" or "Template_Car_1.svg"
 */
export const getTemplateUrl = (fileName) => {
  if (!fileName) return '';
  if (fileName.startsWith('http://') || fileName.startsWith('https://') || fileName.startsWith('blob:') || fileName.startsWith('data:')) {
    return fileName;
  }
  const cleanName = fileName.replace(/^\/?(assets\/Templates\/)?/, '');
  return `${BACKEND_URL}/assets/Templates/${cleanName}`;
};

/**
 * Returns the backend URL for a specific page of a book template
 * @param {string} folderName e.g. "Interior_Book" or "Mobile_Book"
 * @param {number|string} pageNum e.g. 1 or "Page_1.svg"
 */
export const getBookPageUrl = (folderName, pageNum) => {
  if (!folderName) return '';
  const pageFile = typeof pageNum === 'number' || !isNaN(Number(pageNum))
    ? `Page_${pageNum}.svg`
    : String(pageNum).endsWith('.svg') ? pageNum : `${pageNum}.svg`;
  return `${BACKEND_URL}/assets/Templates/${encodeURIComponent(folderName)}/${encodeURIComponent(pageFile)}`;
};

/**
 * Returns the full backend URL for a popup template in Backend/assets/Pop-Up Templates/
 * @param {string|number} fileNameOrNum e.g. "PopupTemplete1.svg" or 1
 */
export const getPopupTemplateUrl = (fileNameOrNum) => {
  if (!fileNameOrNum) return '';
  if (typeof fileNameOrNum === 'string' && (fileNameOrNum.startsWith('http://') || fileNameOrNum.startsWith('https://') || fileNameOrNum.startsWith('blob:') || fileNameOrNum.startsWith('data:'))) {
    return fileNameOrNum;
  }
  let cleanName = String(fileNameOrNum).replace(/^\/?(assets\/Pop-Up%20Templates\/|assets\/Pop-Up Templates\/)?/, '');
  if (!cleanName.endsWith('.svg') && !isNaN(Number(cleanName))) {
    cleanName = `PopupTemplete${cleanName}.svg`;
  }
  return `${BACKEND_URL}/assets/Pop-Up%20Templates/${encodeURIComponent(cleanName)}`;
};

/**
 * Fetch raw SVG text of a template from the backend
 * @param {string} fileNameOrUrl 
 */
export const fetchTemplateSvg = async (fileNameOrUrl) => {
  try {
    const url = getTemplateUrl(fileNameOrUrl);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load template`);
    return await res.text();
  } catch (err) {
    console.error(`[templateAssets] Error fetching template SVG:`, err);
    return null;
  }
};

/**
 * Fetch raw SVG text of a popup template from the backend
 * @param {string|number} fileNameOrNum 
 */
export const fetchPopupTemplateSvg = async (fileNameOrNum) => {
  try {
    const url = getPopupTemplateUrl(fileNameOrNum);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load popup template`);
    return await res.text();
  } catch (err) {
    console.error(`[templateAssets] Error fetching popup template SVG:`, err);
    return null;
  }
};
