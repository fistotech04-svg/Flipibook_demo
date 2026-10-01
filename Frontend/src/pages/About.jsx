import React, { useEffect, useState, useRef } from 'react';
import { motion, useAnimation, useScroll, useMotionValueEvent, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import heroBg from '../assets/About/Hero.png';
import systemImg from '../assets/About/system.png';
import systemTwoImg from '../assets/About/system_2.png';
import bookImg from '../assets/About/Book.png';
import heroOne from '../assets/About/Hero_1.png';
import secondOne from '../assets/About/second_1.png';
import secondTwo from '../assets/About/second_2.png';
import secondThree from '../assets/About/second_3.png';
import thirdOne from '../assets/About/third_1.png';
import fourthOne from '../assets/About/fourth_1.png';
import fourthTwo from '../assets/About/fourth_2.png';
import fourthThree from '../assets/About/fourth_3.png';
import fourthFour from '../assets/About/fourth_4.png';

import Footer from './Footer';

const About = () => {
    const controls = useAnimation();
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
        const sequence = async () => {
            await new Promise(resolve => setTimeout(resolve, 800));
            await controls.start("scrolled");
            setHasAnimated(true);
        };
        sequence();
    }, [controls]);

    const variants = {
        initial: { opacity: 1, scale: 1 },
        scrolled: { opacity: 0.2, scale: 0.95, transition: { duration: 0.8 } }
    };

    const textVariants = {
        initial: { opacity: 1, y: 0 },
        scrolled: { opacity: 0, y: -50, transition: { duration: 0.6 } }
    };

    const cardVariants = {
        initial: { y: "100%" },
        scrolled: { y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
    };

    const description = [
        "Welcome to IDC! We transform static documents into interactive digital experiences.",
        "Custom design options tailored to your brand identity.",
        "Interactive flipbooks that engage your audience.",
        "Secure, reliable, and built to protect your data every step of the way."
    ];

    // Scroll animation for "Our Values" section
    const valuesRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const targetEl = valuesRef.current;
        if (!targetEl) return;

        const scrollParent = targetEl.closest('.overflow-y-auto') || window;

        const handleScroll = () => {
            const rect = targetEl.getBoundingClientRect();
            const parentHeight = scrollParent === window ? window.innerHeight : scrollParent.clientHeight;
            
            // Total scrollable height of the section
            const totalScroll = rect.height - parentHeight;
            if (totalScroll <= 0) return;

            // Scrolled distance from top of section
            const currentScroll = -rect.top;
            const progress = Math.max(0, Math.min(1, currentScroll / totalScroll));

            if (progress < 0.25) {
                setActiveIndex(0);
            } else if (progress < 0.5) {
                setActiveIndex(1);
            } else if (progress < 0.75) {
                setActiveIndex(2);
            } else {
                setActiveIndex(3);
            }
        };

        scrollParent.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => scrollParent.removeEventListener('scroll', handleScroll);
    }, []);

    // Dynamic Text Content based on scroll
    const messages = [
        "Powerful tools made simple. So anyone can create, edit, and publish without complexity.",
        "Fast, smooth, and responsive experiences that work seamlessly across all devices.",
        "Flexible design options that help you build unique, engaging, and visually rich content.",
        "Secure, reliable, and built to protect your data every step of the way."
    ];

    return (
        <div className="w-full bg-white font-sans pb-0">
            {/* Top Hero Section Banner */}
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
                            About Us
                        </h1>
                        
                        <p className="text-[0.9vw] text-gray-600 font-normal leading-relaxed">
                            We create Interactive Digital Catalogues, Websites, Web Applications, and 3D Product Experiences that help businesses showcase products in a modern, engaging, and interactive way.
                        </p>

                        <div className="w-[7vw] h-[0.3vh] min-h-[2px] bg-gray-800 rounded-full mt-[1.8vh]"></div>
                    </div>

                    {/* Right Hero Graphic */}
                    <div className="relative flex justify-center md:justify-end">
                        <img 
                            src={systemImg} 
                            alt="About Us Hero Graphic" 
                            className="h-[42vh] max-h-[460px] w-auto object-contain shrink-0" 
                        />
                    </div>
                </div>
            </motion.div>
            {/* Crafting Interactive Digital Experiences Section */}
            <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6 }}
                className="w-full bg-black text-white pt-[8vh] pb-[16vh] md:pt-[10vh] md:pb-[20vh] px-[5vw]"
            >
                <div className="max-w-[85vw] mx-auto space-y-[10vh]">
                    
                    {/* Top Main Heading */}
                    <div className="text-center max-w-[70vw] mx-auto space-y-[1vh]">
                        <h2 className="text-[3.2vw] font-normal tracking-tight leading-tight">
                            <span className="text-gray-400">Crafting </span>
                            <span className="text-white font-bold">Interactive Digital Experiences </span>
                            <span className="text-gray-400">for Modern <span className="text-gray-400">Businesses</span></span>
                            
                        </h2>
                    </div>

                    {/* Sub-header Row: What We Do ? */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-[2vw] pt-[2vh]">
                        <div className="flex items-center gap-[0.8vw]">
                            <span className="w-[4px] h-[1.8vw] min-h-[22px] bg-white rounded-full inline-block"></span>
                            <h3 className="text-[1.3vw] font-bold text-white tracking-wide">What We Do ?</h3>
                        </div>

                        <p className="text-[0.9vw] text-gray-300 font-normal leading-relaxed max-w-[42vw] text-left md:text-right">
                            At FIST-O, we design and develop immersive digital solutions that help businesses showcase products, improve customer engagement, and create memorable digital experiences.
                        </p>
                    </div>

                    {/* 4 Feature Columns Showcase Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-[1.4vw] h-[580px] max-w-[85vw] mx-auto pt-[2vh]">
                        
                        {/* Col 1 */}
                        <div className="flex flex-col justify-between h-full gap-[1.4vw]">
                            {/* Top Image Card */}
                            <div className="w-full h-[38%] rounded-[1vw] overflow-hidden border border-white/20 bg-neutral-900 shadow-md">
                                <img src={heroOne} alt="Desktop Preview" className="w-full h-full object-cover rounded-[1vw]" />
                            </div>
                            {/* Bottom White Card */}
                            <div className="w-full h-[60%] bg-white text-black rounded-[1vw] p-[1.8vw] flex flex-col items-center justify-center text-center space-y-[2vh] shadow-md">
                                <img src={secondOne} alt="Custom Interactive Digital Catalogues" className="w-[4.5vw] h-[4.5vw] min-w-[50px] min-h-[50px] object-contain" />
                                <h4 className="text-[1.2vw] font-bold text-gray-900 leading-snug max-w-[14vw]">
                                    Custom Interactive Digital Catalogues
                                </h4>
                            </div>
                        </div>

                        {/* Col 2 */}
                        <div className="flex flex-col justify-between h-full gap-[1.4vw]">
                            {/* Top White Card */}
                            <div className="w-full h-[54%] bg-white text-black rounded-[1vw] p-[1.8vw] flex flex-col items-center justify-center text-center space-y-[2vh] shadow-md">
                                <img src={secondTwo} alt="3D & Interactive Experiences" className="w-[4.5vw] h-[4.5vw] min-w-[50px] min-h-[50px] object-contain" />
                                <h4 className="text-[1.2vw] font-bold text-gray-900 leading-snug max-w-[14vw]">
                                    3D & Interactive Experiences
                                </h4>
                            </div>
                            {/* Bottom Image Card */}
                            <div className="w-full h-[44%] rounded-[1vw] overflow-hidden border border-white/20 bg-neutral-900 shadow-md">
                                <img src={thirdOne} alt="3D Render" className="w-full h-full object-cover rounded-[1vw]" />
                            </div>
                        </div>

                        {/* Col 3 */}
                        <div className="flex flex-col justify-between h-full gap-[1.4vw]">
                            {/* Top Image Card */}
                            <div className="w-full h-[57%] rounded-[1vw] overflow-hidden border border-white/20 bg-neutral-900 shadow-md">
                                <img src={fourthOne} alt="DMU Render Top" className="w-full h-full object-cover rounded-[1vw]" />
                            </div>
                            {/* Bottom Image Card */}
                            <div className="w-full h-[41%] rounded-[1vw] overflow-hidden border border-white/20 bg-neutral-900 shadow-md">
                                <img src={fourthTwo} alt="DMU Render Bottom" className="w-full h-full object-cover rounded-[1vw]" />
                            </div>
                        </div>

                        {/* Col 4 */}
                        <div className="flex flex-col justify-between h-full gap-[1.4vw]">
                            {/* Top White Card */}
                            <div className="w-full h-[67%] bg-white text-black rounded-[1vw] p-[1.8vw] flex flex-col items-center justify-center text-center space-y-[2vh] shadow-md">
                                <img src={secondThree} alt="Web, App & Creative Solutions" className="w-[4.5vw] h-[4.5vw] min-w-[50px] min-h-[50px] object-contain" />
                                <h4 className="text-[1.2vw] font-bold text-gray-900 leading-snug max-w-[14vw]">
                                    Web, App & Creative Solutions
                                </h4>
                            </div>
                            {/* Bottom Image Card */}
                            <div className="w-full h-[31%] rounded-[1vw] overflow-hidden border border-white/20 bg-neutral-900 shadow-md">
                                <img src={fourthFour} alt="App Tablet Solution" className="w-full h-full object-cover rounded-[1vw]" />
                            </div>
                        </div>

                    </div>

                </div>
            </motion.div>
            {/* Who We Are Section */}
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7 }}
                className="w-full bg-black"
            >
                <div className="w-full bg-white text-gray-900 rounded-t-[3vw] px-[6vw] pt-[8vh] md:pt-[10vh] pb-0 shadow-2xl space-y-[6vh] overflow-hidden">
                    {/* Top Tag */}
                    <div className="flex items-center gap-[0.6vw]">
                        <span className="w-[3px] h-[1.3vw] min-h-[16px] bg-[#3b4998] rounded-full inline-block"></span>
                        <h3 className="text-[1vw] font-bold text-[#3b4998] uppercase">Who We Are</h3>
                    </div>

                    {/* Rich Typography Statement */}
                    <div className="max-w-[78vw] mx-auto text-center font-sans tracking-tight py-[2vh] mb-[4vh]">
                        <p className="text-[2.4vw] md:text-[2.6vw] font-normal leading-[1.65] text-gray-400">
                            <span className="font-bold text-gray-900">FIST-O </span>
                            <span>is a digital experience company specializing </span>
                            <br />
                            <span>in </span>
                            
                            {/* PDF -> Flipbook Badge */}
                            <span className="inline-flex items-center align-middle mx-[0.5vw] -translate-y-[0.2vw]">
                                <span className="bg-gradient-to-r from-red-700 via-red-800 to-[#720e17] text-white rounded-[0.8vw] px-[0.7vw] py-[0.4vh] flex items-center gap-[0.5vw] shadow-md border border-red-500/20">
                                    <span className="flex items-center gap-[0.2vw] bg-red-600/80 px-[0.4vw] py-[0.1vh] rounded-[0.3vw] text-[0.8vw] font-bold">
                                        <svg className="w-[0.9vw] h-[0.9vw]" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                                        </svg>
                                        PDF
                                    </span>
                                    <span className="text-[1vw] font-bold text-red-200">→</span>
                                    <span className="w-[1.6vw] h-[1.6vw] bg-white/20 rounded-[0.3vw] flex items-center justify-center text-[0.9vw]">
                                        📖
                                    </span>
                                </span>
                            </span>

                            <span className="font-bold text-gray-900"> Interactive Digital Catalogues (IDC),</span>
                            <br />
                            <span className="font-bold text-gray-900">Custom websites, </span>

                            {/* Multi-device Badge */}
                            <span className="inline-flex items-center align-middle mx-[0.5vw] -translate-y-[0.2vw]">
                                <span className="bg-gray-100 border border-gray-300 rounded-[0.8vw] px-[0.8vw] py-[0.4vh] flex items-center gap-[0.4vw] shadow-sm text-gray-700">
                                    <span className="flex items-center gap-[0.3vw] text-[1.1vw]">
                                        💻 📱 🖥️
                                    </span>
                                </span>
                            </span>

                            <span className="font-bold text-gray-900"> Web Applications, and</span>
                            <br />
                            <span className="font-bold text-gray-900">Immersive 3D experiences.</span>
                        </p>
                    </div>

                    {/* We Empower Businesses Showcase Block - Edge-to-Edge Image with Bottom Black Bar */}
                    <div className="relative w-[calc(100%+12vw)] -mx-[6vw] mt-[15vh] overflow-hidden">
                        {/* Image + Bottom Black Extension */}
                        <div className="relative w-full">
                            {/* Background Image - 100% Fit */}
                            <img 
                                src={systemTwoImg} 
                                alt="We Empower Businesses - Desktop & 3D Showcase" 
                                className="w-full h-auto object-contain block" 
                            />

                            {/* Black Extension Bar ONLY at bottom of image */}
                            <div className="w-full h-[12vh] bg-black -mt-[1px]"></div>

                            {/* Overlaid Right Text Block */}
                            <div className="absolute right-[6vw] top-[40%] -translate-y-1/2 flex flex-col items-end text-right space-y-[2vh] max-w-[34vw] z-10">
                                {/* Headline */}
                                <div className="space-y-[0.1vw] text-right font-sans">
                                    <h2 className="text-[4.8vw] font-extrabold text-gray-900 leading-[0.95]">
                                        We
                                    </h2>
                                    <h2 
                                        className="text-[4.8vw] font-normal leading-[0.95] tracking-tight"
                                        style={{ WebkitTextStroke: '0.1vw #000000', color: '#e2e2e2ff' }}
                                    >
                                        Empower
                                    </h2>
                                    <h2 className="text-[4.8vw] font-extrabold text-gray-900 leading-[0.95]">
                                        Businesses
                                    </h2>
                                </div>

                                {/* Underline Accent */}
                                <div className="w-[12vw] h-[1px] bg-gray-300 my-[1vh]"></div>

                                {/* Subtitle Paragraph */}
                                <p className="text-[0.95vw] text-gray-600 font-normal leading-relaxed text-right">
                                    to present products more effectively through interactive digital catalogues, modern websites, custom web applications, and immersive 3D experiences that drive engagement and improve customer communication.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Transform Static Content into Interactive Experience Section */}
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7 }}
                className="w-full bg-black px-[4vw] py-[10vh]"
            >
                <div className="relative w-full max-w-[85vw] mx-auto rounded-[2vw] border border-white/20 overflow-hidden shadow-2xl bg-black min-h-[500px]">
                    {/* Background Image - Fills Full Outer Container */}
                    <img 
                        src={bookImg} 
                        alt="Transform Static Content into Interactive Experience" 
                        className="w-full h-full object-cover absolute inset-0 rounded-[2vw]" 
                    />

                    {/* Right Side Overlaid Frosted Glass Blur Card */}
                    <div className="absolute right-0 top-0 bottom-0 w-full md:w-[34%] p-[3.5vw] flex flex-col justify-between items-end text-right backdrop-blur-xl bg-gradient-to-b from-white/10 via-black/40 to-black/80 border-l border-white/20 text-white z-10 rounded-r-[2vw]">
                        {/* Headline */}
                        <div className="space-y-[1vh] pt-[2vh] text-right">
                            <h2 className="text-[2.5vw] md:text-[2.7vw] font-semibold text-white leading-[1.2] tracking-tight text-right">
                                Transform <br />
                                Static Content <br />
                                into Interactive <br />
                                Experience
                            </h2>
                        </div>

                        {/* Description Paragraph */}
                        <p className="text-[0.9vw] md:text-[0.95vw] text-gray-300 font-normal leading-relaxed pb-[1vh] text-right">
                            Whether it&apos;s a product catalogue, website, web application, or 3D presentation, we build digital experiences that help businesses communicate better, engage customers, and showcase products professionally.
                        </p>
                    </div>
                </div>
            </motion.div>
            {/* Our Values Section - Balanced for Scrollytelling Sequence */}
            <div 
                ref={valuesRef}
                className="w-full h-[450vh] relative bg-white"
            >
                {/* Internal Snap Points for Stepped Scrolling */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="snap-start h-[112.5vh]"></div>
                    <div className="snap-start h-[112.5vh]"></div>
                    <div className="snap-start h-[112.5vh]"></div>
                    <div className="snap-start h-[112.5vh]"></div>
                </div>

                {/* Sticky Content Wrapper */}
                <div className="sticky top-0 w-full h-[92vh] flex flex-col justify-center px-[4vw] py-[5vh] overflow-hidden bg-white">
                    {/* Header Area */}
                    <div className="flex justify-between items-start mb-[8vh]">
                        {/* Left Decorative Bar & Text */}
                        <div className="flex items-center space-x-[2vw]">
                            <motion.div 
                                initial={{ scaleY: 0 }}
                                whileInView={{ scaleY: 1 }}
                                transition={{ duration: 0.8 }}
                                className="w-[0.8vw] h-[12vh] bg-red-600 origin-top flex-shrink-0"
                            ></motion.div>
                                <AnimatePresence mode="wait">
                                    <motion.h3 
                                    key={activeIndex}
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className="text-[1.1vw] font-medium text-black max-w-[35vw] leading-tight"
                                >
                                    {messages[activeIndex]}
                                </motion.h3>
                            </AnimatePresence>
                            
                        </div>

                        {/* Right Aligned Title */}
                        <motion.div 
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-right space-y-[1.5vw]"
                        >
                            <h2 className="text-[6vw] font-[600] text-black leading-none tracking-tight">Our Values</h2>
                            <p className="text-[1.2vw] text-gray-500 font-medium">
                                The principles that shape how we <span className="font-semibold text-gray-700">Design</span>, <span className="font-semibold text-gray-700">Build</span>, 
                                <br /> and <span className="font-semibold text-gray-700">Deliver</span> every experience.
                            </p>
                        </motion.div>
                    </div>

                    {/* Values sequence Grid */}
                    <div className="grid grid-cols-4 max-w-[85vw] mx-auto gap-0 items-center relative">
                        {/* Value 1 - Simplicity */}
                        <motion.div 
                            animate={{ 
                                scale: activeIndex === 0 ? 1.2 : 1,
                                zIndex: activeIndex === 0 ? 50 : 10
                            }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="relative aspect-square flex flex-col text-white overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-[#544eff]"
                        >
                            <motion.img 
                                animate={{ opacity: activeIndex === 0 ? 1 : 0 }}
                                src={fourthOne} 
                                alt="Simplicity" 
                                className="absolute inset-0 w-full h-full object-cover z-0 brightness-75" 
                            />
                            <motion.div 
                                animate={{ opacity: activeIndex === 0 ? 0.3 : 0 }}
                                className="absolute inset-0 bg-indigo-900 z-10"
                            ></motion.div>
                            <motion.div 
                                animate={{ 
                                    alignItems: activeIndex === 0 ? "flex-start" : "center",
                                    justifyContent: activeIndex === 0 ? "flex-end" : "center",
                                    textAlign: activeIndex === 0 ? "left" : "center",
                                    padding: activeIndex === 0 ? "2.5vw" : "2.5vw",
                                    scale: activeIndex === 0 ? 0.833 : 1
                                }}
                                className="relative z-20 flex flex-col w-full h-full space-y-[0.5vw]"
                            >
                                <h3 className="text-[2.2vw] font-[600] leading-tight">Simplicity</h3>
                                <p className="text-[0.9vw] font-medium opacity-90 leading-relaxed max-w-[15vw]">Easy tools designed for everyone.</p>
                            </motion.div>
                        </motion.div>

                        {/* Value 2 - Performance */}
                        <motion.div 
                            animate={{ 
                                scale: activeIndex === 1 ? 1.2 : 1,
                                zIndex: activeIndex === 1 ? 50 : 10
                            }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="relative bg-[#d00000] aspect-square flex flex-col text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden"
                        >
                            <motion.img 
                                animate={{ opacity: activeIndex === 1 ? 1 : 0 }}
                                src={fourthTwo} 
                                alt="Performance" 
                                className="absolute inset-0 w-full h-full object-cover z-0 brightness-90" 
                            />
                            <motion.div 
                                animate={{ opacity: activeIndex === 1 ? 0.2 : 0 }}
                                className="absolute inset-0 bg-red-900 z-10"
                            ></motion.div>
                            <motion.div 
                                animate={{ 
                                    alignItems: activeIndex === 1 ? "flex-start" : "center",
                                    justifyContent: activeIndex === 1 ? "flex-end" : "center",
                                    textAlign: activeIndex === 1 ? "left" : "center",
                                    padding: activeIndex === 1 ? "2.5vw" : "2.5vw",
                                    scale: activeIndex === 1 ? 0.833 : 1
                                }}
                                className="relative z-20 flex flex-col w-full h-full space-y-[0.5vw]"
                            >
                                <h3 className="text-[2.2vw] font-[600]">Performance</h3>
                                <p className="text-[0.9vw] font-medium opacity-90">Smooth, fast, and responsive on <br /> every device</p>
                            </motion.div>
                        </motion.div>

                        {/* Value 3 - Creativity */}
                        <motion.div 
                            animate={{ 
                                scale: activeIndex === 2 ? 1.2 : 1,
                                zIndex: activeIndex === 2 ? 50 : 10
                            }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="relative bg-[#3a418b] aspect-square flex flex-col text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden"
                        >
                            <motion.img 
                                animate={{ opacity: activeIndex === 2 ? 1 : 0 }}
                                src={fourthThree} 
                                alt="Creativity" 
                                className="absolute inset-0 w-full h-full object-cover z-0 brightness-90" 
                            />
                            <motion.div 
                                animate={{ opacity: activeIndex === 2 ? 0.4 : 0 }}
                                className="absolute inset-0 bg-[#313886] z-10"
                            ></motion.div>
                            <motion.div 
                                animate={{ 
                                    alignItems: activeIndex === 2 ? "flex-start" : "center",
                                    justifyContent: activeIndex === 2 ? "flex-end" : "center",
                                    textAlign: activeIndex === 2 ? "left" : "center",
                                    padding: activeIndex === 2 ? "2.5vw" : "2.5vw",
                                    scale: activeIndex === 2 ? 0.833 : 1
                                }}
                                className="relative z-20 flex flex-col w-full h-full space-y-[0.5vw]"
                            >
                                <h3 className="text-[2.2vw] font-[600]">Creativity</h3>
                                <p className="text-[0.9vw] font-medium opacity-90">Endless customization <br /> for unique visuals</p>
                            </motion.div>
                        </motion.div>

                        {/* Value 4 - Trust */}
                        <motion.div 
                            animate={{ 
                                scale: activeIndex === 3 ? 1.2 : 1,
                                zIndex: activeIndex === 3 ? 50 : 10
                            }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="relative bg-[#5a9199] aspect-square flex flex-col text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden"
                        >
                            <motion.img 
                                animate={{ opacity: activeIndex === 3 ? 1 : 0 }}
                                src={fourthFour} 
                                alt="Trust" 
                                className="absolute inset-0 w-full h-full object-cover z-0 brightness-90" 
                            />
                            <motion.div 
                                animate={{ opacity: activeIndex === 3 ? 0.4 : 0 }}
                                className="absolute inset-0 bg-[#60919a] z-10"
                            ></motion.div>
                            <motion.div 
                                animate={{ 
                                    alignItems: activeIndex === 3 ? "flex-start" : "center",
                                    justifyContent: activeIndex === 3 ? "flex-end" : "center",
                                    textAlign: activeIndex === 3 ? "left" : "center",
                                    padding: activeIndex === 3 ? "2.5vw" : "2.5vw",
                                    scale: activeIndex === 3 ? 0.833 : 1
                                }}
                                className="relative z-20 flex flex-col w-full h-full space-y-[0.5vw]"
                            >
                                <h3 className="text-[2.2vw] font-[600]">Trust</h3>
                                <p className="text-[1vw] font-medium opacity-90">Your data is safe and <br /> protected</p>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default About;
