# Page snapshot

```yaml
- alert
- navigation:
  - link "Campfire logo Campfire":
    - /url: /
    - img "Campfire logo"
    - text: Campfire
  - button
  - link "Features":
    - /url: /features
  - link "Pricing":
    - /url: /pricing
  - link "Docs":
    - /url: /docs
  - link "Sign In":
    - /url: /login
  - link "Get Started":
    - /url: /register
- text: 🔥
- heading "Welcome back" [level=1]
- paragraph: Sign in to your Campfire account
- text: 📧 Email address
- textbox "📧 Email address": jam@jam.com
- text: 🔒 Password
- textbox "🔒 Password": password123
- button "👁️"
- button "Sign in to Campfire"
- paragraph: Secure login powered by Campfire
```