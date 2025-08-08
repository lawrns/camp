/**
 * Tree Shaking Configuration
 *
 * Optimized imports to enable better tree shaking
 */

// Optimized utility imports
export { debounce, throttle, chunk } from "lodash-es";

// Optimized icon imports
import { MessageCircle, Send, Smile, X, AlertTriangle } from "lucide-react";

export { MessageCircle as ChatCircle, Send as PaperPlaneTilt, Smile as Smiley, X, AlertTriangle as Warning } from "lucide-react";

// Optimized UI component imports
export { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default {};
