import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
} from '@/components/ui/dialog';
import { 
  Inbox, 
  Check, 
  X, 
  Eye, 
  Trash2,
  AlertTriangle,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function StagingPage() {
  const [uploads, setUploads] = useState([]);
  const [records, setRecords] = useState([]);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUpload, setSelectedUpload] = useState(null);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [expandedUpload, setExpandedUpload] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedUpload) {
      fetchRecordsForUpload(selectedUpload);
    }
  }, [selectedUpload]);

  const fetchData = async () => {
    try {
      const [uploadsRes, sourcesRes] = await Promise.all([
        axios.get(`${API}/uploads`),
        axios.get(`${API}/carriers`)
      ]);
      setUploads(uploadsRes.data);
      setSources(sourcesRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecordsForUpload = async (uploadId) => {
    try {
      const response = await axios.get(`${API}/uploads/${uploadId}/records`);
      setRecords(response.data);
    } catch (error) {
      toast.error('Failed to fetch records');
    }
  };

  const handleDeleteUpload = async (uploadId) => {
    if (!window.confirm('Delete this upload and all its records? This cannot be undone.')) return;
    try {
      await axios.delete(`${API}/uploads/${uploadId}`);
      toast.success('Upload deleted successfully');
      fetchData();
      if (selectedUpload === uploadId) {
        setSelectedUpload(null);
        setRecords([]);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete upload');
    }
  };

  const handleApproveSelected = async () => {
    try {
      await Promise.all(selectedRecords.map(id => axios.put(`${API}/records/${id}/validate`)));
      toast.success(`Approved ${selectedRecords.length} records`);
      setSelectedRecords([]);
      if (selectedUpload) fetchRecordsForUpload(selectedUpload);
      fetchData();
    } catch (error) {
      toast.error('Failed to approve records');
    }
  };

  const handleRejectSelected = async () => {
    try {
      await Promise.all(selectedRecords.map(id => axios.put(`${API}/records/${id}/reject`)));
      toast.success(`Rejected ${selectedRecords.length} records`);
      setSelectedRecords([]);
      if (selectedUpload) fetchRecordsForUpload(selectedUpload);
      fetchData();
    } catch (error) {
      toast.error('Failed to reject records');
    }
  };

  const toggleSelect = (id) => {
    setSelectedRecords(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const stagingRecords = records.filter(r => r.status === 'pending' || r.status === 'conflict');
    if (selectedRecords.length === stagingRecords.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(stagingRecords.map(r => r.id));
    }
  };

  const filteredUploads = sourceFilter === 'all' 
    ? uploads 
    : uploads.filter(u => u.carrier_id === sourceFilter);

  const stagingRecords = records.filter(r => r.status === 'pending' || r.status === 'conflict');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div data-testid="staging-page" className="min-h-screen">
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Staging Area</h1>
            <p className="text-sm text-slate-500 mt-1">Review and approve uploaded data before moving to approved</p>
          </div>
          {selectedRecords.length > 0 && (
            <div className="flex gap-2">
              <Button onClick={handleRejectSelected} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                <X className="w-4 h-4 mr-2" />
                Reject ({selectedRecords.length})
              </Button>
              <Button onClick={handleApproveSelected} className="btn-primary">
                <Check className="w-4 h-4 mr-2" />
                Approve ({selectedRecords.length})
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Uploads List */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 text-sm">Uploads</h2>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {sources.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="divide-y divide-slate-100 max-h-[calc(100vh-300px)] overflow-auto">
              {filteredUploads.length > 0 ? filteredUploads.map((upload) => (
                <div 
                  key={upload.id}
                  className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                    selectedUpload === upload.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedUpload(upload.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileSpreadsheet className="w-8 h-8 text-slate-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">{upload.filename}</p>
                        <p className="text-xs text-slate-500">{upload.carrier_name}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteUpload(upload.id); }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      data-testid={`delete-upload-${upload.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {upload.total_records} records
                    </Badge>
                    {upload.conflict_count > 0 && (
                      <Badge variant="outline" className="status-conflict text-xs">
                        {upload.conflict_count} conflicts
                      </Badge>
                    )}
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center">
                  <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No uploads</p>
                </div>
              )}
            </div>
          </div>

          {/* Records Table */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 text-sm">
                {selectedUpload ? `Records (${stagingRecords.length} in staging)` : 'Select an upload'}
              </h2>
              {stagingRecords.length > 0 && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedRecords.length === stagingRecords.length && stagingRecords.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-xs text-slate-500">Select all</span>
                </div>
              )}
            </div>

            {selectedUpload && stagingRecords.length > 0 ? (
              <div className="overflow-auto max-h-[calc(100vh-300px)]">
                <table className="w-full data-grid">
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th className="w-12"></th>
                      <th>Agent</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stagingRecords.map((record) => {
                      const mapped = record.mapped_data || {};
                      const hasConflicts = record.conflicts?.length > 0;
                      return (
                        <tr 
                          key={record.id} 
                          className={hasConflicts ? 'bg-red-50/50' : ''}
                          data-testid={`staging-record-${record.id}`}
                        >
                          <td>
                            <Checkbox
                              checked={selectedRecords.includes(record.id)}
                              onCheckedChange={() => toggleSelect(record.id)}
                            />
                          </td>
                          <td>
                            <div>
                              <p className="font-medium text-slate-900">{mapped.agent_name || mapped.broker_name || '-'}</p>
                              <p className="text-xs text-slate-500">{mapped.agent_code || mapped.broker_id || '-'}</p>
                            </div>
                          </td>
                          <td>{mapped.policy_type || '-'}</td>
                          <td className="font-mono">
                            {mapped.amount || mapped.premium ? 
                              `$${parseFloat(mapped.amount || mapped.premium || 0).toLocaleString()}` : '-'}
                          </td>
                          <td>
                            {hasConflicts ? (
                              <Badge variant="outline" className="status-conflict">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                {record.conflicts.length} conflicts
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="status-staging">Pending</Badge>
                            )}
                          </td>
                          <td>
                            <button
                              onClick={() => setViewRecord(record)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-16 text-center">
                <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">
                  {selectedUpload ? 'No records in staging' : 'Select an upload to view records'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Record Detail Dialog */}
      <Dialog open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Record Details</DialogTitle>
          </DialogHeader>
          {viewRecord && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={viewRecord.status === 'conflict' ? 'status-conflict' : 'status-staging'}>
                  {viewRecord.status}
                </Badge>
                {viewRecord.conflicts?.length > 0 && (
                  <Badge variant="outline" className="status-conflict">
                    {viewRecord.conflicts.length} conflicts
                  </Badge>
                )}
              </div>

              {/* Mapped Data */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Mapped Fields</h3>
                <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-lg p-4">
                  {Object.entries(viewRecord.mapped_data || {})
                    .filter(([key]) => !key.startsWith('_'))
                    .map(([key, value]) => {
                      const hasConflict = viewRecord.conflicts?.some(c => c.field === key);
                      return (
                        <div key={key} className={hasConflict ? 'field-conflict' : ''}>
                          <span className="text-xs text-slate-500 uppercase">{key}</span>
                          <p className="font-mono text-sm text-slate-900">
                            {value !== null ? String(value) : '-'}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Conflicts */}
              {viewRecord.conflicts?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Conflicts Detected</h3>
                  <div className="space-y-2">
                    {viewRecord.conflicts.map((conflict, idx) => (
                      <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="status-conflict text-xs">
                            {conflict.type}
                          </Badge>
                          <span className="font-mono text-xs text-slate-600">{conflict.field}</span>
                        </div>
                        {conflict.type === 'mismatch' && (
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="p-2 bg-white rounded">
                              <span className="text-xs text-slate-500">Existing</span>
                              <p className="font-mono">{String(conflict.existing_value)}</p>
                            </div>
                            <div className="p-2 bg-blue-50 rounded border border-blue-200">
                              <span className="text-xs text-blue-600">New</span>
                              <p className="font-mono">{String(conflict.new_value)}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw Data */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Raw Data</h3>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs font-mono overflow-auto max-h-32">
                  {JSON.stringify(viewRecord.raw_data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
