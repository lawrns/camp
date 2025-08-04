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
- heading "404" [level=1]
- heading "This page could not be found." [level=2]
```