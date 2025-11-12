import React, { useState, useEffect } from 'react';
import { HardDrive, CheckCircle, AlertCircle, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { requestGoogleDriveAccessForSettings, saveGoogleDriveToken, getGoogleDriveToken } from '../services/googleDriveService';

const GoogleDriveSettings: React.FC = () => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const token = await getGoogleDriveToken(user.uid);
        setIsConnected(!!token);
      } catch (error) {
        console.error('Error checking connection:', error);
      } finally {
        setLoading(false);
      }
    };

    checkConnection();
  }, [user]);

  const handleConnect = async () => {
    if (!user) return;

    setConnecting(true);
    try {
      // Request access through Settings
      const token = await requestGoogleDriveAccessForSettings();

      // Save token to Firestore
      await saveGoogleDriveToken(user.uid, token, 3600); // 1 hour expiry

      setIsConnected(true);
      success('Verbonden!', 'Google Drive is succesvol gekoppeld');
    } catch (error) {
      console.error('Connection error:', error);
      showError('Verbinding mislukt', error instanceof Error ? error.message : 'Kon Google Drive niet verbinden');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;

    try {
      // TODO: Delete token from Firestore
      setIsConnected(false);
      success('Ontkoppeld', 'Google Drive verbinding verwijderd');
    } catch (error) {
      showError('Fout', 'Kon verbinding niet verwijderen');
    }
  };

  if (loading) {
    return <div>Laden...</div>;
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <HardDrive className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Google Drive Integratie</h3>
              <p className="mt-1 text-sm text-gray-500">
                {isConnected
                  ? 'Google Drive is verbonden. Alle facturen worden opgeslagen in je Drive.'
                  : 'Verbind Google Drive om facturen automatisch op te slaan.'}
              </p>
            </div>
          </div>

          {isConnected && (
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-600">Verbonden</span>
            </div>
          )}

          {!isConnected && (
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-600">Niet verbonden</span>
            </div>
          )}
        </div>

        <div className="mt-4 space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <strong>Mappenstructuur:</strong>
            <div className="mt-1 text-xs font-mono">
              Alloon/<br />
              └── Bedrijfsnaam/<br />
              &nbsp;&nbsp;&nbsp;&nbsp;├── Inkomende Facturen<br />
              &nbsp;&nbsp;&nbsp;&nbsp;├── Uitgaande Facturen<br />
              &nbsp;&nbsp;&nbsp;&nbsp;└── Exports
            </div>
          </div>

          <div className="flex space-x-2">
            {!isConnected ? (
              <Button
                onClick={handleConnect}
                disabled={connecting}
                icon={HardDrive}
                variant="primary"
              >
                {connecting ? 'Bezig met verbinden...' : 'Verbind Google Drive'}
              </Button>
            ) : (
              <Button
                onClick={handleDisconnect}
                icon={LogOut}
                variant="danger"
              >
                Ontkoppelen
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default GoogleDriveSettings;