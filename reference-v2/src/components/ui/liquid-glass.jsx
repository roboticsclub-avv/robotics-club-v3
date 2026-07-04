"use client";

import React, { useState } from 'react';
import { motion } from 'motion/react';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export const LiquidGlassCard = ({
  children,
  className = '',
  draggable = false, // We set default to false for a navbar to prevent user from dragging it away!
  expandable = false,
  width,
  height,
  expandedWidth,
  expandedHeight,
  blurIntensity = 'xl',
  borderRadius = '32px',
  glowIntensity = 'sm',
  shadowIntensity = 'md',
  ...props
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleExpansion = (e) => {
    if (!expandable) return;
    // Don't toggle if clicking on interactive elements
    if (e.target.closest('a, button, input, select, textarea')) return;
    setIsExpanded(!isExpanded);
  };

  const blurClasses = {
    sm: 'backdrop-blur-xs saturate-[110%]',
    md: 'backdrop-blur-md saturate-[130%]',
    lg: 'backdrop-blur-lg saturate-[150%]',
    xl: 'backdrop-blur-[16px] saturate-[180%] brightness-[1.05]', // macOS-style glass
  };

  const shadowStyles = {
    none: 'inset 0 0 0 0 rgba(255, 255, 255, 0)',
    xs: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
    sm: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 0 rgba(0, 0, 0, 0.15)',
    md: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.22), inset 0 -1px 0 0 rgba(0, 0, 0, 0.2)', // Thin macOS edge highlight
    lg: 'inset 0 1.5px 0 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 0 rgba(0, 0, 0, 0.3)',
    xl: 'inset 0 2px 0 0 rgba(255, 255, 255, 0.4), inset 0 -1.5px 0 0 rgba(0, 0, 0, 0.4)',
    '2xl': 'inset 0 3px 0 0 rgba(255, 255, 255, 0.5), inset 0 -2px 0 0 rgba(0, 0, 0, 0.5)',
  };

  const glowStyles = {
    none: '0 4px 4px rgba(0, 0, 0, 0.05)',
    xs: '0 4px 10px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.05)',
    sm: '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(255, 255, 255, 0.05)',
    md: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.03), 0 0 0 1px rgba(255, 255, 255, 0.08)',
    lg: '0 25px 50px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.15)',
    xl: '0 35px 60px -15px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.12)',
    '2xl': '0 45px 80px -20px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.15)',
  };

  const containerVariants = expandable
    ? {
        collapsed: {
          width: width || 'auto',
          height: height || 'auto',
          transition: {
            duration: 0.4,
            ease: [0.5, 1.5, 0.5, 1],
          },
        },
        expanded: {
          width: expandedWidth || 'auto',
          height: expandedHeight || 'auto',
          transition: {
            duration: 0.4,
            ease: [0.5, 1.5, 0.5, 1],
          },
        },
      }
    : {};

  const MotionComponent = draggable || expandable ? motion.div : 'div';

  const motionProps =
    draggable || expandable
      ? {
          variants: expandable ? containerVariants : undefined,
          animate: expandable ? (isExpanded ? 'expanded' : 'collapsed') : undefined,
          onClick: expandable ? handleToggleExpansion : undefined,
          drag: draggable,
          dragConstraints: draggable ? { left: 0, right: 0, top: 0, bottom: 0 } : undefined,
          dragElastic: draggable ? 0.3 : undefined,
          dragTransition: draggable
            ? {
                bounceStiffness: 300,
                bounceDamping: 10,
                power: 0.3,
              }
            : undefined,
          whileDrag: draggable ? { scale: 1.02 } : undefined,
          whileHover: { scale: 1.01 },
          whileTap: { scale: 0.98 },
        }
      : {};

  return (
    <>
      {/* Hidden SVG Filter for liquid glass warp/distortion */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter
            id="glass-blur"
            x="0"
            y="0"
            width="100%"
            height="100%"
            filterUnits="objectBoundingBox"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.003 0.007"
              numOctaves="1"
              result="turbulence"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="turbulence"
              scale="180" /* High displacement scale for rich liquid warp */
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <MotionComponent
        className={cn(
          `relative ${draggable ? 'cursor-grab active:cursor-grabbing' : ''} ${expandable ? 'cursor-pointer' : ''}`,
          className
        )}
        style={{
          borderRadius,
          ...(width && !expandable && { width }),
          ...(height && !expandable && { height }),
        }}
        {...motionProps}
        {...props}
      >
        {/* Background Base Tint (Ultra-translucent for Apple/macOS glass aesthetics) */}
        <div 
          className="absolute inset-0 z-0 bg-slate-900/[0.08]"
          style={{ borderRadius }}
        />

        {/* Bend Layer (Backdrop blur with distortion) */}
        <div
          className={`absolute inset-0 ${blurClasses[blurIntensity]} z-0`}
          style={{
            borderRadius,
            filter: 'url(#glass-blur)',
          }}
        />

        {/* Face Layer (Main shadow and glow) */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            borderRadius,
            boxShadow: glowStyles[glowIntensity],
          }}
        />

        {/* Edge Layer (Inner highlights) */}
        <div
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            borderRadius,
            boxShadow: shadowStyles[shadowIntensity],
            border: '1px solid rgba(255, 255, 255, 0.09)'
          }}
        />

        {/* Content */}
        <div className="relative z-30 w-full h-full">
          {children}
        </div>
      </MotionComponent>
    </>
  );
};
