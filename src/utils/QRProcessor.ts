import { XMLParser } from 'fast-xml-parser';
import CryptoJS from 'crypto-js';
import { AadhaarData } from '../types';
import { InvalidQRDataError } from '../utils/errors';

/**
 * Enhanced QR code processor for Aadhaar mAadhaar QR codes
 * Handles XML parsing, signature validation, and data extraction
 */
export class QRProcessor {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: true,
      trimValues: true
    });
  }

  /**
   * Process mAadhaar QR code and extract identity data
   */
  async processQRCode(qrData: string): Promise<AadhaarData> {
    if (!this.validateQRFormat(qrData)) {
      throw new InvalidQRDataError('Invalid mAadhaar QR code format');
    }

    try {
      // Decode the QR data (usually base64 encoded)
      const decodedData = this.decodeQRData(qrData);
      
      // Parse XML structure
      const parsedXML = this.parseXMLData(decodedData);
      
      // Extract identity attributes
      const identityData = this.extractIdentityData(parsedXML);
      
      // Validate UIDAI signature (simplified - real implementation would verify RSA)
      this.validateSignature(parsedXML, qrData);
      
      return {
        ...identityData,
        signature: qrData,
        xmlData: decodedData
      };

    } catch (error) {
      throw new InvalidQRDataError(`QR processing failed: ${error}`);
    }
  }

  /**
   * Validate QR code format
   */
  private validateQRFormat(qrData: string): boolean {
    if (!qrData || typeof qrData !== 'string') {
      return false;
    }

    // Check for minimum length
    if (qrData.length < 100) {
      return false;
    }

    try {
      // Try to decode as base64
      const decoded = atob(qrData);
      
      // Check for XML structure indicators
      return decoded.includes('<?xml') || 
             decoded.includes('PrintLetterBarcodeData') ||
             decoded.includes('uid=');
    } catch {
      // If not base64, check for direct XML
      return qrData.includes('uid=') || qrData.includes('name=');
    }
  }

  /**
   * Decode QR data (handle various encoding formats)
   */
  private decodeQRData(qrData: string): string {
    try {
      // Try base64 decoding first
      return atob(qrData);
    } catch {
      // If not base64, assume it's already decoded
      return qrData;
    }
  }

  /**
   * Parse XML data structure
   */
  private parseXMLData(xmlData: string): any {
    try {
      // Handle different XML formats from mAadhaar
      if (xmlData.includes('PrintLetterBarcodeData')) {
        return this.parser.parse(xmlData);
      } else {
        // Handle attribute-based format
        return this.parseAttributeFormat(xmlData);
      }
    } catch (error) {
      throw new Error(`XML parsing failed: ${error}`);
    }
  }

  /**
   * Parse attribute-based QR format (uid="xxx" name="yyy")
   */
  private parseAttributeFormat(data: string): any {
    const attributes: any = {};
    
    // Extract attributes using regex
    const attributeRegex = /(\w+)="([^"]*)"/g;
    let match;
    
    while ((match = attributeRegex.exec(data)) !== null) {
      attributes[match[1]] = match[2];
    }
    
    return {
      PrintLetterBarcodeData: {
        '@_uid': attributes.uid,
        '@_name': attributes.name,
        '@_dob': attributes.dob,
        '@_gender': attributes.gender,
        '@_co': attributes.co,
        '@_dist': attributes.dist,
        '@_house': attributes.house,
        '@_lm': attributes.lm,
        '@_loc': attributes.loc,
        '@_pc': attributes.pc,
        '@_po': attributes.po,
        '@_state': attributes.state,
        '@_street': attributes.street,
        '@_subdist': attributes.subdist,
        '@_vtc': attributes.vtc
      }
    };
  }

  /**
   * Extract identity data from parsed XML
   */
  private extractIdentityData(parsedXML: any): Omit<AadhaarData, 'signature' | 'xmlData'> {
    const data = parsedXML.PrintLetterBarcodeData || parsedXML;
    
    if (!data) {
      throw new Error('No identity data found in QR code');
    }

    // Extract all address components
    const addressComponents = [
      data['@_house'],
      data['@_street'], 
      data['@_lm'],
      data['@_loc'],
      data['@_vtc'],
      data['@_subdist'],
      data['@_dist'],
      data['@_state'],
      data['@_pc']
    ].filter(Boolean);

    return {
      referenceId: data['@_uid'] || data['@_referenceId'] || '',
      name: data['@_name'] || '',
      dateOfBirth: this.formatDate(data['@_dob'] || ''),
      gender: (data['@_gender'] || 'M') as 'M' | 'F' | 'T',
      address: addressComponents.join(', '),
      careOf: data['@_co'],
      district: data['@_dist'],
      landmark: data['@_lm'],
      house: data['@_house'],
      location: data['@_loc'],
      pincode: data['@_pc'],
      postOffice: data['@_po'],
      state: data['@_state'],
      street: data['@_street'],
      subDistrict: data['@_subdist'],
      vtc: data['@_vtc'],
      last4Aadhaar: (data['@_uid'] || '').slice(-4),
      mobileHash: data['@_mobileHash'],
      emailHash: data['@_emailHash']
    };
  }

  /**
   * Format date from various Aadhaar formats to ISO format
   */
  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    
    // Handle different date formats
    // DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
    const ddmmyyyy = /^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/;
    const yyyymmdd = /^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/;
    
    let match = dateStr.match(ddmmyyyy);
    if (match) {
      const [, day, month, year] = match;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    match = dateStr.match(yyyymmdd);
    if (match) {
      const [, year, month, day] = match;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return dateStr;
  }

  /**
   * Validate UIDAI signature (simplified version)
   * In production, this would verify the RSA-2048 signature
   */
  private validateSignature(parsedData: any, originalQR: string): boolean {
    // For now, just check if essential fields are present
    const data = parsedData.PrintLetterBarcodeData || parsedData;
    
    const requiredFields = ['@_uid', '@_name', '@_dob'];
    const hasRequired = requiredFields.every(field => data[field]);
    
    if (!hasRequired) {
      throw new InvalidQRDataError('Missing required identity fields');
    }

    // In production: 
    // 1. Extract the signature from QR data
    // 2. Verify using UIDAI public key
    // 3. Validate signature matches the data
    
    console.log('⚠️ Signature validation simplified for demo');
    return true;
  }

  /**
   * Batch process multiple QR codes
   */
  async batchProcessQRCodes(qrCodes: string[]): Promise<AadhaarData[]> {
    console.log(`📦 Processing ${qrCodes.length} QR codes...`);
    
    const results = await Promise.allSettled(
      qrCodes.map(qr => this.processQRCode(qr))
    );
    
    const successful: AadhaarData[] = [];
    const failed: string[] = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        failed.push(`QR ${index + 1}: ${result.reason}`);
      }
    });
    
    if (failed.length > 0) {
      console.warn('Failed to process some QR codes:', failed);
    }
    
    console.log(`✅ Successfully processed ${successful.length}/${qrCodes.length} QR codes`);
    return successful;
  }

  /**
   * Extract demographic hash for privacy-preserving operations
   */
  generateDemographicHash(aadhaarData: AadhaarData): string {
    const demographicString = [
      aadhaarData.name.toLowerCase().trim(),
      aadhaarData.dateOfBirth,
      aadhaarData.gender,
      aadhaarData.pincode
    ].join('|');
    
    return CryptoJS.SHA256(demographicString).toString();
  }

  /**
   * Generate privacy-preserving location hash
   */
  generateLocationHash(aadhaarData: AadhaarData): string {
    const locationString = [
      aadhaarData.district,
      aadhaarData.state,
      aadhaarData.pincode
    ].filter(Boolean).join('|').toLowerCase();
    
    return CryptoJS.SHA256(locationString).toString();
  }

  /**
   * Validate extracted data completeness
   */
  validateDataCompleteness(aadhaarData: AadhaarData): {
    isComplete: boolean;
    missingFields: string[];
    score: number;
  } {
    const requiredFields = ['referenceId', 'name', 'dateOfBirth', 'gender'];
    const optionalFields = ['address', 'pincode', 'state'];
    
    const missingRequired = requiredFields.filter(field => 
      !aadhaarData[field as keyof AadhaarData]
    );
    
    const presentOptional = optionalFields.filter(field => 
      aadhaarData[field as keyof AadhaarData]
    );
    
    const score = ((requiredFields.length - missingRequired.length) / requiredFields.length) * 0.8 +
                  (presentOptional.length / optionalFields.length) * 0.2;
    
    return {
      isComplete: missingRequired.length === 0,
      missingFields: missingRequired,
      score: Math.round(score * 100)
    };
  }
}