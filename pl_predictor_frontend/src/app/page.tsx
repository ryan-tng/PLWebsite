'use client';

import { useState } from 'react';
import PredictionForm from '@/components/PredictionForm';
import PredictionCard from '@/components/PredictionCard';
import TeamStats from '@/components/TeamStats';
import ModelPerformance from '@/components/ModelPerformance';
import { PredictionResponse } from '@/lib/api';

type Tab = 'predict' | 'teams' | 'model';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('predict');
  const [predictions, setPredictions] = useState<PredictionResponse[]>([]);

  const handlePredictionMade = (prediction: PredictionResponse) => {
    setPredictions([prediction, ...predictions]);
  };

  const tabs = [
    { id: 'predict' as Tab, label: 'Predict', icon: '⚽' },
    { id: 'teams' as Tab, label: 'Teams', icon: '📊' },
    { id: 'model' as Tab, label: 'Model', icon: '🤖' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            ⚽ Premier League Predictor
          </h1>
          <p className="text-lg text-purple-200">
            AI-powered match outcome predictions using machine learning
          </p>
          <div className="mt-4 flex justify-center gap-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-300 border border-green-500/30">
              79% Accuracy
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
              800+ Matches Analyzed
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
              23 Teams
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl mb-6 border border-white/20">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 px-6 text-center font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'text-white bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                } ${tab.id === 'predict' ? 'rounded-l-xl' : ''} ${tab.id === 'model' ? 'rounded-r-xl' : ''}`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-6xl mx-auto">
          {activeTab === 'predict' && (
            <div className="space-y-6">
              <PredictionForm onPredictionMade={handlePredictionMade} />
              
              {predictions.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Predictions</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {predictions.map((prediction, index) => (
                      <PredictionCard key={index} prediction={prediction} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'teams' && <TeamStats />}

          {activeTab === 'model' && <ModelPerformance />}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-purple-200/60 text-sm">
          <p className="font-medium">Powered by Ensemble ML (RandomForest + XGBoost + LightGBM)</p>
          <p className="mt-1">Trained on 800+ Premier League matches • 192-match test validation</p>
          <div className="mt-4 flex justify-center gap-6 text-xs">
            <span>Next.js</span>
            <span>•</span>
            <span>Django REST</span>
            <span>•</span>
            <span>PostgreSQL</span>
            <span>•</span>
            <span>scikit-learn</span>
          </div>
        </div>
      </div>
    </div>
  );
}

