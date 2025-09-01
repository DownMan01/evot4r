import { useState, useEffect } from 'react';

const descriptions = [
  "Secure, accessible, and reliable digital voting for student organizations and campus elections.",
  "Empowering student voices through transparent and trustworthy electoral processes.",
  "Modern voting solutions designed specifically for academic institutions and student governance.",
  "Streamlined election management with real-time results and comprehensive audit trails.",
  "Building trust in campus democracy through cutting-edge security and verification systems.",
  "Innovative platform connecting students with their representatives and electoral opportunities.",
  "Ensuring fair and inclusive elections that reflect the true voice of the student body.",
  "Advanced digital infrastructure supporting democratic participation in educational communities.",
  "Transforming student elections with user-friendly technology and robust security measures.",
  "Facilitating transparent governance and meaningful student engagement in campus decision-making."
];

const TypingDescription = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    const currentDescription = descriptions[currentIndex];
    
    if (isTyping) {
      if (charIndex < currentDescription.length) {
        const timer = setTimeout(() => {
          setDisplayedText(currentDescription.substring(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        }, 50);
        return () => clearTimeout(timer);
      } else {
        // Finished typing, wait before starting to delete
        const timer = setTimeout(() => {
          setIsTyping(false);
        }, 2000);
        return () => clearTimeout(timer);
      }
    } else {
      if (charIndex > 0) {
        const timer = setTimeout(() => {
          setDisplayedText(currentDescription.substring(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        }, 30);
        return () => clearTimeout(timer);
      } else {
        // Finished deleting, move to next description
        setCurrentIndex((prevIndex) => (prevIndex + 1) % descriptions.length);
        setIsTyping(true);
      }
    }
  }, [currentIndex, charIndex, isTyping]);

  return (
    <p className="text-xl lg:text-xl font-inter text-white/90 leading-relaxed font-normal lg:min-h-[3.5rem] text-center lg:text-left">
      {displayedText}
      <span className="animate-pulse">|</span>
    </p>
  );
};

export default TypingDescription;