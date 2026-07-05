import { motion } from 'framer-motion';

export default function BrandHeader({ compact = false }) {
  return (
    <div>
      <motion.h1
        className="brand-title"
        style={compact ? { fontSize: '1.4rem' } : undefined}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{
          opacity: 1,
          scale: 1,
          textShadow: [
            '0 0 0px rgba(239,68,68,0)',
            '0 0 24px rgba(239,68,68,0.85)',
            '0 0 0px rgba(239,68,68,0)',
          ],
        }}
        transition={{
          opacity: { duration: 0.8, ease: 'easeOut' },
          scale: { duration: 0.8, ease: 'easeOut' },
          textShadow: {
            duration: 2.6,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatType: 'loop',
            delay: 0.4,
          },
        }}
      >
        LA&apos;VIEN
      </motion.h1>
      <div className="brand-subtitle">CAFE &amp; RESTAURANT</div>
    </div>
  );
}
