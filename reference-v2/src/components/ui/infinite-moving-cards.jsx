"use client";

import React, { useEffect, useState, useRef } from "react";

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export const InfiniteMovingCards = ({
  items,
  direction = "left",
  speed = "slow",
  pauseOnHover = true,
  className = "",
}) => {
  const containerRef = useRef(null);
  const scrollerRef = useRef(null);
  const [start, setStart] = useState(false);


  function addAnimation() {
    if (containerRef.current && scrollerRef.current) {
      const scrollerContent = Array.from(scrollerRef.current.children);

      scrollerContent.forEach((item) => {
        const duplicatedItem = item.cloneNode(true);
        if (scrollerRef.current) {
          scrollerRef.current.appendChild(duplicatedItem);
        }
      });

      getDirection();
      getSpeed();
      setStart(true);
    }
  }

  const getDirection = () => {
    if (containerRef.current) {
      if (direction === "left") {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "forwards"
        );
      } else {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "reverse"
        );
      }
    }
  };

  const getSpeed = () => {
    if (containerRef.current) {
      if (speed === "fast") {
        containerRef.current.style.setProperty("--animation-duration", "20s");
      } else if (speed === "normal") {
        containerRef.current.style.setProperty("--animation-duration", "40s");
      } else {
        containerRef.current.style.setProperty("--animation-duration", "80s");
      }
    }
  };

  useEffect(() => {
    addAnimation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-20 w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_15%,white_85%,transparent)]",
        className
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          "flex min-w-full shrink-0 gap-6 py-4 w-max flex-nowrap",
          start && "animate-scroll",
          pauseOnHover && "hover:[animation-play-state:paused]"
        )}
      >
        {items.map((project, idx) => (
          <li
            key={`${project.title}-${idx}`}
            className="w-[380px] max-w-full relative rounded-2xl flex-shrink-0 px-6 py-6"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              transition: "transform 0.3s ease, border-color 0.3s ease",
            }}
          >
            <div className="flex flex-col h-full justify-between gap-4">
              <div>
                {/* Project Header (Emoji Placeholder) */}
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                  style={{
                    background: "var(--bg-card-hover)",
                    border: "1px solid var(--border-subtle)"
                  }}
                >
                  {project.emoji}
                </div>

                {/* Project Title */}
                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                  {project.title}
                </h3>

                {/* Project Description */}
                <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
                  {project.description}
                </p>
              </div>

              {/* Tags and Link */}
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags?.map((tag, tIdx) => {
                    if (!tag) return null;
                    const tagLabel = typeof tag === "string" ? tag : tag.label || "";
                    const tagStyle = typeof tag === "object" ? tag.style : "";
                    const tagStyles = {
                      tagPurple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
                      tagTeal: "bg-teal-500/10 text-teal-400 border-teal-500/20",
                      tagOrange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
                      tagBlue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                    };
                    const activeClass = tagStyles[tagStyle] || "bg-white/5 text-white/60 border-white/10";
                    return (
                      <span
                        key={`${tagLabel}-${tIdx}`}
                        className={cn("text-xs font-semibold px-2 py-1 rounded-md border", activeClass)}
                      >
                        {tagLabel}
                      </span>
                    );
                  })}
                </div>

                <a
                  href={project.link || "#"}
                  className="inline-flex items-center text-xs font-semibold text-[#ff6b35] hover:text-[#ff8255] transition-colors"
                >
                  Learn More <span className="ml-1">→</span>
                </a>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
