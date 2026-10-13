import React, { useState } from 'react';
import imageConverterImg from '../assets/Converter_frontimage/imageconverter.png';
import videoConverterImg from '../assets/Converter_frontimage/videoconverterimage.png';
import model3dImg from '../assets/Converter_frontimage/3dimage.png';
import UploadPage from './Converter/uploadPage';
import ImageConverter from './Converter/imageConverter';
import ImageCompressor from './Converter/imageCompressor';
import VideoConverter from './Converter/videoConverter';

const Converter = () => {
  const [step, setStep] = useState('select'); // 'select' | 'upload' | 'convert'
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const cards = [
    {
      id: 'image',
      title: 'Image',
      description: 'Convert or compress images to different formats with good clear quality.',
      image: imageConverterImg,
      badgeIcon: (
        /* Landscape / Photo Icon */
        <svg width="1vw" height="1vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      ),
    },
    {
      id: 'video',
      title: 'Video',
      description: 'Convert or compress videos to different formats with good quality.',
      image: videoConverterImg,
      badgeIcon: (
        /* Play / Video Icon */
        <svg width="0.95vw" height="0.95vw" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 5.5v13a1 1 0 0 0 1.55.83l10.5-6.5a1 1 0 0 0 0-1.66l-10.5-6.5A1 1 0 0 0 7 5.5z" />
        </svg>
      ),
    },
    {
      id: '3d-model',
      title: '3D Model',
      description: 'Convert or compress 3D model to different formats with high quality.',
      image: model3dImg,
      badgeIcon: (
        /* 3D Isometric Cube Box Icon */
        <svg width="1.05vw" height="1.05vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.3 7 8.7 5 8.7-5" />
          <path d="M12 22V12" />
        </svg>
      ),
    },
  ];

  if (step === 'upload' && selectedConfig) {
    return (
      <UploadPage
        initialConfig={selectedConfig}
        onBack={() => {
          setStep('select');
          setSelectedConfig(null);
        }}
        onContinue={(file) => {
          setUploadedFile(file);
          setStep('convert');
        }}
      />
    );
  }

  if (step === 'convert' && selectedConfig) {
    if (selectedConfig.action === 'compress' && selectedConfig.type === 'image') {
      return (
        <ImageCompressor
          fileData={uploadedFile}
          initialConfig={selectedConfig}
          onBack={() => setStep('upload')}
          onReset={() => {
            setStep('select');
            setSelectedConfig(null);
            setUploadedFile(null);
          }}
        />
      );
    }

    if (selectedConfig.type === 'video') {
      return (
        <VideoConverter
          fileData={uploadedFile}
          initialConfig={selectedConfig}
          onBack={() => setStep('upload')}
          onReset={() => {
            setStep('select');
            setSelectedConfig(null);
            setUploadedFile(null);
          }}
        />
      );
    }

    return (
      <ImageConverter
        fileData={uploadedFile}
        initialConfig={selectedConfig}
        onBack={() => setStep('upload')}
        onReset={() => {
          setStep('select');
          setSelectedConfig(null);
          setUploadedFile(null);
        }}
      />
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-8vh)] bg-white flex flex-col items-center justify-start pt-[5vh] pb-[6vh] px-[2vw] select-none">
      {/* Title & Subtitle */}
      <div className="text-center mb-[4.5vh]">
        <h1 className="text-[2.2vw] font-extrabold text-[#242b35] tracking-tight leading-tight">
          Convert &amp; Compress Your Media
        </h1>
        <p className="text-[0.9vw] text-[#556987] font-medium mt-[0.8vh]">
          Convert or compress your 3D models, Videos and images in a few clicks.
        </p>
      </div>

      {/* Cards Container */}
      <div className="w-full max-w-[75vw] flex items-stretch justify-center gap-[1.8vw]">
        {cards.map((card) => (
          <div
            key={card.id}
            className="w-[23vw] bg-white rounded-[1vw] border border-[#e2e8f0] shadow-[0_0.2vw_0.9vw_rgba(0,0,0,0.03)] hover:shadow-[0_0.5vw_1.5vw_rgba(0,0,0,0.06)] transition-all duration-300 p-[0.9vw] flex flex-col"
          >
            {/* Image Preview Container */}
            <div className="relative w-full h-[14vw] rounded-[0.7vw] overflow-hidden flex-shrink-0 bg-gray-100">
              <img
                src={card.image}
                alt={card.title}
                className="w-full h-full object-cover"
                draggable={false}
              />

              {/* Top-Left Category Badge */}
              <div className="absolute top-[0.7vw] left-[0.7vw] bg-white/95 rounded-[0.45vw] p-[0.25vw] shadow-[0_0.2vw_0.6vw_rgba(0,0,0,0.12)] flex items-center justify-center">
                <div className="w-[1.7vw] h-[1.7vw] bg-[#EA7233] rounded-[0.35vw] flex items-center justify-center text-white">
                  {card.badgeIcon}
                </div>
              </div>
            </div>

            {/* Title & Description */}
            <div className="flex flex-col items-center text-center mt-[1.3vw] mb-[1.4vw] px-[0.4vw]">
              <h2 className="text-[1.35vw] font-bold text-[#1f2937] tracking-tight">
                {card.title}
              </h2>
              <p className="text-[0.72vw] text-[#6b7280] font-normal leading-relaxed mt-[0.4vw]">
                {card.description}
              </p>
            </div>

            {/* Bottom Actions: Convert & Compress Buttons */}
            <div className="mt-auto flex items-center gap-[0.6vw] w-full">
              {/* Convert Button */}
              <button
                type="button"
                onClick={() => {
                  setSelectedConfig({ type: card.id, action: 'convert', title: card.title });
                  setStep('upload');
                }}
                className="flex-1 flex items-center justify-between px-[0.65vw] py-[0.55vw] bg-[#fff5ee] hover:bg-[#ffede0] border border-[#ffecd9] rounded-[0.5vw] transition-all duration-200 cursor-pointer active:scale-98 group text-left"
              >
                <div className="flex items-center gap-[0.5vw] min-w-0">
                  <div className="w-[1.8vw] h-[1.8vw] rounded-full bg-[#ffdac4] flex items-center justify-center flex-shrink-0">
                    {/* Rotate / Sync Arrows */}
                    <svg
                      width="0.95vw"
                      height="0.95vw"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#ea580c"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                      <path d="M21 21v-5h-5" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[0.76vw] font-bold text-[#1f2937] leading-tight block">
                      Convert
                    </span>
                    <span className="text-[0.52vw] text-[#9ca3af] font-normal leading-tight block truncate">
                      Change your file format
                    </span>
                  </div>
                </div>
                {/* Arrow Right */}
                <svg
                  className="w-[0.8vw] h-[0.8vw] text-gray-600 flex-shrink-0 ml-[0.2vw] transition-transform duration-200 group-hover:translate-x-[0.1vw]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>

              {/* Compress Button */}
              <button
                type="button"
                onClick={() => {
                  setSelectedConfig({ type: card.id, action: 'compress', title: card.title });
                  setStep('upload');
                }}
                className="flex-1 flex items-center justify-between px-[0.65vw] py-[0.55vw] bg-[#edf5ff] hover:bg-[#e2effe] border border-[#dbeafe] rounded-[0.5vw] transition-all duration-200 cursor-pointer active:scale-98 group text-left"
              >
                <div className="flex items-center gap-[0.5vw] min-w-0">
                  <div className="w-[1.8vw] h-[1.8vw] rounded-full bg-[#cae2fe] flex items-center justify-center flex-shrink-0">
                    {/* Compress / Inward Corners */}
                    <svg
                      width="0.95vw"
                      height="0.95vw"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 8h4V4M20 8h-4V4M4 16h4v4M20 16h-4v4" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[0.76vw] font-bold text-[#1f2937] leading-tight block">
                      Compress
                    </span>
                    <span className="text-[0.52vw] text-[#9ca3af] font-normal leading-tight block truncate">
                      Reduce file Size
                    </span>
                  </div>
                </div>
                {/* Arrow Right */}
                <svg
                  className="w-[0.8vw] h-[0.8vw] text-gray-600 flex-shrink-0 ml-[0.2vw] transition-transform duration-200 group-hover:translate-x-[0.1vw]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Converter;
