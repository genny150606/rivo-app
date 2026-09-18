/**
 * Types & Contracts for Feature 5: Native Digital Wallet Pass Engine
 * Apple Wallet (.pkpass) & Google Wallet (Generic Pass API)
 */

export type LoyaltyPassType = 'apple_wallet' | 'google_wallet';

export interface CustomerLoyaltyPass {
  id: string;
  organization_id: string;
  loyalty_card_id?: string | null;
  pass_type: LoyaltyPassType;
  pass_token: string;
  customer_contact: string;
  customer_name?: string | null;
  stamps_count: number;
  max_stamps: number;
  reward_text?: string | null;
  apple_serial_number?: string | null;
  apple_authentication_token?: string | null;
  apple_push_token?: string | null;
  google_class_id?: string | null;
  google_object_id?: string | null;
  google_save_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApplePassBarcode {
  message: string;
  format: 'PKBarcodeFormatQR' | 'PKBarcodeFormatPDF417' | 'PKBarcodeFormatAztec' | 'PKBarcodeFormatCode128';
  messageEncoding: 'iso-8859-1' | 'utf-8';
  altText?: string;
}

export interface ApplePassField {
  key: string;
  label: string;
  value: string | number;
  changeMessage?: string;
  textAlignment?: 'PKTextAlignmentLeft' | 'PKTextAlignmentCenter' | 'PKTextAlignmentRight';
}

export interface ApplePassStructure {
  formatVersion: number;
  passTypeIdentifier: string;
  serialNumber: string;
  teamIdentifier: string;
  organizationName: string;
  description: string;
  foregroundColor?: string;
  backgroundColor?: string;
  labelColor?: string;
  logoText?: string;
  barcodes?: ApplePassBarcode[];
  barcode?: ApplePassBarcode;
  storeCard?: {
    headerFields?: ApplePassField[];
    primaryFields?: ApplePassField[];
    secondaryFields?: ApplePassField[];
    auxiliaryFields?: ApplePassField[];
    backFields?: ApplePassField[];
  };
  generic?: {
    headerFields?: ApplePassField[];
    primaryFields?: ApplePassField[];
    secondaryFields?: ApplePassField[];
    auxiliaryFields?: ApplePassField[];
    backFields?: ApplePassField[];
  };
  authenticationToken?: string;
  webServiceURL?: string;
}

export interface GoogleWalletGenericObject {
  id: string;
  classId: string;
  logo?: {
    sourceUri: { uri: string };
    contentDescription?: { defaultValue: { language: string; value: string } };
  };
  cardTitle: {
    defaultValue: { language: string; value: string };
  };
  subheader?: {
    defaultValue: { language: string; value: string };
  };
  header: {
    defaultValue: { language: string; value: string };
  };
  barcode?: {
    type: 'QR_CODE';
    value: string;
    alternateText?: string;
  };
  textModulesData?: Array<{
    id: string;
    header: string;
    body: string;
  }>;
  hexBackgroundColor?: string;
}
