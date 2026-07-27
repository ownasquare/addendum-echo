import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { PDFDocument, StandardFonts } from "pdf-lib";

async function searchablePdf(text: string): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText(text, { x: 50, y: 720, size: 12, font });
  return Buffer.from(await pdf.save());
}

test("shows one obvious local workflow with no forbidden controls", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Addendum Echo");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Did the final proposal name every addendum?",
  );
  await expect(page.locator("input[type=file]")).toHaveCount(1);
  await expect(page.locator("[data-primary-action]")).toHaveCount(1);
  await expect(page.locator("select, [role=combobox]")).toHaveCount(0);
  await expect(
    page.getByText("Your files stay in this browser."),
  ).toBeVisible();
});

test("extracts a real searchable PDF and reports exact proposal evidence", async ({
  page,
}) => {
  await page.goto("/");
  const pdf = await searchablePdf(
    "Issued Addendum No. 7 changes the concrete detail on sheet S4.",
  );
  await page.locator("#file-input").setInputFiles([
    {
      name: "issued-addendum-7.pdf",
      mimeType: "application/pdf",
      buffer: pdf,
    },
    {
      name: "final-proposal.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(
        "Bid Proposal Form. We acknowledge receipt of Addendum No. 7. Total Bid $42.",
      ),
    },
  ]);
  await page.getByRole("button", { name: "Check the proposal" }).click();
  await expect(
    page.getByText("Visible identifier evidence found for all 1"),
  ).toBeVisible();
  await expect(page.getByText("ACKNOWLEDGED", { exact: true })).toHaveCount(2);
  await expect(
    page.getByRole("link", { name: "Download evidence report" }),
  ).toBeVisible();
  await expect(
    page.getByText(/does not determine legal or bid responsiveness/),
  ).toBeVisible();
});

test("shows review rather than failure for generic acknowledgment language", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#file-input").setInputFiles([
    {
      name: "addendum-8.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Addendum Number 8 changes the site access plan."),
    },
    {
      name: "final-bid.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(
        "Form of Bid. The bidder acknowledges all issued addenda. Total Bid $50.",
      ),
    },
  ]);
  await page.getByRole("button", { name: "Check the proposal" }).click();
  await expect(
    page.getByText("1 of 1 issued addenda need a human review."),
  ).toBeVisible();
  await expect(page.getByText("REVIEW", { exact: true })).toHaveCount(2);
  await expect(page.getByText(/general addenda language/)).toBeVisible();
});

test("uses one friendly recovery sentence for an unsupported file", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#file-input").setInputFiles([
    {
      name: "addendum.png",
      mimeType: "image/png",
      buffer: Buffer.from("not an image"),
    },
    {
      name: "proposal.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Bid Proposal. Total Bid $60."),
    },
  ]);
  await page.getByRole("button", { name: "Check the proposal" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Use searchable PDF or text files and try again.",
  );
});

test("passes automated accessibility checks and supports keyboard initiation", async ({
  page,
}) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);

  await page.locator("#file-input").setInputFiles([
    {
      name: "addendum-9.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Addendum No. 9 changes the finish."),
    },
    {
      name: "proposal.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(
        "Bid Proposal. Acknowledged Addendum No. 9. Total Bid $70.",
      ),
    },
  ]);
  await page.getByRole("button", { name: "Check the proposal" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Check complete.")).toBeVisible();
});
