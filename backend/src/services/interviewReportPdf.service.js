import PDFDocument from "pdfkit";

/**
 * Generates a single-column A4 PDF Buffer for an Interview Prep final report.
 * Uses Helvetica, headings, bullets, and automatic page breaks (no images).
 *
 * @param {Object} payload
 * @param {string} payload.role
 * @param {string} [payload.date]
 * @param {Object} payload.stats
 * @param {Object|null} payload.report
 * @param {Array} payload.items
 * @returns {Promise<Buffer>}
 */
export async function generateInterviewReportPdfBuffer({
  role = "Software Engineer",
  date,
  stats = {},
  report = null,
  items = [],
} = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 40, bottom: 48, left: 42, right: 42 },
      info: {
        Title: `Career OS Interview Practice Report - ${role}`,
        Author: "Career OS",
      },
      bufferPages: true,
    });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err) => reject(err));

    const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colorPrimary = "#111827";
    const colorHeading = "#064E3B";
    const colorDivider = "#D1D5DB";
    const colorMuted = "#4B5563";

    const formattedDate =
      date ||
      new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      });

    const ensureSpace = (neededHeight = 60) => {
      if (doc.y + neededHeight > doc.page.height - doc.page.margins.bottom - 24) {
        doc.addPage();
      }
    };

    const renderHeading = (title) => {
      ensureSpace(44);
      doc.moveDown(0.7);
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor(colorHeading)
        .text(title, { align: "left" });

      const currentY = doc.y + 2;
      doc
        .strokeColor(colorDivider)
        .lineWidth(0.75)
        .moveTo(doc.page.margins.left, currentY)
        .lineTo(doc.page.width - doc.page.margins.right, currentY)
        .stroke();
      doc.moveDown(0.45);
    };

    // ── Header ───────────────────────────────────────────────────────────────
    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor(colorHeading)
      .text("Career OS — Interview Practice Report", { align: "left" });

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(colorMuted)
      .text(`Target Role: ${role}   |   Date: ${formattedDate}`, { align: "left" });

    if (report?.headline) {
      doc.moveDown(0.4);
      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(colorPrimary)
        .text(report.headline, { width: contentWidth });
    }

    // ── Score Summary ────────────────────────────────────────────────────────
    renderHeading("Score Summary");
    const avgDisplay =
      stats?.averageScore !== null && stats?.averageScore !== undefined
        ? `${stats.averageScore} / 5`
        : "N/A";
    const summaryLine = [
      `Average Score (Own Answers): ${avgDisplay}`,
      `Total Questions: ${stats?.totalQuestions ?? items.length}`,
      `Answered: ${stats?.answeredCount ?? 0}`,
      `AI-Assisted: ${stats?.aiAssistedCount ?? 0}`,
      `Skipped: ${stats?.skippedCount ?? 0}`,
    ].join("   |   ");

    doc.font("Helvetica").fontSize(10).fillColor(colorPrimary).text(summaryLine, { width: contentWidth });

    if (report?.summary) {
      doc.moveDown(0.4);
      doc.font("Helvetica").fontSize(10).fillColor(colorPrimary).text(report.summary, {
        width: contentWidth,
        lineGap: 2,
      });
    }

    // ── Per-Question Table ───────────────────────────────────────────────────
    if (Array.isArray(items) && items.length > 0) {
      renderHeading("Per-Question Breakdown");

      // Table column widths
      const colQ = contentWidth * 0.56;
      const colScore = contentWidth * 0.20;
      const colAi = contentWidth * 0.24;
      const startX = doc.page.margins.left;

      const drawTableHeader = () => {
        ensureSpace(26);
        const y = doc.y;
        doc.font("Helvetica-Bold").fontSize(9).fillColor(colorHeading);
        doc.text("Question", startX, y, { width: colQ - 6 });
        doc.text("Your Score", startX + colQ, y, { width: colScore });
        doc.text("AI-Assisted", startX + colQ + colScore, y, { width: colAi });
        doc.y = y + 15;
        doc
          .strokeColor(colorDivider)
          .lineWidth(0.5)
          .moveTo(startX, doc.y)
          .lineTo(startX + contentWidth, doc.y)
          .stroke();
        doc.y += 4;
      };

      drawTableHeader();

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const qText = `${i + 1}. [${item.category || "skills"}${item.relatedTo ? `: ${item.relatedTo}` : ""}] ${item.question || ""}`;
        const scoreText = item.skipped
          ? "Skipped"
          : typeof item.score === "number"
          ? `${item.score} / 5`
          : "N/A";
        const aiText = item.usedAiAnswer ? "Yes" : "No";

        const qHeight = doc.heightOfString(qText, { width: colQ - 8, fontSize: 9 });
        const rowHeight = Math.max(18, qHeight + 6);
        if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom - 28) {
          doc.addPage();
          drawTableHeader();
        }

        const y = doc.y;
        doc.font("Helvetica").fontSize(9).fillColor(colorPrimary);
        doc.text(qText, startX, y, { width: colQ - 8 });
        doc.text(scoreText, startX + colQ, y, { width: colScore });
        doc.text(aiText, startX + colQ + colScore, y, { width: colAi });
        doc.y = y + rowHeight;
      }
    }

    // ── Report Sections ──────────────────────────────────────────────────────
    if (report) {
      if (Array.isArray(report.strengths) && report.strengths.length > 0) {
        renderHeading("Strengths");
        for (const s of report.strengths) {
          ensureSpace(20);
          doc.font("Helvetica").fontSize(10).fillColor(colorPrimary).text(`-  ${s}`, {
            width: contentWidth,
            lineGap: 1.5,
          });
        }
      }

      if (Array.isArray(report.weakAreas) && report.weakAreas.length > 0) {
        renderHeading("Areas to Improve");
        for (const w of report.weakAreas) {
          ensureSpace(36);
          const title = w.relatedTo ? `${w.area} (${w.relatedTo})` : w.area;
          doc.font("Helvetica-Bold").fontSize(10).fillColor(colorPrimary).text(`•  ${title}`, {
            width: contentWidth,
          });
          if (w.whyItMatters) {
            doc.font("Helvetica").fontSize(9.5).fillColor(colorMuted).text(`   Why it matters: ${w.whyItMatters}`, {
              width: contentWidth,
            });
          }
          if (w.fix) {
            doc.font("Helvetica").fontSize(9.5).fillColor(colorPrimary).text(`   How to fix: ${w.fix}`, {
              width: contentWidth,
            });
          }
          doc.moveDown(0.2);
        }
      }

      if (Array.isArray(report.answerHabits) && report.answerHabits.length > 0) {
        renderHeading("Answer Habits");
        for (const h of report.answerHabits) {
          ensureSpace(18);
          doc.font("Helvetica").fontSize(10).fillColor(colorPrimary).text(`•  ${h}`, {
            width: contentWidth,
          });
        }
      }

      if (Array.isArray(report.projectReadiness) && report.projectReadiness.length > 0) {
        renderHeading("Project Readiness");
        for (const p of report.projectReadiness) {
          ensureSpace(24);
          const scoreLabel = p.score !== null && p.score !== undefined ? ` (${p.score}/5)` : "";
          doc.font("Helvetica-Bold").fontSize(10).fillColor(colorPrimary).text(`•  ${p.project}${scoreLabel}`, {
            width: contentWidth,
          });
          if (p.note) {
            doc.font("Helvetica").fontSize(9.5).fillColor(colorMuted).text(`   ${p.note}`, {
              width: contentWidth,
            });
          }
        }
      }

      if (Array.isArray(report.topicsToStudy) && report.topicsToStudy.length > 0) {
        renderHeading("Topics to Study");
        for (const t of report.topicsToStudy) {
          ensureSpace(28);
          doc.font("Helvetica-Bold").fontSize(10).fillColor(colorPrimary).text(`•  ${t.topic}`, {
            width: contentWidth,
          });
          if (t.reason) {
            doc.font("Helvetica").fontSize(9.5).fillColor(colorMuted).text(`   Reason: ${t.reason}`, {
              width: contentWidth,
            });
          }
          if (t.practice) {
            doc.font("Helvetica").fontSize(9.5).fillColor(colorPrimary).text(`   Practice: ${t.practice}`, {
              width: contentWidth,
            });
          }
        }
      }

      if (Array.isArray(report.nextSteps) && report.nextSteps.length > 0) {
        renderHeading("7-Day Preparation Plan");
        for (const step of report.nextSteps) {
          ensureSpace(20);
          doc.font("Helvetica").fontSize(10).fillColor(colorPrimary).text(`•  ${step}`, {
            width: contentWidth,
            lineGap: 1.5,
          });
        }
      }
    }

    // ── Footer on all pages ──────────────────────────────────────────────────
    const pageRange = doc.bufferedPageRange();
    for (let i = 0; i < pageRange.count; i++) {
      doc.switchToPage(i);
      const footerY = doc.page.height - doc.page.margins.bottom + 12;
      doc
        .font("Helvetica")
        .fontSize(8.5)
        .fillColor(colorMuted)
        .text(
          "Practice report generated by Career OS. An estimate to help you prepare.",
          doc.page.margins.left,
          footerY,
          { width: contentWidth, align: "center" }
        );
    }

    doc.end();
  });
}
