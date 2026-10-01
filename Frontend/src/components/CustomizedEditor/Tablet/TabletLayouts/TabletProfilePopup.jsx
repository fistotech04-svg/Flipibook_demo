import React from 'react';
import { Icon } from '@iconify/react';

const isLightColor = (hex) => {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return false;
    let c = hex.substring(1).toUpperCase();
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    if (c.length !== 6) return false;
    const r = parseInt(c.substring(0, 2), 16); const g = parseInt(c.substring(2, 4), 16); const b = parseInt(c.substring(4, 6), 16);
    return ((0.299 * r + 0.587 * g + 0.114 * b) / 255) > 0.5;
};

// Shared Helper for RGBA Colors
const getLayoutColorRgba = (id, defaultRgb, defaultOpacity) =>
    `rgba(var(--${id}-rgb, ${defaultRgb}), var(--${id}-opacity, ${defaultOpacity}))`;

const getLayoutColor = (id, defaultColor) => `var(--${id}, ${defaultColor})`;

const TabletProfilePopup = ({
    activeLayout,
    profileSettings,
    layoutColors,
    handleContactClick,
    fallbackText,
    onClose
}) => {
    const currentProfile = (profileSettings && profileSettings[activeLayout]) ? profileSettings[activeLayout] : profileSettings;

    const name = currentProfile?.name || '';
    const about = currentProfile?.about || '';
    const contacts = currentProfile?.contacts || [];
    const hasValidContacts = contacts.some(c => c.value?.trim());
    const hasData = name?.trim() || about?.trim() || hasValidContacts;

    const getSocialIcon = (type) => {
        switch (type) {
            case 'x': return { icon: 'ri:twitter-x-fill', bg: '#000000', color: 'text-white' };
            case 'facebook': return { icon: 'ri:facebook-fill', bg: '#1877F2', color: 'text-white' };
            case 'email': return { icon: 'logos:google-gmail', bg: '#ffffff', color: '' };
            case 'instagram': return { icon: 'skill-icons:instagram', bg: 'transparent', color: '', isFull: true, isLarge: true };
            case 'phone': return { icon: 'ri:phone-fill', bg: '#ffffff', color: 'text-[#4F46E5]' };
            case 'linkedin': return { icon: 'ri:linkedin-fill', bg: '#0077B5', color: 'text-white' };
            default: return { icon: 'ph:link-bold', bg: '#ffffff', color: 'text-gray-600' };
        }
    };

    if (activeLayout == 4) {
        return (
            <div
                className="absolute left-0 top-0 bottom-0 w-[25cqw] shadow-[4px_0_24px_rgba(0,0,0,0.15)] flex flex-col pointer-events-auto z-40"
                style={{ backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF') }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-[2cqw] pb-[1cqw]">
                    <h2 className="text-[1.8cqw] font-bold" style={{ color: getLayoutColor('dropdown-text', '#555555') }}>Profile</h2>
                    <button onClick={onClose} className="transition-colors hover:opacity-70" style={{ color: getLayoutColor('dropdown-text', '#555555') }}>
                        <Icon icon="lucide:x" className="w-[2cqw] h-[2cqw]" />
                    </button>
                </div>
                <div className="w-full h-[1px] mb-[1cqw]" style={{ backgroundColor: getLayoutColor('dropdown-text', '#555555'), opacity: 0.2 }}></div>

                <div className="flex-1 overflow-y-auto p-[2cqw] custom-scrollbar">
                    {!hasData ? (
                        <div className="flex h-full items-center justify-center">
                            <span className="text-[1.5cqw] font-medium" style={{ color: getLayoutColor('dropdown-text', '#555555'), opacity: 0.6 }}>No profile found</span>
                        </div>
                    ) : (
                        <div className="space-y-[2cqw]">
                            {/* Personal Info */}
                            {(name || about) && (
                                <div className="space-y-[1cqw] mb-[2cqw]">
                                    {name && (
                                        <div className="flex items-start gap-[1cqw]">
                                            <span className="text-[1.2cqw] font-bold whitespace-nowrap" style={{ color: getLayoutColor('dropdown-text', '#555555') }}>Name:</span>
                                            <span className="text-[1.2cqw] font-medium opacity-80" style={{ color: getLayoutColor('dropdown-text', '#555555') }}>{name}</span>
                                        </div>
                                    )}
                                    {about && (
                                        <div className="flex items-start gap-[1cqw]">
                                            <span className="text-[1.2cqw] font-bold whitespace-nowrap" style={{ color: getLayoutColor('dropdown-text', '#555555') }}>About:</span>
                                            <p className="text-[1.1cqw] font-medium leading-relaxed opacity-80" style={{ color: getLayoutColor('dropdown-text', '#555555') }}>{about}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Contacts */}
                            {hasValidContacts && (
                                <div>
                                    <h3 className="text-[1.2cqw] font-bold mb-[1cqw]" style={{ color: getLayoutColor('dropdown-text', '#555555') }}>Contact</h3>
                                    <div className="flex items-center flex-wrap gap-[1cqw]">
                                        {contacts.map((contact) => {
                                            if (!contact.value) return null;
                                            const style = getSocialIcon(contact.type);
                                            return (
                                                <button
                                                    key={contact.id}
                                                    onClick={(e) => handleContactClick(e, contact)}
                                                    className="w-[3cqw] h-[3cqw] p-[0.6cqw] rounded-[0.5cqw] flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-md border border-gray-100"
                                                    style={{ backgroundColor: style.bg }}
                                                    title={contact.value}
                                                >
                                                    <Icon icon={style.icon} className={`${style.color} w-full h-full`} strokeWidth={contact.type === 'phone' ? 4 : 1} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (activeLayout == 2) {
        return (
            <div
                className={`absolute top-[9%] left-[47cqw] w-[18cqw] rounded-[1cqw] shadow-[0_2cqw_5cqw_rgba(0,0,0,0.3)] overflow-hidden flex flex-col pointer-events-auto p-[2cqw] border-[4px] border-white/80 z-50 ${!hasData ? 'justify-center items-center' : ''}`}
                onClick={(e) => e.stopPropagation()}
                style={{ backgroundColor: 'rgba(98, 95, 162, 0.95)', backdropFilter: 'blur(12px)' }}
            >
                {!hasData ? (
                    <h2 className="text-[1.4cqw] font-bold text-white tracking-wide">
                        No profile found
                    </h2>
                ) : (
                    <>
                        <div className="text-center mb-[1cqw] relative">
                            <h2 className="text-[1.4cqw] font-bold leading-tight text-white">Profile</h2>
                            <div className="h-[1px] w-full mt-[0.6cqw] bg-white/40"></div>
                        </div>

                        {/* Personal Info */}
                        {(name || about) && (
                            <div className="space-y-[1cqw] mb-[1.5cqw]">
                                {name && (
                                    <div className="flex items-start gap-[0.6cqw]">
                                        <span className="text-[1.2cqw] font-bold whitespace-nowrap text-white">Name:</span>
                                        <span className="text-[1.2cqw] font-medium truncate text-white">{name}</span>
                                    </div>
                                )}
                                {about && (
                                    <div className="flex items-start gap-[0.6cqw]">
                                        <span className="text-[1.2cqw] font-bold whitespace-nowrap text-white">About:</span>
                                        <p className="text-[1cqw] font-normal leading-tight text-left tracking-tight opacity-95 text-white/80">{about}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {hasValidContacts && (
                            <div className="relative">
                                <div className="flex items-center gap-[0.8cqw] mb-[1cqw]">
                                    <h3 className="text-[1cqw] font-bold text-white">Contact</h3>
                                    <div className="flex-1 h-[0.5px] bg-white/40"></div>
                                </div>
                                <div className="flex items-center flex-wrap gap-[0.8cqw] justify-start mt-[0.2cqw]">
                                    {contacts.map((contact) => {
                                        if (!contact.value) return null;
                                        const style = getSocialIcon(contact.type);
                                        return (
                                            <button
                                                key={contact.id}
                                                onClick={(e) => handleContactClick(e, contact)}
                                                className="w-[2.8cqw] h-[2.8cqw] p-[0.6cqw] rounded-[0.4cqw] flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-md border border-white/5"
                                                style={{ backgroundColor: style.bg }}
                                                title={contact.value}
                                            >
                                                <Icon icon={style.icon} className={`${style.color} w-full h-full`} strokeWidth={contact.type === 'phone' ? 4 : 1} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    }

    if (activeLayout == 3) {
        return (
            <div
                className={`absolute top-[6cqw] left-[42.5cqw] w-[18cqw] rounded-[1cqw] shadow-[0_1cqw_3cqw_rgba(0,0,0,0.15)] overflow-hidden flex flex-col pointer-events-auto p-[1.5cqw] z-50 border-[1px] border-gray-100 ${!hasData ? 'justify-center items-center py-[3cqw]' : ''}`}
                style={{ backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF') }}
                onClick={(e) => e.stopPropagation()}
            >
                {!hasData ? (
                    <h2 className="text-[1.2cqw] font-semibold tracking-wide" style={{ color: getLayoutColor('dropdown-text', '#555555') }}>
                        No profile found
                    </h2>
                ) : (
                    <>
                        <div className="text-center mb-[1cqw] relative">
                            <h2 className="text-[1.4cqw] font-bold leading-tight" style={{ color: getLayoutColor('dropdown-text', '#555555') }}>Profile</h2>
                            <div className="h-[1px] w-full mt-[0.6cqw]" style={{ backgroundColor: getLayoutColor('dropdown-text', '#555555'), opacity: 0.2 }}></div>
                        </div>

                        {/* Personal Info */}
                        {(name || about) && (
                            <div className="space-y-[1cqw] mb-[1.5cqw]">
                                {name && (
                                    <div className="flex items-start gap-[0.6cqw]">
                                        <span className="text-[1.2cqw] font-bold whitespace-nowrap" style={{ color: getLayoutColor('dropdown-text', '#555555') }}>Name:</span>
                                        <span className="text-[1.2cqw] font-medium truncate" style={{ color: getLayoutColor('dropdown-text', '#555555'), opacity: 0.8 }}>{name}</span>
                                    </div>
                                )}
                                {about && (
                                    <div className="flex items-start gap-[0.6cqw]">
                                        <span className="text-[1.2cqw] font-bold whitespace-nowrap" style={{ color: getLayoutColor('dropdown-text', '#555555') }}>About:</span>
                                        <p className="text-[1cqw] font-normal leading-tight text-left tracking-tight opacity-95" style={{ color: getLayoutColor('dropdown-text', '#555555'), opacity: 0.8 }}>{about}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {hasValidContacts && (
                            <div className="relative">
                                <div className="flex items-center gap-[0.8cqw] mb-[1cqw]">
                                    <h3 className="text-[1cqw] font-bold" style={{ color: getLayoutColor('dropdown-text', '#555555') }}>Contact</h3>
                                    <div className="flex-1 h-[0.5px]" style={{ backgroundColor: getLayoutColor('dropdown-text', '#555555'), opacity: 0.2 }}></div>
                                </div>
                                <div className="flex items-center flex-wrap gap-[0.8cqw] justify-start mt-[0.2cqw]">
                                    {contacts.map((contact) => {
                                        if (!contact.value) return null;
                                        const style = getSocialIcon(contact.type);
                                        return (
                                            <button
                                                key={contact.id}
                                                onClick={(e) => handleContactClick(e, contact)}
                                                className="w-[2.8cqw] h-[2.8cqw] p-[0.6cqw] rounded-[0.4cqw] flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-md border border-gray-100"
                                                style={{ backgroundColor: style.bg }}
                                                title={contact.value}
                                            >
                                                <Icon icon={style.icon} className={`${style.color} w-full h-full`} strokeWidth={contact.type === 'phone' ? 4 : 1} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    }

    if (activeLayout == 5) {
        return (
            <div
                className="absolute bottom-[11cqh] left-[40.5cqw] w-[26cqw] min-h-[16cqw] max-h-[60cqw] rounded-[1.2cqw] shadow-[0_1cqw_3cqw_rgba(0,0,0,0.1)] flex flex-col pointer-events-auto p-[2cqw] z-50"
                style={{ backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF') }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute -bottom-[1.8cqw] right-[4cqw] w-[2.5cqw] h-[2cqw]" style={{ backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF'), clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}></div>

                <div className="flex items-center justify-between mb-[1.5cqw]">
                    <h2 className="text-[1.5cqw] font-bold" style={{ color: getLayoutColor('dropdown-text', '#555555') }}>Profile</h2>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {!hasData ? (
                        <div className="flex h-full items-center justify-center pt-[2cqw]">
                            <span className="text-[1.3cqw] font-medium" style={{ color: getLayoutColor('dropdown-text', '#555555'), opacity: 0.6 }}>No content</span>
                        </div>
                    ) : (
                        <div className="space-y-[1.5cqw]">
                            {/* Personal Info */}
                            {(name || about) && (
                                <div className="space-y-[1cqw]">
                                    {name && (
                                        <div className="flex items-start gap-[0.5cqw]">
                                            <span className="text-[1.3cqw] font-bold whitespace-nowrap" style={{ color: getLayoutColor('dropdown-text', '#555555') }}>Name :</span>
                                            <span className="text-[1.3cqw] font-normal" style={{ color: getLayoutColor('dropdown-text', '#555555') }}>{name}</span>
                                        </div>
                                    )}
                                    {about && (
                                        <div className="flex items-start gap-[0.5cqw]">
                                            <span className="text-[1.3cqw] font-bold whitespace-nowrap" style={{ color: getLayoutColor('dropdown-text', '#555555') }}>About :</span>
                                            <p className="text-[1.3cqw] font-normal" style={{ color: getLayoutColor('dropdown-text', '#555555') }}>{about}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {hasValidContacts && (
                                <div>
                                    <div className="w-full h-[1px] mb-[1.5cqw] mt-[0.5cqw]" style={{ backgroundColor: getLayoutColor('dropdown-text', '#555555'), opacity: 0.2 }}></div>
                                    <h3 className="text-[1.3cqw] font-bold mb-[1cqw]" style={{ color: getLayoutColor('dropdown-text', '#555555') }}>Contact</h3>
                                    <div className="flex items-center flex-wrap gap-[1cqw]">
                                        {contacts.map((contact) => {
                                            if (!contact.value) return null;
                                            const style = getSocialIcon(contact.type);
                                            return (
                                                <button
                                                    key={contact.id}
                                                    onClick={(e) => handleContactClick(e, contact)}
                                                    className="w-[3cqw] h-[3cqw] p-[0.6cqw] rounded-[0.5cqw] flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-md border border-gray-100"
                                                    style={{ backgroundColor: style.bg }}
                                                    title={contact.value}
                                                >
                                                    <Icon icon={style.icon} className={`${style.color} w-full h-full`} strokeWidth={contact.type === 'phone' ? 4 : 1} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (activeLayout == 6) {
        return (
            <div
                className="absolute right-0 top-0 bottom-0 w-[26cqw] shadow-[-4px_0_24px_rgba(0,0,0,0.15)] flex flex-col pointer-events-auto z-40"
                style={{ backgroundColor: getLayoutColor('dropdown-bg', '#FFFFFF') }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-[2cqw] pb-[1cqw]">
                    <h2 className="text-[1.8cqw] font-bold" style={{ color: getLayoutColor('dropdown-text', '#555555') }}>Profile</h2>
                    <button onClick={onClose} className="transition-colors hover:opacity-70" style={{ color: getLayoutColor('dropdown-text', '#555555') }}>
                        <Icon icon="lucide:x" className="w-[2cqw] h-[2cqw]" />
                    </button>
                </div>
                <div className="w-full h-[1px] mb-[1cqw]" style={{ backgroundColor: getLayoutColor('dropdown-text', '#555555'), opacity: 0.2 }}></div>

                <div className="flex-1 overflow-y-auto p-[2cqw] custom-scrollbar">
                    {!hasData ? (
                        <div className="flex h-full items-center justify-center">
                            <span className="text-[1.5cqw] font-medium" style={{ color: getLayoutColor('dropdown-text', '#555555'), opacity: 0.6 }}>No profile found</span>
                        </div>
                    ) : (
                        <div className="space-y-[2cqw]">
                            {/* Personal Info */}
                            {(name || about) && (
                                <div className="space-y-[1cqw] mb-[2cqw]">
                                    {name && (
                                        <div className="flex items-start gap-[1cqw]">
                                            <span className="text-[1.2cqw] font-bold whitespace-nowrap" style={{ color: getLayoutColor('dropdown-text', '#555555') }}>Name:</span>
                                            <span className="text-[1.2cqw] font-medium opacity-80" style={{ color: getLayoutColor('dropdown-text', '#555555') }}>{name}</span>
                                        </div>
                                    )}
                                    {about && (
                                        <div className="flex items-start gap-[1cqw]">
                                            <span className="text-[1.2cqw] font-bold whitespace-nowrap" style={{ color: getLayoutColor('dropdown-text', '#555555') }}>About:</span>
                                            <p className="text-[1.1cqw] font-medium leading-relaxed opacity-80" style={{ color: getLayoutColor('dropdown-text', '#555555') }}>{about}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Contacts */}
                            {hasValidContacts && (
                                <div>
                                    <h3 className="text-[1.2cqw] font-bold mb-[1cqw]" style={{ color: getLayoutColor('dropdown-text', '#555555') }}>Contact</h3>
                                    <div className="flex items-center flex-wrap gap-[1cqw]">
                                        {contacts.map((contact) => {
                                            if (!contact.value) return null;
                                            const style = getSocialIcon(contact.type);
                                            return (
                                                <button
                                                    key={contact.id}
                                                    onClick={(e) => handleContactClick(e, contact)}
                                                    className="w-[3cqw] h-[3cqw] p-[0.6cqw] rounded-[0.5cqw] flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-md border border-gray-100"
                                                    style={{ backgroundColor: style.bg }}
                                                    title={contact.value}
                                                >
                                                    <Icon icon={style.icon} className={`${style.color} w-full h-full`} strokeWidth={contact.type === 'phone' ? 4 : 1} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Only support layout 1 and 2 for now
    if (activeLayout != 1) return null;

    return (
        <div
            className="animate-in fade-in slide-in-from-bottom-4 duration-300 relative pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
            style={{
                backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.8'),
                width: '18cqw',
                borderRadius: '1cqw',
                boxShadow: '0 0.5cqw 2cqw rgba(0,0,0,0.15)',
                border: '1px solid rgba(255,255,255,0.2)',
                overflow: 'hidden',
                backdropFilter: 'blur(12px)',
                padding: '1.2cqw',
            }}
        >
            <div className="text-center mb-[1cqw] relative">
                <h2 className="text-[1.4cqw] font-bold leading-tight" style={{ color: `var(--dropdown-text, ${fallbackText})`, opacity: "var(--dropdown-text-opacity, 1)" }}>Profile</h2>
                <div className="h-[1px] w-full mt-[0.6cqw]" style={{ backgroundColor: `color-mix(in srgb, var(--dropdown-text, ${fallbackText}) 40%, transparent)`, opacity: "var(--dropdown-text-opacity, 0.4)" }}></div>
            </div>

            {/* Personal Info */}
            {(name || about) && (
                <div className="space-y-[1cqw] mb-[1.5cqw]">
                    {name && (
                        <div className="flex items-start gap-[0.6cqw]">
                            <span
                                className="text-[1.2cqw] font-bold whitespace-nowrap"
                                style={{ color: getLayoutColor('dropdown-text', fallbackText), opacity: "var(--dropdown-text-opacity, 1)" }}
                            >
                                Name:
                            </span>
                            <span
                                className="text-[1.2cqw] font-medium truncate"
                                style={{ color: getLayoutColor('dropdown-text', fallbackText), opacity: "var(--dropdown-text-opacity, 0.8)" }}
                            >
                                {name}
                            </span>
                        </div>
                    )}
                    {about && (
                        <div className="flex items-start gap-[0.6cqw]">
                            <span
                                className="text-[1.2cqw] font-bold whitespace-nowrap"
                                style={{ color: getLayoutColor('dropdown-text', fallbackText), opacity: "var(--dropdown-text-opacity, 1)" }}
                            >
                                About:
                            </span>
                            <p
                                className="text-[1cqw] font-normal leading-tight text-left tracking-tight opacity-95"
                                style={{ color: getLayoutColor('dropdown-text', fallbackText), opacity: "var(--dropdown-text-opacity, 0.8)" }}
                            >
                                {about}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {hasValidContacts && (
                <div className="relative">
                    <div className="flex items-center gap-[0.8cqw] mb-[1cqw]">
                        <h3
                            className="text-[1cqw] font-bold"
                            style={{ color: `var(--dropdown-text, ${fallbackText})`, opacity: "var(--dropdown-text-opacity, 1)" }}
                        >
                            Contact
                        </h3>
                        <div className="flex-1 h-[0.5px]" style={{ backgroundColor: `color-mix(in srgb, ${getLayoutColor('dropdown-text', fallbackText)} 40%, transparent)`, opacity: "var(--dropdown-text-opacity, 0.4)" }}></div>
                    </div>

                    <div className="flex items-center flex-wrap gap-[0.8cqw] justify-start mt-[0.2cqw]">
                        {contacts.map((contact) => {
                            if (!contact.value) return null;
                            const style = getSocialIcon(contact.type);

                            return (
                                <button
                                    key={contact.id}
                                    onClick={(e) => handleContactClick(e, contact)}
                                    className="w-[2.8cqw] h-[2.8cqw] p-[0.6cqw] rounded-[0.4cqw] flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-md border border-white/5"
                                    style={{ backgroundColor: style.bg }}
                                    title={contact.value}
                                >
                                    <Icon
                                        icon={style.icon}
                                        className={`${style.color} w-full h-full`}
                                        strokeWidth={contact.type === 'phone' ? 4 : 1}
                                    />
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TabletProfilePopup;
