/**
 * Utility functions for device detection
 */

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  // Check user agent
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
  
  // Mobile user agent patterns
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
  
  // Check screen width (mobile typically < 768px)
  const isMobileWidth = window.innerWidth < 768
  
  // Check if it's a mobile user agent OR small screen
  return mobileRegex.test(userAgent) || isMobileWidth
}

export function isTabletDevice(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
  
  // iPad and Android tablets
  const tabletRegex = /iPad|Android/i
  
  // Screen width between 768px and 1024px typically indicates tablet
  const isTabletWidth = window.innerWidth >= 768 && window.innerWidth <= 1024
  
  return tabletRegex.test(userAgent) && isTabletWidth
}

export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') {
    return 'desktop'
  }

  if (isMobileDevice() && !isTabletDevice()) {
    return 'mobile'
  }
  
  if (isTabletDevice()) {
    return 'tablet'
  }
  
  return 'desktop'
}

/**
 * Check if device is mobile or tablet (not desktop)
 */
export function isMobileOrTablet(): boolean {
  const deviceType = getDeviceType()
  return deviceType === 'mobile' || deviceType === 'tablet'
}

