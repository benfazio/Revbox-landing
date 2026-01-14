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
  CheckCircle, 
  Download,
  Search,
  FileSpreadsheet
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ApprovedDataPage() {
  const [records, setRecords] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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

  const exportToCSV = () => {
    if (records.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Get all unique keys from mapped_data
    const allKeys = new Set();
    records.forEach(r => {
      Object.keys(r.mapped_data || {}).forEach(k => {
        if (!k.startsWith('_')) allKeys.add(k);
      });
    });
    const headers = Array.from(allKeys);

    // Build CSV
    const csvRows = [headers.join(',')];
    records.forEach(r => {
      const row = headers.map(h => {
        const val = r.mapped_data?.[h];
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(',') ? `"${str}"` : str;
      });
      csvRows.push(row.join(','));
    });

    // Download
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `approved-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported');
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
            <p className="text-sm text-slate-500 mt-1">Data that has been reviewed and approved</p>
          </div>
          <Button onClick={exportToCSV} className="btn-primary" data-testid="export-btn">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
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
    </div>
  );
}
