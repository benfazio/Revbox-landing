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
  ArrowRight,
  Rows
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

  // Get all fields from both records for comparison
  const getAllFields = () => {
    const fields = new Set();
    if (conflictDetails?.existing_record?.mapped_data) {
      Object.keys(conflictDetails.existing_record.mapped_data).forEach(k => {
        if (!k.startsWith('_')) fields.add(k);
      });
    }
    if (conflictDetails?.new_record?.mapped_data) {
      Object.keys(conflictDetails.new_record.mapped_data).forEach(k => {
        if (!k.startsWith('_')) fields.add(k);
      });
    }
    return Array.from(fields);
  };

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
            <p className="text-sm text-slate-500 mt-1">Compare full data segments side by side</p>
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
                {/* WHY Section */}
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
                            ? `The field "${currentConflict.field_name}" has different values between the existing record and the new upload. Records are matched by their primary key fields.`
                            : 'A record with matching primary key values already exists in the system.'
                          )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Source Information */}
                {conflictDetails && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileSpreadsheet className="w-4 h-4 text-slate-500" />
                        <span className="text-xs font-semibold text-slate-500 uppercase">Existing Data Source</span>
                      </div>
                      {conflictDetails.existing_upload ? (
                        <>
                          <p className="font-medium text-slate-900">{conflictDetails.existing_upload.filename}</p>
                          <p className="text-sm text-slate-500">{conflictDetails.existing_upload.carrier_name}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(conflictDetails.existing_upload.created_at).toLocaleDateString()}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-slate-500">Source info not available</p>
                      )}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-semibold text-blue-600 uppercase">New Data Source</span>
                      </div>
                      {conflictDetails.new_upload ? (
                        <>
                          <p className="font-medium text-blue-900">{conflictDetails.new_upload.filename}</p>
                          <p className="text-sm text-blue-700">{conflictDetails.new_upload.carrier_name}</p>
                          <p className="text-xs text-blue-500 mt-1">
                            {new Date(conflictDetails.new_upload.created_at).toLocaleDateString()}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-blue-500">Source info not available</p>
                      )}
                    </div>
                  </div>
                )}

                {/* FULL DATA SEGMENT COMPARISON */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center">
                      <Rows className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Full Data Segment Comparison</h3>
                      <p className="text-sm text-slate-500">Compare all fields between both records</p>
                    </div>
                  </div>

                  {detailsLoading ? (
                    <div className="p-12 text-center">
                      <div className="spinner mx-auto" />
                    </div>
                  ) : (
                    <div className="overflow-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-1/4 border-r border-slate-200">
                              Field
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-5/12 border-r border-slate-200 bg-slate-50">
                              Existing Value
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-blue-600 uppercase tracking-wider w-5/12 bg-blue-50">
                              New Value
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {getAllFields().map((field) => {
                            const existingVal = conflictDetails?.existing_record?.mapped_data?.[field];
                            const newVal = conflictDetails?.new_record?.mapped_data?.[field];
                            const isConflictField = field === currentConflict.field_name;
                            const isDifferent = String(existingVal || '') !== String(newVal || '');
                            
                            return (
                              <tr 
                                key={field} 
                                className={isConflictField ? 'bg-red-50' : isDifferent ? 'bg-amber-50/50' : ''}
                              >
                                <td className={`px-4 py-3 text-sm border-r border-slate-200 ${isConflictField ? 'font-bold text-red-700' : 'text-slate-600'}`}>
                                  {field}
                                  {isConflictField && (
                                    <Badge variant="outline" className="ml-2 status-conflict text-xs">CONFLICT</Badge>
                                  )}
                                </td>
                                <td className={`px-4 py-3 font-mono text-sm border-r border-slate-200 ${isConflictField ? 'bg-red-100 text-red-900 font-bold' : 'text-slate-900'}`}>
                                  {existingVal !== null && existingVal !== undefined ? String(existingVal) : <span className="text-slate-400 italic">empty</span>}
                                </td>
                                <td className={`px-4 py-3 font-mono text-sm ${isConflictField ? 'bg-blue-100 text-blue-900 font-bold' : 'bg-blue-50/30 text-slate-900'}`}>
                                  {newVal !== null && newVal !== undefined ? String(newVal) : <span className="text-slate-400 italic">empty</span>}
                                  {isDifferent && !isConflictField && (
                                    <span className="ml-2 text-amber-600 text-xs">← different</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="px-6 py-4 border-t border-slate-200 bg-white">
                    {showManualInput ? (
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="text-xs text-slate-500 mb-1 block">
                            Enter correct value for: <span className="font-mono font-semibold">{currentConflict.field_name}</span>
                          </label>
                          <Input
                            value={manualValue}
                            onChange={(e) => setManualValue(e.target.value)}
                            placeholder="Enter correct value..."
                            className="font-mono"
                            autoFocus
                          />
                        </div>
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
                          >
                            <X className="w-4 h-4 mr-2 text-slate-500" />
                            Keep Existing
                          </Button>
                          <Button
                            onClick={() => handleResolve(currentConflict.id, 'accept_new')}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Accept New
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setShowManualInput(true)}
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
                  <div className="divide-y divide-slate-100 max-h-40 overflow-auto">
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
