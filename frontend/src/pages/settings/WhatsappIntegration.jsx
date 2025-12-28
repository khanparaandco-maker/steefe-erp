import { useState, useEffect, useRef } from 'react';
import { Save, TestTube, ArrowLeft, MessageCircle, QrCode, Check, X, Loader, LogOut, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../../utils/helpers';
import axios from 'axios';

import { API_BASE_URL } from '../../utils/constants';

const API_URL = `${API_BASE_URL}/api`;

const WhatsappIntegration = () => {
  const navigate = useNavigate();
  const eventSourceRef = useRef(null);
  
  const [status, setStatus] = useState({
    isReady: false,
    hasQR: false,
    isInitialized: false
  });

  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    fetchStatus();
    
    // Setup SSE connection for real-time updates
    const eventSource = new EventSource(`${API_URL}/whatsapp/events`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WhatsApp event:', data);

        switch (data.type) {
          case 'status':
            setStatus(data.data);
            break;
          
          case 'qr':
            setQrCode(data.data.qrImageUrl);
            setStatus(prev => ({ ...prev, hasQR: true }));
            break;
          
          case 'authenticated':
            showToast('WhatsApp authenticated successfully!', 'success');
            setQrCode(null);
            break;
          
          case 'ready':
            showToast('WhatsApp is ready to send messages!', 'success');
            setStatus(prev => ({ ...prev, isReady: true, hasQR: false }));
            setQrCode(null);
            break;
          
          case 'disconnected':
            showToast('WhatsApp disconnected: ' + data.data.reason, 'error');
            setStatus(prev => ({ ...prev, isReady: false }));
            setQrCode(null);
            break;
          
          case 'auth_failure':
            showToast('Authentication failed: ' + data.data.message, 'error');
            setStatus(prev => ({ ...prev, isReady: false }));
            setQrCode(null);
            break;
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/whatsapp/status`);
      setStatus(response.data);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const handleInitialize = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/whatsapp/initialize`);
      showToast(response.data.message, 'success');
      setStatus(response.data.status);
    } catch (error) {
      console.error('Error initializing WhatsApp:', error);
      showToast(error.response?.data?.message || 'Failed to initialize WhatsApp', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await axios.post(`${API_URL}/whatsapp/logout`);
      showToast('Logged out successfully', 'success');
      setStatus({ isReady: false, hasQR: false, isInitialized: true });
      setQrCode(null);
    } catch (error) {
      console.error('Error logging out:', error);
      showToast(error.response?.data?.message || 'Failed to logout', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async () => {
    if (!testPhone) {
      showToast('Please enter a phone number', 'error');
      return;
    }

    try {
      setSendingTest(true);
      const response = await axios.post(`${API_URL}/whatsapp/test`, {
        phoneNumber: testPhone
      });
      showToast('Test message sent successfully!', 'success');
      setTestPhone('');
    } catch (error) {
      console.error('Error sending test message:', error);
      showToast(error.response?.data?.message || 'Failed to send test message', 'error');
    } finally {
      setSendingTest(false);
    }
  };

  const handleSendCustomMessage = async () => {
    if (!testPhone || !testMessage) {
      showToast('Please enter phone number and message', 'error');
      return;
    }

    try {
      setSendingTest(true);
      const response = await axios.post(`${API_URL}/whatsapp/send-message`, {
        phoneNumber: testPhone,
        message: testMessage
      });
      showToast('Message sent successfully!', 'success');
      setTestPhone('');
      setTestMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      showToast(error.response?.data?.message || 'Failed to send message', 'error');
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="p-6">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Back to Dashboard</span>
      </button>

      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-green-100 rounded-lg">
          <MessageCircle className="text-green-600" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">WhatsApp Web Integration</h2>
          <p className="text-sm text-gray-500">Connect your WhatsApp to send automated messages</p>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection Status</h3>
        
        <div className="space-y-3">
          {/* Initialized Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Client Initialized</span>
            {status.isInitialized ? (
              <Check className="text-green-500" size={20} />
            ) : (
              <X className="text-red-500" size={20} />
            )}
          </div>

          {/* Ready Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">WhatsApp Ready</span>
            {status.isReady ? (
              <Check className="text-green-500" size={20} />
            ) : (
              <X className="text-red-500" size={20} />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-3">
          {!status.isInitialized && (
            <button
              onClick={handleInitialize}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? <Loader className="animate-spin" size={18} /> : <RefreshCw size={18} />}
              {loading ? 'Initializing...' : 'Initialize WhatsApp'}
            </button>
          )}

          {status.isReady && (
            <button
              onClick={handleLogout}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
            >
              <LogOut size={18} />
              Logout
            </button>
          )}
        </div>
      </div>

      {/* QR Code Display */}
      {qrCode && !status.isReady && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <QrCode className="text-blue-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Scan QR Code</h3>
          </div>
          
          <div className="text-center">
            <img 
              src={qrCode} 
              alt="WhatsApp QR Code" 
              className="mx-auto border-4 border-gray-200 rounded-lg"
              style={{ maxWidth: '300px' }}
            />
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900 mb-2">How to connect:</p>
              <ol className="text-sm text-gray-600 text-left space-y-1 list-decimal list-inside">
                <li>Open WhatsApp on your phone</li>
                <li>Tap Menu (⋮) or Settings</li>
                <li>Tap "Linked Devices"</li>
                <li>Tap "Link a Device"</li>
                <li>Scan this QR code with your phone</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Test Message Section */}
      {status.isReady && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Test Message</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="919876543210 (with country code)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Include country code without + (e.g., 919876543210 for India)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Message (Optional)
              </label>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your custom message here..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSendTest}
                disabled={sendingTest || !testPhone}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {sendingTest ? <Loader className="animate-spin" size={18} /> : <TestTube size={18} />}
                {sendingTest ? 'Sending...' : 'Send Test Message'}
              </button>

              {testMessage && (
                <button
                  onClick={handleSendCustomMessage}
                  disabled={sendingTest || !testPhone}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {sendingTest ? <Loader className="animate-spin" size={18} /> : <MessageCircle size={18} />}
                  Send Custom Message
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Integration Features */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Features</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Automatically send order confirmations to customers
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Send proforma invoices with payment details
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Send dispatch notifications with transporter details
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Uses your personal WhatsApp account (no API costs)
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Session persistence - stays logged in after restart
          </li>
        </ul>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="text-sm font-semibold text-yellow-800 mb-2">Important Notes:</h4>
        <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
          <li>You can use your personal or business WhatsApp account</li>
          <li>Your phone must have internet connection</li>
          <li>Session will be saved and persist after server restart</li>
          <li>If you logout from WhatsApp Web, you'll need to scan QR again</li>
          <li>Free to use - no API costs or subscriptions required</li>
        </ul>
      </div>
    </div>
  );
};

export default WhatsappIntegration;
