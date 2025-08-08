# Page snapshot

```yaml
- alert
- img "Campfire logo"
- heading "Welcome to Campfire" [level=3]
- paragraph: Sign in to your account to access the AI-powered support platform
- text: Email
- textbox "Email": jam@jam.com
- text: Password
- textbox "Password": password123
- alert: Failed to fetch
- button "Sign In"
- text: Don't have an account?
- link "Sign up":
  - /url: /register
```