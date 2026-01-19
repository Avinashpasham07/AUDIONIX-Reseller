import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 text-center">
                    <h1 className="text-4xl font-bold text-red-600 mb-4">Something went wrong.</h1>
                    <p className="text-zinc-400 mb-8">We encountered an unexpected error. Please try refreshing the page.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-zinc-200 transition"
                    >
                        Refresh Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
