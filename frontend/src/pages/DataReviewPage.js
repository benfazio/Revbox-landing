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
  ClipboardCheck, 
  Check, 
  X, 
  Eye, 
  DollarSign,
  AlertTriangle,
  FileText
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StatusBadge = ({ status }) => {
  const statusClasses = {
    pending: 'status-pending',
    validated: 'status-validated',
    conflict: 'status-conflict',
    rejected: 'status-error',
    processed: 'status-completed'
  };

  return (
    <Badge variant="outline" className={`${statusClasses[status] || 'status-pending'} text-xs font-medium`}>
      {status}
    </Badge>
  );
};

export default function DataReviewPage() {
  const [records, setRecords] = useState([]);
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [viewRecord, setViewRecord] = useState(null);

  useEffect(() => {
    fetchData();
  }, [statusFilter, carrierFilter]);

  const fetchData = async () => {
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (carrierFilter !== 'all') params.carrier_id = carrierFilter;

      const [recordsRes, carriersRes] = await Promise.all([
        axios.get(`${API}/records`, { params }),
        axios.get(`${API}/carriers`)
      ]);
      setRecords(recordsRes.data);
      setCarriers(carriersRes.data);
    } catch (error) {
      toast.error('Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (recordId) => {
    try {
      await axios.put(`${API}/records/${recordId}/validate`);
      toast.success('Record validated');
      fetchData();
    } catch (error) {
      toast.error('Failed to validate record');
    }
  };

  const handleReject = async (recordId) => {
    try {
      await axios.put(`${API}/records/${recordId}/reject`);
      toast.success('Record rejected');
      fetchData();
    } catch (error) {
      toast.error('Failed to reject record');
    }
  };

  const handleBulkValidate = async () => {
    try {
      await Promise.all(selectedRecords.map(id => axios.put(`${API}/records/${id}/validate`)));
      toast.success(`Validated ${selectedRecords.length} records`);
      setSelectedRecords([]);
      fetchData();
    } catch (error) {
      toast.error('Failed to validate records');
    }
  };

  const handleGeneratePayouts = async () => {
    const validatedRecords = records
      .filter(r => r.status === 'validated' && selectedRecords.includes(r.id))
      .map(r => r.id);

    if (validatedRecords.length === 0) {
      toast.error('Select validated records to generate payouts');
      return;
    }

    try {
      const response = await axios.post(`${API}/payouts/generate`, validatedRecords);
      toast.success(response.data.message);
      setSelectedRecords([]);
      fetchData();
    } catch (error) {
      toast.error('Failed to generate payouts');
    }
  };

  const toggleSelect = (id) => {
    setSelectedRecords(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRecords.length === records.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(records.map(r => r.id));
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
    <div data-testid="data-review-page">
      <header className="page-header flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl tracking-tight text-slate-900">Data Review</h1>
          <p className="text-sm text-slate-500 mt-1">Review and validate extracted records</p>
        </div>
        <div className="flex gap-2">
          {selectedRecords.length > 0 && (
            <>
              <Button onClick={handleBulkValidate} className="btn-accent" data-testid="bulk-validate-btn">
                <Check className="w-4 h-4 mr-2" />
                Validate Selected ({selectedRecords.length})
              </Button>
              <Button onClick={handleGeneratePayouts} className="btn-primary" data-testid="generate-payouts-btn">
                <DollarSign className="w-4 h-4 mr-2" />
                Generate Payouts
              </Button>
            </>
          )}
        </div>
      </header>

      <div className="p-8">
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="conflict">Conflict</SelectItem>
              <SelectItem value="validated">Validated</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="processed">Processed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={carrierFilter} onValueChange={setCarrierFilter}>
            <SelectTrigger className="w-48" data-testid="carrier-filter">
              <SelectValue placeholder="Carrier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Carriers</SelectItem>
              {carriers.map(carrier => (
                <SelectItem key={carrier.id} value={carrier.id}>
                  {carrier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Records Table */}
        {records.length > 0 ? (
          <div className="data-table-container">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="w-12">
                    <Checkbox
                      checked={selectedRecords.length === records.length && records.length > 0}
                      onCheckedChange={toggleSelectAll}
                      data-testid="select-all-checkbox"
                    />
                  </th>
                  <th>Policy #</th>
                  <th>Agent</th>
                  <th>Amount</th>
                  <th>Carrier</th>
                  <th>Status</th>
                  <th>Conflicts</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => {
                  const mapped = record.mapped_data || {};
                  return (
                    <tr key={record.id} data-testid={`record-row-${record.id}`}>
                      <td>
                        <Checkbox
                          checked={selectedRecords.includes(record.id)}
                          onCheckedChange={() => toggleSelect(record.id)}
                        />
                      </td>
                      <td className="font-mono text-xs">
                        {mapped.policy_number || '-'}
                      </td>
                      <td>
                        {mapped.agent_name || mapped.agent_code || '-'}
                      </td>
                      <td className="font-mono">
                        ${parseFloat(mapped.amount || mapped.premium || mapped.payout_amount || 0).toLocaleString()}
                      </td>
                      <td>{record.carrier_id?.substring(0, 8)}...</td>
                      <td><StatusBadge status={record.status} /></td>
                      <td>
                        {record.conflicts?.length > 0 ? (
                          <span className="flex items-center gap-1 text-red-600">
                            <AlertTriangle className="w-3 h-3" />
                            {record.conflicts.length}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setViewRecord(record)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            data-testid={`view-record-${record.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {record.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleValidate(record.id)}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                data-testid={`validate-record-${record.id}`}
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(record.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                data-testid={`reject-record-${record.id}`}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <ClipboardCheck className="empty-state-icon" />
            <p className="empty-state-title">No records to review</p>
            <p className="empty-state-description">Upload carrier reports to see extracted records here</p>
          </div>
        )}
      </div>

      {/* Record Detail Dialog */}
      <Dialog open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Record Details</DialogTitle>
          </DialogHeader>
          {viewRecord && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <StatusBadge status={viewRecord.status} />
                {viewRecord.conflicts?.length > 0 && (
                  <Badge variant="outline" className="status-conflict">
                    {viewRecord.conflicts.length} conflicts
                  </Badge>
                )}
              </div>

              {/* Mapped Data */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Mapped Fields</h3>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-md">
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(viewRecord.mapped_data || {})
                      .filter(([key]) => !key.startsWith('_'))
                      .map(([key, value]) => (
                        <div key={key}>
                          <span className="text-xs text-slate-500 uppercase tracking-wider">{key}</span>
                          <p className="font-mono text-sm text-slate-900 mt-0.5">
                            {value !== null ? String(value) : '-'}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Conflicts */}
              {viewRecord.conflicts?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Conflicts</h3>
                  <div className="space-y-2">
                    {viewRecord.conflicts.map((conflict, idx) => (
                      <div key={idx} className="bg-red-50 border border-red-200 p-3 rounded-md">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="status-conflict text-xs">
                            {conflict.type}
                          </Badge>
                          <span className="font-mono text-xs text-slate-600">{conflict.field}</span>
                        </div>
                        {conflict.type === 'mismatch' && (
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-xs text-slate-500">Current Value</span>
                              <p className="font-mono">{String(conflict.existing_value)}</p>
                            </div>
                            <div>
                              <span className="text-xs text-slate-500">New Value</span>
                              <p className="font-mono">{String(conflict.new_value)}</p>
                            </div>
                          </div>
                        )}
                        {conflict.message && (
                          <p className="text-sm text-slate-600">{conflict.message}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw Data */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Raw Data</h3>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-md text-xs font-mono overflow-auto max-h-48">
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
