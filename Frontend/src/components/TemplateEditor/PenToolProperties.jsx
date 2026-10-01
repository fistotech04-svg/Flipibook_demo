import React, { useState, useEffect } from 'react';

const PenToolProperties = ({
  isVectorPath = true,
  isNodeEditActive = false,
  isPenChosen = false,
}) => {
  const [activeNodeType, setActiveNodeType] = useState(null);
  const [selectedNodeCount, setSelectedNodeCount] = useState(1);
  const [canJoinNodes, setCanJoinNodes] = useState(false);
  const [isLineSelected, setIsLineSelected] = useState(false);

  useEffect(() => {
    const handleNodeSelected = (e) => {
      if (e.detail?.nodeType) {
        setActiveNodeType(e.detail.nodeType);
      }
      const count = e.detail?.selectedCount !== undefined ? e.detail.selectedCount : e.detail?.count;
      if (count !== undefined) {
        setSelectedNodeCount(count);
      }
      if (e.detail?.canJoin !== undefined) {
        setCanJoinNodes(Boolean(e.detail.canJoin) && count === 2);
      } else {
        setCanJoinNodes(count === 2);
      }
      if (e.detail?.isLineSelected !== undefined) {
        setIsLineSelected(Boolean(e.detail.isLineSelected));
      } else {
        setIsLineSelected(false);
      }
    };

    const handleNodeEditChange = (e) => {
      if (e.detail?.active) {
        setSelectedNodeCount(1);
        setCanJoinNodes(false);
        setIsLineSelected(false);
        setActiveNodeType(null); // Reset stale type; enterNodeEditMode will dispatch node-selected with the real type
      }
    };

    window.addEventListener('node-selected', handleNodeSelected);
    window.addEventListener('node-edit-mode-changed', handleNodeEditChange);
    return () => {
      window.removeEventListener('node-selected', handleNodeSelected);
      window.removeEventListener('node-edit-mode-changed', handleNodeEditChange);
    };
  }, []);

  const triggerPathAction = (action) => {
    if (['sharp', 'smooth', 'balanced', 'custom'].includes(action)) {
      setActiveNodeType(action);
    }
    window.dispatchEvent(new CustomEvent('vector-path-action', { detail: { action } }));
  };

  if (!isVectorPath || !isNodeEditActive || isPenChosen) {
    return null;
  }

  return (
    <div className="flex flex-col font-sans">
      {/* Pen tool Properties */}
      <div className="mb-[1vw]">
        <div className="flex items-center gap-[0.75vw] mb-[0.6vw]">
          <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap tracking-wide">Pen tool Properties</span>
          <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}></div>
        </div>

        <div className="grid grid-cols-4 gap-[0.4vw]">
          <button
            disabled={selectedNodeCount > 1}
            onClick={() => triggerPathAction('sharp')}
            className={`border rounded-[0.5vw] p-[0.4vw] flex flex-col items-center justify-center gap-[0.25vw] shadow-sm transition-all group ${
              selectedNodeCount > 1
                ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400'
                : activeNodeType === 'sharp'
                ? 'bg-indigo-50 border-indigo-400 text-indigo-600 cursor-pointer'
                : 'bg-[#F9FAFB] hover:bg-indigo-50 border-gray-200 hover:border-indigo-300 cursor-pointer'
            }`}
            title={selectedNodeCount > 1 ? "Disabled when multiple points selected" : "Sharp Corner"}
          >
            <svg width="1.2vw" height="1.2vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={selectedNodeCount > 1 ? 'text-gray-400' : activeNodeType === 'sharp' ? 'text-indigo-600' : 'text-gray-700 group-hover:text-indigo-600'}>
              <path d="M6 17V8a2 2 0 0 1 2-2h9" />
              <rect x="4" y="15" width="4" height="4" fill="white" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <span className={`text-[0.58vw] font-medium text-center leading-tight ${selectedNodeCount > 1 ? 'text-gray-400' : activeNodeType === 'sharp' ? 'text-indigo-600' : 'text-gray-600 group-hover:text-indigo-600'}`}>Sharp Corner</span>
          </button>

          <button
            disabled={selectedNodeCount > 1}
            onClick={() => triggerPathAction('smooth')}
            className={`border rounded-[0.5vw] p-[0.4vw] flex flex-col items-center justify-center gap-[0.25vw] shadow-sm transition-all group ${
              selectedNodeCount > 1
                ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400'
                : activeNodeType === 'smooth'
                ? 'bg-indigo-50 border-indigo-400 text-indigo-600 cursor-pointer'
                : 'bg-[#F9FAFB] hover:bg-indigo-50 border-gray-200 hover:border-indigo-300 cursor-pointer'
            }`}
            title={selectedNodeCount > 1 ? "Disabled when multiple points selected" : "Smooth Curve"}
          >
            <svg width="1.2vw" height="1.2vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={selectedNodeCount > 1 ? 'text-gray-400' : activeNodeType === 'smooth' ? 'text-indigo-600' : 'text-gray-700 group-hover:text-indigo-600'}>
              <path d="M4 16C8 6 16 6 20 16" />
              <path d="M8 8h8" strokeDasharray="2 2" />
              <circle cx="12" cy="8" r="2.5" fill={selectedNodeCount > 1 ? "#A1A1AA" : "#4E9EFF"} stroke="white" strokeWidth="1" />
            </svg>
            <span className={`text-[0.58vw] font-medium text-center leading-tight ${selectedNodeCount > 1 ? 'text-gray-400' : activeNodeType === 'smooth' ? 'text-indigo-600' : 'text-gray-600 group-hover:text-indigo-600'}`}>Smooth Curve</span>
          </button>

          <button
            disabled={selectedNodeCount > 1}
            onClick={() => triggerPathAction('balanced')}
            className={`border rounded-[0.5vw] p-[0.4vw] flex flex-col items-center justify-center gap-[0.25vw] shadow-sm transition-all group ${
              selectedNodeCount > 1
                ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400'
                : activeNodeType === 'balanced'
                ? 'bg-indigo-50 border-indigo-400 text-indigo-600 cursor-pointer'
                : 'bg-[#F9FAFB] hover:bg-indigo-50 border-gray-200 hover:border-indigo-300 cursor-pointer'
            }`}
            title={selectedNodeCount > 1 ? "Disabled when multiple points selected" : "Balanced Curve"}
          >
            <svg width="1.2vw" height="1.2vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={selectedNodeCount > 1 ? 'text-gray-400' : activeNodeType === 'balanced' ? 'text-indigo-600' : 'text-gray-700 group-hover:text-indigo-600'}>
              <path d="M4 15C8 7 16 7 20 15" />
              <line x1="6" y1="8" x2="18" y2="8" strokeDasharray="2 2" />
              <circle cx="6" cy="8" r="2" fill="currentColor" />
              <circle cx="18" cy="8" r="2" fill="currentColor" />
              <circle cx="12" cy="8" r="2.5" fill={selectedNodeCount > 1 ? "#A1A1AA" : "#4E9EFF"} stroke="white" strokeWidth="1" />
            </svg>
            <span className={`text-[0.58vw] font-medium text-center leading-tight ${selectedNodeCount > 1 ? 'text-gray-400' : activeNodeType === 'balanced' ? 'text-indigo-600' : 'text-gray-600 group-hover:text-indigo-600'}`}>Balanced Curve</span>
          </button>

          <button
            disabled={selectedNodeCount > 1}
            onClick={() => triggerPathAction('custom')}
            className={`border rounded-[0.5vw] p-[0.4vw] flex flex-col items-center justify-center gap-[0.25vw] shadow-sm transition-all group ${
              selectedNodeCount > 1
                ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400'
                : activeNodeType === 'custom'
                ? 'bg-indigo-50 border-indigo-400 text-indigo-600 cursor-pointer'
                : 'bg-[#F9FAFB] hover:bg-indigo-50 border-gray-200 hover:border-indigo-300 cursor-pointer'
            }`}
            title={selectedNodeCount > 1 ? "Disabled when multiple points selected" : "Custom Curve"}
          >
            <svg width="1.2vw" height="1.2vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={selectedNodeCount > 1 ? 'text-gray-400' : activeNodeType === 'custom' ? 'text-indigo-600' : 'text-gray-700 group-hover:text-indigo-600'}>
              <path d="M4 17C8 8 13 6 13 11S17 17 20 8" />
              <path d="M13 11L7 4M13 11l7-3" strokeDasharray="2 2" />
              <circle cx="13" cy="11" r="2.5" fill={selectedNodeCount > 1 ? "#A1A1AA" : "#4E9EFF"} stroke="white" strokeWidth="1" />
            </svg>
            <span className={`text-[0.58vw] font-medium text-center leading-tight ${selectedNodeCount > 1 ? 'text-gray-400' : activeNodeType === 'custom' ? 'text-indigo-600' : 'text-gray-600 group-hover:text-indigo-600'}`}>Custom Curve</span>
          </button>
        </div>
      </div>

      {/* Path Action */}
      <div className="mb-[1vw]">
        <div className="flex items-center gap-[0.75vw] mb-[0.6vw]">
          <span className="text-[0.85vw] font-semibold text-gray-900 whitespace-nowrap tracking-wide">Path Action</span>
          <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}></div>
        </div>

        <div className="grid grid-cols-5 gap-[0.3vw]">
          <button
            disabled={!canJoinNodes}
            onClick={() => triggerPathAction('join')}
            className={`border rounded-[0.5vw] p-[0.35vw] flex flex-col items-center justify-center gap-[0.2vw] shadow-sm transition-all group ${
              !canJoinNodes
                ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400'
                : 'bg-[#F9FAFB] hover:bg-indigo-50 border-gray-200 hover:border-indigo-300 cursor-pointer'
            }`}
            title={!canJoinNodes ? "Select 2 non-connected points to join" : "Join Points"}
          >
            <svg width="1.1vw" height="1.1vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={!canJoinNodes ? 'text-gray-400' : 'text-gray-700 group-hover:text-indigo-600'}>
              <path d="M5 19C5 11 11 8 19 7" strokeDasharray="3 3" />
              <circle cx="5" cy="19" r="2.5" fill={!canJoinNodes ? "#A1A1AA" : "#4E9EFF"} />
              <circle cx="19" cy="7" r="2.5" fill={!canJoinNodes ? "#A1A1AA" : "#4E9EFF"} />
            </svg>
            <span className={`text-[0.55vw] font-medium text-center leading-tight whitespace-nowrap ${!canJoinNodes ? 'text-gray-400' : 'text-gray-600 group-hover:text-indigo-600'}`}>Join Points</span>
          </button>

          <button
            disabled={!isLineSelected}
            onClick={() => triggerPathAction('add-point')}
            className={`border rounded-[0.5vw] p-[0.35vw] flex flex-col items-center justify-center gap-[0.2vw] shadow-sm transition-all group ${
              !isLineSelected
                ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400'
                : 'bg-[#F9FAFB] hover:bg-indigo-50 border-gray-200 hover:border-indigo-300 cursor-pointer'
            }`}
            title={!isLineSelected ? "Select a line segment to add point" : "Add Point"}
          >
            <svg width="1.1vw" height="1.1vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={!isLineSelected ? 'text-gray-400' : 'text-gray-700 group-hover:text-indigo-600'}>
              <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className={`text-[0.55vw] font-medium text-center leading-tight whitespace-nowrap ${!isLineSelected ? 'text-gray-400' : 'text-gray-600 group-hover:text-indigo-600'}`}>Add Point</span>
          </button>

          <button
            onClick={() => triggerPathAction('curve-line')}
            className="bg-[#F9FAFB] hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-[0.5vw] p-[0.35vw] flex flex-col items-center justify-center gap-[0.2vw] shadow-sm cursor-pointer transition-all group"
            title="Curve Line"
          >
            <svg width="1.1vw" height="1.1vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-gray-700 group-hover:text-indigo-600">
              <path d="M4 18C10 4 14 4 20 18" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-[0.55vw] font-medium text-gray-600 group-hover:text-indigo-600 text-center leading-tight whitespace-nowrap">Curve Line</span>
          </button>

          <button
            disabled={selectedNodeCount !== 1 || isLineSelected}
            onClick={() => triggerPathAction('split')}
            className={`border rounded-[0.5vw] p-[0.35vw] flex flex-col items-center justify-center gap-[0.2vw] shadow-sm transition-all group ${
              selectedNodeCount !== 1 || isLineSelected
                ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400'
                : 'bg-[#F9FAFB] hover:bg-indigo-50 border-gray-200 hover:border-indigo-300 cursor-pointer'
            }`}
            title={selectedNodeCount !== 1 || isLineSelected ? "Select a single point node to split" : "Split Point"}
          >
            <svg width="1.1vw" height="1.1vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={selectedNodeCount !== 1 || isLineSelected ? 'text-gray-400' : 'text-gray-700 group-hover:text-indigo-600'}>
              <path d="M4 16C7 10 9 8 11 8M14 8c2 0 4 2 6 8" />
              <rect x="10.5" y="6.5" width="3" height="3" transform="rotate(45 12 8)" fill={selectedNodeCount !== 1 || isLineSelected ? "#A1A1AA" : "#4E9EFF"} />
            </svg>
            <span className={`text-[0.55vw] font-medium text-center leading-tight whitespace-nowrap ${selectedNodeCount !== 1 || isLineSelected ? 'text-gray-400' : 'text-gray-600 group-hover:text-indigo-600'}`}>Split Point</span>
          </button>

          <button
            onClick={() => triggerPathAction('delete-node')}
            className="bg-[#F9FAFB] hover:bg-indigo-50 border border-gray-200 hover:border-red-300 rounded-[0.5vw] p-[0.35vw] flex flex-col items-center justify-center gap-[0.2vw] shadow-sm cursor-pointer transition-all group"
            title="Delete Point / Line"
          >
            <svg width="1.1vw" height="1.1vw" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-gray-700 group-hover:text-red-500">
              <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-[0.55vw] font-medium text-gray-600 group-hover:text-red-500 text-center leading-tight whitespace-nowrap">Delete Point/Line</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PenToolProperties;
