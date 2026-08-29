import React, { useEffect, useRef } from "react";

const Interactive3DBackground = ({ className = "" }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
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

    // Mouse Tracking State
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      radius: 220,
    };

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    // Click Energy Wave Burst State
    const waves = [];
    const handleMouseDown = (e) => {
      waves.push({
        x: e.clientX,
        y: e.clientY,
        radius: 10,
        maxRadius: 350,
        alpha: 0.8,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);

    // 1. Generate 3D Network Mesh Nodes
    const numNodes = Math.min(Math.floor((width * height) / 10000), 80);
    const nodes = [];
    for (let i = 0; i < numNodes; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 500 + 50,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        radius: Math.random() * 2 + 1.2,
        baseColor: i % 3 === 0 ? "#6366f1" : i % 3 === 1 ? "#06b6d4" : "#ec4899",
      });
    }

    // 2. Generate Floating Educational & Engineering Knowledge Nodes
    const knowledgeObjects = [
      { emoji: "🎓", label: "Graduation Cap", color: "#8b5cf6", size: 28, orbitDist: 70, angle: 0, speed: 0.02 },
      { emoji: "📘", label: "CSE Book", color: "#3b82f6", size: 26, orbitDist: 110, angle: 1.2, speed: -0.015 },
      { emoji: "⚛️", label: "Science Atom", color: "#06b6d4", size: 26, orbitDist: 150, angle: 2.4, speed: 0.018 },
      { emoji: "📜", label: "Diploma", color: "#f59e0b", size: 24, orbitDist: 90, angle: 3.6, speed: -0.022 },
      { emoji: "⚙️", label: "Engineering", color: "#ec4899", size: 24, orbitDist: 180, angle: 4.8, speed: 0.012 },
      { emoji: "📖", label: "Library Book", color: "#10b981", size: 26, orbitDist: 130, angle: 0.8, speed: -0.016 },
      { emoji: "💻", label: "Coding", color: "#3b82f6", size: 26, orbitDist: 190, angle: 2.1, speed: 0.014 },
      { emoji: "🏆", label: "Achievement", color: "#eab308", size: 26, orbitDist: 160, angle: 3.3, speed: -0.019 },
      { emoji: "🧭", label: "Discovery", color: "#14b8a6", size: 24, orbitDist: 210, angle: 5.1, speed: 0.011 },
      { emoji: "✨", label: "AI & Innovation", color: "#c084fc", size: 22, orbitDist: 85, angle: 4.2, speed: 0.025 },
    ];

    // Create 3D Orbiting State for Knowledge Objects
    const orbitingNodes = knowledgeObjects.map((item) => ({
      ...item,
      x: width / 2,
      y: height / 2,
      vx: 0,
      vy: 0,
      floatOffset: Math.random() * Math.PI * 2,
    }));

    let time = 0;

    // Render loop
    const render = () => {
      time += 0.04;

      // Smooth mouse lerp physics
      mouse.x += (mouse.targetX - mouse.x) * 0.07;
      mouse.y += (mouse.targetY - mouse.y) * 0.07;

      // Deep dark space background gradient
      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, "#060a17");
      bgGradient.addColorStop(0.5, "#091024");
      bgGradient.addColorStop(1, "#030611");

      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Radial mouse glow field
      const mouseGlow = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        0,
        mouse.x,
        mouse.y,
        400
      );
      mouseGlow.addColorStop(0, "rgba(99, 102, 241, 0.22)");
      mouseGlow.addColorStop(0.4, "rgba(6, 182, 212, 0.12)");
      mouseGlow.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = mouseGlow;
      ctx.fillRect(0, 0, width, height);

      // 3D Perspective Grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
      ctx.lineWidth = 1;
      const gridSize = 65;
      const offsetX = (mouse.x * 0.025) % gridSize;
      const offsetY = (mouse.y * 0.025) % gridSize;

      for (let x = offsetX; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = offsetY; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Click Energy Waves
      for (let i = waves.length - 1; i >= 0; i--) {
        const wave = waves[i];
        wave.radius += (wave.maxRadius - wave.radius) * 0.12;
        wave.alpha -= 0.025;

        if (wave.alpha <= 0) {
          waves.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = wave.alpha;
        ctx.strokeStyle = "#06b6d4";
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#06b6d4";
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Update and draw 3D Background Mesh Nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        // Draw connections between nearby nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const ndx = other.x - node.x;
          const ndy = other.y - node.y;
          const nDist = Math.sqrt(ndx * ndx + ndy * ndy);

          if (nDist < 135) {
            const alpha = (1 - nDist / 135) * 0.22;
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }

        const scale = 300 / (300 + node.z);
        const radius = node.radius * scale * 1.5;

        ctx.save();
        ctx.shadowBlur = 10 * scale;
        ctx.shadowColor = node.baseColor;
        ctx.fillStyle = node.baseColor;
        ctx.beginPath();
        ctx.arc(node.x, node.y, Math.max(radius, 0.5), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // -------------------------------------------------------------
      // 🎓 ORBITING EDUCATIONAL & ENGINEERING KNOWLEDGE FIELD
      // -------------------------------------------------------------
      orbitingNodes.forEach((node) => {
        // Orbit angle rotation
        node.angle += node.speed;

        // Floating offset height
        const floatY = Math.sin(time * 2 + node.floatOffset) * 12;

        // Target orbital position centered on cursor
        const targetX = mouse.x + Math.cos(node.angle) * node.orbitDist;
        const targetY = mouse.y + Math.sin(node.angle) * (node.orbitDist * 0.5) + floatY;

        // Smooth gravitational lerp towards orbit position
        node.x += (targetX - node.x) * 0.08;
        node.y += (targetY - node.y) * 0.08;

        // Draw laser connector thread to mouse center
        ctx.save();
        ctx.strokeStyle = `${node.color}35`;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(mouse.x, mouse.y);
        ctx.lineTo(node.x, node.y);
        ctx.stroke();
        ctx.restore();

        // Draw Glowing Knowledge Object Node
        ctx.save();
        ctx.translate(node.x, node.y);

        // Ambient radial aura
        ctx.shadowBlur = 18;
        ctx.shadowColor = node.color;

        ctx.beginPath();
        ctx.arc(0, 0, node.size * 0.85, 0, Math.PI * 2);
        ctx.fillStyle = `${node.color}25`;
        ctx.fill();
        ctx.strokeStyle = `${node.color}80`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Emoji / Icon
        ctx.font = `${node.size}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.emoji, 0, 0);

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
    />
  );
};

export default Interactive3DBackground;
