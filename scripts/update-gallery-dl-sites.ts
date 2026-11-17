import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

interface GallerySite {
  id: string;
  name: string;
  url: string;
  capabilities: string;
  authentication: string;
}

async function fetchAndParseSupportedSites() {
  console.log("Fetching gallery-dl supported sites from GitHub...");
  const response = await fetch("https://raw.githubusercontent.com/mikf/gallery-dl/master/docs/supportedsites.md");
  if (!response.ok) {
    throw new Error(`Failed to fetch supportedsites.md: HTTP ${response.status}`);
  }

  const html = await response.text();
  const sites: GallerySite[] = [];

  // Regex to match table rows: <tr id="ID" title="..."> <td>NAME</td> <td>URL</td> <td>CAPABILITIES</td> <td>AUTH</td> </tr>
  const rowRegex = /<tr\s+id="([^"]+)"[^>]*>[\s\S]*?<td>([\s\S]*?)<\/td>[\s\S]*?<td>([\s\S]*?)<\/td>[\s\S]*?<td>([\s\S]*?)<\/td>[\s\S]*?<td>([\s\S]*?)<\/td>[\s\S]*?<\/tr>/gi;

  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const id = match[1].trim();
    const name = match[2].replace(/<[^>]+>/g, "").trim();
    const urlMatch = match[3].match(/href="([^"]+)"/i) || match[3].match(/>([^<]+)<\/a>/i);
    const url = urlMatch ? urlMatch[1] || urlMatch[2] : match[3].replace(/<[^>]+>/g, "").trim();
    const capabilities = match[4].replace(/<[^>]+>/g, "").trim();
    const authentication = match[5].replace(/<[^>]+>/g, "").trim();

    if (url && url.startsWith("http")) {
      sites.push({
        id,
        name,
        url,
        capabilities,
        authentication,
      });
    }
  }

  // Fallback regex if table structure varies slightly
  if (sites.length === 0) {
    console.log("Using alternative regex parser...");
    const altRowRegex = /<tr[^>]*>[\s\S]*?<td>([\s\S]*?)<\/td>[\s\S]*?<td>([\s\S]*?)<\/td>[\s\S]*?<\/tr>/gi;
    let altMatch;
    while ((altMatch = altRowRegex.exec(html)) !== null) {
      const name = altMatch[1].replace(/<[^>]+>/g, "").trim();
      const urlMatch = altMatch[2].match(/href="([^"]+)"/i) || altMatch[2].match(/>([^<]+)<\/a>/i);
      const url = urlMatch ? urlMatch[1] || urlMatch[2] : altMatch[2].replace(/<[^>]+>/g, "").trim();
      if (url && url.startsWith("http")) {
        sites.push({
          id: name.toLowerCase().replace(/[^a-z0-9]/g, "_"),
          name,
          url,
          capabilities: "",
          authentication: "",
        });
      }
    }
  }

  console.log(`Parsed ${sites.length} supported sites from gallery-dl documentation.`);

  const outputDir = join(process.cwd(), "lib", "metadata");
  mkdirSync(outputDir, { recursive: true });

  const outputPath = join(outputDir, "galleryDlSupportedSites.json");
  writeFileSync(outputPath, JSON.stringify(sites, null, 2), "utf-8");
  console.log(`Successfully saved supported sites to ${outputPath}`);
}

fetchAndParseSupportedSites().catch((err) => {
  console.error("Error updating gallery-dl supported sites:", err);
  process.exit(1);
});
