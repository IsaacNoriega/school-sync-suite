import * as XLSX from 'xlsx';

export interface ExportAttendanceOptions {
  month: string; // YYYY-MM
  year: number;
  monthName: string;
  daysInMonth: number;
  students: Array<{ _id: string; name: string; enrollmentNumber: string }>;
  records: Record<string, Record<string, { status: string }>>;
  summaries: Record<string, { presents: number; lates: number; absents: number; attendanceRate: number }>;
  teacherName?: string;
  groupName?: string;
}

export const exportMonthlyAttendanceToExcel = ({
  month,
  year,
  monthName,
  daysInMonth,
  students,
  records,
  summaries,
  teacherName = 'Docente Titular',
  groupName = 'Primaria',
}: ExportAttendanceOptions) => {
  const rows: any[][] = [];

  // Encabezado institucional
  rows.push(['SISTEMA DE CONTROL ESCOLAR - EDUCAQR']);
  rows.push(['SÁBANA OFICIAL DE ASISTENCIA MENSUAL']);
  rows.push([
    `Periodo: ${monthName.toUpperCase()} ${year}`,
    '',
    '',
    `Docente: ${teacherName}`,
    '',
    `Grupo: ${groupName}`,
  ]);
  rows.push([
    `Fecha de Emisión: ${new Date().toLocaleDateString('es-MX')}`,
    '',
    '',
    `Total de Alumnos: ${students.length}`,
  ]);
  rows.push([]); // Espaciador

  // Días y nombres de día
  const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0'));
  const dayLetters = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, parseInt(month.split('-')[1], 10) - 1, i + 1);
    const letters = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    return letters[d.getDay()];
  });

  // Fila de día de semana
  rows.push(['', '', 'Día:', ...dayLetters, '', '', '', '']);

  // Fila de encabezado principal
  rows.push([
    '#',
    'Matrícula',
    'Nombre del Alumno',
    ...dayHeaders,
    'Asistencias (P)',
    'Retardos (R)',
    'Faltas (F)',
    '% Asistencia',
  ]);

  // Contadores acumulados
  const dailyTotalsPresent: number[] = new Array(daysInMonth).fill(0);
  let totalPresentsSum = 0;
  let totalLatesSum = 0;
  let totalAbsentsSum = 0;

  // Filas por alumno
  students.forEach((student, index) => {
    const sId = student._id;
    const studentRecs = records[sId] || {};
    const summary = summaries[sId] || { presents: 0, lates: 0, absents: 0, attendanceRate: 0 };

    totalPresentsSum += summary.presents;
    totalLatesSum += summary.lates;
    totalAbsentsSum += summary.absents;

    const dayCells: string[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${month}-${String(day).padStart(2, '0')}`;
      const rec = studentRecs[dateKey];
      if (!rec) {
        dayCells.push('—');
      } else if (rec.status === 'PRESENT') {
        dayCells.push('P');
        dailyTotalsPresent[day - 1]++;
      } else if (rec.status === 'LATE') {
        dayCells.push('R');
        dailyTotalsPresent[day - 1]++;
      } else if (rec.status === 'ABSENT') {
        dayCells.push('F');
      } else {
        dayCells.push('—');
      }
    }

    rows.push([
      index + 1,
      student.enrollmentNumber || '#EQR-0000',
      student.name,
      ...dayCells,
      summary.presents,
      summary.lates,
      summary.absents,
      `${summary.attendanceRate}%`,
    ]);
  });

  // Fila de totales
  rows.push([]);
  const overallTotal = totalPresentsSum + totalLatesSum + totalAbsentsSum;
  const overallRate =
    overallTotal > 0 ? Math.round(((totalPresentsSum + totalLatesSum) / overallTotal) * 100) : 0;

  rows.push([
    'TOTAL',
    '',
    'Alumnos Presentes por Día',
    ...dailyTotalsPresent,
    totalPresentsSum,
    totalLatesSum,
    totalAbsentsSum,
    `${overallRate}%`,
  ]);

  // Construcción de la hoja de cálculo
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Ajuste de anchura de columnas
  const colWidths = [
    { wch: 5 }, // #
    { wch: 14 }, // Matrícula
    { wch: 32 }, // Nombre
    ...dayHeaders.map(() => ({ wch: 4 })), // Columnas de días
    { wch: 16 }, // Asistencias (P)
    { wch: 14 }, // Retardos (R)
    { wch: 12 }, // Faltas (F)
    { wch: 14 }, // % Asistencia
  ];
  ws['!cols'] = colWidths;

  // Construir libro y descargar
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Asistencia_${month}`);
  XLSX.writeFile(wb, `Reporte_Asistencia_${month}.xlsx`);
};
