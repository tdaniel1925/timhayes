'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2 } from 'lucide-react';

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  status: string;
  billingPlan: string;
  billingEmail: string | null;
  createdAt: string;
}

interface UserInfo {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export default function SettingsPage() {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailReportFreq, setEmailReportFreq] = useState<string>('');
  const [emailReportAddress, setEmailReportAddress] = useState<string>('');
  const [keywords, setKeywords] = useState<Array<{ id: string; keyword: string; category: string }>>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [newKeywordCategory, setNewKeywordCategory] = useState('Custom');
  const [showKeywordDialog, setShowKeywordDialog] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();

        // Get current user
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // Get user details
          const { data: userData } = await supabase
            .from('users')
            .select('id, email, full_name, role, tenant_id')
            .eq('id', session.user.id)
            .single();

          if (userData) {
            setUser({
              id: userData.id,
              email: userData.email,
              fullName: userData.full_name,
              role: userData.role,
            });

            // Get tenant details
            if (userData.tenant_id) {
              const { data: tenantData } = await supabase
                .from('tenants')
                .select('id, name, slug, status, billing_plan, billing_email, created_at')
                .eq('id', userData.tenant_id)
                .single();

              if (tenantData) {
                setTenant({
                  id: tenantData.id,
                  name: tenantData.name,
                  slug: tenantData.slug,
                  status: tenantData.status,
                  billingPlan: tenantData.billing_plan,
                  billingEmail: tenantData.billing_email,
                  createdAt: tenantData.created_at,
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
      suspended: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
      cancelled: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
    };

    return (
      <Badge variant="default" className={variants[status] || ''}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <div className="mt-8 space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 w-full animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-muted-foreground">Manage your account and organization settings</p>
      </div>

      <div className="mt-8 space-y-6">
        {/* Organization Info */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Information</CardTitle>
            <CardDescription>Details about your organization account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">Organization Name</Label>
                <p className="mt-1 font-medium">{tenant?.name || 'Not available'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Slug</Label>
                <p className="mt-1 font-mono text-sm">{tenant?.slug || 'Not available'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <div className="mt-1">
                  {tenant?.status ? getStatusBadge(tenant.status) : 'Not available'}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Billing Plan</Label>
                <p className="mt-1 font-medium capitalize">{tenant?.billingPlan || 'Not available'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Billing Email</Label>
                <p className="mt-1 text-sm">{tenant?.billingEmail || 'Not set'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Member Since</Label>
                <p className="mt-1 text-sm">
                  {tenant?.createdAt
                    ? new Date(tenant.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Not available'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Profile */}
        <Card>
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">Full Name</Label>
                <p className="mt-1 font-medium">{user?.fullName || 'Not available'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="mt-1 text-sm">{user?.email || 'Not available'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Role</Label>
                <Badge variant="secondary" className="mt-1 capitalize">
                  {user?.role?.replace('_', ' ') || 'Not available'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Email Reports</CardTitle>
            <CardDescription>Schedule automated analytics reports to your inbox</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="report-freq">Report Frequency</Label>
                <Select value={emailReportFreq} onValueChange={setEmailReportFreq}>
                  <SelectTrigger id="report-freq">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="report-email">Email Address</Label>
                <Input
                  id="report-email"
                  type="email"
                  placeholder="your@email.com"
                  value={emailReportAddress}
                  onChange={(e) => setEmailReportAddress(e.target.value)}
                />
              </div>
            </div>
            <Button>Save Email Report Settings</Button>
          </CardContent>
        </Card>

        {/* Custom Keywords */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Custom Keywords</CardTitle>
                <CardDescription>Track specific keywords in your call transcripts</CardDescription>
              </div>
              <Dialog open={showKeywordDialog} onOpenChange={setShowKeywordDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Keyword
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Custom Keyword</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="keyword">Keyword or Phrase</Label>
                      <Input
                        id="keyword"
                        placeholder="e.g., pricing, refund policy"
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={newKeywordCategory} onValueChange={setNewKeywordCategory}>
                        <SelectTrigger id="category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sales">Sales</SelectItem>
                          <SelectItem value="Support">Support</SelectItem>
                          <SelectItem value="Compliance">Compliance</SelectItem>
                          <SelectItem value="Custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={() => {
                        if (newKeyword.trim()) {
                          setKeywords([
                            ...keywords,
                            {
                              id: Date.now().toString(),
                              keyword: newKeyword,
                              category: newKeywordCategory,
                            },
                          ]);
                          setNewKeyword('');
                          setShowKeywordDialog(false);
                        }
                      }}
                      className="w-full"
                    >
                      Add Keyword
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {keywords.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keywords.map((kw) => (
                    <TableRow key={kw.id}>
                      <TableCell className="font-medium">{kw.keyword}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{kw.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setKeywords(keywords.filter((k) => k.id !== kw.id))}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                No custom keywords configured
              </p>
            )}
          </CardContent>
        </Card>

        {/* PBX Connections */}
        <Card>
          <CardHeader>
            <CardTitle>PBX Connections</CardTitle>
            <CardDescription>Manage your phone system integrations</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Contact your administrator to configure PBX connections
            </p>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-500/20">
          <CardHeader>
            <CardTitle className="text-red-500">Danger Zone</CardTitle>
            <CardDescription>Irreversible account actions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Contact support to cancel your account or make major changes
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
