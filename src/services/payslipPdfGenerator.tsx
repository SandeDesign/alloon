import { pdf } from '@react-pdf/renderer';
import { PayslipPDFTemplate } from '../components/payslip/PayslipPDFTemplate';
import { PayslipData } from '../types/payslip';

export const generatePayslipPdfBlob = async (payslipData: PayslipData): Promise<Blob> => {
  return await pdf(<PayslipPDFTemplate data={payslipData} />).toBlob();
};
