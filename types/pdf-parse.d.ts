declare module 'pdf-parse' {
  interface PDFData {
    text: string;
    numpages: number;
    info: {
      PDFFormatVersion: string;
      IsAcroFormPresent: boolean;
      IsXFAPresent: boolean;
      [key: string]: any;
    };
    metadata: {
      'dc:creator': string;
      'dc:format': string;
      'dc:title': string;
      'pdf:producer': string;
      'xmp:createdate': string;
      'xmp:modifydate': string;
      [key: string]: any;
    };
    version: string;
  }

  interface PDFParseOptions {
    max?: number;
    version?: string;
  }

  function pdfParse(buffer: Buffer, options?: PDFParseOptions): Promise<PDFData>;
  
  export = pdfParse;
} 