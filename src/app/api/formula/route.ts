import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { mathjax } from "mathjax-full/js/mathjax.js";
import { TeX } from "mathjax-full/js/input/tex.js";
import { SVG } from "mathjax-full/js/output/svg.js";
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js";
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html.js";

type Formula = {
  name: string;
  description: string;
  variables: Record<string, string>;
  formula: string;
  renderedFormula: string;
  renderedVariables?: Record<string, string>;
};

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), "data");
    const files = await fs.readdir(dataDir);
    const formulasByCourse: Record<string, Formula[]> = {};
    const adaptor = liteAdaptor();
    RegisterHTMLHandler(adaptor);
    const tex = new TeX({ packages: ["base", "ams"] });
    const svg = new SVG({ fontCache: "none" });
    const html = mathjax.document("", { InputJax: tex, OutputJax: svg });

    const isLatex = (key: string) => /\\|_|{}|^/.test(key);

    for (const file of files) {
      if (!file.endsWith(".json")) continue;

      const courseName = path.basename(file, ".json").replace(/_/g, " ");
      const courseFormulas: Formula[] = JSON.parse(
        await fs.readFile(path.join(dataDir, file), "utf-8")
      );

      for (const f of courseFormulas) {
        const svgNode = html.convert(f.formula, { display: true });
        f.renderedFormula = adaptor.innerHTML(svgNode);
        f.renderedVariables = {};
        for (const [key] of Object.entries(f.variables)) {
          if (isLatex(key)) {
            const keyNode = html.convert(key, { display: false });
            f.renderedVariables[key] = adaptor.innerHTML(keyNode);
          }
        }
      }

      formulasByCourse[courseName] = courseFormulas;
    }

    return NextResponse.json(formulasByCourse);
  } catch (err) {
    console.error("Error reading formulas:", err);
    return NextResponse.json(
      { error: "Failed to load formulas" },
      { status: 500 }
    );
  }
}
