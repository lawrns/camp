# Page snapshot

```yaml
- alert
- main:
  - heading "Welcome back, jam!" [level=1]
  - img
  - textbox "Search conversations..."
  - button "Filters":
    - img
    - text: Filters
  - button "Sort":
    - img
    - text: Sort
  - text: ms connected
  - button:
    - img
  - button "Keyboard shortcuts":
    - img
  - button "New Conversation":
    - img
    - text: New Conversation
  - button "All"
  - button "Unread"
  - button "Unassigned"
  - button "AI Managed"
  - button "Human Managed"
  - img
  - heading "No conversations yet" [level=3]
  - paragraph: New conversations will appear here when customers reach out
  - img
  - heading "Start the conversation" [level=3]
  - paragraph: Choose a conversation from the list to start messaging with your customers.
  - heading "Memory Monitor" [level=3]:
    - img
    - text: Memory Monitor
  - text: Memory Usage 0.9%
  - progressbar
  - text: Used 33.47 MB Total 37.77 MB Limit 3.5 GB
```