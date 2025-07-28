import autoAssignConversation from "@/inngest/functions/autoAssignConversation";
import { cleanupOldFineTuningJobs, handleFineTuningJobCreated, monitorFineTuningJob } from "./ai-fine-tuning";
import autoCloseInactiveConversationsFunctions from "./autoCloseInactiveConversations";
import bulkEmbeddingClosedConversations from "./bulkEmbeddingClosedConversations";
import bulkUpdateConversations from "./bulkUpdateConversations";
import checkAssignedTicketResponseTimes from "./checkAssignedTicketResponseTimes";
import checkConversationResolution from "./checkConversationResolution";
import checkVipResponseTimes from "./checkVipResponseTimes";
import cleanupDanglingFiles from "./cleanupDanglingFiles";
import crawlWebsite from "./crawlWebsite";
import embeddingConversation from "./embeddingConversation";
import embeddingFaq from "./embeddingFaq";
import { executeAutomationWorkflow } from "./executeAutomationWorkflow";
import { fineTuneModelFunction } from "./fineTuneModel";
import generateConversationSummaryEmbeddings from "./generateConversationSummaryEmbeddings";
import generateDailyReports, { generateMailboxDailyReport } from "./generateDailyReports";
import generateFilePreview from "./generateFilePreview";
import generateWeeklyReports, { generateMailboxWeeklyReport } from "./generateWeeklyReports";
import handleAutoResponse from "./handleAutoResponse";
import handleGmailWebhookEvent from "./handleGmailWebhookEvent";
import handleSlackAgentMessage from "./handleSlackAgentMessage";
import handleStripeWebhookEvent from "./handleStripeWebhookEvent";
import hardDeleteRecordsForNonPayingOrgs from "./hardDeleteRecordsForNonPayingOrgs";
import importGmailThreads from "./importGmailThreads";
import importRecentGmailThreads from "./importRecentGmailThreads";
import indexConversationMessage from "./indexConversation";
import mergeSimilarConversations from "./mergeSimilarConversations";
import notifyVipMessage from "./notifyVipMessage";
import postAssigneeOnSlack from "./postAssigneeOnSlack";
import postEmailToGmail from "./postEmailToGmail";
import { processTrainingDataFunction } from "./processTrainingData";
import publishNewConversationEvent from "./publishNewConversationEvent";
import { reindexKnowledgeBase } from "./reindexKnowledgeBase";
import renewMailboxWatches from "./renewMailboxWatches";
import scheduledWebsiteCrawl from "./scheduledWebsiteCrawl";
import suggestKnowledgeBankChanges from "./suggestKnowledgeBankChanges";
import updateSuggestedActions from "./updateSuggestedActions";
import vectorDeduplicationFunctions from "./vectorDeduplication";
import vectorTTLCleanupFunctions from "./vectorTTLCleanup";

export default [
  postAssigneeOnSlack,
  indexConversationMessage,
  embeddingConversation,
  bulkEmbeddingClosedConversations,
  embeddingFaq,
  generateFilePreview,
  generateConversationSummaryEmbeddings,
  mergeSimilarConversations,
  publishNewConversationEvent,
  handleStripeWebhookEvent,
  cleanupDanglingFiles,
  postEmailToGmail,
  handleGmailWebhookEvent,
  handleAutoResponse,
  importRecentGmailThreads,
  importGmailThreads,
  renewMailboxWatches,
  hardDeleteRecordsForNonPayingOrgs,
  generateWeeklyReports,
  generateMailboxWeeklyReport,
  notifyVipMessage,
  bulkUpdateConversations,
  crawlWebsite,
  scheduledWebsiteCrawl,
  generateDailyReports,
  generateMailboxDailyReport,
  checkVipResponseTimes,
  checkAssignedTicketResponseTimes,
  suggestKnowledgeBankChanges,
  checkConversationResolution,
  ...autoCloseInactiveConversationsFunctions,
  updateSuggestedActions,
  autoAssignConversation,
  handleSlackAgentMessage,
  processTrainingDataFunction,
  fineTuneModelFunction,
  executeAutomationWorkflow,
  reindexKnowledgeBase,
  handleFineTuningJobCreated,
  monitorFineTuningJob,
  cleanupOldFineTuningJobs,
  ...vectorTTLCleanupFunctions,
  ...vectorDeduplicationFunctions,
];
