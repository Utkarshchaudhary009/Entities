"use client";

import {
  EyeIcon,
  FloppyDiskIcon,
  Loading03Icon,
  PencilEdit01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useBrandStore } from "@/stores/brand.store";
import { fetchApi } from "@/stores/http";
import type { ApiBrand } from "@/types/api";
import type { DocumentType } from "@/types/domain";

// ─── Constants ──────────────────────────────────────────────────────────────

const DOCUMENT_TYPES: { type: DocumentType; label: string; short: string }[] = [
  { type: "RETURN_POLICY", label: "Return Policy", short: "Return" },
  { type: "SHIPPING_POLICY", label: "Shipping Policy", short: "Shipping" },
  { type: "REFUND_POLICY", label: "Refund Policy", short: "Refund" },
  { type: "PRIVACY_POLICY", label: "Privacy Policy", short: "Privacy" },
  {
    type: "TERMS_AND_CONDITIONS",
    label: "Terms & Conditions",
    short: "T&C",
  },
];

interface BrandDocument {
  id: string;
  type: DocumentType;
  content: string;
  isActive: boolean;
  brandId: string;
  version: number;
  updatedAt: string;
}

type DocState = {
  doc: BrandDocument | null;
  content: string;
  isActive: boolean;
  isDirty: boolean;
  error?: string;
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function AdminBrandDocumentsPage() {
  const { brand, fetchBrandDetails } = useBrandStore();
  const [brandId, setBrandId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DocumentType>("RETURN_POLICY");
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [initLoading, setInitLoading] = useState(true);

  // Per-tab document state
  const [docStates, setDocStates] = useState<Record<DocumentType, DocState>>(
    () =>
      Object.fromEntries(
        DOCUMENT_TYPES.map(({ type }) => [
          type,
          {
            doc: null,
            content: "",
            isActive: true,
            isDirty: false,
            error: undefined,
          },
        ]),
      ) as Record<DocumentType, DocState>,
  );

  // Track beforeunload for dirty state
  const isDirtyRef = useRef(false);
  useEffect(() => {
    isDirtyRef.current = Object.values(docStates).some((s) => s.isDirty);
  }, [docStates]);

  // ── Load brand + documents on mount ──────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const resp = await fetchApi<{ data: ApiBrand[] }>(
          "/api/brands?limit=1",
        );
        const id = resp.data?.[0]?.id;
        if (!id) return;
        setBrandId(id);
        if (!brand) await fetchBrandDetails(id);

        const docsResp = await fetchApi<{ data: BrandDocument[] }>(
          `/api/brand-documents?brandId=${id}&limit=10`,
        );
        const docs = docsResp.data ?? [];

        setDocStates((prev) => {
          const next = { ...prev };
          for (const doc of docs) {
            next[doc.type as DocumentType] = {
              doc,
              content: doc.content,
              isActive: doc.isActive,
              isDirty: false,
              error: undefined,
            };
          }
          return next;
        });
      } catch (error) {
        console.error("Failed to load brand documents", error);
        toast.error("Could not load brand documents");
      } finally {
        setInitLoading(false);
      }
    }
    load();
  }, [brand, fetchBrandDetails]);

  // ── Update single doc state field ─────────────────────────────────────────
  const patchState = useCallback(
    (type: DocumentType, patch: Partial<DocState>) => {
      setDocStates((prev) => ({
        ...prev,
        [type]: { ...prev[type], ...patch },
      }));
    },
    [],
  );

  // ── Save (create or update) ───────────────────────────────────────────────
  const handleSave = async () => {
    if (!brandId) return;
    const state = docStates[activeTab];
    if (!state.isDirty) return;

    const schema = z.object({
      content: z.string().min(1, "Document content cannot be empty"),
    });
    const validation = schema.safeParse({ content: state.content.trim() });

    if (!validation.success) {
      const errMsg =
        validation.error.format().content?._errors[0] || "Validation failed";
      patchState(activeTab, { error: errMsg });
      toast.error(errMsg);
      return;
    }

    setIsSaving(true);
    try {
      if (state.doc) {
        // UPDATE
        const updated = await fetchApi<BrandDocument>(
          `/api/brand-documents/${state.doc.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: state.content,
              isActive: state.isActive,
            }),
          },
        );
        patchState(activeTab, { doc: updated, isDirty: false });
      } else {
        // CREATE
        const created = await fetchApi<BrandDocument>("/api/brand-documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: activeTab,
            content: state.content,
            isActive: state.isActive,
            brandId,
            version: 1,
          }),
        });
        patchState(activeTab, { doc: created, isDirty: false });
      }
      toast.success("Document saved");
    } catch (error) {
      console.error("Save failed", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save document",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ── Warn on unsaved tab switch ─────────────────────────────────────────────
  const handleTabChange = (tab: DocumentType) => {
    if (docStates[activeTab].isDirty) {
      toast.warning("You have unsaved changes — save before switching tabs.");
      return;
    }
    setIsPreview(false);
    setActiveTab(tab);
  };

  const current = docStates[activeTab];

  // ── Skeleton loader ────────────────────────────────────────────────────────
  if (initLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <HugeiconsIcon
          icon={Loading03Icon}
          className="size-8 animate-spin text-muted-foreground"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Brand Documents</h1>
        <p className="text-sm text-muted-foreground">
          Manage legal policy pages shown to your customers.
        </p>
      </div>

      {/* Mobile: Select dropdown | Desktop: Tabs */}
      <div className="md:hidden">
        <Select
          value={activeTab}
          onValueChange={(v) => handleTabChange(v as DocumentType)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_TYPES.map(({ type, label }) => (
              <SelectItem key={type} value={type}>
                {label}
                {docStates[type].isDirty && (
                  <span className="ml-1 text-amber-500">•</span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="hidden md:block">
        <Tabs
          value={activeTab}
          onValueChange={(v) => handleTabChange(v as DocumentType)}
        >
          <TabsList className="w-full justify-start overflow-x-auto">
            {DOCUMENT_TYPES.map(({ type, short }) => (
              <TabsTrigger key={type} value={type} className="relative gap-1.5">
                {short}
                {docStates[type].isDirty && (
                  <span className="size-1.5 rounded-full bg-amber-500" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant={isPreview ? "ghost" : "secondary"}
            size="sm"
            className="gap-2"
            onClick={() => setIsPreview(false)}
          >
            <HugeiconsIcon icon={PencilEdit01Icon} className="size-4" />
            <span className="hidden sm:inline">Write</span>
          </Button>
          <Button
            variant={isPreview ? "secondary" : "ghost"}
            size="sm"
            className="gap-2"
            onClick={() => setIsPreview(true)}
          >
            <HugeiconsIcon icon={EyeIcon} className="size-4" />
            <span className="hidden sm:inline">Preview</span>
          </Button>
        </div>

        <div className="flex items-center gap-4">
          {/* Active toggle */}
          <div className="flex cursor-pointer items-center gap-2 select-none">
            <Switch
              checked={current.isActive}
              onCheckedChange={(checked) =>
                patchState(activeTab, { isActive: checked, isDirty: true })
              }
            />
            <span className="text-sm text-muted-foreground">
              {current.isActive ? "Active" : "Inactive"}
            </span>
          </div>

          <Button
            onClick={handleSave}
            size="sm"
            disabled={!current.isDirty || isSaving}
            className="min-w-[90px] gap-2"
          >
            {isSaving ? (
              <HugeiconsIcon
                icon={Loading03Icon}
                className="size-4 animate-spin"
              />
            ) : (
              <HugeiconsIcon icon={FloppyDiskIcon} className="size-4" />
            )}
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {/* Editor / Preview */}
      <div className="flex-1 space-y-2">
        {isPreview ? (
          <div
            className="prose prose-sm dark:prose-invert min-h-[50vh] max-w-none rounded-xl border border-border bg-muted/30 p-6"
            /* biome-ignore lint/security/noDangerouslySetInnerHtml: admin-only markdown preview */
            dangerouslySetInnerHTML={{
              __html: renderMarkdown(current.content),
            }}
          />
        ) : (
          <Textarea
            value={current.content}
            onChange={(e) =>
              patchState(activeTab, {
                content: e.target.value,
                isDirty: true,
                error: undefined,
              })
            }
            placeholder={`Write your ${
              DOCUMENT_TYPES.find((d) => d.type === activeTab)?.label ??
              "document"
            } here in Markdown…`}
            className="min-h-[55vh] w-full resize-none font-mono text-sm leading-relaxed"
            spellCheck={false}
          />
        )}
        {!isPreview && current.error && (
          <p className="text-sm font-medium text-destructive">
            {current.error}
          </p>
        )}
      </div>

      {/* Footer status */}
      <p className="text-right text-xs text-muted-foreground">
        {current.isDirty ? (
          <span className="text-amber-500">Unsaved changes</span>
        ) : current.doc?.updatedAt ? (
          `Last saved ${formatRelative(current.doc.updatedAt)}`
        ) : (
          "Not yet saved"
        )}
      </p>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Very lightweight Markdown → HTML (no build dep). Handles headings, bold, lists, links. */
function renderMarkdown(md: string): string {
  if (!md.trim())
    return "<p class='text-muted-foreground'>Nothing to preview.</p>";
  return md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]*<\/li>)/, "<ul>$1</ul>")
    .replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
    )
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/^(?!<[hul])(.+)$/gm, "<p>$1</p>");
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString();
}
