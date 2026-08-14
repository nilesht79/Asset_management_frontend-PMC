import * as XLSX from 'xlsx-js-style';

const formatDate = (value) => {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatStatus = (value) => {
  if (!value) return '-';

  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const borderStyle = {
  top: {
    style: 'thin',
    color: { rgb: '000000' },
  },
  bottom: {
    style: 'thin',
    color: { rgb: '000000' },
  },
  left: {
    style: 'thin',
    color: { rgb: '000000' },
  },
  right: {
    style: 'thin',
    color: { rgb: '000000' },
  },
};

const headerStyle = {
  font: {
    bold: true,
    name: 'Calibri',
    sz: 11,
  },
  alignment: {
    horizontal: 'center',
    vertical: 'center',
    wrapText: true,
  },
  border: borderStyle,
};

const titleStyle = {
  font: {
    bold: true,
    name: 'Calibri',
    sz: 11,
  },
  alignment: {
    horizontal: 'left',
    vertical: 'center',
  },
};

const cellStyle = {
  font: {
    name: 'Calibri',
    sz: 11,
  },
  alignment: {
    vertical: 'center',
    wrapText: true,
  },
  border: borderStyle,
};

export const exportServerReport = (reports) => {
  if (!reports || reports.length === 0) {
    return false;
  }

  /*
   * Severity Level intentionally removed.
   */
  const headers = [
    'Sr. No',
    'Cust. Name',
    'Date',
    'User Name',
    'Department',
    'Location',
    'Category',
    'Problem',
    'Engineer Name',
    'Action Taken',
    'Spare used',
    'Time Resolution',
    'Resolution Date',
    'Status',
  ];

  const rows = reports.map((item, index) => [
    index + 1,

    'PMC',

    formatDate(item.created_at),

    item.created_by_user_name ||
      item.created_by_name ||
      item.user_name ||
      '-',

    item.department_name ||
      item.department ||
      '-',

    item.location_name ||
      item.location ||
      '-',

    item.category || 'Server Reports',

    item.title || '-',

    item.assigned_engineer_name ||
      item.engineer_name ||
      '-',

    item.resolution_notes ||
      item.action_taken ||
      item.description ||
      '-',

    item.spares_used ||
      item.spare_used ||
      'NA',

    item.time_resolution || '-',

    formatDate(
      item.closed_at ||
        item.resolved_at ||
        item.created_at
    ),

    formatStatus(item.status),
  ]);

  const worksheetData = [
    [
      'IT Department Municipal Corporation Pune',
    ],

    [
      'Main Building PMC, Congress House Road, Near PMC Metro Station, Shivaji Nagar, Pune, Maharashtra - 411005',
    ],

    [
      'Vendor Name :- Polestar Consulting Pvt Ltd',
    ],

    [
      'Tender No :- PMC/IT/2022/13 – Facility Management Services (FMS)',
    ],

    [
      'Server Report',
    ],

    headers,

    ...rows,
  ];

  const worksheet =
    XLSX.utils.aoa_to_sheet(worksheetData);

  /*
   * Merge title rows
   */
  worksheet['!merges'] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: headers.length - 1 },
    },
    {
      s: { r: 1, c: 0 },
      e: { r: 1, c: headers.length - 1 },
    },
    {
      s: { r: 2, c: 0 },
      e: { r: 2, c: headers.length - 1 },
    },
    {
      s: { r: 3, c: 0 },
      e: { r: 3, c: headers.length - 1 },
    },
    {
      s: { r: 4, c: 0 },
      e: { r: 4, c: headers.length - 1 },
    },
  ];

  /*
   * Column widths
   */
  worksheet['!cols'] = [
    { wch: 8 },
    { wch: 15 },
    { wch: 14 },
    { wch: 25 },
    { wch: 22 },
    { wch: 22 },
    { wch: 20 },
    { wch: 40 },
    { wch: 25 },
    { wch: 45 },
    { wch: 15 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
  ];

  /*
   * Row heights
   */
  worksheet['!rows'] = [
    { hpt: 20 },
    { hpt: 20 },
    { hpt: 20 },
    { hpt: 20 },
    { hpt: 20 },
    { hpt: 30 },
  ];

  /*
   * Bold title rows
   */
  for (let row = 0; row <= 4; row++) {
    const cellAddress = XLSX.utils.encode_cell({
      r: row,
      c: 0,
    });

    if (worksheet[cellAddress]) {
      worksheet[cellAddress].s = titleStyle;
    }
  }

  /*
   * Bold + bordered column headers
   */
  for (let col = 0; col < headers.length; col++) {
    const cellAddress = XLSX.utils.encode_cell({
      r: 5,
      c: col,
    });

    if (worksheet[cellAddress]) {
      worksheet[cellAddress].s = headerStyle;
    }
  }

  /*
   * Borders on all data cells
   */
  for (let row = 6; row < worksheetData.length; row++) {
    for (let col = 0; col < headers.length; col++) {
      const cellAddress = XLSX.utils.encode_cell({
        r: row,
        c: col,
      });

      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = cellStyle;
      }
    }
  }

  /*
   * Create workbook
   */
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    'Server Report'
  );

  /*
   * Export Excel
   */
  XLSX.writeFile(
    workbook,
    `Server_Report_${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`
  );

  return true;
};
