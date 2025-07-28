import { useCallback, useEffect } from "react";

interface Hotkey {
  key: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: () => void;
}

export function useHotkeys(hotkeys: Hotkey[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      hotkeys.forEach(({ key, meta, ctrl, shift, alt, callback }) => {
        const isMetaPressed = meta ? event.metaKey || event.ctrlKey : true;
        const isCtrlPressed = ctrl ? event.ctrlKey : true;
        const isShiftPressed = shift ? event.shiftKey : true;
        const isAltPressed = alt ? event.altKey : true;

        if (
          event.key.toLowerCase() === key.toLowerCase() &&
          isMetaPressed &&
          isCtrlPressed &&
          isShiftPressed &&
          isAltPressed
        ) {
          event.preventDefault();
          callback();
        }
      });
    },
    [hotkeys]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
