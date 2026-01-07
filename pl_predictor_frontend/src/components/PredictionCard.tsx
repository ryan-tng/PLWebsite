'use client';

import { PredictionResponse } from '@/lib/api';
import { formatDate, formatPercentage, getResultColor, getResultText } from '@/lib/utils';

interface PredictionCardProps {
  prediction: PredictionResponse;
}

export default function PredictionCard({ prediction }: PredictionCardProps) {
  const resultColorClass = getResultColor(prediction.predicted_result);
  const resultText = getResultText(prediction.predicted_result);

  return (
    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl shadow-xl border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">
          {prediction.team} vs {prediction.opponent}
        </h3>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${resultColorClass}`}>
          {resultText}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-400">Date</p>
          <p className="text-lg font-semibold text-white">{formatDate(prediction.match_date)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Venue</p>
          <p className="text-lg font-semibold text-white">{prediction.venue === 'H' ? 'Home' : 'Away'}</p>
        </div>
      </div>

      <div className="border-t border-white/10 pt-4">
        <h4 className="text-sm font-semibold text-gray-300 mb-3">Probabilities</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Win</span>
            <div className="flex items-center">
              <div className="w-32 h-2 bg-white/10 rounded-full mr-2">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${prediction.win_probability * 100}%` }}
                />
              </div>
              <span className="text-sm font-semibold w-12 text-right text-white">
                {formatPercentage(prediction.win_probability)}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Draw</span>
            <div className="flex items-center">
              <div className="w-32 h-2 bg-white/10 rounded-full mr-2">
                <div
                  className="h-full bg-yellow-500 rounded-full"
                  style={{ width: `${prediction.draw_probability * 100}%` }}
                />
              </div>
              <span className="text-sm font-semibold w-12 text-right text-white">
                {formatPercentage(prediction.draw_probability)}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Loss</span>
            <div className="flex items-center">
              <div className="w-32 h-2 bg-white/10 rounded-full mr-2">
                <div
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${prediction.loss_probability * 100}%` }}
                />
              </div>
              <span className="text-sm font-semibold w-12 text-right text-white">
                {formatPercentage(prediction.loss_probability)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Confidence</span>
          <span className="text-lg font-bold text-purple-400">
            {formatPercentage(prediction.confidence)}
          </span>
        </div>
      </div>
    </div>
  );
}

