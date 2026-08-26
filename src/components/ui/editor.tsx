import { type ReactNode } from 'react';
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
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Image as ImageIcon,
  Link as LinkIcon,
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
}: {
  readonly onClick: () => void;
  readonly children: ReactNode;
  readonly active?: boolean;
  readonly disabled?: boolean;
  readonly ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50',
        active && 'bg-primary/20 text-primary',
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
    const url = window.prompt('URL', previousUrl ?? '');

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
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
      >
        <Bold className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Toggle italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
      >
        <Italic className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Toggle strikethrough"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
      >
        <Strikethrough className="w-4 h-4" />
      </ToolbarButton>

      <Separator />

      <ToolbarButton
        ariaLabel="Toggle heading 1"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })}
      >
        <Heading1 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Toggle heading 2"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
      >
        <Heading2 className="w-4 h-4" />
      </ToolbarButton>

      <Separator />

      <ToolbarButton
        ariaLabel="Toggle bullet list"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
      >
        <List className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Toggle ordered list"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
      >
        <ListOrdered className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Toggle blockquote"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
      >
        <Quote className="w-4 h-4" />
      </ToolbarButton>

      <Separator />

      <ToolbarButton
        ariaLabel="Set link"
        onClick={setLink}
        active={editor.isActive('link')}
      >
        <LinkIcon className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton ariaLabel="Upload image" onClick={addImage}>
        <ImageIcon className="w-4 h-4" />
      </ToolbarButton>

      <Separator />

      <ToolbarButton
        ariaLabel="Undo"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Redo"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo className="w-4 h-4" />
      </ToolbarButton>
    </div>
  );
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
      Youtube.configure({ inline: false }),
    ],
    content,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px] p-4 text-sm',
      },
    },
  });

  return (
    <div className="border border-white/10 rounded-xl bg-dark-lighter overflow-hidden">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
