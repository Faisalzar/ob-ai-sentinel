import React, { useState, useEffect } from 'react';

const AuthenticatedImage = ({ src, alt, className, onClick }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      try {
        setLoading(true);
        setError(false);

        // Get auth token
        const auth = localStorage.getItem('auth');
        let token = null;
        if (auth) {
          try {
            const parsed = JSON.parse(auth);
            token = parsed.token;
          } catch { }
        }

        // Fetch image with authentication
        // Use the configured API_BASE_URL, stripping the /api/v1 suffix if present since src likely contains it or is relative
        let baseUrl = 'http://localhost:8000';
        try {
          const apiConfig = await import('../../services/apiConfig');
          baseUrl = apiConfig.default.replace('/api/v1', ''); // Strip /api/v1 as it's usually part of the base but src might be full path
        } catch (e) {
          console.warn("Could not load apiConfig, falling back to localhost");
        }

        // Handle fully qualified URLs or relative paths
        let url = src;
        if (!src.startsWith('http')) {
          url = `${baseUrl}${src.startsWith('/') ? '' : '/'}${src}`;
        }

        console.log('Fetching image URL:', url);
        console.log('Has token:', !!token);
        const response = await fetch(url, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });

        console.log('Image response status:', response.status);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Image fetch error:', errorText);
          throw new Error(`Failed to load image: ${response.status}`);
        }

        // Convert to blob and create object URL
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setImageSrc(objectUrl);
      } catch (err) {
        console.error('Failed to load image:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (src) {
      loadImage();
    }

    // Cleanup object URL on unmount
    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [src]);

  if (loading) {
    return (
      <div className={className} style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f0f0f',
        minHeight: '200px'
      }}>
        Loading...
      </div>
    );
  }

  if (error || !imageSrc) {
    return (
      <div className={className} style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f0f0f',
        minHeight: '200px',
        color: '#ff4444'
      }}>
        Failed to load image
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onClick={onClick}
    />
  );
};

export default AuthenticatedImage;
