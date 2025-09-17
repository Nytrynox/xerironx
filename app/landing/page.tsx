'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Logo } from '@/components/Logo'
import { SITE_NAME } from '@/lib/constants'
import BackgroundEffect from '@/components/BackgroundEffect'
import LoadingScreen from '@/components/LoadingScreen'

export default function LandingPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);
    
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[var(--bg)]">
      <BackgroundEffect />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full bg-white rounded-2xl p-8 text-center border border-gray-200/60 shadow-xl"
      >
        <div className="mb-6">
          <Logo size={128} />
        </div>
        
        <motion.h1 
          className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 mb-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          {SITE_NAME}
          <span className="text-neon-blue font-normal ml-2">Studio</span>
        </motion.h1>
        
        <motion.p 
          className="text-lg text-gray-600 mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          A futuristic AI studio for text, image, code, and website generation
        </motion.p>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Link href="/studio" className="inline-block">
            <motion.button 
              className="px-8 py-4 bg-gray-900 text-white rounded-full font-medium text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              Launch Studio
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>
      
      <motion.div 
        className="mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl w-full"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
    {[
          { title: "Text Generation", icon: "💬", color: "neon-purple" },
          { title: "Image Creation", icon: "🎨", color: "neon-green" },
          { title: "Code Assistance", icon: "💻", color: "neon-blue" },
          { title: "Website Building", icon: "🌐", color: "neon-pink" },
        ].map((feature, i) => (
          <motion.div
            key={feature.title}
      className={`bg-white rounded-xl p-6 border border-gray-200/60 shadow-lg`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="text-3xl mb-3">{feature.icon}</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{feature.title}</h3>
      <p className="text-gray-600 text-sm">Experience the power of AI-assisted creativity.</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
