import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  CheckCircle, 
  Download,
  Search,
  FileSpreadsheet,
  FileJson,
  FileText,
  ExternalLink
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ApprovedDataPage() {
  const [records, setRecords] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [sourceFilter]);

  const fetchData = async () => {
    try {
      const params = { status: 'validated' };
      if (sourceFilter !== 'all') params.carrier_id = sourceFilter;
      
      const [recordsRes, sourcesRes] = await Promise.all([
        axios.get(`${API}/records`, { params }),
        axios.get(`${API}/carriers`)
      ]);
      setRecords(recordsRes.data);
      setSources(sourcesRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const params = { format };
      if (sourceFilter !== 'all') params.carrier_id = sourceFilter;
      
      const response = await axios.get(`${API}/export/approved`, { params });
      
      if (format === 'csv') {
        // Download CSV
        const blob = new Blob([response.data.csv_content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `revbox-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${response.data.count} records to CSV`);
      } else if (format === 'json') {
        // Download JSON
        const blob = new Blob([JSON.stringify(response.data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `revbox-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${response.data.count} records to JSON`);
      } else if (format === 'zoho') {
        // Download Zoho-formatted JSON
        const blob = new Blob([JSON.stringify(response.data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zoho-import-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${response.data.count} records in Zoho format`);
      }
      
      setShowExportDialog(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const filteredRecords = records.filter(r => {
    if (!searchTerm) return true;
    const mapped = r.mapped_data || {};
    return Object.values(mapped).some(v => 
      v && String(v).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div data-testid="approved-data-page" className="min-h-screen">
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Approved Data</h1>
            <p className="text-sm text-slate-500 mt-1">Clean, validated data ready for export</p>
          </div>
          <Button onClick={() => setShowExportDialog(true)} className="btn-primary" data-testid="export-btn">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </header>

      <div className="p-8">
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search records..."
              className="pl-10"
              data-testid="search-input"
            />
          </div>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-48" data-testid="source-filter">
              <SelectValue placeholder="Data Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {sources.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="text-emerald-800 font-medium">{filteredRecords.length} approved records</span>
          </div>
          {filteredRecords.length > 0 && (
            <span className="text-sm text-emerald-600">Ready for export to CRM</span>
          )}
        </div>

        {/* Data Table */}
        {filteredRecords.length > 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-auto">
              <table className="w-full data-grid">
                <thead>
                  <tr>
                    <th>Agent / Broker</th>
                    <th>Code / ID</th>
                    <th>Type</th>
                    <th>State</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => {
                    const mapped = record.mapped_data || {};
                    return (
                      <tr key={record.id} data-testid={`approved-record-${record.id}`}>
                        <td className="font-medium text-slate-900">
                          {mapped.agent_name || mapped.broker_name || '-'}
                        </td>
                        <td className="font-mono text-xs">
                          {mapped.agent_code || mapped.broker_id || '-'}
                        </td>
                        <td>{mapped.policy_type || '-'}</td>
                        <td>{mapped.state || '-'}</td>
                        <td className="font-mono">
                          {(mapped.amount || mapped.premium) 
                            ? `$${parseFloat(mapped.amount || mapped.premium).toLocaleString()}`
                            : '-'}
                        </td>
                        <td className="text-xs text-slate-500">
                          {mapped.effective_date || '-'}
                        </td>
                        <td>
                          <Badge variant="outline" className="status-approved">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approved
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 text-sm text-slate-500">
              Showing {filteredRecords.length} of {records.length} records
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No approved data</h3>
            <p className="text-sm text-slate-500">
              {searchTerm ? 'No records match your search' : 'Approve records from the staging area'}
            </p>
          </div>
        )}
      </div>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Approved Data</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-500 mb-4">
              Choose an export format. {filteredRecords.length} records will be exported.
            </p>
            <div className="space-y-3">
              {/* CSV Export */}
              <button
                onClick={() => handleExport('csv')}
                disabled={exporting || filteredRecords.length === 0}
                className="w-full flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-left disabled:opacity-50"
                data-testid="export-csv-btn"
              >
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">CSV Format</p>
                  <p className="text-sm text-slate-500">Compatible with Excel, Google Sheets, most CRMs</p>
                </div>
              </button>

              {/* JSON Export */}
              <button
                onClick={() => handleExport('json')}
                disabled={exporting || filteredRecords.length === 0}
                className="w-full flex items-center gap-4 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-left disabled:opacity-50"
                data-testid="export-json-btn"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileJson className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">JSON Format</p>
                  <p className="text-sm text-slate-500">For API integrations and custom imports</p>
                </div>
              </button>

              {/* Zoho Export */}
              <button
                onClick={() => handleExport('zoho')}
                disabled={exporting || filteredRecords.length === 0}
                className="w-full flex items-center gap-4 p-4 border border-blue-200 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-left disabled:opacity-50"
                data-testid="export-zoho-btn"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <ExternalLink className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-blue-900">Zoho CRM Format</p>
                  <p className="text-sm text-blue-700">Pre-formatted for Zoho CRM import</p>
                </div>
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
