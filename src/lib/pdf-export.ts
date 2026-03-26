import { format } from "date-fns"
import { PDF_THEME_VARS } from "@/lib/pdf-theme"

export function buildExportFilename(
  primaryHandle: string,
  comparisonHandle?: string
): string {
  const clean = (h: string) => h.replace(/^@/, "").replace(/[^a-zA-Z0-9_-]/g, "_")
  const date = format(new Date(), "yyyy-MM-dd")
  if (comparisonHandle) {
    return `VidMetrics_${clean(primaryHandle)}_vs_${clean(comparisonHandle)}_${date}.pdf`
  }
  return `VidMetrics_${clean(primaryHandle)}_${date}.pdf`
}

export async function captureAndDownloadPdf(
  containerEl: HTMLElement,
  filename: string
): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ])

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageWidth = 210
  const pageHeight = 297
  const margin = 10
  const usableWidth = pageWidth - 2 * margin
  let currentY = margin

  const sections = containerEl.querySelectorAll("[data-section]")

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i] as HTMLElement

    const canvas = await html2canvas(section, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      onclone: (clonedDoc: Document) => {
        // Override oklch/lab CSS variables with hex equivalents on the
        // cloned document root so html2canvas never encounters unsupported
        // color functions when resolving computed styles.
        const root = clonedDoc.documentElement
        for (const [key, value] of Object.entries(PDF_THEME_VARS)) {
          root.style.setProperty(key, value)
        }
        // Also set the --color-* Tailwind theme aliases directly
        for (const [key, value] of Object.entries(PDF_THEME_VARS)) {
          root.style.setProperty(`--color-${key.slice(2)}`, value)
        }
      },
    })

    const imgData = canvas.toDataURL("image/png")
    const imgHeight = (canvas.height / canvas.width) * usableWidth

    // Page break if this section won't fit
    if (currentY + imgHeight > pageHeight - margin && currentY > margin) {
      pdf.addPage()
      currentY = margin
    }

    // If a single section is taller than one page, scale it down or split
    if (imgHeight > pageHeight - 2 * margin) {
      // Scale to fit one page
      const scaledHeight = pageHeight - 2 * margin
      const scaledWidth = (canvas.width / canvas.height) * scaledHeight
      const xOffset = margin + (usableWidth - scaledWidth) / 2
      pdf.addImage(imgData, "PNG", xOffset, margin, scaledWidth, scaledHeight)
      pdf.addPage()
      currentY = margin
    } else {
      pdf.addImage(imgData, "PNG", margin, currentY, usableWidth, imgHeight)
      currentY += imgHeight + 4
    }
  }

  pdf.save(filename)
}
