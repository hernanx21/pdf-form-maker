/**
 * PDF generation for Ficha Técnica de Medición
 * Replicates the Excel format with color-coded sections
 */
const PDFGen = (() => {

  // Color palette (RGB arrays)
  const COLORS = {
    titleBg:    [255, 192, 0],    // #FFC000 amber
    titleText:  [255, 255, 255],
    sec1Bg:     [46, 117, 182],   // #2E75B6 blue
    sec2Bg:     [46, 117, 182],
    sec3Bg:     [46, 117, 182],
    sec4Bg:     [46, 117, 182],
    sec5Bg:     [0, 176, 240],    // #00B0F0 light blue
    secText:    [255, 255, 255],
    rowAlt:     [240, 246, 255],
    rowNormal:  [255, 255, 255],
    gridBorder: [180, 198, 220],
    labelBg:    [221, 235, 247],
    labelText:  [31, 73, 125],
    valueBg:    [255, 255, 255],
    valueText:  [0, 0, 0],
    footerText: [120, 120, 120],
  };

  const CHECKMARK = '☑'; // ☑
  const EMPTY_BOX = '☐'; // ☐

  function check(val) {
    return val ? CHECKMARK : EMPTY_BOX;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return `${d} ${months[parseInt(m)-1]} ${y}`;
  }

  function formatTime(timeStr) {
    return timeStr || '—';
  }

  function yesNo(val) {
    return val === 'si' ? 'Sí' : (val === 'no' ? 'No' : '—');
  }

  async function generate(ficha, fotos = []) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageW = 210;
    const pageH = 297;
    const margin = 14;
    const contentW = pageW - margin * 2;
    let y = margin;

    // Helper: draw filled rect with text
    function sectionHeader(title, bgColor, textColor = COLORS.secText) {
      doc.setFillColor(...bgColor);
      doc.rect(margin, y, contentW, 9, 'F');
      doc.setTextColor(...textColor);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(title.toUpperCase(), margin + 4, y + 6.2);
      y += 9;
    }

    function checkPageBreak(needed = 20) {
      if (y + needed > pageH - margin) {
        doc.addPage();
        y = margin;
      }
    }

    // ---- TITLE ----
    doc.setFillColor(...COLORS.titleBg);
    doc.rect(margin, y, contentW, 14, 'F');
    doc.setTextColor(...COLORS.titleText);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('FICHA DE VARIABLES Y EQUIPOS DE MEDICIÓN', pageW / 2, y + 9.5, { align: 'center' });
    y += 14 + 4;

    // ---- SECTION 1: Detalles de cueva ----
    checkPageBreak(70);
    sectionHeader('1. Detalles de cueva', COLORS.sec1Bg);

    const sec1Data = [
      [
        { content: 'Cueva', styles: { fillColor: COLORS.labelBg, textColor: COLORS.labelText, fontStyle: 'bold' } },
        { content: ficha.cueva || '—', colSpan: 1 },
        { content: 'Punto', styles: { fillColor: COLORS.labelBg, textColor: COLORS.labelText, fontStyle: 'bold' } },
        { content: ficha.punto || '—' },
      ],
      [
        { content: 'Fecha', styles: { fillColor: COLORS.labelBg, textColor: COLORS.labelText, fontStyle: 'bold' } },
        { content: formatDate(ficha.fecha), colSpan: 3 },
      ],
      [
        { content: 'Hora inicio', styles: { fillColor: COLORS.labelBg, textColor: COLORS.labelText, fontStyle: 'bold' } },
        { content: formatTime(ficha.horaInicio) },
        { content: 'Hora fin', styles: { fillColor: COLORS.labelBg, textColor: COLORS.labelText, fontStyle: 'bold' } },
        { content: formatTime(ficha.horaFin) },
      ],
      [
        { content: 'Agua', styles: { fillColor: COLORS.labelBg, textColor: COLORS.labelText, fontStyle: 'bold' } },
        {
          content: `Sí ${check(ficha.agua === 'si')}   No ${check(ficha.agua === 'no')}`,
          colSpan: 1,
        },
        { content: 'Tipo', styles: { fillColor: COLORS.labelBg, textColor: COLORS.labelText, fontStyle: 'bold' } },
        {
          content: ficha.agua === 'si'
            ? `Corriendo ${check(ficha.aguaTipo?.includes('corriendo'))}   Estancada ${check(ficha.aguaTipo?.includes('estancada'))}`
            : '—',
        },
      ],
      [
        { content: 'Sección transversal', styles: { fillColor: COLORS.labelBg, textColor: COLORS.labelText, fontStyle: 'bold' } },
        { content: ficha.seccionTransversal || '—', colSpan: 3 },
      ],
    ];

    doc.autoTable({
      startY: y,
      margin: { left: margin, right: margin },
      body: sec1Data,
      theme: 'grid',
      styles: {
        fontSize: 9.5,
        cellPadding: 3,
        lineColor: COLORS.gridBorder,
        lineWidth: 0.3,
        textColor: COLORS.valueText,
        valign: 'middle',
      },
      columnStyles: {
        0: { cellWidth: 36 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 36 },
        3: { cellWidth: 'auto' },
      },
    });
    y = doc.lastAutoTable.finalY + 6;

    // ---- SECTION 2: Parámetros ambientales ----
    checkPageBreak(50);
    sectionHeader('2. Medición de parámetros ambientales', COLORS.sec2Bg);

    const params = ficha.parametros || {};
    const sec2Data = [
      [
        { content: 'Humedad', styles: { fillColor: COLORS.labelBg, textColor: COLORS.labelText, fontStyle: 'bold' } },
        { content: `Sí ${check(params.humedad)}   No ${check(!params.humedad)}` },
        { content: 'Temperatura', styles: { fillColor: COLORS.labelBg, textColor: COLORS.labelText, fontStyle: 'bold' } },
        { content: `Sí ${check(params.temperatura)}   No ${check(!params.temperatura)}` },
      ],
      [
        { content: 'Presión', styles: { fillColor: COLORS.labelBg, textColor: COLORS.labelText, fontStyle: 'bold' } },
        { content: `Sí ${check(params.presion)}   No ${check(!params.presion)}` },
        { content: 'Vel. del viento', styles: { fillColor: COLORS.labelBg, textColor: COLORS.labelText, fontStyle: 'bold' } },
        { content: `Sí ${check(params.velViento)}   No ${check(!params.velViento)}` },
      ],
      [
        { content: 'CO2', styles: { fillColor: COLORS.labelBg, textColor: COLORS.labelText, fontStyle: 'bold' } },
        { content: `Sí ${check(params.co2)}   No ${check(!params.co2)}` },
        { content: '', styles: { fillColor: COLORS.rowNormal } },
        { content: '', styles: { fillColor: COLORS.rowNormal } },
      ],
    ];

    doc.autoTable({
      startY: y,
      margin: { left: margin, right: margin },
      body: sec2Data,
      theme: 'grid',
      styles: {
        fontSize: 9.5,
        cellPadding: 3,
        lineColor: COLORS.gridBorder,
        lineWidth: 0.3,
        textColor: COLORS.valueText,
        valign: 'middle',
      },
      columnStyles: {
        0: { cellWidth: 36 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 36 },
        3: { cellWidth: 'auto' },
      },
    });
    y = doc.lastAutoTable.finalY + 6;

    // ---- SECTION 3: Equipos de radiación ionizante ----
    checkPageBreak(50);
    sectionHeader('3. Equipos de radiación ionizante', COLORS.sec3Bg);

    const equipos = ficha.equiposRadiacion || {};
    const sec3Data = [
      [
        { content: 'AlphaE', styles: { fillColor: COLORS.labelBg, textColor: COLORS.labelText, fontStyle: 'bold' } },
        { content: `Sí ${check(equipos.alphaE)}   No ${check(!equipos.alphaE)}` },
        { content: 'GammaScout', styles: { fillColor: COLORS.labelBg, textColor: COLORS.labelText, fontStyle: 'bold' } },
        { content: `Sí ${check(equipos.gammaScout)}   No ${check(!equipos.gammaScout)}` },
      ],
      [
        { content: 'GMQ-GMC+600', styles: { fillColor: COLORS.labelBg, textColor: COLORS.labelText, fontStyle: 'bold' } },
        { content: `Sí ${check(equipos.gmqGmc600)}   No ${check(!equipos.gmqGmc600)}` },
        { content: 'Dosímetros', styles: { fillColor: COLORS.labelBg, textColor: COLORS.labelText, fontStyle: 'bold' } },
        { content: `Sí ${check(equipos.dosimetros)}   No ${check(!equipos.dosimetros)}` },
      ],
      [
        { content: 'Sonda Beta', styles: { fillColor: COLORS.labelBg, textColor: COLORS.labelText, fontStyle: 'bold' } },
        { content: `Sí ${check(equipos.sondaBeta)}   No ${check(!equipos.sondaBeta)}` },
        { content: '', styles: { fillColor: COLORS.rowNormal } },
        { content: '', styles: { fillColor: COLORS.rowNormal } },
      ],
    ];

    doc.autoTable({
      startY: y,
      margin: { left: margin, right: margin },
      body: sec3Data,
      theme: 'grid',
      styles: {
        fontSize: 9.5,
        cellPadding: 3,
        lineColor: COLORS.gridBorder,
        lineWidth: 0.3,
        textColor: COLORS.valueText,
        valign: 'middle',
      },
      columnStyles: {
        0: { cellWidth: 36 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 36 },
        3: { cellWidth: 'auto' },
      },
    });
    y = doc.lastAutoTable.finalY + 6;

    // ---- SECTION 4: Equipos adicionales ----
    checkPageBreak(30);
    sectionHeader('4. Equipos adicionales', COLORS.sec4Bg);

    const adicionales = ficha.equiposAdicionales || {};
    doc.autoTable({
      startY: y,
      margin: { left: margin, right: margin },
      body: [
        [
          { content: 'Medidor de radiación cósmica', styles: { fillColor: COLORS.labelBg, textColor: COLORS.labelText, fontStyle: 'bold' } },
          { content: `Sí ${check(adicionales.medidorRadiacionCosmica)}   No ${check(!adicionales.medidorRadiacionCosmica)}`, colSpan: 3 },
        ],
      ],
      theme: 'grid',
      styles: {
        fontSize: 9.5,
        cellPadding: 3,
        lineColor: COLORS.gridBorder,
        lineWidth: 0.3,
        textColor: COLORS.valueText,
        valign: 'middle',
      },
      columnStyles: {
        0: { cellWidth: 64 },
        1: { cellWidth: 'auto' },
      },
    });
    y = doc.lastAutoTable.finalY + 6;

    // ---- SECTION 5: Observaciones ----
    checkPageBreak(40);
    sectionHeader('5. Observaciones y/o notas', COLORS.sec5Bg);

    const obsText = ficha.observaciones || '';
    const obsLines = doc.splitTextToSize(obsText || '(Sin observaciones)', contentW - 8);
    const obsHeight = Math.max(20, obsLines.length * 5 + 8);

    doc.setFillColor(...COLORS.rowNormal);
    doc.setDrawColor(...COLORS.gridBorder);
    doc.setLineWidth(0.3);
    doc.rect(margin, y, contentW, obsHeight, 'FD');
    doc.setTextColor(...COLORS.valueText);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.text(obsLines, margin + 4, y + 5);
    y += obsHeight + 6;

    // ---- FOTOS ----
    if (fotos && fotos.length > 0) {
      checkPageBreak(20);
      sectionHeader('Fotografías adjuntas', [80, 80, 80]);
      y += 4;

      const photosPerRow = 2;
      const photoW = (contentW - (photosPerRow - 1) * 6) / photosPerRow;
      const photoH = photoW * 0.75;

      for (let i = 0; i < fotos.length; i++) {
        const col = i % photosPerRow;
        const row = Math.floor(i / photosPerRow);

        if (col === 0 && row > 0) y += photoH + 8;
        checkPageBreak(photoH + 10);

        const x = margin + col * (photoW + 6);

        try {
          const dataUrl = await blobToDataUrl(fotos[i].blob);
          const ext = fotos[i].blob.type.includes('png') ? 'PNG' : 'JPEG';
          doc.addImage(dataUrl, ext, x, y, photoW, photoH, undefined, 'MEDIUM');
        } catch {
          doc.setFillColor(220, 220, 220);
          doc.rect(x, y, photoW, photoH, 'F');
          doc.setTextColor(100, 100, 100);
          doc.setFontSize(8);
          doc.text('[Imagen no disponible]', x + photoW / 2, y + photoH / 2, { align: 'center' });
        }

        // Caption
        doc.setFontSize(7);
        doc.setTextColor(...COLORS.footerText);
        doc.text(`Foto ${i + 1}: ${fotos[i].name || ''}`, x, y + photoH + 4);
      }
      y += photoH + 12;
    }

    // ---- FOOTER ----
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.footerText);
      doc.text(
        `Generado: ${new Date().toLocaleString('es')}   |   Ficha ID: ${ficha.id?.substring(0, 8) || '—'}`,
        margin, pageH - 8
      );
      doc.text(`Pág. ${p} / ${totalPages}`, pageW - margin, pageH - 8, { align: 'right' });
    }

    // Save
    const safeName = (ficha.cueva || 'Ficha').replace(/[^a-zA-Z0-9_\-áéíóúÁÉÍÓÚüÜñÑ ]/g, '_');
    const dateStr = ficha.fecha || new Date().toISOString().substring(0, 10);
    doc.save(`Ficha_${safeName}_${dateStr}.pdf`);
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  return { generate };
})();
