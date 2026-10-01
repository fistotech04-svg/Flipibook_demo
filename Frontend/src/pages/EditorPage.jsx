import React from 'react';
import Navbar from '../components/Navbar'; // Your existing Navbar
import LeftPanel from '../components/Editor/LeftPanel';
import CanvasPanel from '../components/Editor/CanvasPanel';
import RightPanel from '../components/Editor/RightPanel';
import TemplateModal from '../components/Editor/TemplateModal';
import { EditorProvider } from '../context/EditorContext';

const EditorPage = () => {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Editor Provider wraps the content logic */}
      <EditorProvider>
        <div className="flex-1 flex overflow-hidden">
          <LeftPanel />
          <CanvasPanel />
          <RightPanel />
        </div>
        <TemplateModal />
      </EditorProvider>
    </div>
  );
};

export default EditorPage;