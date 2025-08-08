// DEPRECATED: Use specific imports instead of barrel imports for better tree-shaking
// Example: import { Button } from "@/components/ui/button" instead of from "@/components"

// Only keep essential re-exports for UI components (point to components/ui)
export { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
export { Badge } from "@/components/ui/badge";
export { Button } from "@/components/ui/button";
export { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
export { Input } from "@/components/ui/input";
export { Textarea } from "@/components/ui/textarea";

