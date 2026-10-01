import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Video, 
  Layers, 
  Box, 
  Users, 
  ArrowUpRight, 
  Instagram, 
  Facebook, 
  Linkedin, 
  Youtube 
} from 'lucide-react';
import FlipibookLogo from '../assets/logo/Flipibook_logo.svg';

export default function Footer() {
  return (
    <footer className="w-full bg-[#0c0d0e] text-white font-sans pt-[6vh] pb-[3vh] px-[5vw] relative overflow-hidden">
      
      {/* Background Watermark "IDC" - Centered & Half Hidden */}
      <div className="absolute left-1/2 top-[35%] -translate-x-1/2 -translate-y-1/2 text-[34vw] font-black text-white/[0.03] pointer-events-none select-none tracking-tighter leading-none z-0">
        IDC
      </div>

      {/* Top Hero Section inside Footer */}
      <div className="relative max-w-[85vw] mx-auto py-[8vh] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-[3vw] border-b border-white/10 overflow-hidden">

        {/* Left Side Header */}
        <div className="relative z-10 max-w-[50vw] space-y-[1.4vh]">
          <div className="flex items-center gap-[1vw] text-white text-[1.4vw] font-medium tracking-wide w-full">
            <span className="shrink-0">Let’s Build Your Dream</span>
            <span className="flex-1 h-[1px] bg-gray-500/80 inline-block align-middle"></span>
          </div>
          
          <h2 className="text-[3.5vw] font-bold text-white tracking-tight leading-none">
            Interactive Digital Catalogue
          </h2>
        </div>

        {/* Right Side Call To Action */}
        <div className="relative z-10 flex flex-col items-start lg:items-end text-left space-y-[2.5vh]">
          <p className="text-gray-300 text-[0.88vw] leading-relaxed max-w-[22vw]">
            Turn your static content into an immersive digital experience with 3D, animations, and smart interactions.
          </p>
          
          <div className="flex items-center gap-[1.5vw]">
            <Link 
              to="/editor" 
              className="inline-flex items-center gap-[0.6vw] text-white hover:text-gray-200 font-medium text-[0.95vw] transition-colors cursor-pointer border-1 border-white/40 px-[1.5vw] py-[1.2vh] rounded-[0.5vw]"
            >
              <BookOpen className="w-[1.2vw] h-[1.2vw] min-w-[16px] min-h-[16px]" />
              <span>Create Flipbook</span>
            </Link>
            
            <button className="inline-flex items-center gap-[0.6vw] bg-white hover:bg-gray-100 text-black font-semibold px-[1.5vw] py-[1.2vh] rounded-[0.5vw] text-[0.95vw] transition-all shadow-md cursor-pointer shrink-0">
              <Video className="w-[1.2vw] h-[1.2vw] min-w-[16px] min-h-[16px]" />
              <span>Demo video</span>
            </button>
          </div>
        </div>

      </div>

      {/* Middle Navigation & Info Grid */}
      <div className="max-w-[85vw] mx-auto py-[6vh] grid grid-cols-1 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr] gap-[2.5vw] items-start">
        
        {/* Col 1: Brand Info */}
        <div className="space-y-[1.8vh]">
          <div className="flex items-center gap-[0.5vw]">
            <img src={FlipibookLogo} alt="Flipibook" className="h-[2.8vw] w-auto object-contain" />
          </div>

          <h3 className="font-bold text-white text-[1.1vw] leading-snug whitespace-nowrap">
            Interactive Digital Catalogue
          </h3>

          <p className="text-gray-300 text-[0.8vw] leading-relaxed max-w-[16vw]">
            Create immersive digital catalogue experiences with 3D visualization, AR interaction, multimedia hotspots and smart navigation.
          </p>

          <p className="text-[0.82vw] font-bold text-white pt-[0.3vh] whitespace-nowrap">
            Interactive &nbsp;•&nbsp; Immersive &nbsp;•&nbsp; Intelligent
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-[0.8vw] pt-[0.8vh]">
            <a href="#" className="w-[2.8vw] h-[2.8vw] min-w-[38px] min-h-[38px] rounded-[0.7vw] bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-all shadow-sm">
              <Instagram className="w-[1.2vw] h-[1.2vw] min-w-[18px] min-h-[18px] text-black" />
            </a>
            <a href="#" className="w-[2.8vw] h-[2.8vw] min-w-[38px] min-h-[38px] rounded-[0.7vw] bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-all shadow-sm">
              <Facebook className="w-[1.2vw] h-[1.2vw] min-w-[18px] min-h-[18px] text-black" />
            </a>
            <a href="#" className="w-[2.8vw] h-[2.8vw] min-w-[38px] min-h-[38px] rounded-[0.7vw] bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-all shadow-sm">
              <Linkedin className="w-[1.2vw] h-[1.2vw] min-w-[18px] min-h-[18px] text-black" />
            </a>
            <a href="#" className="w-[2.8vw] h-[2.8vw] min-w-[38px] min-h-[38px] rounded-[0.7vw] bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-all shadow-sm">
              <Youtube className="w-[1.2vw] h-[1.2vw] min-w-[18px] min-h-[18px] text-black" />
            </a>
          </div>
        </div>

        {/* Col 2: Product */}
        <div className="space-y-[1.5vh]">
          <div className="flex items-center gap-[0.5vw] text-white font-bold text-[1.1vw]">
            <Layers className="w-[1.1vw] h-[1.1vw] min-w-[15px] min-h-[15px]" />
            <span>Product</span>
          </div>

          <ul className="space-y-[0.9vh] text-[0.82vw] text-gray-400 font-medium">
            <li>
              <Link to="/home" className="hover:text-white flex items-center gap-[0.3vw] transition-colors">
                <span>Home</span>
                <ArrowUpRight className="w-[0.8vw] h-[0.8vw] min-w-[12px] min-h-[12px]" />
              </Link>
            </li>
            <li><a href="#" className="hover:text-white transition-colors block">Features</a></li>
            <li><a href="#" className="hover:text-white transition-colors block">Templates</a></li>
            <li><a href="#" className="hover:text-white transition-colors block">Explore</a></li>
            <li><a href="#" className="hover:text-white transition-colors block">Pricing</a></li>
          </ul>
        </div>

        {/* Col 3: Experiences */}
        <div className="space-y-[1.5vh]">
          <div className="flex items-center gap-[0.5vw] text-white font-bold text-[1.1vw]">
            <Box className="w-[1.1vw] h-[1.1vw] min-w-[15px] min-h-[15px]" />
            <span>Experiences</span>
          </div>

          <ul className="space-y-[0.9vh] text-[0.82vw] text-gray-400 font-medium">
            <li><a href="#" className="hover:text-white transition-colors block">AR Experience</a></li>
            <li><a href="#" className="hover:text-white transition-colors block">360° Product View</a></li>
            <li><a href="#" className="hover:text-white transition-colors block">Interactive Hotspots</a></li>
            <li><a href="#" className="hover:text-white transition-colors block">3D Product Showcase</a></li>
            <li><a href="#" className="hover:text-white transition-colors block">Multimedia Integration</a></li>
          </ul>
        </div>

        {/* Col 4: Learn */}
        <div className="space-y-[1.5vh]">
          <div className="flex items-center gap-[0.5vw] text-white font-bold text-[1.1vw]">
            <BookOpen className="w-[1.1vw] h-[1.1vw] min-w-[15px] min-h-[15px]" />
            <span>Learn</span>
          </div>

          <ul className="space-y-[0.9vh] text-[0.82vw] text-gray-400 font-medium">
            <li><a href="#" className="hover:text-white transition-colors block">Documentation</a></li>
            <li><a href="#" className="hover:text-white transition-colors block">Tutorials</a></li>
            <li><a href="#" className="hover:text-white transition-colors block">Help Center</a></li>
            <li><a href="#" className="hover:text-white transition-colors block">FAQs</a></li>
            <li><a href="#" className="hover:text-white transition-colors block">Support</a></li>
          </ul>
        </div>

        {/* Col 5: Company */}
        <div className="space-y-[1.5vh]">
          <div className="flex items-center gap-[0.5vw] text-white font-bold text-[1.1vw]">
            <Users className="w-[1.1vw] h-[1.1vw] min-w-[15px] min-h-[15px]" />
            <span>Company</span>
          </div>

          <ul className="space-y-[0.9vh] text-[0.82vw] text-gray-400 font-medium">
            <li><Link to="/about" className="hover:text-white transition-colors block">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-white transition-colors block">Contact Us</Link></li>
            <li><a href="#" className="hover:text-white transition-colors block">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-white transition-colors block">Terms & Conditions</a></li>
          </ul>
        </div>

      </div>

      {/* Bottom Copyright Bar */}
      <div className="max-w-[85vw] mx-auto border-t border-white/10 pt-[2.5vh] text-center">
        <p className="text-gray-400 text-[0.75vw]">
          © 2026 IDC Platform. All Rights Reserved. Designed for immersive digital experience
        </p>
      </div>

    </footer>
  );
}
