/**
 * PDF generation for Ficha Técnica de Medición
 * Yes/No values use colored cells (no Unicode) for universal PDF compatibility
 */
const PDFGen = (() => {

  const COLORS = {
    titleBg:    [255, 192, 0],
    titleText:  [255, 255, 255],
    secBg:      [46, 117, 182],
    sec5Bg:     [0, 176, 240],
    secText:    [255, 255, 255],
    gridBorder: [180, 198, 220],
    labelBg:    [221, 235, 247],
    labelText:  [31, 73, 125],
    valueText:  [0, 0, 0],
    yesGreenBg: [198, 239, 206],
    yesGreenTx: [0, 97, 0],
    noRedBg:    [255, 199, 206],
    noRedTx:    [156, 0, 6],
    noneBg:     [242, 242, 242],
    noneTx:     [140, 140, 140],
    footerText: [120, 120, 120],
  };

  // Returns a styled autoTable cell reflecting a yes/no/unset value
  function ynCell(val, extraStyles = {}) {
    if (val === true)  return { content: 'SI',  styles: { fillColor: COLORS.yesGreenBg, textColor: COLORS.yesGreenTx, fontStyle: 'bold', halign: 'center', ...extraStyles } };
    if (val === false) return { content: 'NO',  styles: { fillColor: COLORS.noRedBg,    textColor: COLORS.noRedTx,    fontStyle: 'bold', halign: 'center', ...extraStyles } };
    return               { content: '—',   styles: { fillColor: COLORS.noneBg,      textColor: COLORS.noneTx,     halign: 'center', ...extraStyles } };
  }

  function labelCell(text, colSpan) {
    const cell = { content: text, styles: { fillColor: COLORS.labelBg, textColor: COLORS.labelText, fontStyle: 'bold' } };
    if (colSpan) cell.colSpan = colSpan;
    return cell;
  }

  function valueCell(text, colSpan) {
    const cell = { content: text ?? '—' };
    if (colSpan) cell.colSpan = colSpan;
    return cell;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return `${d} ${months[parseInt(m)-1]} ${y}`;
  }

  function formatTime(t) { return t || '—'; }

  // Normalize aguaTipo: supports old array format and new object format
  function getAguaTipo(ficha, key) {
    const at = ficha.aguaTipo;
    if (!at) return null;
    if (Array.isArray(at)) return at.includes(key) ? true : null;
    const v = at[key];
    return v === true ? true : v === false ? false : null;
  }

  function aguaTipoSummary(ficha) {
    const corriendo = getAguaTipo(ficha, 'corriendo');
    const estancada = getAguaTipo(ficha, 'estancada');
    const parts = [];
    if (corriendo === true)  parts.push('Corriendo');
    if (estancada === true)  parts.push('Estancada');
    if (parts.length) return parts.join(' + ');
    if (corriendo === false && estancada === false) return 'Ninguno';
    return '—';
  }

  const TABLE_STYLES = {
    fontSize: 9.5,
    cellPadding: 3,
    lineColor: COLORS.gridBorder,
    lineWidth: 0.3,
    textColor: COLORS.valueText,
    valign: 'middle',
  };

  const COL_STYLES = {
    0: { cellWidth: 40 },
    1: { cellWidth: 'auto' },
    2: { cellWidth: 40 },
    3: { cellWidth: 'auto' },
  };

  async function generate(ficha, fotos = []) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageW = 210;
    const pageH = 297;
    const margin = 14;
    const contentW = pageW - margin * 2;
    let y = margin;

    function sectionHeader(title, bgColor = COLORS.secBg) {
      doc.setFillColor(...bgColor);
      doc.rect(margin, y, contentW, 9, 'F');
      doc.setTextColor(...COLORS.secText);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(title.toUpperCase(), margin + 4, y + 6.2);
      y += 9;
    }

    function autoTable(body, colStyles = COL_STYLES) {
      doc.autoTable({
        startY: y,
        margin: { left: margin, right: margin },
        body,
        theme: 'grid',
        styles: TABLE_STYLES,
        columnStyles: colStyles,
      });
      y = doc.lastAutoTable.finalY + 6;
    }

    function checkPageBreak(needed = 24) {
      if (y + needed > pageH - margin) { doc.addPage(); y = margin; }
    }

    // ---- TITLE ----
    doc.setFillColor(...COLORS.titleBg);
    doc.rect(margin, y, contentW, 14, 'F');
    doc.setTextColor(...COLORS.titleText);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('FICHA DE VARIABLES Y EQUIPOS DE MEDICION', pageW / 2, y + 9.5, { align: 'center' });
    y += 14 + 4;

    // ---- SECTION 1 ----
    checkPageBreak(70);
    sectionHeader('1. Detalles de cueva');

    const aguaVal = ficha.agua === 'si' ? true : ficha.agua === 'no' ? false : null;

    autoTable([
      [ labelCell('Cueva'), valueCell(ficha.cueva),  labelCell('Punto'), valueCell(ficha.punto) ],
      [ labelCell('Fecha'), { content: formatDate(ficha.fecha), colSpan: 3 } ],
      [ labelCell('Hora inicio'), valueCell(formatTime(ficha.horaInicio)), labelCell('Hora fin'), valueCell(formatTime(ficha.horaFin)) ],
      [ labelCell('Agua'),        ynCell(aguaVal),
        labelCell('Tipo'),        valueCell(ficha.agua === 'si' ? aguaTipoSummary(ficha) : '—') ],
      [ labelCell('Seccion transversal'), { content: ficha.seccionTransversal || '—', colSpan: 3 } ],
    ]);

    // ---- SECTION 2 ----
    checkPageBreak(50);
    sectionHeader('2. Medicion de parametros ambientales');

    const p = ficha.parametros || {};
    autoTable([
      [ labelCell('Humedad'),        ynCell(p.humedad),    labelCell('Temperatura'),     ynCell(p.temperatura) ],
      [ labelCell('Presion'),        ynCell(p.presion),    labelCell('Vel. del viento'), ynCell(p.velViento)   ],
      [ labelCell('CO2'),            ynCell(p.co2),        { content: '' },              { content: '' }       ],
    ]);

    // ---- SECTION 3 ----
    checkPageBreak(50);
    sectionHeader('3. Equipos de radiacion ionizante');

    const eq = ficha.equiposRadiacion || {};
    autoTable([
      [ labelCell('AlphaE'),      ynCell(eq.alphaE),    labelCell('GammaScout'),  ynCell(eq.gammaScout) ],
      [ labelCell('GMQ-GMC+600'), ynCell(eq.gmqGmc600), labelCell('Dosimetros'),  ynCell(eq.dosimetros) ],
      [ labelCell('Sonda Beta'),  ynCell(eq.sondaBeta), { content: '' },          { content: '' }       ],
    ]);

    // ---- SECTION 4 ----
    checkPageBreak(28);
    sectionHeader('4. Equipos adicionales');

    const ad = ficha.equiposAdicionales || {};
    autoTable([
      [ labelCell('Medidor de radiacion cosmica', 1), ynCell(ad.medidorRadiacionCosmica, { cellWidth: 30 }) ],
    ], { 0: { cellWidth: 'auto' }, 1: { cellWidth: 30 } });

    // ---- SECTION 5 ----
    checkPageBreak(36);
    sectionHeader('5. Observaciones y/o notas', COLORS.sec5Bg);

    const obsText = ficha.observaciones || '(Sin observaciones)';
    const obsLines = doc.splitTextToSize(obsText, contentW - 8);
    const obsH = Math.max(20, obsLines.length * 5 + 8);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...COLORS.gridBorder);
    doc.setLineWidth(0.3);
    doc.rect(margin, y, contentW, obsH, 'FD');
    doc.setTextColor(...COLORS.valueText);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.text(obsLines, margin + 4, y + 5);
    y += obsH + 6;

    // ---- FOTOS — una por página, respetando relación de aspecto ----
    for (let i = 0; i < fotos.length; i++) {
      doc.addPage();

      // Header de sección en cada página de foto
      let fy = margin;
      doc.setFillColor(80, 80, 80);
      doc.rect(margin, fy, contentW, 9, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`FOTOGRAFIA ${i + 1} DE ${fotos.length}`, margin + 4, fy + 6.2);
      fy += 9 + 4;

      // Espacio disponible para la imagen (deja 10mm abajo para el caption)
      const availW = contentW;
      const availH = pageH - fy - margin - 10;

      try {
        const dataUrl = await blobToDataUrl(fotos[i].blob);
        const dims    = await getImageDimensions(dataUrl);

        // Escala uniforme para que quepa sin recortar
        const scale  = Math.min(availW / dims.w, availH / dims.h);
        const pdfW   = dims.w * scale;
        const pdfH   = dims.h * scale;

        // Centrar horizontal y verticalmente en el espacio disponible
        const ix = margin + (availW - pdfW) / 2;
        const iy = fy     + (availH - pdfH) / 2;

        const ext = fotos[i].blob.type.includes('png') ? 'PNG' : 'JPEG';
        doc.addImage(dataUrl, ext, ix, iy, pdfW, pdfH, undefined, 'MEDIUM');
      } catch {
        doc.setFillColor(220, 220, 220);
        doc.rect(margin, fy, contentW, availH, 'F');
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(10);
        doc.text('[Imagen no disponible]', pageW / 2, fy + availH / 2, { align: 'center' });
      }

      // Caption centrado al pie
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.footerText);
      const caption = fotos[i].name ? `${fotos[i].name}` : `Foto ${i + 1}`;
      doc.text(caption, pageW / 2, pageH - margin + 2, { align: 'center' });
    }

    // ---- FOOTER ----
    const total = doc.getNumberOfPages();
    for (let p = 1; p <= total; p++) {
      doc.setPage(p);
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.footerText);
      doc.text(
        `Generado: ${new Date().toLocaleString('es')}   |   ID: ${(ficha.id || '').substring(0, 8)}`,
        margin, pageH - 8
      );
      doc.text(`Pag. ${p} / ${total}`, pageW - margin, pageH - 8, { align: 'right' });
    }

    const safeName = (ficha.cueva || 'Ficha').replace(/[^a-zA-Z0-9_\- ]/g, '_');
    doc.save(`Ficha_${safeName}_${ficha.fecha || new Date().toISOString().substring(0, 10)}.pdf`);
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function getImageDimensions(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload  = () => resolve({ w: img.naturalWidth,  h: img.naturalHeight });
      img.onerror = () => resolve({ w: 1, h: 1 });
      img.src = dataUrl;
    });
  }

  return { generate };
})();
