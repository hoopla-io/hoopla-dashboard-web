import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  Category,
  CategoryLanguage,
  CategoryTranslationInput,
  SaveCategoryRequest,
} from "@/lib/api/schemas/categories";

type TranslationDraft = {
  name: string;
  description: string;
};

type TranslationState = Record<CategoryLanguage, TranslationDraft | null>;

const languages: Array<{ code: CategoryLanguage; label: string }> = [
  { code: "ru", label: "Russian" },
  { code: "uz", label: "Uzbek" },
  { code: "en", label: "English" },
];

const emptyTranslation = (): TranslationDraft => ({ name: "", description: "" });

function initialState(category?: Category): TranslationState {
  if (!category) {
    return { ru: emptyTranslation(), uz: emptyTranslation(), en: emptyTranslation() };
  }
  const state: TranslationState = { ru: emptyTranslation(), uz: null, en: null };
  category.translations.forEach((translation) => {
    state[translation.language] = {
      name: translation.name,
      description: translation.description ?? "",
    };
  });
  return state;
}

type CategoryFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category;
  pending: boolean;
  onSubmit: (data: SaveCategoryRequest) => void;
};

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  pending,
  onSubmit,
}: CategoryFormDialogProps) {
  const [translations, setTranslations] = useState<TranslationState>(() => initialState(category));

  useEffect(() => {
    if (open) setTranslations(initialState(category));
  }, [open, category]);

  const setField = (language: CategoryLanguage, field: keyof TranslationDraft, value: string) => {
    setTranslations((current) => {
      const translation = current[language];
      if (!translation) return current;
      return { ...current, [language]: { ...translation, [field]: value } };
    });
  };

  const submit = () => {
    const payload = languages.flatMap<CategoryTranslationInput>(({ code }) => {
      const translation = translations[code];
      if (!translation) return [];
      return [{
        language: code,
        name: translation.name.trim(),
        description: translation.description.trim() || null,
      }];
    });
    onSubmit({ translations: payload });
  };

  const missingRequiredName = languages.some(({ code }) => {
    const translation = translations[code];
    return translation !== null && translation.name.trim() === "";
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{category ? "Edit category" : "Create category"}</DialogTitle>
          <DialogDescription>
            Russian is the permanent fallback. Uzbek and English can be added or removed later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {languages.map(({ code, label }) => {
            const translation = translations[code];
            if (!translation) {
              return (
                <div key={code} className="flex items-center justify-between rounded-lg border border-dashed p-4">
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">No {label.toLowerCase()} translation</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTranslations((current) => ({ ...current, [code]: emptyTranslation() }))}
                  >
                    <Plus className="size-4" />
                    Add translation
                  </Button>
                </div>
              );
            }

            return (
              <section key={code} className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{code}</p>
                  </div>
                  {category && code !== "ru" ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setTranslations((current) => ({ ...current, [code]: null }))}
                    >
                      <X className="size-4" />
                      Remove
                    </Button>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`${code}-category-name`}>Name</Label>
                  <Input
                    id={`${code}-category-name`}
                    value={translation.name}
                    onChange={(event) => setField(code, "name", event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`${code}-category-description`}>Description</Label>
                  <Textarea
                    id={`${code}-category-description`}
                    value={translation.description}
                    onChange={(event) => setField(code, "description", event.target.value)}
                    rows={2}
                  />
                </div>
              </section>
            );
          })}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={pending || missingRequiredName}>
            {pending ? "Saving…" : category ? "Save changes" : "Create category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
