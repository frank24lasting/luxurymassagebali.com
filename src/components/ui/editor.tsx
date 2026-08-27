import { type ReactNode, useEffect, useRef } from 'react';
import { type Editor, EditorContent, useEditor, type JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Image as ImageIcon,
  Link as LinkIcon,
  Minus,
  RemoveFormatting,
} from 'lucide-react';
import { cn, uploadToCloudinary } from '@/lib/utils';

interface MenuBarProps {
  readonly editor: Editor | null;
}

interface RichTextEditorProps {
  readonly content: JSONContent | string | null | undefined;
  readonly onChange: (content: JSONContent) => void;
}

function ToolbarButton({
  onClick,
  children,
  active = false,
  disabled = false,
  ariaLabel,
  title,
}: {
  readonly onClick: () => void;
  readonly children: ReactNode;
  readonly active?: boolean;
  readonly disabled?: boolean;
  readonly ariaLabel: string;
  readonly title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title || ariaLabel}
      className={cn(
        'p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 text-gray-300 hover:text-white',
        active && 'bg-primary/20 text-primary font-bold shadow-sm',
      )}
    >
      {children}
    </button>
  );
}

function Separator() {
  return <div className="w-px h-6 bg-white/10 mx-1" />;
}

function MenuBar({ editor }: MenuBarProps) {
  if (!editor) return null;

  const addImage = (): void => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (event: Event) => {
      const target = event.target as HTMLInputElement | null;
      const file = target?.files?.[0];
      if (!file) return;

      try {
        const url = await uploadToCloudinary(file, 'luxury-massage-bali/articles');
        editor.chain().focus().setImage({ src: url }).run();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown upload error';
        window.alert(`Image upload failed: ${message}`);
      }
    };
    input.click();
  };

  const setLink = (): void => {
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Masukkan URL link:', previousUrl ?? '');

    if (url === null) return;

    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-white/10 p-2 bg-white/5 rounded-t-xl">
      <ToolbarButton
        ariaLabel="Toggle bold"
        title="Tebal (Bold)"
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
      >
        <Bold className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Toggle italic"
        title="Miring (Italic)"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
      >
        <Italic className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Toggle strikethrough"
        title="Coret (Strike)"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
      >
        <Strikethrough className="w-4 h-4" />
      </ToolbarButton>

      <Separator />

      <ToolbarButton
        ariaLabel="Toggle heading 1"
        title="Heading 1 (Judul Utama)"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })}
      >
        <Heading1 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Toggle heading 2"
        title="Heading 2 (Sub Judul)"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
      >
        <Heading2 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Toggle heading 3"
        title="Heading 3"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
      >
        <Heading3 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Toggle heading 4"
        title="Heading 4"
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        active={editor.isActive('heading', { level: 4 })}
      >
        <Heading4 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Toggle heading 5"
        title="Heading 5"
        onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
        active={editor.isActive('heading', { level: 5 })}
      >
        <Heading5 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Toggle heading 6"
        title="Heading 6"
        onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
        active={editor.isActive('heading', { level: 6 })}
      >
        <Heading6 className="w-4 h-4" />
      </ToolbarButton>

      <Separator />

      <ToolbarButton
        ariaLabel="Toggle bullet list"
        title="Daftar Poin (Bullet List)"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
      >
        <List className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Toggle ordered list"
        title="Daftar Nomor (Numbered List)"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
      >
        <ListOrdered className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Toggle blockquote"
        title="Kutipan (Blockquote)"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
      >
        <Quote className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Insert horizontal rule"
        title="Garis Pembatas"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus className="w-4 h-4" />
      </ToolbarButton>

      <Separator />

      <ToolbarButton
        ariaLabel="Set link"
        title="Sisipkan Link"
        onClick={setLink}
        active={editor.isActive('link')}
      >
        <LinkIcon className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton ariaLabel="Upload image" title="Unggah Gambar" onClick={addImage}>
        <ImageIcon className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Clear formatting"
        title="Hapus Format"
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
      >
        <RemoveFormatting className="w-4 h-4" />
      </ToolbarButton>

      <Separator />

      <ToolbarButton
        ariaLabel="Undo"
        title="Undo (Kembalikan)"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Redo"
        title="Redo (Ulangi)"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo className="w-4 h-4" />
      </ToolbarButton>
    </div>
  );
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const isInternalChange = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        dropcursor: {
          color: '#dcebe4',
          width: 2,
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'text-primary underline font-bold',
        },
      }),
      Youtube.configure({
        inline: false,
      }),
    ],
    content: content || '',
    onUpdate: ({ editor: currentEditor }) => {
      isInternalChange.current = true;
      onChange(currentEditor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[350px] p-5 text-sm leading-relaxed text-gray-200 selection:bg-primary/20',
      },
      transformPastedHTML(html) {
        return html;
      },
      transformPastedText(text) {
        return text;
      },
    },
  });

  // Sync content into editor when prop changes externally (e.g., clicking edit on another article)
  useEffect(() => {
    if (!editor) return;

    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }

    if (!content) {
      if (!editor.isEmpty) {
        editor.commands.setContent('', { emitUpdate: false });
      }
      return;
    }

    const currentJSON = JSON.stringify(editor.getJSON());
    if (typeof content === 'object') {
      const incomingJSON = JSON.stringify(content);
      if (incomingJSON !== currentJSON) {
        editor.commands.setContent(content, { emitUpdate: false });
      }
    } else if (typeof content === 'string') {
      if (content !== editor.getHTML()) {
        editor.commands.setContent(content, { emitUpdate: false });
      }
    }
  }, [content, editor]);

  return (
    <div className="border border-white/10 rounded-xl bg-dark-lighter overflow-hidden focus-within:border-primary/40 transition-colors shadow-sm">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
