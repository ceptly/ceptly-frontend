"use client";

import {
  BookOpen,
  Clipboard,
  FileUp,
  Globe,
  Plus,
  UploadCloud,
  X,
  type LucideIcon,
} from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type SourceType = "upload" | "web" | "kb" | "paste";

const SRC_TYPES: {
  id: SourceType;
  icon: LucideIcon;
  label: string;
  desc: string;
  soon?: boolean;
}[] = [
  {
    id: "upload",
    icon: FileUp,
    label: "Upload files",
    desc: "PDFs, Markdown, plain text — Ceptly reads and indexes them.",
  },
  {
    id: "web",
    icon: Globe,
    label: "Website",
    desc: "Point at your docs site; re-crawled weekly.",
    soon: true,
  },
  {
    id: "kb",
    icon: BookOpen,
    label: "Knowledge base",
    desc: "Notion, Confluence, or Google Drive.",
    soon: true,
  },
  {
    id: "paste",
    icon: Clipboard,
    label: "Raw text",
    desc: "Notes, a strategy memo, anything.",
  },
];

const ACCEPTED = ".md,.markdown,.txt,.pdf";

interface AddSourceModalProps {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
  onPaste: (name: string, text: string) => void;
}

export function AddSourceModal({
  open,
  onClose,
  onUpload,
  onPaste,
}: AddSourceModalProps) {
  const [type, setType] = useState<SourceType>("upload");
  const [text, setText] = useState("");
  const [textName, setTextName] = useState("");
  const [drag, setDrag] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  if (!open) return null;

  function reset() {
    setText("");
    setTextName("");
    setDrag(false);
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    onUpload(file);
    reset();
    onClose();
  }

  function submitPaste() {
    if (!text.trim()) return;
    onPaste(textName.trim() || "Pasted notes", text.trim());
    reset();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-[520px] flex-col border border-border bg-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div>
            <div className="text-[15px] font-semibold">Add a source</div>
            <div className="text-xs text-muted-foreground">
              Ceptly indexes it, then suggests what it learned for your review.
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-[18px]" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
          <div className="kn-srcpick">
            {SRC_TYPES.map((t) => {
              const TypeIcon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={t.soon}
                  className={type === t.id ? "sel" : ""}
                  onClick={() => setType(t.id)}
                >
                  <TypeIcon size={17} />
                  <span className="kn-srcpick-label">
                    {t.label}
                    {t.soon ? (
                      <span className="kn-srcpick-soon">Coming soon</span>
                    ) : null}
                  </span>
                  <span className="kn-srcpick-desc">{t.desc}</span>
                </button>
              );
            })}
          </div>

          {type === "upload" ? (
            <div
              className={"kn-drop" + (drag ? " drag" : "")}
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                handleFiles(e.dataTransfer.files);
              }}
              onClick={() => fileInput.current?.click()}
            >
              <UploadCloud size={22} />
              <div className="kn-drop-txt">Drop a file here, or click to browse</div>
              <div className="kn-drop-sub">PDF, Markdown, or plain text · up to 15 MB</div>
              <input
                ref={fileInput}
                type="file"
                accept={ACCEPTED}
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
          ) : null}

          {type === "paste" ? (
            <div className="flex flex-col gap-3">
              <div>
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                  Name
                </span>
                <Input
                  placeholder="Q4 strategy notes"
                  value={textName}
                  onChange={(e) => setTextName(e.target.value)}
                />
              </div>
              <div>
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                  Text
                </span>
                <Textarea
                  rows={5}
                  placeholder="Paste anything Ceptly should know…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>
            </div>
          ) : null}
        </div>

        {type === "paste" ? (
          <div className="flex items-center justify-end gap-2 border-t border-border p-4">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              disabled={!text.trim()}
              onClick={submitPaste}
            >
              <Plus size={13} /> Add source
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
