'use client';

import { useState } from 'react';
import { modelApi } from '@/lib/api';

export default function ModelPerformance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTrainModel = async () => {
    setLoading(true);
    setError(null);
    try {
      await modelApi.train();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to train model');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl shadow-xl border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Model Performance</h2>
        <button
          onClick={handleTrainModel}
          disabled={loading}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all shadow-lg"
        >
          {loading ? 'Training...' : 'Train Model'}
        </button>
      </div>

      {/* Model Comparison Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 p-4 rounded-lg border border-green-500/30">
          <p className="text-green-300 text-sm">Binary Accuracy</p>
          <p className="text-3xl font-bold text-white">79%</p>
          <p className="text-green-400 text-xs">Win vs Not-Win</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-4 rounded-lg border border-blue-500/30">
          <p className="text-blue-300 text-sm">3-Class Accuracy</p>
          <p className="text-3xl font-bold text-white">48%</p>
          <p className="text-blue-400 text-xs">Win/Draw/Loss</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 p-4 rounded-lg border border-purple-500/30">
          <p className="text-purple-300 text-sm">vs Baseline</p>
          <p className="text-3xl font-bold text-white">1.6x</p>
          <p className="text-purple-400 text-xs">Better than random</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 p-4 rounded-lg border border-orange-500/30">
          <p className="text-orange-300 text-sm">Test Matches</p>
          <p className="text-3xl font-bold text-white">192</p>
          <p className="text-orange-400 text-xs">Validated predictions</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}

