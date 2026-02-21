import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  PhoneCall,
  MessageSquare,
  Brain,
  FileText,
  Shield,
  Zap,
  ArrowRight,
  Check,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-surface">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <Badge className="mb-6" variant="secondary">
              Powered by AI
            </Badge>
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              AI-Powered Call Analytics
              <br />
              <span className="text-primary">for Modern Businesses</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Transform every customer conversation into actionable insights. Automatically transcribe,
              analyze, and extract valuable data from your phone calls with advanced AI technology.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="gap-2">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline">
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">99.9%</p>
              <p className="mt-2 text-sm text-muted-foreground">Transcription Accuracy</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">60s</p>
              <p className="mt-2 text-sm text-muted-foreground">Average Analysis Time</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">24/7</p>
              <p className="mt-2 text-sm text-muted-foreground">Automated Processing</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything You Need to Understand Your Calls
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powerful features designed for sales, support, and compliance teams
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <Card>
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Real-time Transcription</CardTitle>
                <CardDescription>
                  Accurate speech-to-text transcription with speaker identification and timestamps
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 2 */}
            <Card>
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>AI Sentiment Analysis</CardTitle>
                <CardDescription>
                  Understand customer emotions and satisfaction with advanced sentiment detection
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 3 */}
            <Card>
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Keyword Tracking</CardTitle>
                <CardDescription>
                  Track specific keywords and topics across all your conversations automatically
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 4 */}
            <Card>
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Compliance Monitoring</CardTitle>
                <CardDescription>
                  Ensure regulatory compliance with automated script adherence and quality checks
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 5 */}
            <Card>
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Automated Reports</CardTitle>
                <CardDescription>
                  Receive daily, weekly, or monthly analytics reports directly in your inbox
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 6 */}
            <Card>
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <PhoneCall className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Seamless Integration</CardTitle>
                <CardDescription>
                  Works with Grandstream, FreePBX, 3CX, and any system with webhook support
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-surface px-6 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How It Works</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Get started in three simple steps
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            <div className="relative text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
                1
              </div>
              <h3 className="mb-3 text-xl font-semibold">Connect Your Phone System</h3>
              <p className="text-muted-foreground">
                Simple webhook integration with your existing PBX. No complex setup required.
              </p>
            </div>

            <div className="relative text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
                2
              </div>
              <h3 className="mb-3 text-xl font-semibold">Calls Are Automatically Analyzed</h3>
              <p className="text-muted-foreground">
                Our AI transcribes and analyzes every call in real-time, extracting key insights.
              </p>
            </div>

            <div className="relative text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white">
                3
              </div>
              <h3 className="mb-3 text-xl font-semibold">Get Instant Insights</h3>
              <p className="text-muted-foreground">
                Access detailed analytics, sentiment scores, and actionable recommendations instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              One plan with everything you need. No hidden fees.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-lg">
            <Card className="border-primary">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl">Professional</CardTitle>
                <CardDescription>Perfect for growing businesses</CardDescription>
                <div className="mt-6">
                  <span className="text-5xl font-bold">$349</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">+ $0.10 per call analyzed</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {[
                    'Unlimited users',
                    'All features included',
                    'Real-time transcription',
                    'AI sentiment analysis',
                    'Custom keyword tracking',
                    'Compliance monitoring',
                    'Automated reports',
                    'Email support',
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/login" className="mt-6 block">
                  <Button className="w-full" size="lg">
                    Contact Sales
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-surface px-6 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="mb-4 text-lg font-semibold">AudiaPro</h3>
              <p className="text-sm text-muted-foreground">
                AI-powered call recording and analytics for modern businesses.
              </p>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/login" className="hover:text-foreground">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-foreground">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-foreground">
                    Integrations
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground">
                    Privacy
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} BotMakers Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
