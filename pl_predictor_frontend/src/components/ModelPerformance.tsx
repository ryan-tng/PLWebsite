'use client';

import { useState, useEffect } from 'react';
import { ModelPerformance as ModelPerformanceType, modelApi, PaginatedResponse } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function ModelPerformance() {
  const [performance, setPerformance] = useState<ModelPerformanceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const response = await modelApi.getPerformance();
        // Handle paginated response from Django REST Framework
        const performanceData = response.data.results || response.data;
        setPerformance(Array.isArray(performanceData) ? performanceData : []);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load model performance');
        setPerformance([]); // Ensure performance is always an array
      } finally {
        setLoading(false);
      }
    };

    fetchPerformance();
  }, []);

  const handleTrainModel = async () => {
    setLoading(true);
    try {
      await modelApi.train();
      // Refresh performance data
      const response = await modelApi.getPerformance();
      const performanceData = response.data.results || response.data;
      setPerformance(Array.isArray(performanceData) ? performanceData : []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to train model');
      setPerformance([]); // Ensure performance is always an array
    } finally {
      setLoading(false);
    }
  };

  if (loading && performance.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl shadow-xl border border-white/20">
        <div className="animate-pulse">
          <div className="h-8 bg-white/20 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-white/20 rounded"></div>
            <div className="h-4 bg-white/20 rounded"></div>
            <div className="h-4 bg-white/20 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {!performance || !Array.isArray(performance) || performance.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-300 mb-4">No training history available.</p>
          <p className="text-sm text-gray-400">Train the model to see detailed metrics.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-2">Training History</h3>
          {performance.map((perf) => (
            <div key={perf.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-semibold text-white">
                  {perf.model_version}
                </h4>
                <span className="text-sm text-gray-400">
                  {formatDate(perf.training_date)}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Accuracy</p>
                  <p className="text-xl font-bold text-blue-400">
                    {(perf.accuracy * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Precision</p>
                  <p className="text-xl font-bold text-green-400">
                    {(perf.precision * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Recall</p>
                  <p className="text-xl font-bold text-yellow-400">
                    {(perf.recall * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">F1 Score</p>
                  <p className="text-xl font-bold text-purple-400">
                    {(perf.f1_score * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Test Set Size:</span>{' '}
                    <span className="font-semibold text-white">{perf.test_set_size}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Features:</span>{' '}
                    <span className="font-semibold text-white">{perf.feature_count}</span>
                  </div>
                </div>
                {perf.notes && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-400">{perf.notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

