import { diffLines, diffWordsWithSpace, Change } from 'diff';

export interface DiffRow {
  type: 'unchanged' | 'modified' | 'added' | 'deleted';
  leftLineNumber?: number;
  rightLineNumber?: number;
  leftContent?: string;
  rightContent?: string;
  leftDiffHtml?: string;
  rightDiffHtml?: string;
}

export function computeRevisionDiff(oldText: string, newText: string): DiffRow[] {
  const lineDiffs = diffLines(oldText, newText);
  const rows: DiffRow[] = [];

  let leftLine = 1;
  let rightLine = 1;

  for (let i = 0; i < lineDiffs.length; i++) {
    const part = lineDiffs[i];
    const nextPart = lineDiffs[i + 1];

    // Check if this is a modification (deleted immediately followed by added)
    if (part.removed && nextPart && nextPart.added) {
      const removedLines = part.value.replace(/\n$/, '').split('\n');
      const addedLines = nextPart.value.replace(/\n$/, '').split('\n');
      const maxLen = Math.max(removedLines.length, addedLines.length);

      for (let j = 0; j < maxLen; j++) {
        const remLine = removedLines[j];
        const addLine = addedLines[j];

        if (remLine !== undefined && addLine !== undefined) {
          // Word-level diff within the line
          const wordDiff = diffWordsWithSpace(remLine, addLine);
          let leftHtml = '';
          let rightHtml = '';

          wordDiff.forEach((wd: Change) => {
            if (wd.removed) {
              leftHtml += `<span class="bg-red-200 dark:bg-red-900/60 text-red-900 dark:text-red-200 font-bold px-0.5 rounded">${escapeHtml(wd.value)}</span>`;
            } else if (wd.added) {
              rightHtml += `<span class="bg-emerald-200 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 font-bold px-0.5 rounded">${escapeHtml(wd.value)}</span>`;
            } else {
              leftHtml += escapeHtml(wd.value);
              rightHtml += escapeHtml(wd.value);
            }
          });

          rows.push({
            type: 'modified',
            leftLineNumber: leftLine++,
            rightLineNumber: rightLine++,
            leftContent: remLine,
            rightContent: addLine,
            leftDiffHtml: leftHtml,
            rightDiffHtml: rightHtml,
          });
        } else if (remLine !== undefined) {
          rows.push({
            type: 'deleted',
            leftLineNumber: leftLine++,
            leftContent: remLine,
            leftDiffHtml: escapeHtml(remLine),
          });
        } else if (addLine !== undefined) {
          rows.push({
            type: 'added',
            rightLineNumber: rightLine++,
            rightContent: addLine,
            rightDiffHtml: escapeHtml(addLine),
          });
        }
      }
      i++; // skip nextPart
    } else if (part.removed) {
      const lines = part.value.replace(/\n$/, '').split('\n');
      lines.forEach(line => {
        rows.push({
          type: 'deleted',
          leftLineNumber: leftLine++,
          leftContent: line,
          leftDiffHtml: escapeHtml(line),
        });
      });
    } else if (part.added) {
      const lines = part.value.replace(/\n$/, '').split('\n');
      lines.forEach(line => {
        rows.push({
          type: 'added',
          rightLineNumber: rightLine++,
          rightContent: line,
          rightDiffHtml: escapeHtml(line),
        });
      });
    } else {
      // Unchanged lines
      const lines = part.value.replace(/\n$/, '').split('\n');
      lines.forEach(line => {
        rows.push({
          type: 'unchanged',
          leftLineNumber: leftLine++,
          rightLineNumber: rightLine++,
          leftContent: line,
          rightContent: line,
          leftDiffHtml: escapeHtml(line),
          rightDiffHtml: escapeHtml(line),
        });
      });
    }
  }

  return rows;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
