import React, { useEffect, useRef, useState } from 'react';

const Reveal = ({ children, width = "100%", delay = 0, className = "" }) => {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.unobserve(entry.target);
            }
        }, {
            threshold: 0.1,
            rootMargin: "0px 0px -50px 0px"
        });

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, []);

    return (
        <div ref={ref} className={className} style={{ width, position: 'relative', overflow: 'hidden' }}>
            <div
                className={className.includes('h-full') ? 'h-full' : ''}
                style={{
                    transform: isVisible ? "translateY(0)" : "translateY(75px)",
                    opacity: isVisible ? 1 : 0,
                    transition: `all 0.8s cubic-bezier(0.17, 0.55, 0.55, 1) ${delay}s`
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default Reveal;
