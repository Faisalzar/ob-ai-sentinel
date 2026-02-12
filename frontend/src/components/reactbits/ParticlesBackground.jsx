import React, { useEffect, useRef } from "react";

/**
 * ParticlesBackground
 * 
 * A calm, professional "Network Node" background.
 * Slow floating dots connected by thin lines when close.
 */
export default function ParticlesBackground({ children, color = "rgba(255, 255, 255, 0.15)" }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        let animationFrameId;
        let width = window.innerWidth;
        let height = window.innerHeight;

        // Config
        const particleCount = 60;
        const connectionDistance = 150;
        const mouseDistance = 200;

        const particles = [];

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.5; // Very slow velocity
                this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 1.5 + 0.5; // Tiny dots
                this.color = color;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                // Bounce off edges
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
            }

            draw() {
                ctx.fillStyle = this.color || color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const init = () => {
            particles.length = 0;
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        };

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            init();
        };

        window.addEventListener('resize', resize);
        resize();

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            // Update and draw particles
            particles.forEach(p => {
                p.update();
                p.draw();
            });

            // Draw connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < connectionDistance) {
                        const opacity = 1 - (distance / connectionDistance);
                        ctx.beginPath();
                        ctx.strokeStyle = color.replace(/[\d.]+\)$/g, `${opacity * 0.1})`); // Hacky alpha replace or just use prop if rgba
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div style={{ position: "relative", width: "100%", height: "100%", minHeight: "100%" }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "hidden", zIndex: 0 }}>
                <canvas ref={canvasRef} style={{ display: "block" }} />
            </div>
            <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
                {children}
            </div>
        </div>
    );
}
