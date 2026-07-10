"use client";

import { useEffect, useRef, useState } from "react";
import { Pen, Eraser, Trash2, Download, Undo2 } from "lucide-react";
import AppShell from "@/components/AppShell";

const COLORS = ["#1A1A1A", "#2D8CFF", "#E74C3C", "#27AE60", "#F39C12", "#8E44AD"];

/** A standalone drawing whiteboard (single-user canvas). */
export default function WhiteboardsPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawing = useRef(false);
  const strokes = useRef<ImageData[]>([]); // undo history

  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(4);

  // Initialise the canvas sized to its container, on a white background.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      // Preserve drawing across resize.
      const prev = ctxRef.current?.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext("2d")!;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (prev) ctx.putImageData(prev, 0, 0);
      ctxRef.current = ctx;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  function pos(e: React.PointerEvent) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent) {
    const ctx = ctxRef.current!;
    // Snapshot for undo before a new stroke.
    strokes.current.push(
      ctx.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height)
    );
    if (strokes.current.length > 30) strokes.current.shift();
    drawing.current = true;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e: React.PointerEvent) {
    if (!drawing.current) return;
    const ctx = ctxRef.current!;
    const { x, y } = pos(e);
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
    ctx.lineWidth = tool === "eraser" ? size * 4 : size;
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function end() {
    drawing.current = false;
  }

  function undo() {
    const ctx = ctxRef.current!;
    const last = strokes.current.pop();
    if (last) ctx.putImageData(last, 0, 0);
  }

  function clear() {
    const canvas = canvasRef.current!;
    const ctx = ctxRef.current!;
    strokes.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function download() {
    const url = canvasRef.current!.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "whiteboard.png";
    a.click();
  }

  const toolBtn =
    "flex h-9 w-9 items-center justify-center rounded-lg border transition";

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Whiteboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sketch ideas — draw, erase, undo, and export as PNG.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-card">
        <button
          onClick={() => setTool("pen")}
          className={`${toolBtn} ${
            tool === "pen"
              ? "border-zoom-blue bg-blue-50 text-zoom-blue"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
          title="Pen"
        >
          <Pen size={17} />
        </button>
        <button
          onClick={() => setTool("eraser")}
          className={`${toolBtn} ${
            tool === "eraser"
              ? "border-zoom-blue bg-blue-50 text-zoom-blue"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
          title="Eraser"
        >
          <Eraser size={17} />
        </button>

        <div className="mx-1 h-6 w-px bg-gray-200" />

        <div className="flex items-center gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => {
                setColor(c);
                setTool("pen");
              }}
              className={`h-6 w-6 rounded-full border-2 ${
                color === c && tool === "pen"
                  ? "border-gray-800"
                  : "border-white"
              }`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>

        <div className="mx-1 h-6 w-px bg-gray-200" />

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Size</span>
          <input
            type="range"
            min={2}
            max={20}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="accent-zoom-blue"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={undo}
            className={`${toolBtn} border-gray-200 text-gray-600 hover:bg-gray-50`}
            title="Undo"
          >
            <Undo2 size={17} />
          </button>
          <button
            onClick={clear}
            className={`${toolBtn} border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-500`}
            title="Clear"
          >
            <Trash2 size={17} />
          </button>
          <button
            onClick={download}
            className="flex items-center gap-1.5 rounded-lg bg-zoom-blue px-3 py-2 text-sm font-medium text-white hover:bg-zoom-bluehover"
          >
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="h-[60vh] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          className="h-full w-full cursor-crosshair touch-none"
        />
      </div>
    </AppShell>
  );
}
