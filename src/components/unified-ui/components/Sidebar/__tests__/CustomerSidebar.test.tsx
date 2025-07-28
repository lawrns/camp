import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FlameCustomerSidebar } from "../CustomerSidebar";

// Mock conversation data
const mockConversation = {
  id: "1",
  customer_name: "John Doe",
  customer_email: "john@example.com",
  customer_phone: "+1234567890",
  customer_avatar: "avatar.jpg",
  customer_status: "online",
  customer_location: "New York, USA",
  customer_timezone: "EST",
  customer_company: "Tech Corp",
  customer_title: "Developer",
  customer_website: "techcorp.com",
  created_at: "2024-01-01",
  last_message_at: "2024-01-02",
  total_conversations: 5,
  average_response_time: "2h",
  satisfaction_score: 4.5,
  notes: "VIP customer",
  tags: ["premium", "active"],
  ip_address: "192.168.1.1",
  device_type: "mobile",
  browser: "Chrome",
  os: "iOS",
  screen_width: 375,
  screen_height: 812,
};

describe("FlameCustomerSidebar", () => {
  it("renders customer information correctly", () => {
    render(<FlameCustomerSidebar conversation={mockConversation} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("+1234567890")).toBeInTheDocument();
    expect(screen.getByText("Tech Corp • Developer")).toBeInTheDocument();
  });

  it("displays online status indicator", () => {
    render(<FlameCustomerSidebar conversation={mockConversation} />);

    expect(screen.getByText("online")).toBeInTheDocument();
  });

  it("renders location and time information", () => {
    render(<FlameCustomerSidebar conversation={mockConversation} />);

    expect(screen.getByText("New York, USA")).toBeInTheDocument();
  });

  it("shows technical information", () => {
    render(<FlameCustomerSidebar conversation={mockConversation} />);

    expect(screen.getByText("mobile Device")).toBeInTheDocument();
    expect(screen.getByText("Chrome on iOS")).toBeInTheDocument();
    expect(screen.getByText("375×812")).toBeInTheDocument();
  });
});
