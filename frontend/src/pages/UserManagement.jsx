import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'
import { UserPlus, Trash2, Edit, Mail } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { getFriendlyError } from '@/lib/friendlyErrors'

export default function UserManagement() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showNewUser, setShowNewUser] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'user',
    is_active: true
  })

  useEffect(() => {
    // Check if user is admin
    if (user && user.role !== 'admin') {
      navigate('/dashboard')
      return
    }
    fetchUsers()
  }, [user])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await api.getUsers()
      setUsers(data.users || [])
    } catch (err) {
      setError(getFriendlyError('loadUsers', err))
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.full_name || !newUser.password) {
      alert('Please fill in all required fields')
      return
    }

    if (newUser.password.length < 8) {
      alert('Password must be at least 8 characters')
      return
    }

    try {
      await api.createUser(newUser)
      alert(`User created successfully!\n\nEmail: ${newUser.email}\nPassword: ${newUser.password}\n\nPlease save these credentials securely.`)
      setShowNewUser(false)
      setNewUser({
        email: '',
        full_name: '',
        password: '',
        role: 'user',
        is_active: true
      })
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create user')
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    try {
      await api.updateUser(editingUser.id, {
        full_name: editingUser.full_name,
        role: editingUser.role,
        is_active: editingUser.is_active
      })
      alert('User updated successfully')
      setEditingUser(null)
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update user')
    }
  }

  const handleDeleteUser = async (userId, userEmail) => {
    if (userId === user.id) {
      alert('You cannot delete your own account')
      return
    }

    if (!confirm(`Are you sure you want to delete user: ${userEmail}?\n\nThis action cannot be undone.`)) {
      return
    }

    try {
      await api.deleteUser(userId)
      alert('User deleted successfully')
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user')
    }
  }

  const handleResetPassword = async (userId, userEmail) => {
    const newPassword = prompt(`Enter new password for ${userEmail} (min 8 characters):`)
    if (!newPassword) return

    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters')
      return
    }

    try {
      await api.resetUserPassword(userId, newPassword)
      alert(`Password reset successfully!\n\nNew Password: ${newPassword}\n\nPlease save this securely.`)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reset password')
    }
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setNewUser({ ...newUser, password })
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading && !users.length) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6CA8C2] mx-auto"></div>
            <p className="mt-4 text-[#2A2A2A]/70 font-light">Loading users...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold font-serif text-[#31543A]">User Management</h1>
            <p className="text-[#2A2A2A]/70 font-light">Manage team members and access</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Main Card */}
        <Card className="glass-card rounded-2xl border-gray-100">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="font-serif text-[#31543A]">Team Members ({users.length})</CardTitle>
                <CardDescription className="font-light text-[#2A2A2A]/70">Invite and manage users in your organization</CardDescription>
              </div>
              <Button onClick={() => setShowNewUser(!showNewUser)} className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                {showNewUser ? 'Cancel' : 'Add User'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {/* New User Form */}
            {showNewUser && (
              <Card className="mb-6 bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-lg">Create New User</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="new_email">Email *</Label>
                      <Input
                        id="new_email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        placeholder="user@company.com"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="new_name">Full Name *</Label>
                      <Input
                        id="new_name"
                        value={newUser.full_name}
                        onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                        placeholder="John Smith"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="new_password">Password * (min 8 characters)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="new_password"
                          type="text"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          placeholder="Enter password"
                          required
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={generatePassword}
                        >
                          Generate
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="new_role">Role</Label>
                      <Select
                        value={newUser.role}
                        onValueChange={(val) => setNewUser({ ...newUser, role: val })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-600 mt-1">
                        Admins can manage users and settings
                      </p>
                    </div>
                  </div>

                  <Button onClick={handleCreateUser} className="w-full">
                    Create User
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Users Table */}
            {users.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <UserPlus className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-semibold">No users yet</p>
                <p className="text-sm">Click "Add User" to invite team members</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          {editingUser?.id === u.id ? (
                            <Input
                              value={editingUser.full_name}
                              onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                              className="w-40"
                            />
                          ) : (
                            u.full_name
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{u.email}</TableCell>
                        <TableCell>
                          {editingUser?.id === u.id ? (
                            <Select
                              value={editingUser.role}
                              onValueChange={(val) => setEditingUser({ ...editingUser, role: val })}
                            >
                              <SelectTrigger className="w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                              u.role === 'admin' ? 'bg-[#C89A8F]/10 text-[#C89A8F]' : 'bg-[#6CA8C2]/10 text-[#6CA8C2]'
                            }`}>
                              {u.role}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingUser?.id === u.id ? (
                            <Select
                              value={editingUser.is_active ? 'active' : 'inactive'}
                              onValueChange={(val) => setEditingUser({ ...editingUser, is_active: val === 'active' })}
                            >
                              <SelectTrigger className="w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              u.is_active ? 'bg-[#3F8A84]/10 text-[#3F8A84]' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {u.is_active ? 'Active' : 'Inactive'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{formatDate(u.last_login)}</TableCell>
                        <TableCell className="text-sm text-gray-600">{formatDate(u.created_at)}</TableCell>
                        <TableCell>
                          {editingUser?.id === u.id ? (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleUpdateUser}>
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingUser(null)}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingUser(u)}
                                title="Edit user"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleResetPassword(u.id, u.email)}
                                title="Reset password"
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                              {u.id !== user.id && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteUser(u.id, u.email)}
                                  className="text-red-600 hover:text-red-700"
                                  title="Delete user"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {users.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> When you create a new user, save their credentials securely. Users can change their password after logging in through Settings.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </DashboardLayout>
  )
}
