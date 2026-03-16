"use client";

import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip-glass">
        <p className="m-0 neon-text-blue fw-bold" style={{fontSize: '0.9rem'}}>ID: {data.id}</p>
        <p className="m-0 text-white small">{data.studentName}</p>
        <p className="m-0 neon-text-blue fw-bold">{data.speed} WPM</p>
      </div>
    );
  }
  return null;
};

export default function StudentDashboard() {
  const [allData, setAllData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('overview'); 
  const [isSidebarOpen, setSidebarOpen] = useState(false); // Mobile Sidebar State
  const itemsPerPage = 10;

  // Time Formatter logic
  const formatExcelTime = (val) => {
    if (!val || val === "-") return "-";
    if (typeof val === 'number') {
      const total_minutes = Math.round(val * 24 * 60);
      const hours = Math.floor(total_minutes / 60);
      const minutes = total_minutes % 60;
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    }
    return val.toString();
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    let tempCombinedData = [];
    let filesProcessed = 0;

    files.forEach((file) => {
      const reader = new FileReader();
      const fileNameLabel = file.name.split('.')[0];
      reader.onload = (evt) => {
        try {
          const bstr = evt.target.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

          const processed = data.slice(1).map((row) => {
            if (!row[2]) return null; 
            return {
              id: row[0]?.toString() || "N/A",           
              date: row[1]?.toString() || "N/A",         
              studentName: row[2]?.toString() || "N/A",  
              fatherName: row[3]?.toString() || "N/A",   
              course: row[4]?.toString() || "N/A",       
              timeIn: formatExcelTime(row[5]), 
              timeOut: formatExcelTime(row[6]), 
              speed: isNaN(parseFloat(row[7])) ? 0 : parseFloat(row[7]), 
              attendance: row[8]?.toString() || "-",     
              fees: row[9]?.toString() || "UNPAID",      
              fileName: fileNameLabel
            };
          }).filter(item => item !== null);
          tempCombinedData = [...tempCombinedData, ...processed];
        } catch (err) { console.error(err); }
        filesProcessed++;
        if (filesProcessed === files.length) setAllData(prev => [...prev, ...tempCombinedData]);
      };
      reader.readAsBinaryString(file);
    });
  };

  const filteredData = useMemo(() => {
    const s = searchQuery.toLowerCase().trim();
    return allData.filter(item => item.id?.toLowerCase().includes(s) || item.studentName?.toLowerCase().includes(s));
  }, [allData, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const avgSpeed = filteredData.length > 0 ? (filteredData.reduce((a, b) => a + b.speed, 0) / filteredData.length).toFixed(1) : "0.0";

  return (
    <div className="dashboard-wrapper">
      {/* Mobile Toggle Button */}
      <button className="mobile-toggle d-lg-none" onClick={() => setSidebarOpen(!isSidebarOpen)}>
        {isSidebarOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar with Mobile State */}
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="mb-5 px-2">
          <h4 className="neon-text-blue fw-bold">STUDENT <span className="text-white">DASHBOARD</span></h4>
          <p className="small opacity-50 m-0">Admin Panel</p>
        </div>
        <nav>
          <button className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => {setActiveTab('overview'); setSidebarOpen(false);}}>Overview</button>
          <button className={`nav-btn ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => {setActiveTab('performance'); setSidebarOpen(false);}}>Performance</button>
        </nav>
      </div>

      <div className="main-content">
        <div className="top-bar-glass neon-border-blue d-flex justify-content-between align-items-center mb-4 p-3">
          <h2 className="fw-bold m-0 dashboard-title">Dashboard <span className="neon-text-blue">Analytics</span></h2>
          <div className="d-flex gap-2 flex-wrap flex-md-nowrap align-items-center">
            <input className="glass-input search-bar" placeholder="Search ID or Name..." value={searchQuery} onChange={(e) => {setSearchQuery(e.target.value); setCurrentPage(1);}} />
            <button className="neon-btn-blue text-white px-4 py-2" onClick={() => document.getElementById('f').click()}>Upload</button>
            <input type="file" multiple id="f" hidden accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
          </div>
        </div>

        {activeTab === 'overview' && (
          <>
            <div className="row g-3 mb-4">
              <div className="col-12 col-md-4"><div className="glass-card stat-card"><small>STUDENTS</small><h1 className="neon-text-blue m-0">{filteredData.length}</h1></div></div>
              <div className="col-12 col-md-4"><div className="glass-card stat-card"><small>AVG. NET SPEED</small><h1 className="neon-text-blue m-0">{avgSpeed} <span className="small text-white" style={{fontSize:'0.8rem'}}>WPM</span></h1></div></div>
              <div className="col-12 col-md-4"><div className="glass-card stat-card"><small>STATUS</small><h1 className="neon-text-blue m-0">ONLINE</h1></div></div>
            </div>

            <div className="glass-card mb-4 neon-border-blue">
              <h5 className="fw-bold mb-4 opacity-75">Performance Wave</h5>
              <div style={{ width: '100%', height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredData.slice(-20)}>
                    <defs>
                      <linearGradient id="neonGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00f2ff" stopOpacity={0.4}/><stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,242,255,0.05)" />
                    <XAxis dataKey="studentName" hide />
                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="speed" stroke="#00f2ff" strokeWidth={3} fill="url(#neonGrad)" dot={{ r: 4, fill: '#00f2ff' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card p-0 overflow-hidden neon-border-blue">
              <div className="table-responsive">
                <table className="table table-dark m-0">
                  <thead>
                    <tr className="small opacity-50 text-uppercase">
                      <th className="ps-4">CBLA-ID</th>
                      <th>Student Name</th>
                      <th>Father Name</th>
                      <th>Timing In</th>
                      <th>Timing Out</th>
                      <th>Speed</th>
                      <th>Att</th>
                      <th className="pe-4">Fees</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((row, i) => (
                      <tr key={i} className="align-middle">
                        <td className="ps-4 fw-bold neon-text-blue" data-label="ID">{row.id}</td>
                        <td className="text-white" data-label="STUDENT">{row.studentName}</td>
                        <td className="text-white-50" data-label="FATHER">{row.fatherName}</td>
                        <td className="text-white-50" data-label="IN">{row.timeIn}</td>
                        <td className="text-white-50" data-label="OUT">{row.timeOut}</td>
                        <td className="text-white fw-bold" data-label="SPEED">{row.speed} WPM</td>
                        <td className="text-white-50" data-label="ATT">{row.attendance}</td>
                        <td className="pe-4" data-label="FEES">
                          <span className={`badge-neon ${row.fees.includes('UNPAID') ? 'unpaid' : 'paid'}`}>{row.fees}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination-glass d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 p-3 border-top border-secondary">
                <div className="small text-white-50">Showing {currentItems.length} records</div>
                <div className="d-flex align-items-center gap-3">
                  <button className="pg-nav-simple" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</button>
                  <span className="text-white small fw-bold">Page <span className="neon-text-blue">{currentPage}</span> of {totalPages || 1}</span>
                  <button className="pg-nav-simple" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}