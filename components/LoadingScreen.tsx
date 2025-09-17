'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Logo } from '@/components/Logo';
import { SITE_NAME } from '@/lib/constants';

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(100);
    }, 2000);

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 10;
        return newProgress > 100 ? 100 : newProgress;
      });
    }, 200);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--bg)]">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center"
      >
  <Logo size={120} />
        
        <motion.h1 
          className="mt-6 font-display text-4xl font-extrabold tracking-tight text-gray-900"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {SITE_NAME}
          <span className="text-neon-blue font-normal ml-2">Studio</span>
        </motion.h1>
        
        <motion.div 
          className="mt-8 w-64 h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <motion.div 
            className="h-full bg-gradient-to-r from-neon-blue via-neon-purple to-neon-green rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </motion.div>
        
        <motion.p 
          className="mt-4 text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Initializing futuristic interface...
        </motion.p>
      </motion.div>
    </div>
  );
}
