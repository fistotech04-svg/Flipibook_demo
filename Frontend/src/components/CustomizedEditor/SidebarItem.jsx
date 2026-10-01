import React from "react";
import { Icon } from "@iconify/react";

const SidebarItem = ({
  id,
  icon,
  label,
  isOpen,
  onClick,
  children,
  hasDropdown = true,
  isActive = false,
}) => {
  return (
    <div className="flex flex-col px-[0.75vw] py-[0.25vw]">
      <button
        id={id}
        onClick={onClick}
        className={`w-full flex items-center justify-between p-[0.75vw] rounded-[0.75vw] transition-all duration-300 ${
          isActive 
            ? 'bg-[#EC5137]/5 border border-[#EC5137] text-[#EC5137] active-sidebar-item' 
            : 'bg-white text-gray-900 border border-transparent hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-[1vw]">
          <Icon 
            icon={icon} 
            className={`w-[1.25vw] h-[1.25vw] transition-colors ${isActive ? 'text-[#EC5137]' : 'text-black'}`} 
          />
          <span className={`text-[0.8125vw] font-semibold transition-colors ${isActive ? 'text-[#EC5137]' : 'text-gray-900'}`}>
            {label}
          </span>
        </div>
        {hasDropdown && (
          <Icon
            icon="lucide:chevron-down"
            className={`w-[1vw] h-[1vw] transition-all duration-300 ${
              isActive ? 'text-[#EC5137]' : 'text-gray-600'
            } ${isOpen ? "rotate-180" : "rotate-0"}`}
          />
        )}
      </button>
      
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[31.25vw] opacity-100 mt-[0.25vw] mb-[0.5vw]' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="pt-[0.25vw]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SidebarItem;
