export const getDominantColors = async (url, isVideo = false) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const processCanvas = (source) => {
      canvas.width = 100; // Resize for performance
      canvas.height = 100;
      ctx.drawImage(source, 0, 0, 100, 100);
      
      const imageData = ctx.getImageData(0, 0, 100, 100).data;
      const counts = {};
      let rTotal = 0, gTotal = 0, bTotal = 0;
      
      for (let i = 0; i < imageData.length; i += 4) {
        const r = imageData[i];
        const g = imageData[i+1];
        const b = imageData[i+2];
        const a = imageData[i+3];
        
        if (a < 128) continue; // Skip semi-transparent
        
        rTotal += r;
        gTotal += g;
        bTotal += b;
      }
      
      const pixelCount = imageData.length / 4;
      const avgR = Math.round(rTotal / pixelCount);
      const avgG = Math.round(gTotal / pixelCount);
      const avgB = Math.round(bTotal / pixelCount);
      
      // Simple dominant color is average for now, but let's try to be smarter
      // We want a dark and a light version
      
      // Convert to HSL to adjust
      const { h, s, l } = rgbToHsl(avgR, avgG, avgB);
      
      const darkColor = hslToHex(h, s, Math.min(l, 30)); // 30% lightness max
      const lightColor = hslToHex(h, Math.max(s, 20), Math.max(l, 85)); // 85% lightness min
      
      return { dark: darkColor, light: lightColor };
    };

    if (isVideo) {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.currentTime = 1;

      video.onseeked = () => {
        try {
          resolve(processCanvas(video));
        } catch (e) {
          resolve({ dark: '#3E4491', light: '#FFFFFF' });
        }
      };
      video.onerror = () => resolve({ dark: '#3E4491', light: '#FFFFFF' });
      video.src = url;
    } else {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      const tryLoad = (src) => {
        img.onload = () => {
          try {
            resolve(processCanvas(img));
          } catch (e) {
            fetchBlobFallback();
          }
        };
        img.onerror = () => fetchBlobFallback();
        img.src = src;
      };

      const fetchBlobFallback = () => {
        fetch(url)
          .then(res => res.blob())
          .then(blob => {
            const blobUrl = URL.createObjectURL(blob);
            const blobImg = new Image();
            blobImg.onload = () => {
              try {
                const res = processCanvas(blobImg);
                URL.revokeObjectURL(blobUrl);
                resolve(res);
              } catch (e) {
                URL.revokeObjectURL(blobUrl);
                resolve({ dark: '#3E4491', light: '#FFFFFF' });
              }
            };
            blobImg.onerror = () => {
              URL.revokeObjectURL(blobUrl);
              resolve({ dark: '#3E4491', light: '#FFFFFF' });
            };
            blobImg.src = blobUrl;
          })
          .catch(() => resolve({ dark: '#3E4491', light: '#FFFFFF' }));
      };

      tryLoad(url);
    }
  });
};

const rgbToHsl = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
};

const hslToHex = (h, s, l) => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
};

export const REACT_BITS_THEMES_COLORS = {
  'Antigravity': { dark: '#901B44', light: '#FFF0F5' },
  'ColorBlends': { dark: '#4B3EFE', light: '#E0E7FF' },
  'DarkVeil': { dark: '#1A1A1A', light: '#D1D1D1' },
  'DotGrid': { dark: '#3E4491', light: '#F0F0FF' },
  'FloatingLines': { dark: '#1E3A8A', light: '#DBEAFE' },
  'Galaxy': { dark: '#2D1B69', light: '#E8E4FF' },
  'GridScan': { dark: '#064E3B', light: '#D1FAE5' },
  'Hyperspeed': { dark: '#7C3AED', light: '#F5F3FF' },
  'Iridescence': { dark: '#065F46', light: '#D1FAE5' },
  'LightPillar': { dark: '#374151', light: '#F3F4F6' },
  'LightRays': { dark: '#1F2937', light: '#F9FAFB' },
  'LiquidEther': { dark: '#4338CA', light: '#EEF2FF' },
  'Orb': { dark: '#4F46E5', light: '#EEF2FF' },
  'Particles': { dark: '#1E40AF', light: '#DBEAFE' },
  'PixelSnow': { dark: '#374151', light: '#F9FAFB' },
  'Prism': { dark: '#5B21B6', light: '#EDE9FE' },
  'PrismaticBurst': { dark: '#78350F', light: '#FEF3C7' },
  'Silk': { dark: '#4B5563', light: '#F3F4F6' },
  'SplashCursor': { dark: '#064E3B', light: '#D1FAE5' },
  'Threads': { dark: '#312E81', light: '#E0E7FF' },
  'Waves': { dark: '#1E3A8A', light: '#DBEAFE' }
};
