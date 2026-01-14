import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Upload, 
  AlertTriangle, 
  DollarSign,
  ClipboardCheck,
  ArrowRight,
  FileText
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StatCard = ({ icon: Icon, value, label, color, link }) => (
  <Link to={link} className="metric-card block" data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="metric-value">{value}</p>
        <p className="metric-label">{label}</p>
      </div>
      <div className={`w-10 h-10 rounded-md flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </Link>
);

const StatusBadge = ({ status }) => {
  const statusClasses = {
    pending: 'status-pending',
    completed: 'status-completed',
    conflict: 'status-conflict',
    validated: 'status-validated',
    processing: 'status-processing',
    error: 'status-error'
  };

  return (
    <Badge variant="outline" className={`${statusClasses[status] || 'status-pending'} text-xs font-medium`}>
      {status}
    </Badge>
  );
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get(`${API}/dashboard`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div data-testid="dashboard-page">
      {/* Header */}
      <header className="page-header">
        <h1 className="font-heading font-bold text-2xl tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of your payout management system</p>
      </header>

      <div className="p-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard 
            icon={Building2} 
            value={stats?.total_carriers || 0} 
            label="Carriers" 
            color="bg-slate-900"
            link="/carriers"
          />
          <StatCard 
            icon={Users} 
            value={stats?.total_agents || 0} 
            label="Agents" 
            color="bg-blue-600"
            link="/agents"
          />
          <StatCard 
            icon={Upload} 
            value={stats?.total_uploads || 0} 
            label="Uploads" 
            color="bg-indigo-600"
            link="/upload"
          />
          <StatCard 
            icon={ClipboardCheck} 
            value={stats?.pending_reviews || 0} 
            label="Pending Review" 
            color="bg-amber-500"
            link="/review"
          />
          <StatCard 
            icon={AlertTriangle} 
            value={stats?.total_conflicts || 0} 
            label="Conflicts" 
            color="bg-red-500"
            link="/conflicts"
          />
          <StatCard 
            icon={DollarSign} 
            value={`$${(stats?.total_payouts || 0).toLocaleString()}`} 
            label="Total Payouts" 
            color="bg-emerald-600"
            link="/payouts"
          />
        </div>

        {/* Recent Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Uploads */}
          <div className="data-table-container">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-heading font-semibold text-slate-900">Recent Uploads</h2>
              <Link to="/upload" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {stats?.recent_uploads?.length > 0 ? (
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Carrier</th>
                    <th>Records</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_uploads.map((upload) => (
                    <tr key={upload.id}>
                      <td className="font-mono text-xs">{upload.filename}</td>
                      <td>{upload.carrier_name}</td>
                      <td>{upload.total_records}</td>
                      <td><StatusBadge status={upload.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <FileText className="empty-state-icon" />
                <p className="empty-state-title">No uploads yet</p>
                <p className="empty-state-description">Upload carrier reports to get started</p>
              </div>
            )}
          </div>

          {/* Pending Conflicts */}
          <div className="data-table-container">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-heading font-semibold text-slate-900">Pending Conflicts</h2>
              <Link to="/conflicts" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {stats?.recent_conflicts?.length > 0 ? (
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Field</th>
                    <th>Current</th>
                    <th>New</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_conflicts.map((conflict) => (
                    <tr key={conflict.id}>
                      <td>
                        <Badge variant="outline" className="status-conflict text-xs">
                          {conflict.conflict_type}
                        </Badge>
                      </td>
                      <td className="font-mono text-xs">{conflict.field_name || '-'}</td>
                      <td className="font-mono text-xs truncate max-w-[100px]">
                        {conflict.current_value !== null ? String(conflict.current_value) : '-'}
                      </td>
                      <td className="font-mono text-xs truncate max-w-[100px]">
                        {conflict.new_value !== null ? String(conflict.new_value) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <AlertTriangle className="empty-state-icon" />
                <p className="empty-state-title">No conflicts</p>
                <p className="empty-state-description">All data is consistent</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-4">
          <Link to="/upload" className="btn-primary flex items-center gap-2" data-testid="quick-upload-btn">
            <Upload className="w-4 h-4" />
            Upload Report
          </Link>
          <Link to="/carriers" className="btn-secondary flex items-center gap-2" data-testid="quick-carrier-btn">
            <Building2 className="w-4 h-4" />
            Add Carrier
          </Link>
          <Link to="/agents" className="btn-secondary flex items-center gap-2" data-testid="quick-agent-btn">
            <Users className="w-4 h-4" />
            Add Agent
          </Link>
        </div>
      </div>
    </div>
  );
}
