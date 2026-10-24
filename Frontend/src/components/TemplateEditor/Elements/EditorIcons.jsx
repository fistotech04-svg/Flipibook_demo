import React from 'react';

// Mask icon: circle with left half filled, right half outline (exact match to Figma / mockup)
export const MaskIcon = ({ size = "1.1vw", className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 20 20" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ minWidth: size, minHeight: size }}
  >
    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.8" />
    <path d="M10 2 A 8 8 0 0 0 10 18 Z" fill="currentColor" />
  </svg>
);

// Flatten icon: arrow down into base lines (exact match to Figma / mockup)
export const FlattenIcon = ({ size = "1.1vw", className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 20 20" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ minWidth: size, minHeight: size }}
  >
    <path 
      d="M10 2.5V10.5M10 10.5L6.5 7M10 10.5L13.5 7" 
      stroke="currentColor" 
      strokeWidth="1.8" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    <path 
      d="M3.5 13.5H16.5" 
      stroke="currentColor" 
      strokeWidth="1.8" 
      strokeLinecap="round" 
    />
    <path 
      d="M5 16.5H15" 
      stroke="currentColor" 
      strokeWidth="1.8" 
      strokeLinecap="round" 
    />
  </svg>
);

// Copy icon
export const CopyIcon = ({ size = "0.95vw", className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 20 20" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ minWidth: size, minHeight: size }}
  >
    <rect x="5.5" y="5.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M3.5 13.5V4.5C3.5 3.94772 3.94772 3.5 4.5 3.5H13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

// Paste icon
export const PasteIcon = ({ size = "0.95vw", className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 20 20" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ minWidth: size, minHeight: size }}
  >
    <path d="M7 3.5H13C13.5523 3.5 14 3.94772 14 4.5V5.5H6V4.5C6 3.94772 6.44772 3.5 7 3.5Z" stroke="currentColor" strokeWidth="1.5" />
    <rect x="4" y="5.5" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M7.5 9.5H12.5M7.5 12.5H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// Cut icon
export const CutIcon = ({ size = "0.95vw", className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 20 20" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ minWidth: size, minHeight: size }}
  >
    <circle cx="6" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="6" cy="14" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 7.5L16 15.5M8 12.5L16 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// Duplicate icon (two squares with +)
export const DuplicateIcon = ({ size = "0.95vw", className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 20 20" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ minWidth: size, minHeight: size }}
  >
    <rect x="5.5" y="5.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M3.5 13.5V4.5C3.5 3.94772 3.94772 3.5 4.5 3.5H13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M11 8.5V13.5M8.5 11H13.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

// Group icon (overlapping frames with corner handles)
export const GroupIcon = ({ size = "0.95vw", className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 20 20" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ minWidth: size, minHeight: size }}
  >
    <rect x="3" y="3" width="9" height="9" stroke="currentColor" strokeWidth="1.4" />
    <rect x="8" y="8" width="9" height="9" stroke="currentColor" strokeWidth="1.4" />
    <rect x="2" y="2" width="2.5" height="2.5" fill="white" stroke="currentColor" strokeWidth="1.2" />
    <rect x="10.5" y="2" width="2.5" height="2.5" fill="white" stroke="currentColor" strokeWidth="1.2" />
    <rect x="2" y="10.5" width="2.5" height="2.5" fill="white" stroke="currentColor" strokeWidth="1.2" />
    <rect x="7" y="7" width="2.5" height="2.5" fill="white" stroke="currentColor" strokeWidth="1.2" />
    <rect x="15.5" y="7" width="2.5" height="2.5" fill="white" stroke="currentColor" strokeWidth="1.2" />
    <rect x="7" y="15.5" width="2.5" height="2.5" fill="white" stroke="currentColor" strokeWidth="1.2" />
    <rect x="15.5" y="15.5" width="2.5" height="2.5" fill="white" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

// Ungroup icon
export const UngroupIcon = ({ size = "0.95vw", className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 20 20" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ minWidth: size, minHeight: size }}
  >
    <rect x="2.5" y="5.5" width="7" height="7" stroke="currentColor" strokeWidth="1.4" strokeDasharray="1.5 1.5" />
    <rect x="10.5" y="5.5" width="7" height="7" stroke="currentColor" strokeWidth="1.4" />
    <rect x="1.5" y="4.5" width="2.5" height="2.5" fill="white" stroke="currentColor" strokeWidth="1.2" />
    <rect x="8" y="4.5" width="2.5" height="2.5" fill="white" stroke="currentColor" strokeWidth="1.2" />
    <rect x="1.5" y="11" width="2.5" height="2.5" fill="white" stroke="currentColor" strokeWidth="1.2" />
    <rect x="8" y="11" width="2.5" height="2.5" fill="white" stroke="currentColor" strokeWidth="1.2" />
    <rect x="16" y="4.5" width="2.5" height="2.5" fill="white" stroke="currentColor" strokeWidth="1.2" />
    <rect x="16" y="11" width="2.5" height="2.5" fill="white" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

// Move Up icon (horizontal line on top, arrow pointing up towards it)
export const MoveUpIcon = ({ size = "0.95vw", className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 20 20" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ minWidth: size, minHeight: size }}
  >
    <path d="M4 5H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M10 15V8.5M10 8.5L6.5 12M10 8.5L13.5 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Move Down icon (horizontal line on bottom, arrow pointing down towards it)
export const MoveDownIcon = ({ size = "0.95vw", className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 20 20" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ minWidth: size, minHeight: size }}
  >
    <path d="M4 15H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M10 5V11.5M10 11.5L6.5 8M10 11.5L13.5 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Move to First icon (bring to front)
export const MoveToFirstIcon = ({ size = "0.95vw", className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 20 20" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ minWidth: size, minHeight: size }}
  >
    <path d="M4 5H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M10 16V6.5M10 6.5L6 10.5M10 6.5L14 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Move to Last icon (send to back)
export const MoveToLastIcon = ({ size = "0.95vw", className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 20 20" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ minWidth: size, minHeight: size }}
  >
    <path d="M4 15H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M10 4V13.5M10 13.5L6 9.5M10 13.5L14 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
