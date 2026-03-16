"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip-glass">
        <p className="m-0 neon-text-blue fw-bold" style={{fontSize: '0.9rem'}}>ID: {data.id}</p>
        <p className="m-0 text-white small">Name: {data.name}</p>
        <p className="m-0 neon-text-blue fw-bold">Speed: {data.speed.toFixed(2)} WPM</p>
        <p className="m-0 opacity-50 mt-1" style={{fontSize: '0.7rem'}}>{data.date}</p>
      </div>
    );
  }
  return null;
};

export default function TypingDashboard() {
  const [allData, setAllData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); 
  const itemsPerPage = 10;

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    let tempCombinedData = [];
    let filesProcessed = 0;

    files.forEach((file) => {
      const reader = new FileReader();
      const dateLabel = file.name.split('.')[0];
      reader.onload = (evt) => {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const processed = data.slice(1).map((row) => ({
          id: row[0]?.toString() || "N/A",
          name: row[1]?.toString() || "N/A",
          speed: parseFloat(row[3]) || 0,
          date: dateLabel
        })).filter(item => item.id !== "N/A");
        tempCombinedData = [...tempCombinedData, ...processed];
        filesProcessed++;
        if (filesProcessed === files.length) {
          setAllData(tempCombinedData);
          setCurrentPage(1);
        }
      };
      reader.readAsBinaryString(file);
    });
  };

  // SEARCH LOGIC: Number (ID) aur Name dono ke liye
  const filteredData = useMemo(() => {
    return allData.filter(item => 
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allData, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const avgSpeed = filteredData.length > 0 ? (filteredData.reduce((a, b) => a + b.speed, 0) / filteredData.length).toFixed(1) : 0;

  return (
    <div className="dashboard-wrapper">
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}

      <button className="mobile-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
        {isSidebarOpen ? "✕" : "☰"}
      </button>

      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="mb-5 px-2">
          <h4 className="neon-text-blue">STUDENT <span className="text-white">DASHBOARD</span></h4>
          <p className="small opacity-50 m-0">Admin Panel</p>
        </div>
        <nav>
          <button 
            className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}
          >
            Overview
          </button>
          <button 
            className={`nav-btn ${activeTab === 'performance' ? 'active' : ''}`}
            onClick={() => { setActiveTab('performance'); setIsSidebarOpen(false); }}
          >
            Performance
          </button>
        </nav>
      </div>

      <div className="main-content">
        <div className="top-bar-glass neon-border-blue">
          <h2 className="fw-bold m-0 dashboard-title">
            {activeTab === 'overview' ? 'Dashboard' : 'Performance'} <span className="neon-text-pink">Analytics</span>
          </h2>
          <div className="d-flex gap-3 align-items-center top-controls">
            {/* Search Input hamesha dikhega (Responsive support niche CSS mein hai) */}
            <input 
              className="glass-input search-bar" 
              placeholder="Search ID or Name..." 
              value={searchQuery}
              onChange={(e) => {setSearchQuery(e.target.value); setCurrentPage(1);}} 
            />
            <button className="btn neon-btn-blue text-white px-4 fw-bold" onClick={() => document.getElementById('fileInp').click()}>Upload</button>
            <input type="file" multiple id="fileInp" hidden onChange={handleFileUpload} />
          </div>
        </div>

        {/* 1. Stats Cards - Hide on Performance */}
        {activeTab === 'overview' && (
          <div className="row g-3 mb-4 animate-fade-in">
            <div className="col-lg-4 col-sm-6">
              <div className="glass-card neon-border-blue">
                <small className="stat-heading">STUDENTS</small>
                <h1 className="stat-value neon-text-blue">{filteredData.length}</h1>
              </div>
            </div>
            <div className="col-lg-4 col-sm-6">
              <div className="glass-card neon-border-blue">
                <small className="stat-heading">AVG. SPEED</small>
                <h1 className="stat-value neon-text-blue">{avgSpeed} <small style={{fontSize: '1rem'}}>WPM</small></h1>
              </div>
            </div>
            <div className="col-lg-4 col-12">
              <div className="glass-card neon-border-blue">
                <small className="stat-heading">SERVER STATUS</small>
                <h1 className="stat-value neon-text-blue">ONLINE</h1>
              </div>
            </div>
          </div>
        )}

        {/* 2. Graph Section - Always Visible */}
        <div className="glass-card mb-4 neon-border-blue">
          <h5 className="fw-bold mb-4 opacity-75">Performance Wave</h5>
          <div style={{ width: '100%', height: activeTab === 'performance' ? '450px' : '320px', transition: '0.3s' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData.slice(-30)} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="neonGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,242,255,0.05)" />
                <XAxis dataKey="id" hide />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} shared={false} trigger="hover" />
                <Area 
                  type="monotone" 
                  dataKey="speed" 
                  stroke="#00f2ff" 
                  strokeWidth={3} 
                  fill="url(#neonGrad)" 
                  dot={{ r: 4, fill: '#00f2ff', strokeWidth: 2, stroke: '#0a0e17' }}
                  activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2, fill: '#00f2ff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Table Section - Hide on Performance */}
        {activeTab === 'overview' && (
          <div className="glass-card p-0 overflow-hidden neon-border-blue animate-fade-in">
            <div className="table-responsive">
              <table className="table table-dark table-hover m-0">
                <thead>
                  <tr className="small opacity-50" style={{borderBottom: '1px solid rgba(0,242,255,0.1)'}}>
                    <th className="ps-4 py-3">ID</th>
                    <th>NAME</th>
                    <th>SPEED</th>
                    <th className="pe-4 text-end">RANK</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((row, i) => (
                    <tr key={i} style={{borderBottom: '1px solid rgba(255,255,255,0.02)'}}>
                      <td className="text-white-50" data-label="NAME">{row.name}</td>
                      <td className="ps-4 py-3 fw-bold neon-text-blue" data-label="ID">{row.id}</td>
                      <td className="text-white" data-label="SPEED">{row.speed.toFixed(1)} WPM</td>
                      <td className="pe-4 text-end" data-label="RANK">
                        <span className={`badge-neon ${row.speed > 40 ? 'elite' : 'rising'}`}>
                          {row.speed > 40 ? 'ELITE' : 'RISING'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination-glass d-flex justify-content-between align-items-center px-3 py-4">
              <div className="small text-white-50 d-none d-sm-block">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length}
              </div>
              
              <div className="d-flex align-items-center gap-3 ms-auto">
                <button className="pg-nav-simple" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</button>
                <span className="text-white small fw-bold">Page <span className="neon-text-blue">{currentPage}</span> of {totalPages || 1}</span>
                <button className="pg-nav-simple" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}