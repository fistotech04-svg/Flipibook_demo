import React from 'react';
import { Icon } from '@iconify/react';

const Statistic = ({ onBack }) => {
  return (
    <div className="flex flex-col h-full bg-white font-sans">
      {/* Header */}
      <div className="h-[8vh] flex items-center justify-between px-[1vw] border-b border-gray-100">
        <div className="flex items-center gap-[0.5vw]">
          <Icon icon="material-symbols:leaderboard-rounded" className="w-[1vw] h-[1vw] text-gray-700 font-semibold" />
          <span className="text-[1.1vw] font-semibold text-gray-900">Statistic</span>
        </div>
        <button onClick={onBack} className="text-gray-600 hover:text-gray-900">
          <Icon icon="ic:round-arrow-back" className="w-[1.25vw] h-[1.25vw]" />
        </button>
      </div>

      <div className="p-[1.5vw] text-[0.75vw] text-gray-500">
        Statistic information will appear here.
      </div>
    </div>
  );
};

export default Statistic;
