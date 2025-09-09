import { useEffect, useRef, useCallback } from 'react';

const MatrixRain = ({ fps = 25, density = 0.8, opacity = 0.7 }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const lastTimeRef = useRef(0);
  const dropsRef = useRef([]);
  const columnsRef = useRef(0);

  // Matrix characters including Japanese katakana and numbers
  const chars = "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const charArray = chars.split('');

  // Optimized drawing function
  const draw = useCallback((canvas, ctx, fontSize) => {
    // Create trailing effect with semi-transparent black overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set text properties with brighter green
    ctx.fillStyle = '#00ff41';
    ctx.font = `${fontSize}px "Courier New", monospace`;

    // Process all columns for visibility
    for (let i = 0; i < dropsRef.current.length; i++) {
      // Random character selection
      const char = charArray[Math.floor(Math.random() * charArray.length)];
      
      // Draw character at current drop position
      ctx.fillText(char, i * fontSize, dropsRef.current[i] * fontSize);

      // Reset drop when it reaches bottom
      if (dropsRef.current[i] * fontSize > canvas.height && Math.random() > 0.975) {
        dropsRef.current[i] = 0;
      }
      
      // Move drop down
      dropsRef.current[i]++;
    }
  }, [charArray]);

  // Canvas resize handler
  const resizeCanvas = useCallback((canvas, ctx) => {
    const rect = canvas.getBoundingClientRect();
    
    // Set canvas size to match container
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Recalculate columns
    const fontSize = 14;
    const newColumns = Math.floor(rect.width / fontSize);
    
    if (newColumns !== columnsRef.current) {
      columnsRef.current = newColumns;
      // Initialize drops with random starting positions
      dropsRef.current = Array(newColumns).fill().map(() => 
        Math.floor(Math.random() * rect.height / fontSize)
      );
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Initial setup
    resizeCanvas(canvas, ctx);
    
    // Handle window resize
    const handleResize = () => resizeCanvas(canvas, ctx);
    window.addEventListener('resize', handleResize);

    const fontSize = 14;
    const frameInterval = 1000 / fps;

    // Animation loop
    const animate = (currentTime) => {
      if (currentTime - lastTimeRef.current >= frameInterval) {
        draw(canvas, ctx, fontSize);
        lastTimeRef.current = currentTime;
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [fps, draw, resizeCanvas]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 1,
        opacity: opacity,
        width: '100%',
        height: '100%',
        background: 'transparent'
      }}
    />
  );
};

export default MatrixRain;