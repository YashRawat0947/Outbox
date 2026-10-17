import { useState } from 'react';
import {
  AlignCenter, AlignLeft, Bold, ChevronsUpDown, IndentDecrease, IndentIncrease, Italic, List, ListOrdered,
  Quote, Redo2, Strikethrough, Type, Underline, Undo2,
} from 'lucide-react';

const SIZES = [['Small', '2'], ['Normal', '3'], ['Large', '5'], ['Huge', '6']];

export default function RichEditor({ editorRef }) {
  const [empty, setEmpty] = useState(true);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [spaced, setSpaced] = useState(false);

  const exec = (cmd, val) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
  };

  const Btn = ({ icon: Icon, label, onClick }) => (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-ink"
    >
      <Icon size={17} strokeWidth={1.75} />
    </button>
  );
  const Sep = () => <span className="mx-1 h-5 w-px bg-line" />;

  return (
    <div className="relative rounded-2xl bg-[#fafafa]">
      {empty && <p className="pointer-events-none absolute left-5 top-4 text-sm text-muted">Type Your Reply...</p>}

      <div className="px-4 pb-2 pt-12">
        <div className="relative flex flex-wrap items-center rounded-full bg-white px-3 py-1.5">
          <Btn icon={Undo2} label="Undo" onClick={() => exec('undo')} />
          <Btn icon={Redo2} label="Redo" onClick={() => exec('redo')} />
          <Sep />
          <div className="relative">
            <button
              type="button"
              aria-label="Text size"
              aria-expanded={sizeOpen}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setSizeOpen((o) => !o)}
              className="flex h-8 items-center gap-0.5 rounded-md px-1.5 text-muted hover:bg-surface hover:text-ink"
            >
              <Type size={17} strokeWidth={1.75} />
              <ChevronsUpDown size={11} />
            </button>
            {sizeOpen && (
              <div className="absolute left-0 top-9 z-10 w-28 rounded-lg border border-line bg-white p-1 shadow-lg">
                {SIZES.map(([label, v]) => (
                  <button
                    key={v}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      exec('fontSize', v);
                      setSizeOpen(false);
                    }}
                    className="block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-surface"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Sep />
          <Btn icon={Bold} label="Bold" onClick={() => exec('bold')} />
          <Btn icon={Italic} label="Italic" onClick={() => exec('italic')} />
          <Btn icon={Underline} label="Underline" onClick={() => exec('underline')} />
          <Sep />
          <Btn icon={AlignCenter} label="Align center" onClick={() => exec('justifyCenter')} />
          <Btn icon={ChevronsUpDown} label="Line spacing" onClick={() => setSpaced((s) => !s)} />
          <Sep />
          <Btn icon={ListOrdered} label="Numbered list" onClick={() => exec('insertOrderedList')} />
          <Btn icon={List} label="Bulleted list" onClick={() => exec('insertUnorderedList')} />
          <Btn icon={IndentIncrease} label="Indent" onClick={() => exec('indent')} />
          <Btn icon={IndentDecrease} label="Outdent" onClick={() => exec('outdent')} />
          <Btn icon={Quote} label="Quote" onClick={() => exec('formatBlock', 'blockquote')} />
          <Btn icon={AlignLeft} label="Align left" onClick={() => exec('justifyLeft')} />
          <Sep />
          <Btn icon={Strikethrough} label="Strikethrough" onClick={() => exec('strikeThrough')} />
        </div>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Email body"
        data-placeholder=""
        onInput={(e) => setEmpty(!e.currentTarget.textContent.trim() && !e.currentTarget.querySelector('img'))}
        style={{ lineHeight: spaced ? 2 : undefined }}
        className="rich-editor"
      />
    </div>
  );
}
