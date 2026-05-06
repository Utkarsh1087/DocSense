"use client";

import React, { useEffect, useRef } from "react";

interface GravityStarsProps {
  starsCount?: number;
  starsSize?: number;
  starsOpacity?: number;
  glowIntensity?: number;
  movementSpeed?: number;
  mouseInfluence?: number;
  mouseGravity?: "attract" | "repel";
  gravityStrength?: number;
  starColor?: string;
  className?: string;
}

export default function GravityStarsBackground({
  starsCount = 100,
  starsSize = 2,
  starsOpacity = 0.75,
  glowIntensity = 20,
  movementSpeed = 0.3,
  mouseInfluence = 150,
  mouseGravity = "attract",
  gravityStrength = 75,
  starColor = "#ffffff",
  className = "",
}: GravityStarsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let stars: Star[] = [];

    class Star {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      twinklePhase: number;
      twinkleSpeed: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.vx = (Math.random() - 0.5) * movementSpeed;
        this.vy = (Math.random() - 0.5) * movementSpeed;
        this.size = Math.random() * starsSize;
        this.twinklePhase = Math.random() * Math.PI * 2;
        this.twinkleSpeed = 0.02 + Math.random() * 0.03;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.twinklePhase += this.twinkleSpeed;

        if (this.x < 0) this.x = canvas!.width;
        if (this.x > canvas!.width) this.x = 0;
        if (this.y < 0) this.y = canvas!.height;
        if (this.y > canvas!.height) this.y = 0;

        const dx = mouseRef.current.x - this.x;
        const dy = mouseRef.current.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouseInfluence) {
          const force = (mouseInfluence - distance) / mouseInfluence;
          const strength = force * (gravityStrength / 100);
          if (mouseGravity === "attract") {
            this.x += dx * strength * 0.05;
            this.y += dy * strength * 0.05;
          } else {
            this.x -= dx * strength * 0.05;
            this.y -= dy * strength * 0.05;
          }
        }
      }

      draw() {
        if (!ctx) return;
        
        // Calculate twinkle opacity
        const twinkle = (Math.sin(this.twinklePhase) + 1) / 2;
        const currentOpacity = starsOpacity * (0.3 + twinkle * 0.7);

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * (0.8 + twinkle * 0.4), 0, Math.PI * 2);
        ctx.fillStyle = starColor;
        ctx.globalAlpha = currentOpacity;
        
        // Shine/Glow Effect
        ctx.shadowBlur = glowIntensity * twinkle;
        ctx.shadowColor = starColor;
        
        ctx.fill();
      }
    }

    const init = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
      stars = [];
      for (let i = 0; i < starsCount; i++) {
        stars.push(new Star());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((star) => {
        star.update();
        star.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();

    const handleResize = () => init();
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [starsCount, starsSize, starsOpacity, glowIntensity, movementSpeed, mouseInfluence, mouseGravity, gravityStrength, starColor]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
    />
  );
}
