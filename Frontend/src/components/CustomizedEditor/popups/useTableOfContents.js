import { useState, useMemo } from 'react';

export const useTableOfContents = (settings) => {
    const safeSettings = settings || {};
    const [searchQuery, setSearchQuery] = useState('');

    const {
        addSearch = true,
        addPageNumber = true,
        addSerialNumberHeading = true,
        addSerialNumberSubheading = true,
        content: propContent,
        items: propItems,
        toc: propToc
    } = safeSettings;

    // Robust extraction: check content, then items, then nested toc items
    const content = (Array.isArray(propContent) && propContent.length > 0)
        ? propContent
        : (Array.isArray(propItems) && propItems.length > 0)
            ? propItems
            : (Array.isArray(propToc?.items) && propToc.items.length > 0)
                ? propToc.items
                : (propContent || propItems || propToc?.items || []);

    const safeContent = Array.isArray(content) ? content : [];

    const filteredContent = useMemo(() => safeContent.map(heading => {
        const title = (heading?.title || heading?.label || '').toString();
        const matchesHeading = !searchQuery || title.toLowerCase().includes(searchQuery.toLowerCase());
        const filteredSubheadings = heading?.subheadings?.filter(sub => {
            const subTitle = (sub?.title || sub?.label || '').toString();
            return !searchQuery || subTitle.toLowerCase().includes(searchQuery.toLowerCase());
        }) || [];

        if (matchesHeading || filteredSubheadings.length > 0) {
            return {
                ...heading,
                title: title, // ensure title exists
                subheadings: matchesHeading ? (heading.subheadings || []) : filteredSubheadings
            };
        }
        return null;
    }).filter(Boolean), [safeContent, searchQuery]);

    return {
        searchQuery,
        setSearchQuery,
        addSearch,
        addPageNumber,
        addSerialNumberHeading,
        addSerialNumberSubheading,
        filteredContent
    };
};
