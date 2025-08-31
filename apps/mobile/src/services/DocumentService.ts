import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface DocumentData {
  id: string;
  file_name: string;
  file_path?: string;
  file_size: number;
  organization_id?: string;
  organization_slug?: string;
  mime_type?: string;
  created_at: string;
  updated_at?: string;
  signing_url?: string;
}

export interface SignatureData {
  signerName: string;
  signerEmail: string;
  anonymousUserId?: string;
}

export class DocumentService {
  private baseUrl: string;

  constructor(baseUrl: string = 'https://chayo.vercel.app') {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetch organization documents by slug (public endpoint for mobile app)
   */
  async getOrganizationDocuments(organizationSlug: string): Promise<DocumentData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/organizations/public/${organizationSlug}/documents`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Organization not found');
        }
        throw new Error(`Failed to load documents: ${response.statusText}`);
      }
      const data = await response.json();
      return data.documents || [];
    } catch (error) {
      console.error('Error fetching organization documents:', error);
      throw error;
    }
  }

  /**
   * Fetch document metadata
   */
  async getDocument(documentId: string): Promise<DocumentData> {
    try {
      const response = await fetch(`${this.baseUrl}/api/sign-document/${documentId}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.statusText}`);
      }

      const data = await response.json();
      return data.document;
    } catch (error) {
      console.error('Error fetching document:', error);
      throw error;
    }
  }

  /**
   * Get PDF URL for viewing
   */
  getPdfUrl(documentId: string): string {
    return `${this.baseUrl}/api/sign-document/${documentId}/pdf`;
  }

  /**
   * Download PDF as ArrayBuffer for pdf-lib processing
   */
  async downloadPdfBytes(documentId: string): Promise<ArrayBuffer> {
    try {
      const response = await fetch(this.getPdfUrl(documentId));

      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.statusText}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  }

  /**
   * Process PDF with pdf-lib (fill forms, add signatures)
   */
  async processPdf(
    pdfBytes: ArrayBuffer,
    signatureData: SignatureData,
    formData?: Record<string, string>
  ): Promise<Uint8Array> {
    try {
      // Load PDF document
      const pdfDoc = await PDFDocument.load(pdfBytes);

      // Get the form from the PDF
      const form = pdfDoc.getForm();
      const fields = form.getFields();

      console.log(`PDF has ${fields.length} form fields`);

      // Fill form fields if provided
      if (formData) {
        fields.forEach(field => {
          const fieldName = field.getName();
          if (formData[fieldName]) {
            try {
              if (field.constructor.name === 'PDFTextField') {
                (field as any).setText(formData[fieldName]);
              } else if (field.constructor.name === 'PDFCheckBox') {
                if (formData[fieldName].toLowerCase() === 'true') {
                  (field as any).check();
                }
              }
            } catch (error) {
              console.warn(`Failed to fill field ${fieldName}:`, error);
            }
          }
        });
      }

      // Add signature text (simple text-based signature)
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      firstPage.getSize();

      // Add signature at bottom of first page
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      firstPage.drawText(`Digitally signed by: ${signatureData.signerName}`, {
        x: 50,
        y: 50,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });

      firstPage.drawText(`Email: ${signatureData.signerEmail}`, {
        x: 50,
        y: 35,
        size: 8,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });

      firstPage.drawText(`Signed on: ${new Date().toLocaleString()}`, {
        x: 50,
        y: 20,
        size: 8,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });

      // Flatten the form to prevent further editing
      form.flatten();

      // Save and return the PDF bytes
      return await pdfDoc.save();
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw error;
    }
  }

  /**
   * Submit signed PDF to the API
   */
  async submitSignedDocument(
    documentId: string,
    signedPdfBytes: Uint8Array,
    signatureData: SignatureData
  ): Promise<any> {
    try {
              // Create Blob directly from Uint8Array (same as web version)
        const pdfBlob = new Blob([signedPdfBytes], { type: 'application/pdf' });

      // Create FormData
      const formData = new FormData();
      formData.append('signedPdf', pdfBlob as any);
      formData.append('signerName', signatureData.signerName);
      formData.append('signerEmail', signatureData.signerEmail);

      if (signatureData.anonymousUserId) {
        formData.append('anonymousUserId', signatureData.anonymousUserId);
      }

      // Submit to API
      const response = await fetch(`${this.baseUrl}/api/sign-document/${documentId}/submit`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit signed document');
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting signed document:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const documentService = new DocumentService();
