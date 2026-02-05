import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import DashboardLayout from '@/components/DashboardLayout'

export default function AdminSetupRequests() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [activating, setActivating] = useState(false)

  useEffect(() => {
    // Check if user is admin
    if (user && user.role !== 'admin') {
      navigate('/dashboard')
      return
    }
    fetchRequests()
  }, [statusFilter, user])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const data = await api.getSetupRequests(statusFilter)
      setRequests(data.requests || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load setup requests')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (requestId) => {
    try {
      const data = await api.getSetupRequestDetail(requestId)
      setSelectedRequest(data)
      setAdminNotes(data.admin_notes || '')
      setAssignedTo(data.assigned_to || '')
      setNewStatus(data.status || '')
      setShowDetail(true)
    } catch (err) {
      alert('Failed to load request details')
    }
  }

  const handleUpdateRequest = async () => {
    if (!selectedRequest) return

    try {
      await api.updateSetupRequest(selectedRequest.id, {
        status: newStatus,
        admin_notes: adminNotes,
        assigned_to: assignedTo
      })
      alert('Request updated successfully')
      setShowDetail(false)
      fetchRequests()
    } catch (err) {
      alert('Failed to update request')
    }
  }

  const handleActivateAccount = async () => {
    if (!selectedRequest) return
    if (!confirm(`Create account for ${selectedRequest.company_name}?`)) return

    setActivating(true)
    try {
      const result = await api.activateSetupRequest(selectedRequest.id)
      alert(`Account activated! Login: ${result.email}\nPassword: ${result.temp_password}`)
      setShowDetail(false)
      fetchRequests()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to activate account')
    } finally {
      setActivating(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'payment_received': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-purple-100 text-purple-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  if (loading && !requests.length) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading setup requests...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Setup Requests</h1>
            <p className="text-gray-600">Manage customer onboarding requests</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Filter by Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Requests</SelectItem>
                    <SelectItem value="pending">Pending Payment</SelectItem>
                    <SelectItem value="payment_received">Payment Received</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={fetchRequests}>Refresh</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Requests ({requests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {requests.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                No setup requests found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request ID</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-mono text-sm">{request.request_id}</TableCell>
                        <TableCell className="font-semibold">{request.company_name}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{request.contact_email}</div>
                            <div className="text-gray-600">{request.contact_phone}</div>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{request.selected_plan}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(request.status)}`}>
                            {request.status.replace('_', ' ')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${
                            request.payment_status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {request.payment_status}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{request.assigned_to || '-'}</TableCell>
                        <TableCell className="text-sm text-gray-600">{formatDate(request.created_at)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(request.id)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Modal */}
        {showDetail && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedRequest.company_name}</h2>
                    <p className="text-gray-600">Request ID: {selectedRequest.request_id}</p>
                  </div>
                  <Button variant="outline" onClick={() => setShowDetail(false)}>Close</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Company Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Company Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div><span className="font-semibold">Name:</span> {selectedRequest.company_name}</div>
                      <div><span className="font-semibold">Industry:</span> {selectedRequest.industry || 'N/A'}</div>
                      <div><span className="font-semibold">Size:</span> {selectedRequest.company_size || 'N/A'}</div>
                      <div><span className="font-semibold">Website:</span> {selectedRequest.website || 'N/A'}</div>
                    </CardContent>
                  </Card>

                  {/* Contact Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div><span className="font-semibold">Name:</span> {selectedRequest.contact_name}</div>
                      <div><span className="font-semibold">Email:</span> {selectedRequest.contact_email}</div>
                      <div><span className="font-semibold">Phone:</span> {selectedRequest.contact_phone}</div>
                      <div><span className="font-semibold">Title:</span> {selectedRequest.contact_title || 'N/A'}</div>
                    </CardContent>
                  </Card>

                  {/* Technical Details */}
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Technical Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedRequest.technical_details && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div><span className="font-semibold">Phone System:</span> {selectedRequest.technical_details.phone_system_type}</div>
                          <div><span className="font-semibold">PBX IP:</span> {selectedRequest.technical_details.pbx_ip || 'N/A'}</div>
                          <div><span className="font-semibold">PBX Port:</span> {selectedRequest.technical_details.pbx_port || 'N/A'}</div>
                          <div><span className="font-semibold">Call Volume:</span> {selectedRequest.technical_details.current_call_volume || 'N/A'}</div>
                          <div><span className="font-semibold">Network:</span> {selectedRequest.technical_details.network_type || 'N/A'}</div>
                          <div><span className="font-semibold">Admin Access:</span> {selectedRequest.technical_details.has_pbx_admin_access || 'N/A'}</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Plan & Features */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Plan & Features</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div><span className="font-semibold">Selected Plan:</span> <span className="capitalize">{selectedRequest.selected_plan}</span></div>
                      {selectedRequest.features_requested && (
                        <div className="mt-3">
                          <p className="font-semibold mb-1">Requested Features:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {selectedRequest.features_requested.transcription_needed && <li>AI Transcription</li>}
                            {selectedRequest.features_requested.sentiment_analysis_needed && <li>Sentiment Analysis</li>}
                            {selectedRequest.features_requested.real_time_alerts && <li>Real-time Alerts</li>}
                            {selectedRequest.features_requested.integration_slack && <li>Slack Integration</li>}
                            {selectedRequest.features_requested.integration_email && <li>Email Notifications</li>}
                            {selectedRequest.features_requested.export_reports && <li>Export & Reporting</li>}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Requirements */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Additional Requirements</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div>
                        <span className="font-semibold">Specific Requirements:</span>
                        <p className="mt-1 text-gray-700">{selectedRequest.specific_requirements || 'None'}</p>
                      </div>
                      <div>
                        <span className="font-semibold">Compliance:</span>
                        <p className="mt-1 text-gray-700">{selectedRequest.compliance_requirements || 'None'}</p>
                      </div>
                      <div><span className="font-semibold">Preferred Setup Date:</span> {selectedRequest.preferred_setup_date || 'Flexible'}</div>
                    </CardContent>
                  </Card>

                  {/* Admin Actions */}
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Admin Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="status">Status</Label>
                          <Select value={newStatus} onValueChange={setNewStatus}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending Payment</SelectItem>
                              <SelectItem value="payment_received">Payment Received</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="assigned">Assigned To</Label>
                          <Input
                            id="assigned"
                            value={assignedTo}
                            onChange={(e) => setAssignedTo(e.target.value)}
                            placeholder="Team member name"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="notes">Admin Notes</Label>
                        <textarea
                          id="notes"
                          className="w-full min-h-[100px] p-2 border rounded-md"
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Internal notes about this setup..."
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button onClick={handleUpdateRequest}>Update Request</Button>

                        {selectedRequest.status === 'payment_received' && !selectedRequest.tenant_id && (
                          <Button
                            onClick={handleActivateAccount}
                            disabled={activating}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {activating ? 'Activating...' : 'Activate Account'}
                          </Button>
                        )}

                        {selectedRequest.tenant_id && (
                          <div className="flex items-center text-green-600 font-semibold">
                            ✓ Account Activated
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </DashboardLayout>
  )
}
