import { logger } from '../../logger/logger';

import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';

/**
 * Extract plain text from a PDF file buffer.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ data: buffer });
    const data = await parser.getText();
    return data.text || '';
  } catch (err: any) {
    logger.error('Failed to extract text from PDF', { error: err.message });
    throw new Error(`Failed to extract text from PDF: ${err.message}`);
  }
}

/**
 * Extract plain text from a DOCX file buffer.
 */
export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (err: any) {
    logger.error('Failed to extract text from DOCX', { error: err.message });
    throw new Error(`Failed to extract text from DOCX: ${err.message}`);
  }
}
