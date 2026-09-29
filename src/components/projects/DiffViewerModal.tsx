import React, { useMemo } from 'react';
import { DiffProposal } from '../../types';
import { Check, X, GitCompare, Sparkles, FileCode } from 'lucide-react';

interface DiffViewerModalProps {
  proposal: DiffProposal;
  onApply: () => void;
  onReject: () => void;
}

interface LineDiff {
  type: 'added' | 'removed' | 'unchanged';
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
}

export const DiffViewerModal: React.FC<DiffViewerModalProps> = ({
  proposal,
  onApply,
  onReject
}) => {
  // Compute line-by-line diff
  const lineDiffs = useMemo(() => {
    const oldLines = proposal.originalContent.split('\n');
    const newLines = proposal.newContent.split('\n');
    const diffs: LineDiff[] = [];

    // Simple diff algorithm for visualization
    let o = 0;
    let n = 0;

    while (o < oldLines.length || n < newLines.length) {
      if (o < oldLines.length && n < newLines.length && oldLines[o] === newLines[n]) {
        diffs.push({
          type: 'unchanged',
          oldLineNumber: o + 1,
          newLineNumber: n + 1,
          content: oldLines[o]
        });
        o++;
        n++;
      } else {
        // If lines differ
        if (o < oldLines.length) {
          diffs.push({
            type: 'removed',
            oldLineNumber: o + 1,
            content: oldLines[o]
          });
          o++;
        }
        if (n < newLines.length) {
          diffs.push({
            type: 'added',
            newLineNumber: n + 1,
            content: newLines[n]
          });
          n++;
        }
      }
    }

    return diffs;
  }, [proposal]);

  const addedCount = lineDiffs.filter((d) => d.type === 'added').length;
  const removedCount = lineDiffs.filter((d) => d.type === 'removed').length;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl h-[85vh] bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">AI Diff Review</h3>
                <span className="font-mono text-xs text-neutral-400">
                  {proposal.filePath}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono mt-0.5">
                <span className="text-emerald-400 font-semibold">+{addedCount} lines</span>
                <span className="text-neutral-600">·</span>
                <span className="text-rose-400 font-semibold">-{removedCount} lines</span>
              </div>
            </div>
          </div>

          {/* Action buttons: Apply vs Reject */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={onReject}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reject</span>
            </button>
            <button
              onClick={onApply}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/25 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Apply Changes</span>
            </button>
          </div>
        </div>

        {/* AI Explanation Banner */}
        {proposal.explanation && (
          <div className="px-6 py-3 bg-neutral-950/60 border-b border-neutral-800/80 flex items-start gap-2.5 text-xs text-neutral-300">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">AI Summary: </span>
              <span className="text-neutral-400">{proposal.explanation}</span>
            </div>
          </div>
        )}

        {/* Diff content line by line */}
        <div className="flex-1 overflow-auto bg-neutral-950 p-4 font-mono text-xs select-text">
          <div className="space-y-0.5">
            {lineDiffs.map((diff, idx) => (
              <div
                key={idx}
                className={`flex items-start px-3 py-0.5 rounded ${
                  diff.type === 'added'
                    ? 'bg-emerald-950/40 text-emerald-200 border-l-2 border-emerald-500'
                    : diff.type === 'removed'
                    ? 'bg-rose-950/40 text-rose-300 border-l-2 border-rose-500'
                    : 'text-neutral-400 hover:bg-neutral-900/50'
                }`}
              >
                {/* Line numbers */}
                <span className="w-8 shrink-0 text-neutral-600 text-right select-none pr-2">
                  {diff.oldLineNumber || ''}
                </span>
                <span className="w-8 shrink-0 text-neutral-600 text-right select-none pr-3">
                  {diff.newLineNumber || ''}
                </span>

                {/* Diff prefix */}
                <span className="w-4 shrink-0 font-bold select-none">
                  {diff.type === 'added' ? '+' : diff.type === 'removed' ? '-' : ' '}
                </span>

                {/* Content */}
                <span className="flex-1 whitespace-pre-wrap break-all">
                  {diff.content}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
