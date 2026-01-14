import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
  Database, 
  Inbox,
  AlertTriangle, 
  CheckCircle,
  ArrowRight,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StatCard = ({ icon: Icon, value, label, color, link, badge }) => (
  <Link to={link} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 block" data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        <p className="text-sm text-slate-500 mt-1">{label}</p>
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
    {badge && (
      <div className="mt-3">
        <Badge variant="outline" className={badge.class}>{badge.text}</Badge>
      </div>
    )}
  </Link>
);

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentUploads, setRecentUploads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dashRes, uploadsRes] = await Promise.all([
        axios.get(`${API}/dashboard`),
        axios.get(`${API}/uploads`)
      ]);
      setStats(dashRes.data);
      setRecentUploads(uploadsRes.data.slice(0, 5));
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

  const stagingCount = stats?.pending_reviews || 0;
  const conflictCount = stats?.total_conflicts || 0;

  return (
    <div data-testid="dashboard-page" className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Data management overview</p>
      </header>

      <div className="p-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon={Database} 
            value={stats?.total_carriers || 0} 
            label="Data Sources" 
            color="bg-slate-800"
            link="/sources"
          />
          <StatCard 
            icon={Inbox} 
            value={stagingCount} 
            label="In Staging" 
            color="bg-blue-600"
            link="/staging"
            badge={stagingCount > 0 ? { text: 'Needs Review', class: 'status-staging' } : null}
          />
          <StatCard 
            icon={AlertTriangle} 
            value={conflictCount} 
            label="Conflicts" 
            color="bg-red-500"
            link="/conflicts"
            badge={conflictCount > 0 ? { text: 'Action Required', class: 'status-conflict' } : null}
          />
          <StatCard 
            icon={CheckCircle} 
            value={stats?.total_uploads || 0} 
            label="Approved Records" 
            color="bg-emerald-600"
            link="/approved"
          />
        </div>

        {/* Quick Actions + Recent Uploads */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link 
                to="/sources" 
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                data-testid="quick-upload-btn"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Upload Data</p>
                  <p className="text-xs text-slate-500">Import new data file</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>

              {conflictCount > 0 && (
                <Link 
                  to="/conflicts" 
                  className="flex items-center gap-3 p-3 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                  data-testid="quick-conflicts-btn"
                >
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">Resolve Conflicts</p>
                    <p className="text-xs text-red-600">{conflictCount} conflicts need attention</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
              )}

              <Link 
                to="/linking" 
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Link Tables</p>
                  <p className="text-xs text-slate-500">Combine data by key fields</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Recent Uploads */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Recent Uploads</h2>
              <Link to="/staging" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {recentUploads.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentUploads.map((upload) => (
                  <div key={upload.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        <FileSpreadsheet className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{upload.filename}</p>
                        <p className="text-xs text-slate-500">{upload.carrier_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">{upload.total_records} records</p>
                      <Badge variant="outline" className={
                        upload.status === 'completed' ? 'status-staging' :
                        upload.status === 'error' ? 'status-conflict' : 'status-staging'
                      }>
                        {upload.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <Upload className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No uploads yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
