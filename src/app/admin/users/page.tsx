'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  tenantId: string | null;
  tenantName?: string;
  lastLoginAt: string | null;
  createdAt: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch('/api/users');
        const data = await response.json();
        if (data.data) {
          setUsers(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  const getRoleBadge = (role: string) => {
    return role === 'super_admin' ? (
      <Badge variant="default" className="bg-purple-500/10 text-purple-500 hover:bg-purple-500/20">
        Super Admin
      </Badge>
    ) : (
      <Badge variant="secondary">Client Admin</Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
        Active
      </Badge>
    ) : (
      <Badge variant="default" className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
        Inactive
      </Badge>
    );
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <Card className="mt-8">
          <div className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 w-full animate-pulse rounded bg-muted" />
              ))}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="mt-2 text-muted-foreground">Manage all users across the platform</p>
        </div>
        <Button onClick={() => router.push('/admin/users/new')}>Create User</Button>
      </div>

      <Card className="mt-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.fullName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{user.tenantName || 'N/A'}</TableCell>
                  <TableCell>{getStatusBadge(user.isActive)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(user.lastLoginAt)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(user.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
