import React, { useEffect, useState } from 'react';
import { X, CheckCircle, Bell, Info } from 'lucide-react';

const ToastNotification = ({ message, type = 'info', onClose, duration = 5000 }) => {
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsClosing(true);
            setTimeout(onClose, 300); // Wait for fade out animation
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-blue-600';
    const icon = type === 'success' ? <CheckCircle size={20} /> : <Bell size={20} />;

    return (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg text-white transform transition-all duration-300 ease-in-out ${bgColor} ${!isClosing ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
            <div className="flex-shrink-0">
                {icon}
            </div>
            <div className="flex-1 font-medium">
                {message}
            </div>
            <button 
                onClick={() => {
                    setIsClosing(true);
                    setTimeout(onClose, 300);
                }}
                className="ml-4 hover:bg-white/20 rounded-full p-1 transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default ToastNotification;
