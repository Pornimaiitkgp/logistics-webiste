// frontend/src/components/SummaryDashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function SummaryDashboard() {
  const { logout } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError("Authentication token not found. Please log in.");
          logout();
          navigate('/login');
          return;
        }

        const response = await axios.get(`${BACKEND_URL}/summary`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setSummary(response.data);
      } catch (err) {
        console.error("Error fetching summary:", err);
        if (err.response && err.response.status === 401) {
          setError("Session expired or unauthorized. Please log in again.");
          logout();
          navigate('/login');
        } else {
          setError(err.response?.data?.message || "An unexpected error occurred while fetching summary.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [logout, navigate]);

  if (loading) {
    return <div className="app-container">Loading summary data...</div>;
  }

  if (error) {
    return <div className="app-container error-message">Error: {error}</div>;
  }

  if (!summary) {
    return <div className="app-container"><p>No summary data available.</p></div>;
  }

  return (
    <div className="app-container">
      <div className="header">
        <h1>Summary Dashboard</h1>
        <div>
          <button onClick={() => navigate('/dashboard')} className="history-button">Go to Dashboard</button>
          <button onClick={() => navigate('/history')} className="history-button" style={{ marginLeft: '10px' }}>View History</button>
          <button onClick={logout} className="logout-button" style={{ marginLeft: '10px' }}>Logout</button>
        </div>
      </div>

      <div className="summary-cards-container">
        <div className="summary-card">
          <h3>Total Calculations</h3>
          <p>{summary.totalCalculations}</p>
        </div>
        <div className="summary-card">
          <h3>Backward Movements</h3>
          <p>{summary.backwardMovements} ({summary.percentageBackward}%)</p>
        </div>
        <div className="summary-card">
          <h3>Forward Movements</h3>
          <p>{summary.forwardMovements} ({summary.percentageForward}%)</p>
        </div>
        <div className="summary-card">
          <h3>Avg. Backward Angle</h3>
          <p>{summary.averageBackwardAngle}°</p>
        </div>
        <div className="summary-card">
          <h3>Avg. Forward Angle</h3>
          <p>{summary.averageForwardAngle}°</p>
        </div>
      </div>

      {summary.totalCalculations === 0 && (
        <p className="no-results">Upload CSV files on the Dashboard to generate summary data.</p>
      )}
    </div>
  );
}

export default SummaryDashboard;
