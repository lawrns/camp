import React, { useCallback, useState } from "react";
import { Play, Plus, FloppyDisk as Save, Gear as Settings, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button-unified";
import { Card } from "@/components/unified-ui/components/Card";
import { Input } from "@/components/unified-ui/components/input";
import { Label } from "@/components/unified-ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { Switch } from "@/components/unified-ui/components/switch";
import { Textarea } from "@/components/unified-ui/components/textarea";
import { useWorkflow } from "@/hooks/useWorkflow";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface WorkflowTrigger {
  id: string;
  type: "message_received" | "conversation_idle" | "keyword_match" | "sentiment_change" | "time_based";
  conditions: Array<{
    field: string;
    operator: "equals" | "contains" | "greater_than" | "less_than" | "regex";
    value: any;
  }>;
}

interface WorkflowAction {
  id: string;
  type: "send_message" | "assign_agent" | "add_tag" | "close_conversation" | "notify_slack" | "escalate";
  parameters: Record<string, any>;
  delay?: number;
}

interface WorkflowRule {
  id?: string;
  name: string;
  description?: string;
  enabled: boolean;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  organization_id?: string;
}

export function WorkflowBuilder() {
  const { workflows, createWorkflow, updateWorkflow, deleteWorkflow } = useWorkflow();
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [workflowData, setWorkflowData] = useState<WorkflowRule>({
    name: "",
    description: "",
    enabled: true,
    trigger: {
      id: "trigger-1",
      type: "message_received",
      conditions: [],
    },
    actions: [],
  });

  const handleCreateNew = () => {
    setIsCreating(true);
    setSelectedWorkflow(null);
    setWorkflowData({
      name: "",
      description: "",
      enabled: true,
      trigger: {
        id: "trigger-1",
        type: "message_received",
        conditions: [],
      },
      actions: [],
    });
  };

  const handleSave = async () => {
    if (selectedWorkflow?.id) {
      await updateWorkflow(selectedWorkflow.id, workflowData);
    } else {
      await createWorkflow(workflowData);
    }
    setIsCreating(false);
    setSelectedWorkflow(null);
  };

  const addCondition = () => {
    setWorkflowData((prev) => ({
      ...prev,
      trigger: {
        ...prev.trigger,
        conditions: [...prev.trigger.conditions, { field: "", operator: "equals", value: "" }],
      },
    }));
  };

  const updateCondition = (index: number, field: string, value: any) => {
    setWorkflowData((prev) => ({
      ...prev,
      trigger: {
        ...prev.trigger,
        conditions: prev.trigger.conditions.map((condition, i) =>
          i === index ? { ...condition, [field]: value } : condition
        ),
      },
    }));
  };

  const removeCondition = (index: number) => {
    setWorkflowData((prev) => ({
      ...prev,
      trigger: {
        ...prev.trigger,
        conditions: prev.trigger.conditions.filter((_, i) => i !== index),
      },
    }));
  };

  const addAction = () => {
    setWorkflowData((prev) => ({
      ...prev,
      actions: [
        ...prev.actions,
        {
          id: `action-${prev.actions.length + 1}`,
          type: "send_message",
          parameters: {},
        },
      ],
    }));
  };

  const updateAction = (index: number, field: string, value: any) => {
    setWorkflowData((prev) => ({
      ...prev,
      actions: prev.actions.map((action, i) => (i === index ? { ...action, [field]: value } : action)),
    }));
  };

  const removeAction = (index: number) => {
    setWorkflowData((prev) => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Workflow Automation</h2>
        <Button onClick={handleCreateNew}>
          <Icon icon={Plus} className="mr-2 h-4 w-4" />
          Create Workflow
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* Workflow List */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold">Workflows</h3>
          {workflows?.map((workflow: any) => (
            <Card
              key={workflow.id}
              className={cn(
                "cursor-pointer spacing-4 transition-colors",
                selectedWorkflow?.id === workflow.id && "ring-2 ring-primary"
              )}
              onClick={() => {
                setSelectedWorkflow(workflow);
                setWorkflowData(workflow);
                setIsCreating(false);
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">{workflow.name}</h4>
                  {workflow.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{workflow.description}</p>
                  )}
                </div>
                <Switch checked={workflow.enabled} />
              </div>
              <div className="mt-2 text-tiny text-muted-foreground">{workflow.actions.length} actions</div>
            </Card>
          ))}
        </div>

        {/* Workflow Builder */}
        {(isCreating || selectedWorkflow) && (
          <div className="space-y-6 lg:col-span-2">
            <Card className="p-spacing-md">
              <div className="space-y-3">
                {/* Basic Info */}
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name">Workflow Name</Label>
                    <Input
                      id="name"
                      value={workflowData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setWorkflowData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Enter workflow name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={workflowData.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setWorkflowData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Describe what this workflow does"
                    />
                  </div>
                  <div className="flex items-center space-x-spacing-sm">
                    <Switch
                      checked={workflowData.enabled}
                      onCheckedChange={(enabled: boolean) => setWorkflowData((prev) => ({ ...prev, enabled }))}
                    />
                    <Label>Enable workflow</Label>
                  </div>
                </div>

                {/* Trigger */}
                <div className="space-y-3">
                  <h4 className="text-base font-semibold">Trigger</h4>
                  <div>
                    <Label>When this happens:</Label>
                    <Select
                      value={workflowData.trigger.type}
                      onValueChange={(type) =>
                        setWorkflowData((prev) => ({
                          ...prev,
                          trigger: { ...prev.trigger, type: type as any },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="message_received">Message received</SelectItem>
                        <SelectItem value="conversation_idle">Conversation idle</SelectItem>
                        <SelectItem value="keyword_match">Keyword match</SelectItem>
                        <SelectItem value="sentiment_change">Sentiment change</SelectItem>
                        <SelectItem value="time_based">Time based</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Conditions */}
                  <div className="space-y-spacing-sm">
                    <div className="flex items-center justify-between">
                      <Label>Conditions (all must be true)</Label>
                      <Button variant="outline" size="sm" onClick={addCondition}>
                        <Icon icon={Plus} className="mr-1 h-4 w-4" />
                        Add Condition
                      </Button>
                    </div>
                    {workflowData.trigger.conditions.map((condition, index) => (
                      <div key={index} className="flex items-end gap-ds-2">
                        <div className="flex-1">
                          <Label className="text-tiny">Field</Label>
                          <Input
                            value={condition.field}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              updateCondition(index, "field", e.target.value)
                            }
                            placeholder="e.g., message.content"
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-tiny">Operator</Label>
                          <Select
                            value={condition.operator}
                            onValueChange={(value) => updateCondition(index, "operator", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="equals">Equals</SelectItem>
                              <SelectItem value="contains">Contains</SelectItem>
                              <SelectItem value="greater_than">Greater than</SelectItem>
                              <SelectItem value="less_than">Less than</SelectItem>
                              <SelectItem value="regex">Regex match</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1">
                          <Label className="text-tiny">Value</Label>
                          <Input
                            value={condition.value}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              updateCondition(index, "value", e.target.value)
                            }
                            placeholder="Value to compare"
                          />
                        </div>
                        <Button variant="outline" size="icon" onClick={() => removeCondition(index)}>
                          <Icon icon={X} className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-semibold">Actions</h4>
                    <Button variant="outline" size="sm" onClick={addAction}>
                      <Icon icon={Plus} className="mr-1 h-4 w-4" />
                      Add Action
                    </Button>
                  </div>

                  {workflowData.actions.map((action, index) => (
                    <Card key={action.id} className="spacing-3">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Select value={action.type} onValueChange={(type) => updateAction(index, "type", type)}>
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="send_message">Send message</SelectItem>
                              <SelectItem value="assign_agent">Assign agent</SelectItem>
                              <SelectItem value="add_tag">Add tag</SelectItem>
                              <SelectItem value="close_conversation">Close conversation</SelectItem>
                              <SelectItem value="notify_slack">Notify Slack</SelectItem>
                              <SelectItem value="escalate">Escalate</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="icon" onClick={() => removeAction(index)}>
                            <Icon icon={X} className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Action-specific parameters */}
                        {action.type === "send_message" && (
                          <Textarea
                            value={action.parameters.message || ""}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                              updateAction(index, "parameters", {
                                ...action.parameters,
                                message: e.target.value,
                              })
                            }
                            placeholder="Enter message to send"
                          />
                        )}

                        {action.type === "assign_agent" && (
                          <Input
                            value={action.parameters.agentId || ""}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              updateAction(index, "parameters", {
                                ...action.parameters,
                                agentId: e.target.value,
                              })
                            }
                            placeholder="Agent ID or email"
                          />
                        )}

                        {action.type === "add_tag" && (
                          <Input
                            value={action.parameters.tag || ""}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              updateAction(index, "parameters", {
                                ...action.parameters,
                                tag: e.target.value,
                              })
                            }
                            placeholder="Tag name"
                          />
                        )}

                        {/* Delay */}
                        <div className="flex items-center gap-ds-2">
                          <Label className="text-tiny">Delay (seconds):</Label>
                          <Input
                            type="number"
                            className="w-24"
                            value={action.delay || 0}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              updateAction(index, "delay", parseInt(e.target.value))
                            }
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Save Button */}
                <div className="flex justify-end gap-ds-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreating(false);
                      setSelectedWorkflow(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Icon icon={Save} className="mr-2 h-4 w-4" />
                    Save Workflow
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
