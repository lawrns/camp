import { storageAdapter } from "@/lib/auth/seamless-storage-adapter";
import { Icon } from "@/lib/ui/Icon";
import { AlertTriangle as AlertTriangle, ArrowSquareOut, CheckCircle, Eye, EyeSlash as EyeOff, Info, ArrowCounterClockwise as RotateCcw, Wrench, X } from "lucide-react";
import { useEffect, useState } from "react";

// Browser diagnostics functionality temporarily disabled
type DiagnosticResult = {
  type: string;
  message: string;
  status: "ok" | "warning" | "error";
  issue: string;
  severity: "low" | "medium" | "high";
  fix?: () => Promise<boolean>;
  autoFixAvailable?: boolean;
  fixDescription?: string;
};

interface CompatibilityReport {
  indexedDBAvailable: boolean;
  detectedExtensions: Array<{
    name: string;
    detected: boolean;
    impact: "low" | "medium" | "high";
    workaround?: string;
  }>;
  highImpactExtensions: Array<{
    name: string;
    detected: boolean;
    impact: "low" | "medium" | "high";
    workaround?: string;
  }>;
  recommendations: string[];
  storageEnvironment?: {
    indexedDBWorking: boolean;
    localStorageWorking: boolean;
    sessionStorageWorking: boolean;
    recommendedStorage: "indexeddb" | "localstorage" | "sessionstorage" | "none";
    issues: string[];
  };
  authSuitability?: boolean;
}

interface BrowserCompatibilityAlertProps {
  onDismiss?: () => void;
  showOnlyIssues?: boolean;
  className?: string;
}

export function BrowserCompatibilityAlert({
  onDismiss,
  showOnlyIssues = true,
  className = "",
}: BrowserCompatibilityAlertProps) {
  const [report, setReport] = useState<CompatibilityReport | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunningFix, setIsRunningFix] = useState(false);
  const [fixResults, setFixResults] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    const checkCompatibility = async () => {
      try {
        setIsLoading(true);

        // Get seamless storage status
        const storageStatus = storageAdapter.getStorageStatus();
        const storageDebug = storageAdapter.getDebugInfo();

        // Only show alerts for truly problematic situations
        const showAlert =
          storageStatus.status === "limited" || // Memory-only storage
          !storageStatus.reliable || // Unreliable storage
          storageDebug.type === "memory"; // Fallback to memory

        // Create a simplified report that doesn't alarm users unnecessarily
        const simpleReport: CompatibilityReport = {
          indexedDBAvailable: storageDebug.type === "indexeddb",
          storageEnvironment: {
            indexedDBWorking: storageDebug.type === "indexeddb",
            localStorageWorking: storageDebug.type === "localStorage",
            sessionStorageWorking: storageDebug.type === "sessionStorage",
            recommendedStorage: storageDebug.type as "indexeddb" | "localstorage" | "sessionstorage" | "none",
            issues: storageStatus.status === "limited" ? ["Storage is limited to memory only"] : [],
          },
          detectedExtensions: [],
          highImpactExtensions: [],
          recommendations:
            storageStatus.status === "limited"
              ? ["Storage is limited to memory only. Authentication will not persist across page reloads."]
              : [],
          authSuitability: storageStatus.reliable,
        };

        setReport(simpleReport);
        setDiagnostics([]); // No diagnostics needed for seamless storage

        // Only show if there are actual issues that affect user experience
        setIsVisible(!showOnlyIssues || showAlert);
      } catch (error) {
        // Fallback to basic report
        const basicReport: CompatibilityReport = {
          indexedDBAvailable: true,
          detectedExtensions: [],
          highImpactExtensions: [],
          recommendations: [],
          storageEnvironment: {
            indexedDBWorking: true,
            localStorageWorking: true,
            sessionStorageWorking: true,
            recommendedStorage: "indexeddb",
            issues: [],
          },
          authSuitability: true,
        };
        setReport(basicReport);
        const hasIssues = !basicReport.indexedDBAvailable || basicReport.highImpactExtensions.length > 0;
        setIsVisible(!showOnlyIssues || hasIssues);
      } finally {
        setIsLoading(false);
      }
    };

    checkCompatibility();
  }, [showOnlyIssues]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    // Small delay to show loading state
    await new Promise((resolve) => setTimeout(resolve, 500));
    window.location.reload();
  };

  const handleAutoFix = async (diagnostic: DiagnosticResult) => {
    if (!diagnostic.fix) return;

    setIsRunningFix(true);
    try {
      const success = await diagnostic.fix();
      setFixResults((prev) => new Map(prev).set(diagnostic.issue, success));

      if (success) {
        // Re-run diagnostics after successful fix
        setTimeout(async () => {
          // Browser diagnostics functionality temporarily disabled
          const newDiagnostics: DiagnosticResult[] = [];
          setDiagnostics(newDiagnostics);
          setIsRunningFix(false);
        }, 1000);
      } else {
        setIsRunningFix(false);
      }
    } catch (error) {
      setFixResults((prev) => new Map(prev).set(diagnostic.issue, false));
      setIsRunningFix(false);
    }
  };

  const getSeverityColor = (severity: "info" | "warning" | "error") => {
    switch (severity) {
      case "error":
        return "border-[var(--ds-color-error-muted)] bg-[var(--ds-color-error-subtle)] text-ds-color-error-800";
      case "warning":
        return "border-[var(--ds-color-warning-muted)] bg-[var(--ds-color-warning-subtle)] text-ds-color-warning-800";
      case "info":
      default:
        return "border-[var(--ds-color-info-muted)] bg-[var(--ds-color-info-subtle)] text-ds-color-info-800";
    }
  };

  const getSeverityIcon = (severity: "info" | "warning" | "error") => {
    switch (severity) {
      case "error":
        return <Icon icon={AlertTriangle} size={20} className="text-ds-color-error-600" />;
      case "warning":
        return <Icon icon={AlertTriangle} size={20} className="text-ds-color-warning-600" />;
      case "info":
      default:
        return <Icon icon={Info} size={20} className="text-ds-color-info-600" />;
    }
  };

  const getSeverity = (): "info" | "warning" | "error" => {
    if (!report) return "info";

    // Only show warnings/errors for situations that actually affect user experience
    if (report.storageEnvironment) {
      if (report.storageEnvironment.recommendedStorage === "none") return "warning";
      // localStorage and sessionStorage are both fine - no warnings needed
      return "info";
    }

    return "info";
  };

  if (isLoading) {
    return (
      <div
        className={`flex items-center gap-2 rounded-ds-lg border border-[var(--fl-color-border)] bg-[var(--fl-color-background-subtle)] spacing-3 ${className}`}
      >
        <Icon icon={RotateCcw} size={16} className="text-foreground animate-spin" />
        <span className="text-foreground text-sm">Checking browser compatibility...</span>
      </div>
    );
  }

  if (!isVisible || !report) return null;

  const severity = getSeverity();

  return (
    <>
      <div className={`rounded-ds-lg border ${getSeverityColor(severity)} ${className}`}>
        <div className="spacing-3">
          {/* Header */}
          <div className="flex items-start gap-3">
            {getSeverityIcon(severity)}
            <div className="flex-1">
              <h4 className="font-medium">
                {severity === "error" && "Authentication Storage Issue"}
                {severity === "warning" && "Limited Authentication Storage"}
                {severity === "info" && "Authentication Working Properly"}
              </h4>

              {/* Summary */}
              <div className="mt-1 text-sm">
                {report.storageEnvironment ? (
                  <>
                    {report.storageEnvironment.recommendedStorage === "none" && (
                      <p>
                        ⚠️ Authentication will not persist across page reloads. Please check your browser settings or
                        try a different browser.
                      </p>
                    )}
                    {report.storageEnvironment.recommendedStorage === "sessionstorage" && (
                      <p>ℹ️ Authentication will persist for this browser session but not across browser restarts.</p>
                    )}
                    {report.storageEnvironment.recommendedStorage === "localstorage" && (
                      <p>✅ Authentication is working properly and will persist across browser sessions.</p>
                    )}
                    {report.storageEnvironment.recommendedStorage === "indexeddb" && (
                      <p>✅ Your browser is fully compatible with authentication.</p>
                    )}
                  </>
                ) : (
                  <>
                    {!report.indexedDBAvailable && (
                      <p>ℹ️ Using backup authentication storage. Everything is working properly.</p>
                    )}
                  </>
                )}
              </div>

              {/* Quick Actions */}
              <div className="mt-3 flex items-center gap-ds-2">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="inline-flex items-center gap-1 text-tiny font-medium hover:underline"
                >
                  {isExpanded ? <Icon icon={EyeOff} size={14} /> : <Icon icon={Eye} size={14} />}
                  {isExpanded ? "Hide details" : "Show details"}
                </button>

                {severity !== "info" && (
                  <button
                    onClick={handleRefresh}
                    className="inline-flex items-center gap-1 text-tiny font-medium hover:underline"
                  >
                    <Icon icon={RotateCcw} size={14} />
                    Refresh page
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="hover:text-foreground text-gray-400 transition-colors"
              aria-label="Dismiss"
            >
              <Icon icon={X} size={16} />
            </button>
          </div>

          {/* Expanded Details */}
          <>
            {isExpanded && (
              <div className="mt-4 border-t border-current border-opacity-20 pt-4">
                {/* Storage Status */}
                <div className="mb-4">
                  <h5 className="mb-2 text-sm font-medium">Browser Storage</h5>
                  {report.storageEnvironment ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-ds-2 text-sm">
                        <div
                          className={`h-2 w-2 rounded-ds-full ${report.storageEnvironment.indexedDBWorking ? "bg-semantic-success" : "bg-brand-mahogany-500"
                            }`}
                        />
                        <span>
                          IndexedDB: {report.storageEnvironment.indexedDBWorking ? "Working" : "Not available"}
                        </span>
                      </div>
                      <div className="flex items-center gap-ds-2 text-sm">
                        <div
                          className={`h-2 w-2 rounded-ds-full ${report.storageEnvironment.localStorageWorking
                            ? "bg-semantic-success"
                            : "bg-brand-mahogany-500"
                            }`}
                        />
                        <span>
                          LocalStorage: {report.storageEnvironment.localStorageWorking ? "Working" : "Not available"}
                        </span>
                      </div>
                      <div className="flex items-center gap-ds-2 text-sm">
                        <div
                          className={`h-2 w-2 rounded-ds-full ${report.storageEnvironment.sessionStorageWorking
                            ? "bg-semantic-success"
                            : "bg-brand-mahogany-500"
                            }`}
                        />
                        <span>
                          SessionStorage:{" "}
                          {report.storageEnvironment.sessionStorageWorking ? "Working" : "Not available"}
                        </span>
                      </div>
                      <div className="mt-2 text-tiny opacity-75">
                        <strong>Recommended:</strong> {report.storageEnvironment.recommendedStorage}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-ds-2 text-sm">
                      {report.indexedDBAvailable ? (
                        <>
                          <div className="bg-semantic-success h-2 w-2 rounded-ds-full" />
                          <span>IndexedDB is available and working</span>
                        </>
                      ) : (
                        <>
                          <div className="bg-brand-mahogany-500 h-2 w-2 rounded-ds-full" />
                          <span>IndexedDB is not available or not working</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Detected Extensions */}
                {report.detectedExtensions.some((ext) => ext.detected) && (
                  <div className="mb-4">
                    <h5 className="mb-2 text-sm font-medium">Detected Extensions</h5>
                    <div className="space-y-spacing-sm">
                      {report.detectedExtensions
                        .filter((ext: unknown) => ext.detected)
                        .map((ext, index) => (
                          <div key={index} className="flex items-start gap-ds-2 text-sm">
                            <div
                              className={`mt-1.5 h-2 w-2 rounded-ds-full ${ext.impact === "high"
                                ? "bg-brand-mahogany-500"
                                : ext.impact === "medium"
                                  ? "bg-semantic-warning"
                                  : "bg-brand-blue-500"
                                }`}
                            />
                            <div>
                              <span className="font-medium">{ext.name}</span>
                              <span className="text-opacity-70"> ({ext.impact} impact)</span>
                              {ext.workaround && (
                                <div className="mt-1 text-tiny text-opacity-70">Workaround: {ext.workaround}</div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {report.recommendations.length > 0 && (
                  <div className="mb-4">
                    <h5 className="mb-2 text-sm font-medium">Recommendations</h5>
                    <ul className="space-y-1 text-sm">
                      {report.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-ds-2">
                          <span className="text-opacity-70">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Storage Issues */}
                {report.storageEnvironment?.issues && report.storageEnvironment.issues.length > 0 && (
                  <div className="mb-4">
                    <h5 className="mb-2 text-sm font-medium">Storage Issues</h5>
                    <ul className="space-y-1 text-sm">
                      {report.storageEnvironment.issues.map((issue, index) => (
                        <li key={index} className="flex items-start gap-ds-2">
                          <span className="text-opacity-70">•</span>
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Diagnostic Results & Auto-Fix */}
                {diagnostics.length > 0 && (
                  <div className="mb-4">
                    <h5 className="mb-2 text-sm font-medium">
                      Diagnostics & Auto-Fix
                      {isRunningFix && <Icon icon={RotateCcw} size={14} className="ml-2 inline animate-spin" />}
                    </h5>
                    <div className="space-y-spacing-sm">
                      {diagnostics.map((diagnostic, index) => {
                        const fixResult = fixResults.get(diagnostic.issue);
                        return (
                          <div key={index} className="flex items-start gap-ds-2 text-sm">
                            <div
                              className={`mt-1.5 h-2 w-2 rounded-ds-full ${diagnostic.status === "error"
                                ? "bg-brand-mahogany-500"
                                : diagnostic.status === "warning"
                                  ? "bg-semantic-warning"
                                  : "bg-brand-blue-500"
                                }`}
                            />
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-ds-2">
                                <span className="font-medium">{diagnostic.issue}</span>
                                {diagnostic.autoFixAvailable && (
                                  <div className="flex items-center gap-1">
                                    {fixResult === true && (
                                      <Icon icon={CheckCircle} size={16} className="text-semantic-success-dark" />
                                    )}
                                    {fixResult === false && (
                                      <Icon icon={AlertTriangle} size={16} className="text-red-600" />
                                    )}
                                    <button
                                      onClick={() => handleAutoFix(diagnostic)}
                                      disabled={isRunningFix || fixResult === true}
                                      className="text-status-info-dark inline-flex items-center gap-1 rounded bg-[var(--fl-color-info-subtle)] px-2 py-1 text-tiny hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      <Icon icon={Wrench} size={12} />
                                      {fixResult === true ? "Fixed" : fixResult === false ? "Failed" : "Fix"}
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className="mt-1 text-tiny text-opacity-70">{diagnostic.fixDescription}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Help Links */}
                <div className="border-t border-current border-opacity-20 pt-3">
                  <div className="flex flex-wrap items-center gap-3 text-tiny">
                    <a
                      href="https://support.google.com/chrome/answer/95464"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:underline"
                    >
                      <Icon icon={ArrowSquareOut} size={12} />
                      Incognito mode help
                    </a>
                    <a
                      href="https://support.mozilla.org/en-US/kb/private-browsing-use-firefox-without-history"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:underline"
                    >
                      <Icon icon={ArrowSquareOut} size={12} />
                      Private browsing help
                    </a>
                    <button
                      onClick={() => window.location.reload()}
                      className="inline-flex items-center gap-1 hover:underline"
                    >
                      <Icon icon={RotateCcw} size={12} />
                      Retry test
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        </div>
      </div>
    </>
  );
}
