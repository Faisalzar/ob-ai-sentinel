import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../services/apiConfig';

const ResendTimer = ({ email, type, onResend }) => {
    const [timeLeft, setTimeLeft] = useState(0); // 0 means ready to resend
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        let timer;
        if (timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [timeLeft]);

    const handleResend = async (e) => {
        e.preventDefault();
        if (timeLeft > 0 || loading) return;

        setLoading(true);
        setMessage('');

        try {
            const res = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, type }),
            });

            if (!res.ok) {
                throw new Error('Failed to resend');
            }

            // Start cooldown (60 seconds)
            setTimeLeft(60);
            setMessage('New verification code sent!');

            if (onResend) onResend();

        } catch (err) {
            console.error(err);
            setMessage('Failed to send. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="resend-timer" style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
            {message && <div style={{ color: timeLeft > 0 ? '#10b981' : '#ef4444', marginBottom: '0.5rem' }}>{message}</div>}

            <div style={{ color: 'var(--text-secondary)' }}>
                Did not receive the code?{' '}
                {timeLeft > 0 ? (
                    <span style={{ color: 'var(--text-muted)' }}>
                        Resend in {formatTime(timeLeft)}
                    </span>
                ) : (
                    <a
                        href="#"
                        onClick={handleResend}
                        style={{
                            color: 'var(--primary-color)',
                            textDecoration: 'underline',
                            cursor: loading ? 'wait' : 'pointer',
                            fontWeight: 500
                        }}
                    >
                        {loading ? 'Sending...' : 'Resend OTP'}
                    </a>
                )}
            </div>
        </div>
    );
};

export default ResendTimer;
