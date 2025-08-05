"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Bot as Bot, User } from "lucide-react";
import { Icon } from "@/lib/ui/Icon";

// Simple chat bubble component for homepage demo
export default function HandoverChatBubble() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const chatSteps = [
    {
      type: "visitor",
      message: "Hi, I need help with my order",
      delay: 0,
    },
    {
      type: "ai",
      message: "I'd be happy to help! Can you provide your order number?",
      delay: 1500,
    },
    {
      type: "visitor",
      message: "It's #12345, but I have a complex issue...",
      delay: 3000,
    },
    {
      type: "handover",
      message: "Connecting you to a human agent...",
      delay: 4500,
    },
    {
      type: "agent",
      message: "Hi! I'm Sarah, I'll help you with your complex issue.",
      delay: 6000,
    },
  ];

  useEffect(() => {
    setIsVisible(true);

    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < chatSteps.length - 1) {
          return prev + 1;
        } else {
          // Reset animation
          setTimeout(() => setCurrentStep(0), 2000);
          return prev;
        }
      });
    }, 1500);

    return () => clearInterval(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="bg-gray-900 mx-auto max-w-md rounded-ds-xl border border-gray-700 shadow-2xl overflow-hidden terminal-window">
      {/* Terminal header with macOS-style controls */}
      <div className="bg-gray-800 px-4 py-3 flex items-center gap-ds-2 border-b border-gray-700">
        <div className="flex items-center gap-ds-2">
          <div className="h-3 w-3 rounded-ds-full bg-red-500 hover:bg-red-400 transition-colors cursor-pointer"></div>
          <div className="h-3 w-3 rounded-ds-full bg-yellow-500 hover:bg-yellow-400 transition-colors cursor-pointer"></div>
          <div className="h-3 w-3 rounded-ds-full bg-green-500 hover:bg-green-400 transition-colors cursor-pointer"></div>
        </div>
        <div className="flex-1 text-center">
          <span className="text-sm text-gray-300 font-mono">customer-support.terminal</span>
        </div>
        <div className="w-14"></div> {/* Spacer for centering */}
      </div>
      
      {/* Terminal content */}
      <div className="p-spacing-md bg-gray-900 text-green-400 font-mono text-sm">
        <div className="min-h-[200px] space-y-spacing-sm">
          {chatSteps.slice(0, currentStep + 1).map((step, index) => (
            <div key={index} className="chat-message-fade-in">
              {/* Terminal prompt */}
              <div className="flex items-start gap-ds-2">
                <span className="text-green-400 font-mono">$</span>
                <div className="flex-1">
                  <div className="text-gray-300">
                    <span className="text-blue-400">
                      {step.type === "visitor" ? "customer" : step.type === "ai" ? "ai-bot" : step.type === "agent" ? "agent" : "system"}
                    </span>
                    <span className="text-foreground-muted">@support</span>
                    <span className="text-gray-400">:</span>
                    <span className="text-yellow-400">~</span>
                    <span className="text-gray-400">$ </span>
                    <span className="text-white">{step.message}</span>
                  </div>
                  
                  {/* Typing indicator for current step */}
                  {index === currentStep && index < chatSteps.length - 1 && (
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-green-400">{'>'}</span>
                      <div className="flex gap-1">
                        <div className="h-1 w-1 animate-pulse rounded-ds-full bg-green-400"></div>
                        <div className="h-1 w-1 animate-pulse rounded-ds-full bg-green-400" style={{ animationDelay: "0.2s" }}></div>
                        <div className="h-1 w-1 animate-pulse rounded-ds-full bg-green-400" style={{ animationDelay: "0.4s" }}></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* AI Confidence Indicator */}
        {currentStep >= 2 && currentStep < 4 && (
          <div className="mt-4 border-t border-gray-700 pt-3">
            <div className="flex items-center justify-between text-tiny">
              <span className="text-yellow-400 font-mono">AI_CONFIDENCE:</span>
              <span className="text-orange-400 font-mono">
                {currentStep === 2 ? "0.65" : "0.45"} - HANDOVER_TRIGGERED
              </span>
            </div>
            <div className="mt-2 h-1 w-full rounded-ds-full bg-gray-700">
              <div
                className={`h-1 rounded-ds-full transition-all duration-1000 ${
                  currentStep === 2 ? "w-[65%] bg-yellow-400" : "w-[45%] bg-orange-400"
                }`}
              ></div>
            </div>
          </div>
        )}

        {/* Status indicator */}
        <div className="mt-4 border-t border-gray-700 pt-3">
          <div className="flex items-center gap-ds-2 text-tiny font-mono">
            <span className="text-gray-400">STATUS:</span>
            <div
              className={`h-2 w-2 rounded-ds-full ${
                currentStep < 3 ? "bg-purple-400" : currentStep === 3 ? "bg-orange-400" : "bg-green-400"
              }`}
            ></div>
            <span className={`${
              currentStep < 3 ? "text-purple-400" : currentStep === 3 ? "text-orange-400" : "text-green-400"
            }`}>
              {currentStep < 3 ? "AI_ACTIVE" : currentStep === 3 ? "TRANSFERRING" : "HUMAN_AGENT"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add CSS for unique chat message animation to avoid conflicts
const styles = `
  @keyframes chat-message-fade-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .chat-message-fade-in {
    animation: chat-message-fade-in 0.5s ease-out;
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
