import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';

const PixelContext = createContext();

export const PixelProvider = ({ children }) => {
    const [pixelId, setPixelId] = useState(null);
    const location = useLocation();

    // 1. Fetch Pixel ID from Backend Settings
    useEffect(() => {
        const fetchPixelSettings = async () => {
            try {
                const { data } = await api.get('/admin/settings');
                if (data.pixel_id) {
                    setPixelId(data.pixel_id); // Assuming key is 'pixel_id'
                }
            } catch (error) {
                console.error("Failed to fetch pixel settings", error);
            }
        };
        fetchPixelSettings();
    }, []);

    // 2. Initialize Pixel Script
    useEffect(() => {
        if (!pixelId) return;

        // Standard Meta Pixel Code
        !function (f, b, e, v, n, t, s) {
            if (f.fbq) return; n = f.fbq = function () {
                n.callMethod ?
                n.callMethod.apply(n, arguments) : n.queue.push(arguments)
            };
            if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
            n.queue = []; t = b.createElement(e); t.async = !0;
            t.src = v; s = b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t, s)
        }(window, document, 'script',
            'https://connect.facebook.net/en_US/fbevents.js');

        window.fbq('init', pixelId);
        window.fbq('track', 'PageView'); // Track initial page view

    }, [pixelId]);

    // 3. Track Route Changes (PageView) automatically
    useEffect(() => {
        if (!pixelId) return;
        window.fbq('track', 'PageView');
    }, [location.pathname, pixelId]);

    // Helper: Track Custom Event
    const trackEvent = (eventName, data = {}) => {
        if (window.fbq) {
            window.fbq('track', eventName, data);
            console.log(`[Pixel] Tracked ${eventName}`, data);
        }
    };

    return (
        <PixelContext.Provider value={{ trackEvent, pixelId }}>
            {children}
        </PixelContext.Provider>
    );
};

export const usePixel = () => useContext(PixelContext);
