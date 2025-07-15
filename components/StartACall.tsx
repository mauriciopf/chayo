import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';

interface StartACallProps {
  darkMode?: boolean;
  setDarkMode: (darkMode: boolean) => void;
  onClose?: () => void;
}

export default function StartACall({ darkMode = true, setDarkMode, onClose }: StartACallProps) {
  const t = useTranslations('common')
  const [widgetReady, setWidgetReady] = useState(false);

  useEffect(() => {
    // New approach: Simulate real user interaction and monitor widget changes
    const triggerWidgetNaturally = () => {
      const widget = document.querySelector('elevenlabs-convai');
      
      if (widget) {
        console.log('=== NEW APPROACH: SIMULATING REAL USER INTERACTION ===');
        console.log('Widget found:', widget);
        console.log('Widget properties:', Object.keys(widget));
        console.log('Widget methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(widget)));
        
        // Wait for widget to be fully loaded
        setTimeout(() => {
          
          // Method 1: Simulate mouse hover then click (like real user)
          console.log('Method 1: Simulating real mouse interaction...');
          
          const rect = widget.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          
          console.log('Widget position:', { x: centerX, y: centerY, width: rect.width, height: rect.height });
          
          // Simulate mouse movement to widget
          const moveEvent = new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: centerX,
            clientY: centerY
          });
          document.dispatchEvent(moveEvent);
          
          setTimeout(() => {
            // Simulate mouse enter
            const enterEvent = new MouseEvent('mouseenter', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: centerX,
              clientY: centerY
            });
            widget.dispatchEvent(enterEvent);
            
            setTimeout(() => {
              // Simulate complete click sequence
              const clickSequence = [
                new MouseEvent('mousedown', {
                  bubbles: true,
                  cancelable: true,
                  view: window,
                  detail: 1,
                  clientX: centerX,
                  clientY: centerY,
                  button: 0,
                  buttons: 1
                }),
                new MouseEvent('mouseup', {
                  bubbles: true,
                  cancelable: true,
                  view: window,
                  detail: 1,
                  clientX: centerX,
                  clientY: centerY,
                  button: 0,
                  buttons: 0
                }),
                new MouseEvent('click', {
                  bubbles: true,
                  cancelable: true,
                  view: window,
                  detail: 1,
                  clientX: centerX,
                  clientY: centerY,
                  button: 0,
                  buttons: 0
                })
              ];
              
              clickSequence.forEach((event, index) => {
                setTimeout(() => {
                  widget.dispatchEvent(event);
                  console.log(`Dispatched real ${event.type} at position (${centerX}, ${centerY})`);
                }, index * 50);
              });
              
            }, 100);
          }, 100);
          
          // Method 2: Try to access widget internals differently
          setTimeout(() => {
            console.log('Method 2: Exploring widget internals...');
            
            // Check if widget has loaded
            if (widget.shadowRoot) {
              console.log('Shadow root exists, monitoring for changes...');
              
              // Set up mutation observer to watch for changes
              const observer = new MutationObserver((mutations) => {
                console.log('Shadow DOM changed!', mutations.length, 'mutations');
                mutations.forEach((mutation, index) => {
                  console.log(`Mutation ${index}:`, {
                    type: mutation.type,
                    addedNodes: mutation.addedNodes.length,
                    removedNodes: mutation.removedNodes.length,
                    target: (mutation.target as Element).tagName
                  });
                  
                  // Check if new interactive elements were added
                  if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                      if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node as Element;
                        console.log('New element added:', element.tagName, element.textContent?.trim());
                        
                        // Look for buttons in newly added content
                        if (element.tagName === 'BUTTON') {
                          console.log('*** NEW BUTTON DETECTED! ***', element.textContent?.trim());
                          setTimeout(() => {
                            (element as HTMLButtonElement).click();
                            console.log('Auto-clicked new button:', element.textContent?.trim());
                          }, 500);
                        }
                        
                        // Also check for buttons within newly added nodes
                        const newButtons = element.querySelectorAll ? element.querySelectorAll('button, [role="button"]') : [];
                        if (newButtons.length > 0) {
                          console.log(`*** ${newButtons.length} NEW BUTTONS FOUND IN ADDED CONTENT! ***`);
                          newButtons.forEach((btn: Element, btnIndex: number) => {
                            console.log(`New button ${btnIndex}:`, btn.textContent?.trim());
                            setTimeout(() => {
                              (btn as HTMLButtonElement).click();
                              console.log(`Auto-clicked new button ${btnIndex}`);
                            }, 500 + btnIndex * 200);
                          });
                        }
                      }
                    });
                  }
                });
              });
              
              observer.observe(widget.shadowRoot, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeOldValue: true
              });
              
              console.log('Mutation observer set up to watch for modal opening');
              
              // Also try to trigger by examining current shadow DOM content
              const currentButtons = widget.shadowRoot.querySelectorAll('button, [role="button"], [onclick], *[style*="cursor: pointer"]');
              console.log(`Found ${currentButtons.length} potentially clickable elements`);
              
              currentButtons.forEach((btn, index) => {
                const btnText = btn.textContent?.trim() || '';
                const btnClass = btn.className || '';
                const btnStyle = btn.getAttribute('style') || '';
                const htmlBtn = btn as HTMLElement;
                const isVisible = htmlBtn.offsetWidth > 0 && htmlBtn.offsetHeight > 0;
                
                console.log(`Clickable element ${index}:`, {
                  tag: btn.tagName,
                  text: btnText,
                  class: btnClass,
                  style: btnStyle,
                  visible: isVisible
                });
                
                // Try clicking each one with delays
                setTimeout(() => {
                  console.log(`Attempting click on element ${index}...`);
                  
                  // Focus first
                  if ((htmlBtn as any).focus) (htmlBtn as any).focus();
                  
                  // Get position for realistic click
                  const btnRect = btn.getBoundingClientRect();
                  const btnCenterX = btnRect.left + btnRect.width / 2;
                  const btnCenterY = btnRect.top + btnRect.height / 2;
                  
                  // Realistic click sequence
                  const realClickEvents = [
                    new MouseEvent('mouseenter', { bubbles: true, clientX: btnCenterX, clientY: btnCenterY }),
                    new MouseEvent('mouseover', { bubbles: true, clientX: btnCenterX, clientY: btnCenterY }),
                    new MouseEvent('mousedown', { bubbles: true, clientX: btnCenterX, clientY: btnCenterY, button: 0 }),
                    new MouseEvent('mouseup', { bubbles: true, clientX: btnCenterX, clientY: btnCenterY, button: 0 }),
                    new MouseEvent('click', { bubbles: true, clientX: btnCenterX, clientY: btnCenterY, button: 0 })
                  ];
                  
                  realClickEvents.forEach((event, eventIndex) => {
                    setTimeout(() => {
                      btn.dispatchEvent(event);
                    }, eventIndex * 30);
                  });
                  
                  // Also try direct click
                  setTimeout(() => {
                    (btn as HTMLElement).click();
                    console.log(`Direct clicked element ${index}`);
                  }, 200);
                  
                }, index * 1000); // Space out clicks by 1 second each
              });
            }
          }, 2000);
          
          // Method 3: Try keyboard interaction
          setTimeout(() => {
            console.log('Method 3: Trying keyboard interaction...');
            
            (widget as HTMLElement).focus();
            
            const keyEvents = [
              new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }),
              new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true }),
              new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }),
              new KeyboardEvent('keyup', { key: ' ', code: 'Space', bubbles: true }),
              new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', bubbles: true }),
              new KeyboardEvent('keyup', { key: 'Tab', code: 'Tab', bubbles: true })
            ];
            
            keyEvents.forEach((event, index) => {
              setTimeout(() => {
                widget.dispatchEvent(event);
                console.log(`Dispatched ${event.type} (${event.key})`);
              }, index * 200);
            });
          }, 4000);
          
          // Method 4: Try touch events for mobile compatibility
          setTimeout(() => {
            console.log('Method 4: Trying touch interaction...');
            
            const touchEvents = [
              new TouchEvent('touchstart', {
                bubbles: true,
                cancelable: true,
                touches: [new Touch({
                  identifier: 1,
                  target: widget,
                  clientX: centerX,
                  clientY: centerY
                })]
              }),
              new TouchEvent('touchend', {
                bubbles: true,
                cancelable: true,
                changedTouches: [new Touch({
                  identifier: 1,
                  target: widget,
                  clientX: centerX,
                  clientY: centerY
                })]
              })
            ];
            
            touchEvents.forEach((event, index) => {
              setTimeout(() => {
                widget.dispatchEvent(event);
                console.log(`Dispatched ${event.type}`);
              }, index * 100);
            });
          }, 5000);
          
          setWidgetReady(true);
          
        }, 1000);
        
      } else {
        console.log('Widget not found, retrying...');
        setTimeout(triggerWidgetNaturally, 1000);
      }
    };
    
    console.log('Starting natural user interaction simulation...');
    setTimeout(triggerWidgetNaturally, 500);
    
  }, []);

  return (
    <div className={`min-h-screen flex items-center justify-center p-8 transition-all duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-white' 
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'
    }`}>
      <Helmet>
        <title>Start Your AI Call - Chayo AI</title>
        <meta name="description" content="Connect with our AI agent for instant business consultation" />
      </Helmet>
      
      <div className="text-center">
        <motion.h1 
          className="text-4xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-orange-400 to-cyan-400 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          AI Call Starting...
        </motion.h1>
        
        <motion.p
          className={`text-xl mb-12 transition-colors duration-300 ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          {widgetReady ? 'AI Agent Ready - Call should start automatically' : 'Initializing AI Agent...'}
        </motion.p>

        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <motion.a
            href="/"
            className={`transition-colors ${
              darkMode 
                ? 'text-cyan-400 hover:text-cyan-300' 
                : 'text-blue-600 hover:text-blue-500'
            }`}
            whileHover={{ scale: 1.05 }}
          >
            ← Back to Home
          </motion.a>
        </motion.div>
      </div>
    </div>
  );
}