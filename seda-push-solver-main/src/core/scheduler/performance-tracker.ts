/**
 * Performance Tracker for DataRequest Flow
 * Tracks detailed timing for each step of the data request process
 */

export interface DataRequestStepTiming {
  stepName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'started' | 'completed' | 'failed';
  error?: string;
}

export interface DataRequestPerformance {
  taskId: string;
  drId?: string;
  requestNumber: number;
  startTime: number;
  endTime?: number;
  totalDuration?: number;
  steps: Map<string, DataRequestStepTiming>;
  status: 'in_progress' | 'completed' | 'failed';
}

export interface StepAverages {
  process: number;
  posting: number;
  awaitingPost: number;
  awaitingOracleResult: number;
  awaitingSignatures: number;
  postingBatch: number;
  postingResult: number;
  total: number;
}

export interface PerformanceStatistics {
  totalRequests: number;
  completedRequestsCount: number;
  failedRequests: number;
  averages: StepAverages;
  currentRequests: Map<string, DataRequestPerformance>;
  completedRequests: DataRequestPerformance[];
}

/**
 * Step names for the data request flow
 * 
 * IMPORTANT: Timing sequence ensures no overlap:
 * 1. PROCESS - Build configuration
 * 2. POSTING - Submit to SEDA network 
 * 3. AWAITING_ORACLE_RESULT - Wait for oracle execution (ends when result retrieved)
 * 4. AWAITING_SIGNATURES - Fetch validator signatures (starts ONLY after oracle result complete)
 * 5. POSTING_BATCH - Post batch and results to EVM networks
 */
export const STEP_NAMES = {
  PROCESS: 'process',
  POSTING: 'posting', 
  AWAITING_POST: 'awaitingPost',
  AWAITING_ORACLE_RESULT: 'awaitingOracleResult',
  AWAITING_SIGNATURES: 'awaitingSignatures',
  POSTING_BATCH: 'postingBatch',
  POSTING_RESULT: 'postingResult'
} as const;

export type StepName = typeof STEP_NAMES[keyof typeof STEP_NAMES];

/**
 * Performance Tracker for monitoring DataRequest flow timing
 */
export class DataRequestPerformanceTracker {
  private currentRequests = new Map<string, DataRequestPerformance>();
  private completedRequests: DataRequestPerformance[] = [];

  /**
   * Start tracking a new data request
   */
  startTracking(taskId: string, requestNumber: number): void {
    const startTime = Date.now();
    const performance: DataRequestPerformance = {
      taskId,
      requestNumber,
      startTime,
      steps: new Map(),
      status: 'in_progress'
    };
    
    this.currentRequests.set(taskId, performance);
  }

  /**
   * Start timing a specific step
   */
  startStep(taskId: string, stepName: StepName): void {
    const performance = this.currentRequests.get(taskId);
    if (!performance) {
      return;
    }

    const startTime = Date.now();
    const stepTiming: DataRequestStepTiming = {
      stepName,
      startTime,
      status: 'started'
    };

    performance.steps.set(stepName, stepTiming);
  }

  /**
   * End timing a specific step (success)
   */
  endStep(taskId: string, stepName: StepName): void {
    const performance = this.currentRequests.get(taskId);
    if (!performance) {
      return;
    }

    const step = performance.steps.get(stepName);
    if (!step) {
      return;
    }

    const endTime = Date.now();
    step.endTime = endTime;
    step.duration = endTime - step.startTime;
    step.status = 'completed';
  }

  /**
   * Mark a step as failed
   */
  failStep(taskId: string, stepName: StepName, error: string): void {
    const performance = this.currentRequests.get(taskId);
    if (!performance) {
      return;
    }

    const step = performance.steps.get(stepName);
    if (!step) {
      return;
    }

    const endTime = Date.now();
    step.endTime = endTime;
    step.duration = endTime - step.startTime;
    step.status = 'failed';
    step.error = error;
  }

  /**
   * Mark the entire data request as completed
   */
  completeRequest(taskId: string, drId: string): void {
    const performance = this.currentRequests.get(taskId);
    if (!performance) {
      return;
    }

    const endTime = Date.now();
    performance.drId = drId;
    performance.endTime = endTime;
    performance.totalDuration = endTime - performance.startTime;
    performance.status = 'completed';

    // Move to completed requests
    this.completedRequests.push(performance);
    this.currentRequests.delete(taskId);
  }

  /**
   * Mark the entire data request as failed
   */
  failRequest(taskId: string, error: string): void {
    const performance = this.currentRequests.get(taskId);
    if (!performance) {
      return;
    }

    const endTime = Date.now();
    performance.endTime = endTime;
    performance.totalDuration = endTime - performance.startTime;
    performance.status = 'failed';

    // Add error to the last active step if any
    const activeSteps = Array.from(performance.steps.values()).filter(s => s.status === 'started');
    if (activeSteps.length > 0) {
      const lastStep = activeSteps[activeSteps.length - 1];
      if (lastStep) {
        this.failStep(taskId, lastStep.stepName as StepName, error);
      }
    }

    // Move to completed requests
    this.completedRequests.push(performance);
    this.currentRequests.delete(taskId);
  }

  /**
   * Get performance data for a specific request
   */
  getRequestPerformance(taskId: string): DataRequestPerformance | undefined {
    return this.currentRequests.get(taskId) || 
           this.completedRequests.find(r => r.taskId === taskId);
  }

  /**
   * Log detailed performance for a completed request
   */
  logRequestPerformance(taskId: string, logger: { info: (msg: string) => void }): void {
    const performance = this.getRequestPerformance(taskId);
    if (!performance) {
      return;
    }

    const totalMs = performance.totalDuration || 0;
    const totalSec = (totalMs / 1000).toFixed(2);

    logger.info('┌─────────────────────────────────────────────────────────────────────┐');
    logger.info(`│               🏁 DataRequest Performance Summary                     │`);
    logger.info('├─────────────────────────────────────────────────────────────────────┤');
    logger.info(`│ Task: ${performance.taskId.padEnd(20)} │ DR: ${(performance.drId || 'N/A').substring(0, 20).padEnd(20)} │`);
    logger.info(`│ Total Duration: ${totalMs.toString().padEnd(10)}ms (${totalSec.padEnd(8)}s)                     │`);
    logger.info('├─────────────────────────────────────────────────────────────────────┤');

    // Sort steps by start time
    const sortedSteps = Array.from(performance.steps.values())
      .sort((a, b) => a.startTime - b.startTime);

    for (const step of sortedSteps) {
      const duration = step.duration || 0;
      const durationSec = (duration / 1000).toFixed(2);
      const status = step.status === 'completed' ? '✅' : 
                    step.status === 'failed' ? '❌' : '⏳';
      const stepName = step.stepName.padEnd(18);
      const durationStr = `${duration.toString().padEnd(6)}ms (${durationSec.padEnd(6)}s)`;
      
      logger.info(`│ ${status} ${stepName} │ ${durationStr}                     │`);
      
      if (step.error) {
        logger.info(`│     Error: ${step.error.substring(0, 58).padEnd(58)} │`);
      }
    }

    logger.info('└─────────────────────────────────────────────────────────────────────┘');
  }

  /**
   * Calculate average timing statistics
   */
  calculateAverages(): StepAverages {
    const completed = this.completedRequests.filter(r => r.status === 'completed');
    
    if (completed.length === 0) {
      return {
        process: 0,
        posting: 0,
        awaitingPost: 0,
        awaitingOracleResult: 0,
        awaitingSignatures: 0,
        postingBatch: 0,
        postingResult: 0,
        total: 0
      };
    }

    const averages: { [key: string]: number } = {};
    
    // Calculate average for each step
    Object.values(STEP_NAMES).forEach(stepName => {
      const stepDurations = completed
        .map(req => req.steps.get(stepName)?.duration)
        .filter((duration): duration is number => duration !== undefined);
      
      averages[stepName] = stepDurations.length > 0 
        ? stepDurations.reduce((sum, d) => sum + d, 0) / stepDurations.length
        : 0;
    });

    // Calculate total average
    const totalDurations = completed
      .map(req => req.totalDuration)
      .filter((duration): duration is number => duration !== undefined);
    
    averages.total = totalDurations.length > 0
      ? totalDurations.reduce((sum, d) => sum + d, 0) / totalDurations.length
      : 0;

    return {
      process: averages[STEP_NAMES.PROCESS] || 0,
      posting: averages[STEP_NAMES.POSTING] || 0,
      awaitingPost: averages[STEP_NAMES.AWAITING_POST] || 0,
      awaitingOracleResult: averages[STEP_NAMES.AWAITING_ORACLE_RESULT] || 0,
      awaitingSignatures: averages[STEP_NAMES.AWAITING_SIGNATURES] || 0,
      postingBatch: averages[STEP_NAMES.POSTING_BATCH] || 0,
      postingResult: averages[STEP_NAMES.POSTING_RESULT] || 0,
      total: averages.total || 0
    };
  }

  /**
   * Get overall performance statistics
   */
  getStatistics(): PerformanceStatistics {
    return {
      totalRequests: this.completedRequests.length + this.currentRequests.size,
      completedRequestsCount: this.completedRequests.filter(r => r.status === 'completed').length,
      failedRequests: this.completedRequests.filter(r => r.status === 'failed').length,
      averages: this.calculateAverages(),
      currentRequests: new Map(this.currentRequests),
      completedRequests: [...this.completedRequests]
    };
  }

  /**
   * Log summary statistics
   */
  logSummaryStatistics(logger: { info: (msg: string) => void }): void {
    const stats = this.getStatistics();
    const averages = stats.averages;

    logger.info('┌─────────────────────────────────────────────────────────────────────┐');
    logger.info('│               📊 DataRequest Performance Statistics                 │');
    logger.info('├─────────────────────────────────────────────────────────────────────┤');
    logger.info(`│ Total Requests: ${stats.totalRequests.toString().padEnd(10)} │ Completed: ${stats.completedRequestsCount.toString().padEnd(10)} │ Failed: ${stats.failedRequests.toString().padEnd(8)} │`);
    logger.info('├─────────────────────────────────────────────────────────────────────┤');
    logger.info('│                     Average Step Timings                           │');
    logger.info('├─────────────────────────────────────────────────────────────────────┤');

    const formatDuration = (ms: number) => {
      const seconds = (ms / 1000).toFixed(2);
      return `${ms.toFixed(0).padStart(6)}ms (${seconds.padStart(6)}s)`;
    };

    logger.info(`│ 🔧 Process:          ${formatDuration(averages.process).padEnd(20)}                     │`);
    logger.info(`│ 📤 Posting:          ${formatDuration(averages.posting).padEnd(20)}                     │`);
    logger.info(`│ ⏳ Awaiting Post:    ${formatDuration(averages.awaitingPost).padEnd(20)}                     │`);
    logger.info(`│ 🔮 Oracle Result:    ${formatDuration(averages.awaitingOracleResult).padEnd(20)}                     │`);
    logger.info(`│ ✍️  Awaiting Sigs:    ${formatDuration(averages.awaitingSignatures).padEnd(20)}                     │`);
    logger.info(`│ 📦 Posting Batch:    ${formatDuration(averages.postingBatch).padEnd(20)}                     │`);
    logger.info(`│ 📋 Posting Result:   ${formatDuration(averages.postingResult).padEnd(20)}                     │`);
    logger.info('├─────────────────────────────────────────────────────────────────────┤');
    logger.info(`│ 🏁 Total Average:    ${formatDuration(averages.total).padEnd(20)}                     │`);
    logger.info('└─────────────────────────────────────────────────────────────────────┘');
  }

  /**
   * Reset all performance data
   */
  reset(): void {
    this.currentRequests.clear();
    this.completedRequests.length = 0;
  }
} 