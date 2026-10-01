// useCanvas.js - Complete canvas hook
import { useState, useRef, useCallback, useEffect } from 'react';
import { fabric } from 'fabric';

// Canvas constants
const CANVAS_WIDTH = 595;
const CANVAS_HEIGHT = 842;
const DEFAULT_GRID_SIZE = 20;
const SNAP_THRESHOLD = 10;

const useCanvas = () => {
  // Refs
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const wrapperRef = useRef(null);
  const guidelinesRef = useRef([]);
  const saveTimeoutRef = useRef(null);

  // State
  const [activeObject, setActiveObject] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE);
  const [snapToObjects, setSnapToObjects] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Initialize canvas
  const initializeCanvas = useCallback(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      selection: true,
      renderOnAddRemove: true,
      centeredScaling: false,
      centeredRotation: true,
      enableRetinaScaling: true,
      imageSmoothingEnabled: true,
      stopContextMenu: true,
      fireRightClick: true,
    });

    // Custom controls
    fabric.Object.prototype.set({
      transparentCorners: false,
      cornerColor: '#ffffff',
      cornerStrokeColor: '#6366f1',
      borderColor: '#6366f1',
      cornerSize: 10,
      padding: 6,
      cornerStyle: 'circle',
      borderDashArray: [4, 4],
      rotatingPointOffset: 25,
      borderScaleFactor: 1.5,
    });

    fabricCanvasRef.current = canvas;
    drawGrid();
  }, []);

  // Draw grid
  const drawGrid = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const existingGrid = canvas.getObjects().filter(obj => obj.isGrid);
    existingGrid.forEach(obj => canvas.remove(obj));

    if (!showGrid) {
      canvas.renderAll();
      return;
    }

    const gridColor = '#e5e7eb';
    const majorGridColor = '#cbd5e1';
    const majorGridInterval = gridSize * 5;

    // Draw vertical lines
    for (let i = gridSize; i < CANVAS_WIDTH; i += gridSize) {
      const isMajor = i % majorGridInterval === 0;
      const line = new fabric.Line([i, 0, i, CANVAS_HEIGHT], {
        stroke: isMajor ? majorGridColor : gridColor,
        strokeWidth: isMajor ? 0.8 : 0.5,
        selectable: false,
        evented: false,
        isGrid: true,
        excludeFromExport: true,
        hoverCursor: 'default',
      });
      canvas.add(line);
      canvas.sendToBack(line);
    }

    // Draw horizontal lines
    for (let i = gridSize; i < CANVAS_HEIGHT; i += gridSize) {
      const isMajor = i % majorGridInterval === 0;
      const line = new fabric.Line([0, i, CANVAS_WIDTH, i], {
        stroke: isMajor ? majorGridColor : gridColor,
        strokeWidth: isMajor ? 0.8 : 0.5,
        selectable: false,
        evented: false,
        isGrid: true,
        excludeFromExport: true,
        hoverCursor: 'default',
      });
      canvas.add(line);
      canvas.sendToBack(line);
    }

    canvas.renderAll();
  }, [showGrid, gridSize]);

  // Clear guidelines
  const clearGuidelines = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    guidelinesRef.current.forEach(line => {
      canvas.remove(line);
    });
    guidelinesRef.current = [];
  }, []);

  // Create guideline
  const createGuideline = useCallback((points, orientation) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return null;

    const line = new fabric.Line(points, {
      stroke: '#6366f1',
      strokeWidth: 1,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
      excludeFromExport: true,
      isGuideline: true,
    });

    guidelinesRef.current.push(line);
    canvas.add(line);
    canvas.bringToFront(line);
    
    return line;
  }, []);

  // Snap to grid value
  const snapToGridValue = useCallback((value) => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  }, [snapToGrid, gridSize]);

  // Handle object moving
  const handleObjectMoving = useCallback((e) => {
    const obj = e.target;
    if (!obj || obj.isGrid) return;

    clearGuidelines();

    const objBound = obj.getBoundingRect(true);
    const objCenter = {
      x: objBound.left + objBound.width / 2,
      y: objBound.top + objBound.height / 2
    };

    // Canvas center
    const canvasCenterX = CANVAS_WIDTH / 2;
    const canvasCenterY = CANVAS_HEIGHT / 2;

    let snappedX = false;
    let snappedY = false;

    // Snap to canvas center X
    if (Math.abs(objCenter.x - canvasCenterX) < SNAP_THRESHOLD) {
      obj.set('left', canvasCenterX - (objBound.width / 2) + (obj.left - objBound.left));
      createGuideline([canvasCenterX, 0, canvasCenterX, CANVAS_HEIGHT], 'vertical');
      snappedX = true;
    }

    // Snap to canvas center Y
    if (Math.abs(objCenter.y - canvasCenterY) < SNAP_THRESHOLD) {
      obj.set('top', canvasCenterY - (objBound.height / 2) + (obj.top - objBound.top));
      createGuideline([0, canvasCenterY, CANVAS_WIDTH, canvasCenterY], 'horizontal');
      snappedY = true;
    }

    // Grid snapping
    if (snapToGrid) {
      obj.set({
        left: snapToGridValue(obj.left),
        top: snapToGridValue(obj.top),
      });
    }

    obj.setCoords();
  }, [clearGuidelines, createGuideline, snapToGrid, snapToGridValue]);

  // Handle object modified
  const handleObjectModified = useCallback((e) => {
    const obj = e.target;
    if (obj && !obj.isGrid) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        // Save to history would go here
      }, 100);
    }
  }, []);

  // Handle selection
  const handleSelection = useCallback((e) => {
    const obj = e.selected?.[0];
    if (obj && !obj.isGrid && !obj.excludeFromExport) {
      setActiveObject(obj);
    }
  }, []);

  // Handle selection cleared
  const handleSelectionCleared = useCallback(() => {
    setActiveObject(null);
    clearGuidelines();
  }, [clearGuidelines]);

  // Zoom handler
  const handleZoom = useCallback((newZoom, centerPoint = null) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const zoomValue = Math.max(25, Math.min(200, newZoom));
    const scale = zoomValue / 100;
    
    if (centerPoint) {
      canvas.zoomToPoint(centerPoint, scale);
    } else {
      canvas.setZoom(scale);
    }
    
    canvas.setWidth(CANVAS_WIDTH * scale);
    canvas.setHeight(CANVAS_HEIGHT * scale);
    canvas.renderAll();
    
    setZoom(zoomValue);
  }, []);

  // Fit to screen
  const fitToScreen = useCallback(() => {
    const newZoom = 100; // Calculate based on container
    setZoom(newZoom);
    handleZoom(newZoom);
  }, [handleZoom]);

  // Handle canvas rotation
  const handleCanvasRotation = useCallback((newRotation) => {
    setRotation(((newRotation % 360) + 360) % 360);
  }, []);

  // Object creation
  const addText = useCallback((textContent = 'Double click to edit') => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const text = new fabric.IText(textContent, {
      left: CANVAS_WIDTH / 2,
      top: CANVAS_HEIGHT / 2,
      fontFamily: 'Arial',
      fontSize: 32,
      fontWeight: 400,
      fill: '#000000',
      originX: 'center',
      originY: 'center',
      selectable: true,
      evented: true,
      id: `text_${Date.now()}`,
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    setActiveObject(text);
  }, []);

  const addShape = useCallback((shapeType) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const commonProps = {
      left: CANVAS_WIDTH / 2,
      top: CANVAS_HEIGHT / 2,
      fill: '#6366f1',
      stroke: '#4f46e5',
      strokeWidth: 2,
      originX: 'center',
      originY: 'center',
      selectable: true,
      evented: true,
      id: `shape_${Date.now()}`,
    };

    let shape;

    switch (shapeType) {
      case 'rect':
        shape = new fabric.Rect({
          ...commonProps,
          width: 150,
          height: 100,
          rx: 8,
          ry: 8,
        });
        break;

      case 'circle':
        shape = new fabric.Circle({
          ...commonProps,
          radius: 60,
        });
        break;

      case 'triangle':
        shape = new fabric.Triangle({
          ...commonProps,
          width: 120,
          height: 100,
        });
        break;

      case 'line':
        shape = new fabric.Line([0, 0, 200, 0], {
          ...commonProps,
          fill: null,
          stroke: '#6366f1',
          strokeWidth: 3,
          originX: 'left',
          originY: 'center',
        });
        break;

      default:
        return;
    }

    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
    setActiveObject(shape);
  }, []);

  const addImage = useCallback((e) => {
    const file = e.target?.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setLoadingMessage('Loading image...');

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgData = event.target?.result;
      
      fabric.Image.fromURL(imgData, (img) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || !img) {
          setIsLoading(false);
          return;
        }

        const maxWidth = CANVAS_WIDTH * 0.7;
        const maxHeight = CANVAS_HEIGHT * 0.7;
        const scale = Math.min(
          maxWidth / (img.width || 1),
          maxHeight / (img.height || 1),
          1
        );

        img.set({
          left: CANVAS_WIDTH / 2,
          top: CANVAS_HEIGHT / 2,
          scaleX: scale,
          scaleY: scale,
          originX: 'center',
          originY: 'center',
          selectable: true,
          evented: true,
          id: `image_${Date.now()}`,
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        setActiveObject(img);
        setIsLoading(false);
        setLoadingMessage('');
      }, { crossOrigin: 'anonymous' });
    };

    reader.onerror = () => {
      setIsLoading(false);
      alert('Failed to load image');
    };

    reader.readAsDataURL(file);
    
    if (e.target) {
      e.target.value = '';
    }
  }, []);

  // Object manipulation
  const deleteSelected = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj) return;

    if (obj.type === 'activeSelection') {
      obj.forEachObject((o) => {
        if (!o.isGrid && !o.excludeFromExport) {
          canvas.remove(o);
        }
      });
    } else if (!obj.isGrid && !obj.excludeFromExport) {
      canvas.remove(obj);
    }

    canvas.discardActiveObject();
    canvas.renderAll();
    setActiveObject(null);
  }, []);

  const duplicateSelected = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj || obj.isGrid) return;

    obj.clone((cloned) => {
      cloned.set({
        left: (obj.left || 0) + 20,
        top: (obj.top || 0) + 20,
        id: `${obj.id || 'obj'}_copy_${Date.now()}`,
        evented: true,
        selectable: true,
      });

      if (cloned.type === 'activeSelection') {
        cloned.canvas = canvas;
        cloned.forEachObject((o) => {
          canvas.add(o);
        });
        cloned.setCoords();
      } else {
        canvas.add(cloned);
      }

      canvas.setActiveObject(cloned);
      canvas.renderAll();
      setActiveObject(cloned);
    });
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.getObjects().forEach(obj => {
      if (!obj.isGrid) {
        canvas.remove(obj);
      }
    });

    canvas.setBackgroundColor('#ffffff', () => {
      canvas.renderAll();
    });

    setActiveObject(null);
  }, []);

  // Alignment
  const alignObject = useCallback((alignment) => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj || obj.isGrid) return;

    const bound = obj.getBoundingRect(true);

    switch (alignment) {
      case 'left':
        obj.set('left', obj.left - bound.left);
        break;
      case 'center':
        obj.set('left', CANVAS_WIDTH / 2 - (bound.width / 2) + (obj.left - bound.left));
        break;
      case 'right':
        obj.set('left', CANVAS_WIDTH - bound.width + (obj.left - bound.left));
        break;
      case 'top':
        obj.set('top', obj.top - bound.top);
        break;
      case 'middle':
        obj.set('top', CANVAS_HEIGHT / 2 - (bound.height / 2) + (obj.top - bound.top));
        break;
      case 'bottom':
        obj.set('top', CANVAS_HEIGHT - bound.height + (obj.top - bound.top));
        break;
    }

    obj.setCoords();
    canvas.renderAll();
  }, []);

  const setTextAlign = useCallback((align) => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (obj && (obj.type === 'i-text' || obj.type === 'text')) {
      obj.set('textAlign', align);
      canvas.renderAll();
    }
  }, []);

  // Layer controls
  const bringForward = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj || obj.isGrid) return;
    
    canvas.bringForward(obj);
    canvas.renderAll();
  }, []);

  const sendBackward = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj || obj.isGrid) return;
    
    canvas.sendBackwards(obj);
    const gridObjects = canvas.getObjects().filter(o => o.isGrid);
    gridObjects.forEach(g => canvas.sendToBack(g));
    canvas.renderAll();
  }, []);

  const bringToFront = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj || obj.isGrid) return;
    
    canvas.bringToFront(obj);
    canvas.renderAll();
  }, []);

  const sendToBack = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj || obj.isGrid) return;
    
    canvas.sendToBack(obj);
    const gridObjects = canvas.getObjects().filter(o => o.isGrid);
    gridObjects.forEach(g => canvas.sendToBack(g));
    canvas.renderAll();
  }, []);

  // Selection
  const selectAll = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const objects = canvas.getObjects().filter(obj => 
      !obj.isGrid && !obj.excludeFromExport && !obj.isGuideline
    );

    if (objects.length === 0) return;

    canvas.discardActiveObject();
    
    if (objects.length === 1) {
      canvas.setActiveObject(objects[0]);
    } else {
      const selection = new fabric.ActiveSelection(objects, { canvas });
      canvas.setActiveObject(selection);
    }
    
    canvas.renderAll();
  }, []);

  // Copy/paste
  const clipboardRef = useRef(null);

  const copySelected = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj) return;

    obj.clone((cloned) => {
      clipboardRef.current = cloned;
    });
  }, []);

  const paste = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !clipboardRef.current) return;

    clipboardRef.current.clone((cloned) => {
      canvas.discardActiveObject();
      
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
        evented: true,
        selectable: true,
        id: `paste_${Date.now()}`,
      });

      if (cloned.type === 'activeSelection') {
        cloned.canvas = canvas;
        cloned.forEachObject((obj) => {
          canvas.add(obj);
        });
        cloned.setCoords();
      } else {
        canvas.add(cloned);
      }

      clipboardRef.current.set({
        left: (clipboardRef.current.left || 0) + 20,
        top: (clipboardRef.current.top || 0) + 20,
      });

      canvas.setActiveObject(cloned);
      canvas.renderAll();
    });
  }, []);

  // Export
  const exportCanvas = useCallback((format = 'png') => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const hiddenObjects = canvas.getObjects().filter(obj => obj.isGrid || obj.excludeFromExport || obj.isGuideline);
    hiddenObjects.forEach(obj => obj.set('visible', false));

    const currentZoom = canvas.getZoom();
    canvas.setZoom(1);
    canvas.setWidth(CANVAS_WIDTH);
    canvas.setHeight(CANVAS_HEIGHT);
    canvas.renderAll();

    const dataURL = canvas.toDataURL({
      format: format === 'jpg' ? 'jpeg' : format,
      quality: 1,
      multiplier: 2,
    });

    canvas.setZoom(currentZoom);
    canvas.setWidth(CANVAS_WIDTH * currentZoom);
    canvas.setHeight(CANVAS_HEIGHT * currentZoom);
    hiddenObjects.forEach(obj => obj.set('visible', true));
    canvas.renderAll();

    const link = document.createElement('a');
    link.download = `document_page.${format}`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const exportAllPages = useCallback(async (format = 'png') => {
    // Implementation for multi-page export
    exportCanvas(format);
  }, [exportCanvas]);

  // Preview (simplified)
  const openPreview = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    setIsLoading(true);
    setLoadingMessage('Preparing preview...');

    setTimeout(() => {
      setIsLoading(false);
      setLoadingMessage('');
      
      // Open preview window with HTML content
      const previewHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Preview</title>
          <style>
            body { margin: 0; padding: 20px; background: #f0f0f0; }
            .page { background: white; margin: 0 auto; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
          </style>
        </head>
        <body>
          <div class="page">
            <img src="${canvas.toDataURL()}" style="width:100%;" />
          </div>
        </body>
        </html>
      `;

      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        previewWindow.document.write(previewHTML);
        previewWindow.document.close();
      }
    }, 1000);
  }, []);

  // Load HTML Template
  const loadHTMLTemplate = useCallback(async (templatePath) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    setIsLoading(true);
    setLoadingMessage('Loading HTML template...');

    try {
      // Fetch the HTML template
      const response = await fetch(templatePath);
      const htmlContent = await response.text();

      // Parse HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      // Clear current canvas
      canvas.getObjects().forEach(obj => {
        if (!obj.isGrid) {
          canvas.remove(obj);
        }
      });

      // Get the A4 page container
      const a4Page = doc.querySelector('.a4-page');
      if (!a4Page) {
        throw new Error('No .a4-page container found in template');
      }

      // Render the HTML template as an image on canvas
      const svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml">
              ${a4Page.outerHTML}
            </div>
          </foreignObject>
        </svg>
      `;

      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);

      fabric.Image.fromURL(url, (img) => {
        if (!img) {
          setIsLoading(false);
          setLoadingMessage('');
          return;
        }

        img.set({
          left: 0,
          top: 0,
          selectable: true,
          evented: true,
          scaleX: 1,
          scaleY: 1,
          id: 'html_template_background',
        });

        canvas.add(img);
        canvas.sendToBack(img);
        
        // Add editable text elements from HTML
        const textElements = a4Page.querySelectorAll('h1, h2, h3, h4, p, span');
        textElements.forEach((element, index) => {
          const rect = element.getBoundingClientRect();
          const text = element.textContent.trim();
          
          if (text && text.length > 0) {
            const computedStyle = window.getComputedStyle(element);
            const fontSize = parseInt(computedStyle.fontSize) || 14;
            const fontFamily = computedStyle.fontFamily || 'Arial';
            const color = computedStyle.color || '#000000';
            
            // Convert color to hex if needed
            let fillColor = color;
            if (color.startsWith('rgb')) {
              const rgbMatch = color.match(/\d+/g);
              if (rgbMatch && rgbMatch.length >= 3) {
                fillColor = `#${parseInt(rgbMatch[0]).toString(16).padStart(2, '0')}${parseInt(rgbMatch[1]).toString(16).padStart(2, '0')}${parseInt(rgbMatch[2]).toString(16).padStart(2, '0')}`;
              }
            }

            const fabricText = new fabric.IText(text, {
              left: 50 + (index % 3) * 150,
              top: 150 + Math.floor(index / 3) * 50,
              fontSize: Math.max(fontSize * 0.8, 12),
              fontFamily: fontFamily.split(',')[0].replace(/["']/g, ''),
              fill: fillColor,
              selectable: true,
              evented: true,
              id: `text_${element.tagName}_${index}`,
            });

            canvas.add(fabricText);
          }
        });

        canvas.renderAll();
        // Delay revocation to ensure the browser has fully finished processing the resource
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setIsLoading(false);
        setLoadingMessage('');
      }, { crossOrigin: 'anonymous' });

    } catch (error) {
      console.error('Error loading HTML template:', error);
      alert('Failed to load HTML template: ' + error.message);
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, []);

  // Toggle functions
  const toggleGrid = useCallback(() => setShowGrid(prev => !prev), []);
  const toggleSnapToGrid = useCallback(() => setSnapToGrid(prev => !prev), []);
  const toggleSnapToObjects = useCallback(() => setSnapToObjects(prev => !prev), []);
  const updateGridSize = useCallback((size) => setGridSize(size), []);

  return {
    canvasRef,
    fabricCanvasRef,
    canvasContainerRef,
    wrapperRef,
    activeObject,
    zoom,
    rotation,
    showGrid,
    snapToGrid,
    gridSize,
    snapToObjects,
    isLoading,
    loadingMessage,
    initializeCanvas,
    handleZoom,
    fitToScreen,
    handleCanvasRotation,
    toggleGrid,
    toggleSnapToGrid,
    updateGridSize,
    toggleSnapToObjects,
    drawGrid,
    clearGuidelines,
    saveToHistory: () => {},
    addText,
    addShape,
    addImage,
    deleteSelected,
    duplicateSelected,
    clearCanvas,
    alignObject,
    setTextAlign,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    selectAll,
    copySelected,
    paste,
    exportCanvas,
    exportAllPages,
    openPreview,
    loadHTMLTemplate,
    handleObjectMoving,
    handleObjectModified,
    handleSelection,
    handleSelectionCleared
  };
};

export default useCanvas;