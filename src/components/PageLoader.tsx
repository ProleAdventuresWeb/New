import React from 'react';

export const PageLoader: React.FC = () => (
  <div className="min-h-[80vh] flex flex-col items-center justify-center relative" role="status" aria-label="Loading page">
    {/* YouTube style top progress bar */}
    <div className="fixed top-0 left-0 right-0 h-[3px] z-[9999] overflow-hidden bg-transparent">
      <div 
        className="h-full bg-red-500 rounded-r-full shadow-[0_0_10px_rgba(239,68,68,0.8)]" 
        style={{ animation: 'indeterminate 1.5s infinite ease-in-out' }} 
      />
    </div>
    <style>
      {`
        @keyframes indeterminate {
          0% { transform: translateX(-100%); width: 10%; }
          50% { transform: translateX(30%); width: 60%; }
          100% { transform: translateX(200%); width: 10%; }
        }
      `}
    </style>
  </div>
);
