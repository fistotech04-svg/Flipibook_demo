import React from 'react';
import { QrCode } from 'lucide-react';

const QRCode = ({ isFullView }) => {
  // Placeholder array since we don't have SVGs for this category
  const placeholders = Array(isFullView ? 12 : 4).fill(0);

  return (
    <div className="grid grid-cols-4 gap-[0.5vw]">
      {placeholders.map((_, idx) => (
        <div 
          key={idx} 
          className="aspect-square bg-gray-50 rounded-[0.4vw] border border-gray-100 flex items-center justify-center p-[0.5vw] cursor-pointer hover:border-gray-400 hover:shadow-sm transition-all group"
        >
          <QrCode size="1.5vw" className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
        </div>
      ))}
    </div>
  );
};

export default QRCode;
