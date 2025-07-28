"use client";

import { useEffect } from "react";

// ... other imports

export default function ClientHomePage(): JSX.Element {
  // ... existing code

  useEffect(() => {
    // TEMPORARY: Disable widget to stop errors
    const ENABLE_WIDGET = false; // Set to false to disable widget

    if (!ENABLE_WIDGET) {

      return;
    }

    // Original widget code here (but won't run)
    // ...
  }, []);

  // ... rest of component
}
