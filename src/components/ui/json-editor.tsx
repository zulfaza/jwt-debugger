import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';
import { cn } from '@/lib/utils';

interface JsonEditorBaseProps {
  value: string;
  className?: string;
  placeholder?: string;
  editorClassName?: string;
}

type JsonEditorProps = JsonEditorBaseProps &
  (
    | {
        readOnly: true;
        onChange?: never;
      }
    | {
        readOnly?: false;
        onChange: (value: string) => void;
      }
  );

const highlightJson = (code: string) => {
  return Prism.highlight(code, Prism.languages.json, 'json');
};

export function JsonEditor({
  value,
  onChange,
  className,
  placeholder,
  editorClassName,
  readOnly,
}: JsonEditorProps) {
  const handleValueChange = readOnly ? () => undefined : onChange;

  return (
    <div className={cn('relative', className)}>
      <Editor
        value={value}
        onValueChange={handleValueChange}
        highlight={highlightJson}
        padding={16}
        placeholder={placeholder}
        readOnly={readOnly}
        className={cn(
          'w-full rounded-lg border border-border/70 bg-[var(--editor-surface)] font-mono text-[13px] text-[var(--editor-text)]',
          editorClassName ?? 'min-h-[280px]'
        )}
        textareaClassName={cn('outline-none', readOnly ? 'caret-transparent' : 'caret-primary')}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '13px',
          lineHeight: '1.7',
        }}
      />
      <style>{`
        .token.property { color: var(--editor-property); }
        .token.string { color: var(--editor-string); }
        .token.number { color: var(--editor-number); }
        .token.boolean { color: var(--editor-boolean); }
        .token.null { color: var(--editor-null); }
        .token.punctuation { color: var(--editor-punctuation); }
        .token.operator { color: var(--editor-punctuation); }
      `}</style>
    </div>
  );
}
