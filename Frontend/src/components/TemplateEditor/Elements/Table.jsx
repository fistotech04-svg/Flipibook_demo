import React from 'react';
import { Table2 } from 'lucide-react';

const Table = ({ isFullView }) => {
  // Placeholder array (8 items for 2 rows of 4 cols in preview, 16 in full view)
  const placeholders = Array(isFullView ? 16 : 8).fill(0);

  const getTableSvg = () => {
    const uniqueId = Date.now();
    return `<g id="table-${uniqueId}" data-type="table-frame" data-scrollable="false" data-rows="3" data-cols="3" data-theme-color="#ffffff" data-theme-opacity="100" data-border-color="#cbd5e1" data-border-opacity="100" data-border-width="1.5" data-border-style="solid" data-border-radius="0" data-cell-color="#000000" data-cell-opacity="100" data-font-family="Poppins" data-font-size="13" data-font-weight="Regular" data-text-align="left" data-vertical-align="middle" data-padding-x="8" data-padding-y="6" data-drop-shadow="false" data-text-wrapping="true"><foreignObject x="0" y="0" width="170" height="70" style="overflow:visible;"><div class="table-card-wrapper table-container" xmlns="http://www.w3.org/1999/xhtml" style="width:100%;height:100%;box-sizing:border-box;border-radius:0px;overflow:hidden;display:block;margin:0;padding:0;white-space:normal;line-height:normal;pointer-events:auto;"><table style="width:100%;height:100%;border-collapse:collapse;border:1.5px solid #cbd5e1;background-color:#ffffff;font-family:'Poppins',sans-serif;font-size:13px;table-layout:fixed;margin:0;padding:0;white-space:normal;box-sizing:border-box;"><tbody><tr style="height:33.333%;box-sizing:border-box;"><td contenteditable="true" data-row="0" data-col="0" style="width:33.333%;height:33.333%;border:1.5px solid #cbd5e1;padding:6px 8px;color:#000000;text-align:left;vertical-align:middle;box-sizing:border-box;word-break:break-word;outline:none;background-color:#ffffff;"></td><td contenteditable="true" data-row="0" data-col="1" style="width:33.333%;height:33.333%;border:1.5px solid #cbd5e1;padding:6px 8px;color:#000000;text-align:left;vertical-align:middle;box-sizing:border-box;word-break:break-word;outline:none;background-color:#ffffff;"></td><td contenteditable="true" data-row="0" data-col="2" style="width:33.333%;height:33.333%;border:1.5px solid #cbd5e1;padding:6px 8px;color:#000000;text-align:left;vertical-align:middle;box-sizing:border-box;word-break:break-word;outline:none;background-color:#ffffff;"></td></tr><tr style="height:33.333%;box-sizing:border-box;"><td contenteditable="true" data-row="1" data-col="0" style="width:33.333%;height:33.333%;border:1.5px solid #cbd5e1;padding:6px 8px;color:#000000;text-align:left;vertical-align:middle;box-sizing:border-box;word-break:break-word;outline:none;background-color:#ffffff;"></td><td contenteditable="true" data-row="1" data-col="1" style="width:33.333%;height:33.333%;border:1.5px solid #cbd5e1;padding:6px 8px;color:#000000;text-align:left;vertical-align:middle;box-sizing:border-box;word-break:break-word;outline:none;background-color:#ffffff;"></td><td contenteditable="true" data-row="1" data-col="2" style="width:33.333%;height:33.333%;border:1.5px solid #cbd5e1;padding:6px 8px;color:#000000;text-align:left;vertical-align:middle;box-sizing:border-box;word-break:break-word;outline:none;background-color:#ffffff;"></td></tr><tr style="height:33.333%;box-sizing:border-box;"><td contenteditable="true" data-row="2" data-col="0" style="width:33.333%;height:33.333%;border:1.5px solid #cbd5e1;padding:6px 8px;color:#000000;text-align:left;vertical-align:middle;box-sizing:border-box;word-break:break-word;outline:none;background-color:#ffffff;"></td><td contenteditable="true" data-row="2" data-col="1" style="width:33.333%;height:33.333%;border:1.5px solid #cbd5e1;padding:6px 8px;color:#000000;text-align:left;vertical-align:middle;box-sizing:border-box;word-break:break-word;outline:none;background-color:#ffffff;"></td><td contenteditable="true" data-row="2" data-col="2" style="width:33.333%;height:33.333%;border:1.5px solid #cbd5e1;padding:6px 8px;color:#000000;text-align:left;vertical-align:middle;box-sizing:border-box;word-break:break-word;outline:none;background-color:#ffffff;"></td></tr></tbody></table></div></foreignObject><rect class="svg-table-overlay svg-image-stroke-overlay" width="170" height="70" fill="transparent" pointer-events="none" /></g>`;
  };

  const handleDragStart = (e) => {
    const svgCode = getTableSvg();
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'table',
      svgContent: svgCode
    }));
    e.dataTransfer.setData('application/x-flipbook-element', JSON.stringify({
      type: 'table',
      svgContent: svgCode
    }));
  };

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('add-element-to-editor', {
      detail: {
        svgContent: getTableSvg()
      }
    }));
  };

  return (
    <div className="grid grid-cols-4 gap-[0.5vw]">
      {placeholders.map((_, idx) => (
        <div 
          key={idx} 
          draggable="true"
          onDragStart={handleDragStart}
          onClick={handleClick}
          className="aspect-square bg-gray-50 rounded-[0.4vw] border border-gray-100 flex items-center justify-center p-[0.5vw] cursor-pointer hover:border-gray-400 hover:shadow-sm transition-all group"
        >
          <Table2 size="1.5vw" className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
        </div>
      ))}
    </div>
  );
};

export default Table;
