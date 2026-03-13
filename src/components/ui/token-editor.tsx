import Editor from 'react-simple-code-editor';
import { cn } from '@/lib/utils';

interface TokenEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function highlightJwt(value: string): string {
  const parts = value.split(/(\.)/);
  let segmentIndex = 0;

  return parts
    .map((part) => {
      if (part === '.') {
        return '<span class="jwt-separator">.</span>';
      }

      const escaped = escapeHtml(part);
      const currentIndex = segmentIndex;
      segmentIndex += 1;

      if (currentIndex === 0) {
        return `<span class="jwt-segment-header">${escaped}</span>`;
      }

      if (currentIndex === 1) {
        return `<span class="jwt-segment-payload">${escaped}</span>`;
      }

      if (currentIndex === 2) {
        return `<span class="jwt-segment-signature">${escaped}</span>`;
      }

      return `<span class="jwt-segment-extra">${escaped}</span>`;
    })
    .join('');
}

export function TokenEditor({
  value,
  onChange,
  className,
  placeholder,
}: TokenEditorProps) {
  return (
    <div className={cn('relative', className)}>
      <Editor
        value={value}
        onValueChange={onChange}
        highlight={highlightJwt}
        padding={16}
        placeholder={placeholder}
        className='min-h-[188px] w-full rounded-lg border border-border/70 bg-[var(--editor-surface)] font-mono text-[13px] text-[var(--editor-text)]'
        textareaClassName='outline-none caret-primary'
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          lineHeight: '1.7',
          wordBreak: 'break-all',
        }}
      />
      <style>{`
        .jwt-segment-header { color: var(--jwt-segment-header); }
        .jwt-segment-payload { color: var(--jwt-segment-payload); }
        .jwt-segment-signature { color: var(--jwt-segment-signature); }
        .jwt-segment-extra { color: var(--jwt-segment-extra); }
        .jwt-separator { color: var(--jwt-separator); }
      `}</style>
    </div>
  );
}
