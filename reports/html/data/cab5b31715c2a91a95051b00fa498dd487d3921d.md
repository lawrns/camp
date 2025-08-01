# Page snapshot

```yaml
- alert
- img "Campfire logo"
- heading "Join Campfire" [level=3]
- paragraph: Create your account and start providing AI-powered customer support
- text: Full Name
- textbox "Full Name"
- text: Organization Name
- textbox "Organization Name"
- text: Email
- textbox "Email"
- text: Password
- textbox "Password"
- button "Create Account"
- text: Already have an account?
- link "Sign in":
  - /url: /login
```