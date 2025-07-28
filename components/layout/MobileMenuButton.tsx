"use client";

import { useState } from "react";

export function MobileMenuButton() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    const sidebar = document.querySelector(".dashboard-sidebar");
    if (sidebar) {
      sidebar.classList.toggle("mobile-open");
      setIsOpen(!isOpen);
    }
  };

  return (
    <button
      className="mobile-menu-button rounded-ds-lg p-spacing-sm hover:bg-muted"
      onClick={toggleSidebar}
      aria-label="Toggle mobile menu"
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}
