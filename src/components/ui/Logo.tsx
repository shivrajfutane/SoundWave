import React from 'react'

export const Logo = ({ className = "w-8 h-8", color = "currentColor" }: { className?: string, color?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    <path 
      d="M2 12H4L6 15L8 9L10 18L12 6L14 19L16 10L18 15L20 12H22" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </svg>
)
