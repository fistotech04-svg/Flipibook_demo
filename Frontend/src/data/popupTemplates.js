import demoHtml from '../assets/Templates/popup_template/demo.html?raw';

export const popupTemplates = [
  {
    id: 'restaurant-menu',
    name: "La Maison D'Or Menu",
    category: 'Full Image',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
    type: 'html',
    html: demoHtml
  },
  {
    id: 'auto-maintenance',
    name: 'Auto Maintenance',
    category: 'Image & Video',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1000',
    type: 'automotive',
    description: "We are a dedicated alloy wheel supplier focused on delivering premium-quality wheels that combine performance, durability, and modern design. Our products are developed to meet the needs of today's drivers who value both style and safety.",
    strengths: ["Advanced manufacturing standards", "Modern wheel designs", "Reliable sourcing & fitment support"],
    subImages: [
      'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=400'
    ],
    logo: 'https://cdn-icons-png.flaticon.com/512/3665/3665923.png' // 3D Cube Icon placeholder
  },
  {
    id: 'service-center',
    name: 'Service Center',
    category: 'Image & Video',
    image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1000',
    type: 'automotive',
    description: "Experience world-class automotive services at our professional center. We prioritize precision engineering and customer satisfaction, ensuring your vehicle performs at its absolute peak.",
    strengths: ["Precision diagnostic tools", "Certified expert technicians", "Genuine performance parts"],
    subImages: [
      'https://images.unsplash.com/photo-1530046339160-ce3e5b0c7a2f?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=400'
    ],
    logo: 'https://cdn-icons-png.flaticon.com/512/3665/3665923.png'
  },
  {
    id: 'car-wash',
    name: 'Car Wash',
    category: 'Image & Video',
    image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&q=80&w=1000',
    type: 'automotive',
    description: "Our premium detailing and wash services use specialized techniques to protect your car's finish while restoring its showroom shine. Quality care for every curve.",
    strengths: ["Eco-friendly cleaning agents", "Detailed interior detailing", "Ceramic coating options"],
    subImages: [
      'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1552933529-e359b24772fe?auto=format&fit=crop&q=80&w=400'
    ],
    logo: 'https://cdn-icons-png.flaticon.com/512/3665/3665923.png'
  },
  {
    id: 'tire-service',
    name: 'Tire Service',
    category: 'Image & Video',
    image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=1000',
    type: 'automotive',
    description: "From performance tires to winter stability, we offer a comprehensive range of rubber and rim services to keep you grounded and safe on the road.",
    strengths: ["High-speed balancing", "3D wheel alignment", "Nitrogen inflation available"],
    subImages: [
      'https://images.unsplash.com/photo-1578844251758-2f71dae4d98f?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1506469717960-433ce8b6699e?auto=format&fit=crop&q=80&w=400'
    ],
    logo: 'https://cdn-icons-png.flaticon.com/512/3665/3665923.png'
  },
  {
    id: 'engine-tune-up',
    name: 'Engine Tune-up',
    category: 'Image & Video',
    image: 'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&q=80&w=1000',
    type: 'automotive',
    description: "Unlock the true potential of your engine with our specialized tuning services. We optimize performance, fuel efficiency, and long-term reliability.",
    strengths: ["ECU remapping & tuning", "Engine health analytics", "Performance induction kits"],
    subImages: [
      'https://images.unsplash.com/photo-1597766333691-b6c85e48d3bc?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1493238541810-67ee8ea33830?auto=format&fit=crop&q=80&w=400'
    ],
    logo: 'https://cdn-icons-png.flaticon.com/512/3665/3665923.png'
  }
];
