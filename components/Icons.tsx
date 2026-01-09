
import React from 'react';

export const BucketTruckIcon = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg 
    viewBox="0 0 100 100" 
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Truck body */}
    <rect x="15" y="60" width="55" height="20" rx="2" fill="currentColor" />
    <rect x="70" y="65" width="20" height="15" rx="2" fill="currentColor" />
    {/* Wheels */}
    <circle cx="25" cy="82" r="6" fill="#111" />
    <circle cx="55" cy="82" r="6" fill="#111" />
    <circle cx="82" cy="82" r="6" fill="#111" />
    {/* The Boom / Cesto mechanism */}
    <path d="M40 60 L40 30" stroke="#FF8C00" strokeWidth="4" />
    <path d="M40 30 L65 20" stroke="#FF8C00" strokeWidth="3" />
    {/* The Bucket */}
    <rect x="65" y="10" width="15" height="12" rx="1" fill="#FFFFFF" stroke="#FF8C00" strokeWidth="2" />
  </svg>
);
