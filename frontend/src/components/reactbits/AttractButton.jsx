import React, { useCallback, useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { Magnet } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';

export default function AttractButton({
    className,
    particleCount = 12,
    attractRadius = 50,
    children,
    ...props
}) {
    const [isAttracting, setIsAttracting] = useState(false);
    const [particles, setParticles] = useState([]);
    const particlesControl = useAnimation();

    useEffect(() => {
        const newParticles = Array.from({ length: particleCount }, (_, i) => {
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = attractRadius * (0.7 + Math.random() * 0.3);
            return {
                id: i,
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
            };
        });
        setParticles(newParticles);
    }, [particleCount, attractRadius]);

    const handleInteractionStart = useCallback(async () => {
        setIsAttracting(true);
        await particlesControl.start({
            x: 0,
            y: 0,
            transition: {
                type: 'spring',
                stiffness: 50,
                damping: 10,
            },
        });
    }, [particlesControl]);

    const handleInteractionEnd = useCallback(async () => {
        setIsAttracting(false);
        await particlesControl.start((i) => ({
            x: particles[i].x,
            y: particles[i].y,
            transition: {
                type: 'spring',
                stiffness: 100,
                damping: 15,
            },
        }));
    }, [particlesControl, particles]);

    return (
        <button
            className={cn(
                'relative min-w-40 touch-none',
                'transition-all duration-300',
                'font-semibold rounded-lg px-4 py-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                className,
            )}
            style={{
                background: 'linear-gradient(135deg, #882ED8 0%, #6B23AE 100%)',
                color: 'white',
                borderColor: 'rgba(136, 46, 216, 0.5)',
                borderWidth: '1px',
                borderStyle: 'solid',
                boxShadow: '0 4px 6px -1px rgba(136, 46, 216, 0.3)',
                ...props.style // Allow overrides
            }}
            onMouseEnter={handleInteractionStart}
            onMouseLeave={handleInteractionEnd}
            onTouchStart={handleInteractionStart}
            onTouchEnd={handleInteractionEnd}
            {...props}
        >
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    custom={particle.id}
                    initial={{ x: particle.x, y: particle.y }}
                    animate={particlesControl}
                    style={{
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'none',
                        backgroundColor: 'white',
                    }}
                    className={cn(
                        'absolute h-1.5 w-1.5 rounded-full',
                        'transition-opacity duration-300',
                        isAttracting ? 'opacity-100' : 'opacity-40',
                    )}
                />
            ))}
            <span className="relative flex w-full items-center justify-center gap-2">
                <Magnet
                    className={cn(
                        'h-4 w-4 transition-transform duration-300',
                        isAttracting && 'scale-110',
                    )}
                />
                {children || (isAttracting ? 'Attracting' : 'Hover me')}
            </span>
        </button>
    );
}
