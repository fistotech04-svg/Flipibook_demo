import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { Plus, Trash2 } from 'lucide-react';
import PremiumDropdown from './PremiumDropdown';
import ColorPallet from './ColorPallet';

import Template1Icon from '../../assets/quick template/Frame 1171276601 (1).svg';
import Template2Icon from '../../assets/quick template/Frame 1171276601 (2).svg';
import Template3Icon from '../../assets/quick template/Frame 1171276601 (3).svg';
import Template4Icon from '../../assets/quick template/Frame 1171276601 (4).svg';
import Template5Icon from '../../assets/quick template/Frame 1171276601 (5).svg';

const fontFamilies = [
  'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
  'Helvetica', 'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
  'Inter', 'Playfair Display', 'Oswald', 'Merriweather'
];

const Switch = ({ enabled, onChange }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onChange(!enabled);
    }}
    className={`relative block w-[1.8vw] h-[1vw] rounded-[1vw] transition-all duration-200 ease-in-out shadow-[inset_0_0.05vw_0.1vw_rgba(0,0,0,0.3)] outline-none shrink-0 cursor-pointer ${enabled ? 'bg-[#4A3AFF]' : 'bg-[#bbbbbb]'}`}
  >
    <div
      className={`absolute top-[0.1vw] w-[0.8vw] h-[0.8vw] bg-white rounded-full transition-all duration-200 ease-in-out shadow-[0_0.05vw_0.1vw_rgba(0,0,0,0.4)] ${enabled ? 'left-[0.9vw]' : 'left-[0.1vw]'}`}
    />
  </button>
);

const LeadForm = ({ onBack, settings, onUpdate, pages = [] }) => {
  const [isColorOpen, setIsColorOpen] = useState(true);

  const updateNested = (category, field, value) => {
    onUpdate({
      ...settings,
      [category]: {
        ...settings[category],
        [field]: value
      }
    });
  };

  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [activeDeleteMenuId, setActiveDeleteMenuId] = useState(null);
  const [isAddFieldPopupOpen, setIsAddFieldPopupOpen] = useState(false);
  const [activePopupTab, setActivePopupTab] = useState('templates');

  useEffect(() => {
    if (settings.enabled && (!settings.fields || settings.fields.length === 0)) {
      onUpdate({
        ...settings,
        fields: [
          { id: Date.now().toString(), type: 'name', label: 'Full Name', placeholder: 'Enter your Name' },
          { id: (Date.now() + 1).toString(), type: 'email', label: 'Email Address', placeholder: 'Enter your Email' },
          { id: (Date.now() + 2).toString(), type: 'phone', label: 'Phone Number', placeholder: 'Enter your Phone Number' }
        ]
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!activeDropdownId) return;
      const activeContainer = document.getElementById(`dropdown-container-${activeDropdownId}`);
      if (activeContainer && !activeContainer.contains(event.target)) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdownId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!activeDeleteMenuId) return;
      const activeContainer = document.getElementById(`delete-menu-${activeDeleteMenuId}`);
      if (activeContainer && !activeContainer.contains(event.target)) {
        setActiveDeleteMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDeleteMenuId]);

  const handleAddField = (type = 'empty') => {
    const newField = { id: Date.now().toString(), type };
    if (type === 'dropdown' || type === 'radio' || type === 'checkbox') {
      newField.label = type === 'radio' ? 'Select Option' : type === 'dropdown' ? 'Select Option' : type === 'checkbox' ? 'Interested Products' : '';
      newField.options = (type === 'dropdown' || type === 'radio') ? ['Option 1', 'Option 2'] : type === 'checkbox' ? ['Option 1', 'Option 2'] : ['Option 1', 'Option 2'];
    } else if (type === 'feedback') {
      newField.label = 'feedback';
      newField.placeholder = 'Enter your Feedback';
    } else if (type === 'rating') {
      newField.label = 'Provide Ratings';
    }
    const newFields = [...(settings.fields || []), newField];
    onUpdate({ ...settings, fields: newFields });
    setIsAddFieldPopupOpen(false);
  };

  const handleTypeChange = (id, type) => {
    const defaultPlaceholders = {
      name: 'Enter your Name',
      email: 'Enter your Email',
      company: 'Enter your company name',
      phone: 'Enter your Phone Number',
      services: 'Select Service',
      enquiry: 'Enter your Enquiry'
    };
    const newFields = (settings.fields || []).map(f =>
      f.id === id ? { ...f, type, placeholder: defaultPlaceholders[type] } : f
    );
    onUpdate({ ...settings, fields: newFields });
    setActiveDropdownId(null);
  };

  const handleRemoveField = (id) => {
    const newFields = (settings.fields || []).filter(f => f.id !== id);
    onUpdate({ ...settings, fields: newFields });
  };

  const handleFieldChange = (id, placeholder, label) => {
    const newFields = (settings.fields || []).map(f =>
      f.id === id ? { ...f, placeholder, ...(label !== undefined && { label }) } : f
    );
    onUpdate({ ...settings, fields: newFields });
  };

  const handleOptionChange = (fieldId, optionIndex, value) => {
    const newFields = (settings.fields || []).map(f => {
      if (f.id === fieldId) {
        const newOptions = [...(f.options || [])];
        newOptions[optionIndex] = value;
        return { ...f, options: newOptions };
      }
      return f;
    });
    onUpdate({ ...settings, fields: newFields });
  };

  const handleAddOption = (fieldId) => {
    const newFields = (settings.fields || []).map(f => {
      if (f.id === fieldId) {
        const nextIndex = (f.options || []).length + 1;
        return { ...f, options: [...(f.options || []), `Option ${nextIndex}`] };
      }
      return f;
    });
    onUpdate({ ...settings, fields: newFields });
  };

  const handleRemoveOption = (fieldId, optionIndex) => {
    const newFields = (settings.fields || []).map(f => {
      if (f.id === fieldId) {
        const newOptions = [...(f.options || [])];
        newOptions.splice(optionIndex, 1);
        return { ...f, options: newOptions };
      }
      return f;
    });
    onUpdate({ ...settings, fields: newFields });
  };

  const fieldOptions = [
    { type: 'name', label: 'Full Name', icon: 'lucide:user' },
    { type: 'email', label: 'Email Address', icon: 'logos:google-gmail' },
    { type: 'company', label: 'Company Name', icon: 'lucide:building-2' },
    { type: 'phone', label: 'Phone Number', icon: 'lucide:phone' },
    { type: 'services', label: 'Services', icon: 'lucide:settings' },
    { type: 'enquiry', label: 'Enquiry', icon: 'lucide:message-square' }
  ];



  const updateAppearance = (field, value) => {
    onUpdate({
      ...settings,
      appearance: {
        ...settings.appearance,
        [field]: value
      }
    });
  };

  const quickTemplates = [
    {
      id: 'basic-contact',
      name: 'Basic Contact Form',
      icon: Template1Icon,
      config: {
        formTitle: 'Get in Touch',
        leadText: 'Share your details and we will contact you shortly',
        buttonText: 'SUBMIT',
        fields: [
          { id: Date.now().toString() + '-1', type: 'name', label: 'Full Name', placeholder: 'Enter your Name' },
          { id: Date.now().toString() + '-2', type: 'email', label: 'Email Address', placeholder: 'Enter your Email' },
          { id: Date.now().toString() + '-3', type: 'phone', label: 'Phone Number', placeholder: 'Enter your Phone Number' }
        ]
      }
    },
    {
      id: 'business-inquiry',
      name: 'Business Inquiry',
      icon: Template2Icon,
      config: {
        formTitle: 'Request More Information',
        leadText: 'Tell us about your requirements and our team will reach out.',
        buttonText: 'Request Callback',
        fields: [
          { id: Date.now().toString() + '-1', type: 'name', label: 'Full Name', placeholder: 'Enter your Name' },
          { id: Date.now().toString() + '-2', type: 'email', label: 'Email Address', placeholder: 'Enter your Email' },
          { id: Date.now().toString() + '-3', type: 'company', label: 'Company Name', placeholder: 'Enter your company name' },
          { id: Date.now().toString() + '-4', type: 'phone', label: 'Phone Number', placeholder: 'Enter your Phone Number' },
          { 
            id: Date.now().toString() + '-5', 
            type: 'dropdown', 
            label: 'Interested Service', 
            options: ['Web Development', 'Mobile App Development'] 
          }
        ]
      }
    },
    {
      id: 'product-inquiry',
      name: 'Product Inquiry',
      icon: Template3Icon,
      config: {
        formTitle: 'Interested in Our Products?',
        leadText: 'Let us know what you are interested in.',
        buttonText: 'Get Details',
        fields: [
          { id: Date.now().toString() + '-1', type: 'name', label: 'Full Name', placeholder: 'Enter your Name' },
          { id: Date.now().toString() + '-2', type: 'email', label: 'Email Address', placeholder: 'Enter your Email' },
          { id: Date.now().toString() + '-3', type: 'phone', label: 'Phone Number', placeholder: 'Enter your Phone Number' },
          { 
            id: Date.now().toString() + '-4', 
            type: 'checkbox', 
            label: 'Interested Products', 
            options: ['500 ml Round', '1000 ml round'] 
          }
        ]
      }
    },
    {
      id: 'feedback-form',
      name: 'Feedback Form',
      icon: Template4Icon,
      config: {
        formTitle: 'Share Your Feedback',
        leadText: 'We value your feedback. Help us improve.',
        buttonText: 'Submit Feedback',
        fields: [
          { id: Date.now().toString() + '-1', type: 'name', label: 'Full Name', placeholder: 'Enter your Name' },
          { id: Date.now().toString() + '-2', type: 'email', label: 'Email Address', placeholder: 'Enter your Email' },
          { id: Date.now().toString() + '-3', type: 'rating', label: 'Provide Ratings' },
          { id: Date.now().toString() + '-4', type: 'feedback', label: 'feedback', placeholder: 'Enter your Feedback' }
        ]
      }
    },
    {
      id: 'event-registration',
      name: 'Event Registration',
      icon: Template5Icon,
      config: {
        formTitle: 'Register Now',
        leadText: 'Secure your spot for the upcoming event.',
        buttonText: 'Register',
        fields: [
          { id: Date.now().toString() + '-1', type: 'name', label: 'Full Name', placeholder: 'Enter your Name' },
          { id: Date.now().toString() + '-2', type: 'email', label: 'Email Address', placeholder: 'Enter your Email' },
          { id: Date.now().toString() + '-3', type: 'phone', label: 'Phone Number', placeholder: 'Enter your Phone Number' },
          { 
            id: Date.now().toString() + '-4', 
            type: 'dropdown', 
            label: 'Number of Tickets', 
            options: ['1', '2'] 
          }
        ]
      }
    }
  ];

  const handleSelectTemplate = (template) => {
    onUpdate({
      ...settings,
      enabled: true,
      formTitle: template.config.formTitle,
      leadText: template.config.leadText,
      buttonText: template.config.buttonText,
      fields: template.config.fields
    });
    setIsAddFieldPopupOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-white relative overflow-visible">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Sub-header */}
      <div className="h-[8vh] flex items-center justify-between px-[1vw] border-b border-gray-100">
        <div className="flex items-center gap-[0.5vw]">
          <Icon icon="fluent:form-48-regular" className="w-[1vw] h-[1vw] text-gray-700 font-semibold" />
          <span className="text-[1vw] font-semibold text-gray-900">Lead Form</span>
        </div>
        <button onClick={onBack} className="text-gray-600 hover:text-gray-900">
          <Icon icon="ic:round-arrow-back" className="w-[1.25vw] h-[1.25vw]" />
        </button>
      </div>

      <div className="flex items-center justify-between pt-[1vw] pr-[1vw] pl-[1vw]">
        <div className="flex flex-col">
          <span className="text-[0.8vw] font-semibold text-gray-900 whitespace-nowrap">Turn ON/OFF the Lead Form</span>
          <p className="text-[0.6vw] text-gray-400 font-sm mt-[0.2vw]  max-w-[15vw]">
            Turning this OFF will disable all lead form settings below, and turning it ON will enable them again<span className="text-red-500">*</span>
          </p>
        </div>
        <Switch
          enabled={settings.enabled}
          onChange={(val) => {
            if (val && (!settings.fields || settings.fields.length === 0)) {
              onUpdate({
                ...settings,
                enabled: true,
                formTitle: settings.formTitle || 'Get in Touch',
                leadText: settings.leadText || 'Share your details and we will contact you shortly',
                buttonText: settings.buttonText || 'SUBMIT',
                fields: [
                  { id: Date.now().toString() + '-1', type: 'name', label: 'Full Name', placeholder: 'Enter your Name' },
                  { id: Date.now().toString() + '-2', type: 'email', label: 'Email Address', placeholder: 'Enter your Gmail' },
                  { id: Date.now().toString() + '-3', type: 'phone', label: 'Phone Number', placeholder: 'Enter your Phone Number' }
                ]
              });
            } else {
              onUpdate({ ...settings, enabled: val });
            }
          }}
        />
      </div>

      <div
        className={`flex-1 ${settings.enabled ? 'overflow-y-auto' : 'overflow-hidden'} p-[1vw] space-y-[1vw] hide-scrollbar`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className={`space-y-[1vw] transition-all duration-300 ${!settings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>

          {/* Customize your Form */}
          <div className="space-y-[1vw]">
            <div className="flex items-center gap-[0.5vw]">
              <h3 className="text-[0.8vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Customize your Form</h3>
              <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1vw' }}> </div>
            </div>

            <div className="space-y-[1vw]">
              <div className="flex flex-col gap-[0.4vw]">
                <label className="text-[0.7vw] font-medium text-gray-900">Title :</label>
                <input
                  type="text"
                  value={settings.formTitle !== undefined ? settings.formTitle : 'Request More Information'}
                  onChange={(e) => onUpdate({ ...settings, formTitle: e.target.value })}
                  className="w-full border border-gray-200 rounded-[0.4vw] p-[0.6vw] text-[0.7vw] text-gray-600 focus:outline-none focus:border-indigo-500 bg-white shadow-sm"
                  placeholder="Request More Information"
                />
              </div>

              <div className="flex flex-col gap-[0.4vw]">
                <label className="text-[0.7vw] font-medium text-gray-900">Description :</label>
                <textarea
                  value={settings.leadText !== undefined ? settings.leadText : 'Tell us about your requirements and our team will reach out.'}
                  onChange={(e) => onUpdate({ ...settings, leadText: e.target.value })}
                  className="w-full h-[4.5vw] border border-gray-200 rounded-[0.4vw] p-[0.6vw] text-[0.7vw] text-gray-600 focus:outline-none focus:border-indigo-500 resize-none bg-white shadow-sm"
                  placeholder="Tell us about your requirements and our team will reach out."
                />
              </div>

              <div className="flex flex-col gap-[0.4vw]">
                <label className="text-[0.7vw] font-medium text-gray-900">Button Text :</label>
                <input
                  type="text"
                  value={settings.buttonText !== undefined ? settings.buttonText : 'Request Callback'}
                  onChange={(e) => onUpdate({ ...settings, buttonText: e.target.value })}
                  className="w-full border border-gray-200 rounded-[0.4vw] p-[0.6vw] text-[0.7vw] text-gray-600 focus:outline-none focus:border-indigo-500 bg-white shadow-sm"
                  placeholder="Request Callback"
                />
              </div>
            </div>
          </div>

          {/* Add Fields */}
          <div className="space-y-[1vw] font-sans">
            <div className="flex items-center gap-[0.5vw]">
              <h3 className="text-[0.8vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Add Fields</h3>
              <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}> </div>
            </div>

            <div className="space-y-[1vw]">
              {settings.fields?.map((field) => {
                if (field.type === 'dropdown' || field.type === 'radio' || field.type === 'checkbox') {
                  return (
                    <div
                      key={field.id}
                      className="bg-white border border-gray-200 rounded-[0.5vw] overflow-visible shadow-sm"
                    >
                      {/* Card Header */}
                      <div className="flex items-center justify-between px-[0.75vw] py-[0.5vw] border-b border-gray-100">
                        <span className="text-[0.75vw] text-gray-800 font-medium">
                          {field.type === 'radio' ? 'Radio Button' : field.type === 'checkbox' ? 'Check Box' : 'Drop Down'}
                        </span>
                        <div className="relative" id={`delete-menu-${field.id}`}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setActiveDeleteMenuId(activeDeleteMenuId === field.id ? null : field.id); }}
                            className="text-gray-600 hover:text-gray-900 transition-colors p-[0.2vw] rounded-full hover:bg-gray-100"
                            title="More Options"
                          >
                            <Icon icon="lucide:more-vertical" width="1vw" />
                          </button>
                          {activeDeleteMenuId === field.id && (
                            <div className="absolute right-0 top-[100%] mt-[0.2vw] bg-white border border-gray-200 shadow-md rounded-[0.4vw] p-[0.2vw] z-[50] min-w-[7vw]">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRemoveField(field.id); setActiveDeleteMenuId(null); }}
                                className="flex items-center gap-[0.4vw] w-full px-[0.5vw] py-[0.4vw] text-red-500 hover:bg-red-50 rounded-[0.3vw] text-[0.7vw] font-medium transition-colors"
                              >
                                <Icon icon="lucide:trash-2" width="0.8vw" />
                                Delete Field
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-[0.75vw] space-y-[0.75vw]">
                        {/* Label Row */}
                        <div className="flex items-center gap-[0.5vw]">
                          <label className="text-[0.7vw] font-medium text-gray-700 w-[3.5vw]">Label :</label>
                          <input
                            type="text"
                            value={field.label || ''}
                            onChange={(e) => handleFieldChange(field.id, field.placeholder, e.target.value)}
                            className="flex-1 border border-gray-200 rounded-[0.4vw] px-[0.5vw] py-[0.3vw] text-[0.7vw] text-gray-600 outline-none focus:border-indigo-500 h-[1.8vw] bg-white w-full normal-case"
                            placeholder="Enter label"
                          />
                        </div>

                        {/* Options */}
                        <div className="flex items-start gap-[0.5vw]">
                          <label className="text-[0.7vw] font-medium text-gray-700 w-[3.5vw] pt-[0.4vw]">Options :</label>
                          <div className="flex-1 space-y-[0.4vw]">
                            {(field.options || []).map((opt, idx) => (
                              <div key={idx} className="flex items-center gap-[0.5vw]">
                                <div className="w-[1.2vw] h-[1.2vw] rounded-full bg-gray-600 text-white flex items-center justify-center text-[0.6vw] font-semibold shrink-0">
                                  {idx + 1}
                                </div>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => handleOptionChange(field.id, idx, e.target.value)}
                                  className="flex-1 border border-gray-200 rounded-[0.4vw] px-[0.5vw] py-[0.3vw] text-[0.7vw] text-gray-600 outline-none focus:border-indigo-500 h-[1.8vw] bg-white w-full normal-case"
                                  placeholder={`Option ${idx + 1}`}
                                />
                                {(field.options || []).length > 2 && (
                                  <button
                                    onClick={() => handleRemoveOption(field.id, idx)}
                                    className="text-red-400 hover:text-red-600 hover:bg-red-50 p-[0.3vw] rounded-[0.3vw] transition-colors flex-shrink-0"
                                    title="Remove Option"
                                  >
                                    <Icon icon="lucide:trash-2" className="w-[0.9vw] h-[0.9vw]" />
                                  </button>
                                )}
                              </div>
                            ))}
                            <div className="flex justify-end pt-[0.2vw]">
                              <button
                                onClick={() => handleAddOption(field.id)}
                                className="flex items-center gap-[0.2vw] px-[0.6vw] py-[0.3vw] bg-gray-100 rounded-[0.4vw] text-gray-600 text-[0.65vw] font-medium hover:bg-gray-200 transition-colors"
                              >
                                <Plus size="0.7vw" /> Add
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                } else if (field.type === 'rating') {
                  return (
                    <div
                      key={field.id}
                      className="bg-white border border-gray-200 rounded-[0.5vw] overflow-visible shadow-sm"
                    >
                      {/* Card Header */}
                      <div className="flex items-center justify-between px-[0.75vw] py-[0.5vw] border-b border-gray-100">
                        <span className="text-[0.75vw] text-gray-800 font-medium">Ratings</span>
                        <div className="relative" id={`delete-menu-${field.id}`}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setActiveDeleteMenuId(activeDeleteMenuId === field.id ? null : field.id); }}
                            className="text-gray-600 hover:text-gray-900 transition-colors p-[0.2vw] rounded-full hover:bg-gray-100"
                            title="More Options"
                          >
                            <Icon icon="lucide:more-vertical" width="1vw" />
                          </button>
                          {activeDeleteMenuId === field.id && (
                            <div className="absolute right-0 top-[100%] mt-[0.2vw] bg-white border border-gray-200 shadow-md rounded-[0.4vw] p-[0.2vw] z-[50] min-w-[7vw]">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRemoveField(field.id); setActiveDeleteMenuId(null); }}
                                className="flex items-center gap-[0.4vw] w-full px-[0.5vw] py-[0.4vw] text-red-500 hover:bg-red-50 rounded-[0.3vw] text-[0.7vw] font-medium transition-colors"
                              >
                                <Icon icon="lucide:trash-2" width="0.8vw" />
                                Delete Field
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-[0.75vw] space-y-[0.75vw]">
                        {/* Label Row */}
                        <div className="flex items-center gap-[0.5vw]">
                          <label className="text-[0.7vw] font-medium text-gray-700 w-[2.5vw]">Label :</label>
                          <input
                            type="text"
                            value={field.label || ''}
                            onChange={(e) => handleFieldChange(field.id, field.placeholder, e.target.value)}
                            className="flex-1 border border-gray-200 rounded-[0.4vw] px-[0.5vw] py-[0.3vw] text-[0.7vw] text-gray-600 outline-none focus:border-indigo-500 h-[1.8vw] bg-white w-full normal-case"
                            placeholder="Provide Ratings"
                          />
                        </div>

                        {/* Input Row */}
                        <div className="flex items-center gap-[0.5vw]">
                          <label className="text-[0.7vw] font-medium text-gray-700 w-[2.5vw]">Input :</label>
                          <div className="flex items-center gap-[0.3vw]">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Icon key={star} icon="lucide:star" className="w-[1.4vw] h-[1.4vw] text-yellow-400 stroke-[1.5]" />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                } else if (field.type === 'feedback' || field.type === 'enquiry') {
                  return (
                    <div
                      key={field.id}
                      className="bg-white border border-gray-200 rounded-[0.5vw] overflow-visible shadow-sm"
                    >
                      {/* Card Header */}
                      <div className="flex items-center justify-between px-[0.75vw] py-[0.5vw] border-b border-gray-100">
                        <span className="text-[0.75vw] text-gray-800 font-medium">Text Area</span>
                        <div className="relative" id={`delete-menu-${field.id}`}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setActiveDeleteMenuId(activeDeleteMenuId === field.id ? null : field.id); }}
                            className="text-gray-600 hover:text-gray-900 transition-colors p-[0.2vw] rounded-full hover:bg-gray-100"
                            title="More Options"
                          >
                            <Icon icon="lucide:more-vertical" width="1vw" />
                          </button>
                          {activeDeleteMenuId === field.id && (
                            <div className="absolute right-0 top-[100%] mt-[0.2vw] bg-white border border-gray-200 shadow-md rounded-[0.4vw] p-[0.2vw] z-[50] min-w-[7vw]">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRemoveField(field.id); setActiveDeleteMenuId(null); }}
                                className="flex items-center gap-[0.4vw] w-full px-[0.5vw] py-[0.4vw] text-red-500 hover:bg-red-50 rounded-[0.3vw] text-[0.7vw] font-medium transition-colors"
                              >
                                <Icon icon="lucide:trash-2" width="0.8vw" />
                                Delete Field
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-[0.75vw] space-y-[0.75vw]">
                        {/* Label Row */}
                        <div className="flex items-center gap-[0.5vw]">
                          <label className="text-[0.7vw] font-medium text-gray-700 w-[2.5vw]">Label :</label>
                          <input
                            type="text"
                            value={field.label || ''}
                            onChange={(e) => handleFieldChange(field.id, field.placeholder, e.target.value)}
                            className="flex-1 border border-gray-200 rounded-[0.4vw] px-[0.5vw] py-[0.3vw] text-[0.7vw] text-gray-600 outline-none focus:border-indigo-500 h-[1.8vw] bg-white w-full normal-case"
                            placeholder="Enter label"
                          />
                        </div>

                        {/* Input Row */}
                        <div className="flex items-center gap-[0.5vw]">
                          <label className="text-[0.7vw] font-medium text-gray-700 w-[2.5vw]">Input :</label>
                          <input
                            type="text"
                            value={field.placeholder || ''}
                            onChange={(e) => handleFieldChange(field.id, e.target.value, field.label)}
                            className="flex-1 border border-gray-200 rounded-[0.4vw] px-[0.5vw] py-[0.3vw] text-[0.7vw] text-gray-600 outline-none focus:border-indigo-500 h-[1.8vw] bg-white w-full normal-case"
                            placeholder="Enter your Name"
                          />
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={field.id}
                  className="bg-white border border-gray-200 rounded-[0.5vw] overflow-visible shadow-sm"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between px-[0.75vw] py-[0.5vw] border-b border-gray-100">
                    <span className="text-[0.75vw] text-gray-800 font-medium">Input Box</span>
                    <div className="relative" id={`delete-menu-${field.id}`}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveDeleteMenuId(activeDeleteMenuId === field.id ? null : field.id); }}
                        className="text-gray-600 hover:text-gray-900 transition-colors p-[0.2vw] rounded-full hover:bg-gray-100"
                        title="More Options"
                      >
                        <Icon icon="lucide:more-vertical" width="1vw" />
                      </button>
                      {activeDeleteMenuId === field.id && (
                        <div className="absolute right-0 top-[100%] mt-[0.2vw] bg-white border border-gray-200 shadow-md rounded-[0.4vw] p-[0.2vw] z-[50] min-w-[7vw]">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveField(field.id); setActiveDeleteMenuId(null); }}
                            className="flex items-center gap-[0.4vw] w-full px-[0.5vw] py-[0.4vw] text-red-500 hover:bg-red-50 rounded-[0.3vw] text-[0.7vw] font-medium transition-colors"
                          >
                            <Icon icon="lucide:trash-2" width="0.8vw" />
                            Delete Field
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Card Body */}
                  <div className="p-[0.75vw] space-y-[0.75vw]">
                    {/* Label Row */}
                    <div className="flex items-center gap-[0.5vw] relative">
                      <label className="text-[0.7vw] font-medium text-gray-700 w-[2.5vw]">Label :</label>
                      <div className="flex-1 flex items-center border border-gray-200 rounded-[0.4vw] focus-within:border-indigo-500 bg-white">
                        {/* Dropdown Trigger */}
                        <div
                          className="h-[1.8vw] px-[0.4vw] border-r border-gray-200 flex items-center justify-center cursor-pointer bg-gray-50/50 rounded-l-[0.4vw] hover:bg-gray-100"
                          onClick={() => setActiveDropdownId(activeDropdownId === field.id ? null : field.id)}
                          id={`dropdown-container-${field.id}`}
                        >
                          {field.type === 'email' ? (
                            <Icon icon="logos:google-gmail" width="0.8vw" />
                          ) : field.type === 'name' ? (
                            <Icon icon="lucide:user" width="0.8vw" className="text-gray-900" />
                          ) : field.type === 'company' ? (
                            <Icon icon="lucide:building-2" width="0.8vw" className="text-gray-900" />
                          ) : field.type === 'phone' ? (
                            <Icon icon="lucide:phone" width="0.8vw" className="text-gray-400" />
                          ) : field.type === 'services' ? (
                            <Icon icon="lucide:settings" width="0.8vw" className="text-gray-900" />
                          ) : field.type === 'enquiry' || field.type === 'feedback' ? (
                            <Icon icon="lucide:message-square" width="0.8vw" className="text-gray-900" />
                          ) : (
                            <Icon icon="lucide:user" width="0.8vw" className="text-gray-900" />
                          )}
                          <Icon icon="fluent:chevron-down-12-regular" width="0.6vw" className="ml-[0.2vw] text-gray-500" />
                        </div>
                        
                        {/* Dropdown Content */}
                        {activeDropdownId === field.id && (
                          <div className="absolute top-[2vw] left-[3vw] z-50 bg-white rounded-[0.5vw] shadow-lg p-[0.5vw] w-[10vw] border border-gray-100 animate-in fade-in zoom-in-95 duration-100">
                            <div className="space-y-[0.5vw]">
                              {fieldOptions
                                .filter(opt => !settings.fields.some(f => f.type === opt.type && f.id !== field.id))
                                .map((opt) => (
                                  <div
                                    key={opt.type}
                                    className="flex items-center gap-[0.75vw] p-[0.4vw] hover:bg-gray-50 rounded-[0.3vw] cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTypeChange(field.id, opt.type);
                                    }}
                                  >
                                    {opt.type === 'email' ? (
                                      <Icon icon="logos:google-gmail" width="0.9vw" />
                                    ) : (
                                      <Icon icon={opt.icon} width="0.9vw" className="text-gray-600" />
                                    )}
                                    <span className="text-[0.7vw] font-medium text-gray-700">{opt.label}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Label Input */}
                        <input
                          type="text"
                          value={field.label !== undefined ? field.label : (fieldOptions.find(o => o.type === field.type)?.label || field.type)}
                          onChange={(e) => handleFieldChange(field.id, field.placeholder, e.target.value)}
                          className="flex-1 px-[0.5vw] py-[0.3vw] text-[0.7vw] text-gray-600 outline-none bg-transparent h-[1.8vw] w-full normal-case"
                          placeholder="Label name"
                          disabled={field.type === 'empty'}
                        />
                      </div>
                    </div>

                    {/* Input Placeholder Row */}
                    <div className="flex items-center gap-[0.5vw]">
                      <label className="text-[0.7vw] font-medium text-gray-700 w-[2.5vw]">Input :</label>
                      <input
                        type="text"
                        value={field.placeholder || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value, field.label)}
                        placeholder={field.type === 'empty' ? 'Select a type...' : `Enter your ${field.type === 'email' ? 'Email' : fieldOptions.find(o => o.type === field.type)?.label || field.type}`}
                        className="flex-1 border border-gray-200 rounded-[0.4vw] px-[0.5vw] py-[0.3vw] text-[0.7vw] text-gray-600 outline-none focus:border-indigo-500 h-[1.8vw] bg-white w-full normal-case"
                        disabled={field.type === 'empty'}
                      />
                    </div>
                  </div>
                </div>
              )})}

              {/* Add Lead Field Button */}
              <button
                onClick={() => setIsAddFieldPopupOpen(true)}
                className="w-full flex items-center justify-center gap-[0.4vw] py-[0.6vw] bg-white border border-gray-200 rounded-[0.5vw] text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors shadow-[0_0.1vw_0.2vw_rgba(0,0,0,0.02)] mt-[0.5vw]"
              >
                <Plus size="0.9vw" className="stroke-[2.5]" />
                <span className="text-[0.8vw] font-medium tracking-wide">Add Lead Field</span>
              </button>
            </div>
          </div>

          {/* Lead form Timing */}
          <div className="space-y-[1vw]">
            <div className="flex items-center gap-[0.5vw]">
              <h3 className="text-[0.8vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Lead form should Appears at</h3>
              <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}> </div>
            </div>

            <div className="rounded-[0.75vw]">
              {[
                { id: 'before', label: 'Before opening the flipbook' },
                { id: 'after-pages', label: 'Show on selected page' },
                { id: 'after-seconds', label: 'After X seconds' },
                { id: 'end', label: 'At the end of the flipbook' }
              ].map((opt, idx, arr) => (
                <div
                  key={opt.id}
                  className={`transition-colors flex flex-col p-[0.75vw] ${settings.appearance.timing === opt.id ? 'bg-transparent' : 'bg-transparent'
                    } ${idx === 0 ? 'rounded-t-[0.75vw]' : ''} ${idx === arr.length - 1 ? 'rounded-b-[0.75vw]' : ''}`}
                >
                  <label className="text-[0.7vw] font-semibold text-gray-700 flex items-center gap-[0.75vw] cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="radio"
                        name="timing"
                        checked={settings.appearance.timing === opt.id}
                        onChange={() => updateAppearance('timing', opt.id)}
                        className="peer appearance-none w-[1.1vw] h-[1.1vw] border-[1.5px] border-black rounded-full checked:border-[#4A3AFF] transition-all bg-transparent"
                      />
                      <div className="absolute w-[0.55vw] h-[0.55vw] bg-[#4A3AFF] rounded-full scale-0 peer-checked:scale-100 transition-transform" />
                    </div>
                    <span className={`text-[0.75vw] font-medium ${settings.appearance.timing === opt.id ? 'text-gray-900' : 'text-gray-600'}`}>{opt.label}</span>
                  </label>

                  {opt.id === 'after-pages' && settings.appearance.timing === 'after-pages' && (
                    <div className="ml-[1.85vw] mt-[0.5vw]">
                      <div className="relative inline-block w-[6vw]">
                        <select
                          value={settings.appearance.afterPages || 1}
                          onChange={(e) => updateAppearance('afterPages', parseInt(e.target.value))}
                          className="w-full appearance-none bg-white border border-gray-100 shadow-sm rounded-[0.4vw] py-[0.4vw] pl-[0.6vw] pr-[1.8vw] text-[0.75vw] text-black font-medium focus:outline-none cursor-pointer"
                        >
                          {pages.length > 0 ? (
                            pages.map((_, idx) => (
                              <option key={idx} value={idx + 1}>Page {idx + 1}</option>
                            ))
                          ) : (
                            [1, 2, 3, 4, 5].map(num => (
                              <option key={num} value={num}>Page {num}</option>
                            ))
                          )}
                        </select>
                        <div className="absolute right-[0.5vw] top-1/2 -translate-y-1/2 pointer-events-none">
                          <Icon icon="fluent:chevron-down-12-regular" className="w-[0.9vw] h-[0.9vw] text-gray-700 stroke-[1.5]" />
                        </div>
                      </div>
                    </div>
                  )}

                  {opt.id === 'after-seconds' && settings.appearance.timing === 'after-seconds' && (
                    <div className="ml-[1.85vw] mt-[0.5vw] flex items-center gap-[0.5vw]">
                      <Icon
                        icon="material-symbols:play-arrow-rounded"
                        className="text-gray-600 w-[1.2vw] h-[1.2vw] cursor-pointer hover:text-gray-900 rotate-180"
                        onClick={() => updateAppearance('afterSeconds', Math.max(1, (settings.appearance.afterSeconds || 30) - 1))}
                      />
                      <span className="text-[0.75vw] text-gray-700 font-medium w-[1vw] text-center">
                        {settings.appearance.afterSeconds || 30}
                      </span>
                      <Icon
                        icon="material-symbols:play-arrow-rounded"
                        className="text-gray-600 w-[1.2vw] h-[1.2vw] cursor-pointer hover:text-gray-900"
                        onClick={() => updateAppearance('afterSeconds', (settings.appearance.afterSeconds || 30) + 1)}
                      />
                      <span className="text-[0.75vw] font-medium text-gray-600 ml-[0.2vw]">Seconds</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Lead Form Mode */}
          <div className="space-y-[1vw]">
            <div className="flex items-center gap-[0.5vw]">
              <h3 className="text-[0.8vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Lead Form Mode</h3>
              <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}> </div>
            </div>

            <div className="space-y-[0.75vw]">
              <label className="flex items-center gap-[0.75vw] cursor-pointer group w-fit">
                <div className="relative flex items-center justify-center">
                  <input
                    type="radio"
                    name="allowSkip"
                    checked={!settings.appearance.allowSkip}
                    onChange={() => updateAppearance('allowSkip', false)}
                    className="peer appearance-none w-[1.1vw] h-[1.1vw] border-[1.5px] border-black rounded-full checked:border-[#4A3AFF] transition-all bg-transparent"
                  />
                  <div className="absolute w-[0.55vw] h-[0.55vw] bg-[#4A3AFF] rounded-full scale-0 peer-checked:scale-100 transition-transform" />
                </div>
                <span className={`text-[0.75vw] font-medium ${!settings.appearance.allowSkip ? 'text-gray-900' : 'text-gray-500'}`}>Mandatory (Require Submission)</span>
              </label>

              <div className="space-y-[0.75vw]">
                <label className="flex items-center gap-[0.75vw] cursor-pointer group w-fit">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="radio"
                      name="allowSkip"
                      checked={settings.appearance.allowSkip}
                      onChange={() => updateAppearance('allowSkip', true)}
                      className="peer appearance-none w-[1.1vw] h-[1.1vw] border-[1.5px] border-black rounded-full checked:border-[#4A3AFF] transition-all bg-transparent"
                    />
                    <div className="absolute w-[0.55vw] h-[0.55vw] bg-[#4A3AFF] rounded-full scale-0 peer-checked:scale-100 transition-transform" />
                  </div>
                  <span className={`text-[0.75vw] font-medium ${settings.appearance.allowSkip ? 'text-gray-900' : 'text-gray-500'}`}>Optional (Allow Skip)</span>
                </label>

                {settings.appearance.allowSkip && (
                  <div className="ml-[1.85vw] space-y-[0.8vw] pt-[0.25vw] border-t border-gray-200 mt-[0.5vw]">
                    <span className="block text-[0.75vw] font-medium text-gray-900 mt-[0.6vw] mb-[0.2vw]">If Skipped :</span>
                    
                    {[
                      { id: 'never', label: 'Never show again' },
                      { id: '1_day', label: 'Show again after 1 day' },
                      { id: 'next_visit', label: 'Show again on next visit' }
                    ].map(opt => (
                      <label key={opt.id} className="flex items-center gap-[0.75vw] cursor-pointer group w-fit">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="radio"
                            name="skipBehavior"
                            checked={(settings.appearance.skipBehavior || 'never') === opt.id}
                            onChange={() => updateAppearance('skipBehavior', opt.id)}
                            className="peer appearance-none w-[1.1vw] h-[1.1vw] border-[1.5px] border-black rounded-full checked:border-[#4A3AFF] transition-all bg-transparent"
                          />
                          <div className="absolute w-[0.55vw] h-[0.55vw] bg-[#4A3AFF] rounded-full scale-0 peer-checked:scale-100 transition-transform" />
                        </div>
                        <span className={`text-[0.7vw] font-medium ${(settings.appearance.skipBehavior || 'never') === opt.id ? 'text-gray-800' : 'text-gray-500'}`}>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lead Notification */}
          <div className="space-y-[1vw]">
            <div className="flex items-center gap-[0.5vw]">
              <div className="flex items-center gap-[0.4vw] pb-[0.5vw]">
                <Icon icon="fluent:mail-alert-32-filled" className="w-[1.2vw] h-[1.2vw] text-black" />
                <h3 className="text-[0.8vw] font-semibold text-gray-900 whitespace-nowrap">Lead Notification</h3>
              </div>
              <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}> </div>
            </div>
            <p className="text-[0.6vw] text-gray-500 font-medium -mt-[1vw]">Notify selected recipients when a new lead is submitted.</p>

            <div className="space-y-[1vw]">
              <div className="flex flex-col gap-[0.4vw]">
                <label className="text-[0.7vw] font-medium text-gray-900">Primary recipient</label>
                <input
                  type="text"
                  value={settings.leadNotification?.primaryRecipient || ''}
                  onChange={(e) => updateNested('leadNotification', 'primaryRecipient', e.target.value)}
                  className="w-full border border-gray-200 rounded-[0.4vw] p-[0.6vw] text-[0.7vw] text-gray-600 focus:outline-none focus:border-indigo-500 bg-white shadow-sm"
                  placeholder="admin@fisto.com"
                />
              </div>

              <div className="flex flex-col gap-[0.4vw]">
                <label className="text-[0.7vw] font-medium text-gray-900">Additional recipients (Max 2)</label>
                <div className="space-y-[0.5vw]">
                  {(settings.leadNotification?.additionalRecipients || []).map((recipient, idx) => (
                    <div key={idx} className="flex items-center border border-gray-200 rounded-[0.4vw] bg-white shadow-sm focus-within:border-indigo-500 transition-colors h-[2vw]">
                      <input
                        type="text"
                        value={recipient}
                        onChange={(e) => {
                          const newRecipients = [...(settings.leadNotification?.additionalRecipients || [])];
                          newRecipients[idx] = e.target.value;
                          updateNested('leadNotification', 'additionalRecipients', newRecipients);
                        }}
                        className="flex-1 px-[0.6vw] py-[0.4vw] text-[0.7vw] text-gray-600 outline-none bg-transparent"
                        placeholder={idx === 0 ? "marketing@fisto.com" : "sales@fisto.com"}
                      />
                      <div className="h-[60%] w-[1px] bg-gray-200"></div>
                      <button
                        onClick={() => {
                          const newRecipients = (settings.leadNotification?.additionalRecipients || []).filter((_, i) => i !== idx);
                          updateNested('leadNotification', 'additionalRecipients', newRecipients);
                        }}
                        className="px-[0.6vw] text-red-500 hover:text-red-700"
                      >
                        <Icon icon="lucide:trash-2" className="w-[0.9vw] h-[0.9vw]" />
                      </button>
                    </div>
                  ))}
                  
                  {(!settings.leadNotification?.additionalRecipients || settings.leadNotification.additionalRecipients.length < 2) && (
                    <button
                      onClick={() => {
                        const newRecipients = [...(settings.leadNotification?.additionalRecipients || []), ''];
                        updateNested('leadNotification', 'additionalRecipients', newRecipients);
                      }}
                      className="w-full flex items-center justify-center gap-[0.4vw] py-[0.5vw] bg-[#F7F7F7] border border-gray-200 rounded-[0.4vw] text-gray-500 hover:bg-gray-200 transition-colors shadow-sm"
                    >
                      <Plus size="0.8vw" />
                      <span className="text-[0.75vw] font-medium">Add another recipient</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Other Customization Options */}
          <div className="space-y-[0.5vw]">
            <div className="flex items-center gap-[0.3vw]">
              <h3 className="text-[0.8vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Other Customization options</h3>
              <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.5vw' }}> </div>
            </div>

            <div className={`bg-white rounded-[0.8vw] shadow-[0_0.9vw_1.2vw_rgba(0,0,0,0.05)] transition-all duration-300 relative z-0 ${isColorOpen ? 'ring-1 ring-gray-200' : ''}`}>
              <button
                onClick={() => setIsColorOpen(!isColorOpen)}
                className={`w-full flex items-center justify-between px-[0.5vw] py-[0.8vw] pl-[1vw] pr-[1vw] shadow-sm transition-all duration-300 ${isColorOpen ? 'rounded-t-[0.8vw] border-b-transparent bg-gray-50/50' : 'rounded-[0.8vw] bg-white'}`}
              >
                <span className="text-[0.8vw] font-semibold text-gray-900">Color Customization</span>
                <Icon icon="lucide:chevron-down" className={`w-[1.2vw] h-[1.2vw] text-gray-400 transition-transform duration-300 ${isColorOpen ? 'rotate-180' : ''}`} />
              </button>

              {isColorOpen && (
                <div className="p-[1vw] border-t border-gray-200 bg-gray-50/50 rounded-b-[0.8vw] space-y-[0.8vw] animate-in fade-in slide-in-from-top-2">
                  {/* Text Properties */}
                  <div className="space-y-[0.75vw] ">
                    <div className="flex items-center gap-[0.5vw]">
                      <h4 className="text-[0.75vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Text Properties</h4>
                      <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1.1vw' }}> </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[0.7vw] font-semibold text-gray-900">Choose the Text Style:</span>
                      <PremiumDropdown
                        options={fontFamilies}
                        value={settings.appearance.fontStyle}
                        onChange={(val) => updateAppearance('fontStyle', val)}
                        width="8.5vw"
                        isFont={true}
                        buttonClassName="!border-gray-600 !rounded-[0.5vw]"
                        align="right"
                      />
                    </div>
                    <ColorPickerItem label="Fill :" color={settings.appearance.textFill} onChange={(val) => updateAppearance('textFill', val)} />
                    <ColorPickerItem label="Stoke :" color={settings.appearance.textStroke} onChange={(val) => updateAppearance('textStroke', val)} />
                  </div>

                  {/* Background Color */}
                  <div className="space-y-[0.75vw]">
                    <div className="flex items-center gap-[0.5vw]">
                      <h4 className="text-[0.75vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Background Color</h4>
                      <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1vw' }}> </div>
                    </div>
                    <ColorPickerItem label="Fill :" color={settings.appearance.bgFill} onChange={(val) => updateAppearance('bgFill', val)} />
                    <ColorPickerItem label="Stoke :" color={settings.appearance.bgStroke} onChange={(val) => updateAppearance('bgStroke', val)} />
                  </div>

                  {/* Button */}
                  <div className="space-y-[0.75vw]">
                    <div className="flex items-center gap-[0.5vw]">
                      <h4 className="text-[0.75vw] font-semibold text-gray-900 whitespace-nowrap pb-[0.5vw]">Button</h4>
                      <div className="h-[0.0925vw] bg-gray-200 flex-1" style={{ marginRight: '-1vw' }}> </div>
                    </div>
                    <ColorPickerItem label="Fill :" color={settings.appearance.btnFill} onChange={(val) => updateAppearance('btnFill', val)} />
                    <ColorPickerItem label="Stoke :" color={settings.appearance.btnStroke} onChange={(val) => updateAppearance('btnStroke', val)} />
                    <ColorPickerItem label="Text :" color={settings.appearance.btnText} onChange={(val) => updateAppearance('btnText', val)} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Field Popup */}
      {isAddFieldPopupOpen && (
        <>
          <div 
            className="absolute top-0 left-full w-[100vw] h-[100vh] z-[100]"
            onClick={() => setIsAddFieldPopupOpen(false)}
          />
          <div className="absolute top-[40%] right-0 translate-x-1/2 -translate-y-1/2 z-[101] bg-white rounded-[1vw] w-[19vw] shadow-[0_1vw_3vw_rgba(0,0,0,0.15)] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col transition-all">
            
            {/* Header Tabs */}
            <div className="flex bg-[#E5E5E5] w-full">
              <button 
                onClick={() => setActivePopupTab('templates')}
                className={`flex-1 py-[0.9vw] text-[0.85vw] transition-colors border-b ${activePopupTab === 'templates' ? 'text-black bg-white border-black border-b-[0.15vw] font-semibold' : 'text-gray-500 hover:text-gray-700 border-[#D1D1D1] font-medium'}`}>
                Quick Templates
              </button>
              <button 
                onClick={() => setActivePopupTab('custom')}
                className={`flex-1 py-[0.9vw] text-[0.85vw] transition-colors border-b ${activePopupTab === 'custom' ? 'text-black bg-white border-black border-b-[0.15vw] font-semibold' : 'text-gray-500 hover:text-gray-700 border-[#D1D1D1] font-medium'}`}>
                Custom Fields
              </button>
            </div>
            
            {/* Content */}
            <div className="p-[1.5vw] flex flex-col items-center bg-white w-full h-[17vw]">
              {activePopupTab === 'templates' ? (
                <div className="w-full flex flex-col items-start h-full overflow-y-auto [&::-webkit-scrollbar]:w-[0.4vw] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full pr-[0.5vw]">
                  <p className="text-[0.9vw] text-gray-700 mb-[1.5vw] font-medium text-left leading-tight w-full">
                    Start quickly with a pre-designed lead form template.
                  </p>
                  <div className="grid grid-cols-2 gap-[1vw] w-full pb-[1vw]">
                    {quickTemplates.map((template) => (
                      <div 
                        key={template.id} 
                        onClick={() => handleSelectTemplate(template)}
                        className="flex flex-col items-center justify-between cursor-pointer group rounded-[0.8vw] border border-gray-100 p-[0.6vw] shadow-[0_0.2vw_0.8vw_rgba(0,0,0,0.04)] group-hover:border-gray-300 group-hover:shadow-[0_0.4vw_1.2vw_rgba(0,0,0,0.08)] transition-all bg-white"
                      >
                        <div className="w-full flex justify-center rounded-[0.4vw] bg-white mb-[0.8vw]">
                          <img src={template.icon} alt={template.name} className="w-[4.5vw] h-auto object-contain rounded-[0.4vw]" />
                        </div>
                        <span className="text-[0.85vw] font-semibold text-black text-center leading-tight pb-[0.2vw]">{template.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-[0.75vw] text-gray-600 mb-[1.5vw] font-medium text-center">
                    Click a field below to add it to your lead form.
                  </p>
              
              <div className="grid grid-cols-2 gap-[0.8vw] w-full">
                <button onClick={() => handleAddField('empty')} className="flex items-center gap-[0.5vw] px-[0.75vw] py-[0.6vw] border border-gray-100 rounded-[0.4vw] shadow-[0_0.1vw_0.3vw_rgba(0,0,0,0.05)] hover:bg-gray-50 transition-all group bg-white justify-center">
                  <Icon icon="lucide:type" className="w-[1vw] h-[1vw] text-gray-600" />
                  <span className="text-[0.7vw] font-medium text-gray-700">Input Box</span>
                </button>
                
                <button onClick={() => handleAddField('feedback')} className="flex items-center gap-[0.5vw] px-[0.75vw] py-[0.6vw] border border-gray-100 rounded-[0.4vw] shadow-[0_0.1vw_0.3vw_rgba(0,0,0,0.05)] hover:bg-gray-50 transition-all group bg-white justify-center">
                  <Icon icon="lucide:text-cursor-input" className="w-[1vw] h-[1vw] text-gray-600" />
                  <span className="text-[0.7vw] font-medium text-gray-700">Text Area</span>
                </button>
                
                <button onClick={() => handleAddField('radio')} className="flex items-center gap-[0.5vw] px-[0.75vw] py-[0.6vw] border border-gray-100 rounded-[0.4vw] shadow-[0_0.1vw_0.3vw_rgba(0,0,0,0.05)] hover:bg-gray-50 transition-all group bg-white justify-center">
                  <Icon icon="lucide:circle-dot" className="w-[1vw] h-[1vw] text-gray-600" />
                  <span className="text-[0.7vw] font-medium text-gray-700">Radio Button</span>
                </button>
                
                <button onClick={() => handleAddField('dropdown')} className="flex items-center gap-[0.5vw] px-[0.75vw] py-[0.6vw] border border-gray-100 rounded-[0.4vw] shadow-[0_0.1vw_0.3vw_rgba(0,0,0,0.05)] hover:bg-gray-50 transition-all group bg-white justify-center">
                  <Icon icon="lucide:list-collapse" className="w-[1vw] h-[1vw] text-gray-600" />
                  <span className="text-[0.7vw] font-medium text-gray-700">Dropdown</span>
                </button>

                <button onClick={() => handleAddField('rating')} className="flex items-center gap-[0.5vw] px-[0.75vw] py-[0.6vw] border border-gray-100 rounded-[0.4vw] shadow-[0_0.1vw_0.3vw_rgba(0,0,0,0.05)] hover:bg-gray-50 transition-all group bg-white justify-center">
                  <Icon icon="lucide:star" className="w-[1vw] h-[1vw] text-gray-600" />
                  <span className="text-[0.7vw] font-medium text-gray-700">Rating</span>
                </button>

                <button onClick={() => handleAddField('checkbox')} className="flex items-center gap-[0.5vw] px-[0.75vw] py-[0.6vw] border border-gray-100 rounded-[0.4vw] shadow-[0_0.1vw_0.3vw_rgba(0,0,0,0.05)] hover:bg-gray-50 transition-all group bg-white justify-center">
                  <Icon icon="lucide:check-square" className="w-[1vw] h-[1vw] text-gray-600" />
                  <span className="text-[0.7vw] font-medium text-gray-700">Checkbox</span>
                </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const ColorPickerItem = ({ label, color, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pickerPos, setPickerPos] = useState({ x: 0, y: 0 });
  const pickerRef = useRef(null);
  const swatchRef = useRef(null);

  // The click-outside logic is now handled internally by ColorPallet via onClose


  const handleOpen = () => {
    if (!isOpen && swatchRef.current) {
      const rect = swatchRef.current.getBoundingClientRect();
      const sidebarContainer = swatchRef.current.closest('.bg-white.relative.overflow-visible');
      const sidebarRightEdge = sidebarContainer ? sidebarContainer.getBoundingClientRect().right : rect.right;
      
      const pickerWidth = window.innerWidth * 0.15; // ColorPallet width is 15vw
      const pickerHeight = 350;
      const yPos = Math.min(rect.top, window.innerHeight - pickerHeight);
      // Position picker half inside and half outside on the right side of the sidebar
      setPickerPos({ x: sidebarRightEdge - (pickerWidth / 2), y: Math.max(0, yPos) });
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="flex items-center gap-[0.4vw] relative">
      <span className="w-[3vw] text-[0.7vw] pl-[0.5vw] font-semibold text-gray-700 shrink-0">{label}</span>
      <div className="flex-1 flex items-center gap-[0.5vw]">
        <div
          ref={swatchRef}
          className="w-[1.8vw] h-[1.8vw] rounded-[0.4vw] border border-gray-900 cursor-pointer overflow-hidden relative shadow-sm color-picker-trigger"
          style={{ backgroundColor: color === '#' || !color || color === 'transparent' ? 'white' : color }}
          onClick={handleOpen}
        >
          {(color === '#' || !color || color === 'transparent') && (
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[0.1vw] bg-red-500 rotate-45"></div>
          )}
        </div>
        <div className="flex-1 flex items-center bg-white border border-gray-900 rounded-[0.4vw] px-[0.6vw] py-[0.2vw] h-[1.8vw] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <span className="text-[0.7vw] font-medium text-gray-600 flex-1">{color && color.length > 1 ? color.toUpperCase() : '#'}</span>
          <div className="w-[1px] h-[70%] bg-gray-100 mx-[0.4vw]"></div>
          <div className="text-[0.7vw] font-semibold text-gray-800 w-[2.5vw] text-right">100%</div>
        </div>
      </div>
      {isOpen && createPortal(
        <div ref={pickerRef}>
          <ColorPallet
            color={color && color.startsWith('#') && color.length >= 7 ? color.substring(0, 7) : '#ffffff'}
            onChange={onChange}
            opacity={100}
            onClose={() => setIsOpen(false)}
            style={{ position: 'fixed', top: pickerPos.y, left: pickerPos.x, zIndex: 9999, transform: 'none' }}
          />
        </div>,
        document.body
      )}
    </div>
  );
};

export default LeadForm;


