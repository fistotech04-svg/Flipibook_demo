import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'framer-motion';
import axios from 'axios';
import HTMLFlipBook from 'react-pageflip';
import { 
  Compass, 
  ArrowUpRight, 
  ArrowLeft, 
  ArrowRight, 
  MoreVertical, 
  User, 
  MapPin, 
  Eye, 
  Star, 
  BookOpen, 
  Box, 
  Video, 
  MonitorSmartphone, 
  BarChart3, 
  Sparkles,
  RotateCcw,
  Layers,
  Sun,
  Palette,
  Clock
} from 'lucide-react';
import CreateFlipbookModal from '../components/CreateFlipbookModal';
import AlertModal from '../components/AlertModal';
import PdfProcessingLoader from '../components/PdfProcessingLoader';
import Footer from './Footer';
import { convertPdfToImages, convertPdfWithInkscape, getDocumentDetails, generatePdfPageSvg, getOfficeDocType, svgToDataUrl } from '../utils/pdfUtils';
import shelfImg from '../assets/Home/shelf.png';
import page1 from '../assets/Home/A4_1.png';
import page2 from '../assets/Home/A4_2.png';
import page3 from '../assets/Home/A4_3.png';
import page4 from '../assets/Home/A4_4.png';
import page5 from '../assets/Home/A4_5.png';
import page6 from '../assets/Home/A4_6.png';
import cover1 from '../assets/Home/Home_Book_1.png';
import cover2 from '../assets/Home/Home_Book_2.png';
import cover3 from '../assets/Home/Home_Book_3.png';
import cover4 from '../assets/Home/Home_Book_4.png';
import cover5 from '../assets/Home/Home_Book_5.png';
import coverSvg1 from '../assets/cover/cover1.svg';
import coverSvg2 from '../assets/cover/cover2.svg';
import coverSvg3 from '../assets/cover/cover3.svg';
import coverSvg4 from '../assets/cover/cover4.svg';
import coverSvg5 from '../assets/cover/cover5.svg';
import slide1 from '../assets/Home/Slide_1.png';
import slide2 from '../assets/Home/Slide_2.png';
import slide3 from '../assets/Home/Slide_3.png';
import slide4 from '../assets/Home/Slide_4.png';
import goldenArrow from '../assets/Home/golden_arrow.png';
import bookShowImg from '../assets/Home/Book_show.png';

// Real-time 3D Particle Wave Dots Canvas Component
const WaveDotsCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const cols = 55;
    const rows = 28;
    let count = 0;

    const render = () => {
      if (!canvas || !ctx) return;
      const width = canvas.width = canvas.parentElement?.clientWidth || 600;
      const height = canvas.height = canvas.parentElement?.clientHeight || 350;

      ctx.clearRect(0, 0, width, height);

      count += 0.025;

      const gapX = width / cols;
      const gapY = height / rows;

      for (let ix = 0; ix < cols; ix++) {
        for (let iy = 0; iy < rows; iy++) {
          const x = ix * gapX;
          
          // Sinusoidal 3D wave motion formula
          const wave1 = Math.sin((ix * 0.18) + count) * 16;
          const wave2 = Math.cos((iy * 0.22) + count * 0.85) * 12;
          const y = height * 0.45 + (iy - rows / 2) * (gapY * 0.7) + wave1 + wave2;

          // Depth-based size and opacity
          const depthRatio = iy / rows;
          const opacity = Math.max(0.05, Math.min(0.85, (1 - depthRatio * 0.6) * (ix / cols)));
          const size = Math.max(0.6, (1 - depthRatio * 0.4) * 2.2);

          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.75})`;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute bottom-0 left-0 w-[42vw] h-[25vw] pointer-events-none z-0 opacity-80"
    />
  );
};

// Isolated 4-Step Interactive Workflow Section Component (Height: 100vh, Wheel Locked, Auto-Fitting)
const WorkflowScrollSection = ({ slides, goldenArrow }) => {
  const containerRef = useRef(null);
  const reelRef = useRef(null);
  const stepRefs = useRef([]);
  const [activeStep, setActiveStep] = useState(0);
  const [reelY, setReelY] = useState(0);
  const stepCooldownRef = useRef(0);
  const topExitTimeRef = useRef(0);
  const bottomExitTimeRef = useRef(0);
  const hasAutoSnappedRef = useRef(false);

  const isInView = useInView(containerRef, {
    amount: 0.6
  });

  // Auto-snap container to fit 100% dead on screen when user scrolls near it
  useEffect(() => {
    if (isInView && containerRef.current && !hasAutoSnappedRef.current) {
      hasAutoSnappedRef.current = true;
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (!isInView) {
      hasAutoSnappedRef.current = false;
    }
  }, [isInView]);

  // Lock section exits for 650ms whenever activeStep changes so fast scrolling cannot skip steps
  useEffect(() => {
    const lockUntil = Date.now() + 650;
    stepCooldownRef.current = lockUntil;
    topExitTimeRef.current = lockUntil;
    bottomExitTimeRef.current = lockUntil;
  }, [activeStep]);

  // Calculate dynamic center alignment so active step's title row matches golden arrow 100%
  const updateAlignment = useCallback(() => {
    if (reelRef.current && stepRefs.current[activeStep]) {
      const parentHeight = reelRef.current.parentElement.offsetHeight;
      const stepElem = stepRefs.current[activeStep];
      const titleRow = stepElem.querySelector('.title-row') || stepElem;
      
      const stepTop = stepElem.offsetTop;
      const titleHeight = titleRow.offsetHeight;
      
      // Optical adjustment (-42px) to align text baseline 100% dead straight with golden arrow tip
      const targetY = (parentHeight / 2) - stepTop - (titleHeight / 2) - 42;
      setReelY(targetY);
    }
  }, [activeStep]);

  useEffect(() => {
    updateAlignment();
    const timer = setTimeout(updateAlignment, 350);
    return () => clearTimeout(timer);
  }, [activeStep, updateAlignment]);

  useEffect(() => {
    const handleWheel = (e) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const delta = e.deltaY;
      if (Math.abs(delta) < 5) return;

      const now = Date.now();

      if (delta > 0) {
        // Scroll Down
        const isEnteringOrInView = rect.top < vh * 0.95 && rect.top > -vh * 0.5;

        if (activeStep < 3 && isEnteringOrInView) {
          e.preventDefault();
          e.stopPropagation();

          if (now >= stepCooldownRef.current) {
            stepCooldownRef.current = now + 550;
            setActiveStep(prev => {
              const next = prev + 1;
              if (next === 3) bottomExitTimeRef.current = Date.now() + 600;
              return next;
            });
            if (Math.abs(rect.top) > 10) {
              containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
        } else if (activeStep === 3 && isEnteringOrInView) {
          // At Step 3 (04 Analyze Performance) - Lock wheel until exit hold passes
          if (now < bottomExitTimeRef.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
      } else if (delta < 0) {
        // Scroll Up
        const isEnteringOrInView = rect.bottom > vh * 0.05 && rect.bottom < vh * 1.5;

        if (activeStep > 0 && isEnteringOrInView) {
          e.preventDefault();
          e.stopPropagation();

          if (now >= stepCooldownRef.current) {
            stepCooldownRef.current = now + 550;
            setActiveStep(prev => {
              const next = prev - 1;
              if (next === 0) topExitTimeRef.current = Date.now() + 600;
              return next;
            });
            if (Math.abs(rect.top) > 10) {
              containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
        } else if (activeStep === 0 && isEnteringOrInView) {
          // At Step 0 (01 Upload / Select) - Lock wheel until exit hold passes
          if (now < topExitTimeRef.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    return () => {
      window.removeEventListener('wheel', handleWheel, { capture: true });
    };
  }, [activeStep]);

  const steps = [
    {
      number: "01",
      title: "Upload / Select",
      label: "Page",
      desc: "Start from scratch, upload PDFs, import content, or choose from professionally designed templates to create your publication."
    },
    {
      number: "02",
      title: "Customize Pages & Layouts",
      label: "Section",
      desc: "Design pages, customize layouts, apply themes, add branding, configure animations, 3D effects, hotspots, media, and interactive elements."
    },
    {
      number: "03",
      title: "Publish & Share",
      label: "Flipbook",
      desc: "Publish instantly with custom links, embed on websites, share across platforms, manage privacy settings, and control audience access."
    },
    {
      number: "04",
      title: "Analyze Performance",
      label: "of your Books",
      desc: "Track views, monitor reader engagement, analyze page performance, measure interactions, and gain actionable insights from audience behavior."
    }
  ];

  return (
    <div ref={containerRef} className="snap-start w-full min-h-[100vh] h-[100vh] bg-black text-white font-sans relative flex flex-col lg:flex-row items-center justify-between px-[6vw] py-[6vh] overflow-hidden gap-[3vw] border-t border-white/10">
      
      {/* Left Column - Dynamic Slide Preview Card Image */}
      <div className="relative w-full lg:w-[42vw] aspect-[4/3] rounded-[1.2vw] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.95)] border border-white/10 bg-[#0c0c0e] flex items-center justify-center group flex-shrink-0 z-20">
        <motion.img 
          key={activeStep}
          src={slides[activeStep]} 
          alt="Workflow preview" 
          initial={{ opacity: 0.3, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full h-full object-cover"
        />

        {/* Glossy Overlay Highlight */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/5 pointer-events-none"></div>
      </div>

      {/* Center Fixed Golden Arrow (Stationary at Vertical Center) */}
      <div className="hidden lg:flex items-center justify-center w-[2vw] min-w-[28px] h-[2vw] z-30 flex-shrink-0">
        <img 
          src={goldenArrow} 
          alt="Active pointer" 
          className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(234,179,8,0.7)]" 
        />
      </div>

      {/* Right Column - Vertically Translating Text Reel */}
      <div className="flex-1 h-[70vh] relative overflow-hidden flex items-center justify-start z-10 pl-[1vw]">
        <motion.div 
          ref={reelRef}
          animate={{ y: reelY }}
          transition={{ type: "spring", stiffness: 220, damping: 26 }}
          className="flex flex-col space-y-[4.5vh] w-full max-w-[42vw]"
        >
          {steps.map((step, idx) => {
            const isActive = activeStep === idx;
            return (
              <div 
                key={step.number}
                ref={el => stepRefs.current[idx] = el}
                className={`group cursor-default transition-all duration-500 relative py-[0.5vh] ${
                  isActive ? "opacity-100 scale-100" : "opacity-30 scale-98 hover:opacity-60"
                }`}
              >
                <div className="title-row flex items-center gap-[1.5vw]">
                  {/* Step Number */}
                  <span className={`text-[3.6vw] font-extrabold tracking-tighter leading-none transition-colors duration-300 ${
                    isActive ? "text-white" : "text-gray-600"
                  }`}>
                    {step.number}
                  </span>

                  {/* Title & Underline Line Container */}
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between">
                      <h3 className={`text-[2vw] font-bold tracking-tight transition-colors duration-300 ${
                        isActive ? "text-white" : "text-gray-500"
                      }`}>
                        {step.title}
                      </h3>
                      {isActive && step.label && (
                        <span className="text-[0.75vw] text-gray-400 font-normal uppercase tracking-widest pl-[1vw]">
                          {step.label}
                        </span>
                      )}
                    </div>

                    {/* Underline Line */}
                    <div className={`w-full h-[1px] mt-[0.8vh] transition-colors duration-300 ${
                      isActive ? "bg-gray-500" : "bg-gray-800/40"
                    }`}></div>
                  </div>
                </div>

                {/* Expanded Subtitle Description when active in Center */}
                {isActive && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3 }}
                    className="pl-[5.2vw] pt-[1.5vh] overflow-hidden"
                  >
                    <p className="text-[0.92vw] text-gray-400 font-normal leading-relaxed max-w-[34vw]">
                      {step.desc}
                    </p>
                  </motion.div>
                )}
              </div>
            );
          })}
        </motion.div>
      </div>

    </div>
  );
};

// Isolated 3D Reading Experience Showcase Component (using Book_show.png)
const ThreeDExperienceSection = ({ bookShowImg }) => {
  const [activeHotspot, setActiveHotspot] = useState(null);

  const features = [
    {
      id: "models",
      title: "3D Models",
      desc: "Import realistic 3D models into your flipbook pages.",
      icon: <Box className="w-[1.2vw] h-[1.2vw] text-white stroke-[1.8]" />,
      top: "18%",
      leftOffset: "-5vw"
    },
    {
      id: "rotate",
      title: "360° Rotate",
      desc: "Rotate and explore every model from every angle.",
      icon: <RotateCcw className="w-[1.2vw] h-[1.2vw] text-white stroke-[1.8]" />,
      top: "36%",
      leftOffset: "-5vw"
    },
    {
      id: "texture",
      title: "Texture Editor",
      desc: "Apply materials, textures, and realistic surface finishes.",
      icon: <Layers className="w-[1.2vw] h-[1.2vw] text-white stroke-[1.8]" />,
      top: "55%",
      leftOffset: "-5vw"
    },
    {
      id: "lighting",
      title: "Lighting",
      desc: "Adjust lights, shadows, reflections, and scene ambience.",
      icon: <Sun className="w-[1.2vw] h-[1.2vw] text-white stroke-[1.8]" />,
      top: "73%",
      leftOffset: "-5vw"
    },
    {
      id: "background",
      title: "Background Color",
      desc: "Customize popup backgrounds to match your brand style.",
      icon: <Palette className="w-[1.2vw] h-[1.2vw] text-white stroke-[1.8]" />,
      top: "92%",
      leftOffset: "-5vw"
    }
  ];

  return (
    <div className="snap-start w-full min-h-[96vh] bg-black text-white font-sans relative flex flex-col lg:flex-row items-center justify-between px-[5vw] py-[6vh] overflow-hidden gap-[2vw] border-t border-white/10">
      
      {/* Left Column Text & CTA */}
      <div className="max-w-[25vw] flex flex-col justify-center z-10 space-y-[2.5vh] pt-[2vh] flex-shrink-0">
        {/* Top Tag Header */}
        <div className="flex items-center gap-[0.6vw]">
          <span className="w-[3px] h-[1.3vw] min-h-[16px] bg-blue-500 rounded-full inline-block"></span>
          <h4 className="text-[0.8vw] font-bold text-gray-400 uppercase tracking-widest">
            3D FLIPBOOK EXPERIENCE
          </h4>
        </div>

        {/* Main Title */}
        <h2 className="text-[3.2vw] font-extrabold text-white leading-[1.1] tracking-tight">
          Not Just Pages. <br />
          A <span className="text-blue-500 font-black">3D</span> Reading <br />
          Experience.
        </h2>

        {/* Subtitle Paragraph */}
        <p className="text-[0.88vw] text-gray-400 font-normal leading-relaxed max-w-[19vw]">
          Transform static flipbooks into immersive experiences with realistic 3D objects, interactive hotspots, videos, audio, and smooth page transitions.
        </p>

        {/* CTA Button */}
        <div className="pt-[1.5vh]">
          <button className="flex items-center gap-[0.8vw] px-[1.6vw] py-[1.1vh] bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-semibold text-[0.85vw] shadow-[0_10px_25px_rgba(79,70,229,0.35)] hover:shadow-[0_15px_35px_rgba(79,70,229,0.5)] transition-all duration-300 active:scale-98 group cursor-pointer">
            Bring Your Products Into 3D
            <ArrowRight className="w-[1vw] h-[1vw] text-white group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Shared Container for Image & Perfectly Aligned Right List */}
      <div className="flex-1 relative flex items-center justify-between z-10 w-full pl-[1vw]">
        <div className="relative w-full max-w-[76vw] aspect-[16/9] flex items-center justify-between mx-auto">
          
          {/* Center Image */}
          <div className="w-[74%] h-full relative flex items-center justify-center scale-105">
            <img 
              src={bookShowImg} 
              alt="3D Reading Experience" 
              className="w-full h-full object-contain" 
            />
          </div>

          {/* Right Column - 5 Features Positioned 100% Dead On Matching the 5 Blue Lines */}
          <div className="w-[26%] h-full relative z-10">
            {features.map((item) => {
              const isHovered = activeHotspot === item.id;
              return (
                <div 
                  key={item.id}
                  style={{ top: item.top, marginLeft: item.leftOffset }}
                  className={`absolute transform -translate-y-1/2 flex items-center gap-[0.8vw] group transition-all duration-300 cursor-pointer w-full ${
                    isHovered ? "opacity-100 scale-102" : "opacity-85 hover:opacity-100"
                  }`}
                  onMouseEnter={() => setActiveHotspot(item.id)}
                  onMouseLeave={() => setActiveHotspot(null)}
                >
                  {/* Circular Badge Icon */}
                  <div className={`w-[2.4vw] h-[2.4vw] min-w-[32px] min-h-[32px] rounded-full border flex items-center justify-center flex-shrink-0 transition-colors duration-300 shadow-md ${
                    isHovered 
                      ? "border-blue-400 bg-blue-600/30 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                      : "border-white/20 bg-black/60 backdrop-blur-md text-gray-300 group-hover:border-white/40"
                  }`}>
                    {item.icon}
                  </div>

                  {/* Title & Description */}
                  <div className="flex-1 space-y-[0.1vh]">
                    <h3 className={`text-[0.95vw] font-bold tracking-tight transition-colors duration-300 ${
                      isHovered ? "text-blue-400" : "text-white group-hover:text-gray-200"
                    }`}>
                      {item.title}
                    </h3>
                    <p className="text-[0.72vw] text-gray-400 font-normal leading-tight">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Interactive Digital Catalogue Section Component with Top Floating Stats Bar
const InteractiveDigitalCatalogueSection = ({ onOpenCreateModal }) => {
  const stats = [
    {
      id: 1,
      value: "10K+",
      label: "Active Users",
      icon: <User className="w-[1.2vw] h-[1.2vw] text-indigo-600 stroke-[2]" />,
      bg: "bg-indigo-50/90"
    },
    {
      id: 2,
      value: "50K+",
      label: "Flipbooks Created",
      icon: <BookOpen className="w-[1.2vw] h-[1.2vw] text-indigo-600 stroke-[2]" />,
      bg: "bg-indigo-50/90"
    },
    {
      id: 3,
      value: "1M+",
      label: "Readers Engaged",
      icon: <BarChart3 className="w-[1.2vw] h-[1.2vw] text-purple-600 stroke-[2]" />,
      bg: "bg-purple-50/90"
    },
    {
      id: 4,
      value: "99.9%",
      label: "Uptime & Reliable",
      icon: <Sparkles className="w-[1.2vw] h-[1.2vw] text-indigo-600 stroke-[2]" />,
      bg: "bg-indigo-50/90"
    },
    {
      id: 5,
      value: "24/7",
      label: "Customer Support",
      icon: <Clock className="w-[1.2vw] h-[1.2vw] text-purple-600 stroke-[2]" />,
      bg: "bg-purple-50/90"
    }
  ];

  return (
    <div className="snap-start w-full bg-white text-gray-900 font-sans relative py-[8vh] px-[5vw] overflow-hidden border-t border-gray-100 flex flex-col items-center">
      
      {/* Top Floating Stats Bar Pill Card */}
      <div className="w-full max-w-[86vw] bg-white border border-gray-200/90 rounded-2xl sm:rounded-full p-[1.1vw] px-[3vw] shadow-[0_10px_30px_rgba(0,0,0,0.04)] flex flex-wrap md:flex-nowrap items-center justify-between gap-[2vw] mb-[8vh] z-10">
        {stats.map((stat, idx) => (
          <React.Fragment key={stat.id}>
            <div className="flex items-center gap-[0.9vw]">
              <div className={`w-[2.8vw] h-[2.8vw] min-w-[36px] min-h-[36px] rounded-full ${stat.bg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                {stat.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-[1.15vw] min-text-[16px] font-extrabold text-gray-900 leading-tight">
                  {stat.value}
                </span>
                <span className="text-[0.75vw] min-text-[11px] text-gray-500 font-medium">
                  {stat.label}
                </span>
              </div>
            </div>
            {idx < stats.length - 1 && (
              <div className="hidden md:block w-[1px] h-[2vw] bg-gray-100"></div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Main Section Content Area */}
      <div className="w-full max-w-[86vw] relative flex flex-col md:flex-row items-center justify-between gap-[4vw] py-[4vh] z-10">
        
        {/* Giant Watermark Background Text "IDC" */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[22vw] font-black text-gray-100/70 pointer-events-none select-none z-0 tracking-tighter leading-none">
          IDC
        </div>

        {/* Left Headline */}
        <div className="relative z-10 max-w-[48vw] space-y-[1vh]">
          {/* Subheader with Line */}
          <div className="flex items-center gap-[1.2vw]">
            <h3 className="text-[1.8vw] font-medium text-gray-800 tracking-tight">
              Let&apos;s Build Your Dream
            </h3>
            <span className="flex-1 max-w-[12vw] h-[1px] bg-gray-300"></span>
          </div>

          {/* Main Title */}
          <h2 className="text-[3.8vw] font-black text-gray-900 leading-[1.08] tracking-tight">
            Interactive Digital Catalogue
          </h2>
        </div>

        {/* Right Description & Buttons */}
        <div className="relative z-10 max-w-[28vw] flex flex-col space-y-[2.5vh]">
          <p className="text-[0.95vw] text-gray-600 font-normal leading-relaxed">
            Turn your static content into an immersive digital experience with 3D, animations, and smart interactions.
          </p>

          <div className="flex items-center gap-[1vw] pt-[1vh]">
            <button 
              onClick={onOpenCreateModal}
              className="bg-black hover:bg-gray-800 text-white px-[1.6vw] py-[1.1vh] rounded-[0.5vw] font-semibold text-[0.9vw] shadow-md transition-all flex items-center gap-[0.6vw] cursor-pointer group"
            >
              <BookOpen className="w-[1vw] h-[1vw] text-white" />
              Create Flipbook
            </button>

            <button 
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 px-[1.6vw] py-[1.1vh] rounded-[0.5vw] font-semibold text-[0.9vw] transition-all flex items-center gap-[0.6vw] cursor-pointer"
            >
              <Video className="w-[1vw] h-[1vw] text-gray-700" />
              Demo video
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default function Home() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);
  const navigate = useNavigate();

  // User Data
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const emailId = user?.emailId;
  const backendUrl = import.meta.env.VITE_BACKEND_URL || '';

  const [isLoading, setIsLoading] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(null);
  const isUploadCancelledRef = useRef(false);
  const createdFlipbookVIdRef = useRef(null);
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'error',
    showCancel: false,
    onConfirm: null
  });

  const showAlert = (title, message, type = 'error') => {
    setAlertState({
      isOpen: true,
      title,
      message,
      type,
      showCancel: false,
      onConfirm: () => setAlertState(prev => ({ ...prev, isOpen: false }))
    });
  };
  const containerRef = useRef(null);
  const editorsContainerRef = useRef(null);
  const [scrollContainer, setScrollContainer] = useState(null);

  useEffect(() => {
    if (editorsContainerRef.current) {
      setScrollContainer(editorsContainerRef.current.parentElement);
    }
  }, []);

  const { scrollYProgress: editorsScrollProgress } = useScroll({
    target: editorsContainerRef,
    container: scrollContainer || undefined,
    offset: ["start start", "end end"]
  });

  // react-pageflip Logic
  const bookRef = useRef(null);
  const flipCooldownRef = useRef(0);

  const [page, setPage] = useState(0);

  const onPage = useCallback((e) => {
    setPage(e.data);
  }, []);

  useEffect(() => {
    const handleWheel = (e) => {
      if (!containerRef.current || !bookRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const delta = e.deltaY;
      if (Math.abs(delta) < 5) return;

      const flipbook = bookRef.current.pageFlip();
      const state = flipbook ? flipbook.getState() : '';
      const now = Date.now();
      const isFlipping = state === 'flipping' || now < flipCooldownRef.current;

      if (delta > 0) {
        // Scroll Down
        const isEnteringOrInView = rect.top < vh * 0.95 && rect.top > -vh * 0.5;

        if (page < 4 && isEnteringOrInView) {
          e.preventDefault();
          e.stopPropagation();

          if (!isFlipping) {
            flipCooldownRef.current = now + 650;
            flipbook.flipNext();
            if (Math.abs(rect.top) > 10) {
              containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
        }
      } else if (delta < 0) {
        // Scroll Up
        const isEnteringOrInView = rect.bottom > vh * 0.05 && rect.bottom < vh * 1.5;

        if (page > 0 && isEnteringOrInView) {
          e.preventDefault();
          e.stopPropagation();

          if (!isFlipping) {
            flipCooldownRef.current = now + 650;
            flipbook.flipPrev();
            if (Math.abs(rect.top) > 10) {
              containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    return () => {
      window.removeEventListener('wheel', handleWheel, { capture: true });
    };
  }, [page]);

  useEffect(() => {
    // Scroll progress etc could go here if needed
  }, []);

  // Helper: convert a Blob to a base64 data URI
  const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const handleCreateFlipbook = () => {
    setIsCreateModalOpen(true);
  };

  const handleUploadPDF = async (files, customName) => {
    if (!files || files.length === 0) return;
    setIsCreateModalOpen(false);
    setIsLoading(true);
    isUploadCancelledRef.current = false;
    createdFlipbookVIdRef.current = null;

    const firstFile = files[0];
    const initialDocType = firstFile._docType || getOfficeDocType(firstFile.name);
    const initialDocLabel = initialDocType === 'word' ? 'Word document' : initialDocType === 'powerpoint' ? 'PowerPoint presentation' : 'file';
    const initialPageCount = firstFile._pageCount || 1;

    // INSTANT LOADER APPEARANCE (0ms latency - immediately on button click!)
    setProcessingProgress({
      current: 1,
      total: files.length,
      fileIndex: 0,
      totalFiles: files.length,
      pageCount: initialPageCount,
      message: files.length > 1
        ? `Converting queued ${initialDocLabel} 1 of ${files.length} (${firstFile.name})...`
        : `Converting ${initialDocLabel}: ${firstFile.name}...`,
      fileName: firstFile.name,
      stage: 'converting'
    });

    try {
      // PDF 12-page limit (commented out for now - can re-enable later):
      // const MAX_TOTAL_PAGES = 12;
      const MAX_TOTAL_PAGES = Infinity;
      let totalPdfSize = 0;
      for (const file of files) {
        totalPdfSize += file.size || 0;
      }
      let allImages = [];

      // Step 1 — Extract pages from all PDFs
      for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
        if (isUploadCancelledRef.current) return;
        const file = files[fileIndex];
        if (allImages.length >= MAX_TOTAL_PAGES) break;

        const remainingPages = MAX_TOTAL_PAGES - allImages.length;
        const docType = file._docType || getOfficeDocType(file.name);
        const docLabel = docType === 'word' ? 'Word document' : docType === 'powerpoint' ? 'PowerPoint presentation' : 'file';
        const detectedCount = file._pageCount || 1;

        setProcessingProgress({
          current: fileIndex + 1,
          total: files.length,
          fileIndex,
          totalFiles: files.length,
          pageCount: detectedCount,
          message: files.length > 1
            ? `Converting queued ${docLabel} ${fileIndex + 1} of ${files.length} (${file.name})...`
            : `Converting ${docLabel}: ${file.name}...`,
          fileName: file.name,
          stage: 'converting'
        });
        const images = await convertPdfWithInkscape(file, remainingPages, backendUrl);
        if (isUploadCancelledRef.current) return;
        allImages = [...allImages, ...images];
      }

      if (isUploadCancelledRef.current) return;

      if (allImages.length === 0) {
        showAlert("Error", "No pages could be extracted from the selected files.");
        return;
      }

      const firstW = allImages[0].width;
      const firstH = allImages[0].height;
      const isUniform = allImages.every(img =>
        Math.abs(img.width - firstW) < 1 &&
        Math.abs(img.height - firstH) < 1
      );
      if (!isUniform) {
        showAlert("Uniformity Error", "Selected PDF pages have different dimensions. All pages in a flipbook must have the same size to ensure a professional layout.");
        return;
      }
      const maxWidth = firstW;
      const maxHeight = firstH;

      const now = new Date();
      const timeString = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);
      const defaultPrefix = initialDocType === 'word' ? 'Word_Flipbook_' : initialDocType === 'powerpoint' ? 'PPT_Flipbook_' : 'PDF_Flipbook_';
      let uniqueName = customName;
      if (!uniqueName || (uniqueName.startsWith('PDF_Flipbook_') && initialDocType !== 'pdf')) {
        uniqueName = customName ? customName.replace(/^PDF_Flipbook_/, defaultPrefix) : `${defaultPrefix}${timeString}`;
      }
      const targetFolder = 'My_Flipbooks';

      // Step 2 — Encode pages and save flipbook in a single high-speed request
      setProcessingProgress({
        current: 0,
        total: allImages.length,
        totalFiles: files.length,
        message: 'Saving pages & binding flipbook...',
        fileName: uniqueName,
        stage: 'saving'
      });
      const allPages = await Promise.all(allImages.map(async (img, idx) => {
        const pageIndex = idx + 1;
        const base64Url = img.dataUrl || (img.content ? svgToDataUrl(img.content) : "") || (img.blob ? await blobToBase64(img.blob) : "");
        const html = img.content || generatePdfPageSvg(base64Url, `Page ${pageIndex}`, maxWidth, maxHeight, true);
        return {
          pageName: `Page ${pageIndex}`,
          content: html,
          pageNumber: pageIndex
        };
      }));

      if (isUploadCancelledRef.current) return;

      // For standard flipbooks (up to 20 pages), save in a single request!
      if (allPages.length <= 20) {
        setProcessingProgress({
          current: allPages.length,
          total: allPages.length,
          totalFiles: files.length,
          message: 'Saving pages & binding flipbook...',
          fileName: uniqueName,
          stage: 'saving'
        });
        const createRes = await axios.post(`${backendUrl}/api/flipbook/save`, {
          emailId,
          flipbookName: uniqueName,
          pages: allPages,
          overwrite: true,
          folderName: targetFolder,
          keepBase64: true,
          fileSize: totalPdfSize || allImages.reduce((sum, img) => sum + (img.blob?.size || 0), 0)
        });
        const v_id = createRes.data.v_id;
        createdFlipbookVIdRef.current = v_id;

        if (isUploadCancelledRef.current) {
          axios.delete(`${backendUrl}/api/flipbook/delete/${v_id}`, { params: { emailId } }).catch(() => {});
          return;
        }

        setProcessingProgress({
          current: allPages.length,
          total: allPages.length,
          totalFiles: files.length,
          message: 'Opening flipbook...',
          fileName: uniqueName,
          stage: 'done'
        });

        // Navigate to the editor
        navigate(`/editor/${encodeURIComponent(targetFolder)}/${v_id}`);
        return;
      }

      // For extra large flipbooks (> 20 pages), save initial batch then batch remaining
      const initialBatch = allPages.slice(0, 20);
      const createRes = await axios.post(`${backendUrl}/api/flipbook/save`, {
        emailId,
        flipbookName: uniqueName,
        pages: initialBatch,
        overwrite: true,
        folderName: targetFolder,
        keepBase64: true,
        fileSize: totalPdfSize || allImages.reduce((sum, img) => sum + (img.blob?.size || 0), 0)
      });
      const v_id = createRes.data.v_id;
      createdFlipbookVIdRef.current = v_id;

      const BATCH_SIZE = 15;
      for (let i = 20; i < allPages.length; i += BATCH_SIZE) {
        if (isUploadCancelledRef.current) {
          axios.delete(`${backendUrl}/api/flipbook/delete/${v_id}`, { params: { emailId } }).catch(() => {});
          return;
        }
        const batchPages = allPages.slice(i, i + BATCH_SIZE);
        setProcessingProgress({
          current: Math.min(i + BATCH_SIZE, allPages.length),
          total: allPages.length,
          totalFiles: files.length,
          message: `Saving pages ${i + 1} to ${Math.min(i + BATCH_SIZE, allPages.length)} of ${allPages.length}...`,
          fileName: uniqueName,
          stage: 'saving'
        });
        await axios.post(`${backendUrl}/api/flipbook/save-pages-batch`, {
          emailId,
          v_id,
          pages: batchPages,
          keepBase64: true,
          fileSize: totalPdfSize
        });
      }

      if (isUploadCancelledRef.current) {
        axios.delete(`${backendUrl}/api/flipbook/delete/${v_id}`, { params: { emailId } }).catch(() => {});
        return;
      }

      setProcessingProgress({
        current: allPages.length,
        total: allPages.length,
        totalFiles: files.length,
        message: 'Opening flipbook...',
        fileName: uniqueName,
        stage: 'done'
      });

      // Step 4 — Navigate to the editor
      navigate(`/editor/${encodeURIComponent(targetFolder)}/${v_id}`);

    } catch (error) {
      if (!isUploadCancelledRef.current) {
        console.error("PDF/Document conversion error:", error);
        const rawMsg = error.response?.data?.message || error.message || "";
        const isCorrupt = error.response?.data?.isCorrupted ||
                          /corrupt|cannot be read|not be loaded|damaged|password|format error|failed to parse|invalid pdf|syntax error/i.test(rawMsg);
        const userMessage = isCorrupt
            ? (rawMsg.includes("is corrupted") || rawMsg.includes("corrupted, unreadable") ? rawMsg : "Your file is corrupted, unreadable, or password-protected. Please check your document and try again.")
            : (rawMsg || "Failed to process document. Please try again.");
        showAlert(isCorrupt ? "File Corrupted" : "Error", userMessage);
      }
    } finally {
      setIsLoading(false);
      setProcessingProgress(null);
      isUploadCancelledRef.current = false;
    }
  };

  const handleCancelUploadPDF = () => {
    isUploadCancelledRef.current = true;
    setIsLoading(false);
    setProcessingProgress(null);
    if (createdFlipbookVIdRef.current) {
      axios.delete(`${backendUrl}/api/flipbook/delete/${createdFlipbookVIdRef.current}`, { params: { emailId } }).catch(() => {});
      createdFlipbookVIdRef.current = null;
    }
  };

  const handleUseTemplate = async (templateData) => {
    setIsCreateModalOpen(false);
    if (!templateData) return;

    if (!emailId) {
      navigate('/editor', { state: templateData });
      return;
    }

    setIsLoading(true);
    try {
      const pageCount = templateData.pageCount || 12;
      const pages = Array.from({ length: pageCount }, (_, i) => ({
        pageName: `Page ${i + 1}`,
        content: ''
      }));

      const now = new Date();
      const timeString = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);
      const uniqueName = templateData.flipbookName || `Flipbook_${timeString}`;
      const targetFolder = 'My_Flipbooks';

      const res = await axios.post(`${backendUrl}/api/flipbook/save`, {
        emailId,
        flipbookName: uniqueName,
        pages: pages,
        overwrite: true,
        folderName: targetFolder,
        meta: {
          width: templateData.width,
          height: templateData.height,
          templateId: templateData.templateId,
          orientation: templateData.orientation
        }
      });

      if (res.data && res.data.v_id) {
        navigate(`/editor/${encodeURIComponent(targetFolder)}/${res.data.v_id}`, { state: templateData });
      } else {
        navigate('/editor', { state: templateData });
      }
    } catch (e) {
      console.error("Creation failed", e);
      navigate('/editor', { state: templateData });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white text-[#1a1a1a] font-sans">
      {/* Hero Section Container */}
      <div className="snap-start w-[100%] h-[92vh] mx-auto px-[3vw] relative flex flex-col pt-[5vh]">

        {/* Main Content Area */}
        <div className="flex items-start justify-between gap-[5vw] w-full">
          {/* Left Content */}
          <div className="space-y-[1.5vw] animate-in fade-in slide-in-from-left-8 duration-700 w-[45%] pt-[2vh]">
            <h1 className="text-[4vw] font-[600] tracking-tight leading-[1.1] text-gray-900">
              Bring Your Content <br />
              to Life with <span className="text-transparent text-[4.5vw] font-bold bg-clip-text bg-gradient-to-r from-[#9333ea] to-[#db2777]" style={{ filter: 'url(#inner-shadow)' }}>IDC</span>
            </h1>

            <p className="text-[1.1vw] text-gray-500 w-full leading-relaxed font-regular">
              Turn static pages into immersive, interactive digital catalogues that engage, respond, and feel alive with every interaction
            </p>

            <div className="flex items-center gap-[1.5vw] pt-[0.5vw]">
              <button
                onClick={() => navigate('/my-flipbooks')}
                className="flex items-center cursor-pointer gap-[0.5vw] px-[2vw] py-[0.8vw] bg-white text-gray-900 border border-gray-100 rounded-[0.5vw] font-semibold shadow-md hover:shadow-lg transition-all duration-300 active:scale-95 text-[0.9vw]"
              >
                <Icon icon="material-symbols:book-ribbon" className="text-[1.3vw]" />
                My Flipbooks
              </button>

              <button
                className="flex items-center cursor-pointer gap-[0.5vw] px-[2vw] py-[0.8vw] bg-black text-white rounded-[0.5vw] font-semibold shadow-[0_0.5vw_2vw_-0.5vw_rgba(0,0,0,0.3)] hover:bg-gray-800 transition-all duration-300 active:scale-95 text-[0.9vw]"
              >
                <Icon icon="basil:video-outline" className="text-[1.3vw]" />
                Demo video
              </button>
            </div>
          </div>

          {/* Right Content - Shelf Image */}
          <div className="relative flex justify-end animate-in fade-in zoom-in-95 duration-1000 delay-200 w-[60%] pt-[8vh]">
            <div className="relative w-full">
              <img
                src={shelfImg}
                alt="Content Shelf"
                className="w-full h-auto drop-shadow-[0_5vw_6vw_rgba(0,0,0,0.2)]"
              />
            </div>
          </div>
        </div>

        {/* Bottom Footer Text - Anchored to bottom */}
        <div className="absolute bottom-[7vh] left-[3vw] animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
          <p className="text-black text-[0.95vw] font-[500]">
            Upload, Customize, and Publish your flipbook with powerful tools and Immersive 3D effects
          </p>
        </div>
      </div>

      {/* Book Section - Featured Flipbook */}
      <div
        ref={containerRef}
        className="snap-start w-full min-h-[92vh] bg-[#e6e6e8] relative flex flex-col md:flex-row items-center justify-between px-[5vw] py-[8vh] overflow-hidden font-sans gap-[2vw]"
      >
        {/* Left Column Text Block */}
        <div className="max-w-[25vw] flex flex-col justify-start self-start z-10 space-y-[2.5vh] pt-[2vh]">
          {/* Top Tag Header */}
          <div className="flex items-center gap-[0.6vw]">
            <span className="w-[3px] h-[1.3vw] min-h-[16px] bg-[#3b4998] rounded-full inline-block"></span>
            <h4 className="text-[0.9vw] font-bold text-gray-500 uppercase">
              FEATURED FLIPBOOK
            </h4>
          </div>

          {/* Main Title */}
          <h2 className="text-[3.2vw] font-semibold text-gray-900 leading-[1.15] tracking-tight">
            Ideas Inspire. <br />
            Knowledge <br />
            Transforms.
          </h2>

          {/* Subtitle Description */}
          <p className="text-[1vw] text-gray-500 font-normal leading-[1.75]">
            Explore handpicked flipbooks across creativity, business, lifestyle, and more. <br />
            Read. Learn. Share. Make every page a meaningful experience.
          </p>
        </div>

        {/* Center Column - 3D Interactive Flipbook */}
        <div className="relative flex-1 flex items-center justify-center z-10 px-[1vw]">
          <div className="relative w-[44vw] max-w-[720px] h-[31vw] max-h-[500px] flex items-center justify-center drop-shadow-[0_25px_40px_rgba(0,0,0,0.25)]">
            <HTMLFlipBook
              width={1000}
              height={1414}
              size="stretch"
              minWidth={200}
              maxWidth={2000}
              minHeight={300}
              maxHeight={3000}
              maxShadowOpacity={0.5}
              showCover={false}
              mobileScrollSupport={true}
              clickEventForward={false}
              useMouseEvents={true}
              onFlip={onPage}
              flippingTime={1000}
              swipeDistance={30}
              ref={bookRef}
              className="drop-shadow-2xl"
            >
              {/* Page 1 */}
              <div className="bg-white"><img src={page1} alt="" className="w-full h-full object-cover" /></div>
              {/* Page 2 */}
              <div className="bg-white"><img src={page2} alt="" className="w-full h-full object-cover" /></div>
              {/* Page 3 */}
              <div className="bg-white"><img src={page3} alt="" className="w-full h-full object-cover" /></div>
              {/* Page 4 */}
              <div className="bg-white"><img src={page4} alt="" className="w-full h-full object-cover" /></div>
              {/* Page 5 */}
              <div className="bg-white"><img src={page5} alt="" className="w-full h-full object-cover" /></div>
              {/* Page 6 */}
              <div className="bg-white">
                <img src={page6} alt="" className="w-full h-full object-cover" />
              </div>
            </HTMLFlipBook>
          </div>
        </div>

        {/* Right Column Text Block */}
        <div className="max-w-[22vw] flex flex-col justify-center z-10 space-y-[2.5vh]">
          {/* Main Title */}
          <h3 className="text-[2.2vw] font-semibold text-gray-900 leading-[1.2] tracking-tight">
            The Art of <br />
            Thoughtful <br />
            Living
          </h3>

          {/* Page Counter Line */}
          <div className="pb-[1.5vh] border-b border-gray-300 w-[12vw]">
            <span className="text-[1.1vw] text-gray-400 font-medium">
              {Math.floor(page / 2) + 1}/3 Pages
            </span>
          </div>

          {/* Paragraph Description */}
          <p className="text-[0.9vw] text-gray-500 font-normal leading-[1.7]">
            Explore timeless insights on mindfulness, creativity, and purposeful living through beautifully crafted stories and practical ideas.
          </p>
        </div>
      </div>

      {/* Interactive Demo Section - Experience Flipbooks in Action */}
      <div className="snap-start w-full h-auto bg-[#e6e6e8] relative flex flex-col md:flex-row items-center justify-between px-[5vw] py-[8vh] font-sans gap-[3vw] border-t border-gray-300/40">
        {/* Left Column Text Block */}
        <div className="max-w-[25vw] flex flex-col justify-start self-start z-10 space-y-[2.5vh] pt-[2vh]">
          {/* Top Tag Header */}
          <div className="flex items-center gap-[0.6vw]">
            <span className="w-[3px] h-[1.3vw] min-h-[16px] bg-[#3b4998] rounded-full inline-block"></span>
            <h4 className="text-[0.9vw] font-bold text-gray-500 uppercase tracking-widest">
              INTERACTIVE DEMO
            </h4>
          </div>

          {/* Main Title */}
          <h2 className="text-[3.2vw] font-semibold text-gray-900 leading-[1.15] tracking-tight">
            Experience <br />
            Flipbooks <br />
            in Action
          </h2>

          {/* Underline Accent */}
          <div className="w-[12vw] h-[1px] bg-gray-300 my-[1vh]"></div>

          {/* Subtitle Description */}
          <p className="text-[0.95vw] text-gray-500 font-normal leading-[1.7]">
            Explore our handpicked demo books. Flip, zoom, and interact to discover how immersive and engaging digital reading can be.
          </p>
        </div>

        {/* Right Column - 5 Demo Book Covers Row */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-[2vw] items-start pt-[2vh] z-10">
          {[
            {
              id: 1,
              title: "The Wise",
              subtitle: "Man's Fear",
              coverTitle: "THE WISE MAN'S",
              coverHeadline: "FEAR",
              author: "PATRICK ROTHFUSS",
              bgGradient: "from-[#1a3823] via-[#112617] to-[#0a170e]",
              accentColor: "text-emerald-400",
              image: cover1
            },
            {
              id: 2,
              title: "Beyond",
              subtitle: "Horizons",
              coverTitle: "Beyond Horizons",
              coverHeadline: "Journey to the Unknown",
              author: "",
              bgGradient: "from-[#6b4737] via-[#945f47] to-[#2c3d31]",
              accentColor: "text-amber-300",
              image: cover2
            },
            {
              id: 3,
              title: "Design",
              subtitle: "Essential",
              coverTitle: "Design Essentials",
              coverHeadline: "The Principles of Great Design",
              author: "",
              bgGradient: "from-[#0d1117] via-[#161b22] to-[#010409]",
              accentColor: "text-blue-400",
              image: cover3
            },
            {
              id: 4,
              title: "Future",
              subtitle: "Forward",
              coverTitle: "Future Forward",
              coverHeadline: "Innovations Shaping Tomorrow",
              author: "",
              bgGradient: "from-[#0f1026] via-[#1c1d42] to-[#080914]",
              accentColor: "text-indigo-400",
              image: cover4
            },
            {
              id: 5,
              title: "Culinary",
              subtitle: "Stories",
              coverTitle: "Culinary Stories",
              coverHeadline: "Flavors That Connect Us",
              author: "",
              bgGradient: "from-[#1c1c1c] via-[#121212] to-[#080808]",
              accentColor: "text-amber-400",
              image: cover5
            }
          ].map((book) => (
            <div key={book.id} className="flex flex-col items-center group cursor-pointer">
              {/* 3D Book Cover Box */}
              <div className="relative w-full aspect-[1/1.45] rounded-r-[6px] rounded-l-[2px] overflow-hidden shadow-[0_15px_30px_rgba(0,0,0,0.3)] group-hover:shadow-[0_25px_45px_rgba(0,0,0,0.4)] group-hover:-translate-y-2 transition-all duration-300 border-r-[4px] border-r-black/30">
                {book.image ? (
                  <img src={book.image} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-b ${book.bgGradient} p-[1.2vw] flex flex-col justify-between text-white relative`}>
                    <div className="absolute top-0 bottom-0 left-[8px] w-[2px] bg-black/40 z-20"></div>
                    <div className="space-y-[0.4vw]">
                      <span className="text-[0.7vw] font-bold tracking-widest text-gray-300 uppercase block">{book.coverTitle}</span>
                      <h3 className={`text-[1.3vw] font-extrabold leading-none ${book.accentColor}`}>{book.coverHeadline}</h3>
                    </div>
                    {book.author && (
                      <span className="text-[0.6vw] tracking-wider text-gray-400 font-semibold">{book.author}</span>
                    )}
                  </div>
                )}
                {/* Left Spine Crease Highlight */}
                <div className="absolute top-0 bottom-0 left-0 w-[8px] bg-gradient-to-r from-black/40 via-white/10 to-transparent pointer-events-none z-30"></div>
              </div>

              {/* Title under Book Cover */}
              <div className="mt-[2vh] text-center">
                <span className="text-[1.05vw] font-medium text-gray-700 leading-tight block group-hover:text-gray-900 transition-colors">
                  {book.title}
                </span>
                <span className="text-[1.05vw] font-medium text-gray-700 leading-tight block group-hover:text-gray-900 transition-colors">
                  {book.subtitle}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>


      {/* Discover. Read. Get Inspired Section */}
      <div className="snap-start w-full h-auto bg-[#f8f8f9] py-[10vh] px-[4vw] font-sans relative flex flex-col items-center border-t border-gray-200">
        {/* Header Title with Compass Accent */}
        <div className="text-center max-w-[50vw] space-y-[1.5vh] mb-[4vh]">
          <h2 className="text-[3.2vw] font-extrabold text-gray-900 tracking-tight leading-tight flex items-center justify-center gap-[0.4vw]">
            Discover
            <Compass className="w-[2.4vw] h-[2.4vw] text-gray-900 stroke-[2] inline-block" />
            . Read. Get Inspired
          </h2>
          <p className="text-[0.95vw] text-gray-500 font-normal leading-relaxed">
            Dive into interactive flipbooks created by our community <br />
            click any book to start reading
          </p>
        </div>

        {/* Explore More Button */}
        <button 
          onClick={() => navigate('/templates')}
          className="bg-black text-white px-[1.5vw] py-[1vh] rounded-full flex items-center gap-[0.8vw] text-[0.95vw] font-semibold hover:bg-gray-800 transition-all shadow-md mb-[6vh] group cursor-pointer"
        >
          Explore more Flipbooks
          <span className="w-[1.6vw] h-[1.6vw] rounded-full bg-white text-black flex items-center justify-center shadow-sm group-hover:rotate-45 transition-transform">
            <ArrowUpRight className="w-[1vw] h-[1vw] text-black stroke-[2.5]" />
          </span>
        </button>

        {/* 5 Flipbooks Showcase Row with Left & Right Arrow Buttons */}
        <div className="relative w-full max-w-[92vw] flex items-center justify-between gap-[1vw]">
          {/* Left Arrow Button */}
          <button className="w-[2.8vw] h-[2.8vw] min-w-[36px] min-h-[36px] rounded-full border border-gray-300 bg-white flex items-center justify-center shadow-md hover:bg-gray-50 text-gray-700 z-20 cursor-pointer flex-shrink-0">
            <ArrowLeft className="w-[1.2vw] h-[1.2vw] stroke-[2]" />
          </button>

          {/* 5 Flipbook Cards Container */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-[1.2vw]">
            {[
              {
                id: 1,
                author: "Alex Johnson",
                location: "Coimbatore",
                pages: "12 Pages",
                readers: "12.5k reader",
                rating: "4.5 (1,255)",
                title: "Name of the Flipbook",
                quote: "Bring your content to life with a real, interactive experience",
                image: coverSvg1
              },
              {
                id: 2,
                author: "Alex Johnson",
                location: "Coimbatore",
                pages: "12 Pages",
                readers: "12.5k reader",
                rating: "4.5 (1,255)",
                title: "Name of the Flipbook",
                quote: "Bring your content to life with a real, interactive experience",
                image: coverSvg2
              },
              {
                id: 3,
                author: "Alex Johnson",
                location: "Coimbatore",
                pages: "12 Pages",
                readers: "12.5k reader",
                rating: "4.5 (1,255)",
                title: "Name of the Flipbook",
                quote: "Bring your content to life with a real, interactive experience",
                image: coverSvg3
              },
              {
                id: 4,
                author: "Alex Johnson",
                location: "Coimbatore",
                pages: "12 Pages",
                readers: "12.5k reader",
                rating: "4.5 (1,255)",
                title: "Name of the Flipbook",
                quote: "Bring your content to life with a real, interactive experience",
                image: coverSvg4
              },
              {
                id: 5,
                author: "Alex Johnson",
                location: "Coimbatore",
                pages: "12 Pages",
                readers: "12.5k reader",
                rating: "4.5 (1,255)",
                title: "Name of the Flipbook",
                quote: "Bring your content to life with a real, interactive experience",
                image: coverSvg5
              }
            ].map((book) => (
              <div 
                key={book.id}
                className="bg-white rounded-[1vw] border border-gray-200/80 p-[0.9vw] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative text-left group cursor-pointer"
              >
                {/* Top Image Box */}
                <div className="w-full aspect-[4/3.8] rounded-[0.8vw] overflow-hidden relative bg-gray-50/80 flex items-center justify-center p-[0.3vw]">
                  {/* Top Right Options Dot Button */}
                  <button className="absolute top-[0.6vw] right-[0.6vw] w-[1.5vw] h-[1.5vw] min-w-[22px] min-h-[22px] rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-gray-700 shadow-sm z-10 hover:bg-white">
                    <MoreVertical className="w-[0.9vw] h-[0.9vw] stroke-[2]" />
                  </button>

                  <img src={book.image} alt={book.title} className="w-full h-full object-cover rounded-[0.5vw] shadow-sm group-hover:scale-105 transition-transform duration-300" />
                </div>

                {/* Author Info Row */}
                <div className="flex items-center gap-[0.6vw] pt-[1vh]">
                  <div className="w-[2vw] h-[2vw] min-w-[28px] min-h-[28px] rounded-full bg-gray-800 text-white font-bold flex items-center justify-center overflow-hidden shadow-sm">
                    <User className="w-[1.1vw] h-[1.1vw] stroke-[2]" />
                  </div>
                  <div>
                    <h4 className="text-[0.85vw] font-bold text-gray-900 leading-tight">{book.author}</h4>
                    <span className="text-[0.7vw] text-gray-400 font-medium flex items-center gap-[0.2vw]">
                      {book.location} <MapPin className="w-[0.7vw] h-[0.7vw] text-red-500 fill-red-500 inline-block" />
                    </span>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between border-y border-gray-100 py-[0.6vh] my-[0.8vh] text-[0.68vw] text-gray-500 font-medium">
                  <span>{book.pages}</span>
                  <span className="flex items-center gap-[0.2vw]">
                    <Eye className="w-[0.8vw] h-[0.8vw] text-gray-400 inline-block" /> {book.readers}
                  </span>
                  <span className="flex items-center gap-[0.2vw] text-amber-500 font-semibold">
                    <Star className="w-[0.8vw] h-[0.8vw] text-amber-500 fill-amber-500 inline-block" /> {book.rating}
                  </span>
                </div>

                {/* Card Bottom Footer */}
                <div className="pr-[2.5vw] pb-[0.5vh]">
                  <h3 className="text-[0.95vw] font-bold text-gray-900 leading-snug mb-[0.3vh]">
                    {book.title}
                  </h3>
                  <p className="text-[0.72vw] text-gray-400 font-normal leading-relaxed line-clamp-2">
                    &quot;{book.quote}&quot;
                  </p>
                </div>

                {/* Bottom Right Black Arrow Button */}
                <button className="absolute bottom-[0.9vw] right-[0.9vw] w-[2vw] h-[2vw] min-w-[28px] min-h-[28px] bg-black text-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <ArrowUpRight className="w-[1.1vw] h-[1.1vw] text-white stroke-[2.5]" />
                </button>
              </div>
            ))}
          </div>

          {/* Right Arrow Button */}
          <button className="w-[2.8vw] h-[2.8vw] min-w-[36px] min-h-[36px] rounded-full border border-gray-300 bg-white flex items-center justify-center shadow-md hover:bg-gray-50 text-gray-700 z-20 cursor-pointer flex-shrink-0">
            <ArrowRight className="w-[1.2vw] h-[1.2vw] stroke-[2]" />
          </button>
        </div>

        {/* Bottom Call-Out Banner - Create Your Own Flipbook */}
        <div className="w-full max-w-[88vw] mx-auto bg-white border border-gray-200/90 rounded-[1vw] p-[1.2vw] px-[2.2vw] flex flex-col sm:flex-row items-center justify-between shadow-sm mt-[6vh] gap-[2vw]">
          <div className="flex items-center gap-[1.2vw]">
            <div className="w-[3.2vw] h-[3.2vw] min-w-[42px] min-h-[42px] bg-gray-50 border border-gray-200 rounded-[0.8vw] flex items-center justify-center shadow-sm">
              <BookOpen className="w-[1.6vw] h-[1.6vw] text-gray-800 stroke-[1.8]" />
            </div>
            <div>
              <h3 className="text-[1.15vw] font-bold text-gray-900">
                Create Your Own Flipbook
              </h3>
              <p className="text-[0.85vw] text-gray-500 font-normal">
                Design, publish and share interactive flipbooks in minutes
              </p>
            </div>
          </div>

          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-black text-white px-[1.6vw] py-[0.9vh] rounded-full text-[0.95vw] font-semibold hover:bg-gray-800 transition-all flex items-center gap-[0.6vw] shadow-md cursor-pointer flex-shrink-0 group"
          >
            Create Your Flipbook
            <ArrowRight className="w-[1.1vw] h-[1.1vw] text-white group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* 4-Step Scroll-Driven Sticky Interactive Workflow Section */}
      <WorkflowScrollSection 
        slides={[slide1, slide2, slide3, slide4]} 
        goldenArrow={goldenArrow} 
      />

      {/* 3D Reading Experience Showcase Section using Book_show.png */}
      <ThreeDExperienceSection bookShowImg={bookShowImg} />

      {/* Why Choose FIST-O Section - Powerful Features */}
      <div className="snap-start w-full h-auto bg-[#070709] relative flex flex-col lg:flex-row items-center justify-between px-[5vw] py-[8vh] font-sans gap-[4vw] text-white overflow-hidden border-t border-white/10">
        {/* Bottom Left Animated Wave Dots Canvas */}
        <WaveDotsCanvas />
        <div className="absolute bottom-[-10%] left-[-5%] w-[45vw] h-[30vw] bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-white/10 via-white/5 to-transparent pointer-events-none opacity-40 blur-2xl"></div>
        <div 
          className="absolute bottom-0 left-0 w-[35vw] h-[25vw] pointer-events-none opacity-20"
          style={{
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
            maskImage: 'linear-gradient(to top right, black 20%, transparent 80%)',
            WebkitMaskImage: 'linear-gradient(to top right, black 20%, transparent 80%)'
          }}
        ></div>

        {/* Left Column Text & Headline */}
        <div className="relative max-w-[28vw] flex flex-col justify-start self-start z-10 space-y-[3vh] pt-[2vh]">
          <div className="space-y-[2.5vh]">
            {/* Top Tag Header */}
            <div className="flex items-center gap-[0.6vw]">
              <span className="w-[3px] h-[1.3vw] min-h-[16px] bg-gray-400 rounded-full inline-block"></span>
              <h4 className="text-[0.9vw] font-bold text-gray-400 uppercase tracking-widest">
                WHY CHOOSE FIST-O
              </h4>
            </div>

            {/* Main Headline with Sparkle Accent */}
            <div className="relative">
              <Sparkles className="absolute -top-[1.2vw] right-[2vw] w-[1.5vw] h-[1.5vw] text-gray-300 opacity-80 animate-pulse" />
              <h2 className="text-[3.2vw] font-semibold text-white leading-[1.15] tracking-tight">
                Powerful Features. <br />
                Limitless <span className="text-gray-400 font-light">Possibilities.</span>
              </h2>
            </div>

            {/* Paragraph Description */}
            <p className="text-[1vw] text-gray-400 font-normal leading-[1.75]">
              Everything you need to create, share, and grow your content — all in one platform.
            </p>
          </div>

          {/* CTA Link */}
          <div className="pt-[1vh]">
            <span 
              onClick={() => navigate('/about')}
              className="group text-[1.1vw] font-medium text-white border-b border-gray-600 pb-[0.4vh] hover:border-white transition-all duration-300 flex items-center gap-[0.6vw] inline-flex cursor-pointer"
            >
              Explore All Features 
              <ArrowRight className="w-[1.1vw] h-[1.1vw] group-hover:translate-x-1 transition-transform duration-300" />
            </span>
          </div>
        </div>

        {/* Right Column - 4 Dark Glassmorphic Feature Cards Grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1.5vw] items-stretch z-10 w-full">
          {[
            {
              id: 1,
              title: "3D Page Flip",
              desc: "Realistic page flip experience that delights readers.",
              icon: <Box className="w-[2.2vw] h-[2.2vw] text-white stroke-[1.5]" />
            },
            {
              id: 2,
              title: "Multimedia Rich",
              desc: "Embed videos, audio, images, links & more to engage deeply.",
              icon: <Video className="w-[2.2vw] h-[2.2vw] text-white stroke-[1.5]" />
            },
            {
              id: 3,
              title: "Fully Responsive",
              desc: "Seamless reading experience on all devices.",
              icon: <MonitorSmartphone className="w-[2.2vw] h-[2.2vw] text-white stroke-[1.5]" />
            },
            {
              id: 4,
              title: "Analytics Dashboard",
              desc: "Track reads, clicks, engagement & performance in real-time.",
              icon: <BarChart3 className="w-[2.2vw] h-[2.2vw] text-white stroke-[1.5]" />
            }
          ].map((card) => (
            <div 
              key={card.id}
              className="bg-[#111114] border border-white/10 rounded-[1vw] p-[2.2vw] flex flex-col justify-start items-start text-left space-y-[2.5vh] shadow-2xl hover:border-white/25 hover:bg-[#16161a] transition-all duration-300 group"
            >
              {/* Circular Glowing Glass Orb Icon Wrapper */}
              <div className="relative w-[5.2vw] h-[5.2vw] min-w-[50px] min-h-[50px] rounded-full bg-gradient-to-b from-white/15 to-white/5 border border-white/20 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                {/* Top Right Sparkle Glint */}
                <span className="absolute top-[0.6vw] right-[0.8vw] text-white text-[0.6vw] opacity-80">✦</span>
                
                {card.badgeText ? (
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[1.3vw] font-extrabold text-white leading-none border border-white/40 rounded-[0.4vw] px-[0.4vw] py-[0.1vh]">3D</span>
                  </div>
                ) : (
                  card.icon
                )}
              </div>

              {/* Feature Title */}
              <h3 className="text-[1.35vw] font-bold text-white tracking-tight leading-tight pt-[1vh]">
                {card.title}
              </h3>

              {/* Underline Divider Line */}
              <div className="w-[2.5vw] h-[1px] bg-gray-700 my-[0.5vh]"></div>

              {/* Description Paragraph */}
              <p className="text-[0.9vw] text-gray-400 font-normal leading-relaxed">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Digital Catalogue Section */}
      <InteractiveDigitalCatalogueSection onOpenCreateModal={() => setIsCreateModalOpen(true)} />

      {/* Global Footer */}
      <Footer />



      <CreateFlipbookModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUpload={handleUploadPDF}
        onTemplate={handleUseTemplate}
      />

      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id="inner-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
            <feOffset dy="3" dx="0" />
            <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadow" />
            <feFlood floodColor="#000" floodOpacity="0.6" />
            <feComposite in2="shadow" operator="in" />
            <feComposite in2="SourceGraphic" operator="over" />
          </filter>
        </defs>
      </svg>

      {/* PDF Processing Overlay */}
      <PdfProcessingLoader progress={processingProgress} onCancel={handleCancelUploadPDF} />

      {/* General Loading Overlay */}
      <AnimatePresence>
        {isLoading && !processingProgress && (
          <motion.div
            key="home-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed top-[8vh] left-0 right-0 bottom-0 z-40 flex flex-col items-center justify-center bg-white gap-3"
          >
            <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
            <span className="text-[0.85vw] font-semibold text-gray-600 tracking-wide">Loading...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generic Alert Modal */}
      <AlertModal
        isOpen={alertState.isOpen}
        onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        showCancel={alertState.showCancel}
        onConfirm={alertState.onConfirm}
      />
    </div>
  );
}