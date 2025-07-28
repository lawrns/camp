/**
 * AI Threshold Tuning
 * Provides confidence threshold tuning and optimization for AI systems
 */

export interface ThresholdConfig {
  confidenceThreshold: number; // 0-1
  uncertaintyThreshold: number; // 0-1
  escalationThreshold: number; // 0-1
  autoAdjustment: boolean;
  learningRate: number; // 0-1
  minSamples: number;
  // Additional properties for auto-tuning
  autoTune?: boolean;
  updateFrequency?: string;
  targetMetric?: string;
}

export interface ConfidenceMetrics {
  averageConfidence: number;
  confidenceDistribution: number[];
  accuracyAtThreshold: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  totalPredictions: number;
  correctPredictions: number;
}

export interface TuningResult {
  originalThreshold: number;
  optimizedThreshold: number;
  improvement: number; // percentage
  metrics: ConfidenceMetrics;
  recommendations: string[];
  timestamp: Date;
}

export interface PredictionSample {
  id: string;
  prediction: string;
  confidence: number;
  actualOutcome?: boolean;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export class ThresholdTuner {
  private config: ThresholdConfig;
  private samples: PredictionSample[] = [];
  private tuningHistory: TuningResult[] = [];

  constructor(
    config: ThresholdConfig = {
      confidenceThreshold: 0.7,
      uncertaintyThreshold: 0.3,
      escalationThreshold: 0.5,
      autoAdjustment: true,
      learningRate: 0.1,
      minSamples: 100,
    }
  ) {
    this.config = config;
  }

  addSample(sample: Omit<PredictionSample, "id" | "timestamp">): PredictionSample {
    const newSample: PredictionSample = {
      ...sample,
      id: `sample-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date(),
    };

    this.samples.push(newSample);

    // Keep only recent samples to manage memory
    if (this.samples.length > 10000) {
      this.samples = this.samples.slice(-5000);
    }

    // Auto-adjust if enabled and we have enough samples
    if (this.config.autoAdjustment && this.samples.length >= this.config.minSamples) {
      this.autoTuneThresholds();
    }

    return newSample;
  }

  calculateMetrics(threshold?: number): ConfidenceMetrics {
    const activeThreshold = threshold || this.config.confidenceThreshold;
    const validSamples = this.samples.filter((s: unknown) => s.actualOutcome !== undefined);

    if (validSamples.length === 0) {
      return {
        averageConfidence: 0,
        confidenceDistribution: [],
        accuracyAtThreshold: 0,
        falsePositiveRate: 0,
        falseNegativeRate: 0,
        totalPredictions: 0,
        correctPredictions: 0,
      };
    }

    const totalPredictions = validSamples.length;
    const averageConfidence = validSamples.reduce((sum: any, s: unknown) => sum + s.confidence, 0) / totalPredictions;

    // Calculate accuracy at threshold
    const predictionsAtThreshold = validSamples.filter((s: unknown) => s.confidence >= activeThreshold);
    const correctAtThreshold = predictionsAtThreshold.filter((s: unknown) => s.actualOutcome === true).length;
    const accuracyAtThreshold =
      predictionsAtThreshold.length > 0 ? correctAtThreshold / predictionsAtThreshold.length : 0;

    // Calculate false positive/negative rates
    const truePositives = validSamples.filter(
      (s) => s.confidence >= activeThreshold && s.actualOutcome === true
    ).length;
    const falsePositives = validSamples.filter(
      (s) => s.confidence >= activeThreshold && s.actualOutcome === false
    ).length;
    const trueNegatives = validSamples.filter(
      (s) => s.confidence < activeThreshold && s.actualOutcome === false
    ).length;
    const falseNegatives = validSamples.filter(
      (s) => s.confidence < activeThreshold && s.actualOutcome === true
    ).length;

    const falsePositiveRate =
      falsePositives + trueNegatives > 0 ? falsePositives / (falsePositives + trueNegatives) : 0;
    const falseNegativeRate =
      falseNegatives + truePositives > 0 ? falseNegatives / (falseNegatives + truePositives) : 0;

    // Create confidence distribution
    const confidenceDistribution = this.createConfidenceDistribution(validSamples);

    return {
      averageConfidence,
      confidenceDistribution,
      accuracyAtThreshold,
      falsePositiveRate,
      falseNegativeRate,
      totalPredictions,
      correctPredictions: truePositives + trueNegatives,
    };
  }

  private createConfidenceDistribution(samples: PredictionSample[]): number[] {
    const buckets = new Array(10).fill(0);

    for (const sample of samples) {
      const bucketIndex = Math.min(Math.floor(sample.confidence * 10), 9);
      buckets[bucketIndex]++;
    }

    return buckets.map((count: unknown) => count / samples.length);
  }

  optimizeThreshold(targetMetric: "accuracy" | "precision" | "recall" | "f1" = "accuracy"): TuningResult {
    const originalThreshold = this.config.confidenceThreshold;
    let bestThreshold = originalThreshold;
    let bestScore = 0;

    // Test different thresholds
    for (let threshold = 0.1; threshold <= 0.95; threshold += 0.05) {
      const metrics = this.calculateMetrics(threshold);
      const score = this.calculateScore(metrics, targetMetric);

      if (score > bestScore) {
        bestScore = score;
        bestThreshold = threshold;
      }
    }

    const originalMetrics = this.calculateMetrics(originalThreshold);
    const optimizedMetrics = this.calculateMetrics(bestThreshold);
    const improvement =
      ((bestScore - this.calculateScore(originalMetrics, targetMetric)) /
        this.calculateScore(originalMetrics, targetMetric)) *
      100;

    const result: TuningResult = {
      originalThreshold,
      optimizedThreshold: bestThreshold,
      improvement,
      metrics: optimizedMetrics,
      recommendations: this.generateRecommendations(optimizedMetrics, bestThreshold),
      timestamp: new Date(),
    };

    this.tuningHistory.push(result);

    // Update config with optimized threshold
    this.config.confidenceThreshold = bestThreshold;

    return result;
  }

  private calculateScore(metrics: ConfidenceMetrics, targetMetric: string): number {
    const { totalPredictions, correctPredictions, falsePositiveRate, falseNegativeRate } = metrics;

    if (totalPredictions === 0) return 0;

    const accuracy = correctPredictions / totalPredictions;
    const precision = 1 - falsePositiveRate;
    const recall = 1 - falseNegativeRate;

    switch (targetMetric) {
      case "accuracy":
        return accuracy;
      case "precision":
        return precision;
      case "recall":
        return recall;
      case "f1":
        return precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
      default:
        return accuracy;
    }
  }

  private generateRecommendations(metrics: ConfidenceMetrics, threshold: number): string[] {
    const recommendations: string[] = [];

    if (metrics.falsePositiveRate > 0.1) {
      recommendations.push("Consider increasing confidence threshold to reduce false positives");
    }

    if (metrics.falseNegativeRate > 0.1) {
      recommendations.push("Consider decreasing confidence threshold to reduce false negatives");
    }

    if (metrics.averageConfidence < 0.6) {
      recommendations.push("Model confidence is low, consider retraining or improving data quality");
    }

    if (threshold > 0.9) {
      recommendations.push("Very high threshold may result in too many escalations");
    }

    if (threshold < 0.3) {
      recommendations.push("Very low threshold may result in low-quality predictions");
    }

    if (recommendations.length === 0) {
      recommendations.push("Current threshold appears well-calibrated");
    }

    return recommendations;
  }

  private autoTuneThresholds(): void {
    if (this.samples.length < this.config.minSamples) return;

    const currentMetrics = this.calculateMetrics();
    const tuningResult = this.optimizeThreshold();

    // Only apply if improvement is significant
    if (tuningResult.improvement > 5) {
      this.config.confidenceThreshold = tuningResult.optimizedThreshold;
    }
  }

  getConfig(): ThresholdConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<ThresholdConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getTuningHistory(): TuningResult[] {
    return [...this.tuningHistory];
  }

  clearSamples(): void {
    this.samples = [];
  }

  getSampleCount(): number {
    return this.samples.length;
  }

  getValidSampleCount(): number {
    return this.samples.filter((s: unknown) => s.actualOutcome !== undefined).length;
  }

  exportSamples(): PredictionSample[] {
    return [...this.samples];
  }

  importSamples(samples: PredictionSample[]): void {
    this.samples = [...samples];
  }

  generateCalibrationReport(): {
    isWellCalibrated: boolean;
    calibrationError: number;
    reliabilityDiagram: { confidence: number; accuracy: number; count: number }[];
    recommendations: string[];
  } {
    const validSamples = this.samples.filter((s: unknown) => s.actualOutcome !== undefined);
    const bins = 10;
    const reliabilityDiagram: { confidence: number; accuracy: number; count: number }[] = [];

    let totalCalibrationError = 0;

    for (let i = 0; i < bins; i++) {
      const minConf = i / bins;
      const maxConf = (i + 1) / bins;
      const binSamples = validSamples.filter((s: unknown) => s.confidence >= minConf && s.confidence < maxConf);

      if (binSamples.length > 0) {
        const avgConfidence = binSamples.reduce((sum: any, s: unknown) => sum + s.confidence, 0) / binSamples.length;
        const accuracy = binSamples.filter((s: unknown) => s.actualOutcome === true).length / binSamples.length;
        const calibrationError = Math.abs(avgConfidence - accuracy);

        reliabilityDiagram.push({
          confidence: avgConfidence,
          accuracy,
          count: binSamples.length,
        });

        totalCalibrationError += calibrationError * binSamples.length;
      }
    }

    const avgCalibrationError = validSamples.length > 0 ? totalCalibrationError / validSamples.length : 0;
    const isWellCalibrated = avgCalibrationError < 0.1;

    const recommendations: string[] = [];
    if (!isWellCalibrated) {
      recommendations.push("Model is poorly calibrated, consider calibration techniques");
      if (avgCalibrationError > 0.2) {
        recommendations.push("Significant calibration issues detected, model retraining recommended");
      }
    }

    return {
      isWellCalibrated,
      calibrationError: avgCalibrationError,
      reliabilityDiagram,
      recommendations,
    };
  }

  async getAutoTuningConfig(organizationId: string): Promise<any> {
    return {
      enabled: this.config.autoTune,
      minSamplesRequired: this.config.minSamples,
      updateFrequency: this.config.updateFrequency,
      targetMetric: this.config.targetMetric,
      lastUpdated: new Date().toISOString(),
      currentThreshold: this.config.confidenceThreshold,
    };
  }

  async startTuningSession(organizationId: string, targetImprovement: number): Promise<any> {
    const currentMetrics = this.calculateMetrics();
    const tuningResult = this.optimizeThreshold();

    return {
      sessionId: `tuning_${Date.now()}`,
      organizationId,
      startTime: new Date().toISOString(),
      currentMetrics,
      targetImprovement,
      status: "active",
      estimatedDuration: "5-10 minutes",
      recommendations: tuningResult,
    };
  }

  async updateAutoTuningConfig(organizationId: string, config: unknown): Promise<void> {
    if (config.enabled !== undefined) this.config.autoTune = config.enabled;
    if (config.minSamplesRequired !== undefined) this.config.minSamples = config.minSamplesRequired;
    if (config.updateFrequency !== undefined) this.config.updateFrequency = config.updateFrequency;
    if (config.targetMetric !== undefined) this.config.targetMetric = config.targetMetric;
  }

  async needsTuning(organizationId: string): Promise<boolean> {
    const validSamples = this.getValidSampleCount();
    if (validSamples < this.config.minSamples) return false;

    const currentMetrics = this.calculateMetrics();
    const targetMetricValue =
      currentMetrics[(this.config.targetMetric as keyof ConfidenceMetrics) || "accuracyAtThreshold"];

    // Suggest tuning if current metric is below 0.8
    return targetMetricValue < 0.8;
  }

  async getRecommendedThreshold(organizationId: string): Promise<number> {
    const tuningResult = this.optimizeThreshold();
    return tuningResult.optimizedThreshold;
  }

  async applyThreshold(organizationId: string, threshold: number): Promise<void> {
    this.config.confidenceThreshold = threshold;
  }

  async getThresholdHistory(organizationId: string): Promise<TuningResult[]> {
    return this.getTuningHistory();
  }
}

// Default instance
export const thresholdTuner = new ThresholdTuner();

// Utility functions
export function tuneConfidenceThreshold(targetMetric?: "accuracy" | "precision" | "recall" | "f1"): TuningResult {
  return thresholdTuner.optimizeThreshold(targetMetric);
}

export function addPredictionSample(sample: Omit<PredictionSample, "id" | "timestamp">): PredictionSample {
  return thresholdTuner.addSample(sample);
}

export function getConfidenceMetrics(threshold?: number): ConfidenceMetrics {
  return thresholdTuner.calculateMetrics(threshold);
}

export function getThresholdConfig(): ThresholdConfig {
  return thresholdTuner.getConfig();
}

export function getThresholdTuningService(): ThresholdTuner {
  return thresholdTuner;
}
