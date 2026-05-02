import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { WORKSPACE, DOCS_DIR } from "@/lib/paths";

// POST /api/docs — create a new document
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content, directory } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const dir = directory === "articles"
      ? path.join(WORKSPACE, "articles")
      : directory === "content"
      ? path.join(WORKSPACE, "content")
      : DOCS_DIR;

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const filename = title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      + ".md";
    const filePath = path.join(dir, filename);

    if (fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File already exists" }, { status: 409 });
    }

    const fullContent = `# ${title.trim()}\n\n${content?.trim() || ""}\n`;
    fs.writeFileSync(filePath, fullContent, "utf-8");

    return NextResponse.json({
      ok: true,
      path: path.relative(WORKSPACE, filePath),
      filename,
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/docs — update document content
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { filePath, content } = body;

    if (!filePath || content === undefined) {
      return NextResponse.json({ error: "filePath and content are required" }, { status: 400 });
    }

    const abs = path.join(WORKSPACE, filePath);

    // Security: ensure path stays within workspace
    if (!abs.startsWith(WORKSPACE)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 403 });
    }

    if (!fs.existsSync(abs)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    fs.writeFileSync(abs, content, "utf-8");

    return NextResponse.json({ ok: true, path: filePath });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/docs — delete a document
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("path");

    if (!filePath) {
      return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    const abs = path.join(WORKSPACE, filePath);

    if (!abs.startsWith(WORKSPACE)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 403 });
    }

    if (!fs.existsSync(abs)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    fs.unlinkSync(abs);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
