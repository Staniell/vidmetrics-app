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

/** Convert all <img> elements in the container to inline data URLs so
 *  html2canvas doesn't hit cross-origin tainting issues (e.g. YouTube avatars). */
async function inlineImages(container: HTMLElement): Promise<void> {
  const images = container.querySelectorAll("img")
  await Promise.all(
    Array.from(images).map(async (img) => {
      if (!img.src || img.src.startsWith("data:")) return
      try {
        const res = await fetch(img.src)
        const blob = await res.blob()
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(blob)
        })
        img.src = dataUrl
      } catch {
        // Leave original src if fetch fails
      }
    })
  )
}

export async function captureAndDownloadPdf(
  containerEl: HTMLElement,
  filename: string
): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ])

  // Pre-convert cross-origin images to data URLs
  await inlineImages(containerEl)

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

    // Collect link positions before placing the image
    const links = Array.from(section.querySelectorAll("a[href]")).map((a) => {
      const aEl = a as HTMLAnchorElement
      const sectionRect = section.getBoundingClientRect()
      const linkRect = aEl.getBoundingClientRect()
      return {
        href: aEl.href,
        // Relative position within the section (0-1)
        rx: (linkRect.left - sectionRect.left) / sectionRect.width,
        ry: (linkRect.top - sectionRect.top) / sectionRect.height,
        rw: linkRect.width / sectionRect.width,
        rh: linkRect.height / sectionRect.height,
      }
    })

    // If a single section is taller than one page, scale it down or split
    let imgX = margin
    let imgY = currentY
    let finalWidth = usableWidth
    let finalHeight = imgHeight

    if (imgHeight > pageHeight - 2 * margin) {
      // Scale to fit one page
      finalHeight = pageHeight - 2 * margin
      finalWidth = (canvas.width / canvas.height) * finalHeight
      imgX = margin + (usableWidth - finalWidth) / 2
      imgY = margin
      pdf.addImage(imgData, "PNG", imgX, imgY, finalWidth, finalHeight)
      // Overlay clickable link annotations
      for (const link of links) {
        pdf.link(
          imgX + link.rx * finalWidth,
          imgY + link.ry * finalHeight,
          link.rw * finalWidth,
          link.rh * finalHeight,
          { url: link.href }
        )
      }
      pdf.addPage()
      currentY = margin
    } else {
      pdf.addImage(imgData, "PNG", margin, currentY, usableWidth, imgHeight)
      // Overlay clickable link annotations
      for (const link of links) {
        pdf.link(
          imgX + link.rx * finalWidth,
          imgY + link.ry * finalHeight,
          link.rw * finalWidth,
          link.rh * finalHeight,
          { url: link.href }
        )
      }
      currentY += imgHeight + 4
    }
  }

  pdf.save(filename)
}
