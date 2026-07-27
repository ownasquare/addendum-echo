import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const proofDirectory = "/tmp/addendum-echo-proof";
const viewports = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 820, height: 900 },
  { name: "desktop", width: 1440, height: 1000 },
] as const;
const appearances = ["light", "dark"] as const;

test("captures and checks the responsive light and dark matrix", async ({
  page,
}) => {
  await mkdir(proofDirectory, { recursive: true });

  for (const viewport of viewports) {
    for (const appearance of appearances) {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ colorScheme: appearance });
      await page.goto("/");
      await page.locator("#file-input").setInputFiles([
        {
          name: "issued-addendum-12.txt",
          mimeType: "text/plain",
          buffer: Buffer.from(
            "Issued Addendum No. 12 changes the concrete mix on sheet S4.",
          ),
        },
        {
          name: "final-proposal.txt",
          mimeType: "text/plain",
          buffer: Buffer.from(
            "Bid Proposal Form. We acknowledge receipt of Addendum No. 12. Total Bid $125,000.",
          ),
        },
      ]);
      await page.getByRole("button", { name: "Check the proposal" }).click();
      await expect(page.getByText("Check complete.")).toBeVisible();
      await expect(
        page.getByText("Visible identifier evidence found for all 1"),
      ).toBeVisible();

      const dimensions = await page.evaluate(() => ({
        innerWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scrollWidth).toBe(dimensions.innerWidth);

      await page.screenshot({
        path: `${proofDirectory}/${viewport.name}-${appearance}-success.png`,
        fullPage: true,
      });
    }
  }
});

test("keeps the light-mode drop-zone hover state readable", async ({
  page,
}) => {
  await mkdir(proofDirectory, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await page.locator("#drop-zone").hover();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  await expect(page.getByText("or tap to choose files")).toBeVisible();
  await page.screenshot({
    path: `${proofDirectory}/desktop-light-hover.png`,
    fullPage: true,
  });
});
