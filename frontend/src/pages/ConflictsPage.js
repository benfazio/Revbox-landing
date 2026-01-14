import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, Check, X, Edit2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StatusBadge = ({ status }) => {
  const statusClasses = {
    pending: 'status-pending',
    resolved: 'status-completed',
    rejected: 'status-error'
  };

  return (
    <Badge variant="outline" className={`${statusClasses[status] || 'status-pending'} text-xs font-medium`}>
      {status}
    </Badge>
  );
};

export default function ConflictsPage() {
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [resolveDialog, setResolveDialog] = useState(null);
  const [manualValue, setManualValue] = useState('');

  useEffect(() => {
    fetchConflicts();
  }, [statusFilter]);

  const fetchConflicts = async () => {
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await axios.get(`${API}/conflicts`, { params });
      setConflicts(response.data);
    } catch (error) {
      toast.error('Failed to fetch conflicts');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (conflictId, resolution, value = null) => {
    try {
      await axios.put(`${API}/conflicts/${conflictId}/resolve`, {
        resolution,
        manual_value: value
      });
      toast.success('Conflict resolved');
      setResolveDialog(null);
      setManualValue('');
      fetchConflicts();
    } catch (error) {
      toast.error('Failed to resolve conflict');
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
    <div data-testid="conflicts-page">
      <header className="page-header">
        <h1 className="font-heading font-bold text-2xl tracking-tight text-slate-900">Conflicts</h1>
        <p className="text-sm text-slate-500 mt-1">Review and resolve data conflicts</p>
      </header>

      <div className="p-8">
        {/* Filter */}
        <div className="mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="conflict-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Conflicts List */}
        {conflicts.length > 0 ? (
          <div className="space-y-4">
            {conflicts.map((conflict) => (
              <div
                key={conflict.id}
                className="bg-white border border-slate-200 p-6"
                data-testid={`conflict-${conflict.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center ${
                      conflict.status === 'pending' ? 'bg-amber-100' : 
                      conflict.status === 'resolved' ? 'bg-emerald-100' : 'bg-red-100'
                    }`}>
                      <AlertTriangle className={`w-5 h-5 ${
                        conflict.status === 'pending' ? 'text-amber-600' :
                        conflict.status === 'resolved' ? 'text-emerald-600' : 'text-red-600'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="status-conflict text-xs">
                          {conflict.conflict_type}
                        </Badge>
                        <StatusBadge status={conflict.status} />
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        Field: <span className="font-mono font-medium">{conflict.field_name || 'N/A'}</span>
                      </p>
                    </div>
                  </div>

                  {conflict.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolve(conflict.id, 'keep_current')}
                        data-testid={`keep-current-${conflict.id}`}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Keep Current
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolve(conflict.id, 'accept_new')}
                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        data-testid={`accept-new-${conflict.id}`}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Accept New
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setResolveDialog(conflict);
                          setManualValue('');
                        }}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        data-testid={`manual-resolve-${conflict.id}`}
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Manual
                      </Button>
                    </div>
                  )}
                </div>

                {/* Value Comparison */}
                {conflict.conflict_type === 'mismatch' && (
                  <div className="grid grid-cols-2 gap-6 mt-4 pt-4 border-t border-slate-100">
                    <div className="bg-slate-50 p-4 rounded-md">
                      <span className="text-xs text-slate-500 uppercase tracking-wider">Current Value</span>
                      <p className="font-mono text-lg mt-1 text-slate-900">
                        {conflict.current_value !== null ? String(conflict.current_value) : '-'}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                      <span className="text-xs text-blue-600 uppercase tracking-wider">New Value</span>
                      <p className="font-mono text-lg mt-1 text-blue-900">
                        {conflict.new_value !== null ? String(conflict.new_value) : '-'}
                      </p>
                    </div>
                  </div>
                )}

                {conflict.conflict_type === 'duplicate' && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-sm text-slate-600">
                      Potential duplicate record detected. Review the data to determine if this is a true duplicate.
                    </p>
                  </div>
                )}

                <div className="mt-4 text-xs text-slate-400">
                  Created: {new Date(conflict.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <AlertTriangle className="empty-state-icon" />
            <p className="empty-state-title">No conflicts</p>
            <p className="empty-state-description">
              {statusFilter === 'pending' 
                ? 'All conflicts have been resolved' 
                : 'No conflicts match your filter'}
            </p>
          </div>
        )}
      </div>

      {/* Manual Resolution Dialog */}
      <Dialog open={!!resolveDialog} onOpenChange={() => setResolveDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Manual Resolution</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 mb-2">
                Field: <span className="font-mono font-medium">{resolveDialog?.field_name}</span>
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="text-xs text-slate-500">Current</span>
                  <p className="font-mono">{resolveDialog?.current_value}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">New</span>
                  <p className="font-mono">{resolveDialog?.new_value}</p>
                </div>
              </div>
            </div>
            <div>
              <label className="form-label">Enter correct value</label>
              <Input
                value={manualValue}
                onChange={(e) => setManualValue(e.target.value)}
                placeholder="Enter the correct value..."
                className="font-mono"
                data-testid="manual-value-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleResolve(resolveDialog.id, 'manual', manualValue)}
              className="btn-primary"
              disabled={!manualValue}
              data-testid="submit-manual-resolution"
            >
              Apply Value
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
