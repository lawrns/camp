/**
 * Campfire Simple Widget - Based on Helper's approach
 * Single, clean implementation without over-engineering
 */

(function () {
  "use strict";

  // Prevent multiple initializations
  if (window.Campfire) {
    return;
  }

  // Widget state
  const state = {
    isOpen: false,
    messages: [],
    conversationId: null,
    token: null,
    config: null,
  };

  // Create widget HTML
  function createWidget() {
    // Container
    const container = document.createElement("div");
    container.id = "campfire-widget";
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Chat button
    const button = document.createElement("button");
    button.id = "campfire-widget-button";
    button.style.cssText = `
      width: 60px;
      height: 60px;
      border-radius: 30px;
      background: #8B5CF6;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;
    `;
    button.innerHTML = `
      <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-13h4v6h-4zm0 8h4v2h-4z"/>
      </svg>
    `;
    button.onclick = toggleWidget;

    // Chat window
    const chatWindow = document.createElement("div");
    chatWindow.id = "campfire-widget-window";
    chatWindow.style.cssText = `
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 380px;
      height: 600px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.15);
      display: none;
      flex-direction: column;
      overflow: hidden;
    `;

    // Header
    const header = document.createElement("div");
    header.style.cssText = `
      background: #8B5CF6;
      color: white;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    header.innerHTML = `
      <div>
        <h3 style="margin: 0; font-size: 18px;">Campfire Support</h3>
        <p style="margin: 4px 0 0; font-size: 14px; opacity: 0.9;">We typically reply within minutes</p>
      </div>
      <button onclick="Campfire.close()" style="background: none; border: none; color: white; cursor: pointer; font-size: 24px;">&times;</button>
    `;

    // Messages area
    const messagesArea = document.createElement("div");
    messagesArea.id = "campfire-messages";
    messagesArea.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      background: #F9FAFB;
    `;

    // Input area
    const inputArea = document.createElement("div");
    inputArea.style.cssText = `
      padding: 16px;
      background: white;
      border-top: 1px solid #E5E7EB;
    `;
    inputArea.innerHTML = `
      <form id="campfire-message-form" style="display: flex; gap: 8px;">
        <input 
          id="campfire-message-input" 
          type="text" 
          placeholder="Type your message..." 
          style="flex: 1; padding: 12px; border: 1px solid #E5E7EB; border-radius: 8px; font-size: 14px; outline: none;"
        />
        <button 
          type="submit" 
          style="padding: 12px 20px; background: #8B5CF6; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;"
        >
          Send
        </button>
      </form>
    `;

    // Assemble widget
    chatWindow.appendChild(header);
    chatWindow.appendChild(messagesArea);
    chatWindow.appendChild(inputArea);
    container.appendChild(button);
    container.appendChild(chatWindow);
    document.body.appendChild(container);

    // Handle form submission
    document.getElementById("campfire-message-form").onsubmit = handleSubmit;
  }

  // Toggle widget open/close
  function toggleWidget() {
    state.isOpen = !state.isOpen;
    const window = document.getElementById("campfire-widget-window");
    const button = document.getElementById("campfire-widget-button");

    if (state.isOpen) {
      window.style.display = "flex";
      button.style.transform = "scale(0.8)";
      initializeSession();
    } else {
      window.style.display = "none";
      button.style.transform = "scale(1)";
    }
  }

  // Initialize session (Helper pattern)
  async function initializeSession() {
    if (state.token) return;

    try {
      const response = await fetch("/api/widget/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: window.CAMPFIRE_CONFIG?.organizationId || "default",
          origin: window.location.origin,
        }),
      });

      const data = await response.json();
      state.token = data.token;
      state.config = data.config;

      // Load existing messages if any
      if (data.conversationId) {
        state.conversationId = data.conversationId;
        loadMessages();
      }
    } catch (error) {
      console.error("Failed to initialize session:", error);
    }
  }

  // Send message
  async function handleSubmit(e) {
    e.preventDefault();
    const input = document.getElementById("campfire-message-input");
    const message = input.value.trim();

    if (!message) return;

    // Add message to UI immediately
    addMessage({
      id: Date.now(),
      text: message,
      sender: "user",
      timestamp: new Date(),
    });

    input.value = "";

    try {
      const response = await fetch("/api/widget/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${state.token}`,
        },
        body: JSON.stringify({
          conversationId: state.conversationId,
          message: message,
        }),
      });

      const data = await response.json();

      if (!state.conversationId) {
        state.conversationId = data.conversationId;
      }

      // Add AI response
      if (data.response) {
        addMessage({
          id: Date.now() + 1,
          text: data.response,
          sender: "agent",
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  }

  // Add message to UI
  function addMessage(message) {
    state.messages.push(message);

    const messagesArea = document.getElementById("campfire-messages");
    const messageEl = document.createElement("div");
    messageEl.style.cssText = `
      margin-bottom: 16px;
      display: flex;
      ${message.sender === "user" ? "justify-content: flex-end" : "justify-content: flex-start"}
    `;

    const bubble = document.createElement("div");
    bubble.style.cssText = `
      max-width: 70%;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.5;
      ${
        message.sender === "user"
          ? "background: #8B5CF6; color: white;"
          : "background: white; color: #1F2937; border: 1px solid #E5E7EB;"
      }
    `;
    bubble.textContent = message.text;

    messageEl.appendChild(bubble);
    messagesArea.appendChild(messageEl);
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }

  // Load existing messages
  async function loadMessages() {
    try {
      const response = await fetch(`/api/widget/conversation/${state.conversationId}/messages`, {
        headers: {
          Authorization: `Bearer ${state.token}`,
        },
      });

      const messages = await response.json();
      messages.forEach((msg) => addMessage(msg));
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  }

  // Public API
  window.Campfire = {
    init: function (config) {
      window.CAMPFIRE_CONFIG = config;
      createWidget();
    },
    open: function () {
      if (!state.isOpen) toggleWidget();
    },
    close: function () {
      if (state.isOpen) toggleWidget();
    },
    sendMessage: function (message) {
      document.getElementById("campfire-message-input").value = message;
      handleSubmit(new Event("submit"));
    },
  };

  // Auto-init if config exists
  if (window.CAMPFIRE_CONFIG) {
    window.Campfire.init(window.CAMPFIRE_CONFIG);
  }
})();
