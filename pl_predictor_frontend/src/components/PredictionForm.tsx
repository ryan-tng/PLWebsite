'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { teamsApi, predictionsApi, Team, PredictionResponse, PaginatedResponse } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface PredictionFormProps {
  onPredictionMade: (prediction: PredictionResponse) => void;
}

export default function PredictionForm({ onPredictionMade }: PredictionFormProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [selectedOpponent, setSelectedOpponent] = useState<number | null>(null);
  const [matchDate, setMatchDate] = useState<string>('');
  const [venue, setVenue] = useState<'H' | 'A'>('H');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamsLoading, setTeamsLoading] = useState(true);
  
  // Load teams on component mount
  useEffect(() => {
    const loadTeams = async () => {
      try {
        setTeamsLoading(true);
        const response = await teamsApi.getAll();
        // Handle paginated response from Django REST Framework
        const teamsData = response.data.results || response.data;
        setTeams(Array.isArray(teamsData) ? teamsData : []);
      } catch (err: any) {
        setError('Failed to load teams');
        console.error('Error loading teams:', err);
        setTeams([]); // Ensure teams is always an array
      } finally {
        setTeamsLoading(false);
      }
    };

    loadTeams();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTeam || !selectedOpponent || !matchDate) {
      setError('Please fill in all fields');
      return;
    }

    if (selectedTeam === selectedOpponent) {
      setError('Team and opponent must be different');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await predictionsApi.predict({
        team_id: selectedTeam,
        opponent_id: selectedOpponent,
        venue,
        date: matchDate,
      });
      
      onPredictionMade(response.data);
      
      // Reset form
      setSelectedTeam(null);
      setSelectedOpponent(null);
      setMatchDate('');
      setVenue('H');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to make prediction');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl shadow-xl border border-white/20">
      <h2 className="text-2xl font-bold text-white mb-6">Predict Match Result</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-2">
              Team
            </label>
            <select
              value={selectedTeam || ''}
              onChange={(e) => setSelectedTeam(Number(e.target.value))}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
              disabled={teamsLoading}
            >
              <option value="" className="bg-slate-800">
                {teamsLoading ? 'Loading teams...' : 'Select a team'}
              </option>
              {teams && Array.isArray(teams) && teams.map(team => (
                <option key={team.id} value={team.id} className="bg-slate-800">
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-200 mb-2">
              Opponent
            </label>
            <select
              value={selectedOpponent || ''}
              onChange={(e) => setSelectedOpponent(Number(e.target.value))}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
              disabled={teamsLoading}
            >
              <option value="" className="bg-slate-800">
                {teamsLoading ? 'Loading teams...' : 'Select opponent'}
              </option>
              {teams && Array.isArray(teams) && teams.map(team => (
                <option key={team.id} value={team.id} className="bg-slate-800">
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-2">
              Match Date
            </label>
            <input
              type="date"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-200 mb-2">
              Venue
            </label>
            <select
              value={venue}
              onChange={(e) => setVenue(e.target.value as 'H' | 'A')}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              <option value="H" className="bg-slate-800">Home</option>
              <option value="A" className="bg-slate-800">Away</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading || teamsLoading || teams.length === 0}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50 transition-all shadow-lg"
        >
          {isLoading ? 'Making Prediction...' : teamsLoading ? 'Loading Teams...' : '⚽ Predict Match'}
        </Button>
      </form>
    </div>
  );
}

