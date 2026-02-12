
import createGlobe from "cobe";
import { useEffect, useRef } from "react";

export default function Earth({
    className = "",
    scale = 1,
    dark = 1,
    baseColor = [1, 1, 1],
    glowColor = [1, 1, 1],
    markerColor = [1, 0, 0],
    onRender = () => { },
}) {
    const canvasRef = useRef(null);

    useEffect(() => {
        let phi = 0;

        if (!canvasRef.current) return;

        const globe = createGlobe(canvasRef.current, {
            devicePixelRatio: 2,
            width: 600 * 2,
            height: 600 * 2,
            phi: 0,
            theta: 0,
            dark: dark,
            diffuse: 1.2,
            mapSamples: 16000,
            mapBrightness: 6,
            baseColor: baseColor,
            markerColor: markerColor,
            glowColor: glowColor,
            opacity: 1,
            scale: scale,
            markers: [],
            onRender: (state) => {
                state.phi = phi;
                phi += 0.01;
            },
        });

        return () => {
            globe.destroy();
        };
    }, [baseColor, glowColor, markerColor, scale, dark]);

    return (
        <div className={`relative flex items-center justify-center w-full h-full ${className}`}>
            <canvas
                style={{
                    width: '100%',
                    height: '100%',
                    maxWidth: "100%",
                    aspectRatio: 1,
                    contain: 'layout paint size',
                    opacity: 0,
                    transition: 'opacity 1s ease'
                }}
                onContextMenu={(e) => e.preventDefault()}
                ref={(el) => {
                    canvasRef.current = el;
                    if (el) el.style.opacity = '1';
                }}
            />
        </div>
    );
}
