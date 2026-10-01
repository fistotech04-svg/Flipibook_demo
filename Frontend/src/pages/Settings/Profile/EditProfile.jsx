import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { User, Building, MapPin, Globe, Check, X, Upload, Trash2 } from 'lucide-react';
import { Icon } from '@iconify/react';
import { resolveUploadsPath } from '../../../utils/supabaseUtils';

const EditProfile = ({ user, setUser }) => {
  const [editedUser, setEditedUser] = useState(user);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || '';

  useEffect(() => {
    setEditedUser(user);
    setErrors({});
  }, [user]);

  const isEdited = JSON.stringify(user) !== JSON.stringify(editedUser);

  const validate = () => {
    let newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const urlRegex = /^(https?:\/\/)?([\w\d\-]+\.)+\w{2,}(\/.*)?$/i;

    if (editedUser.email && !emailRegex.test(editedUser.email)) newErrors.email = "Invalid email format";
    if (editedUser.mobile && editedUser.mobile.length !== 10) newErrors.mobile = "Mobile number must be 10 digits";
    if (editedUser.companyEmail && !emailRegex.test(editedUser.companyEmail)) newErrors.companyEmail = "Invalid email format";
    if (editedUser.website && !urlRegex.test(editedUser.website)) newErrors.website = "Invalid URL format";
    if (editedUser.pincode && !/^\d{5,6}$/.test(editedUser.pincode)) newErrors.pincode = "Invalid Pin Code";

    if (editedUser.socials?.website && !urlRegex.test(editedUser.socials.website)) newErrors.socialWebsite = "Invalid URL format";
    if (editedUser.socials?.instagram && !urlRegex.test(editedUser.socials.instagram)) newErrors.instagram = "Invalid URL format";
    if (editedUser.socials?.linkedin && !urlRegex.test(editedUser.socials.linkedin)) newErrors.linkedin = "Invalid URL format";
    if (editedUser.socials?.facebook && !urlRegex.test(editedUser.socials.facebook)) newErrors.facebook = "Invalid URL format";
    if (editedUser.socials?.whatsapp && !urlRegex.test(editedUser.socials.whatsapp)) newErrors.whatsapp = "Invalid URL format";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateField = (field, value) => {
    let newErrors = { ...errors };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const urlRegex = /^(https?:\/\/)?([\w\d\-]+\.)+\w{2,}(\/.*)?$/i;

    switch (field) {
      case 'email':
      case 'companyEmail':
        if (value && !emailRegex.test(value)) newErrors[field] = "Invalid email format";
        else delete newErrors[field];
        break;
      case 'mobile':
        if (value && value.length !== 10) newErrors.mobile = "Mobile number must be 10 digits";
        else delete newErrors.mobile;
        break;
      case 'website':
      case 'socialWebsite':
      case 'instagram':
      case 'linkedin':
      case 'facebook':
      case 'whatsapp':
        if (value && !urlRegex.test(value)) newErrors[field] = "Invalid URL format";
        else delete newErrors[field];
        break;
      case 'pincode':
        if (value && !/^\d{5,6}$/.test(value)) newErrors.pincode = "Invalid Pin Code";
        else delete newErrors.pincode;
        break;
      default:
        break;
    }
    setErrors(newErrors);
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const email = editedUser.email || editedUser.emailId;
      const res = await axios.post(`${backendUrl}/api/profile/save`, {
        emailId: email,
        ...editedUser
      });

      if (res.data?.success && res.data?.profile) {
        const p = res.data.profile;
        const merged = {
          ...editedUser,
          ...p,
          email: p.emailId || email,
          emailId: p.emailId || email,
          company_logo_url: p.company_logo_url || p.companyLogo || editedUser.company_logo_url || editedUser.companyLogo || '',
          companyLogo: p.company_logo_url || p.companyLogo || editedUser.company_logo_url || editedUser.companyLogo || '',
          services: p.services || editedUser.services || [],
          socials: {
            ...(editedUser.socials || {}),
            ...(p.socials || {})
          }
        };
        if (setUser) setUser(merged);

        try {
          localStorage.setItem('user_profile', JSON.stringify(merged));
          const stored = localStorage.getItem('user');
          const parsed = stored ? JSON.parse(stored) : {};
          localStorage.setItem('user', JSON.stringify({
            ...parsed,
            name: merged.name,
            emailId: merged.emailId,
            picture: merged.picture,
            avatarBgColor: merged.avatarBgColor
          }));
          window.dispatchEvent(new CustomEvent('profileUpdate', { detail: merged }));
        } catch (e) {}
      } else {
        if (setUser) setUser(editedUser);
        try {
          localStorage.setItem('user_profile', JSON.stringify(editedUser));
          window.dispatchEvent(new CustomEvent('profileUpdate', { detail: editedUser }));
        } catch (e) {}
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      if (setUser) setUser(editedUser);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedUser(user);
    setErrors({});
  };

  const [portalTarget, setPortalTarget] = useState(null);

  useEffect(() => {
    setPortalTarget(document.getElementById('save-buttons-portal-target'));
  }, []);

  const saveActions = isEdited && (
    <div className="flex gap-[0.5vw]">
      <button
        type="button"
        disabled={isSaving}
        onClick={handleCancel}
        className="flex items-center gap-[0.3vw] px-[1vw] py-[0.5vw] border border-gray-300 rounded-[0.4vw] text-[0.8vw] font-medium text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
      >
        <X size="0.9vw" /> Cancel
      </button>
      <button
        type="button"
        disabled={isSaving}
        onClick={handleSave}
        className="flex items-center gap-[0.3vw] px-[1vw] py-[0.5vw] bg-green-600 hover:bg-green-700 rounded-[0.4vw] text-[0.8vw] font-medium text-white transition-colors disabled:opacity-50"
      >
        {isSaving ? (
          <Icon icon="line-md:loading-loop" className="w-[0.9vw] h-[0.9vw]" />
        ) : (
          <Check size="0.9vw" />
        )}
        {isSaving ? 'Updating...' : 'Update Changes'}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 w-full relative h-full ">
      {/* Header section */}
      <div className="flex justify-between items-start mb-[1.5vw]">
        {portalTarget ? createPortal(saveActions, portalTarget) : saveActions}
      </div>

      <div className="flex flex-col gap-[2vw]">
        {/* Personal Details */}
        <section>
          <div className="flex items-center gap-[0.5vw] mb-[1vw]">
            <User size="1.2vw" className="text-gray-900" />
            <h3 className="text-[1vw] font-semibold text-gray-900">Personal Details</h3>
          </div>
          <div className="flex flex-col gap-[1vw] pl-[1.7vw]">
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Full Name</label>
              <input type="text" placeholder="e.g. John Doe" value={editedUser?.name || ''} onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })} className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300" />
            </div>
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Email ID</label>
              <div className="relative">
                <div className="absolute left-[0.8vw] top-1/2 -translate-y-1/2">
                  <Icon icon="logos:google-icon" className="w-[1vw] h-[1vw]" />
                </div>
                <input type="email" placeholder="e.g. john@example.com" value={editedUser?.email || ''} disabled className="w-full border border-gray-200 bg-gray-50 cursor-default pointer-events-none rounded-[0.4vw] pl-[2.5vw] pr-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none text-gray-500" />
              </div>
              {errors.email && <p className="text-red-500 text-[0.65vw] mt-[0.2vw]">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">About</label>
              <textarea rows={4} placeholder="Tell us a little about yourself..." value={editedUser?.about || ''} onChange={(e) => setEditedUser({ ...editedUser, about: e.target.value })} className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 resize-none text-gray-500" />
            </div>
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Mobile Number</label>
              <input type="tel" maxLength={10} placeholder="e.g. 9876543210" value={editedUser?.mobile || ''} onChange={(e) => { setEditedUser({ ...editedUser, mobile: e.target.value.replace(/\D/g, '') }); setErrors({ ...errors, mobile: null }); }} onBlur={(e) => validateField('mobile', e.target.value.replace(/\D/g, ''))} className={`w-full border ${errors.mobile ? 'border-red-500' : 'border-gray-200'} rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-600`} />
              {errors.mobile && <p className="text-red-500 text-[0.65vw] mt-[0.2vw]">{errors.mobile}</p>}
            </div>

          </div>
        </section>

        {/* Professional Details */}
        <section>
          <div className="flex items-center gap-[0.5vw] mb-[1vw]">
            <Building size="1.2vw" className="text-gray-900" />
            <h3 className="text-[1vw] font-semibold text-gray-900">Professional Details</h3>
          </div>
          <div className="flex flex-col gap-[1vw] pl-[1.7vw]">
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.2vw]">Add Your Company Logo</label>
              <p className="text-[0.65vw] text-gray-400 mb-[0.5vw]">PNG format keeps your logo clean and background-free</p>
              
              {(editedUser?.company_logo_url || editedUser?.companyLogo) ? (
                <div className="flex flex-col gap-[0.75vw]">
                  <div
                    className="flex items-center gap-[1vw]"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files[0];
                      if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setEditedUser({ ...editedUser, company_logo_url: reader.result, companyLogo: reader.result });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-[8vw] h-[5vw] rounded-[0.4vw] overflow-hidden bg-White flex-shrink-0 flex items-center justify-center border border-gray-200">
                      <img
                        src={(editedUser.company_logo_url || editedUser.companyLogo)?.startsWith('data:') ? (editedUser.company_logo_url || editedUser.companyLogo) : resolveUploadsPath(editedUser.company_logo_url || editedUser.companyLogo)}
                        alt="Company Logo Thumbnail"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Info & Actions */}
                    <div className="flex flex-col flex-1 gap-[0.4vw] py-[0.2vw]">
                      <div className="flex flex-col gap-[0.1vw]">
                        <span className="text-[0.9vw] font-medium text-gray-700 truncate w-[10vw]">
                          Logo
                        </span>
                      </div>

                      <div className="flex items-center gap-[0.5vw]">
                        <button
                          onClick={() => document.getElementById('company-logo-upload')?.click()}
                          type="button"
                          className="px-[0.75vw] py-[0.4vw] bg-[#f3f4f6] hover:bg-[#e5e7eb] text-gray-700 text-[0.75vw] font-semibold rounded-[0.4vw] border border-gray-200 cursor-pointer transition-colors"
                        >
                          Replace image
                        </button>
                        <button
                          onClick={() => setEditedUser({ ...editedUser, company_logo_url: '', companyLogo: '' })}
                          type="button"
                          className="p-[0.45vw] bg-[#f3f4f6] hover:bg-[#fee2e2] text-gray-500 hover:text-red-500 rounded-[0.4vw] border border-gray-200 cursor-pointer transition-colors"
                        >
                          <Trash2 size="0.95vw" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-[0.75vw] mb-[1vw] w-[14vw]">
                  {/* Drag & Drop Box */}
                  <div
                    onClick={() => document.getElementById('company-logo-upload')?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files[0];
                      if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setEditedUser({ ...editedUser, company_logo_url: reader.result, companyLogo: reader.result });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full h-[5vw] border-2 border-dashed border-gray-400 rounded-[0.75vw] bg-white p-[0.9vw] flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:border-[#4c5add] hover:bg-gray-50/50 group shadow-sm"
                  >
                    <div className="flex items-center">
                      <span className="text-gray-500 text-[0.8vw] font-semibold">+ Add Logo</span>
                    </div>
                  </div>
                </div>
              )}
              <input
                type="file"
                id="company-logo-upload"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setEditedUser({ ...editedUser, company_logo_url: reader.result, companyLogo: reader.result });
                    };
                    reader.readAsDataURL(file);
                  }
                  e.target.value = '';
                }}
                className="hidden"
                accept="image/*"
              />
            </div>
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Company / Organization Name</label>
              <input type="text" placeholder="e.g. Fist-o Tech" value={editedUser?.companyName || ''} onChange={(e) => setEditedUser({ ...editedUser, companyName: e.target.value })} className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-600" />
            </div>
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Industry Type</label>
              <input type="text" placeholder="e.g. Software Development" value={editedUser?.industryType || ''} onChange={(e) => setEditedUser({ ...editedUser, industryType: e.target.value })} className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-600" />
            </div>
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Company Gmail</label>
              <div className="relative">
                <div className="absolute left-[0.8vw] top-1/2 -translate-y-1/2">
                  <Icon icon="logos:google-icon" className="w-[1vw] h-[1vw]" />
                </div>
                <input type="email" placeholder="e.g. company@gmail.com" value={editedUser?.companyEmail || ''} onChange={(e) => { setEditedUser({ ...editedUser, companyEmail: e.target.value }); setErrors({ ...errors, companyEmail: null }); }} onBlur={(e) => validateField('companyEmail', e.target.value)} className={`w-full border ${errors.companyEmail ? 'border-red-500' : 'border-gray-200'} rounded-[0.4vw] pl-[2.5vw] pr-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-600`} />
              </div>
              {errors.companyEmail && <p className="text-red-500 text-[0.65vw] mt-[0.2vw]">{errors.companyEmail}</p>}
            </div>
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Website Link</label>
              <div className="relative">
                <div className="absolute left-[0.8vw] top-1/2 -translate-y-1/2 text-gray-500">
                  <Globe className="w-[1vw] h-[1vw]" />
                </div>
                <input type="text" placeholder="e.g. www.fistotech.com" value={editedUser?.website || ''} onChange={(e) => { setEditedUser({ ...editedUser, website: e.target.value }); setErrors({ ...errors, website: null }); }} onBlur={(e) => validateField('website', e.target.value)} className={`w-full border ${errors.website ? 'border-red-500' : 'border-gray-200'} rounded-[0.4vw] pl-[2.5vw] pr-[0.8vw] py-[0.6vw] text-[0.8vw] text-blue-500 underline focus:outline-none focus:border-gray-300`} />
              </div>
              {errors.website && <p className="text-red-500 text-[0.65vw] mt-[0.2vw]">{errors.website}</p>}
            </div>
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Services</label>
              <input 
                type="text" 
                value={Array.isArray(editedUser?.services) ? editedUser.services.join(', ') : editedUser?.services || ''} 
                onChange={(e) => setEditedUser({ ...editedUser, services: e.target.value })} 
                className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-600" 
                placeholder="e.g. Website Development, 3D Animations, IDC"
              />
            </div>
          </div>
        </section>

        {/* Address */}
        <section>
          <div className="flex items-center gap-[0.5vw] mb-[1vw]">
            <MapPin size="1.2vw" className="text-gray-900" />
            <h3 className="text-[1vw] font-semibold text-gray-900">Address</h3>
          </div>
          <div className="flex flex-col gap-[1vw] pl-[1.7vw]">
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Address Line 1</label>
              <input type="text" placeholder="e.g. No. 45, Lake View Street" value={editedUser?.address1 || ''} onChange={(e) => setEditedUser({ ...editedUser, address1: e.target.value })} className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-600" />
            </div>
            <div>
              <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Address Line 2</label>
              <input type="text" placeholder="e.g. Near Central Bus Stand" value={editedUser?.address2 || ''} onChange={(e) => setEditedUser({ ...editedUser, address2: e.target.value })} className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-600" />
            </div>
            <div className="flex gap-[1vw]">
              <div className="flex-1">
                <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">City</label>
                <input type="text" placeholder="e.g. Coimbatore" value={editedUser?.city || ''} onChange={(e) => setEditedUser({ ...editedUser, city: e.target.value })} className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-600" />
              </div>
              <div className="flex-1">
                <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Pin Code</label>
                <input type="text" maxLength={6} placeholder="e.g. 641012" value={editedUser?.pincode || ''} onChange={(e) => { setEditedUser({ ...editedUser, pincode: e.target.value.replace(/\D/g, '') }); setErrors({ ...errors, pincode: null }); }} onBlur={(e) => validateField('pincode', e.target.value.replace(/\D/g, ''))} className={`w-full border ${errors.pincode ? 'border-red-500' : 'border-gray-200'} rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-600`} />
                {errors.pincode && <p className="text-red-500 text-[0.65vw] mt-[0.2vw]">{errors.pincode}</p>}
              </div>
            </div>
            <div className="flex gap-[1vw]">
              <div className="flex-1 relative">
                <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">State</label>
                <select value={editedUser?.state || ''} onChange={(e) => setEditedUser({ ...editedUser, state: e.target.value })} className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 bg-white appearance-none text-gray-600">
                  {editedUser?.country === 'USA' ? (
                    <>
                      <option value="California">California</option>
                      <option value="New York">New York</option>
                      <option value="Texas">Texas</option>
                      <option value="Florida">Florida</option>
                    </>
                  ) : editedUser?.country === 'UK' ? (
                    <>
                      <option value="England">England</option>
                      <option value="Scotland">Scotland</option>
                      <option value="Wales">Wales</option>
                      <option value="Northern Ireland">Northern Ireland</option>
                    </>
                  ) : (
                    <>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Kerala">Kerala</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Maharashtra">Maharashtra</option>
                    </>
                  )}
                </select>
                <div className="absolute right-[0.8vw] top-[2vw] pointer-events-none">
                  <Icon icon="lucide:chevron-down" className="w-[1vw] h-[1vw] text-gray-400" />
                </div>
              </div>
              <div className="flex-1 relative">
                <label className="block text-[0.75vw] font-semibold text-gray-700 mb-[0.3vw]">Country</label>
                <select value={editedUser?.country || ''} onChange={(e) => {
                  const newCountry = e.target.value;
                  const defaultStates = { 'INDIA': 'Tamil Nadu', 'USA': 'California', 'UK': 'England' };
                  setEditedUser({ ...editedUser, country: newCountry, state: defaultStates[newCountry] });
                }} className="w-full border border-gray-200 rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 bg-white appearance-none text-gray-600">
                  <option value="INDIA">INDIA</option>
                  <option value="USA">USA</option>
                  <option value="UK">UK</option>
                </select>
                <div className="absolute right-[0.8vw] top-[2vw] pointer-events-none">
                  <Icon icon="lucide:chevron-down" className="w-[1vw] h-[1vw] text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Media */}
        <section>
          <div className="flex items-center gap-[0.5vw] mb-[1vw]">
            <Icon icon="lucide:link" className="w-[1.2vw] h-[1.2vw] text-gray-900" />
            <h3 className="text-[1vw] font-semibold text-gray-900">Social Media</h3>
          </div>
          <div className="flex flex-col gap-[1vw] pl-[1.7vw]">

            <div className="flex flex-col gap-[0.2vw]">
              <div className="flex items-center gap-[1vw]">
                <div className="w-[2vw] h-[2vw] bg-[#1a1a1a] rounded-[0.4vw] flex items-center justify-center shrink-0">
                  <Globe className="w-[1.2vw] h-[1.2vw] text-white" />
                </div>
                <input type="text" placeholder="Enter website link" value={editedUser?.socials?.website || ''} onChange={(e) => { setEditedUser({ ...editedUser, socials: { ...editedUser.socials, website: e.target.value } }); setErrors({ ...errors, socialWebsite: null }); }} onBlur={(e) => validateField('socialWebsite', e.target.value)} className={`w-full border ${errors.socialWebsite ? 'border-red-500' : 'border-gray-200'} rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-500`} />
              </div>
              {errors.socialWebsite && <p className="text-red-500 text-[0.65vw] ml-[3vw]">{errors.socialWebsite}</p>}
            </div>

            <div className="flex flex-col gap-[0.2vw]">
              <div className="flex items-center gap-[1vw]">
                <div className="w-[2vw] h-[2vw] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 rounded-[0.4vw] flex items-center justify-center shrink-0">
                  <Icon icon="mdi:instagram" className="w-[1.3vw] h-[1.3vw] text-white" />
                </div>
                <input type="text" placeholder="Enter Instagram link" value={editedUser?.socials?.instagram || ''} onChange={(e) => { setEditedUser({ ...editedUser, socials: { ...editedUser.socials, instagram: e.target.value } }); setErrors({ ...errors, instagram: null }); }} onBlur={(e) => validateField('instagram', e.target.value)} className={`w-full border ${errors.instagram ? 'border-red-500' : 'border-gray-200'} rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-500`} />
              </div>
              {errors.instagram && <p className="text-red-500 text-[0.65vw] ml-[3vw]">{errors.instagram}</p>}
            </div>

            <div className="flex flex-col gap-[0.2vw]">
              <div className="flex items-center gap-[1vw]">
                <div className="w-[2vw] h-[2vw] bg-[#0077b5] rounded-[0.4vw] flex items-center justify-center shrink-0">
                  <Icon icon="mdi:linkedin" className="w-[1.4vw] h-[1.4vw] text-white" />
                </div>
                <input type="text" placeholder="Enter LinkedIn link" value={editedUser?.socials?.linkedin || ''} onChange={(e) => { setEditedUser({ ...editedUser, socials: { ...editedUser.socials, linkedin: e.target.value } }); setErrors({ ...errors, linkedin: null }); }} onBlur={(e) => validateField('linkedin', e.target.value)} className={`w-full border ${errors.linkedin ? 'border-red-500' : 'border-gray-200'} rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-500`} />
              </div>
              {errors.linkedin && <p className="text-red-500 text-[0.65vw] ml-[3vw]">{errors.linkedin}</p>}
            </div>

            <div className="flex flex-col gap-[0.2vw]">
              <div className="flex items-center gap-[1vw]">
                <div className="w-[2vw] h-[2vw] bg-[#1877f2] rounded-[0.4vw] flex items-center justify-center shrink-0">
                  <Icon icon="mdi:facebook" className="w-[1.4vw] h-[1.4vw] text-white" />
                </div>
                <input type="text" placeholder="Enter Facebook link" value={editedUser?.socials?.facebook || ''} onChange={(e) => { setEditedUser({ ...editedUser, socials: { ...editedUser.socials, facebook: e.target.value } }); setErrors({ ...errors, facebook: null }); }} onBlur={(e) => validateField('facebook', e.target.value)} className={`w-full border ${errors.facebook ? 'border-red-500' : 'border-gray-200'} rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-500`} />
              </div>
              {errors.facebook && <p className="text-red-500 text-[0.65vw] ml-[3vw]">{errors.facebook}</p>}
            </div>

            <div className="flex flex-col gap-[0.2vw] mb-[2vw]">
              <div className="flex items-center gap-[1vw]">
                <div className="w-[2vw] h-[2vw] bg-[#25d366] rounded-[0.4vw] flex items-center justify-center shrink-0">
                  <Icon icon="mdi:whatsapp" className="w-[1.4vw] h-[1.4vw] text-white" />
                </div>
                <input type="text" placeholder="Enter WhatsApp link" value={editedUser?.socials?.whatsapp || ''} onChange={(e) => { setEditedUser({ ...editedUser, socials: { ...editedUser.socials, whatsapp: e.target.value } }); setErrors({ ...errors, whatsapp: null }); }} onBlur={(e) => validateField('whatsapp', e.target.value)} className={`w-full border ${errors.whatsapp ? 'border-red-500' : 'border-gray-200'} rounded-[0.4vw] px-[0.8vw] py-[0.6vw] text-[0.8vw] focus:outline-none focus:border-gray-300 text-gray-500`} />
              </div>
              {errors.whatsapp && <p className="text-red-500 text-[0.65vw] ml-[3vw]">{errors.whatsapp}</p>}
            </div>

          </div>
        </section>

      </div>
    </div>
  );
};

export default EditProfile;
