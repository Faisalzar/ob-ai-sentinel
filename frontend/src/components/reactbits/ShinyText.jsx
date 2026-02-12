import React from "react";

/**
 * ShinyText
 *
 * A text component with a shining gradient background that moves.
 *
 * @param {string} text - The text content.
 * @param {boolean} disabled - If true, disables the animation.
 * @param {number} speed - Animation duration in seconds (default 3).
 * @param {string} className - Additional classes.
 */
const ShinyText = ({ text, disabled = false, speed = 3, className = "" }) => {
    const animationStyle = {
        backgroundImage: "linear-gradient(120deg, rgba(255, 255, 255, 0) 40%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0) 60%)",
        backgroundSize: "200% 100%",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        display: "inline-block",
        animation: disabled ? "none" : `shine ${speed}s linear infinite`,
    };

    return (
        <div
            className={`shiny-text ${className}`}
            style={{
                ...animationStyle,
            }}
        >
            {text}
        </div>
    );
};

export default ShinyText;
