import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Users,
  Target,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Phone,
  Award,
  CheckCircle,
  Clock,
  Plus,
  Edit,
  Eye,
  Calendar,
  BarChart3,
  UserPlus,
  Mail
} from 'lucide-react';

export default function TeamManagementEnhanced() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // State for team members and goals
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamGoals, setTeamGoals] = useState([]);
  const [coachingSessions, setCoachingSessions] = useState([]);
  const [performanceTrends, setPerformanceTrends] = useState([]);

  // Modal states
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showCoachingModal, setShowCoachingModal] = useState(false);
  const [showAssignCallModal, setShowAssignCallModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Form states
  const [newGoal, setNewGoal] = useState({
    member_id: '',
    goal_type: 'calls',
    target_value: '',
    timeframe: 'monthly',
    description: ''
  });
  const [newCoaching, setNewCoaching] = useState({
    member_id: '',
    topic: '',
    notes: '',
    scheduled_date: '',
    follow_up_date: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      const [membersResponse, goalsResponse, coachingResponse, trendsResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/tenant/team/members-detailed`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/tenant/team/goals`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/tenant/team/coaching-sessions`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/tenant/team/performance-trends`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        })
      ]);

      if (membersResponse.ok) {
        const data = await membersResponse.json();
        setTeamMembers(data.members || []);
      }

      if (goalsResponse.ok) {
        const data = await goalsResponse.json();
        setTeamGoals(data.goals || []);
      }

      if (coachingResponse.ok) {
        const data = await coachingResponse.json();
        setCoachingSessions(data.sessions || []);
      }

      if (trendsResponse.ok) {
        const data = await trendsResponse.json();
        setPerformanceTrends(data.trends || []);
      }
    } catch (err) {
      console.error('Error fetching team data:', err);
      setError('Failed to load team information');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!newGoal.member_id || !newGoal.target_value) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tenant/team/goals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newGoal)
      });

      if (response.ok) {
        alert('Goal created successfully!');
        setShowGoalModal(false);
        setNewGoal({
          member_id: '',
          goal_type: 'calls',
          target_value: '',
          timeframe: 'monthly',
          description: ''
        });
        fetchTeamData();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create goal');
      }
    } catch (err) {
      console.error('Error creating goal:', err);
      alert('Failed to create goal');
    }
  };

  const handleScheduleCoaching = async () => {
    if (!newCoaching.member_id || !newCoaching.topic || !newCoaching.scheduled_date) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tenant/team/coaching-sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newCoaching,
          coach_id: user?.id
        })
      });

      if (response.ok) {
        alert('Coaching session scheduled successfully!');
        setShowCoachingModal(false);
        setNewCoaching({
          member_id: '',
          topic: '',
          notes: '',
          scheduled_date: '',
          follow_up_date: ''
        });
        fetchTeamData();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to schedule coaching');
      }
    } catch (err) {
      console.error('Error scheduling coaching:', err);
      alert('Failed to schedule coaching');
    }
  };

  const handleAssignCall = async (callId, memberId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tenant/team/assign-call`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ call_id: callId, member_id: memberId })
      });

      if (response.ok) {
        alert('Call assigned successfully!');
        setShowAssignCallModal(false);
        fetchTeamData();
      } else {
        alert('Failed to assign call');
      }
    } catch (err) {
      console.error('Error assigning call:', err);
      alert('Failed to assign call');
    }
  };

  const getGoalProgress = (goal) => {
    if (!goal.target_value || goal.target_value === 0) return 0;
    return Math.min((goal.current_value / goal.target_value) * 100, 100);
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-green-600';
    if (percentage >= 75) return 'bg-blue-600';
    if (percentage >= 50) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return null;
  };

  const getPerformanceBadge = (score) => {
    if (score >= 90) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 75) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Fair</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading team management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
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
                <h1 className="text-2xl font-bold">Enhanced Team Management</h1>
                <p className="text-sm text-muted-foreground">Goals, coaching, and performance tracking</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user?.email}</span>
              <Button variant="outline" onClick={logout}>Logout</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-6 flex gap-3">
          <Button onClick={() => setShowGoalModal(true)} className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Set New Goal
          </Button>
          <Button onClick={() => setShowCoachingModal(true)} variant="outline" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Schedule Coaching
          </Button>
          <Button onClick={() => setShowAssignCallModal(true)} variant="outline" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Assign Call
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="coaching">Coaching</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Team Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Team Members</p>
                      <p className="text-2xl font-bold">{teamMembers.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Goals</p>
                      <p className="text-2xl font-bold">
                        {teamGoals.filter(g => g.status === 'active').length}
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Coaching Sessions</p>
                      <p className="text-2xl font-bold">
                        {coachingSessions.filter(s => s.status === 'scheduled').length}
                      </p>
                    </div>
                    <MessageSquare className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Performance</p>
                      <p className="text-2xl font-bold">
                        {teamMembers.length > 0
                          ? Math.round(
                              teamMembers.reduce((acc, m) => acc + (m.performance_score || 0), 0) /
                                teamMembers.length
                            )
                          : 0}
                        %
                      </p>
                    </div>
                    <Award className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Team Members List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members
                </CardTitle>
                <CardDescription>Performance overview and quick actions</CardDescription>
              </CardHeader>
              <CardContent>
                {teamMembers.length > 0 ? (
                  <div className="space-y-4">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-semibold text-blue-600">
                                {member.name?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-semibold">{member.name}</h4>
                              <p className="text-sm text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getPerformanceBadge(member.performance_score || 0)}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/team-member/${member.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Calls This Month</p>
                            <p className="text-lg font-semibold">{member.calls_count || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Avg Duration</p>
                            <p className="text-lg font-semibold">
                              {member.avg_call_duration
                                ? `${Math.round(member.avg_call_duration / 60)}m`
                                : '0m'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Quality Score</p>
                            <p className="text-lg font-semibold">{member.quality_score || 0}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Goals Met</p>
                            <p className="text-lg font-semibold">
                              {member.goals_met || 0}/{member.total_goals || 0}
                            </p>
                          </div>
                        </div>

                        {member.current_goal && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs text-muted-foreground">Current Goal Progress</p>
                              <span className="text-xs font-medium">
                                {member.current_goal.current_value || 0}/{member.current_goal.target_value || 0}
                              </span>
                            </div>
                            <Progress
                              value={getGoalProgress(member.current_goal)}
                              className="h-2"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No team members found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Team Goals
                    </CardTitle>
                    <CardDescription>Track individual and team goals</CardDescription>
                  </div>
                  <Button onClick={() => setShowGoalModal(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Goal
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {teamGoals.length > 0 ? (
                  <div className="space-y-4">
                    {teamGoals.map((goal) => (
                      <div key={goal.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">
                                {goal.member_name} - {goal.goal_type.charAt(0).toUpperCase() + goal.goal_type.slice(1)} Goal
                              </h4>
                              <Badge className={
                                goal.status === 'active'
                                  ? 'bg-blue-100 text-blue-800'
                                  : goal.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }>
                                {goal.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{goal.description}</p>
                          </div>
                          <Badge variant="outline" className="capitalize">{goal.timeframe}</Badge>
                        </div>

                        <div className="mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-muted-foreground">Progress</span>
                            <span className="text-sm font-medium">
                              {goal.current_value || 0} / {goal.target_value} ({Math.round(getGoalProgress(goal))}%)
                            </span>
                          </div>
                          <Progress
                            value={getGoalProgress(goal)}
                            className={`h-2 ${getProgressColor(getGoalProgress(goal))}`}
                          />
                        </div>

                        {goal.deadline && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Deadline: {new Date(goal.deadline).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="mb-2">No goals set yet</p>
                    <p className="text-sm">Create goals to track team performance</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Coaching Tab */}
          <TabsContent value="coaching" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Coaching Sessions
                    </CardTitle>
                    <CardDescription>Schedule and track coaching sessions</CardDescription>
                  </div>
                  <Button onClick={() => setShowCoachingModal(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Schedule Session
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {coachingSessions.length > 0 ? (
                  <div className="space-y-4">
                    {coachingSessions.map((session) => (
                      <div key={session.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{session.topic}</h4>
                              <Badge className={
                                session.status === 'scheduled'
                                  ? 'bg-blue-100 text-blue-800'
                                  : session.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }>
                                {session.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {session.member_name} with {session.coach_name}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              Scheduled: {new Date(session.scheduled_date).toLocaleDateString()}
                            </span>
                          </div>
                          {session.follow_up_date && (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>
                                Follow-up: {new Date(session.follow_up_date).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>

                        {session.notes && (
                          <div className="p-3 bg-gray-50 rounded text-sm">
                            <p className="font-medium mb-1">Notes:</p>
                            <p className="text-muted-foreground">{session.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="mb-2">No coaching sessions scheduled</p>
                    <p className="text-sm">Schedule sessions to support team development</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Trends
                </CardTitle>
                <CardDescription>Track team performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                {performanceTrends.length > 0 ? (
                  <div className="space-y-6">
                    {teamMembers.map((member) => {
                      const memberTrend = performanceTrends.find(t => t.member_id === member.id);
                      if (!memberTrend) return null;

                      return (
                        <div key={member.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold">{member.name}</h4>
                            {getPerformanceBadge(memberTrend.current_score || 0)}
                          </div>

                          <div className="grid grid-cols-4 gap-4">
                            <div className="p-3 bg-gray-50 rounded">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs text-muted-foreground">Calls</p>
                                {getTrendIcon(memberTrend.calls_trend)}
                              </div>
                              <p className="text-lg font-semibold">{memberTrend.total_calls || 0}</p>
                              <p className="text-xs text-muted-foreground">
                                {memberTrend.calls_trend > 0 ? '+' : ''}
                                {memberTrend.calls_trend || 0}% vs last period
                              </p>
                            </div>

                            <div className="p-3 bg-gray-50 rounded">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs text-muted-foreground">Quality</p>
                                {getTrendIcon(memberTrend.quality_trend)}
                              </div>
                              <p className="text-lg font-semibold">{memberTrend.avg_quality || 0}%</p>
                              <p className="text-xs text-muted-foreground">
                                {memberTrend.quality_trend > 0 ? '+' : ''}
                                {memberTrend.quality_trend || 0}% vs last period
                              </p>
                            </div>

                            <div className="p-3 bg-gray-50 rounded">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs text-muted-foreground">Duration</p>
                                {getTrendIcon(memberTrend.duration_trend)}
                              </div>
                              <p className="text-lg font-semibold">
                                {Math.round((memberTrend.avg_duration || 0) / 60)}m
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {memberTrend.duration_trend > 0 ? '+' : ''}
                                {memberTrend.duration_trend || 0}% vs last period
                              </p>
                            </div>

                            <div className="p-3 bg-gray-50 rounded">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs text-muted-foreground">Goals Met</p>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </div>
                              <p className="text-lg font-semibold">
                                {memberTrend.goals_met || 0}/{memberTrend.total_goals || 0}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {Math.round(((memberTrend.goals_met || 0) / (memberTrend.total_goals || 1)) * 100)}% completion
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="mb-2">No trend data available</p>
                    <p className="text-sm">Performance trends will appear as data is collected</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Create New Goal</CardTitle>
              <CardDescription>Set a goal for a team member</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="member">Team Member</Label>
                  <select
                    id="member"
                    value={newGoal.member_id}
                    onChange={(e) => setNewGoal({ ...newGoal, member_id: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  >
                    <option value="">Select a member...</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="goalType">Goal Type</Label>
                  <select
                    id="goalType"
                    value={newGoal.goal_type}
                    onChange={(e) => setNewGoal({ ...newGoal, goal_type: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  >
                    <option value="calls">Total Calls</option>
                    <option value="quality">Quality Score</option>
                    <option value="duration">Avg Duration</option>
                    <option value="conversion">Conversion Rate</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="targetValue">Target Value</Label>
                  <Input
                    id="targetValue"
                    type="number"
                    placeholder="e.g., 100"
                    value={newGoal.target_value}
                    onChange={(e) => setNewGoal({ ...newGoal, target_value: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="timeframe">Timeframe</Label>
                  <select
                    id="timeframe"
                    value={newGoal.timeframe}
                    onChange={(e) => setNewGoal({ ...newGoal, timeframe: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Brief description..."
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowGoalModal(false);
                  setNewGoal({
                    member_id: '',
                    goal_type: 'calls',
                    target_value: '',
                    timeframe: 'monthly',
                    description: ''
                  });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateGoal}>Create Goal</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Schedule Coaching Modal */}
      {showCoachingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Schedule Coaching Session</CardTitle>
              <CardDescription>Plan a coaching session with a team member</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="coachMember">Team Member</Label>
                  <select
                    id="coachMember"
                    value={newCoaching.member_id}
                    onChange={(e) => setNewCoaching({ ...newCoaching, member_id: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  >
                    <option value="">Select a member...</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Call quality improvement"
                    value={newCoaching.topic}
                    onChange={(e) => setNewCoaching({ ...newCoaching, topic: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="scheduledDate">Scheduled Date</Label>
                  <Input
                    id="scheduledDate"
                    type="datetime-local"
                    value={newCoaching.scheduled_date}
                    onChange={(e) => setNewCoaching({ ...newCoaching, scheduled_date: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="followUpDate">Follow-up Date</Label>
                  <Input
                    id="followUpDate"
                    type="date"
                    value={newCoaching.follow_up_date}
                    onChange={(e) => setNewCoaching({ ...newCoaching, follow_up_date: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    placeholder="Session notes and objectives..."
                    value={newCoaching.notes}
                    onChange={(e) => setNewCoaching({ ...newCoaching, notes: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md min-h-[100px]"
                  />
                </div>
              </div>
            </CardContent>
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCoachingModal(false);
                  setNewCoaching({
                    member_id: '',
                    topic: '',
                    notes: '',
                    scheduled_date: '',
                    follow_up_date: ''
                  });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleScheduleCoaching}>Schedule</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
