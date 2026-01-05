// src/injector/types.ts

/** TOC start mark info */
export interface TocMarkInfo {
    lineIndex: number;        // Line number (0-based)
    originalText: string;     // Original text (preserve user format)
    hasMatchingEnd: boolean;  // Whether has matching end tag
    matchingEndIndex?: number; // Line number of matching end tag
}

/** TOC end mark info */
export interface TocEndInfo {
    lineIndex: number;        // Line number (0-based)
    offset: number;           // Recorded TOC line count
    hasMatchingMark: boolean; // Whether has matching start tag
    matchingMarkIndex?: number; // Line number of matching start tag
}

/** Stale region info */
export interface StaleRegion {
    type: 'complete' | 'orphan-end' | 'moved-content';
    startLine: number;  // Start line (inclusive)
    endLine: number;    // End line (inclusive)
}

/** Document analysis result */
export interface DocumentAnalysis {
    lines: string[];
    tocMarks: TocMarkInfo[];
    tocEnds: TocEndInfo[];
    activeMark: TocMarkInfo | null;
    staleRegions: StaleRegion[];
}

/** Preview info for a single region to be cleaned */
export interface RegionPreview {
    regionIndex: number;
    startLine: number;
    endLine: number;
    type: StaleRegion['type'];
    /** First line content */
    firstLineContent: string;
    /** Last line content */
    lastLineContent: string;
    /** Total lines in this region */
    lineCount: number;
}

/** Cleanup preview result */
export interface CleanupPreview {
    /** Whether cleanup is needed (has stale regions) */
    needsCleanup: boolean;
    /** Regions to be cleaned */
    regions: RegionPreview[];
    /** Human-readable summary */
    summary: string;
}

/** Injection result */
export interface InjectionResult {
    success: boolean;
    message: string;
    cleanedRegions: number;
}

/** Cleanup info for user confirmation (Future feature) */
export interface CleanupInfo {
    regions: StaleRegion[];
    totalLines: number;
    description: string;
}

export type CleanupConfirmCallback = (info: CleanupInfo) => Promise<boolean>;

export interface InjectorOptions {
    onCleanupConfirm?: CleanupConfirmCallback;
    autoApprove?: boolean;
}