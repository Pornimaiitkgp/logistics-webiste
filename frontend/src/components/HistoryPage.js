// frontend/src/components/HistoryPage.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Import useAuth hook
import { useNavigate } from 'react-router-dom'; // For navigation

// Define the base URL for the backend API from environment variables.
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function HistoryPage() {
  const { logout } = useAuth(); // Get logout function
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError("Authentication token not found. Please log in.");
          logout();
          navigate('/login');
          return;
        }

        const response = await axios.get(`${BACKEND_URL}/history`, {
          headers: {
            'Authorization': `Bearer ${token}` // Include the JWT token
          }
        });
        setHistory(response.data);
      } catch (err) {
        console.error("Error fetching history:", err);
        if (err.response && err.response.status === 401) {
          setError("Session expired or unauthorized. Please log in again.");
          logout();
          navigate('/login');
        } else {
          setError(err.response?.data?.message || "An unexpected error occurred while fetching history.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [logout, navigate]); // Depend on logout and navigate to avoid stale closures

  if (loading) {
    return <div className="app-container">Loading history...</div>;
  }

  if (error) {
    return <div className="app-container error-message">Error: {error}</div>;
  }

  return (
    <div className="app-container">
      <div className="header">
        <h1>Calculation History</h1>
        <button onClick={() => navigate('/dashboard')} className="logout-button">Go to Dashboard</button>
      </div>

      {history.length === 0 ? (
        <p className="no-results">No past calculations found. Upload a CSV on the dashboard to see history here!</p>
      ) : (
        <div className="results-table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
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
              {history.map((item, index) => (
                <tr key={item._id || index}> {/* Use _id if available, otherwise index */}
                  <td>{index + 1}</td>
                  <td>{new Date(item.calculatedAt).toLocaleString()}</td> {/* Format date */}
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
      )}
    </div>
  );
}

export default HistoryPage;
