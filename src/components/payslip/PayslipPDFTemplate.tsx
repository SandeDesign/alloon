import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { PayslipData } from '../../types/payslip';

// Register fonts for better typography
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2' },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiA.woff2', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Inter',
    fontSize: 10,
    lineHeight: 1.4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  companyInfo: {
    flex: 1,
  },
  employeeInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: '#E5E7EB',
    marginBottom: 15,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    padding: 8,
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: '#E5E7EB',
    padding: 8,
  },
  tableCellHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
  },
  tableCell: {
    fontSize: 10,
    color: '#1F2937',
  },
  summaryBox: {
    backgroundColor: '#EFF6FF',
    border: '1px solid #DBEAFE',
    borderRadius: 8,
    padding: 15,
    marginTop: 20,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#374151',
  },
  summaryValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  netPayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#1E40AF',
  },
  netPayLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  netPayValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#6B7280',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
});

interface PayslipPDFTemplateProps {
  data: PayslipData;
}

export const PayslipPDFTemplate: React.FC<PayslipPDFTemplateProps> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.companyInfo}>
          <Text style={styles.title}>Loonstrook</Text>
          <Text style={styles.subtitle}>{data.company.name}</Text>
          <Text style={styles.subtitle}>{data.company.address}</Text>
          <Text style={styles.subtitle}>{data.company.postalCode} {data.company.city}</Text>
          <Text style={styles.subtitle}>KvK: {data.company.kvkNumber}</Text>
          <Text style={styles.subtitle}>BTW: {data.company.taxNumber}</Text>
        </View>
        <View style={styles.employeeInfo}>
          <Text style={styles.subtitle}>Werknemer: {data.employee.name}</Text>
          <Text style={styles.subtitle}>Personeelsnummer: {data.employee.employeeNumber}</Text>
          <Text style={styles.subtitle}>BSN: {data.employee.bsn}</Text>
          <Text style={styles.subtitle}>Functie: {data.employee.jobTitle}</Text>
          <Text style={styles.subtitle}>Periode: {data.period.startDate.toLocaleDateString('nl-NL')} - {data.period.endDate.toLocaleDateString('nl-NL')}</Text>
          <Text style={styles.subtitle}>Uitbetaling: {data.period.paymentDate.toLocaleDateString('nl-NL')}</Text>
        </View>
      </View>

      {/* Earnings */}
      <Text style={styles.sectionTitle}>Verdiensten</Text>
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCellHeader}>Omschrijving</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCellHeader}>Aantal</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCellHeader}>Tarief</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCellHeader}>Bedrag</Text>
          </View>
        </View>
        {data.earnings.map((earning, index) => (
          <View style={styles.tableRow} key={index}>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{earning.description}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{earning.quantity}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>€{earning.rate.toFixed(2)}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>€{earning.amount.toFixed(2)}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Deductions */}
      <Text style={styles.sectionTitle}>Inhoudingen</Text>
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCellHeader}>Omschrijving</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCellHeader}>Bedrag</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCellHeader}>T/m periode</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCellHeader}></Text>
          </View>
        </View>
        {data.taxes.map((tax, index) => (
          <View style={styles.tableRow} key={index}>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{tax.description}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>€{tax.amount.toFixed(2)}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>€{tax.ytdAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}></Text>
            </View>
          </View>
        ))}
        {data.deductions.map((deduction, index) => (
          <View style={styles.tableRow} key={index}>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{deduction.description}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>€{deduction.amount.toFixed(2)}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>€{deduction.ytdAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}></Text>
            </View>
          </View>
        ))}
      </View>

      {/* Summary */}
      <View style={styles.summaryBox}>
        <Text style={styles.summaryTitle}>Samenvatting</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Bruto loon:</Text>
          <Text style={styles.summaryValue}>€{data.summary.grossPay.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Totaal inhoudingen:</Text>
          <Text style={styles.summaryValue}>€{(data.summary.totalDeductions + data.summary.totalTaxes).toFixed(2)}</Text>
        </View>
        <View style={styles.netPayRow}>
          <Text style={styles.netPayLabel}>Netto uitbetaling:</Text>
          <Text style={styles.netPayValue}>€{data.summary.netPay.toFixed(2)}</Text>
        </View>
      </View>

      {/* Leave Balance */}
      <Text style={styles.sectionTitle}>Verlof</Text>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Opgebouwd:</Text>
        <Text style={styles.summaryValue}>{data.leave.vacationDaysAccrued} dagen</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Opgenomen:</Text>
        <Text style={styles.summaryValue}>{data.leave.vacationDaysUsed} dagen</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Saldo:</Text>
        <Text style={styles.summaryValue}>{data.leave.vacationDaysBalance} dagen</Text>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        Deze loonstrook is gegenereerd door AlloonApp - {new Date().toLocaleDateString('nl-NL')}
      </Text>
    </Page>
  </Document>
);