import React from 'react';

const frameModules = import.meta.glob('../../../assets/Elements/ImageFraming/*.svg', { eager: true, import: 'default' });
// Extract filename and url
const frames = Object.keys(frameModules).map(path => {
  const filename = path.split('/').pop().replace('.svg', '');
  return {
    name: filename,
    url: frameModules[path]
  };
});

const ImageFraming = ({ isFullView }) => {
  const displayFrames = isFullView ? frames : frames.slice(0, 8); // 2 rows, 4 columns = 8

  return (
    <div className="grid grid-cols-4 gap-[0.5vw]">
      {displayFrames.map((frame, idx) => (
        <div 
          key={idx} 
          className="aspect-square bg-gray-50 rounded-[0.4vw] border border-gray-100 flex items-center justify-center p-[0.5vw] cursor-pointer hover:border-gray-400 hover:shadow-sm transition-all group"
          title={frame.name}
        >
          <img 
            src={frame.url} 
            alt={frame.name} 
            className="w-full h-full object-contain opacity-70 group-hover:opacity-100 transition-opacity" 
          />
        </div>
      ))}
    </div>
  );
};

export default ImageFraming;
