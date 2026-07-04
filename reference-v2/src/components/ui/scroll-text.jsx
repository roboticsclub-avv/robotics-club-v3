"use client";

import React from 'react';
import { motion } from 'motion/react';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const generateVariants = (direction) => {
  const axis = direction === 'left' || direction === 'right' ? 'X' : 'Y';
  const value = direction === 'right' || direction === 'down' ? 100 : -100;

  return {
    hidden: {
      filter: 'blur(10px)',
      opacity: 0,
      [`translate${axis}`]: value,
    },
    visible: {
      filter: 'blur(0px)',
      opacity: 1,
      [`translate${axis}`]: 0,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1], // premium easeOutExpo
      },
    },
  };
};

const defaultViewport = { amount: 0.15, margin: '0px 0px -50px 0px', once: true };

const TextAnimation = ({
  as = 'h1',
  text,
  classname = '',
  viewport = defaultViewport,
  variants,
  direction = 'down',
  letterAnime = false,
  lineAnime = false,
  style = {},
  ...props
}) => {
  const baseVariants = variants || generateVariants(direction);
  
  // Clean up translation properties to standard Framer Motion keys x/y
  const convertTranslationKey = (v) => {
    if (!v) return {};
    const result = { ...v };
    if ('translateX' in result) {
      result.x = result.translateX;
      delete result.translateX;
    }
    if ('translateY' in result) {
      result.y = result.translateY;
      delete result.translateY;
    }
    return result;
  };

  const modifiedVariants = {
    hidden: convertTranslationKey(baseVariants.hidden),
    visible: {
      ...convertTranslationKey(baseVariants.visible),
    },
  };

  const MotionComponent = motion[as] || motion.h1;

  return (
    <MotionComponent
      whileInView="visible"
      initial="hidden"
      variants={containerVariants}
      viewport={viewport}
      className={cn(classname)}
      style={style}
      {...props}
    >
      {lineAnime ? (
        <motion.span className="inline-block" variants={modifiedVariants}>
          {text}
        </motion.span>
      ) : (
        <>
          {text.split(' ').map((word, index) => (
            <motion.span
              key={`${word}-${index}`}
              className="inline-block"
              variants={letterAnime === false ? modifiedVariants : {}}
            >
              {letterAnime ? (
                <>
                  {word.split('').map((letter, letterIndex) => (
                    <motion.span
                      key={letterIndex}
                      className="inline-block"
                      variants={modifiedVariants}
                    >
                      {letter}
                    </motion.span>
                  ))}
                  &nbsp;
                </>
              ) : (
                <>{word}&nbsp;</>
              )}
            </motion.span>
          ))}
        </>
      )}
    </MotionComponent>
  );
};

export default TextAnimation;
