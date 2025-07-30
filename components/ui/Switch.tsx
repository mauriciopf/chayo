'use client'

import React from 'react'

interface SwitchProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  id?: string
  name?: string
}

const Switch: React.FC<SwitchProps> = ({
  enabled,
  onChange,
  disabled = false,
  size = 'md',
  className = '',
  id,
  name
}) => {
  const sizeClasses = {
    sm: 'switch-sm',
    md: 'switch-md', 
    lg: 'switch-lg'
  }

  return (
    <label className={`switch ${sizeClasses[size]} ${className}`}>
      <input
        type="checkbox"
        role="switch"
        checked={enabled}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        id={id}
        name={name}
        aria-checked={enabled}
        className="switch-input"
      />
      <span className="switch-slider"></span>
      
      <style jsx>{`
        .switch {
          position: relative;
          display: inline-block;
          cursor: ${disabled ? 'not-allowed' : 'pointer'};
          opacity: ${disabled ? '0.5' : '1'};
        }
        
        .switch-sm {
          width: 36px;
          height: 20px;
        }
        
        .switch-md {
          width: 44px;
          height: 24px;
        }
        
        .switch-lg {
          width: 52px;
          height: 28px;
        }
        
        .switch-input {
          opacity: 0;
          width: 0;
          height: 0;
          position: absolute;
        }
        
        .switch-slider {
          position: absolute;
          cursor: ${disabled ? 'not-allowed' : 'pointer'};
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #cbd5e1;
          transition: all 0.3s ease;
          border-radius: 24px;
          box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .switch-slider:before {
          position: absolute;
          content: "";
          background-color: white;
          transition: all 0.3s ease;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          border: 1px solid #e2e8f0;
        }
        
        .switch-sm .switch-slider:before {
          height: 16px;
          width: 16px;
          left: 2px;
          bottom: 2px;
        }
        
        .switch-md .switch-slider:before {
          height: 20px;
          width: 20px;
          left: 2px;
          bottom: 2px;
        }
        
        .switch-lg .switch-slider:before {
          height: 24px;
          width: 24px;
          left: 2px;
          bottom: 2px;
        }
        
        .switch-input:checked + .switch-slider {
          background-color: #3b82f6;
          box-shadow: inset 0 1px 3px rgba(59, 130, 246, 0.3);
        }
        
        .switch-input:focus + .switch-slider {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
        
        .switch-input:checked + .switch-slider:before {
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
        }
        
        .switch-sm .switch-input:checked + .switch-slider:before {
          transform: translateX(16px);
        }
        
        .switch-md .switch-input:checked + .switch-slider:before {
          transform: translateX(20px);
        }
        
        .switch-lg .switch-input:checked + .switch-slider:before {
          transform: translateX(24px);
        }
        
        .switch-slider:hover {
          background-color: ${enabled ? '#2563eb' : '#94a3b8'};
        }
        
        .switch-input:disabled + .switch-slider:hover {
          background-color: ${enabled ? '#3b82f6' : '#cbd5e1'};
        }
      `}</style>
    </label>
  )
}

export default Switch