import React from 'react';

const Skeleton = ({ width, height, borderRadius, style, className }) => {
    const styles = {
        width: width || '100%',
        height: height || '20px',
        borderRadius: borderRadius || '4px',
        background: 'linear-gradient(90deg, #f4f4f5 25%, #e4e4e7 50%, #f4f4f5 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        ...style
    };

    return (
        <div className={`skeleton ${className || ''}`} style={styles}>
            <style>
                {`
                    @keyframes shimmer {
                        0% { background-position: 200% 0; }
                        100% { background-position: -200% 0; }
                    }
                `}
            </style>
        </div>
    );
};

export default Skeleton;
