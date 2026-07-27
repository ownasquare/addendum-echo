import type { ExtractedDocument } from "./analyze";

export const MAX_FILES = 20;
export const MAX_FILE_BYTES = 15 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 60 * 1024 * 1024;

export class FileInputError extends Error {}

function fileKind(file: File): "pdf" | "text" | null {
  const lower = file.name.toLowerCase();
  if (file.type === "application/pdf" || lower.endsWith(".pdf")) return "pdf";
  if (
    file.type.startsWith("text/") ||
    lower.endsWith(".txt") ||
    lower.endsWith(".md")
  ) {
    return "text";
  }
  return null;
}

export function validateFiles(files: File[]): void {
  if (files.length < 2) {
    throw new FileInputError(
      "Add at least one issued addendum and one final proposal, then try again.",
    );
  }
  if (files.length > MAX_FILES) {
    throw new FileInputError(
      `Keep this check to ${MAX_FILES} files or fewer and try again.`,
    );
  }
  if (files.some((file) => !fileKind(file))) {
    throw new FileInputError("Use searchable PDF or text files and try again.");
  }
  if (files.some((file) => file.size > MAX_FILE_BYTES)) {
    throw new FileInputError("Keep each file under 15 MB and try again.");
  }
  const totalBytes = files.reduce((total, file) => total + file.size, 0);
  if (totalBytes > MAX_TOTAL_BYTES) {
    throw new FileInputError(
      "Keep the full file set under 60 MB and try again.",
    );
  }
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl.default;

  const data = new Uint8Array(await file.arrayBuffer());
  const document = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(
      content.items
        .map((item) => ("str" in item ? item.str : ""))
        .filter(Boolean)
        .join(" "),
    );
  }
  return pages.join("\n");
}

export async function extractFiles(
  files: File[],
  onProgress: (complete: number, total: number) => void = () => {},
): Promise<ExtractedDocument[]> {
  validateFiles(files);
  const documents: ExtractedDocument[] = [];

  for (const [index, file] of files.entries()) {
    const kind = fileKind(file);
    if (!kind)
      throw new FileInputError(
        "Use searchable PDF or text files and try again.",
      );
    try {
      const text = kind === "pdf" ? await extractPdf(file) : await file.text();
      if (!text.trim()) {
        throw new FileInputError(
          `${file.name} has no searchable text; use a searchable copy and try again.`,
        );
      }
      documents.push({ name: file.name, text, kind });
      onProgress(index + 1, files.length);
    } catch (error) {
      if (error instanceof FileInputError) throw error;
      throw new FileInputError(
        `${file.name} could not be read; use a searchable copy and try again.`,
      );
    }
  }

  return documents;
}
