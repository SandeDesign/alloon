import React, { useState, useEffect, useCallback } from 'react';
import {
  Upload,
  Eye,
  Download,
  Search,
  Calendar,
  Euro,
  Building2,
  User,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Scan,
  Trash2,
  Archive,
  HardDrive
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useToast } from '../hooks/useToast';
import { EmptyState } from '../components/ui/EmptyState';
import { incomingInvoiceService, IncomingInvoice } from '../services/incomingInvoiceService';
import { firebaseStorageHelper } from '../utils/firebase-storage-helper';

const IncomingInvoices: React.FC = () => {
  const { user } = useAuth();
  const { selectedCompany } = useApp();
  const { success, error: showError } = useToast();
  const [invoices, setInvoices] = useState<IncomingInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [archiving, setArchiving] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDragOver, setIsDragOver] = useState(false);
  const [showArchiveInfo, setShowArchiveInfo] = useState(false);

  const loadInvoices = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const invoicesData = await incomingInvoiceService.getInvoices(
        user.uid, 
        selectedCompany?.id
      );
      setInvoices(invoicesData);
    } catch (error) {
      console.error('Error loading invoices:', error);
      showError('Fout bij laden', 'Kon facturen niet laden');
    } finally {
      setLoading(false);
    }
  }, [user, selectedCompany, showError]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleFileUpload = async (files: FileList) => {
    if (!files.length || !selectedCompany || !user) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
          showError('Ongeldig bestandstype', 'Alleen PDF en afbeeldingen zijn toegestaan');
          continue;
        }

        if (file.size > 10 * 1024 * 1024) {
          showError('Bestand te groot', 'Maximaal 10MB per bestand');
          continue;
        }

        await incomingInvoiceService.uploadInvoice(file, user.uid, selectedCompany.id);
      }
      
      success('Bestanden geüpload', 'Facturen zijn geüpload en verwerkt');
      loadInvoices();
    } catch (error) {
      showError('Fout bij uploaden', 'Kon bestanden niet uploaden');
    } finally {
      setUploading(false);
    }
  };

  const handleArchiveToGoogleDrive = async (invoiceId: string) => {
    if (!user || !selectedCompany) return;

    setArchiving(invoiceId);
    try {
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (!invoice) {
        showError('Fout', 'Factuur niet gevonden');
        return;
      }

      await incomingInvoiceService.archiveToGoogleDrive(
        invoiceId,
        user.uid,
        selectedCompany.id,
        invoice
      );

      success('Gearchiveerd', 'Factuur is gearchiveerd in Google Drive');
      loadInvoices();
    } catch (error) {
      showError('Fout bij archiveren', error instanceof Error ? error.message : 'Kon factuur niet archiveren');
    } finally {
      setArchiving(null);
    }
  };

  const handleDownloadFile = async (invoice: IncomingInvoice) => {
    if (!selectedCompany) return;
    
    setDownloading(invoice.id!);
    try {
      const storagePath = `incoming-invoices/${selectedCompany.id}/${Date.now()}-${invoice.fileName}`;
      await firebaseStorageHelper.downloadFile(storagePath, invoice.fileName);
      success('Download gestart', `${invoice.fileName} wordt gedownload`);
    } catch (error) {
      console.error('Download error:', error);
      showError('Download fout', 'Kon bestand niet downloaden');
    } finally {
      setDownloading(null);
    }
  };

  const handleViewFile = async (invoice: IncomingInvoice) => {
    if (!selectedCompany) return;
    
    try {
      const storagePath = `incoming-invoices/${selectedCompany.id}/${Date.now()}-${invoice.fileName}`;
      await firebaseStorageHelper.viewFile(storagePath);
    } catch (error) {
      console.error('View error:', error);
      showError('View fout', 'Kon bestand niet openen');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleApprove = async (invoiceId: string) => {
    if (!user) return;
    
    try {
      await incomingInvoiceService.approveInvoice(invoiceId, user.uid);
      success('Factuur goedgekeurd', 'De factuur is goedgekeurd voor betaling');
      loadInvoices();
    } catch (error) {
      showError('Fout bij goedkeuren', 'Kon factuur niet goedkeuren');
    }
  };

  const handleReject = async (invoiceId: string) => {
    const reason = prompt('Reden voor afwijzing:');
    if (!reason) return;
    
    try {
      await incomingInvoiceService.rejectInvoice(invoiceId, reason);
      success('Factuur afgewezen', 'De factuur is afgewezen');
      loadInvoices();
    } catch (error) {
      showError('Fout bij afwijzen', 'Kon factuur niet afwijzen');
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      await incomingInvoiceService.markAsPaid(invoiceId);
      success('Factuur betaald', 'De factuur is gemarkeerd als betaald');
      loadInvoices();
    } catch (error) {
      showError('Fout bij bijwerken', 'Kon factuur niet als betaald markeren');
    }
  };

  const handleDelete = async (invoiceId: string) => {
    if (!confirm('Weet je zeker dat je deze factuur wilt verwijderen?')) return;
    
    try {
      await incomingInvoiceService.deleteInvoice(invoiceId);
      success('Factuur verwijderd', 'De factuur is succesvol verwijderd');
      loadInvoices();
    } catch (error) {
      showError('Fout bij verwijderen', 'Kon factuur niet verwijderen');
    }
  };

  const getStatusColor = (status: IncomingInvoice['status']) => {
    switch (status) {
      case 'pending': return 'text-orange-600 bg-orange-100';
      case 'approved': return 'text-blue-600 bg-blue-100';
      case 'paid': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: IncomingInvoice['status']) => {
    switch (status) {
      case 'pending': return Clock;
      case 'approved': return CheckCircle;
      case 'paid': return CheckCircle;
      case 'rejected': return AlertCircle;
      default: return Clock;
    }
  };

  const getStatusText = (status: IncomingInvoice['status']) => {
    switch (status) {
      case 'pending': return 'In behandeling';
      case 'approved': return 'Goedgekeurd';
      case 'paid': return 'Betaald';
      case 'rejected': return 'Afgewezen';
      default: return status;
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!selectedCompany) {
    return (
      <EmptyState
        icon={Building2}
        title="Geen bedrijf geselecteerd"
        description="Selecteer een bedrijf om facturen te beheren"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inkomende Facturen</h1>
          <p className="mt-1 text-sm text-gray-500">
            Beheer inkomende facturen voor {selectedCompany.name}
          </p>
        </div>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <label className="cursor-pointer">
            <Button as="span" icon={Upload} disabled={uploading}>
              {uploading ? 'Uploaden...' : 'Upload Factuur'}
            </Button>
            <input
              type="file"
              multiple
              accept=".pdf,image/*"
              className="hidden"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            />
          </label>
          <Button
            variant="ghost"
            icon={HardDrive}
            onClick={() => setShowArchiveInfo(!showArchiveInfo)}
          >
            Google Drive
          </Button>
        </div>
      </div>

      {/* Archive Info Box */}
      {showArchiveInfo && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="p-4">
            <div className="flex items-start space-x-3">
              <HardDrive className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">Google Drive Archivering</h3>
                <p className="mt-1 text-sm text-blue-800">
                  Goedgekeurde facturen kunnen worden gearchiveerd in Google Drive. Dit slaat de originele bestanden op 
                  en extraheert alle gegevens automatisch via OCR voor administratieve doeleinden. De bedragen worden 
                  bewaard voor rapportage en financiële overzichten.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Upload Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Sleep facturen hierheen of{' '}
          <label className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer">
            selecteer bestanden
            <input
              type="file"
              multiple
              accept=".pdf,image/*"
              className="hidden"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            />
          </label>
        </p>
        <p className="mt-1 text-xs text-gray-500">
          PDF, PNG, JPG tot 10MB per bestand
        </p>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Zoek op leverancier of factuurnummer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Alle statussen</option>
                <option value="pending">In behandeling</option>
                <option value="approved">Goedgekeurd</option>
                <option value="paid">Betaald</option>
                <option value="rejected">Afgewezen</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Invoices List */}
      {filteredInvoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Geen facturen gevonden"
          description={searchTerm || statusFilter !== 'all' 
            ? "Geen facturen gevonden die voldoen aan de filters" 
            : "Upload je eerste factuur"}
        />
      ) : (
        <div className="grid gap-4">
          {filteredInvoices.map((invoice) => {
            const StatusIcon = getStatusIcon(invoice.status);
            const isDownloading = downloading === invoice.id;
            const isArchiving = archiving === invoice.id;

            return (
              <Card key={invoice.id}>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-6 w-6 text-orange-600" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {invoice.invoiceNumber}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {getStatusText(invoice.status)}
                          </span>
                          {invoice.ocrProcessed && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                              <Scan className="h-3 w-3 mr-1" />
                              OCR
                            </span>
                          )}
                          {invoice.archivedToDrive && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              <HardDrive className="h-3 w-3 mr-1" />
                              Drive
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {invoice.supplierName}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {invoice.invoiceDate.toLocaleDateString('nl-NL')}
                          </div>
                          <div className="flex items-center">
                            <Euro className="h-4 w-4 mr-1" />
                            €{invoice.totalAmount.toFixed(2)}
                          </div>
                        </div>
                        {invoice.ocrData && invoice.ocrData.confidence < 0.8 && (
                          <div className="mt-2 text-sm text-amber-600">
                            ⚠️ OCR betrouwbaarheid: {Math.round(invoice.ocrData.confidence * 100)}% - Controleer gegevens
                          </div>
                        )}
                        {invoice.status === 'rejected' && invoice.rejectionReason && (
                          <div className="mt-2 text-sm text-red-600">
                            Afgewezen: {invoice.rejectionReason}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Eye}
                        onClick={() => handleViewFile(invoice)}
                        disabled={isDownloading}
                        title="Open PDF in nieuw venster"
                      >
                        Bekijken
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Download}
                        onClick={() => handleDownloadFile(invoice)}
                        disabled={isDownloading}
                        className={isDownloading ? 'opacity-50' : ''}
                      >
                        {isDownloading ? 'Download...' : 'Download'}
                      </Button>
                      {invoice.status === 'pending' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            icon={CheckCircle}
                            onClick={() => handleApprove(invoice.id!)}
                          >
                            Goedkeuren
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            icon={AlertCircle}
                            onClick={() => handleReject(invoice.id!)}
                          >
                            Afwijzen
                          </Button>
                        </>
                      )}
                      {invoice.status === 'approved' && !invoice.archivedToDrive && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            icon={Archive}
                            onClick={() => handleArchiveToGoogleDrive(invoice.id!)}
                            disabled={isArchiving}
                            className={isArchiving ? 'opacity-50' : ''}
                          >
                            {isArchiving ? 'Archiveren...' : 'Archiveren'}
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            icon={CheckCircle}
                            onClick={() => handleMarkAsPaid(invoice.id!)}
                          >
                            Betaald
                          </Button>
                        </>
                      )}
                      {invoice.status === 'approved' && invoice.archivedToDrive && (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={CheckCircle}
                          onClick={() => handleMarkAsPaid(invoice.id!)}
                        >
                          Betaald
                        </Button>
                      )}
                      {(invoice.status === 'rejected' || invoice.status === 'pending') && (
                        <Button
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          onClick={() => handleDelete(invoice.id!)}
                        >
                          Verwijderen
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IncomingInvoices;