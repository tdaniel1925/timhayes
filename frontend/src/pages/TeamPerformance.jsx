import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Trophy,
  TrendingUp,
  Users,
  Phone,
  Clock,
  BarChart3,
  Award,
  Target,
  Zap
} from 'lucide-react';

export default function TeamPerformance() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState(null);

  useEffect(() => {
    loadTeamPerformance();
  }, []);

  const loadTeamPerformance = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/analytics/team-performance`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTeamData(data);
      }
    } catch (error) {
      console.error('Failed to load team performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreBadge = (score) => {
    if (score >= 90) return { label: 'Excellent', color: 'bg-purple-100 text-purple-800' };
    if (score >= 80) return { label: 'Great', color: 'bg-green-100 text-green-800' };
    if (score >= 70) return { label: 'Good', color: 'bg-blue-100 text-blue-800' };
    if (score >= 60) return { label: 'Fair', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Needs Improvement', color: 'bg-red-100 text-red-800' };
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (index === 1) return <Award className="h-6 w-6 text-gray-400" />;
    if (index === 2) return <Award className="h-6 w-6 text-amber-600" />;
    return <span className="text-gray-500 font-semibold text-lg">#{index + 1}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading team performance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Team Performance</h1>
              <p className="text-sm text-muted-foreground">Leaderboards and analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" onClick={logout}>Logout</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {teamData && (
          <>
            {/* Team Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Team Members
                  </CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{teamData.total_team_members}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Calls
                  </CardTitle>
                  <Phone className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{teamData.team_total_calls}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Avg Quality Score
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${getScoreColor(teamData.team_avg_quality).split(' ')[0]}`}>
                    {teamData.team_avg_quality}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Avg Answer Rate
                  </CardTitle>
                  <Target className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{teamData.team_avg_answer_rate}%</div>
                </CardContent>
              </Card>
            </div>

            {/* Top Performers Podium */}
            {teamData.team_members.length >= 3 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl">
                    <Trophy className="mr-3 h-8 w-8 text-yellow-500" />
                    Top Performers
                  </CardTitle>
                  <CardDescription>This month's highest quality scores</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center items-end gap-4 py-8">
                    {/* Second Place */}
                    {teamData.team_members[1] && (
                      <div className="flex flex-col items-center">
                        <div className="bg-gray-100 rounded-lg p-6 text-center border-2 border-gray-300 w-48">
                          <Award className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <p className="font-bold text-lg text-gray-900 mb-1">
                            {teamData.team_members[1].user_name}
                          </p>
                          <p className={`text-4xl font-bold mb-2 ${getScoreColor(teamData.team_members[1].avg_quality_score).split(' ')[0]}`}>
                            {teamData.team_members[1].avg_quality_score}
                          </p>
                          <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getScoreBadge(teamData.team_members[1].avg_quality_score).color}`}>
                            {getScoreBadge(teamData.team_members[1].avg_quality_score).label}
                          </span>
                        </div>
                        <div className="bg-gray-200 h-32 w-48 rounded-t-lg mt-4 flex items-center justify-center text-6xl font-bold text-gray-400">
                          2
                        </div>
                      </div>
                    )}

                    {/* First Place */}
                    {teamData.team_members[0] && (
                      <div className="flex flex-col items-center">
                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 text-center border-4 border-yellow-400 w-48 shadow-lg">
                          <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-3" />
                          <p className="font-bold text-xl text-gray-900 mb-1">
                            {teamData.team_members[0].user_name}
                          </p>
                          <p className="text-5xl font-bold text-yellow-600 mb-2">
                            {teamData.team_members[0].avg_quality_score}
                          </p>
                          <span className={`inline-block px-4 py-2 text-sm font-semibold rounded-full ${getScoreBadge(teamData.team_members[0].avg_quality_score).color}`}>
                            {getScoreBadge(teamData.team_members[0].avg_quality_score).label}
                          </span>
                        </div>
                        <div className="bg-yellow-300 h-48 w-48 rounded-t-lg mt-4 flex items-center justify-center text-7xl font-bold text-yellow-600 shadow-lg">
                          1
                        </div>
                      </div>
                    )}

                    {/* Third Place */}
                    {teamData.team_members[2] && (
                      <div className="flex flex-col items-center">
                        <div className="bg-amber-50 rounded-lg p-6 text-center border-2 border-amber-400 w-48">
                          <Award className="h-12 w-12 text-amber-600 mx-auto mb-3" />
                          <p className="font-bold text-lg text-gray-900 mb-1">
                            {teamData.team_members[2].user_name}
                          </p>
                          <p className={`text-4xl font-bold mb-2 ${getScoreColor(teamData.team_members[2].avg_quality_score).split(' ')[0]}`}>
                            {teamData.team_members[2].avg_quality_score}
                          </p>
                          <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getScoreBadge(teamData.team_members[2].avg_quality_score).color}`}>
                            {getScoreBadge(teamData.team_members[2].avg_quality_score).label}
                          </span>
                        </div>
                        <div className="bg-amber-200 h-24 w-48 rounded-t-lg mt-4 flex items-center justify-center text-5xl font-bold text-amber-600">
                          3
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Full Leaderboard Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Complete Leaderboard
                </CardTitle>
                <CardDescription>Detailed performance metrics for all team members</CardDescription>
              </CardHeader>
              <CardContent>
                {teamData.team_members.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No team performance data available yet.</p>
                    <p className="text-sm text-gray-500 mt-2">Make some calls to see performance metrics!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left p-4 font-semibold">Rank</th>
                          <th className="text-left p-4 font-semibold">Team Member</th>
                          <th className="text-center p-4 font-semibold">Quality Score</th>
                          <th className="text-center p-4 font-semibold">Total Calls</th>
                          <th className="text-center p-4 font-semibold">Answer Rate</th>
                          <th className="text-center p-4 font-semibold">Avg Duration</th>
                          <th className="text-center p-4 font-semibold">Total Talk Time</th>
                          <th className="text-left p-4 font-semibold">Sentiment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamData.team_members.map((member, index) => (
                          <tr
                            key={member.user_id}
                            className={`border-b hover:bg-gray-50 ${index < 3 ? 'bg-blue-50' : ''}`}
                          >
                            <td className="p-4">
                              <div className="flex items-center justify-center w-12">
                                {getRankIcon(index)}
                              </div>
                            </td>
                            <td className="p-4">
                              <p className="font-semibold text-gray-900">{member.user_name}</p>
                              <p className="text-sm text-gray-500">{member.user_email}</p>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex flex-col items-center">
                                <span className={`text-2xl font-bold ${getScoreColor(member.avg_quality_score).split(' ')[0]}`}>
                                  {member.avg_quality_score}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({member.quality_score_count} calls)
                                </span>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center">
                                <Phone className="h-4 w-4 mr-1 text-gray-500" />
                                <span className="font-semibold">{member.total_calls}</span>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                member.answer_rate >= 80 ? 'bg-green-100 text-green-800' :
                                member.answer_rate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {member.answer_rate}%
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center">
                                <Clock className="h-4 w-4 mr-1 text-gray-500" />
                                <span>{Math.floor(member.avg_call_duration_seconds / 60)}:{(member.avg_call_duration_seconds % 60).toString().padStart(2, '0')}</span>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <span className="font-semibold">{member.total_talk_time_minutes} min</span>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-green-600">😊</span>
                                    <span className="font-semibold">{member.sentiment_breakdown.Positive.toFixed(0)}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${member.sentiment_breakdown.Positive}%` }}></div>
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-red-600">😞</span>
                                    <span className="font-semibold">{member.sentiment_breakdown.Negative.toFixed(0)}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${member.sentiment_breakdown.Negative}%` }}></div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
