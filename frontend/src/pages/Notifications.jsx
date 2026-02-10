import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'
import { Bell } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'

export default function Notifications() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('notifications')
  const [showNewRule, setShowNewRule] = useState(false)

  // New rule form
  const [newRule, setNewRule] = useState({
    name: '',
    trigger_type: 'negative_sentiment',
    threshold_value: 0.3,
    notify_email: false,
    notify_slack: false,
    notify_inapp: true
  })

  useEffect(() => {
    fetchNotifications()
    fetchRules()
  }, [])

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications(1, false)
      setNotifications(data.notifications || [])
    } catch (err) {
      console.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const fetchRules = async () => {
    try {
      const data = await api.getNotificationRules()
      setRules(data.rules || [])
    } catch (err) {
      console.error('Failed to load notification rules')
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.markNotificationRead(notificationId)
      setNotifications(prev => prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      ))
    } catch (err) {
      alert('Failed to mark notification as read')
    }
  }

  const handleNotificationClick = (notification) => {
    if (notification.cdr_id) {
      navigate(`/call/${notification.cdr_id}`)
    }
  }

  const handleCreateRule = async () => {
    if (!newRule.name || !newRule.trigger_type) {
      alert('Please fill in all required fields')
      return
    }

    try {
      await api.createNotificationRule(newRule)
      alert('Notification rule created!')
      setShowNewRule(false)
      setNewRule({
        name: '',
        trigger_type: 'negative_sentiment',
        threshold_value: 0.3,
        notify_email: false,
        notify_slack: false,
        notify_inapp: true
      })
      fetchRules()
    } catch (err) {
      alert('Failed to create notification rule')
    }
  }

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'alert': return '🚨'
      case 'warning': return '⚠️'
      case 'info': return 'ℹ️'
      default: return '🔔'
    }
  }

  const getTriggerDescription = (trigger) => {
    switch (trigger) {
      case 'negative_sentiment': return 'Alert when negative sentiment detected'
      case 'high_call_volume': return 'Alert on high call volume spike'
      case 'low_answer_rate': return 'Alert when answer rate drops'
      case 'missed_call_spike': return 'Alert on missed call spike'
      case 'keyword_detected': return 'Alert on keyword detection'
      case 'long_call_duration': return 'Alert on unusually long calls'
      default: return trigger
    }
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold font-serif text-[#31543A]">Notifications</h1>
            <p className="text-[#2A2A2A]/70 font-light">Manage alerts and notification rules</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'notifications' ? 'default' : 'outline'}
            onClick={() => setActiveTab('notifications')}
          >
            Notifications ({notifications.filter(n => !n.read).length})
          </Button>
          <Button
            variant={activeTab === 'rules' ? 'default' : 'outline'}
            onClick={() => setActiveTab('rules')}
          >
            Alert Rules ({rules.length})
          </Button>
        </div>

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <Card className="glass-card rounded-2xl border-gray-100">
            <CardHeader>
              <CardTitle className="font-serif text-[#31543A]">Your Notifications</CardTitle>
              <CardDescription className="font-light text-[#2A2A2A]/70">View and manage your notifications</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6CA8C2] mx-auto mb-4"></div>
                  <p className="text-[#2A2A2A]/70 font-light">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12 text-gray-600">
                  <Bell className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-semibold">No notifications yet</p>
                  <p className="text-sm">You'll see alerts here when important events occur</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        !notification.read
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-white hover:bg-gray-50'
                      } ${notification.cdr_id ? 'cursor-pointer' : ''}`}
                      onClick={() => notification.cdr_id && handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                {formatTime(notification.created_at)}
                              </p>
                            </div>
                            {!notification.read && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMarkAsRead(notification.id)
                                }}
                              >
                                Mark Read
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <div className="space-y-6">
            <Card className="glass-card rounded-2xl border-gray-100">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="font-serif text-[#31543A]">Notification Rules</CardTitle>
                    <CardDescription className="font-light text-[#2A2A2A]/70">Configure when to receive alerts</CardDescription>
                  </div>
                  {user && user.role === 'admin' && (
                    <Button onClick={() => setShowNewRule(!showNewRule)}>
                      {showNewRule ? 'Cancel' : 'New Rule'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {showNewRule && (
                  <Card className="mb-6 bg-gray-50">
                    <CardHeader>
                      <CardTitle className="text-lg">Create New Rule</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="rule_name">Rule Name</Label>
                        <Input
                          id="rule_name"
                          value={newRule.name}
                          onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                          placeholder="e.g., Alert on Negative Calls"
                        />
                      </div>

                      <div>
                        <Label htmlFor="trigger_type">Trigger Type</Label>
                        <Select
                          value={newRule.trigger_type}
                          onValueChange={(val) => setNewRule({ ...newRule, trigger_type: val })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="negative_sentiment">Negative Sentiment</SelectItem>
                            <SelectItem value="high_call_volume">High Call Volume</SelectItem>
                            <SelectItem value="low_answer_rate">Low Answer Rate</SelectItem>
                            <SelectItem value="missed_call_spike">Missed Call Spike</SelectItem>
                            <SelectItem value="keyword_detected">Keyword Detection</SelectItem>
                            <SelectItem value="long_call_duration">Long Call Duration</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="threshold">Threshold</Label>
                        <Input
                          id="threshold"
                          type="number"
                          step="0.1"
                          value={newRule.threshold_value}
                          onChange={(e) => setNewRule({ ...newRule, threshold_value: parseFloat(e.target.value) })}
                          placeholder="0.3"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          For sentiment: 0.0-1.0 (lower = more negative)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Notification Channels</Label>
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={newRule.notify_inapp}
                              onChange={(e) => setNewRule({ ...newRule, notify_inapp: e.target.checked })}
                              className="rounded"
                            />
                            <span className="text-sm">In-App Notification</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={newRule.notify_email}
                              onChange={(e) => setNewRule({ ...newRule, notify_email: e.target.checked })}
                              className="rounded"
                            />
                            <span className="text-sm">Email</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={newRule.notify_slack}
                              onChange={(e) => setNewRule({ ...newRule, notify_slack: e.target.checked })}
                              className="rounded"
                            />
                            <span className="text-sm">Slack</span>
                          </label>
                        </div>
                      </div>

                      <Button onClick={handleCreateRule} className="w-full">
                        Create Rule
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {rules.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    <p>No notification rules configured</p>
                    {user && user.role === 'admin' && (
                      <p className="text-sm mt-2">Click "New Rule" to create your first alert rule</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rules.map((rule) => (
                      <div
                        key={rule.id}
                        className="p-4 border rounded-lg bg-white"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-900">{rule.name}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {getTriggerDescription(rule.trigger_type)}
                            </p>
                            {rule.threshold_value && (
                              <p className="text-xs text-gray-500 mt-1">
                                Threshold: {rule.threshold_value}
                              </p>
                            )}
                            <div className="flex gap-2 mt-2">
                              {rule.notify_inapp && (
                                <span className="px-2 py-1 bg-[#6CA8C2]/10 text-[#6CA8C2] text-xs rounded-full">
                                  In-App
                                </span>
                              )}
                              {rule.notify_email && (
                                <span className="px-2 py-1 bg-[#C89A8F]/10 text-[#C89A8F] text-xs rounded-full">
                                  Email
                                </span>
                              )}
                              {rule.notify_slack && (
                                <span className="px-2 py-1 bg-[#3F8A84]/10 text-[#3F8A84] text-xs rounded-full">
                                  Slack
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            rule.enabled ? 'bg-[#3F8A84]/10 text-[#3F8A84]' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {rule.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      </div>
    </DashboardLayout>
  )
}
