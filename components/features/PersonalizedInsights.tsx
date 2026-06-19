'use client';


import { motion, useReducedMotion } from 'framer-motion';
import { useInsights } from '@/hooks/useInsights';
import { Sparkles, Leaf, Zap, RefreshCw, AlertCircle } from 'lucide-react';

interface PersonalizedInsightsProps {
  token: string;
}

export default function PersonalizedInsights({ token }: PersonalizedInsightsProps) {
  const { insights, loading, error, fetchInsights } = useInsights(token);
  const prefersReducedMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <section className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-zinc-100 flex flex-col h-full relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
      
      <div className="flex justify-between items-center mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Sparkles size={16} />
          </div>
          <h2 className="text-xl font-semibold text-zinc-900">AI Insights</h2>
        </div>
        <button
          onClick={fetchInsights}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors bg-zinc-100 text-zinc-600 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Generate AI Insights"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {insights ? 'Refresh' : 'Generate'}
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center relative z-10">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-start gap-3 text-sm mb-4">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {loading && !insights && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex gap-4 p-4 rounded-xl border border-zinc-100 bg-zinc-50/50">
                <div className="w-10 h-10 rounded-full bg-zinc-200 shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-zinc-200 rounded w-3/4" />
                  <div className="h-3 bg-zinc-200 rounded w-full" />
                  <div className="h-3 bg-zinc-200 rounded w-5/6" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !insights && !error && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-400">
              <Zap size={24} />
            </div>
            <p className="text-zinc-500 mb-2">Ready to optimize your footprint?</p>
            <p className="text-sm text-zinc-400 max-w-xs mx-auto">
              Our AI analyzes your recent logs to suggest personalized, high-impact actions.
            </p>
          </div>
        )}

        {insights && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {insights.map((insight, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="p-4 rounded-xl border border-zinc-100 bg-white shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-110 transition-transform">
                    <Leaf size={18} />
                  </div>
                  <div>
                    <h3 className="font-medium text-zinc-900 mb-1">{insight.title}</h3>
                    <p className="text-sm text-zinc-500 mb-3 leading-relaxed">
                      {insight.description}
                    </p>
                    {insight.estimatedSavingsKg !== 0 && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                        {insight.estimatedSavingsKg < 0 ? '-' : '+'}
                        {Math.abs(insight.estimatedSavingsKg).toFixed(1)} kg CO₂
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
