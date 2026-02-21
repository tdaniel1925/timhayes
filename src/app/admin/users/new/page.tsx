'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

export default function NewUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    role: 'client_admin',
    tenantId: '',
    password: '', // Leave empty to auto-generate
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoadingTenants(true);
      const response = await fetch('/api/tenants');
      const data = await response.json();

      if (data.data) {
        setTenants(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch tenants:', err);
    } finally {
      setLoadingTenants(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validate role and tenant
    if (formData.role === 'client_admin' && !formData.tenantId) {
      setError('Please select a tenant for client admin users');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          fullName: formData.fullName,
          role: formData.role,
          tenantId: formData.role === 'client_admin' ? formData.tenantId : null,
          password: formData.password || undefined, // Auto-generate if empty
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error.message);
      } else if (data.data) {
        // Success
        if (data.data.tempPasswordSent) {
          setSuccess(
            `User created successfully! A welcome email with temporary password has been sent to ${formData.email}`
          );
        } else {
          setSuccess('User created successfully!');
        }

        // Clear form
        setFormData({
          email: '',
          fullName: '',
          role: 'client_admin',
          tenantId: '',
          password: '',
        });

        // Redirect after 3 seconds
        setTimeout(() => {
          router.push('/admin/users');
        }, 3000);
      }
    } catch (err) {
      setError('Failed to create user. Please try again.');
      console.error('Failed to create user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear tenant when switching to super_admin
    if (name === 'role' && value === 'super_admin') {
      setFormData((prev) => ({ ...prev, tenantId: '' }));
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/admin/users">
          <Button variant="outline" size="sm">
            ← Back to Users
          </Button>
        </Link>
      </div>

      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">Create User</h1>
        <p className="mt-2 text-muted-foreground">
          Add a new user to the system
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-green-500">
            {success}
          </div>
        )}

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="user@company.com"
                  required
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  User will use this email to log in
                </p>
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="John Doe"
                  required
                  disabled={loading}
                />
              </div>

              {/* Role */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium">
                  Role *
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  disabled={loading}
                >
                  <option value="client_admin">Client Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formData.role === 'super_admin'
                    ? 'Super admins can manage all tenants and system settings'
                    : 'Client admins can only access their organization\'s data'}
                </p>
              </div>

              {/* Tenant (only for client_admin) */}
              {formData.role === 'client_admin' && (
                <div>
                  <label htmlFor="tenantId" className="block text-sm font-medium">
                    Tenant *
                  </label>
                  <select
                    id="tenantId"
                    name="tenantId"
                    value={formData.tenantId}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    disabled={loading || loadingTenants}
                  >
                    <option value="">Select a tenant...</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name} ({tenant.slug})
                      </option>
                    ))}
                  </select>
                  {loadingTenants && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Loading tenants...
                    </p>
                  )}
                </div>
              )}

              {/* Password (optional) */}
              <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-4">
                <h3 className="font-semibold">Password</h3>
                <p className="text-sm text-muted-foreground">
                  Leave blank to auto-generate a secure temporary password. The user will
                  receive an email with login instructions.
                </p>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium">
                    Custom Password (optional)
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Leave blank for auto-generated"
                    minLength={8}
                    disabled={loading}
                  />
                  {formData.password && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Minimum 8 characters
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create User'}
                </Button>
                <Link href="/admin/users">
                  <Button type="button" variant="outline" disabled={loading}>
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
