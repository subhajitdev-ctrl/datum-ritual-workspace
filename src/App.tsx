/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useMemo, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CircleDot, BarChart2, Settings, Check, Sparkles, X, RotateCcw, Volume2, VolumeX, Smartphone, ChevronLeft, ChevronRight, Bell, Clock, CalendarDays, TrendingUp, Star, Heart } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer as RC } from 'recharts';

const RITUAL_DURATION = 3000; // 3 seconds

type View = 'ritual' | 'analytics' | 'settings';
type HapticLevel = 'Soft' | 'Medium' | 'Deep';

const HAPTIC_MAP: Record<HapticLevel, number> = {
  'Soft': 30,
  'Medium': 60,
  'Deep': 120
};

const MOTIVATIONAL_QUOTES = [
  "Breathe in experience, breathe out poetry.",
  "Quiet the mind and the soul will speak.",
  "Realize deeply that the present moment is all you have.",
  "Be here now. Align your thoughts, ground your presence.",
  "In the stillness of mind, clarity emerges.",
  "With every breath, let go of what was.",
  "Your concentration is a shield, your presence is an anchor.",
  "Within you, there is a stillness and a sanctuary.",
  "Anchor your attention in the purity of the present.",
  "Every small pause is a return to what truly matters."
];

export default function App() {
  // Navigation
  const [view, setView] = useState<View>('ritual');

  // Persistence state
  const [logs, setLogs] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [total, setTotal] = useState(0);
  const [lastDate, setLastDate] = useState("");
  
  // Settings state
  const [hapticLevel, setHapticLevel] = useState<HapticLevel>('Medium');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isReminderEnabled, setIsReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("08:00");

  // Interactive state
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [isSuccess, setIsSuccess] = useState(false);

  // Premium ad-free subscription state
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    return localStorage.getItem('datum_is_premium') === 'true';
  });
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumSuccess, setPremiumSuccess] = useState(false);
  const [isPayingPremium, setIsPayingPremium] = useState(false);

  // Feedback & Star ratings state
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackDismissed, setFeedbackDismissed] = useState(() => {
    return localStorage.getItem('datum_feedback_completed') === 'true';
  });

  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  useEffect(() => {
    if (isSuccess) return;
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isSuccess]);

  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const today = new Date().toDateString();
  const isLocked = lastDate === today;

  // Load data on mount
  useEffect(() => {
    const savedStats = localStorage.getItem('datum_stats');
    const savedConfig = localStorage.getItem('datum_config');

    if (savedStats) {
      const { streak: s, total: t, lastDate: ld, logs: lg = [], maxStreak: ms = 0 } = JSON.parse(savedStats);
      setStreak(s);
      setTotal(t);
      setLastDate(ld);
      setLogs(lg);
      setMaxStreak(ms);
      if (ld === today) {
        setIsSuccess(true);
      }
    }

    if (savedConfig) {
      const { hapticLevel: hl, isAudioEnabled: iae, isReminderEnabled: ire, reminderTime: rt } = JSON.parse(savedConfig);
      if (hl) setHapticLevel(hl);
      if (iae !== undefined) setIsAudioEnabled(iae);
      if (ire !== undefined) setIsReminderEnabled(ire);
      if (rt) setReminderTime(rt);
    }
  }, [today]);

  // Handle ritual completion
  const completeRitual = () => {
    if (isLocked) return;

    // Haptics
    if (navigator.vibrate) {
      navigator.vibrate(HAPTIC_MAP[hapticLevel]);
    }

    // Audio
    if (isAudioEnabled) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    }

    const newLogs = [...logs, today];
    const newStreak = streak + 1;
    const newTotal = total + 1;
    const newMaxStreak = Math.max(maxStreak, newStreak);

    setStreak(newStreak);
    setTotal(newTotal);
    setLastDate(today);
    setLogs(newLogs);
    setMaxStreak(newMaxStreak);
    setIsSuccess(true);

    // Persist
    localStorage.setItem('datum_stats', JSON.stringify({
      streak: newStreak,
      total: newTotal,
      lastDate: today,
      logs: newLogs,
      maxStreak: newMaxStreak
    }));

    // Cleanup
    setIsHolding(false);
    setProgress(0);
  };

  // Start hold sequence
  const startHold = () => {
    if (isLocked || isSuccess) return;
    
    setIsHolding(true);
    startTimeRef.current = Date.now();
    
    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const currentProgress = Math.min((elapsed / RITUAL_DURATION) * 100, 100);
      setProgress(currentProgress);

      if (elapsed >= RITUAL_DURATION) {
        completeRitual();
      } else {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  // Cancel hold sequence
  const cancelHold = () => {
    if (isSuccess) return;
    
    setIsHolding(false);
    setProgress(0);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const resetStorage = () => {
    localStorage.removeItem('datum_stats');
    localStorage.removeItem('datum_feedback_completed');
    localStorage.removeItem('datum_user_feedback');
    localStorage.removeItem('datum_is_premium');
    
    // Clear and reset state in memory immediately
    setStreak(0);
    setMaxStreak(0);
    setTotal(0);
    setLastDate("");
    setLogs([]);
    setIsSuccess(false);
    setProgress(0);
    setIsHolding(false);
    setRating(null);
    setHoveredRating(null);
    setFeedbackText('');
    setFeedbackSubmitted(false);
    setFeedbackDismissed(false);
    setIsPremium(false);
    setPremiumSuccess(false);
    setShowPremiumModal(false);
  };

  const updateConfig = (hl: HapticLevel, iae: boolean, ire: boolean, rt: string) => {
    setHapticLevel(hl);
    setIsAudioEnabled(iae);
    setIsReminderEnabled(ire);
    setReminderTime(rt);
    localStorage.setItem('datum_config', JSON.stringify({ 
      hapticLevel: hl, 
      isAudioEnabled: iae,
      isReminderEnabled: ire,
      reminderTime: rt
    }));
  };

  // Notification Logic
  useEffect(() => {
    if (!isReminderEnabled) return;

    const checkReminder = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const lastReminderDate = localStorage.getItem('datum_last_reminder');
      const today = now.toDateString();

      if (currentTime === reminderTime && lastReminderDate !== today) {
        // Trigger notification
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("DATUM", {
            body: "It's time for your daily ritual. find your center.",
            icon: '/favicon.ico'
          });
          localStorage.setItem('datum_last_reminder', today);
        } else if (isAudioEnabled) {
          // Fallback calming chime if app is open
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
          audio.volume = 0.2;
          audio.play().catch(() => {});
          localStorage.setItem('datum_last_reminder', today);
        }
      }
    };

    const interval = setInterval(checkReminder, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [isReminderEnabled, reminderTime, isAudioEnabled]);

  const circumference = 2 * Math.PI * 48;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  return (
    <div className="relative h-screen w-full flex flex-col items-center justify-start overflow-hidden plaster-texture selection:bg-tertiary/20">
      {/* View Layering */}
      <AnimatePresence mode="wait">
        {view === 'ritual' && (
          <motion.div
            key="ritual"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative h-full w-full flex flex-col items-center pt-24 overflow-y-auto pb-32"
          >
            {/* Header */}
            <header className="fixed top-0 left-0 w-full z-50 flex flex-col items-center justify-center py-8 px-6">
              <h1 className="font-display text-4xl tracking-[0.3em] text-primary uppercase mb-1">
                DATUM
              </h1>
              <p className="font-body text-[10px] text-primary/60 tracking-[0.2em] font-semibold uppercase">
                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </header>

            {/* Main Workspace */}
            <main className="flex-1 w-full max-w-xl px-6 flex flex-col items-center justify-start mt-12 pb-32">
              <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
                <div className="absolute -inset-10 md:-inset-16 pointer-events-none">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <defs>
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="1.5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>
                    
                    {/* Breathing Guide Ring */}
                    {!isHolding && !isSuccess && (
                      <motion.circle
                        cx="50"
                        cy="50"
                        fill="none"
                        r="48"
                        stroke="#5F5E59"
                        strokeWidth="0.1"
                        initial={{ r: 44, opacity: 0.1 }}
                        animate={{ r: 48, opacity: [0.1, 0.3, 0.1] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                      />
                    )}

                    {/* Progress Ring Glow */}
                    <AnimatePresence>
                      {isHolding && !isSuccess && (
                        <motion.circle
                          cx="50"
                          cy="50"
                          fill="none"
                          r="48"
                          stroke="#5F5E59"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          initial={{ strokeDashoffset: circumference, opacity: 0 }}
                          animate={{ 
                            strokeDashoffset, 
                            opacity: [0.1, 0.2, 0.1],
                            strokeWidth: [1.5, 2.5, 1.5]
                          }}
                          exit={{ opacity: 0 }}
                          transition={{ 
                            strokeDashoffset: { duration: 0.1 },
                            opacity: { repeat: Infinity, duration: 2 },
                            strokeWidth: { repeat: Infinity, duration: 2 }
                          }}
                          filter="url(#glow)"
                          className="pointer-events-none"
                        />
                      )}
                    </AnimatePresence>

                    {!isSuccess && (
                      <motion.circle
                        cx="50"
                        cy="50"
                        fill="none"
                        r="48"
                        stroke="#30302E"
                        strokeWidth="0.75"
                        strokeLinecap="round"
                        style={{
                          strokeDasharray: circumference,
                          strokeDashoffset: strokeDashoffset,
                        }}
                        animate={isHolding ? { scale: [1, 1.01, 1], strokeWidth: 1 } : { scale: 1, strokeWidth: 0.75 }}
                        transition={{ 
                          duration: 0.2, 
                          ease: "linear",
                          scale: { repeat: Infinity, duration: 0.8 },
                          strokeWidth: { duration: 0.3 }
                        }}
                      />
                    )}
                  </svg>
                </div>

                <AnimatePresence>
                  {!isSuccess && !isHolding && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap flex flex-col items-center"
                    >
                      <motion.span 
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ repeat: Infinity, duration: 4 }}
                        className="font-body text-[8px] font-bold tracking-[0.4em] uppercase text-primary/40 mb-1"
                      >
                        Inhale • Exhale
                      </motion.span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {isHolding && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.05, 1] }}
                      exit={{ opacity: 0, scale: 1.2 }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 rounded-full bg-primary/5 blur-xl pointer-events-none"
                    />
                  )}
                </AnimatePresence>

                {/* Ambient Breathing Ripples & Outward Circular Stroke Release */}
                {!isHolding && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    {/* Ripple stroke 1 */}
                    <motion.div
                      className="absolute rounded-full border border-primary/20 pointer-events-none"
                      style={{ width: '100%', height: '100%' }}
                      animate={{
                        scale: [1, 1.4],
                        opacity: [0.25, 0],
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: [0.25, 0.1, 0.25, 1],
                        delay: 0,
                      }}
                    />
                    {/* Ripple stroke 2 */}
                    <motion.div
                      className="absolute rounded-full border border-primary/10 pointer-events-none"
                      style={{ width: '100%', height: '100%' }}
                      animate={{
                        scale: [1, 1.4],
                        opacity: [0.2, 0],
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: [0.25, 0.1, 0.25, 1],
                        delay: 2.5,
                      }}
                    />
                    {/* Soft ambient breathing lung glow */}
                    <motion.div
                      className="absolute rounded-full pointer-events-none blur-lg bg-primary/10"
                      style={{ width: '100%', height: '100%' }}
                      animate={{
                        scale: [0.96, 1.05, 0.96],
                        opacity: [0.3, 0.7, 0.3]
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  </div>
                )}

                <motion.button
                  id="ritual-button"
                  className={`group relative z-10 w-full h-full rounded-full bg-gradient-to-br from-white to-[#F8F7F4] shadow-[0_20px_50px_rgba(0,0,0,0.1),0_10px_20px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center border border-white/80 overflow-hidden active:scale-[0.98] transition-all duration-700
                    ${isLocked ? 'cursor-default' : 'cursor-pointer'}
                    ${isHolding ? 'ring-4 ring-primary/5 shadow-inner' : ''}`}
                  onMouseDown={startHold}
                  onMouseUp={cancelHold}
                  onMouseLeave={cancelHold}
                  onTouchStart={startHold}
                  onTouchEnd={cancelHold}
                  disabled={isLocked && isSuccess}
                  animate={!isHolding ? {
                    scale: [1, 1.03, 1],
                  } : {
                    scale: 0.98,
                  }}
                  transition={{
                    scale: !isHolding ? {
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    } : {
                      duration: 0.3,
                      ease: "easeOut"
                    }
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/[0.01] to-white/[0.05] pointer-events-none" />
                  
                  {/* Atmospheric Particles during Hold */}
                  <AnimatePresence>
                    {isHolding && (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 overflow-hidden pointer-events-none"
                      >
                        {[...Array(8)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-primary/10 rounded-full"
                            initial={{ 
                              x: Math.random() * 200 - 100 + 150, 
                              y: 250, 
                              opacity: 0 
                            }}
                            animate={{ 
                              y: -50, 
                              opacity: [0, 0.4, 0],
                              x: (Math.random() * 200 - 100 + 150) + (Math.sin(i) * 30)
                            }}
                            transition={{ 
                              duration: 3 + Math.random() * 2, 
                              repeat: Infinity, 
                              delay: i * 0.4,
                              ease: "linear"
                            }}
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence mode="wait">
                    {!isSuccess ? (
                      <motion.div
                        key="initial"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="flex flex-col items-center relative z-10"
                      >
                        <motion.div
                          animate={isHolding ? { 
                            scale: [1, 1.08, 1],
                            rotate: [0, 3, -3, 0],
                            filter: ['blur(0px)', 'blur(1px)', 'blur(0px)']
                          } : {}}
                          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        >
                          <CircleDot className={`w-14 h-14 mb-5 transition-all duration-700 ${isHolding ? 'text-primary' : 'text-primary/60'}`} />
                        </motion.div>
                        <span className="block font-body text-[9px] text-primary/40 font-bold tracking-[0.3em] uppercase mb-1 px-4 text-center">
                          {isHolding ? 'Aligning Presence' : 'Initialize'}
                        </span>
                        <h2 className="font-display text-3xl text-primary tracking-tight uppercase font-medium">
                          {isHolding ? 'Hold' : 'Ritual'}
                        </h2>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="success"
                        initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        className="flex flex-col items-center relative z-10"
                      >
                        <div className="relative mb-3">
                          <Check className="w-20 h-20 text-tertiary" />
                          <motion.div 
                            initial={{ scale: 0.2, opacity: 1 }}
                            animate={{ scale: 2.2, opacity: 0 }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            className="absolute inset-0 border-2 border-tertiary/40 rounded-full"
                          />
                        </div>
                        <span className="font-display text-2xl text-tertiary tracking-widest uppercase font-medium">Success!</span>
                        <span className="font-body text-[11px] text-primary/45 tracking-wider mt-1 select-none font-medium">See you again</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="absolute inset-4 rounded-full border border-primary/5 pointer-events-none" />
                </motion.button>
              </div>

              <div className="relative z-20 mt-12 text-center flex flex-col items-center gap-4 min-h-[72px]">
                  <AnimatePresence mode="wait">
                    {!isSuccess && (
                      <motion.div
                        key={isHolding ? 'holding' : 'idle'}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2 font-body text-[10px] tracking-[0.1em] text-primary/50 uppercase font-semibold select-none"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                        <span>{isHolding ? 'Maintaining focus...' : 'Hold Ritual Button to Begin'}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`quote-${currentQuoteIndex}`}
                      initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                      transition={{ duration: 1, ease: "easeInOut" }}
                      className="max-w-xs px-6"
                    >
                      <p className="font-body text-xs md:text-[13px] text-primary/45 font-medium leading-relaxed italic select-none">
                        "{MOTIVATIONAL_QUOTES[currentQuoteIndex]}"
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

              {/* Preparation Steps */}
              <AnimatePresence>
                {!isSuccess && !isHolding && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="w-full mt-12 grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    {[
                      { icon: Smartphone, label: 'Digital', sub: 'Silence inputs' },
                      { icon: Sparkles, label: 'Space', sub: 'Clear periphery' },
                      { icon: CircleDot, label: 'Mind', sub: 'Anchor breath' }
                    ].map((step, i) => (
                      <motion.div 
                        key={step.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + (i * 0.1) }}
                        className="bg-white/40 border border-outline/10 rounded-2xl p-4 flex flex-col items-center text-center group hover:bg-white/60 transition-colors"
                      >
                        <step.icon className="w-4 h-4 text-primary/40 mb-2 group-hover:text-primary transition-colors" />
                        <span className="font-body text-[10px] font-bold text-primary tracking-widest uppercase mb-0.5">{step.label}</span>
                        <span className="font-body text-[8px] text-primary/40 font-medium">{step.sub}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Star Rating & Asking Feedback Card */}
              <AnimatePresence>
                {isSuccess && !feedbackDismissed && (
                  <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ delay: 0.6, type: "spring", stiffness: 100, damping: 20 }}
                    className="w-full mt-8 bg-gradient-to-br from-[#FAFAF9]/95 to-[#F5F5F4]/95 border border-outline/15 p-6 rounded-[2rem] flex flex-col items-center text-center shadow-[0_12px_45px_rgba(0,0,0,0.02)] select-none relative overflow-hidden"
                  >
                    {!feedbackSubmitted ? (
                      <>
                        <div className="absolute top-4 right-4">
                          <button
                            onClick={() => {
                              setFeedbackDismissed(true);
                              localStorage.setItem('datum_feedback_completed', 'true');
                            }}
                            className="p-1.5 rounded-full text-primary/30 hover:text-primary/60 hover:bg-primary/5 transition-all duration-300"
                            title="Dismiss"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <span className="font-body text-[10px] text-tertiary font-bold tracking-[0.2em] uppercase mb-1">
                          Share the Stillness
                        </span>
                        <h3 className="font-display text-lg text-primary font-medium tracking-tight mb-4">
                          How was your practice today?
                        </h3>

                        {/* Star buttons */}
                        <div className="flex gap-2 mb-5">
                          {[1, 2, 3, 4, 5].map((starValue) => {
                            const isGlowing = (hoveredRating ?? rating ?? 0) >= starValue;
                            return (
                              <button
                                key={starValue}
                                onMouseEnter={() => setHoveredRating(starValue)}
                                onMouseLeave={() => setHoveredRating(null)}
                                onClick={() => setRating(starValue)}
                                className="p-1 transition-all duration-300 transform active:scale-95"
                              >
                                <Star
                                  className={`w-8 h-8 stroke-[1.5] transition-all duration-300 ${
                                    isGlowing
                                      ? 'fill-tertiary/15 text-tertiary scale-110 drop-shadow-[0_0_8px_rgba(180,160,111,0.25)]'
                                      : 'text-primary/25 hover:text-primary/45'
                                  }`}
                                />
                              </button>
                            );
                          })}
                        </div>

                        {/* Interactive dynamic body */}
                        <AnimatePresence mode="wait">
                          {rating !== null && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="w-full flex flex-col items-center overflow-hidden"
                            >
                              {rating === 5 ? (
                                <div className="flex flex-col items-center w-full px-2 mt-2 gap-3">
                                  <p className="font-body text-xs text-primary/50 leading-relaxed max-w-sm">
                                    We are deeply grateful for your support! Would you consider rating us 5 stars on the Google Play Store?
                                  </p>
                                  <div className="flex flex-col gap-2 mt-2 w-full max-w-xs">
                                    <a
                                      href="https://play.google.com/store/apps/details?id=com.studioocto.datum"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={() => {
                                        setFeedbackSubmitted(true);
                                        localStorage.setItem('datum_feedback_completed', 'true');
                                      }}
                                      className="py-2.5 px-4 bg-[#30302E] hover:bg-black text-white rounded-full font-body text-xs font-semibold tracking-wider transition-all duration-300 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                      <span>Rate on Play Store</span>
                                    </a>
                                    <button
                                      onClick={() => {
                                        setFeedbackSubmitted(true);
                                        localStorage.setItem('datum_feedback_completed', 'true');
                                      }}
                                      className="py-2.5 px-4 bg-transparent border border-outline/10 text-primary rounded-full font-body text-xs font-semibold tracking-wider hover:bg-primary/5 transition-all duration-300"
                                    >
                                      I rated it
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center w-full mt-2 px-2">
                                  <p className="font-body text-xs text-primary/50 leading-relaxed mb-3 max-w-sm">
                                    How can we evolve the experience to earn 5 stars from you? We value your perspective.
                                  </p>
                                  <textarea
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                    placeholder="Tell us what we can improve..."
                                    className="w-full min-h-[80px] p-3 text-xs font-body border border-outline/15 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-tertiary transition-all placeholder:text-primary/30"
                                  />
                                  <button
                                    onClick={() => {
                                      const localFeedback = JSON.parse(localStorage.getItem('datum_user_feedback') || '[]');
                                      localFeedback.push({
                                        rating,
                                        comment: feedbackText,
                                        timestamp: new Date().toISOString()
                                      });
                                      localStorage.setItem('datum_user_feedback', JSON.stringify(localFeedback));
                                      localStorage.setItem('datum_feedback_completed', 'true');
                                      setFeedbackSubmitted(true);
                                    }}
                                    className="mt-3 w-full max-w-xs py-2.5 bg-[#30302E] hover:bg-black text-white rounded-full font-body text-xs font-semibold tracking-wider transition-all duration-300 shadow-sm cursor-pointer"
                                  >
                                    Submit Feedback
                                  </button>
                                </div>
                              )}
                              <button
                                onClick={() => {
                                  setFeedbackDismissed(true);
                                  localStorage.setItem('datum_feedback_completed', 'true');
                                }}
                                className="mt-4 font-body text-[9px] text-primary/35 hover:text-primary/60 tracking-[0.2em] uppercase transition-all duration-300"
                              >
                                Maybe Later
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center py-4 px-2"
                      >
                        <div className="w-12 h-12 rounded-full bg-tertiary/10 flex items-center justify-center mb-3">
                          <Check className="w-5 h-5 text-tertiary" />
                        </div>
                        <h4 className="font-display text-base text-primary font-semibold tracking-tight mb-1">
                          Thank you!
                        </h4>
                        <p className="font-body text-xs text-primary/45 max-w-xs leading-relaxed">
                          Your thoughts and dedication help us design a more peaceful experience.
                        </p>
                        <button
                          onClick={() => setFeedbackDismissed(true)}
                          className="mt-5 py-1.5 px-6 border border-outline/15 text-primary/60 hover:text-primary hover:bg-primary/5 rounded-full font-body text-[9px] font-bold tracking-[0.1em] uppercase transition-all duration-300"
                        >
                          Dismiss
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="w-full mt-12 md:mt-16 flex flex-col gap-8">
                <div className="flex items-center justify-between border-t border-outline/20 pt-8 px-2">
                  <StatItem label="Streak" val={streak} unit="Days" />
                  <div className="h-10 w-[0.5px] bg-outline/20" />
                  <StatItem label="Total" val={total} />
                  <div className="h-10 w-[0.5px] bg-outline/20" />
                  <div className="flex flex-col items-end">
                    <span className="font-body text-[10px] text-primary/40 font-bold uppercase tracking-widest mb-1">Status</span>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full transition-colors duration-500 ${isSuccess ? 'bg-tertiary' : 'bg-primary/20'}`} />
                      <span className={`font-display text-xl transition-colors duration-500 ${isSuccess ? 'text-tertiary' : 'text-primary/40'}`}>
                        {isSuccess ? 'Ritual Anchored' : 'Awaiting Ritual'}
                      </span>
                    </div>
                  </div>
                </div>

                {!isPremium ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="w-full mt-4"
                  >
                    <AdSenseBanner onUpgradeClick={() => setShowPremiumModal(true)} />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full mt-4 bg-amber-500/5 border border-amber-500/10 p-5 rounded-[2rem] text-center"
                  >
                    <span className="font-body text-[9px] text-[#A67C52] font-black tracking-[0.2em] uppercase block mb-1">
                      👑 PREMIUM AD-FREE LIBERATION ACTIVE
                    </span>
                    <p className="font-body text-[10px] text-[#A67C52]/70 leading-relaxed">
                      Pristine quiet workspace established. Ad servers turned off for pristine focus.
                    </p>
                  </motion.div>
                )}

                <div className="flex justify-center w-full px-4 pt-4 mb-12">
                  <span className="font-body text-[9px] text-primary/20 tracking-[0.4em] font-bold uppercase">BY STUDIO OCTO</span>
                </div>
              </div>
            </main>
          </motion.div>
        )}

        {view === 'analytics' && <AnalyticsView onBack={() => setView('ritual')} logs={logs} streak={streak} maxStreak={maxStreak} total={total} />}
        {view === 'settings' && (
          <SettingsView 
            onBack={() => setView('ritual')} 
            hapticLevel={hapticLevel} 
            setHapticLevel={level => updateConfig(level, isAudioEnabled, isReminderEnabled, reminderTime)} 
            isAudioEnabled={isAudioEnabled} 
            setIsAudioEnabled={enabled => updateConfig(hapticLevel, enabled, isReminderEnabled, reminderTime)} 
            isReminderEnabled={isReminderEnabled}
            setIsReminderEnabled={enabled => updateConfig(hapticLevel, isAudioEnabled, enabled, reminderTime)}
            reminderTime={reminderTime}
            setReminderTime={time => updateConfig(hapticLevel, isAudioEnabled, isReminderEnabled, time)}
            onReset={resetStorage} 
            logs={logs}
            isPremium={isPremium}
            onUpgradeClick={() => setShowPremiumModal(true)}
          />
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-6 pb-10 pt-6 bg-white/80 backdrop-blur-md rounded-t-[2.5rem] shadow-[0_-4px_20px_rgba(0,0,0,0.03)] border-t border-outline/10">
        <div className="relative flex flex-col items-center">
          <AnimatePresence>
            {hoveredNav === 'ritual' && (
              <motion.div 
                key="tooltip-ritual"
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="absolute bottom-full mb-4 px-3 py-1 bg-primary text-white text-[8px] uppercase tracking-widest rounded-full whitespace-nowrap pointer-events-none z-50"
              >
                Perform Daily Ritual
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setView('ritual')}
            onMouseEnter={() => setHoveredNav('ritual')}
            onMouseLeave={() => setHoveredNav(null)}
            className={`flex flex-col items-center justify-center group transition-colors ${view === 'ritual' ? 'text-primary' : 'text-primary/40'}`}
          >
            <div className={`p-2 mb-1 group-active:scale-95 transition-transform ${view === 'ritual' ? 'bg-primary/5 rounded-full' : ''}`}>
              <CircleDot className={`w-5 h-5 ${view === 'ritual' ? 'fill-primary' : ''}`} />
            </div>
            <span className="font-body text-[8px] font-bold tracking-widest uppercase">Ritual</span>
          </button>
        </div>
        
        <div className="relative flex flex-col items-center">
          <AnimatePresence>
            {hoveredNav === 'analytics' && (
              <motion.div 
                key="tooltip-analytics"
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="absolute bottom-full mb-4 px-3 py-1 bg-primary text-white text-[8px] uppercase tracking-widest rounded-full whitespace-nowrap pointer-events-none z-50"
              >
                View Progress & Metrics
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setView('analytics')}
            onMouseEnter={() => setHoveredNav('analytics')}
            onMouseLeave={() => setHoveredNav(null)}
            className={`flex flex-col items-center justify-center group transition-colors ${view === 'analytics' ? 'text-primary' : 'text-primary/40'}`}
          >
            <div className={`p-2 mb-1 group-active:scale-95 transition-transform ${view === 'analytics' ? 'bg-primary/5 rounded-full' : ''}`}>
              <BarChart2 className="w-5 h-5" />
            </div>
            <span className="font-body text-[8px] font-bold tracking-widest uppercase">Analytics</span>
          </button>
        </div>

        <div className="relative flex flex-col items-center">
          <AnimatePresence>
            {hoveredNav === 'settings' && (
              <motion.div 
                key="tooltip-settings"
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="absolute bottom-full mb-4 px-3 py-1 bg-primary text-white text-[8px] uppercase tracking-widest rounded-full whitespace-nowrap pointer-events-none z-50"
              >
                Personalize Experience
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setView('settings')}
            onMouseEnter={() => setHoveredNav('settings')}
            onMouseLeave={() => setHoveredNav(null)}
            className={`flex flex-col items-center justify-center group transition-colors ${view === 'settings' ? 'text-primary' : 'text-primary/40'}`}
          >
            <div className={`p-2 mb-1 group-active:scale-95 transition-transform ${view === 'settings' ? 'bg-primary/5 rounded-full' : ''}`}>
              <Settings className="w-5 h-5" />
            </div>
            <span className="font-body text-[8px] font-bold tracking-widest uppercase">Settings</span>
          </button>
        </div>
      </nav>

      {/* Premium upgrade checkout dialog */}
      <AnimatePresence>
        {showPremiumModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-[#FAFAF9] p-8 rounded-[2.5rem] border border-outline/10 max-w-md w-full shadow-2xl relative flex flex-col items-center select-none"
            >
              <button
                onClick={() => {
                  setShowPremiumModal(false);
                  setPremiumSuccess(false);
                  setIsPayingPremium(false);
                }}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-primary/5 text-primary/30 hover:text-primary/60 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {!premiumSuccess ? (
                <div className="flex flex-col items-center w-full">
                  <div className="w-16 h-16 rounded-full bg-[#A67C52]/10 flex items-center justify-center mb-4">
                    <Sparkles className="w-7 h-7 text-[#A67C52] fill-[#A67C52]/10 animate-pulse" />
                  </div>

                  <h3 className="font-display text-2xl text-primary font-medium tracking-tight mb-2">
                    Purify Your Workspace
                  </h3>
                  <p className="font-body text-xs text-primary/50 max-w-sm leading-relaxed mb-6">
                    Erase all sponsored banner placeholders permanently and establish a pristine focal space for your daily breathing practices.
                  </p>

                  <div className="bg-white border border-outline/10 rounded-2xl p-4 w-full mb-6 flex items-center justify-between">
                    <div className="text-left">
                      <span className="block font-body text-[8px] text-primary/30 font-bold uppercase tracking-widest">
                        MEMBERSHIP LEVEL
                      </span>
                      <span className="font-display text-sm text-primary font-bold">
                        Pristine Ad-Free Forever
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block font-body text-[8px] text-[#A67C52]/60 font-bold uppercase tracking-widest">
                        CONTRIBUTION
                      </span>
                      <span className="font-display text-sm text-[#A67C52] font-bold bg-[#A67C52]/10 px-2.5 py-1 rounded-full">
                        $0.50
                      </span>
                    </div>
                  </div>

                  {/* Simulated Secure Payment input fields */}
                  <div className="w-full flex flex-col gap-3 text-left mb-6 text-[#30302E]">
                    <div>
                      <label className="block font-body text-[9px] text-[#30302E]/60 font-bold uppercase tracking-widest mb-1">
                        Mock Sponsor Card Number (Simulated)
                      </label>
                      <input
                        type="text"
                        placeholder="••••  ••••  ••••  4000"
                        disabled={isPayingPremium}
                        className="w-full p-3 text-xs font-mono border border-outline/10 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-[#A67C52]/50 transition-all placeholder:text-primary/20 text-[#30302E]"
                      />
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block font-body text-[9px] text-[#30302E]/60 font-bold uppercase tracking-widest mb-1">
                          Expiry
                        </label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          disabled={isPayingPremium}
                          className="w-full p-3 text-xs font-mono border border-outline/10 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-[#A67C52]/50 transition-all placeholder:text-primary/20 text-[#30302E] text-center"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block font-body text-[9px] text-[#30302E]/60 font-bold uppercase tracking-widest mb-1">
                          Security (CVV)
                        </label>
                        <input
                          type="text"
                          placeholder="•••"
                          disabled={isPayingPremium}
                          className="w-full p-3 text-xs font-mono border border-outline/10 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-[#A67C52]/50 transition-all placeholder:text-primary/20 text-30302E text-center font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Simulated Click Actions */}
                  <button
                    disabled={isPayingPremium}
                    onClick={() => {
                      setIsPayingPremium(true);
                      setTimeout(() => {
                        setIsPayingPremium(false);
                        setPremiumSuccess(true);
                        setIsPremium(true);
                        localStorage.setItem('datum_is_premium', 'true');
                      }, 1800);
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-full font-body text-xs font-semibold tracking-wider transition-all duration-300 shadow-md shadow-amber-700/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isPayingPremium ? (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-2 h-2 rounded-full bg-white animate-bounce" />
                        <span className="text-[10px] tracking-wider uppercase font-semibold">Processing...</span>
                      </div>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Simulate Secure Payment ($0.50)</span>
                      </>
                    )}
                  </button>
                  
                  <span className="block font-body text-[8px] text-primary/30 mt-3.5 uppercase tracking-wider">
                    💳 Simulator for testing. No real cards required.
                  </span>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center py-4"
                >
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 text-amber-600">
                    <Check className="w-8 h-8 stroke-[2.5]" />
                  </div>
                  <h3 className="font-display text-2xl text-primary font-medium tracking-tight mb-2">
                    Mind Space Liberated!
                  </h3>
                  <p className="font-body text-xs text-primary/50 max-w-sm leading-relaxed mb-6">
                    Congratulations! Sponsor banners have been completely disabled. Enjoy absolute silence and custom aesthetics in your daily centering practice.
                  </p>
                  <button
                    onClick={() => {
                      setShowPremiumModal(false);
                      setPremiumSuccess(false);
                      setIsPayingPremium(false);
                    }}
                    className="py-3 px-8 bg-[#30302E] hover:bg-black text-white rounded-full font-body text-xs font-semibold tracking-wider transition-all duration-300 shadow-sm cursor-pointer"
                  >
                    Enter Elysian Workspace
                  </button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatItem({ label, val, unit }: { label: string, val: number, unit?: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-body text-[10px] text-primary/40 font-bold uppercase tracking-widest mb-1">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-4xl text-primary">{val}</span>
        {unit && <span className="font-body text-sm text-primary/40 italic">{unit}</span>}
      </div>
    </div>
  );
}

const AD_CAMPAIGNS = [
  {
    title: "Kyoto Ceremonial Uji Matcha",
    desc: "Single-origin stoneground leaf for enduring alpha-wave focus. 100% organic, hand-picked master batch.",
    action: "Discover Pristine Focus",
    promoter: "Satori Botanical Crafts"
  },
  {
    title: "Analog Stillness Linen Journal",
    desc: "A tactile physical notebook featuring heavy recycled cream pages. Store your fleeting insights away from screens.",
    action: "Order Tactile Diary",
    promoter: "Studio Octo Paperwork"
  },
  {
    title: "Aura Breath Ambient Soundscapes",
    desc: "Pristine acoustic resonance captured in forgotten bamboo valleys. Tune to eye-safe natural audio waves.",
    action: "Explore Calming Audio",
    promoter: "Wave Resonance Research"
  }
];

function AdSenseBanner({ onUpgradeClick }: { onUpgradeClick: () => void }) {
  const adClient = (import.meta as any).env?.VITE_ADSENSE_CLIENT || "";
  const adSlot = (import.meta as any).env?.VITE_ADSENSE_SLOT || "";

  // Dynamic state for local simulation mode
  const [showConfigHelp, setShowConfigHelp] = useState(false);
  const [adIndex] = useState(() => Math.floor(Math.random() * AD_CAMPAIGNS.length));
  
  // Interactive Simulator for users to see how they earn
  const [simulatedEarnings, setSimulatedEarnings] = useState(() => {
    return Number(localStorage.getItem('datum_simulated_earnings') || '0.00');
  });
  const [simulatedClicks, setSimulatedClicks] = useState(() => {
    return Number(localStorage.getItem('datum_simulated_clicks') || '0');
  });

  const ad = AD_CAMPAIGNS[adIndex];

  // 1. Dynamic Injection of the official Google AdSense script
  useEffect(() => {
    if (!adClient) return;

    const scriptId = "google-adsense-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`;
      script.async = true;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }
  }, [adClient]);

  // 2. Safe push request for SPA page loads
  useEffect(() => {
    if (!adClient) return;
    
    const timer = setTimeout(() => {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.warn("Google AdSense: Push caught or script compiling dynamically:", err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [adClient, adSlot]);

  const recordSimulatedClick = () => {
    if (adClient) return; // Real ads handle clicks natively
    
    // Add real engagement simulated reward feedback
    const reward = Number((0.15 + Math.random() * 0.45).toFixed(2)); // Random CTR payout ($0.15 - $0.60 CPC)
    const newEarnings = Number((simulatedEarnings + reward).toFixed(2));
    const newClicks = simulatedClicks + 1;
    
    setSimulatedEarnings(newEarnings);
    setSimulatedClicks(newClicks);
    localStorage.setItem('datum_simulated_earnings', newEarnings.toString());
    localStorage.setItem('datum_simulated_clicks', newClicks.toString());

    alert(`[Simulation] You recorded 1 click! Added $${reward} to your simulated revenues. Your pending trial balance is now: $${newEarnings}. Connect your web host in Production to lock this with Google!`);
  };

  return (
    <div className="w-full bg-[#FAF9F5]/70 hover:bg-[#FAF9F5] border border-outline/10 p-6 rounded-[2rem] relative overflow-hidden transition-all duration-500 shadow-[0_4px_30px_rgba(0,0,0,0.015)] select-none text-center flex flex-col items-center">
      {/* Upper tag identifying Adsense area */}
      <div className="flex flex-wrap items-center justify-between w-full mb-3 pb-2.5 border-b border-outline/5">
        <div className="flex items-center gap-1.5 mx-auto sm:mx-0">
          <span className="font-mono text-[7px] text-primary/30 tracking-[0.25em] font-extrabold uppercase animate-pulse">
            {adClient ? "LIVE BROADCAST" : "MONETIZED AREA"}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-mono text-[7px] text-tertiary tracking-[0.2em] font-extrabold uppercase">
            {adClient ? "GOOG_ADSENSE_ACTIVE" : "ADSENSE SIMULATOR"}
          </span>
        </div>
        
        <button
          onClick={() => setShowConfigHelp(!showConfigHelp)}
          className="text-[9px] font-mono font-extrabold tracking-wider text-[#A67C52] hover:text-[#7D5A34] transition-colors mt-1.5 sm:mt-0 uppercase"
        >
          {showConfigHelp ? "Hide Settings Guide" : "How to Connect My AdSense?"}
        </button>
      </div>

      {showConfigHelp ? (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full text-left bg-white p-4 rounded-2xl border border-outline/10 mb-2"
        >
          <span className="block font-body text-[9px] text-[#A67C52] font-black tracking-widest uppercase mb-1">
            Setup monetization
          </span>
          <h4 className="font-display text-xs text-primary font-bold mb-2">
            Make Money with your Ritual App
          </h4>
          <p className="font-body text-[10px] text-primary/50 leading-relaxed mb-3">
            To display real live pay-per-click advertisements on this block, modify your project secrets using the standard system variables:
          </p>
          <div className="bg-[#FAF9F5] p-3 rounded-xl border border-outline/5 font-mono text-[9px] text-[#30302E] select-text flex flex-col gap-1 mb-3">
            <div><span className="text-[#A67C52] font-bold">VITE_ADSENSE_CLIENT</span> = <span className="opacity-80">"ca-pub-XXXXXXXXXXXXXXXX"</span></div>
            <div><span className="text-[#A67C52] font-bold">VITE_ADSENSE_SLOT</span> = <span className="opacity-80">"1234567890"</span></div>
          </div>
          <p className="font-body text-[10px] text-primary/55 leading-relaxed">
            Configure these in your app configuration. Our built-in crawler will dynamically inject the necessary Google script code, render real advertisements, and let you earn residual click revenue immediately!
          </p>
        </motion.div>
      ) : null}

      {adClient ? (
        // 3. Real Live Google AdSense frame
        <div className="w-full flex items-center justify-center py-2 overflow-hidden min-h-[100px] bg-white rounded-xl border border-dashed border-outline/20">
          <ins className="adsbygoogle"
               style={{ display: 'block', width: '100%', minHeight: '90px' }}
               data-ad-client={adClient}
               data-ad-slot={adSlot || "default-slot"}
               data-ad-format="horizontal"
               data-full-width-responsive="true"></ins>
        </div>
      ) : (
        // Highly Polished Interactive Simulator frame with Simulated CPM calculations and direct feedback
        <div className="w-full flex flex-col items-center">
          <h5 className="font-display text-[14px] text-primary font-medium tracking-tight mb-1">
            {ad.title}
          </h5>
          <p className="font-body text-[11px] text-primary/45 max-w-sm leading-relaxed mb-4">
            {ad.desc}
          </p>

          {/* Real simulated values to let webmasters calculate potential yields */}
          <div className="mb-4 bg-white/70 backdrop-blur-sm border border-outline/15 px-4 py-2 rounded-2xl flex items-center gap-6 justify-center">
            <div className="text-center">
              <span className="block font-mono text-[6px] text-primary/30 uppercase tracking-wider">Simulated RPM</span>
              <span className="font-mono text-[10px] text-emerald-600 font-bold">$12.40</span>
            </div>
            <div className="w-[0.5px] h-6 bg-outline/20" />
            <div className="text-center">
              <span className="block font-mono text-[6px] text-primary/30 uppercase tracking-wider">Simulated Clicks</span>
              <span className="font-mono text-[10px] text-primary/70 font-semibold">{simulatedClicks}</span>
            </div>
            <div className="w-[0.5px] h-6 bg-outline/20" />
            <div className="text-center">
              <span className="block font-mono text-[6px] text-primary/30 uppercase tracking-wider">Est. Earnings</span>
              <span className="font-mono text-[10px] text-[#A67C52] font-black">${simulatedEarnings.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 justify-center">
            <button
              onClick={recordSimulatedClick}
              className="font-body text-[9px] font-bold text-tertiary uppercase tracking-wider hover:text-primary transition-colors py-1.5 px-3.5 rounded-full hover:bg-primary/5 border border-outline/10 cursor-pointer active:scale-95"
            >
              {ad.action} →
            </button>

            <button
              onClick={onUpgradeClick}
              className="font-body text-[9px] font-bold text-[#A67C52] hover:text-[#7D5A34] uppercase tracking-wider py-1.5 px-3 rounded-full bg-[#FAF9F5] border border-[#A67C52]/20 hover:border-[#7D5A34]/50 transition-all duration-300 cursor-pointer"
            >
              Remove Ads
            </button>
          </div>
        </div>
      )}

      <div className="w-full flex items-center justify-between mt-3 pt-2 border-t border-outline/5 text-[7px] font-mono text-primary/25">
        <span>ZONE ID: RITUAL_FOOTER_AD</span>
        <span>STATUS: {adClient ? "LIVE MONETIZATION ACTIVE" : "SIMULATING_YIELDS"}</span>
      </div>
    </div>
  );
}

function AnalyticsView({ onBack, logs, streak, maxStreak, total }: { onBack: () => void, logs: string[], streak: number, maxStreak: number, total: number }) {
  const [viewDate, setViewDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [direction, setDirection] = useState(0); 
  
  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();
  
  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;

  const monthKey = `${currentYear}-${currentMonth}`;

  // Get days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  
  const gridCells = useMemo(() => Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDay + 1;
    if (day > 0 && day <= daysInMonth) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = date.toDateString();
      const isCompleted = logs.includes(dateStr);
      const isToday = isCurrentMonth && day === today.getDate();
      const isFuture = date > today;
      return { day, isCompleted, isToday, isFuture, dateStr };
    }
    return null;
  }), [currentYear, currentMonth, logs, isCurrentMonth]);

  // Data for day of week distribution
  const dayOfWeekData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    
    logs.forEach(log => {
      const date = new Date(log);
      counts[date.getDay()]++;
    });

    return days.map((name, i) => ({
      name,
      count: counts[i]
    }));
  }, [logs]);

  // Data for recent progress (last 14 days)
  const recentProgressData = useMemo(() => {
    const data = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toDateString();
      data.push({
        date: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        completed: logs.includes(str) ? 1 : 0,
        fullDate: str
      });
    }
    return data;
  }, [logs]);

  const nextMonth = () => {
    setDirection(1);
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const prevMonth = () => {
    setDirection(-1);
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const jumpToToday = () => {
    setDirection(viewDate > today ? -1 : 1);
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  // Calculate monthly stats
  const monthlyLogs = gridCells.filter(cell => cell?.isCompleted);
  const monthlyCompleted = monthlyLogs.length;
  
  let currentMonthlyStreak = 0;
  let maxMonthlyStreak = 0;
  
  const sortedDays = gridCells
    .filter(cell => cell !== null && !cell.isFuture)
    .map(cell => cell!)
    .sort((a, b) => a.day - b.day);

  sortedDays.forEach((cell) => {
    if (cell.isCompleted) {
      currentMonthlyStreak++;
      maxMonthlyStreak = Math.max(maxMonthlyStreak, currentMonthlyStreak);
    } else {
      currentMonthlyStreak = 0;
    }
  });

  const containerVariants = {
    hidden: (direction: number) => ({ 
      opacity: 0, 
      x: direction * 50,
      filter: 'blur(4px)'
    }),
    visible: {
      opacity: 1,
      x: 0,
      filter: 'blur(0px)',
      transition: {
        staggerChildren: 0.01,
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1]
      }
    },
    exit: (direction: number) => ({ 
      opacity: 0, 
      x: direction * -50,
      filter: 'blur(4px)',
      transition: { duration: 0.3, ease: 'easeInOut' }
    })
  };

  const cellVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.25, ease: "easeOut" }
    }
  };

  const dotVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1, 
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 15,
        delay: 0.15
      } 
    },
    exit: { scale: 0, opacity: 0 }
  };

  const titleVariants = {
    enter: (direction: number) => ({
      x: direction * 30,
      opacity: 0,
      filter: 'blur(4px)'
    }),
    center: {
      x: 0,
      opacity: 1,
      filter: 'blur(0px)'
    },
    exit: (direction: number) => ({
      x: direction * -30,
      opacity: 0,
      filter: 'blur(4px)'
    })
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="fixed inset-0 z-40 bg-background plaster-texture p-8 pb-32 overflow-y-auto"
    >
      <div className="max-w-xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-3xl text-primary">Analytics</h2>
            {!isCurrentMonth && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={jumpToToday}
                className="px-3 py-1 bg-primary/5 rounded-full text-[9px] font-bold text-primary/40 uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all"
              >
                Today
              </motion.button>
            )}
          </div>
          <button onClick={onBack} className="p-2 bg-primary/5 rounded-full cursor-pointer md:hidden"><X className="w-6 h-6 text-primary" /></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <MetricCard label="Current Streak" val={streak} icon={TrendingUp} />
          <MetricCard label="Max Streak" val={maxStreak} icon={Sparkles} />
          <MetricCard label="Lifetime Anchors" val={total} icon={CircleDot} />
        </div>

        {/* Heatmap-style Calendar */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-outline/10 mb-8">
          <div className="flex items-center gap-3 mb-8">
            <CalendarDays className="w-5 h-5 text-primary opacity-40" />
            <h4 className="font-body text-xs font-bold text-primary/40 uppercase tracking-widest">Ritual Map</h4>
          </div>
          
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2">
              <button 
                onClick={prevMonth}
                className="p-2 hover:bg-primary/5 rounded-full transition-colors group"
              >
                <ChevronLeft className="w-5 h-5 text-primary/40 group-hover:text-primary" />
              </button>
              <div className="relative min-w-[200px] flex justify-center overflow-hidden">
                <AnimatePresence mode="popLayout" custom={direction}>
                  <motion.span 
                    key={monthKey}
                    custom={direction}
                    variants={titleVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="font-display text-2xl text-primary whitespace-nowrap flex items-center gap-3"
                  >
                    {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    {isCurrentMonth && (
                      <span className="px-2 py-0.5 bg-tertiary text-white text-[8px] font-bold uppercase tracking-widest rounded-full shadow-sm">
                        Current
                      </span>
                    )}
                  </motion.span>
                </AnimatePresence>
              </div>
              <button 
                onClick={nextMonth}
                className="p-2 hover:bg-primary/5 rounded-full transition-colors group"
              >
                <ChevronRight className="w-5 h-5 text-primary/40 group-hover:text-primary" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-x-2 mb-4 border-b border-outline/5 pb-4">
            {['S','M','T','W','T','F','S'].map((d, i) => (
              <span key={`${d}-${i}`} className="flex items-center justify-center font-body text-[10px] text-primary/40 font-bold uppercase tracking-wider">
                {d}
              </span>
            ))}
          </div>

          <div className="overflow-hidden relative">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div 
                key={monthKey}
                custom={direction}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="grid grid-cols-7 gap-y-4 gap-x-2"
              >
                {gridCells.map((cell, i) => (
                  <motion.div 
                    key={cell?.dateStr || `empty-${monthKey}-${i}`} 
                    variants={cellVariants}
                    className="flex items-center justify-center h-10 w-10"
                  >
                    {cell && (
                      <div className={`relative flex items-center justify-center h-full w-full rounded-full transition-all duration-300 
                        ${cell.isCompleted ? 'bg-tertiary/10 shadow-[inner_0_0_10px_rgba(105,127,101,0.1)]' : 'bg-primary/[0.02]'} 
                        ${cell.isToday ? 'ring-2 ring-primary/10' : ''}
                        ${cell.isFuture ? 'opacity-20 grayscale' : 'hover:scale-110 cursor-default'}`}>
                        <span className={`font-body text-xs transition-colors
                          ${cell.isCompleted ? 'text-tertiary font-bold' : 'text-primary/30'}
                          ${cell.isToday ? 'text-primary font-bold underline' : ''}`}>
                          {cell.day}
                        </span>
                        {cell.isCompleted && (
                          <motion.div 
                            variants={dotVariants}
                            exit="exit"
                            className="absolute inset-0 bg-tertiary/5 rounded-full border border-tertiary/20" 
                          />
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Recent Streak Chart */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-outline/10">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-5 h-5 text-primary opacity-40" />
              <h4 className="font-body text-xs font-bold text-primary/40 uppercase tracking-widest">Recent Flux</h4>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recentProgressData}>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 8, fill: 'rgba(48, 48, 46, 0.4)', fontWeight: 'bold' }} 
                    dy={10}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white shadow-xl border border-outline/10 px-3 py-2 rounded-xl">
                            <p className="font-body text-[10px] uppercase font-bold tracking-widest text-primary/40 mb-1">{data.date}</p>
                            <p className="font-display text-sm text-primary">{data.completed ? 'Anchored' : 'Missed'}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="completed" radius={[4, 4, 4, 4]} barSize={12}>
                    {recentProgressData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.completed ? '#697F65' : 'rgba(48, 48, 46, 0.05)'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekly Distribution Chart */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-outline/10">
            <div className="flex items-center gap-3 mb-6">
              <BarChart2 className="w-5 h-5 text-primary opacity-40" />
              <h4 className="font-body text-xs font-bold text-primary/40 uppercase tracking-widest">Activity Balance</h4>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayOfWeekData}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 8, fill: 'rgba(48, 48, 46, 0.4)', fontWeight: 'bold' }} 
                    dy={10}
                  />
                  <Bar dataKey="count" radius={[4, 4, 4, 4]} fill="rgba(48, 48, 46, 0.1)">
                    {dayOfWeekData.map((entry, index) => (
                      <Cell 
                        key={`cell-week-${index}`} 
                        fill={entry.count > 0 ? `rgba(105, 127, 101, ${Math.min(0.2 + (entry.count / 10), 1)})` : 'rgba(48, 48, 46, 0.05)'} 
                      />
                    ))}
                  </Bar>
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white shadow-xl border border-outline/10 px-3 py-2 rounded-xl">
                            <p className="font-body text-[10px] uppercase font-bold tracking-widest text-primary/40 mb-1">{payload[0].payload.name}</p>
                            <p className="font-display text-sm text-primary">{payload[0].value} Rituals</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="bg-white/50 backdrop-blur-sm p-6 rounded-[2rem] border border-outline/5 transition-all hover:bg-white hover:shadow-md">
            <span className="font-body text-[8px] text-primary/30 font-bold uppercase tracking-widest block mb-2">Month Total</span>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-3xl text-primary">{monthlyCompleted}</span>
              <span className="font-body text-[10px] text-primary/30 uppercase font-bold tracking-tighter">Sessions</span>
            </div>
          </div>
          <div className="bg-white/50 backdrop-blur-sm p-6 rounded-[2rem] border border-outline/5 transition-all hover:bg-white hover:shadow-md">
            <span className="font-body text-[8px] text-primary/30 font-bold uppercase tracking-widest block mb-2">Month Peak</span>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-3xl text-primary">{maxMonthlyStreak}</span>
              <span className="font-body text-[10px] text-primary/30 uppercase font-bold tracking-tighter">Day Streak</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center w-full px-4 pt-12 mb-12">
          <span className="font-body text-[9px] text-primary/20 tracking-[0.4em] font-bold uppercase">BY STUDIO OCTO</span>
        </div>
      </div>
    </motion.div>
  );
}

function MetricCard({ label, val, icon: Icon }: { label: string, val: number, icon?: any }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-outline/10 flex items-center justify-between group hover:shadow-md transition-all active:scale-[0.98]">
      <div className="flex flex-col">
        <span className="font-body text-[10px] text-primary/40 font-bold uppercase tracking-widest block mb-1">{label}</span>
        <h3 className="font-display text-4xl text-primary">{val}</h3>
      </div>
      {Icon && (
        <div className="p-3 bg-primary/5 rounded-full group-hover:bg-primary/10 transition-colors">
          <Icon className="w-6 h-6 text-primary/40 group-hover:text-primary transition-colors" />
        </div>
      )}
    </div>
  );
}

function SettingsView({ onBack, hapticLevel, setHapticLevel, isAudioEnabled, setIsAudioEnabled, isReminderEnabled, setIsReminderEnabled, reminderTime, setReminderTime, onReset, logs, isPremium, onUpgradeClick }: 
  { 
    onBack: () => void, 
    hapticLevel: HapticLevel, 
    setHapticLevel: (l: HapticLevel) => void, 
    isAudioEnabled: boolean, 
    setIsAudioEnabled: (e: boolean) => void, 
    isReminderEnabled: boolean,
    setIsReminderEnabled: (e: boolean) => void,
    reminderTime: string,
    setReminderTime: (t: string) => void,
    onReset: () => void,
    logs: string[],
    isPremium: boolean,
    onUpgradeClick: () => void
  }) {
  const [isConfirming, setIsConfirming] = useState(false);

  const stats = useMemo(() => {
    if (!logs || logs.length === 0) {
      return { currentStreak: 0, missedDays: 0 };
    }

    // Convert logs into unique midnight date timestamps, sorted descending
    const logTimestamps = Array.from(new Set(logs.map(log => {
      const d = new Date(log);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }))).sort((a, b) => b - a);

    const oneDayMs = 24 * 60 * 60 * 1000;
    
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const todayTime = todayMidnight.getTime();

    const yesterdayMidnight = new Date();
    yesterdayMidnight.setDate(yesterdayMidnight.getDate() - 1);
    yesterdayMidnight.setHours(0, 0, 0, 0);
    const yesterdayTime = yesterdayMidnight.getTime();

    const lastLogTime = logTimestamps[0];
    
    let currentStreak = 0;
    if (lastLogTime === todayTime || lastLogTime === yesterdayTime) {
      currentStreak = 1;
      let expectedTime = lastLogTime - oneDayMs;
      const loggedSet = new Set(logTimestamps);
      while (loggedSet.has(expectedTime)) {
        currentStreak++;
        expectedTime -= oneDayMs;
      }
    }

    const diffInDays = Math.floor((todayTime - lastLogTime) / oneDayMs);
    const missedDays = Math.max(0, diffInDays - 1);

    return { currentStreak, missedDays };
  }, [logs]);
  
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notification");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setIsReminderEnabled(true);
    }
  };

  const testNotification = () => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("DATUM", {
        body: "Presence is the key to clarity. Your ritual is waiting.",
        icon: '/favicon.ico'
      });
    } else {
      alert("Please ensure notifications are enabled first.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="fixed inset-0 z-40 bg-background plaster-texture p-8 pb-32 overflow-y-auto"
    >
      <div className="max-w-xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h2 className="font-display text-3xl text-primary">Preferences</h2>
          <button onClick={onBack} className="p-2 bg-primary/5 rounded-full cursor-pointer md:hidden"><X className="w-6 h-6 text-primary" /></button>
        </div>

        <div className="flex flex-col gap-8">
          {/* Day Counter & Streak Continuity */}
          <section className="bg-white rounded-[2rem] p-6 border border-outline/10 flex flex-col items-center text-center shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
            <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center mb-3">
              <CalendarDays className="w-5 h-5 text-tertiary" />
            </div>
            <span className="font-body text-[10px] text-tertiary font-bold tracking-[0.2em] uppercase mb-1">
              Ritual Continuity
            </span>
            <h4 className="font-display text-2xl text-primary font-medium tracking-tight">
              {stats.currentStreak} {stats.currentStreak === 1 ? 'Day' : 'Days'} Consecutive
            </h4>
            
            {stats.missedDays > 0 ? (
              <p className="font-body text-xs text-primary/45 mt-2 max-w-xs leading-relaxed">
                you missed <span className="text-tertiary font-bold">{stats.missedDays}</span> {stats.missedDays === 1 ? 'day' : 'days'} till today
              </p>
            ) : (
              <p className="font-body text-xs text-primary/40 mt-2 max-w-xs leading-relaxed">
                {stats.currentStreak > 0 ? 'Splendid consistency! Keep the chain alive.' : 'No active streak yet. Center yourself and hold the ritual button to begin.'}
              </p>
            )}
          </section>

          <section className="bg-white rounded-[2rem] p-8 border border-outline/10">
            <h4 className="font-body text-xs font-bold text-primary/40 uppercase tracking-widest mb-6">Interaction</h4>
            
            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Smartphone className="w-5 h-5 text-primary opacity-60" />
                  <div>
                    <span className="font-display text-lg block text-primary">Haptic Intensity</span>
                    <span className="font-body text-xs text-primary/40 italic">Vibration pulse duration</span>
                  </div>
                </div>
                <div className="flex bg-background p-1 rounded-full border border-outline/10">
                  {(['Soft', 'Medium', 'Deep'] as HapticLevel[]).map(level => (
                    <button
                      key={level}
                      onClick={() => setHapticLevel(level)}
                      className={`px-4 py-2 rounded-full font-body text-[10px] font-bold transition-all ${hapticLevel === level ? 'bg-primary text-white shadow-sm' : 'text-primary/40 hover:text-primary'}`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-[0.5px] bg-outline/10" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {isAudioEnabled ? <Volume2 className="w-5 h-5 text-primary opacity-60" /> : <VolumeX className="w-5 h-5 text-primary opacity-30" />}
                  <div>
                    <span className="font-display text-lg block text-primary">Audio Feedback</span>
                    <span className="font-body text-xs text-primary/40 italic">Play confirmation sound</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                  className={`w-14 h-8 rounded-full relative transition-colors ${isAudioEnabled ? 'bg-tertiary' : 'bg-primary/10'}`}
                >
                  <motion.div
                    animate={{ x: isAudioEnabled ? 26 : 4 }}
                    className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm"
                  />
                </button>
              </div>

              <div className="h-[0.5px] bg-outline/10" />

              <div className="flex flex-col gap-6 p-6 border border-outline/10 rounded-2xl bg-primary/[0.01]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className={`p-2 rounded-full transition-colors ${isReminderEnabled ? 'bg-tertiary/10' : 'bg-primary/5'}`}>
                      <Bell className={`w-5 h-5 transition-colors ${isReminderEnabled ? 'text-tertiary' : 'text-primary opacity-60'}`} />
                    </span>
                    <div>
                      <span className="font-display text-lg block text-primary">Daily Reminder</span>
                      <span className="font-body text-xs text-primary/40 italic">Receive a push notification</span>
                    </div>
                  </div>
                  <button
                    id="reminder-toggle"
                    onClick={() => {
                      if (!isReminderEnabled && "Notification" in window && Notification.permission !== "granted") {
                        requestNotificationPermission();
                      } else {
                        setIsReminderEnabled(!isReminderEnabled);
                      }
                    }}
                    className={`w-14 h-8 rounded-full relative transition-colors ${isReminderEnabled ? 'bg-tertiary' : 'bg-primary/10'}`}
                  >
                    <motion.div
                      animate={{ x: isReminderEnabled ? 26 : 4 }}
                      className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm"
                    />
                  </button>
                </div>

                <div className={`flex flex-col gap-4 pt-4 transition-all duration-500 ${isReminderEnabled ? 'opacity-100 translate-y-0' : 'opacity-30 pointer-events-none -translate-y-1'}`}>
                  <div className="flex items-center gap-3 pl-2">
                    <Clock className="w-4 h-4 text-primary/30" />
                    <span className="font-body text-[10px] font-bold text-primary/40 uppercase tracking-widest">Scheduled Ritual</span>
                  </div>
                  
                  <div className="flex items-end gap-1 px-2">
                    <RitualTimePicker 
                      value={reminderTime} 
                      onChange={setReminderTime} 
                    />
                    <div className="pb-4 ml-2">
                      <span className="block font-body text-[8px] text-primary/30 font-medium uppercase tracking-tighter">Daily configuration</span>
                      <span className="block font-body text-[8px] text-primary/30 font-medium uppercase tracking-tighter">Auto-saves to local storage</span>
                    </div>
                  </div>
                </div>

                {isReminderEnabled && (
                  <motion.button 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={testNotification}
                    className="flex items-center gap-2 mt-2 w-fit px-4 py-2 bg-primary/5 rounded-full font-body text-[9px] font-bold text-tertiary uppercase tracking-widest hover:bg-tertiary hover:text-white transition-all active:scale-95 ml-2"
                  >
                    <Bell className="w-3 h-3" />
                    Test Notification
                  </motion.button>
                )}
              </div>
            </div>
          </section>

          {/* Premium Membership card */}
          <section className="bg-gradient-to-br from-[#FAF9F5]/95 to-[#F2EFE8]/95 rounded-[2rem] p-8 border border-outline/10 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-body text-[9px] text-[#A67C52] font-black tracking-[0.2em] uppercase">Membership</span>
                {isPremium ? (
                  <span className="py-0.5 px-2.5 bg-amber-500/10 text-amber-700 text-[8px] font-black tracking-widest uppercase rounded-full flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-current" /> Active
                  </span>
                ) : (
                  <span className="py-0.5 px-2.5 bg-primary/10 text-primary/70 text-[8px] font-black tracking-widest uppercase rounded-full">
                    Free Tier
                  </span>
                )}
              </div>
              <h4 className="font-display text-xl text-primary font-medium tracking-tight">
                {isPremium ? 'Ad-Free Premium Activated' : 'Datum Pure Space'}
              </h4>
              <p className="font-body text-xs text-primary/50 mt-1 italic leading-relaxed max-w-sm">
                {isPremium 
                  ? 'Your practice space is fully liberated. Ad banners have been removed.' 
                  : 'Upgrade to premium to strip away all promotional placements and support tranquil design development.'}
              </p>
            </div>
            {!isPremium && (
              <button
                onClick={onUpgradeClick}
                className="flex items-center gap-2 self-start md:self-auto px-6 py-3 bg-[#30302E] hover:bg-black text-white rounded-full font-body text-xs font-semibold tracking-wider transition-all duration-300 active:scale-95 shadow-sm hover:shadow cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 fill-white" />
                Remove Ads
              </button>
            )}
          </section>

          <section className="bg-white rounded-[2rem] p-8 border border-outline/10">
            <h4 className="font-body text-xs font-bold text-primary/40 uppercase tracking-widest mb-6 text-red-900/40">Danger Zone</h4>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="font-display text-lg block text-primary">Reset Ritual Statistics</span>
                <span className="font-body text-xs text-primary/40 italic leading-tight">Wipe all streaks, logs and history permanently</span>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto min-h-[44px]">
                <AnimatePresence mode="wait">
                  {!isConfirming ? (
                    <motion.button
                      key="reset-btn"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => setIsConfirming(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 hover:bg-red-100/80 rounded-full font-body text-xs font-bold transition-all active:scale-95"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </motion.button>
                  ) : (
                    <motion.div
                      key="confirm-block"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-2"
                    >
                      <button
                        onClick={() => setIsConfirming(false)}
                        className="px-4 py-2.5 bg-primary/5 hover:bg-primary/10 rounded-full text-primary/60 font-body text-xs font-semibold transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          onReset();
                          setIsConfirming(false);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full font-body text-xs font-bold transition-all active:scale-95 shadow-sm shadow-red-600/10"
                      >
                        <Check className="w-4 h-4" />
                        Confirm Reset
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </section>
        </div>

        <div className="flex justify-center w-full px-4 pt-12 mb-12">
          <span className="font-body text-[9px] text-primary/20 tracking-[0.4em] font-bold uppercase">BY STUDIO OCTO</span>
        </div>
      </div>
    </motion.div>
  );
}

function RitualTimePicker({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [hours, minutes] = value.split(':').map(Number);
  
  const updateTime = (newHours: number, newMinutes: number) => {
    const h = (newHours + 24) % 24;
    const m = (newMinutes + 60) % 60;
    const paddedH = String(h).padStart(2, '0');
    const paddedM = String(m).padStart(2, '0');
    onChange(`${paddedH}:${paddedM}`);
  };

  const setPeriod = (p: 'AM' | 'PM') => {
    const isPM = hours >= 12;
    if (p === 'PM' && !isPM) {
      updateTime(hours + 12, minutes);
    } else if (p === 'AM' && isPM) {
      updateTime(hours - 12, minutes);
    }
  };

  const displayHours = String(hours % 12 || 12).padStart(2, '0');
  const displayMinutes = String(minutes).padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';

  const handleHourInput = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value.slice(-2));
    if (!isNaN(val)) {
      const h = period === 'PM' ? (val % 12) + 12 : val % 12;
      updateTime(h, minutes);
    }
  };

  const handleMinuteInput = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value.slice(-2));
    if (!isNaN(val)) updateTime(hours, val % 60);
  };

  return (
    <div className="flex items-center gap-4 bg-white border border-outline/10 rounded-[2rem] p-4 shadow-sm border-b-2 border-b-primary/5">
      {/* Hours Column */}
      <div className="flex flex-col items-center">
        <button 
          onClick={() => updateTime(hours + 1, minutes)}
          className="p-1 hover:bg-primary/5 rounded-full transition-colors text-primary/10 hover:text-primary active:scale-90"
        >
          <ChevronRight className="w-4 h-4 -rotate-90" />
        </button>
        <div className="relative group/val">
          <input 
            type="text"
            inputMode="numeric"
            value={displayHours}
            onChange={handleHourInput}
            className="font-display text-4xl text-primary tracking-tighter tabular-nums leading-none w-[52px] text-center bg-transparent border-none focus:outline-none focus:ring-0 select-all"
          />
        </div>
        <button 
          onClick={() => updateTime(hours - 1, minutes)}
          className="p-1 hover:bg-primary/5 rounded-full transition-colors text-primary/10 hover:text-primary active:scale-90"
        >
          <ChevronRight className="w-4 h-4 rotate-90" />
        </button>
      </div>

      <span className="font-display text-2xl text-primary/10 mb-1 select-none">:</span>

      {/* Minutes Column */}
      <div className="flex flex-col items-center">
        <button 
          onClick={() => updateTime(hours, minutes + 1)}
          className="p-1 hover:bg-primary/5 rounded-full transition-colors text-primary/10 hover:text-primary active:scale-90"
        >
          <ChevronRight className="w-4 h-4 -rotate-90" />
        </button>
        <div className="relative group/val">
          <input 
            type="text"
            inputMode="numeric"
            value={displayMinutes}
            onChange={handleMinuteInput}
            className="font-display text-4xl text-primary tracking-tighter tabular-nums leading-none w-[52px] text-center bg-transparent border-none focus:outline-none focus:ring-0 select-all"
          />
        </div>
        <button 
          onClick={() => updateTime(hours, minutes - 1)}
          className="p-1 hover:bg-primary/5 rounded-full transition-colors text-primary/10 hover:text-primary active:scale-90"
        >
          <ChevronRight className="w-4 h-4 rotate-90" />
        </button>
      </div>

      {/* Period Toggle - Compact */}
      <div className="flex flex-col h-full justify-center ml-1">
        <div className="bg-primary/[0.03] p-1 rounded-2xl flex flex-col relative border border-outline/5">
          <motion.div 
            className="absolute left-1 right-1 h-[calc(50%-2px)] bg-white rounded-xl shadow-sm border border-outline/5 z-0"
            animate={{ top: period === 'AM' ? '2px' : 'calc(50% + 1px)' }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
          <button 
            onClick={() => setPeriod('AM')}
            className={`relative z-10 w-12 h-9 flex items-center justify-center rounded-xl transition-colors duration-300 ${period === 'AM' ? 'text-tertiary font-bold' : 'text-primary/20 hover:text-primary/40'}`}
          >
            <span className="font-body text-[9px] tracking-widest leading-none">AM</span>
          </button>
          <button 
            onClick={() => setPeriod('PM')}
            className={`relative z-10 w-12 h-9 flex items-center justify-center rounded-xl transition-colors duration-300 ${period === 'PM' ? 'text-tertiary font-bold' : 'text-primary/20 hover:text-primary/40'}`}
          >
            <span className="font-body text-[9px] tracking-widest leading-none">PM</span>
          </button>
        </div>
      </div>
    </div>
  );
}
