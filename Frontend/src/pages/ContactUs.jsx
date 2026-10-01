import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Headphones, 
  Mail, 
  Phone, 
  MessageSquare, 
  User, 
  Building2, 
  ChevronDown, 
  Pencil, 
  Send,
  UserCheck,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  PhoneCall,
  Handshake,
  ClipboardList,
  ArrowUpRight,
  ArrowRight
} from 'lucide-react';
import CallImage from '../assets/Contact_us/Call.png';
import { useModernToast } from '../components/ModernToast';
import Footer from './Footer';

export default function ContactUs() {
  const toast = useModernToast();
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phoneNumber: '',
    service: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.service || !formData.message.trim()) {
      toast.error('Please fill in all required fields marked with *');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success('Thank you! Your message has been sent successfully.');
      setFormData({
        name: '',
        companyName: '',
        email: '',
        phoneNumber: '',
        service: '',
        message: ''
      });
    }, 1000);
  };

  return (
    <div className="w-full bg-white font-sans pb-0">
      {/* Header Banner Section */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full bg-[#f0efef] border-b border-gray-100 px-[5vw]"
      >
        <div className="max-w-[85vw] mx-auto flex flex-col md:flex-row items-center justify-between gap-[3vw]">
          {/* Left Text Block */}
          <div className="max-w-[44vw] space-y-[1.8vh]">
            <h1 className="text-[3.2vw] text-gray-900 font-normal tracking-tight leading-tight">
              Contact Us
            </h1>
            <p className="text-gray-500 text-[0.95vw] leading-relaxed font-normal">
              Have a question or need assistance? Our team is here to help you create immersive digital experiences. Whether you're exploring our platform, building your first interactive catalogue, or looking for enterprise solutions, we're just a message away.
            </p>
            <div className="w-[7vw] h-[0.3vh] min-h-[2px] bg-gray-800 rounded-full mt-[1.8vh]"></div>
          </div>

          {/* Right Image Block */}
          <div className="flex-shrink-0 flex justify-center items-center">
            <img 
              src={CallImage} 
              alt="Contact Us Illustration" 
              className="h-[42vh] w-auto object-contain" 
            />
          </div>
        </div>
      </motion.div>

      {/* Main Content Section */}
      <div className="max-w-[85vw] mx-auto pt-[6vh] px-[1vw] pb-[8vh]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-[4vw] items-start">
          
          {/* Left Column: Let's craft your next chapter & Contact info */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-5 space-y-[4vh]"
          >
            {/* Title */}
            <div className="space-y-[0.3vh]">
              <h2 className="text-[3.2vw] text-black font-medium leading-[1.12] tracking-tight">
                Let's craft your next 
              </h2>
              <h2 className="text-[3.2vw] text-black font-bold leading-[1.12] tracking-tight">
                chapter
              </h2>
            </div>

            {/* Contact Items List */}
            <div className="space-y-[3vh] pt-[1vh]">
              
              {/* Support Hours */}
              <div className="flex items-start gap-[1.2vw]">
                <div className="w-[2.6vw] h-[2.6vw] min-w-[36px] min-h-[36px] rounded-full bg-black flex items-center justify-center text-white shrink-0 mt-[0.2vh] shadow-sm">
                  <Headphones className="w-[1.2vw] h-[1.2vw] min-w-[17px] min-h-[17px]" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-[1.25vw] leading-snug">Support Hours</h3>
                  <p className="text-gray-400 text-[0.9vw] font-normal mt-[0.4vh]">Mon – Fri • 9:00 AM – 6:00 PM (IST)</p>
                </div>
              </div>

              {/* Talk to Our Team */}
              <div className="flex items-start gap-[1.2vw]">
                <div className="w-[2.6vw] h-[2.6vw] min-w-[36px] min-h-[36px] rounded-full bg-black flex items-center justify-center text-white shrink-0 mt-[0.2vh] shadow-sm">
                  <Mail className="w-[1.2vw] h-[1.2vw] min-w-[17px] min-h-[17px]" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-[1.25vw] leading-snug">Talk to Our Team</h3>
                  <p className="text-gray-400 text-[0.9vw] font-normal mt-[0.4vh] hover:text-gray-600 cursor-pointer transition-colors">
                    support@fist-o.com
                  </p>
                </div>
              </div>

              {/* Call Us */}
              <div className="flex items-start gap-[1.2vw]">
                <div className="w-[2.6vw] h-[2.6vw] min-w-[36px] min-h-[36px] rounded-full bg-black flex items-center justify-center text-white shrink-0 mt-[0.2vh] shadow-sm">
                  <Phone className="w-[1.2vw] h-[1.2vw] min-w-[17px] min-h-[17px]" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-[1.25vw] leading-snug">Call Us</h3>
                  <div className="text-gray-400 text-[0.9vw] font-normal mt-[0.4vh] space-y-[0.2vh]">
                    <p>+91 999 442 5147</p>
                    <p>+91 753 002 5147</p>
                    <p>+91 978 932 5147</p>
                  </div>
                </div>
              </div>

              {/* Live Chat */}
              <div className="flex items-start gap-[1.2vw]">
                <div className="w-[2.6vw] h-[2.6vw] min-w-[36px] min-h-[36px] rounded-full bg-black flex items-center justify-center text-white shrink-0 mt-[0.2vh] shadow-sm">
                  <MessageSquare className="w-[1.2vw] h-[1.2vw] min-w-[17px] min-h-[17px]" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-[1.25vw] leading-snug">Live Chat</h3>
                  <div className="text-gray-400 text-[0.9vw] font-normal mt-[0.4vh]">
                    <p>Chat with our team</p>
                    <p>We replay instantly</p>
                  </div>
                </div>
              </div>

              {/* Follow us */}
              <div className="flex items-start gap-[1.2vw]">
                <div className="w-[2.6vw] h-[2.6vw] min-w-[36px] min-h-[36px] rounded-full bg-black flex items-center justify-center text-white shrink-0 mt-[0.2vh] shadow-sm">
                  <UserCheck className="w-[1.2vw] h-[1.2vw] min-w-[17px] min-h-[17px]" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-[1.25vw] leading-snug">Follow us</h3>
                  <div className="flex items-center gap-[0.8vw] mt-[1vh]">
                    <a href="#" className="w-[2.4vw] h-[2.4vw] min-w-[32px] min-h-[32px] rounded-[0.5vw] border border-gray-300 flex items-center justify-center text-gray-700 hover:text-black hover:border-black transition-all">
                      <Instagram className="w-[1.1vw] h-[1.1vw] min-w-[15px] min-h-[15px]" />
                    </a>
                    <a href="#" className="w-[2.4vw] h-[2.4vw] min-w-[32px] min-h-[32px] rounded-[0.5vw] border border-gray-300 flex items-center justify-center text-gray-700 hover:text-black hover:border-black transition-all">
                      <Facebook className="w-[1.1vw] h-[1.1vw] min-w-[15px] min-h-[15px]" />
                    </a>
                    <a href="#" className="w-[2.4vw] h-[2.4vw] min-w-[32px] min-h-[32px] rounded-[0.5vw] border border-gray-300 flex items-center justify-center text-gray-700 hover:text-black hover:border-black transition-all">
                      <Linkedin className="w-[1.1vw] h-[1.1vw] min-w-[15px] min-h-[15px]" />
                    </a>
                    <a href="#" className="w-[2.4vw] h-[2.4vw] min-w-[32px] min-h-[32px] rounded-[0.5vw] border border-gray-300 flex items-center justify-center text-gray-700 hover:text-black hover:border-black transition-all">
                      <Youtube className="w-[1.1vw] h-[1.1vw] min-w-[15px] min-h-[15px]" />
                    </a>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>

          {/* Right Column: Contact Form Box */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-7"
          >
            <div className="bg-white border border-gray-200/90 rounded-[1.5vw] p-[2.5vw] shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
              {/* Form Title & Description */}
              <div className="mb-[2.5vh]">
                <h2 className="text-[2vw] font-semibold text-gray-900 tracking-tight">
                  Start a Conversation
                </h2>
                <p className="text-[0.78vw] text-gray-400 leading-relaxed mt-[0.6vh]">
                  Have a question? Need technical support? Looking for enterprise solutions? Send us a message and we'll get back to you as soon as possible.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-[2vh]">
                
                {/* Row 1: NAME & Company Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[1.5vw]">
                  {/* Name */}
                  <div>
                    <label className="block text-[0.7vw] font-semibold text-gray-800 uppercase mb-[0.6vh]">
                      NAME <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your Full Name"
                        className="w-full px-[1.2vw] py-[1.4vh] bg-white border border-gray-200 rounded-[0.7vw] text-[0.85vw] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-black transition-all pr-[2.8vw]"
                        required
                      />
                      <User className="absolute right-[1vw] top-1/2 -translate-y-1/2 w-[1.1vw] h-[1.1vw] min-w-[15px] min-h-[15px] text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Company Name */}
                  <div>
                    <label className="block text-[0.7vw] font-semibold text-gray-800 uppercase mb-[0.6vh]">
                      Company Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        placeholder="Your Company Name"
                        className="w-full px-[1.2vw] py-[1.4vh] bg-white border border-gray-200 rounded-[0.7vw] text-[0.85vw] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-black transition-all pr-[2.8vw]"
                      />
                      <Building2 className="absolute right-[1vw] top-1/2 -translate-y-1/2 w-[1.1vw] h-[1.1vw] min-w-[15px] min-h-[15px] text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Row 2: EMAIL & Phone Number */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[1.5vw]">
                  {/* Email */}
                  <div>
                    <label className="block text-[0.7vw] font-semibold text-gray-800 uppercase mb-[0.6vh]">
                      EMAIL <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Your Email Address"
                        className="w-full px-[1.2vw] py-[1.4vh] bg-white border border-gray-200 rounded-[0.7vw] text-[0.85vw] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-black transition-all pr-[2.8vw]"
                        required
                      />
                      <Mail className="absolute right-[1vw] top-1/2 -translate-y-1/2 w-[1.1vw] h-[1.1vw] min-w-[15px] min-h-[15px] text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-[0.7vw] font-semibold text-gray-800 uppercase mb-[0.6vh]">
                      Phone Number
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        placeholder="Your Phone Number"
                        className="w-full px-[1.2vw] py-[1.4vh] bg-white border border-gray-200 rounded-[0.7vw] text-[0.85vw] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-black transition-all pr-[2.8vw]"
                      />
                      <Phone className="absolute right-[1vw] top-1/2 -translate-y-1/2 w-[1.1vw] h-[1.1vw] min-w-[15px] min-h-[15px] text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Row 3: What are you looking for ? */}
                <div>
                  <label className="block text-[0.7vw] font-semibold text-gray-800 uppercase mb-[0.6vh]">
                    What are you looking for ? <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="service"
                      value={formData.service}
                      onChange={handleChange}
                      className="w-full px-[1.2vw] py-[1.4vh] bg-white border border-gray-200 rounded-[0.7vw] text-[0.85vw] text-gray-800 focus:outline-none focus:border-black transition-all appearance-none cursor-pointer pr-[2.8vw]"
                      required
                    >
                      <option value="" disabled>Select Service</option>
                      <option value="catalogue">Custom Interactive Digital Catalogue</option>
                      <option value="3d-experiences">3D & Interactive Experiences</option>
                      <option value="web-app">Web, App & Creative Solutions</option>
                      <option value="enterprise">Enterprise Solutions & Support</option>
                      <option value="other">Other Inquiry</option>
                    </select>
                    <ChevronDown className="absolute right-[1vw] top-1/2 -translate-y-1/2 w-[1.1vw] h-[1.1vw] min-w-[15px] min-h-[15px] text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Row 4: MESSAGE */}
                <div>
                  <label className="block text-[0.7vw] font-semibold text-gray-800 uppercase mb-[0.6vh]">
                    MESSAGE <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <textarea
                      name="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us about your project, question, or idea..."
                      className="w-full px-[1.2vw] py-[1.4vh] bg-white border border-gray-200 rounded-[0.7vw] text-[0.85vw] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-black transition-all resize-none pr-[2.8vw]"
                      required
                    ></textarea>
                    <Pencil className="absolute right-[1vw] top-[1.8vh] w-[1.1vw] h-[1.1vw] min-w-[15px] min-h-[15px] text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-[0.8vh]">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-[1.6vh] bg-black hover:bg-gray-900 active:scale-[0.99] disabled:opacity-70 text-white rounded-[0.7vw] font-medium text-[0.9vw] transition-all duration-200 flex items-center justify-center gap-[0.6vw] shadow-sm cursor-pointer"
                  >
                    <Send className="w-[1.1vw] h-[1.1vw] min-w-[15px] min-h-[15px]" />
                    <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                  </button>
                </div>

              </form>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Other Ways to Connect Section */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="w-full bg-[#373895] text-white py-[10vh] px-[5vw]"
      >
        <div className="max-w-[85vw] mx-auto text-center space-y-[1.5vh] mb-[6vh]">
          <h2 className="text-[2.8vw] font-semibold tracking-tight text-white">
            Other Ways to Connect
          </h2>
          <p className="text-[1vw] text-indigo-100/90 font-normal">
            Choose the communication option that best fits your needs
          </p>
        </div>

        <div className="max-w-[85vw] mx-auto grid grid-cols-1 md:grid-cols-3 gap-[2.5vw] items-stretch">
          
          {/* Card 1: Schedule a Call */}
          <motion.div 
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-white rounded-[1vw] p-[3vw] flex flex-col items-center text-center shadow-lg text-gray-900 justify-between min-h-[42vh]"
          >
            <div className="flex flex-col items-center">
              <div className="w-[5vw] h-[5vw] min-w-[64px] min-h-[64px] rounded-full bg-[#e6e6e6] flex items-center justify-center mb-[2.5vh]">
                <PhoneCall className="w-[2.2vw] h-[2.2vw] min-w-[28px] min-h-[28px] text-gray-900" strokeWidth={1.8} />
              </div>

              <h3 className="text-[1.4vw] font-bold text-gray-900 mb-[1.2vh]">
                Schedule a Call
              </h3>

              <p className="text-[0.85vw] text-gray-500 leading-relaxed max-w-[19vw]">
                Book a meeting with our team to discuss your project and get expert guidance.
              </p>
            </div>

            <div className="pt-[4vh]">
              <a href="#" className="inline-flex items-center gap-[0.4vw] text-black font-semibold text-[0.85vw] hover:gap-[0.6vw] transition-all cursor-pointer">
                <span>Book a Call</span>
                <ArrowUpRight className="w-[1.1vw] h-[1.1vw] min-w-[15px] min-h-[15px]" />
              </a>
            </div>
          </motion.div>

          {/* Card 2: Partnership Inquiry */}
          <motion.div 
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-white rounded-[1vw] p-[3vw] flex flex-col items-center text-center shadow-lg text-gray-900 justify-between min-h-[42vh]"
          >
            <div className="flex flex-col items-center">
              <div className="w-[5vw] h-[5vw] min-w-[64px] min-h-[64px] rounded-full bg-[#e6e6e6] flex items-center justify-center mb-[2.5vh]">
                <Handshake className="w-[2.2vw] h-[2.2vw] min-w-[28px] min-h-[28px] text-gray-900" strokeWidth={1.8} />
              </div>

              <h3 className="text-[1.4vw] font-bold text-gray-900 mb-[1.2vh]">
                Partnership Inquiry
              </h3>

              <p className="text-[0.85vw] text-gray-500 leading-relaxed max-w-[19vw]">
                Interested in collaborating with us? Let's build innovative digital experiences together.
              </p>
            </div>

            <div className="pt-[4vh]">
              <a href="#" className="inline-flex items-center gap-[0.4vw] text-black font-semibold text-[0.85vw] hover:gap-[0.6vw] transition-all cursor-pointer">
                <span>Let's Collaborate</span>
                <ArrowUpRight className="w-[1.1vw] h-[1.1vw] min-w-[15px] min-h-[15px]" />
              </a>
            </div>
          </motion.div>

          {/* Card 3: Project Enquiry */}
          <motion.div 
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-white rounded-[1vw] p-[3vw] flex flex-col items-center text-center shadow-lg text-gray-900 justify-between min-h-[42vh]"
          >
            <div className="flex flex-col items-center">
              <div className="w-[5vw] h-[5vw] min-w-[64px] min-h-[64px] rounded-full bg-[#e6e6e6] flex items-center justify-center mb-[2.5vh]">
                <ClipboardList className="w-[2.2vw] h-[2.2vw] min-w-[28px] min-h-[28px] text-gray-900" strokeWidth={1.8} />
              </div>

              <h3 className="text-[1.4vw] font-bold text-gray-900 mb-[1.2vh]">
                Project Enquiry
              </h3>

              <p className="text-[0.85vw] text-gray-500 leading-relaxed max-w-[19vw]">
                Tell us about your project requirements, and our team will help you find the right solution.
              </p>
            </div>

            <div className="pt-[4vh]">
              <a href="#" className="inline-flex items-center gap-[0.4vw] text-black font-semibold text-[0.85vw] hover:gap-[0.6vw] transition-all cursor-pointer">
                <span>Start Your Project</span>
                <ArrowUpRight className="w-[1.1vw] h-[1.1vw] min-w-[15px] min-h-[15px]" />
              </a>
            </div>
          </motion.div>

        </div>
      </motion.div>

      {/* Ready to Build Your Next Big Thing CTA Banner */}
      <div className="w-full bg-white py-[6vh] px-[5vw]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-[85vw] mx-auto bg-black text-white rounded-[1vw] p-[2.2vw] py-[2.8vh] flex flex-col md:flex-row items-center justify-between gap-[2vw]"
        >
          {/* Left Side: Icon & Text */}
          <div className="flex items-center gap-[1.2vw]">
            <div className="w-[3.5vw] h-[3.5vw] min-w-[48px] min-h-[48px] rounded-full bg-white text-black flex items-center justify-center shrink-0">
              <MessageSquare className="w-[1.6vw] h-[1.6vw] min-w-[20px] min-h-[20px] text-black" strokeWidth={2} />
            </div>

            <div>
              <h3 className="text-[1.5vw] font-bold text-white tracking-tight leading-snug">
                Ready to Build Your Next Big Thing?
              </h3>
              <p className="text-[0.85vw] text-gray-300 font-normal mt-[0.3vh]">
                Let's turn your ideas into immersive digital experiences.
              </p>
            </div>
          </div>

          {/* Right Side: Action Button */}
          <div>
            <Link 
              to="/editor" 
              className="inline-flex items-center gap-[0.6vw] bg-white hover:bg-gray-100 text-black font-bold px-[1.6vw] py-[1.2vh] rounded-[0.5vw] text-[0.9vw] transition-all cursor-pointer shadow-sm shrink-0"
            >
              <span>Create Interactive Catalogue</span>
              <ArrowRight className="w-[1.1vw] h-[1.1vw] min-w-[16px] min-h-[16px]" />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Footer Component */}
      <Footer />
    </div>
  );
}
