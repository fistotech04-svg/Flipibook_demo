import React, { useMemo } from 'react';
import { MOBILE_LAYOUT_REGISTRY } from './MobileLayouts';

/**
 * MobileLayoutRenderer handles the dynamic switching between 
 * different mobile layout designs based on the activeLayout index.
 */
const MobileLayoutRenderer = ({ activeLayout = 1, ...props }) => {
    // Determine which layout component to use
    // Falls back to Layout 1 if the requested ID is not registered
    const ActiveLayoutComponent = useMemo(() => {
        return MOBILE_LAYOUT_REGISTRY[activeLayout] || MOBILE_LAYOUT_REGISTRY[1];
    }, [activeLayout]);

    if (!ActiveLayoutComponent) {
        return <div className="text-white p-4">Layout not found</div>;
    }

    return <ActiveLayoutComponent activeLayout={activeLayout} {...props} />;
};

export default MobileLayoutRenderer;
