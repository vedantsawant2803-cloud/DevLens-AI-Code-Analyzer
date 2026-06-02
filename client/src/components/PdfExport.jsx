import { useState } from "react";
import { FileDown } from "lucide-react";
import jsPDF from "jspdf";

export default function PdfExport({ analysis, repoInfo, insights }) {
  const [exporting, setExporting] = useState(false);

  async function exportPdf() {
    setExporting(true);
    try {
      const doc = new jsPDF();
      const { overallScore, level, summary, scores, strengths, improvements, skillGaps, techStack } = analysis;

      doc.setFontSize(20);
      doc.text("DevLens Code Review Report", 20, 20);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`${repoInfo?.owner}/${repoInfo?.name} · ${new Date().toLocaleDateString()}`, 20, 28);

      doc.setTextColor(0);
      doc.setFontSize(36);
      doc.text(String(overallScore), 20, 50);
      doc.setFontSize(12);
      doc.text(`/ 100 · ${level}`, 50, 50);

      doc.setFontSize(11);
      doc.text("Summary", 20, 65);
      const summaryLines = doc.splitTextToSize(summary || "", 170);
      doc.setFontSize(10);
      doc.text(summaryLines, 20, 72);

      let y = 72 + summaryLines.length * 5 + 10;
      doc.setFontSize(11);
      doc.text("Scores", 20, y);
      y += 7;
      doc.setFontSize(10);
      Object.entries(scores || {}).forEach(([k, v]) => {
        doc.text(`${k}: ${v}/100`, 25, y);
        y += 6;
      });

      y += 5;
      doc.setFontSize(11);
      doc.text("Strengths", 20, y);
      y += 7;
      doc.setFontSize(10);
      (strengths || []).forEach((s) => {
        const lines = doc.splitTextToSize(`• ${s}`, 170);
        doc.text(lines, 25, y);
        y += lines.length * 5;
      });

      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.text("Top Improvements", 20, y);
      y += 7;
      (improvements || []).slice(0, 3).forEach((imp) => {
        doc.setFontSize(10);
        doc.text(`${imp.title} [${imp.impact}]`, 25, y);
        y += 5;
        const desc = doc.splitTextToSize(imp.description, 165);
        doc.setFontSize(9);
        doc.text(desc, 25, y);
        y += desc.length * 4 + 4;
      });

      if (insights?.readmeScore) {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFontSize(10);
        doc.text(`README Score: ${insights.readmeScore.score}/100`, 20, y);
        y += 8;
      }

      if (techStack?.length) {
        doc.text(`Tech: ${techStack.join(", ")}`, 20, y);
      }

      doc.save(`devlens-${repoInfo?.name || "report"}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
    }
    setExporting(false);
  }

  return (
    <button
      onClick={exportPdf}
      disabled={exporting}
      className="flex items-center gap-2 bg-surface border border-border text-text font-code text-sm px-4 py-2 rounded-lg hover:border-accent/30 transition-colors disabled:opacity-50"
    >
      <FileDown size={14} />
      {exporting ? "Exporting..." : "PDF Report"}
    </button>
  );
}
