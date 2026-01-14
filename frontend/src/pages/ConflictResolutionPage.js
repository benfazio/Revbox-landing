import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  AlertTriangle, 
  Check, 
  X, 
  Edit2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Info,
  ArrowRight
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ConflictResolutionPage() {
  const [conflicts, setConflicts] = useState([]);
  const [conflictDetails, setConflictDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [manualValue, setManualValue] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => {
    fetchConflicts();
  }, []);

  useEffect(() => {
    if (conflicts[currentIndex]) {
      fetchConflictDetails(conflicts[currentIndex].id);
    }
  }, [currentIndex, conflicts]);

  const fetchConflicts = async () => {
    try {
      const response = await axios.get(`${API}/conflicts`, { params: { status: 'pending' } });
      setConflicts(response.data);
    } catch (error) {
      toast.error('Failed to fetch conflicts');
    } finally {
      setLoading(false);
    }
  };

  const fetchConflictDetails = async (conflictId) => {
    setDetailsLoading(true);
    try {
      const response = await axios.get(`${API}/conflicts/${conflictId}/details`);
      setConflictDetails(response.data);
    } catch (error) {
      console.error('Failed to fetch conflict details');
      setConflictDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleResolve = async (conflictId, resolution, value = null) => {
    try {
      await axios.put(`${API}/conflicts/${conflictId}/resolve`, {
        resolution,
        manual_value: value
      });
      toast.success('Conflict resolved');
      setShowManualInput(false);
      setManualValue('');
      
      const newConflicts = conflicts.filter(c => c.id !== conflictId);
      setConflicts(newConflicts);
      if (currentIndex >= newConflicts.length && newConflicts.length > 0) {
        setCurrentIndex(newConflicts.length - 1);
      }
      setConflictDetails(null);
    } catch (error) {
      toast.error('Failed to resolve conflict');
    }
  };

  const currentConflict = conflicts[currentIndex];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div data-testid="conflict-resolution-page" className="min-h-screen">
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Conflict Resolution</h1>
            <p className="text-sm text-slate-500 mt-1">Review conflicts with full context and source information</p>
          </div>
          {conflicts.length > 0 && (
            <Badge variant="outline" className="status-conflict text-sm px-3 py-1">
              <AlertTriangle className="w-4 h-4 mr-2" />
              {conflicts.length} conflicts remaining
            </Badge>
          )}
        </div>
      </header>

      <div className="p-8">
        {conflicts.length > 0 ? (
          <div className="space-y-6">
            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-slate-500">
                Conflict {currentIndex + 1} of {conflicts.length}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentIndex(Math.min(conflicts.length - 1, currentIndex + 1))}
                disabled={currentIndex === conflicts.length - 1}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {currentConflict && (
              <div className="space-y-4">
                {/* WHY Section - Conflict Explanation */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Info className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-amber-900 mb-1">Why This Conflict?</h3>
                      <p className="text-sm text-amber-800">
                        {conflictDetails?.reason || 
                          (currentConflict.conflict_type === 'mismatch' 
                            ? `The field "${currentConflict.field_name}" has different values. A record with matching primary key already exists, but the "${currentConflict.field_name}" value differs.`
                            : 'A record with the same primary key values was found. This could be a duplicate or an updated version of existing data.'
                          )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Source Information */}
                {conflictDetails && (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Existing Data Source */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FileSpreadsheet className="w-4 h-4 text-slate-500" />
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Existing Data From
                        </span>
                      </div>
                      {conflictDetails.existing_upload ? (
                        <div>
                          <p className="font-medium text-slate-900">{conflictDetails.existing_upload.filename}</p>
                          <p className="text-sm text-slate-500">{conflictDetails.existing_upload.carrier_name}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            Uploaded: {new Date(conflictDetails.existing_upload.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">Source information not available</p>
                      )}
                    </div>

                    {/* New Data Source */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                          New Data From
                        </span>
                      </div>
                      {conflictDetails.new_upload ? (
                        <div>
                          <p className="font-medium text-blue-900">{conflictDetails.new_upload.filename}</p>
                          <p className="text-sm text-blue-700">{conflictDetails.new_upload.carrier_name}</p>
                          <p className="text-xs text-blue-500 mt-1">
                            Uploaded: {new Date(conflictDetails.new_upload.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-blue-500">Source information not available</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Side by Side Value Comparison */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 bg-red-50 border-b border-red-200 flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {currentConflict.conflict_type === 'mismatch' ? 'Value Mismatch' : 'Duplicate Record'}
                      </h3>
                      <p className="text-sm text-slate-600">
                        Field: <span className="font-mono font-medium bg-red-100 px-2 py-0.5 rounded">{currentConflict.field_name || 'N/A'}</span>
                      </p>
                    </div>
                  </div>

                  {currentConflict.conflict_type === 'mismatch' && (
                    <div className="grid grid-cols-2 divide-x divide-slate-200">
                      {/* Existing Value */}
                      <div className="p-6">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                          Current Value (Keep?)
                        </div>
                        <div className="bg-slate-100 rounded-xl p-6 border-2 border-slate-300">
                          <div className="text-2xl font-mono font-bold text-slate-900 break-all">
                            {currentConflict.current_value !== null 
                              ? String(currentConflict.current_value) 
                              : <span className="text-slate-400 italic text-lg">empty</span>}
                          </div>
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden">
                        <div className="w-10 h-10 bg-white rounded-full border-2 border-slate-200 flex items-center justify-center">
                          <ArrowRight className="w-5 h-5 text-slate-400" />
                        </div>
                      </div>

                      {/* New Value */}
                      <div className="p-6 bg-blue-50/50">
                        <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-4">
                          New Value (Accept?)
                        </div>
                        <div className="bg-blue-100 rounded-xl p-6 border-2 border-blue-400">
                          <div className="text-2xl font-mono font-bold text-blue-900 break-all">
                            {currentConflict.new_value !== null 
                              ? String(currentConflict.new_value) 
                              : <span className="text-blue-400 italic text-lg">empty</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Full Record Context */}
                  {conflictDetails?.new_record && (
                    <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                        Full Record Context (New Upload)
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {Object.entries(conflictDetails.new_record.mapped_data || {})
                          .filter(([key]) => !key.startsWith('_'))
                          .slice(0, 8)
                          .map(([key, value]) => {
                            const isConflictField = key === currentConflict.field_name;
                            return (
                              <div 
                                key={key} 
                                className={`p-2 rounded ${isConflictField ? 'bg-red-100 border-2 border-red-400' : 'bg-white border border-slate-200'}`}
                              >
                                <span className={`text-xs ${isConflictField ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>{key}</span>
                                <p className={`font-mono text-sm truncate ${isConflictField ? 'text-red-700 font-bold' : 'text-slate-900'}`}>
                                  {value !== null ? String(value) : '-'}
                                </p>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="px-6 py-4 border-t border-slate-200 bg-white">
                    {showManualInput ? (
                      <div className="flex items-center gap-3">
                        <Input
                          value={manualValue}
                          onChange={(e) => setManualValue(e.target.value)}
                          placeholder="Enter the correct value..."
                          className="flex-1 font-mono"
                          autoFocus
                          data-testid="manual-value-input"
                        />
                        <Button
                          onClick={() => handleResolve(currentConflict.id, 'manual', manualValue)}
                          className="btn-primary"
                          disabled={!manualValue}
                        >
                          Apply
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => { setShowManualInput(false); setManualValue(''); }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => handleResolve(currentConflict.id, 'keep_current')}
                            className="border-slate-300"
                            data-testid="keep-current-btn"
                          >
                            <X className="w-4 h-4 mr-2 text-slate-500" />
                            Keep Current Value
                          </Button>
                          <Button
                            onClick={() => handleResolve(currentConflict.id, 'accept_new')}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            data-testid="accept-new-btn"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Accept New Value
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setShowManualInput(true)}
                          data-testid="manual-entry-btn"
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Enter Different Value
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Conflict List */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-900 text-sm">All Pending Conflicts</h3>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-48 overflow-auto">
                    {conflicts.map((conflict, idx) => (
                      <div
                        key={conflict.id}
                        className={`px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 ${
                          idx === currentIndex ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                        onClick={() => setCurrentIndex(idx)}
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="status-conflict text-xs">
                            {conflict.conflict_type}
                          </Badge>
                          <span className="font-mono text-sm text-slate-600">{conflict.field_name || 'record'}</span>
                        </div>
                        <div className="text-xs text-slate-400">
                          {idx === currentIndex ? 'Current' : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">All Clear!</h3>
            <p className="text-sm text-slate-500">No conflicts to resolve</p>
          </div>
        )}
      </div>
    </div>
  );
}
