"use client";

import { ChevronDown, FileUp, FolderUp, Upload } from "lucide-react";
import { useRef } from "react";

import { ProviderMark } from "@/components/upload/provider-mark";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IMPORT_PROVIDERS } from "@/constants/import-providers";
import { readPicked } from "@/lib/dropped-entries";
import { enqueue } from "@/lib/upload-store";
import { cn } from "@/lib/utils";

/**
 * Everything that brings content in, in one control.
 *
 * A split button: the left half does the thing nine uses in ten want, the right
 * half opens the rest. Making it a plain dropdown would put a click in front of
 * the most common action in the product; making it a plain button would leave
 * folder upload and every future provider with nowhere to live.
 *
 * The menu is structured rather than flat — "Upload" is from this machine,
 * "Import" is from somewhere else — because those are different mental acts and
 * the section is where Dropbox and OneDrive will land without a redesign.
 *
 * Both inputs are real `<input type="file">` elements, hidden but focusable
 * through the buttons that open them. There is no other way to raise a native
 * file picker, and no reason to want one.
 */
export function UploadMenu({ parentId, onImport }) {
  const filesRef = useRef(null);
  const folderRef = useRef(null);

  const take = (event) => {
    const entries = readPicked(event.target.files);
    if (entries.length) enqueue(entries, parentId);
    // Cleared so choosing the same file twice in a row still fires a change.
    event.target.value = "";
  };

  return (
    <div className="flex items-stretch">
      <input ref={filesRef} type="file" multiple hidden onChange={take} />
      <input
        ref={folderRef}
        type="file"
        hidden
        onChange={take}
        // Non-standard, but it is what every browser implements and the only way
        // to pick a directory. React passes unknown attributes straight through.
        webkitdirectory=""
        directory=""
      />

      <Button size="sm" className="rounded-r-none" onClick={() => filesRef.current?.click()}>
        <Upload />
        Upload
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              size="sm"
              aria-label="More ways to add files"
              className={cn(
                "rounded-l-none px-1.5",
                // A hairline between the two halves, so it reads as one control
                // with two jobs rather than two buttons that happen to touch.
                "before:absolute before:inset-y-1.5 before:left-0 before:w-px before:bg-brand-contrast/25",
              )}
            >
              <ChevronDown className="size-3.5" />
            </Button>
          }
        />

        <DropdownMenuContent align="start" className="w-60">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Upload</DropdownMenuLabel>

            <DropdownMenuItem onClick={() => filesRef.current?.click()}>
              <FileUp className="size-3.5" />
              <span className="flex-1">Files…</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => folderRef.current?.click()}>
              <FolderUp className="size-3.5" />
              <span className="flex-1">Folder…</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuLabel>Import</DropdownMenuLabel>

            {IMPORT_PROVIDERS.map((provider) => (
              <DropdownMenuItem
                key={provider.id}
                disabled={!provider.available}
                onClick={() => provider.available && onImport(provider)}
              >
                <ProviderMark id={provider.id} className="size-3.5" />
                <span className="flex-1">{provider.label}</span>
                {!provider.available ? (
                  <span className="text-2xs text-dim">Soon</span>
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
