# Landing Page Customization Guide

## What's Been Created

Your CallInsight AI landing page is now live with an Apple-inspired design featuring:

✅ **Hero Section** - Eye-catching gradient with clear value proposition
✅ **Features Grid** - 6 feature cards with icons
✅ **How It Works** - 4-step process visualization
✅ **Pricing Section** - 3 pricing tiers with "Most Popular" badge
✅ **CTA Section** - Call-to-action for demos
✅ **Footer** - Professional footer with links
✅ **Responsive Design** - Works perfectly on mobile
✅ **Smooth Animations** - Apple-style hover effects and transitions

## Routes

- **Landing Page**: `https://yourapp.railway.app/`
- **Dashboard**: `https://yourapp.railway.app/dashboard`
- **API Webhook**: `https://yourapp.railway.app/cdr`
- **Health Check**: `https://yourapp.railway.app/health`

## Customization

### 1. Change Company Name

Open `templates/landing.html` and find:

```html
<div class="logo">CallInsight AI</div>
```

Change to your company name.

### 2. Update Hero Text

Find this section:

```html
<h1>Every call. Transcribed.<br>Every insight. Captured.</h1>
<p class="subtitle">Harness the power of AI to transform your phone conversations into actionable business intelligence.</p>
```

Change to your messaging.

### 3. Modify Pricing

The three tiers are:
- **Starter**: $249/month
- **Professional**: $499/month (featured)
- **Enterprise**: $999/month

To change pricing, find:

```html
<div class="pricing-price">$249<span>/mo</span></div>
```

### 4. Update Contact Email

Find:

```html
<a href="mailto:sales@callinsight.ai" class="primary-cta">Schedule a Demo</a>
```

Change `sales@callinsight.ai` to your email.

### 5. Change Colors

At the top of the HTML, find:

```css
:root {
    --primary: #000;
    --secondary: #1d1d1f;
    --accent: #0071e3;  /* Change this for your brand color */
    --text-light: #86868b;
    --bg-light: #fbfbfd;
}
```

### 6. Modify Hero Gradient

Find:

```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

Change to your brand colors. Try these:
- **Blue to Purple**: `#667eea 0%, #764ba2 100%`
- **Ocean**: `#2E3192 0%, #1BFFFF 100%`
- **Sunset**: `#FF416C 0%, #FF4B2B 100%`
- **Forest**: `#134E5E 0%, #71B280 100%`

### 7. Add Your Logo

Replace:

```html
<div class="logo">CallInsight AI</div>
```

With:

```html
<img src="/static/logo.png" alt="Your Company" style="height: 30px;">
```

Then create a `static` folder and add your logo.

### 8. Update Features

Find the features grid section and modify:

```html
<div class="feature-card">
    <div class="feature-icon">🎯</div>
    <h3>Real-Time Transcription</h3>
    <p>Your description here...</p>
</div>
```

Change icons (emojis), titles, and descriptions.

### 9. Modify Footer

Find the footer section and update:
- Company description
- Links
- Copyright year

```html
<div class="footer-bottom">
    &copy; 2026 CallInsight AI. All rights reserved.
</div>
```

## Testing Locally

Before deploying to Railway, test locally:

```bash
python call-analytics-server.py
```

Then visit:
- Landing page: http://localhost:5000/
- Dashboard: http://localhost:5000/dashboard

## Deploy to Railway

After customizing:

1. Commit changes:
   ```bash
   git add .
   git commit -m "Customize landing page"
   git push
   ```

2. Railway will automatically redeploy

3. View your site at your Railway URL

## Professional Touches

### Add Custom Domain

In Railway:
1. Go to **Settings** → **Domains**
2. Add custom domain (e.g., `callinsight.ai`)
3. Update DNS records
4. SSL automatically provisioned

### Add Google Analytics

Before `</head>` in `landing.html`, add:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Add Live Chat (Optional)

Before `</body>`, add your chat widget code:

```html
<!-- Intercom, Drift, or Crisp chat widget -->
<script>
  // Your chat widget code here
</script>
```

### Add Contact Form

Replace the demo email link with a form:

```html
<form action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
  <input type="email" name="email" placeholder="Your email" required>
  <input type="text" name="company" placeholder="Company name">
  <button type="submit">Request Demo</button>
</form>
```

Use [Formspree](https://formspree.io) (free) to handle submissions.

## Design Tips

### Maintain Apple's Aesthetic:
- ✅ **Lots of whitespace** - Don't crowd elements
- ✅ **Large, bold typography** - Make headlines big
- ✅ **Minimal color palette** - Stick to 2-3 colors
- ✅ **High-quality visuals** - Use crisp icons/images
- ✅ **Subtle animations** - Smooth, not flashy
- ✅ **Clear hierarchy** - Guide the eye naturally

### Writing Copy (Apple Style):
- **Short sentences**. Punchy. Impactful.
- **Focus on benefits**, not features
- **Use power words**: Transform, Revolutionize, Empower
- **Create urgency**: Limited time, Exclusive, Early access
- **Be specific**: "Save 10 hours/week" not "Save time"

## Common Customizations

### Change Button Text

Find:

```html
<a href="#pricing" class="primary-cta">Get Started</a>
```

Change to:
- "Start Free Trial"
- "Book a Demo"
- "See Pricing"
- "Request Access"

### Add Testimonials Section

Add before pricing:

```html
<section style="background: var(--bg-light);">
    <h2>Trusted by leading businesses.</h2>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; margin-top: 60px;">
        <div style="background: white; padding: 40px; border-radius: 20px;">
            <p style="font-size: 18px; line-height: 1.6; margin-bottom: 20px;">
                "CallInsight AI has transformed how we handle customer calls. We've reduced response time by 40%."
            </p>
            <strong>— John Doe, CEO of TechCorp</strong>
        </div>
        <!-- Add more testimonials -->
    </div>
</section>
```

### Add Trust Badges

Under the hero:

```html
<div style="margin-top: 60px; opacity: 0.7;">
    <p style="font-size: 14px; color: white; margin-bottom: 20px;">TRUSTED BY</p>
    <div style="display: flex; gap: 40px; justify-content: center;">
        <img src="/static/logo1.png" alt="Company 1" style="height: 30px; filter: brightness(0) invert(1);">
        <img src="/static/logo2.png" alt="Company 2" style="height: 30px; filter: brightness(0) invert(1);">
    </div>
</div>
```

## Next Steps

1. **Customize the content** to match your brand
2. **Update pricing** to your actual tiers
3. **Add your logo** and brand colors
4. **Test on mobile** devices
5. **Add analytics** to track visitors
6. **Set up custom domain** for professional look
7. **Add contact form** to capture leads

## Need Help?

- The landing page is in: `templates/landing.html`
- It's a single HTML file with embedded CSS
- Easy to edit - just find and replace text
- Push to GitHub and Railway auto-deploys

Your landing page is ready to impress! 🚀
