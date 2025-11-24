import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Scan, Keyboard } from 'lucide-react';
import Quagga from 'quagga';
import './BarcodeScanner.css';

const BarcodeScanner = ({ onScan, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [error, setError] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    if (scanning && !manualMode) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, [scanning, manualMode]);

  const startScanner = () => {
    Quagga.init(
      {
        inputStream: {
          name: 'Live',
          type: 'LiveStream',
          target: scannerRef.current,
          constraints: {
            width: 640,
            height: 480,
            facingMode: 'environment'
          }
        },
        decoder: {
          readers: [
            'code_128_reader',
            'ean_reader',
            'ean_8_reader',
            'code_39_reader',
            'code_39_vin_reader',
            'codabar_reader',
            'upc_reader',
            'upc_e_reader',
            'i2of5_reader'
          ]
        },
        locate: true
      },
      (err) => {
        if (err) {
          console.error('Barcode scanner error:', err);
          setError('Failed to start camera. Please check permissions.');
          setScanning(false);
          return;
        }
        Quagga.start();
      }
    );

    Quagga.onDetected(handleDetected);
  };

  const stopScanner = () => {
    if (Quagga) {
      Quagga.stop();
      Quagga.offDetected(handleDetected);
    }
  };

  const handleDetected = (result) => {
    if (result && result.codeResult && result.codeResult.code) {
      const code = result.codeResult.code;
      
      // Play beep sound
      playBeep();
      
      // Stop scanner
      stopScanner();
      setScanning(false);
      
      // Call onScan callback
      if (onScan) {
        onScan(code);
      }
    }
  };

  const playBeep = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      playBeep();
      if (onScan) {
        onScan(manualBarcode.trim());
      }
      setManualBarcode('');
    }
  };

  const toggleMode = () => {
    if (scanning) {
      stopScanner();
      setScanning(false);
    }
    setManualMode(!manualMode);
    setError('');
  };

  return (
    <div className="barcode-scanner-overlay">
      <div className="barcode-scanner-modal">
        <div className="scanner-header">
          <h3>
            <Scan size={24} />
            Scan Barcode / ဘားကုဒ်စကင်န်ဖတ်ရန်
          </h3>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="scanner-mode-toggle">
          <button
            className={`mode-btn ${!manualMode ? 'active' : ''}`}
            onClick={() => !manualMode || toggleMode()}
          >
            <Camera size={18} />
            Camera
          </button>
          <button
            className={`mode-btn ${manualMode ? 'active' : ''}`}
            onClick={() => manualMode || toggleMode()}
          >
            <Keyboard size={18} />
            Manual
          </button>
        </div>

        {error && (
          <div className="scanner-error">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {!manualMode ? (
          <div className="scanner-camera">
            {!scanning ? (
              <div className="scanner-start">
                <Camera size={64} color="#3b82f6" />
                <p>Click to start scanning</p>
                <p className="scanner-hint">ကင်မရာဖွင့်ရန်</p>
                <button
                  className="btn-primary"
                  onClick={() => setScanning(true)}
                >
                  <Camera size={20} />
                  Start Camera
                </button>
              </div>
            ) : (
              <div className="scanner-viewport">
                <div ref={scannerRef} className="scanner-video"></div>
                <div className="scanner-overlay">
                  <div className="scanner-frame"></div>
                  <p>Position barcode within frame</p>
                </div>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    stopScanner();
                    setScanning(false);
                  }}
                >
                  Stop Camera
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="scanner-manual">
            <form onSubmit={handleManualSubmit}>
              <div className="manual-input-group">
                <label>Enter Barcode Number</label>
                <input
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="Enter barcode or SKU"
                  autoFocus
                />
              </div>
              <button type="submit" className="btn-primary" disabled={!manualBarcode.trim()}>
                <Scan size={20} />
                Search Product
              </button>
            </form>
          </div>
        )}

        <div className="scanner-instructions">
          <h4>Instructions:</h4>
          <ul>
            <li>📷 Use camera to scan barcode automatically</li>
            <li>⌨️ Or enter barcode manually</li>
            <li>🔊 You'll hear a beep when scanned</li>
            <li>✅ Product will be added to cart</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
