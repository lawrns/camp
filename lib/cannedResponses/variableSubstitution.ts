/**
 * Variable Substitution for Canned Responses
 *
 * This module handles the substitution of variables in canned response templates
 * with actual data from conversation context, user info, and organization settings.
 */

export interface VariableContext {
  customer?: {
    name?: string;
    email?: string;
    id?: string;
  };
  agent?: {
    name?: string;
    email?: string;
    id?: string;
  };
  conversation?: {
    id?: string;
    ticketNumber?: string;
    createdAt?: string;
  };
  organization?: {
    name?: string;
    supportEmail?: string;
    website?: string;
  };
}

export interface Variable {
  key: string;
  label: string;
  description: string;
  category: "customer" | "agent" | "conversation" | "organization";
  example: string;
}

// Available variables for canned responses
export const AVAILABLE_VARIABLES: Variable[] = [
  // Customer variables
  {
    key: "customerName",
    label: "Customer Name",
    description: "The customer's full name",
    category: "customer",
    example: "John Smith",
  },
  {
    key: "customerEmail",
    label: "Customer Email",
    description: "The customer's email address",
    category: "customer",
    example: "john@example.com",
  },
  {
    key: "customerId",
    label: "Customer ID",
    description: "The customer's unique identifier",
    category: "customer",
    example: "cust_123456",
  },
  // Agent variables
  {
    key: "agentName",
    label: "Agent Name",
    description: "Your name as the agent",
    category: "agent",
    example: "Sarah Johnson",
  },
  {
    key: "agentEmail",
    label: "Agent Email",
    description: "Your email address",
    category: "agent",
    example: "sarah@company.com",
  },
  // Conversation variables
  {
    key: "conversationId",
    label: "Conversation ID",
    description: "The unique conversation identifier",
    category: "conversation",
    example: "conv_789012",
  },
  {
    key: "ticketNumber",
    label: "Ticket Number",
    description: "The support ticket number",
    category: "conversation",
    example: "#12345",
  },
  // Organization variables
  {
    key: "companyName",
    label: "Company Name",
    description: "Your organization's name",
    category: "organization",
    example: "Campfire Support",
  },
  {
    key: "supportEmail",
    label: "Support Email",
    description: "Your organization's support email",
    category: "organization",
    example: "support@company.com",
  },
];

/**
 * Extract variables from a template string
 * @param template - The template string containing {variableName} placeholders
 * @returns Array of variable names found in the template
 */
export function extractVariables(template: string): string[] {
  const regex = /\{(\w+)\}/g;
  const variables: string[] = [];
  let match;

  while ((match = regex.exec(template)) !== null) {
    if (match[1] && !variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
}

/**
 * Substitute variables in a template with actual values
 * @param template - The template string containing {variableName} placeholders
 * @param context - The context object containing variable values
 * @returns Object with substituted text and any unresolved variables
 */
export function substituteVariables(
  template: string,
  context: VariableContext
): {
  text: string;
  unresolvedVariables: string[];
} {
  const unresolvedVariables: string[] = [];

  const text = template.replace(/\{(\w+)\}/g, (match, variableName) => {
    // Try to resolve the variable from context
    const value = resolveVariable(variableName, context);

    if (value === null) {
      unresolvedVariables.push(variableName);
      // Return the original placeholder highlighted for manual completion
      return `[[${match}]]`;
    }

    return value;
  });

  return { text, unresolvedVariables };
}

/**
 * Resolve a single variable from context
 * @param variableName - The name of the variable to resolve
 * @param context - The context object containing variable values
 * @returns The resolved value or null if not found
 */
function resolveVariable(variableName: string, context: VariableContext): string | null {
  switch (variableName) {
    // Customer variables
    case "customerName":
      return context.customer?.name || null;
    case "customerEmail":
      return context.customer?.email || null;
    case "customerId":
      return context.customer?.id || null;

    // Agent variables
    case "agentName":
      return context.agent?.name || null;
    case "agentEmail":
      return context.agent?.email || null;

    // Conversation variables
    case "conversationId":
      return context.conversation?.id || null;
    case "ticketNumber":
      return context.conversation?.ticketNumber || null;

    // Organization variables
    case "companyName":
      return context.organization?.name || null;
    case "supportEmail":
      return context.organization?.supportEmail || null;

    // Default case for unknown variables
    default:
      return null;
  }
}

/**
 * Validate a template for syntax errors
 * @param template - The template string to validate
 * @returns Object indicating if template is valid and any error messages
 */
export function validateTemplate(template: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for unclosed brackets
  const openBrackets = (template.match(/\{/g) || []).length;
  const closeBrackets = (template.match(/\}/g) || []).length;

  if (openBrackets !== closeBrackets) {
    errors.push("Template has mismatched brackets");
  }

  // Check for empty variables
  if (template.includes("{}")) {
    errors.push("Template contains empty variable placeholders");
  }

  // Check for nested brackets
  if (/\{[^}]*\{/.test(template)) {
    errors.push("Template contains nested brackets");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get variable suggestions based on partial input
 * @param partial - The partial variable name being typed
 * @returns Array of matching variable suggestions
 */
export function getVariableSuggestions(partial: string): Variable[] {
  if (!partial) return AVAILABLE_VARIABLES;

  const lowerPartial = partial.toLowerCase();
  return AVAILABLE_VARIABLES.filter(
    (variable) =>
      variable.key.toLowerCase().includes(lowerPartial) || variable.label.toLowerCase().includes(lowerPartial)
  );
}
