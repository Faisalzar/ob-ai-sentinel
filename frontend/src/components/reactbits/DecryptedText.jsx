import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

/**
 * DecryptedText
 *
 * A text animation that reveals the text by "decrypting" random characters.
 *
 * @param {string} text - The text to display.
 * @param {number} speed - Speed of the decryption in ms (default 50).
 * @param {number} maxIterations - Number of random characters before revealing the real one (default 10).
 * @param {boolean} sequential - If true, reveals characters one by one. If false, all at once (default true).
 * @param {boolean} revealDirection - "start" (left-to-right) or "end" (right-to-left) or "center".
 * @param {boolean} useOriginalCharsOnly - If true, only uses characters from the original string for scrambling.
 * @param {string} className - Valid CSS class names.
 * @param {boolean} parentHover - If true, re-runs animation on parent hover.
 * @param {boolean} animateOnMount - If true, runs animation on mount (default true).
 */
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";

export default function DecryptedText({
    text,
    speed = 50,
    maxIterations = 10,
    sequential = true,
    revealDirection = "start",
    useOriginalCharsOnly = false,
    className = "",
    parentHover = false,
    animateOnMount = true,
}) {
    const [displayText, setDisplayText] = useState(text);
    const [isScrambling, setIsScrambling] = useState(false);
    const revealedIndices = useRef(new Set());
    const intervalRef = useRef(null);

    useEffect(() => {
        let interval = null;
        let currentIteration = 0;

        const startScramble = () => {
            setIsScrambling(true);
            revealedIndices.current.clear();
            currentIteration = 0;

            if (intervalRef.current) clearInterval(intervalRef.current);

            intervalRef.current = setInterval(() => {
                setDisplayText((prevText) => {
                    return text
                        .split("")
                        .map((char, index) => {
                            if (char === " ") return " ";

                            if (revealedIndices.current.has(index)) return char;

                            if (Math.random() < 0.1) {
                                // chance to reveal a character
                                if (sequential) {
                                    if (revealDirection === "start" && index === revealedIndices.current.size) {
                                        revealedIndices.current.add(index);
                                        return char;
                                    }
                                } else {
                                    revealedIndices.current.add(index);
                                    return char;
                                }
                            }

                            if (currentIteration >= maxIterations) {
                                revealedIndices.current.add(index);
                                return char;
                            }

                            const randomChar = letters[Math.floor(Math.random() * letters.length)];
                            return randomChar;
                        })
                        .join("");
                });

                currentIteration++;
                if (revealedIndices.current.size === text.length) {
                    clearInterval(intervalRef.current);
                    setIsScrambling(false);
                }
            }, speed);
        };

        if (animateOnMount) {
            startScramble();
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [text, speed, maxIterations, sequential, revealDirection, animateOnMount]);

    return (
        <span className={className}>
            {displayText}
        </span>
    );
}
