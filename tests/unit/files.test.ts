import { describe, expect, it } from "vitest";
import {
  FileInputError,
  MAX_FILE_BYTES,
  MAX_FILES,
  validateFiles,
} from "../../src/files";

function fakeFile(name: string, size = 20, type = "text/plain"): File {
  return { name, size, type } as File;
}

describe("file input boundaries", () => {
  it("accepts a bounded PDF and text pair", () => {
    expect(() =>
      validateFiles([
        fakeFile("addendum.pdf", 100, "application/pdf"),
        fakeFile("proposal.txt"),
      ]),
    ).not.toThrow();
  });

  it("rejects unsupported types", () => {
    expect(() =>
      validateFiles([
        fakeFile("photo.png", 100, "image/png"),
        fakeFile("proposal.txt"),
      ]),
    ).toThrow(FileInputError);
  });

  it("rejects oversized files and excessive counts", () => {
    expect(() =>
      validateFiles([
        fakeFile("large.pdf", MAX_FILE_BYTES + 1, "application/pdf"),
        fakeFile("proposal.txt"),
      ]),
    ).toThrow("under 15 MB");
    expect(() =>
      validateFiles(
        Array.from({ length: MAX_FILES + 1 }, (_, index) =>
          fakeFile(`document-${index}.txt`),
        ),
      ),
    ).toThrow(`${MAX_FILES} files`);
  });
});
