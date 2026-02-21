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
  BarChart3,
  Clock,
  Globe,
  Sparkles,
  Users,
  Headphones,
  TrendingUp,
  Target,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-surface">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <PhoneCall className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">AudiaPro</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/login">
                <Button className="gap-2">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-24 sm:px-8 lg:px-12">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 opacity-30" />
        <div className="mx-auto max-w-7xl relative">
          <div className="text-center">
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20" variant="outline">
              <Sparkles className="mr-2 h-3 w-3" />
              Powered by Advanced AI
            </Badge>
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Turn Every Phone Call Into
              <br />
              <span className="bg-gradient-to-r from-primary via-primary to-orange-400 bg-clip-text text-transparent">
                Actionable Intelligence
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-xl text-muted-foreground leading-relaxed">
              AI-powered call recording and analytics that automatically transcribes, analyzes, and extracts
              valuable insights from every customer conversation.{' '}
              <span className="font-semibold text-foreground">Works with virtually any phone system.</span>
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="gap-2 h-12 px-8 text-base w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base w-full sm:w-auto">
                Schedule Demo
              </Button>
            </div>

            {/* Compatibility Badge */}
            <div className="mt-12 flex flex-col items-center gap-3">
              <p className="text-sm text-muted-foreground">Compatible with:</p>
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-primary" /> Grandstream
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-primary" /> 3CX
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-primary" /> FreePBX
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-primary" /> Asterisk
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-primary" /> RingCentral
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-primary" /> Cisco
                </span>
                <span className="font-semibold text-foreground">+ Many More</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-24 grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">98%</div>
              <div className="mt-2 text-sm text-muted-foreground">Transcription Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">&lt;60s</div>
              <div className="mt-2 text-sm text-muted-foreground">Average Processing Time</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">100%</div>
              <div className="mt-2 text-sm text-muted-foreground">Cloud-Based & Secure</div>
            </div>
          </div>
        </div>
      </section>

      {/* Universal Integration Section */}
      <section className="px-6 py-24 sm:px-8 lg:px-12 bg-surface/50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <Badge className="mb-4" variant="secondary">
              <Globe className="mr-2 h-3 w-3" />
              Universal Compatibility
            </Badge>
            <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
              Works With Almost Any Phone System
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              No matter what phone system you use, AudiaPro connects seamlessly.
              On-premise, cloud-based, or hybrid - we've got you covered.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <PhoneCall className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Cloud PBX Systems</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  RingCentral, Vonage, 8x8, Nextiva, GoToConnect, and more
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>On-Premise PBX</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Grandstream UCM, Cisco, Avaya, Mitel, Panasonic, and more
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Open Source PBX</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  FreePBX, 3CX, Asterisk, FusionPBX, VitalPBX, and more
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground">
              Don't see your system?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Contact us - we can integrate with virtually any phone system
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <Badge className="mb-4" variant="secondary">
              Simple Setup
            </Badge>
            <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
              How AudiaPro Works
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Get up and running in minutes with our simple 3-step process
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-3">
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground mb-6">
                  1
                </div>
                <h3 className="text-xl font-bold mb-3">Connect Your Phone System</h3>
                <p className="text-muted-foreground">
                  Simple webhook integration with your PBX. Works on-premise or cloud.
                  We provide step-by-step guides for all major systems.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground mb-6">
                  2
                </div>
                <h3 className="text-xl font-bold mb-3">Calls Process Automatically</h3>
                <p className="text-muted-foreground">
                  Every call is automatically transcribed and analyzed by AI.
                  No manual work required - just make calls as usual.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground mb-6">
                  3
                </div>
                <h3 className="text-xl font-bold mb-3">Get Instant Insights</h3>
                <p className="text-muted-foreground">
                  View transcripts, sentiment analysis, keywords, action items, and more
                  in your beautiful dashboard. Export reports anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-24 sm:px-8 lg:px-12 bg-surface/50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
              Everything You Need to Understand Your Calls
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Powerful features designed to help you make better business decisions
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<MessageSquare className="h-6 w-6" />}
              title="AI Transcription"
              description="98%+ accurate transcripts with speaker identification and timestamps. Powered by Deepgram."
            />
            <FeatureCard
              icon={<Brain className="h-6 w-6" />}
              title="Sentiment Analysis"
              description="Understand customer emotions throughout the call. Track positive, negative, and neutral moments."
            />
            <FeatureCard
              icon={<Target className="h-6 w-6" />}
              title="Keyword Tracking"
              description="Automatically detect important keywords, topics, and phrases relevant to your business."
            />
            <FeatureCard
              icon={<FileText className="h-6 w-6" />}
              title="Smart Summaries"
              description="Get AI-generated summaries of every call with action items and key points extracted."
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="Visual Analytics"
              description="Beautiful charts and dashboards showing call volume, sentiment trends, and performance metrics."
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="Compliance Monitoring"
              description="Ensure calls meet compliance requirements. Track script adherence and flag violations."
            />
            <FeatureCard
              icon={<TrendingUp className="h-6 w-6" />}
              title="Performance Insights"
              description="Measure agent performance with talk ratios, response times, and customer satisfaction scores."
            />
            <FeatureCard
              icon={<Headphones className="h-6 w-6" />}
              title="Call Playback"
              description="Listen to recordings with synchronized transcripts. Skip to important moments instantly."
            />
            <FeatureCard
              icon={<Clock className="h-6 w-6" />}
              title="Real-Time Processing"
              description="Calls are transcribed and analyzed within 60 seconds. Get insights immediately."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="px-6 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
              Simple, Transparent Pricing
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Pay only for what you use. No hidden fees, no surprises.
            </p>
          </div>

          <Card className="border-2 border-primary/20 bg-card shadow-lg">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl">Professional Plan</CardTitle>
              <CardDescription className="text-base">
                Everything you need to analyze your calls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="text-center">
                <div className="text-5xl font-bold">
                  $349<span className="text-2xl text-muted-foreground">/mo</span>
                </div>
                <p className="mt-2 text-muted-foreground">Base platform fee</p>
              </div>

              <div className="text-center border-t border-border pt-6">
                <div className="text-3xl font-bold">
                  + $0.10<span className="text-xl text-muted-foreground">/call</span>
                </div>
                <p className="mt-2 text-muted-foreground">Per call analyzed</p>
              </div>

              <div className="space-y-4 border-t border-border pt-8">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Unlimited users and team members</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>All AI features included</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Connect multiple phone systems</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Real-time transcription & analysis</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Advanced analytics dashboards</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>CSV & PDF export</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Secure cloud storage</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Email support & setup assistance</span>
                </div>
              </div>

              <div className="pt-6">
                <Link href="/login" className="block">
                  <Button size="lg" className="w-full gap-2 h-12">
                    Start Free Trial
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  14-day free trial • No credit card required
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground">
              Need enterprise features or custom pricing?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Contact our sales team
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-24 sm:px-8 lg:px-12 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
            Ready to Transform Your Call Data Into Insights?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Join businesses already using AudiaPro to understand their customers better,
            improve performance, and make data-driven decisions.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="gap-2 h-12 px-8 w-full sm:w-auto">
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-12 px-8 w-full sm:w-auto">
              Schedule a Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 px-6 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <PhoneCall className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold">AudiaPro</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                AI-powered call analytics platform that helps businesses understand their customer
                conversations and make better decisions.
              </p>
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">By BotMakers Inc.</p>
                <p className="text-sm text-muted-foreground">
                  Building intelligent solutions for modern businesses
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/login" className="hover:text-foreground transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-foreground transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-foreground transition-colors">
                    Integrations
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-foreground transition-colors">
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/login" className="hover:text-foreground transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-foreground transition-colors">
                    Contact Sales
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-foreground transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-border/40 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} BotMakers Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur hover:border-primary/20 transition-colors">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-primary/10 p-3 text-primary">{icon}</div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
