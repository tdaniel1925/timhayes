'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NewTenantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    billingEmail: '',
    monthlyRateCents: '34900', // $349.00
    perCallRateCents: '10', // $0.10
    notes: '',
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          billingEmail: formData.billingEmail || null,
          monthlyRateCents: parseInt(formData.monthlyRateCents),
          perCallRateCents: parseInt(formData.perCallRateCents),
          notes: formData.notes || null,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error.message);
      } else if (data.data) {
        // Success - redirect to tenant detail page
        router.push(`/admin/tenants/${data.data.id}`);
      }
    } catch (err) {
      setError('Failed to create tenant. Please try again.');
      console.error('Failed to create tenant:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Auto-generate slug from name if slug is empty
    if (name === 'name' && !formData.slug) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/admin/tenants">
          <Button variant="outline" size="sm">
            ← Back to Tenants
          </Button>
        </Link>
      </div>

      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">Create Tenant</h1>
        <p className="mt-2 text-muted-foreground">
          Add a new client organization to the system
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Tenant Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium">
                  Company Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Acme Corporation"
                  required
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  The official company name
                </p>
              </div>

              {/* Slug */}
              <div>
                <label htmlFor="slug" className="block text-sm font-medium">
                  Slug *
                </label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="acme-corporation"
                  pattern="[a-z0-9-]+"
                  required
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  URL-friendly identifier (lowercase, no spaces)
                </p>
              </div>

              {/* Billing Email */}
              <div>
                <label htmlFor="billingEmail" className="block text-sm font-medium">
                  Billing Email
                </label>
                <input
                  type="email"
                  id="billingEmail"
                  name="billingEmail"
                  value={formData.billingEmail}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="billing@acme.com"
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Email address for invoices and billing notifications
                </p>
              </div>

              {/* Pricing */}
              <div className="space-y-4 rounded-lg border border-border bg-muted/50 p-4">
                <h3 className="font-semibold">Pricing</h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="monthlyRateCents"
                      className="block text-sm font-medium"
                    >
                      Monthly Rate (cents) *
                    </label>
                    <input
                      type="number"
                      id="monthlyRateCents"
                      name="monthlyRateCents"
                      value={formData.monthlyRateCents}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="34900"
                      min="0"
                      required
                      disabled={loading}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      ${(parseInt(formData.monthlyRateCents || '0') / 100).toFixed(2)}/month
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="perCallRateCents"
                      className="block text-sm font-medium"
                    >
                      Per Call Rate (cents) *
                    </label>
                    <input
                      type="number"
                      id="perCallRateCents"
                      name="perCallRateCents"
                      value={formData.perCallRateCents}
                      onChange={handleChange}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="10"
                      min="0"
                      required
                      disabled={loading}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      ${(parseInt(formData.perCallRateCents || '0') / 100).toFixed(2)}/call
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Additional notes about this tenant..."
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Internal notes (not visible to the tenant)
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Tenant'}
                </Button>
                <Link href="/admin/tenants">
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
