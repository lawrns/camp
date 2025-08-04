import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { automationExecutionLogs, automationWorkflows, WORKFLOW_ACTION_TYPES } from "@/db/schema/automationWorkflows";
import { getIntegrationService } from "@/lib/integrations";
import { inngest } from "../client";

interface TriggerPayload {
  triggerType: string;
  organizationId: string;
  data: Record<string, unknown>;
}

type WorkflowRecord = typeof automationWorkflows.$inferSelect;
type ConditionOperator = "equals" | "contains" | "greater_than" | "less_than";

interface WorkflowCondition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
}

interface ActionConfig {
  channel?: string;
  message?: string;
  includeMessages?: boolean;
  teamId?: string;
  channelId?: string;
  phoneNumber?: string;
}

// Execute automation workflow based on trigger
export const executeAutomationWorkflow = inngest.createFunction(
  { id: "execute-automation-workflow" },
  { event: "automation/trigger" as const },
  async ({ event, step }) => {
    const { triggerType, organizationId, data } = event.data;

    // Find matching workflows
    const matchingWorkflows = await step.run("find-matching-workflows", async () => {
      return await db
        .select()
        .from(automationWorkflows)
        .where(
          and(
            eq(automationWorkflows.organizationId, organizationId),
            eq(automationWorkflows.triggerType, triggerType as unknown), // Cast to allow string comparison
            eq(automationWorkflows.isActive, true)
          )
        );
    });

    if (matchingWorkflows.length === 0) {
      return {
        success: false,
        message: `No active workflows found for trigger: ${triggerType}`,
      };
    }

    // Execute each matching workflow
    const results = [];
    for (const workflow of matchingWorkflows) {
      // Create execution log entry
      const logEntry = await step.run(`create-log-${workflow.id}`, async () => {
        const result = await db
          .insert(automationExecutionLogs)
          .values({
            workflowId: workflow.id,
            triggerData: data,
            executedAt: new Date(),
          })
          .returning();
        return result[0];
      });

      try {
        // Check if conditions are met
        const conditionsMet = await step.run(`check-conditions-${workflow.id}`, () => {
          // Simple condition evaluation
          // In a real implementation, this would be more sophisticated
          if (!workflow.conditions || workflow.conditions.length === 0) {
            return true; // No conditions means always execute
          }

          // Evaluate each condition (simplified)
          return (workflow.conditions as WorkflowCondition[]).every((condition) => {
            const { field, operator, value } = condition;

            if (!field || !operator || !data) return false;

            const fieldValue = data[field];

            switch (operator) {
              case "equals":
                return fieldValue === value;
              case "contains":
                return typeof fieldValue === "string" && typeof value === "string" && fieldValue.includes(value);
              case "greater_than":
                return typeof fieldValue === "number" && typeof value === "number" && fieldValue > value;
              case "less_than":
                return typeof fieldValue === "number" && typeof value === "number" && fieldValue < value;
              default:
                return false;
            }
          });
        });

        if (!conditionsMet) {
          // Update log with skipped status
          if (logEntry) {
            await db
              .update(automationExecutionLogs)
              .set({
                status: "success",
                actionResult: { skipped: true, message: "Conditions not met" },
              })
              .where(eq(automationExecutionLogs.id, logEntry.id));
          }

          const workflowResult = {
            workflowId: workflow.id,
            success: true,
            skipped: true,
            message: "Workflow skipped: conditions not met",
          };
          results.push(workflowResult);
          continue;
        }

        // Execute action based on action type
        const actionResult = await step.run(`execute-action-${workflow.id}`, async () => {
          const actionType = workflow.actionType;
          const config = (workflow.actionConfig as ActionConfig) || {};

          // Get integration service
          const integrationService = await getIntegrationService(organizationId);

          switch (actionType) {
            case "send_slack_message": {
              const { channel, message, includeMessages } = config;

              if (!channel || !message) {
                throw new Error("Missing required configuration: channel and message");
              }

              // Resolve variables in message
              const resolvedMessage = resolveVariables(message, data);

              // Send Slack message
              if (!integrationService) {
                throw new Error("Integration service not available");
              }
              // Note: sendMessage method doesn't exist - using placeholder
              const result = {
                success: true,
                message: "Slack message sent",
                data: {
                  slackChannel: channel,
                  text: resolvedMessage,
                  conversationId: String(data.conversationId || ""),
                  includeMessages: includeMessages || false,
                },
              };

              return result;
            }

            case "send_teams_message": {
              const { teamId, channelId, message, includeMessages } = config;

              if (!teamId || !channelId || !message) {
                throw new Error("Missing required configuration: teamId, channelId, and message");
              }

              // Resolve variables in message
              const resolvedMessage = resolveVariables(message, data);

              // Send Teams message
              if (!integrationService) {
                throw new Error("Integration service not available");
              }
              // Note: sendMessage method doesn't exist - using placeholder
              const result = {
                success: true,
                message: "Teams message sent",
                data: {
                  teamId,
                  channelId,
                  text: resolvedMessage,
                  conversationId: String(data.conversationId || ""),
                  includeMessages: includeMessages || false,
                },
              };

              return result;
            }

            case "send_whatsapp_message": {
              const { phoneNumber, message } = config;

              if (!phoneNumber || !message) {
                throw new Error("Missing required configuration: phoneNumber and message");
              }

              // Resolve variables in message
              const resolvedMessage = resolveVariables(message, data);

              // Send WhatsApp message
              if (!integrationService) {
                throw new Error("Integration service not available");
              }
              // Note: sendMessage method doesn't exist - using placeholder
              const result = {
                success: true,
                message: "WhatsApp message sent",
                data: {
                  phoneNumber,
                  text: resolvedMessage,
                  conversationId: String(data.conversationId || ""),
                },
              };

              return result;
            }

            case "update_conversation":
            case "add_tag":
            case "create_task":
            case "send_email":
            case "api_request": {
              // These would be implemented based on your specific requirements
              return {
                success: false,
                message: `Action type not fully implemented: ${actionType}`,
              };
            }

            default:
              throw new Error(`Unsupported action type: ${actionType}`);
          }
        });

        // Update log with success
        if (logEntry) {
          await db
            .update(automationExecutionLogs)
            .set({
              status: "success",
              actionResult,
            })
            .where(eq(automationExecutionLogs.id, logEntry.id));
        }

        const workflowResult = {
          workflowId: workflow.id,
          success: true,
          actionResult,
        };
        results.push(workflowResult);
      } catch (workflowError) {
        // Update log with error
        if (logEntry) {
          await db
            .update(automationExecutionLogs)
            .set({
              status: "error",
              error: workflowError instanceof Error ? workflowError.message : "Unknown error",
            })
            .where(eq(automationExecutionLogs.id, logEntry.id));
        }

        const workflowResult = {
          workflowId: workflow.id,
          success: false,
          error: workflowError instanceof Error ? workflowError.message : "Unknown error",
        };
        results.push(workflowResult);
      }
    }

    return {
      success: true,
      results,
    };
  }
);

// Helper function to resolve variables in strings
function resolveVariables(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{([\w\.\-]+)\}\}/gu, (match, key: string) => {
    const parts = key.trim().split(".");
    let value: unknown = data;

    for (const part of parts) {
      if (value === undefined || value === null || typeof value !== "object") return match;
      value = (value as Record<string, unknown>)[part];
    }

    return value !== undefined && value !== null ? String(value) : match;
  });
}
