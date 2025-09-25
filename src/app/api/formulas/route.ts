import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

type Formula = {
  name: string;
  description: string;
  variables: Record<string, string>;
  formula: string;
};

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), "data");
    const files = await fs.readdir(dataDir);

    const formulas: { [key: string]: Formula[] } = {};

    for (const file of files) {
      if (file.endsWith(".json")) {
        const courseName = path
          .basename(file, ".json")
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        const filePath = path.join(dataDir, file);
        const fileContent = await fs.readFile(filePath, "utf-8");
        const courseFormulas: Formula[] = JSON.parse(fileContent);
        formulas[courseName] = courseFormulas;
      }
    }

    return NextResponse.json(formulas);
  } catch (error) {
    console.error("Error reading formulas:", error);
    return NextResponse.json(
      { error: "Failed to load formulas" },
      { status: 500 }
    );
  }
}
