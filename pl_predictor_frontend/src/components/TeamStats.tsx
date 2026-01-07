'use client';

import { useState, useEffect } from 'react';
import { teamsApi, Team, TeamStats as TeamStatsType, PaginatedResponse } from '@/lib/api';
import { formatPercentage, getResultColor } from '@/lib/utils';

export default function TeamStats() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [stats, setStats] = useState<TeamStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await teamsApi.getAll();
        const teamsData = response.data.results || response.data;
        setTeams(Array.isArray(teamsData) ? teamsData : []);
      } catch (err: any) {
        setError('Failed to load teams');
        setTeams([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  useEffect(() => {
    if (!selectedTeam) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await teamsApi.getStats(selectedTeam);
        setStats(response.data);
      } catch (err: any) {
        setError('Failed to load team stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedTeam]);

  if (loading && teams.length === 0) {
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
      <h2 className="text-2xl font-bold text-white mb-6">Team Statistics</h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-purple-200 mb-2">
          Select Team
        </label>
        <select
          value={selectedTeam || ''}
          onChange={(e) => setSelectedTeam(Number(e.target.value))}
          className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="" className="bg-slate-800">Choose a team...</option>
          {teams.map(team => (
            <option key={team.id} value={team.id} className="bg-slate-800">
              {team.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <p className="text-sm text-gray-400">Matches Played</p>
              <p className="text-2xl font-bold text-white">{stats.team.matches_played}</p>
            </div>
            <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
              <p className="text-sm text-green-300">Wins</p>
              <p className="text-2xl font-bold text-green-400">{stats.team.wins}</p>
            </div>
            <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/20">
              <p className="text-sm text-yellow-300">Draws</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.team.draws}</p>
            </div>
            <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
              <p className="text-sm text-red-300">Losses</p>
              <p className="text-2xl font-bold text-red-400">{stats.team.losses}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <p className="text-sm text-gray-400">Points</p>
              <p className="text-2xl font-bold text-white">{stats.team.points}</p>
            </div>
            <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/20">
              <p className="text-sm text-purple-300">Win Rate</p>
              <p className="text-2xl font-bold text-purple-400">{formatPercentage(stats.win_rate)}</p>
            </div>
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <p className="text-sm text-gray-400">Goals For</p>
              <p className="text-2xl font-bold text-white">{stats.team.goals_for}</p>
            </div>
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <p className="text-sm text-gray-400">Goals Against</p>
              <p className="text-2xl font-bold text-white">{stats.team.goals_against}</p>
            </div>
          </div>

          {stats.recent_form && stats.recent_form.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Recent Form</h3>
              <div className="flex gap-2">
                {stats.recent_form.map((result, index) => (
                  <div
                    key={index}
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${getResultColor(result as 'W' | 'D' | 'L')}`}
                  >
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!selectedTeam && !error && (
        <div className="text-center py-8">
          <p className="text-gray-400">Select a team to view detailed statistics</p>
        </div>
      )}
    </div>
  );
}

