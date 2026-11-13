import { createZip } from './zip';

/**
 * DOCX export built from real saved proposal data.
 *
 * A DOCX is an OOXML package (ZIP of XML parts). This writer produces a valid
 * WordprocessingML document with a title page block, draft label, headings,
 * paragraphs and bullet lists. It always labels the document as a draft when
 * institutional requirements are unverified.
 */

export interface DocxSection {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface DocxInput {
  title: string;
  subtitle?: string;
  draftLabel?: string;
  metadata?: Array<{ label: string; value: string }>;
  sections: DocxSection[];
  footerNote?: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    // XML 1.0 forbids most control characters.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

function run(text: string, options: { bold?: boolean; italic?: boolean; size?: number; color?: string } = {}): string {
  const props = [
    options.bold ? '<w:b/>' : '',
    options.italic ? '<w:i/>' : '',
    options.size ? `<w:sz w:val="${options.size * 2}"/><w:szCs w:val="${options.size * 2}"/>` : '',
    options.color ? `<w:color w:val="${options.color}"/>` : '',
  ].join('');
  const rPr = props ? `<w:rPr>${props}</w:rPr>` : '';
  return `<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;
}

function paragraph(text: string, options: {
  style?: string;
  bold?: boolean;
  italic?: boolean;
  size?: number;
  color?: string;
  spacingAfter?: number;
  bullet?: boolean;
} = {}): string {
  const pPr = [
    options.style ? `<w:pStyle w:val="${options.style}"/>` : '',
    options.bullet ? '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>' : '',
    `<w:spacing w:after="${options.spacingAfter ?? 120}" w:line="276" w:lineRule="auto"/>`,
  ].join('');
  return `<w:p><w:pPr>${pPr}</w:pPr>${run(text, options)}</w:p>`;
}

function buildDocumentXml(input: DocxInput): string {
  const body: string[] = [];

  body.push(paragraph(input.title, { style: 'Title', bold: true, size: 22, spacingAfter: 80 }));
  if (input.subtitle) body.push(paragraph(input.subtitle, { size: 12, spacingAfter: 60 }));
  if (input.draftLabel) {
    body.push(paragraph(input.draftLabel, { bold: true, size: 10, color: 'B45309', spacingAfter: 40 }));
  }
  body.push(paragraph(`Generated ${new Date().toISOString().slice(0, 10)} by ALO UK PhD Proposal Builder. Verify every source before submission.`, {
    italic: true, size: 8, color: '666666', spacingAfter: 200,
  }));

  if (input.metadata?.length) {
    for (const item of input.metadata) {
      body.push(paragraph(`${item.label}: ${item.value}`, { size: 9.5, spacingAfter: 40 }));
    }
    body.push('<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="CCCCCC"/></w:pBdr></w:pPr></w:p>');
  }

  for (const section of input.sections) {
    if (section.heading) {
      body.push(paragraph(section.heading, { style: 'Heading1', bold: true, size: 14, spacingAfter: 80 }));
    }
    for (const text of section.paragraphs ?? []) {
      for (const block of text.split(/\n{2,}/)) {
        if (block.trim()) body.push(paragraph(block.trim()));
      }
    }
    for (const item of section.bullets ?? []) {
      body.push(paragraph(item, { bullet: true, spacingAfter: 40 }));
    }
  }

  if (input.footerNote) {
    body.push('<w:p><w:pPr><w:pBdr><w:top w:val="single" w:sz="6" w:space="1" w:color="CCCCCC"/></w:pBdr></w:pPr></w:p>');
    body.push(paragraph(input.footerNote, { italic: true, size: 8, color: '666666' }));
  }

  const sectPr =
    '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>';

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<w:body>${body.join('')}${sectPr}</w:body></w:document>`;
}

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/><w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr></w:rPrDefault>
    <w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
  <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:sz w:val="44"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Draft"><w:name w:val="Draft"/><w:rPr><w:b/><w:color w:val="B45309"/></w:rPr></w:style>
</w:styles>`;

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

const DOC_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
</Relationships>`;

function coreXml(title: string): string {
  const stamp = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${escapeXml(title)}</dc:title>
  <dc:creator>ALO UK PhD Proposal Builder</dc:creator>
  <cp:lastModifiedBy>ALO UK PhD Proposal Builder</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${stamp}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${stamp}</dcterms:modified>
</cp:coreProperties>`;
}

const NUMBERING_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="0">
    <w:multiLevelType w:val="hybridMultilevel"/>
    <w:lvl w:ilvl="0">
      <w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/>
      <w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>
      <w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/></w:rPr>
    </w:lvl>
  </w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
</w:numbering>`;

const APP_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>ALO UK PhD Proposal Builder</Application>
</Properties>`;

export function buildDocx(input: DocxInput): Buffer {
  const files = [
    { path: '[Content_Types].xml', data: CONTENT_TYPES },
    { path: '_rels/.rels', data: ROOT_RELS },
    { path: 'word/document.xml', data: buildDocumentXml(input) },
    { path: 'word/styles.xml', data: STYLES_XML },
    { path: 'word/numbering.xml', data: NUMBERING_XML },
    { path: 'word/_rels/document.xml.rels', data: DOC_RELS },
    { path: 'docProps/core.xml', data: coreXml(input.title) },
    { path: 'docProps/app.xml', data: APP_XML },
  ];
  return createZip(files);
}
