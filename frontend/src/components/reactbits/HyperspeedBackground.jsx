import React, { useEffect, useRef } from "react";

/**
 * HyperspeedBackground
 * 
 * A high-performance standard HTML5 Canvas "Warp Speed" effect.
 * No Three.js required, keeping the bundle size small while looking great.
 */
export default function HyperspeedBackground({ children }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        let animationFrameId;

        let width = window.innerWidth;
        let height = window.innerHeight;

        // Star properties
        const stars = [];
        const numStars = 600;
        const speed = 25; // Speed factor

        // Initialize stars
        const initStars = () => {
            stars.length = 0;
            for (let i = 0; i < numStars; i++) {
                stars.push({
                    x: Math.random() * width - width / 2,
                    y: Math.random() * height - height / 2,
                    z: Math.random() * width, // depth
                    o: Math.random() * 0.5 + 0.5 // oscillation/brightness
                });
            }
        };

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            initStars();
        };

        window.addEventListener('resize', resize);
        resize();

        // Animation Loop
        const render = () => {
            ctx.fillStyle = "#060010"; // Match the theme background/dark color
            ctx.fillRect(0, 0, width, height);

            const cx = width / 2;
            const cy = height / 2;

            stars.forEach((star) => {
                // Move star towards screen (decreasing Z)
                star.z -= speed;

                // Reset if it passes camera
                if (star.z <= 0) {
                    star.x = Math.random() * width - width / 2;
                    star.y = Math.random() * height - height / 2;
                    star.z = width;
                }

                // Project 3D coordinates to 2D
                // Simple perspective projection: x' = x / z * constant
                const k = 128.0 / star.z;
                const px = star.x * k + cx;
                const py = star.y * k + cy;

                // Calculate size based on depth (closer = bigger)
                const size = (1 - star.z / width) * 4.5;

                // Opacity based on depth (fades in as it approaches)
                const alpha = (1 - star.z / width);

                if (px >= 0 && px <= width && py >= 0 && py <= height && size > 0) {
                    // Draw star track
                    ctx.beginPath();
                    // Create a trail effect by drawing from previous position (simulated)
                    // Simple visualization: Just draw the star for now with a slight trail
                    const tailLength = speed * k * 0.5;
                    const angle = Math.atan2(py - cy, px - cx);

                    ctx.fillStyle = `rgba(180, 200, 255, ${alpha})`;
                    ctx.arc(px, py, size, 0, Math.PI * 2);
                    ctx.fill();

                    // Optional: Add a subtle trail
                    ctx.beginPath();
                    ctx.moveTo(px, py);
                    ctx.lineTo(px - Math.cos(angle) * tailLength * 4, py - Math.sin(angle) * tailLength * 4);
                    ctx.strokeStyle = `rgba(180, 200, 255, ${alpha * 0.4})`;
                    ctx.lineWidth = size;
                    ctx.stroke();
                }
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="rb-relative rb-w-full rb-h-full rb-min-h-screen rb-bg-dark rb-text-white rb-overflow-hidden">
            <canvas
                ref={canvasRef}
                className="rb-absolute rb-inset-0 rb-z-0 rb-w-full rb-h-full"
            />
            <div className="rb-relative rb-z-10 rb-w-full rb-h-full">
                {children}
            </div>
        </div>
    );
}
