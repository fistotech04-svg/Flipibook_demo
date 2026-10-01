// useProperties.js
import { useState, useCallback, useMemo } from 'react';

const colorToHex = (color) => {
  if (!color || color === 'none' || color === 'transparent') return '';
  if (color.startsWith('#')) return color;
  if (color.startsWith('rgb')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const r = parseInt(match[1]).toString(16).padStart(2, '0');
      const g = parseInt(match[2]).toString(16).padStart(2, '0');
      const b = parseInt(match[3]).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
  }
  return color;
};

const useProperties = () => {
  const [properties, setProperties] = useState({
    text: '',
    fontFamily: 'Arial',
    fontSize: 24,
    fontWeight: 400,
    fontStyle: 'normal',
    underline: false,
    linethrough: false,
    textAlign: 'left',
    fill: '#000000',
    fillOpacity: 100,
    stroke: '',
    strokeWidth: 0,
    strokeOpacity: 100,
    strokeDashArray: false,
    charSpacing: 0,
    lineHeight: 1.2,
    angle: 0,
    scaleX: 1,
    scaleY: 1,
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    skewX: 0,
    skewY: 0,
    flipX: false,
    flipY: false,
  });

  const isTextObject = useMemo(() => {
    // This would check against an active object
    return false;
  }, []);

  const updateProperty = useCallback((key, value) => {
    setProperties(prev => ({ ...prev, [key]: value }));
    // Additional logic to update canvas object would go here
  }, []);

  const updatePropertiesFromObject = useCallback((obj) => {
    if (!obj) return;

    const boundingRect = obj.getBoundingRect(true);
    
    setProperties({
      text: obj.text || '',
      fontFamily: obj.fontFamily || 'Arial',
      fontSize: Math.round(obj.fontSize || 24),
      fontWeight: obj.fontWeight || 400,
      fontStyle: obj.fontStyle || 'normal',
      underline: obj.underline || false,
      linethrough: obj.linethrough || false,
      textAlign: obj.textAlign || 'left',
      fill: colorToHex(typeof obj.fill === 'string' ? obj.fill : '#000000'),
      fillOpacity: Math.round((obj.opacity || 1) * 100),
      stroke: colorToHex(obj.stroke || ''),
      strokeWidth: obj.strokeWidth || 0,
      strokeOpacity: 100,
      strokeDashArray: Array.isArray(obj.strokeDashArray) && obj.strokeDashArray.length > 0,
      charSpacing: obj.charSpacing || 0,
      lineHeight: obj.lineHeight || 1.2,
      angle: Math.round(obj.angle || 0),
      scaleX: Number((obj.scaleX || 1).toFixed(3)),
      scaleY: Number((obj.scaleY || 1).toFixed(3)),
      left: Math.round(obj.left || 0),
      top: Math.round(obj.top || 0),
      width: Math.round(boundingRect.width),
      height: Math.round(boundingRect.height),
      skewX: obj.skewX || 0,
      skewY: obj.skewY || 0,
      flipX: obj.flipX || false,
      flipY: obj.flipY || false,
    });
  }, []);

  const resetProperties = useCallback(() => {
    setProperties({
      text: '',
      fontFamily: 'Arial',
      fontSize: 24,
      fontWeight: 400,
      fontStyle: 'normal',
      underline: false,
      linethrough: false,
      textAlign: 'left',
      fill: '#000000',
      fillOpacity: 100,
      stroke: '',
      strokeWidth: 0,
      strokeOpacity: 100,
      strokeDashArray: false,
      charSpacing: 0,
      lineHeight: 1.2,
      angle: 0,
      scaleX: 1,
      scaleY: 1,
      left: 0,
      top: 0,
      width: 0,
      height: 0,
      skewX: 0,
      skewY: 0,
      flipX: false,
      flipY: false,
    });
  }, []);

  return {
    properties,
    isTextObject,
    updateProperty,
    updatePropertiesFromObject,
    resetProperties
  };
};

export default useProperties;