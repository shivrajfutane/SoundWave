'use client'

import { motion } from 'framer-motion'
import React from 'react'

interface StaggerListProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

const container = {
  hidden: { opacity: 0 },
  show: (delay: number) => ({
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: delay,
    }
  })
}

const item: any = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
}

export default function StaggerList({ children, className = '', delay = 0 }: StaggerListProps) {
  return (
    <motion.div 
      className={className}
      variants={container}
      initial="hidden"
      animate="show"
      custom={delay}
    >
      {React.Children.map(children, (child) => (
        <motion.div variants={item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
