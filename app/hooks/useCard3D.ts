'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export const useCard3D = () => {
  const cursorBlobRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if we're in browser environment
    if (typeof window === 'undefined') return;
    
    const cursorBlob = cursorBlobRef.current;
    if (!cursorBlob) return;

    // Get all cards with card-3d class
    const cards = document.querySelectorAll('.card-3d') as NodeListOf<HTMLButtonElement>;
    
    if (cards.length === 0) return;

    let mouseX = 0;
    let mouseY = 0;
    let blobX = 0;
    let blobY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const card = e.currentTarget as HTMLButtonElement;
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      mouseX = e.clientX - centerX;
      mouseY = e.clientY - centerY;
      
      const distance = Math.sqrt(mouseX * mouseX + mouseY * mouseY);
      const maxDistance = Math.sqrt(rect.width * rect.width + rect.height * rect.height) / 2;
      
      if (distance < maxDistance) {
        // Update cursor blob position
        blobX = e.clientX;
        blobY = e.clientY;
        
        // Calculate tilt angles (max 8-10 degrees)
        const tiltX = (mouseY / rect.height) * 8;
        const tiltY = (mouseX / rect.width) * -8;
        
        // Calculate scale (1.05-1.07)
        const scale = 1 + (0.07 * (1 - distance / maxDistance));
        
        // Update shine effect position
        const shineX = ((e.clientX - rect.left) / rect.width) * 100;
        const shineY = ((e.clientY - rect.top) / rect.height) * 100;
        
        card.style.setProperty('--mouse-x', `${shineX}%`);
        card.style.setProperty('--mouse-y', `${shineY}%`);
        
        // Animate card with GSAP
        gsap.to(card, {
          rotationX: tiltX,
          rotationY: tiltY,
          scale: scale,
          duration: 0.3,
          ease: "power2.out"
        });
        
        // Animate cursor blob
        gsap.to(cursorBlob, {
          x: blobX,
          y: blobY,
          duration: 0.3,
          ease: "power2.out"
        });
        
        cursorBlob.classList.remove('hidden');
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      const card = e.currentTarget as HTMLButtonElement;
      // Reset card to default state with elastic easing
      gsap.to(card, {
        rotationX: 0,
        rotationY: 0,
        scale: 1,
        duration: 0.6,
        ease: "elastic.out(1, 0.3)"
      });
      
      // Hide cursor blob
      cursorBlob.classList.add('hidden');
    };

    const handleMouseEnter = () => {
      cursorBlob.classList.remove('hidden');
    };

    // Add event listeners to all cards
    cards.forEach(card => {
      card.addEventListener('mousemove', handleMouseMove);
      card.addEventListener('mouseleave', handleMouseLeave);
      card.addEventListener('mouseenter', handleMouseEnter);
    });

    // Cleanup
    return () => {
      cards.forEach(card => {
        card.removeEventListener('mousemove', handleMouseMove);
        card.removeEventListener('mouseleave', handleMouseLeave);
        card.removeEventListener('mouseenter', handleMouseEnter);
      });
    };
  }, []);

  return { cursorBlobRef };
};
