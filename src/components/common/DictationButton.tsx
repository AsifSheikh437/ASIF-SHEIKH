import React, { useState, useEffect, useRef } from 'react';
import { Mic } from 'lucide-react';

interface DictationButtonProps {
  onResult: (text: string) => void;
  className?: string;
  lang?: string;
}

export const DictationButton: React.FC<DictationButtonProps> = ({ onResult, className = '', lang = 'bn-BD' }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
        return;
      }
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = lang;

      recog.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
        setIsListening(false);
      };

      recog.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recog.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recog;
    }
  }, [lang, onResult]);

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Dictation start error', err);
        setIsListening(false);
      }
    }
  };

  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`flex items-center justify-center rounded-full transition-all flex-shrink-0 ${isListening ? 'bg-rose-100 text-rose-600 animate-pulse ring-2 ring-rose-500 ring-offset-1' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-indigo-600'} ${className}`}
      title={isListening ? 'শোনা হচ্ছে... (Listening...)' : 'ভয়েস টাইপিং শুরু করুন (Start dictation)'}
    >
      <Mic className="w-4 h-4" />
    </button>
  );
};
