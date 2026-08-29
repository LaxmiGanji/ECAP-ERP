import React, { useEffect, useRef } from "react";

const CustomCreativeCursor = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    // Only initialize on devices with mouse pointing capabilities
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Mouse & Ring Physics States
    const mouse = { x: -100, y: -100, isHovering: false, isClicking: false };
    const ring = { x: -100, y: -100, radius: 18, targetRadius: 18, color: "#6366f1" };
    const dot = { x: -100, y: -100 };

    const particles = [];
    const ripples = [];

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;

      // Spawn subtle stardust trail particles
      if (Math.random() < 0.6) {
        particles.push({
          x: mouse.x + (Math.random() - 0.5) * 4,
          y: mouse.y + (Math.random() - 0.5) * 4,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8 - 0.4,
          size: Math.random() * 2.5 + 1,
          alpha: 0.8,
          color: Math.random() > 0.5 ? "#6366f1" : Math.random() > 0.5 ? "#06b6d4" : "#ec4899",
        });
      }

      // Check hover state on interactive DOM elements
      const target = e.target;
      if (target) {
        const isInteractive =
          target.closest("button, a, select, input, textarea, [role='button'], .bento-card, .clickable") !== null;
        mouse.isHovering = isInteractive;
      }
    };

    const handleMouseDown = () => {
      mouse.isClicking = true;
      // Spawn click shockwave ripple & particle burst
      ripples.push({
        x: mouse.x,
        y: mouse.y,
        radius: 4,
        maxRadius: 36,
        alpha: 0.9,
      });

      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12;
        const speed = Math.random() * 3 + 2;
        particles.push({
          x: mouse.x,
          y: mouse.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 3 + 1.5,
          alpha: 1,
          color: i % 2 === 0 ? "#6366f1" : "#06b6d4",
        });
      }
    };

    const handleMouseUp = () => {
      mouse.isClicking = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    // Animation Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth lag / lerp physics for cursor dot and ring
      dot.x += (mouse.x - dot.x) * 0.4;
      dot.y += (mouse.y - dot.y) * 0.4;

      ring.x += (mouse.x - ring.x) * 0.18;
      ring.y += (mouse.y - ring.y) * 0.18;

      // Dynamic radius scaling based on hover / click
      if (mouse.isClicking) {
        ring.targetRadius = 12;
      } else if (mouse.isHovering) {
        ring.targetRadius = 32;
      } else {
        ring.targetRadius = 18;
      }

      ring.radius += (ring.targetRadius - ring.radius) * 0.2;

      // 1. Draw Stardust Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.025;
        p.size *= 0.96;

        if (p.alpha <= 0 || p.size <= 0.2) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 2. Draw Click Shockwave Ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += (r.maxRadius - r.radius) * 0.2;
        r.alpha -= 0.04;

        if (r.alpha <= 0) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = r.alpha;
        ctx.strokeStyle = "#6366f1";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 3. Draw Outer Magnetic Ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      ctx.strokeStyle = mouse.isHovering ? "rgba(6, 182, 212, 0.8)" : "rgba(99, 102, 241, 0.6)";
      ctx.lineWidth = mouse.isHovering ? 2.5 : 1.5;
      ctx.shadowBlur = mouse.isHovering ? 16 : 8;
      ctx.shadowColor = mouse.isHovering ? "#06b6d4" : "#6366f1";
      ctx.stroke();
      ctx.restore();

      // 4. Draw Inner Center Glowing Dot
      ctx.save();
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, mouse.isHovering ? 4 : 3, 0, Math.PI * 2);
      ctx.fillStyle = mouse.isHovering ? "#06b6d4" : "#ffffff";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#ffffff";
      ctx.fill();
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[99999]"
    />
  );
};

export default CustomCreativeCursor;
