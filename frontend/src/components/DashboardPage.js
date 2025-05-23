// frontend/src/components/DashboardPage.js
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = "https://logistics-web-backend.onrender.com"

function DashboardPage() {
  const { user, logout } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setResults([]);
    setError(null);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      setError("Please select a file to upload.");
      return;
    }

    setResults([]);
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('datafile', selectedFile);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Authentication token not found. Please log in.");
        logout();
        navigate('/login');
        return;
      }

      const response = await axios.post(`${BACKEND_URL}/upload-and-calculate`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });
      setResults(response.data);
    } catch (err) {
      console.error("Error uploading file or calculating movement:", err);
      if (err.response) {
        setError(err.response.data?.message || `Server error: ${err.response.status}`);
        if (err.response.status === 401) {
          logout();
          navigate('/login');
        }
      } else if (err.request) {
        setError("Network error: No response from server. Is the backend running?");
      } else {
        setError("An unexpected error occurred during file processing.");
      }
    } finally {
      setLoading(false);
    }
  };

  // NEW: Function to export results to CSV
  const exportResultsToCsv = () => {
    if (results.length === 0) {
      setError("No results to export.");
      return;
    }

    // Define CSV headers
    const headers = [
      '#', 'Plant Lat', 'Plant Lon', 'Warehouse Lat', 'Warehouse Lon', 'City Lat', 'City Lon',
      'Angle (deg)', 'Backward Movement', 'Dist PW (km)', 'Dist WC (km)', 'Dist PC (km)'
    ];

    // Map results data to CSV rows
    const csvRows = results.map((item, index) => [
      index + 1,
      item.plant.lat.toFixed(4),
      item.plant.lon.toFixed(4),
      item.warehouse.lat.toFixed(4),
      item.warehouse.lon.toFixed(4),
      item.city.lat.toFixed(4),
      item.city.lon.toFixed(4),
      item.angleDegrees.toFixed(2),
      item.isBackwardMovement ? 'YES' : 'NO',
      item.distancePlantWarehouseKm.toFixed(2),
      item.distanceWarehouseCityKm.toFixed(2),
      item.distancePlantCityKm.toFixed(2),
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    // Create a Blob and a download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) { // Feature detection for download attribute
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'logistics_results.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Fallback for browsers that don't support the download attribute
      alert('Your browser does not support automatic file downloads. Please copy the data manually.');
      // You could also open a new window with the CSV content here
    }
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>Logistics Backward Movement Identifier</h1>
        {user && user.username && <p>Welcome, {user.username}!</p>}
        <div>
          <button onClick={() => navigate('/history')} className="history-button" style={{ marginLeft: '10px' }}>View History</button>
          <button onClick={logout} className="logout-button" style={{ marginLeft: '10px' }}>Logout</button>
        </div>
      </div>

      <form onSubmit={handleFileUpload} className="file-upload-form">
        <h2>Upload Data File (CSV)</h2>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="file-input"
          required
        />
        <button type="submit" disabled={loading || !selectedFile}>
          {loading ? 'Processing...' : 'Upload & Analyze Data'}
        </button>
      </form>

      {error && <p className="error-message">Error: {error}</p>}

      {results.length > 0 && (
        <div className="results-container">
          <h2>Calculation Results:</h2>
          <div className="results-table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Plant Lat/Lon</th>
                  <th>Warehouse Lat/Lon</th>
                  <th>City Lat/Lon</th>
                  <th>Angle (deg)</th>
                  <th>Backward Movement</th>
                  <th>Dist PW (km)</th>
                  <th>Dist WC (km)</th>
                  <th>Dist PC (km)</th>
                </tr>
              </thead>
              <tbody>
                {results.map((item, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{item.plant.lat.toFixed(4)}, {item.plant.lon.toFixed(4)}</td>
                    <td>{item.warehouse.lat.toFixed(4)}, {item.warehouse.lon.toFixed(4)}</td>
                    <td>{item.city.lat.toFixed(4)}, {item.city.lon.toFixed(4)}</td>
                    <td>{item.angleDegrees.toFixed(2)}</td>
                    <td className={item.isBackwardMovement ? 'backward' : 'forward'}>
                      {item.isBackwardMovement ? 'YES' : 'NO'}
                    </td>
                    <td>{item.distancePlantWarehouseKm.toFixed(2)}</td>
                    <td>{item.distanceWarehouseCityKm.toFixed(2)}</td>
                    <td>{item.distancePlantCityKm.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={exportResultsToCsv} className="export-button" disabled={results.length === 0}>
            Export Results to CSV
          </button>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
