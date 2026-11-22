import PDFDocument from "pdfkit";

/**
 * Checks whether a section has actual non-empty content.
 */
export function sectionHasContent(sectionKey, draft) {
  if (!draft) return false;
  switch (sectionKey) {
    case "summary":
      return Boolean(draft.summary && draft.summary.trim().length > 0);
    case "skills":
      return Boolean(
        Array.isArray(draft.skills) &&
          draft.skills.some((s) => Array.isArray(s.items) && s.items.length > 0)
      );
    case "projects":
      return Boolean(
        Array.isArray(draft.projects) &&
          draft.projects.some((p) => p.name && p.name.trim().length > 0)
      );
    case "experience":
      return Boolean(
        Array.isArray(draft.experience) &&
          draft.experience.some((e) => (e.company && e.company.trim()) || (e.role && e.role.trim()))
      );
    case "education":
      return Boolean(
        Array.isArray(draft.education) &&
          draft.education.some((ed) => (ed.institute && ed.institute.trim()) || (ed.degree && ed.degree.trim()))
      );
    case "certifications":
      return Boolean(
        Array.isArray(draft.certifications) &&
          draft.certifications.some((c) => c.name && c.name.trim().length > 0)
      );
    default:
      return false;
  }
}

/**
 * Generates plain text representation of the resume for scoring and text extraction.
 */
export function generateResumePlainText(draft) {
  const parts = [];

  if (draft.fullName) parts.push(draft.fullName);
  if (draft.headline) parts.push(draft.headline);

  const contactPieces = [];
  if (draft.contact?.email) contactPieces.push(draft.contact.email);
  if (draft.contact?.phone) contactPieces.push(draft.contact.phone);
  if (draft.contact?.city) contactPieces.push(draft.contact.city);
  if (draft.contact?.linkedin) contactPieces.push(draft.contact.linkedin);
  if (draft.contact?.github) contactPieces.push(draft.contact.github);
  if (draft.contact?.portfolio) contactPieces.push(draft.contact.portfolio);
  if (contactPieces.length > 0) parts.push(contactPieces.join(" | "));

  const order = Array.isArray(draft.sectionOrder) && draft.sectionOrder.length > 0
    ? draft.sectionOrder
    : ["summary", "skills", "projects", "experience", "education", "certifications"];

  for (const sec of order) {
    if (!sectionHasContent(sec, draft)) continue;

    switch (sec) {
      case "summary":
        parts.push("\nSummary");
        parts.push(draft.summary.trim());
        break;

      case "skills":
        parts.push("\nSkills");
        for (const cat of draft.skills) {
          if (!cat.items || cat.items.length === 0) continue;
          const prefix = cat.category ? `${cat.category}: ` : "";
          parts.push(`${prefix}${cat.items.join(", ")}`);
        }
        break;

      case "projects":
        parts.push("\nProjects");
        for (const proj of draft.projects) {
          if (!proj.name) continue;
          let titleLine = proj.name;
          if (proj.techStack && proj.techStack.length > 0) {
            titleLine += ` | ${proj.techStack.join(", ")}`;
          }
          if (proj.link) {
            titleLine += ` (${proj.link})`;
          }
          parts.push(titleLine);
          if (Array.isArray(proj.bullets)) {
            for (const b of proj.bullets) {
              if (b && b.trim()) parts.push(`• ${b.trim()}`);
            }
          }
        }
        break;

      case "experience":
        parts.push("\nExperience");
        for (const exp of draft.experience) {
          if (!exp.role && !exp.company) continue;
          const dateRange = exp.current
            ? `${exp.startDate || ""} - Present`
            : `${exp.startDate || ""}${exp.endDate ? ` - ${exp.endDate}` : ""}`;
          parts.push(`${exp.role || "Role"} at ${exp.company || "Company"}${dateRange ? ` (${dateRange.trim()})` : ""}`);
          if (Array.isArray(exp.bullets)) {
            for (const b of exp.bullets) {
              if (b && b.trim()) parts.push(`• ${b.trim()}`);
            }
          }
        }
        break;

      case "education":
        parts.push("\nEducation");
        for (const ed of draft.education) {
          if (!ed.degree && !ed.institute) continue;
          const years = ed.startYear && ed.endYear
            ? `${ed.startYear} - ${ed.endYear}`
            : ed.endYear
            ? String(ed.endYear)
            : "";
          parts.push(`${ed.degree || "Degree"}, ${ed.institute || "Institute"}${years ? ` (${years})` : ""}${ed.grade ? ` - ${ed.grade}` : ""}`);
        }
        break;

      case "certifications":
        parts.push("\nCertifications");
        for (const cert of draft.certifications) {
          if (!cert.name) continue;
          parts.push(`${cert.name}${cert.issuer ? ` - ${cert.issuer}` : ""}${cert.year ? ` (${cert.year})` : ""}`);
        }
        break;
    }
  }

  return parts.join("\n");
}

/**
 * Renders the resume to a PDF document stream.
 */
function renderPdfStream(draft, spacingConfig) {
  const isModern = draft.template === "modern";

  const fontRegular = isModern ? "Helvetica" : "Times-Roman";
  const fontBold = isModern ? "Helvetica-Bold" : "Times-Bold";
  const fontItalic = isModern ? "Helvetica-Oblique" : "Times-Italic";

  const colorPrimary = "#111827";
  const colorHeading = isModern ? "#064E3B" : "#111111"; // Deep emerald for modern, black for classic
  const colorDivider = isModern ? "#D1D5DB" : "#374151";
  const colorMuted = "#4B5563";

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 36, bottom: 36, left: 40, right: 40 },
    info: {
      Title: draft.fullName ? `${draft.fullName} - Resume` : "Resume",
      Author: draft.fullName || "Candidate",
    },
    bufferPages: true,
  });

  const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // 1. Header (Name, Headline, Contact)
  if (draft.fullName) {
    doc
      .font(fontBold)
      .fontSize(spacingConfig.nameSize)
      .fillColor(colorHeading)
      .text(draft.fullName, { align: "center", lineGap: spacingConfig.lineGap });
  }

  if (draft.headline) {
    doc
      .font(fontRegular)
      .fontSize(spacingConfig.headlineSize)
      .fillColor(colorMuted)
      .text(draft.headline, { align: "center", lineGap: spacingConfig.lineGap });
  }

  const contactParts = [];
  if (draft.contact?.email) contactParts.push(draft.contact.email);
  if (draft.contact?.phone) contactParts.push(draft.contact.phone);
  if (draft.contact?.city) contactParts.push(draft.contact.city);
  if (draft.contact?.linkedin) contactParts.push(draft.contact.linkedin);
  if (draft.contact?.github) contactParts.push(draft.contact.github);
  if (draft.contact?.portfolio) contactParts.push(draft.contact.portfolio);

  if (contactParts.length > 0) {
    doc
      .font(fontRegular)
      .fontSize(spacingConfig.bodySize - 0.5)
      .fillColor(colorPrimary)
      .text(contactParts.join("  |  "), {
        align: "center",
        lineGap: spacingConfig.lineGap,
      });
  }

  doc.moveDown(spacingConfig.sectionGap / 10);

  // Helper to render section heading
  const renderHeading = (title) => {
    doc.moveDown(spacingConfig.sectionGap / 12);
    doc
      .font(fontBold)
      .fontSize(spacingConfig.headingSize)
      .fillColor(colorHeading)
      .text(title, { align: "left", lineGap: 1 });

    const currentY = doc.y;
    doc
      .strokeColor(colorDivider)
      .lineWidth(0.75)
      .moveTo(doc.page.margins.left, currentY)
      .lineTo(doc.page.width - doc.page.margins.right, currentY)
      .stroke();

    doc.moveDown(spacingConfig.sectionGap / 15);
  };

  const order = Array.isArray(draft.sectionOrder) && draft.sectionOrder.length > 0
    ? draft.sectionOrder
    : ["summary", "skills", "projects", "experience", "education", "certifications"];

  for (const sec of order) {
    if (!sectionHasContent(sec, draft)) continue;

    switch (sec) {
      case "summary": {
        renderHeading("Summary");
        doc
          .font(fontRegular)
          .fontSize(spacingConfig.bodySize)
          .fillColor(colorPrimary)
          .text(draft.summary.trim(), {
            width: contentWidth,
            align: "justify",
            lineGap: spacingConfig.lineGap,
          });
        break;
      }

      case "skills": {
        renderHeading("Skills");
        for (const cat of draft.skills) {
          if (!cat.items || cat.items.length === 0) continue;
          const prefix = cat.category ? `${cat.category}: ` : "";
          doc
            .font(fontBold)
            .fontSize(spacingConfig.bodySize)
            .fillColor(colorPrimary)
            .text(prefix, { continued: true });
          doc
            .font(fontRegular)
            .text(cat.items.join(", "), { lineGap: spacingConfig.lineGap });
        }
        break;
      }

      case "projects": {
        renderHeading("Projects");
        for (const proj of draft.projects) {
          if (!proj.name) continue;
          doc.moveDown(spacingConfig.itemGap / 14);

          // Title row
          doc
            .font(fontBold)
            .fontSize(spacingConfig.bodySize)
            .fillColor(colorPrimary)
            .text(proj.name, { continued: Boolean(proj.techStack?.length || proj.link) });

          if (proj.techStack && proj.techStack.length > 0) {
            doc
              .font(fontItalic)
              .fillColor(colorMuted)
              .text(`  |  ${proj.techStack.join(", ")}`, { continued: Boolean(proj.link) });
          }

          if (proj.link) {
            doc
              .font(fontRegular)
              .fillColor(colorPrimary)
              .text(`  (${proj.link})`);
          } else {
            doc.text("");
          }

          if (Array.isArray(proj.bullets)) {
            for (const b of proj.bullets) {
              if (!b || !b.trim()) continue;
              doc
                .font(fontRegular)
                .fontSize(spacingConfig.bulletSize)
                .fillColor(colorPrimary)
                .text(`•  ${b.trim()}`, {
                  indent: 8,
                  width: contentWidth - 8,
                  lineGap: spacingConfig.lineGap,
                });
            }
          }
        }
        break;
      }

      case "experience": {
        renderHeading("Experience");
        for (const exp of draft.experience) {
          if (!exp.role && !exp.company) continue;
          doc.moveDown(spacingConfig.itemGap / 14);

          const dateRange = exp.current
            ? `${exp.startDate || ""} - Present`
            : `${exp.startDate || ""}${exp.endDate ? ` - ${exp.endDate}` : ""}`;

          doc
            .font(fontBold)
            .fontSize(spacingConfig.bodySize)
            .fillColor(colorPrimary)
            .text(exp.role || "Role", { continued: true });

          doc
            .font(fontRegular)
            .text(exp.company ? ` at ${exp.company}` : "", { continued: Boolean(dateRange.trim()) });

          if (dateRange.trim()) {
            doc
              .font(fontItalic)
              .fillColor(colorMuted)
              .text(`  (${dateRange.trim()})`);
          } else {
            doc.text("");
          }

          if (Array.isArray(exp.bullets)) {
            for (const b of exp.bullets) {
              if (!b || !b.trim()) continue;
              doc
                .font(fontRegular)
                .fontSize(spacingConfig.bulletSize)
                .fillColor(colorPrimary)
                .text(`•  ${b.trim()}`, {
                  indent: 8,
                  width: contentWidth - 8,
                  lineGap: spacingConfig.lineGap,
                });
            }
          }
        }
        break;
      }

      case "education": {
        renderHeading("Education");
        for (const ed of draft.education) {
          if (!ed.degree && !ed.institute) continue;
          doc.moveDown(spacingConfig.itemGap / 16);

          const years = ed.startYear && ed.endYear
            ? `${ed.startYear} - ${ed.endYear}`
            : ed.endYear
            ? String(ed.endYear)
            : "";

          doc
            .font(fontBold)
            .fontSize(spacingConfig.bodySize)
            .fillColor(colorPrimary)
            .text(ed.degree || "Degree", { continued: Boolean(ed.institute) });

          if (ed.institute) {
            doc
              .font(fontRegular)
              .text(`, ${ed.institute}`, { continued: Boolean(years || ed.grade) });
          }

          const extraParts = [];
          if (years) extraParts.push(years);
          if (ed.grade) extraParts.push(`Grade: ${ed.grade}`);

          if (extraParts.length > 0) {
            doc
              .font(fontItalic)
              .fillColor(colorMuted)
              .text(`  (${extraParts.join("  |  ")})`);
          } else {
            doc.text("");
          }
        }
        break;
      }

      case "certifications": {
        renderHeading("Certifications");
        for (const cert of draft.certifications) {
          if (!cert.name) continue;
          doc.moveDown(spacingConfig.itemGap / 16);

          doc
            .font(fontBold)
            .fontSize(spacingConfig.bodySize)
            .fillColor(colorPrimary)
            .text(cert.name, { continued: Boolean(cert.issuer || cert.year) });

          if (cert.issuer) {
            doc.font(fontRegular).text(` - ${cert.issuer}`, { continued: Boolean(cert.year) });
          }
          if (cert.year) {
            doc.font(fontItalic).fillColor(colorMuted).text(` (${cert.year})`);
          } else {
            doc.text("");
          }
        }
        break;
      }
    }
  }

  return doc;
}

/**
 * Builds the PDF buffer, attempting 1-page fit by stepping spacing down if content overflows.
 *
 * @param {Object} draft
 * @returns {Promise<{ buffer: Buffer, pageCount: number, text: string }>}
 */
export async function buildResumePdf(draft) {
  const SPACING_NORMAL = {
    nameSize: 18,
    headlineSize: 11,
    headingSize: 12,
    bodySize: 10,
    bulletSize: 9.8,
    sectionGap: 8,
    itemGap: 5,
    lineGap: 2,
  };

  const SPACING_COMPACT = {
    nameSize: 16,
    headlineSize: 10.5,
    headingSize: 11,
    bodySize: 9.5,   // Never below readable 9.5 pt
    bulletSize: 9.5,
    sectionGap: 5,
    itemGap: 3.5,
    lineGap: 1,
  };

  const generateBuffer = (config) => {
    return new Promise((resolve, reject) => {
      const doc = renderPdfStream(draft, config);
      const chunks = [];

      // Read buffered page count before flushing pages via doc.end()
      let pageCount = 1;
      try {
        const range = doc.bufferedPageRange();
        if (range && typeof range.count === "number" && range.count > 0) {
          pageCount = range.count;
        }
      } catch {
        pageCount = 1;
      }

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {
        const buffer = Buffer.concat(chunks);
        resolve({ buffer, pageCount });
      });
      doc.on("error", (err) => reject(err));

      doc.end();
    });
  };

  // Attempt 1: Normal spacing
  let result = await generateBuffer(SPACING_NORMAL);

  // If normal spacing overflows to 2+ pages, try compact spacing
  if (result.pageCount > 1) {
    const compactResult = await generateBuffer(SPACING_COMPACT);
    // If compact succeeds in fitting onto 1 page, use compact result!
    if (compactResult.pageCount < result.pageCount) {
      result = compactResult;
    }
  }

  const text = generateResumePlainText(draft);

  return {
    buffer: result.buffer,
    pageCount: result.pageCount,
    text,
  };
}
