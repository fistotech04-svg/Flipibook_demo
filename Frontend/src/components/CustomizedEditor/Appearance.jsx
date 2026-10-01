import React from 'react';
import { Icon } from '@iconify/react';
import BackgroundSection from './BackgroundSection';
import Layout from './Layout';
import BookAppearanceSection from './BookAppearanceSection';

const Appearance = ({ 
  onBack, 
  activeSub, 
  backgroundSettings, 
  onUpdateBackground, 
  bookAppearanceSettings, 
  onUpdateBookAppearance,
  layoutSettings,
  onUpdateLayout,
  layoutColors,
  onUpdateLayoutColors,
  pages,
  folder,
  flipbookName,
  v_id,
  onTocSettingsClick
}) => {
  return (
    <div className="flex flex-col h-full bg-white font-sans relative">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Header */}
      <div className="h-[7.5vh] flex items-center justify-between px-[1.2vw] border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-[0.75vw] text-gray-800">
          <Icon 
            icon={activeSub === 'bookappearance' ? 'basil:book-open-outline' : activeSub === 'background' ? 'fa6-regular:image' : 'lucide:layout-panel-left'} 
            className="w-[1.2vw] h-[1.2vw] text-black" 
          />
          <h2 className="text-[1vw] font-semibold text-gray-900">
            {activeSub === 'background' ? 'Background' : activeSub === 'layout' ? 'Layout Design' : 'Book Appearance'}
          </h2>
        </div>
        <button 
          onClick={onBack} 
          className="w-[2vw] h-[2vw] rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all active:scale-90"
        >
          <Icon icon="ph:arrow-left-bold" className="w-[1.1vw] h-[1.1vw]" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-white pb-[2.5vw] hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {(activeSub === 'background' || activeSub === 'background_fetch') ? (
          <BackgroundSection 
            backgroundSettings={backgroundSettings} 
            onUpdateBackground={onUpdateBackground}
            folder={folder}
            flipbookName={flipbookName}
            v_id={v_id}
          />
        ) : activeSub === 'bookappearance' ? (
          <BookAppearanceSection 
            bookAppearanceSettings={bookAppearanceSettings} 
            onUpdateBookAppearance={onUpdateBookAppearance} 
            pages={pages}
          />
        ) : activeSub === 'layout' ? (
          <Layout
            activeLayout={layoutSettings}
            onUpdateLayout={onUpdateLayout}
            layoutColors={layoutColors}
            onUpdateLayoutColors={onUpdateLayoutColors}
            onTocSettingsClick={onTocSettingsClick}
          />
        ) : (
          <div className="p-12 flex flex-col items-center justify-center text-center gap-4 text-gray-400">
            <Icon icon="lucide:settings-2" className="w-16 h-16 opacity-20" />
            <p className="text-sm font-semibold">{activeSub} Settings<br />Coming Soon</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Appearance;
