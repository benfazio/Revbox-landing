import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Link2, 
  ArrowRight,
  Database,
  Plus,
  X,
  Eye,
  Merge
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function TableLinkingPage() {
  const [sources, setSources] = useState([]);
  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [sourceA, setSourceA] = useState('');
  const [sourceB, setSourceB] = useState('');
  const [linkField, setLinkField] = useState('');
  const [linkedData, setLinkedData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchSources();
  }, []);

  useEffect(() => {
    if (sourceA) fetchRecordsForSource(sourceA, 'A');
    if (sourceB) fetchRecordsForSource(sourceB, 'B');
  }, [sourceA, sourceB]);

  const fetchSources = async () => {
    try {
      const response = await axios.get(`${API}/carriers`);
      setSources(response.data);
    } catch (error) {
      toast.error('Failed to fetch sources');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecordsForSource = async (sourceId, key) => {
    try {
      const response = await axios.get(`${API}/records`, { 
        params: { carrier_id: sourceId, status: 'validated' } 
      });
      setRecords(prev => ({ ...prev, [key]: response.data }));
    } catch (error) {
      console.error('Failed to fetch records');
    }
  };

  const getAvailableFields = () => {
    const fieldsA = new Set();
    const fieldsB = new Set();
    
    (records.A || []).forEach(r => {
      Object.keys(r.mapped_data || {}).forEach(k => {
        if (!k.startsWith('_')) fieldsA.add(k);
      });
    });
    
    (records.B || []).forEach(r => {
      Object.keys(r.mapped_data || {}).forEach(k => {
        if (!k.startsWith('_')) fieldsB.add(k);
      });
    });
    
    // Return common fields
    return [...fieldsA].filter(f => fieldsB.has(f));
  };

  const performLinking = () => {
    if (!sourceA || !sourceB || !linkField) {
      toast.error('Select both sources and a link field');
      return;
    }

    const recordsA = records.A || [];
    const recordsB = records.B || [];

    // Create index of B records by link field
    const indexB = {};
    recordsB.forEach(r => {
      const key = r.mapped_data?.[linkField];
      if (key) {
        if (!indexB[key]) indexB[key] = [];
        indexB[key].push(r);
      }
    });

    // Link records
    const linked = [];
    recordsA.forEach(rA => {
      const key = rA.mapped_data?.[linkField];
      if (key && indexB[key]) {
        indexB[key].forEach(rB => {
          linked.push({
            linkValue: key,
            recordA: rA,
            recordB: rB,
            combined: { ...rA.mapped_data, ...rB.mapped_data }
          });
        });
      }
    });

    setLinkedData(linked);
    setShowPreview(true);
    toast.success(`Found ${linked.length} linked records`);
  };

  const commonFields = getAvailableFields();
  const sourceAData = sources.find(s => s.id === sourceA);
  const sourceBData = sources.find(s => s.id === sourceB);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div data-testid="table-linking-page" className="min-h-screen">
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Table Linking</h1>
          <p className="text-sm text-slate-500 mt-1">Combine data from different sources using primary key fields</p>
        </div>
      </header>

      <div className="p-8 space-y-6">
        {/* Source Selection */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Select Sources to Link</h2>
          
          <div className="flex items-center gap-4">
            {/* Source A */}
            <div className="flex-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                Source A
              </label>
              <Select value={sourceA} onValueChange={setSourceA}>
                <SelectTrigger data-testid="source-a-select">
                  <SelectValue placeholder="Select source..." />
                </SelectTrigger>
                <SelectContent>
                  {sources.map(s => (
                    <SelectItem key={s.id} value={s.id} disabled={s.id === sourceB}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sourceA && records.A && (
                <p className="text-xs text-slate-500 mt-2">{records.A.length} approved records</p>
              )}
            </div>

            {/* Link Icon */}
            <div className="flex flex-col items-center pt-6">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Link2 className="w-5 h-5 text-blue-600" />
              </div>
            </div>

            {/* Source B */}
            <div className="flex-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                Source B
              </label>
              <Select value={sourceB} onValueChange={setSourceB}>
                <SelectTrigger data-testid="source-b-select">
                  <SelectValue placeholder="Select source..." />
                </SelectTrigger>
                <SelectContent>
                  {sources.map(s => (
                    <SelectItem key={s.id} value={s.id} disabled={s.id === sourceA}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sourceB && records.B && (
                <p className="text-xs text-slate-500 mt-2">{records.B.length} approved records</p>
              )}
            </div>
          </div>

          {/* Link Field Selection */}
          {sourceA && sourceB && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                Link Field (Primary Key)
              </label>
              <div className="flex items-center gap-4">
                <Select value={linkField} onValueChange={setLinkField}>
                  <SelectTrigger className="w-64" data-testid="link-field-select">
                    <SelectValue placeholder="Select common field..." />
                  </SelectTrigger>
                  <SelectContent>
                    {commonFields.length > 0 ? (
                      commonFields.map(f => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="_none" disabled>No common fields</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={performLinking} 
                  className="btn-primary"
                  disabled={!linkField}
                  data-testid="link-tables-btn"
                >
                  <Merge className="w-4 h-4 mr-2" />
                  Link Tables
                </Button>
              </div>
              {commonFields.length === 0 && sourceA && sourceB && (
                <p className="text-sm text-amber-600 mt-2">
                  No common fields found. Make sure both sources have matching field mappings.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Preview */}
        {showPreview && linkedData.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="font-semibold text-slate-900">Linked Data Preview</h2>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  {linkedData.length} matches
                </Badge>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="overflow-auto max-h-96">
              <table className="w-full data-grid">
                <thead>
                  <tr>
                    <th>Link Value ({linkField})</th>
                    <th className="bg-blue-50">{sourceAData?.name} Data</th>
                    <th className="bg-emerald-50">{sourceBData?.name} Data</th>
                  </tr>
                </thead>
                <tbody>
                  {linkedData.slice(0, 20).map((item, idx) => (
                    <tr key={idx}>
                      <td className="font-mono font-semibold text-blue-600">
                        {item.linkValue}
                      </td>
                      <td className="bg-blue-50/30">
                        <div className="text-xs space-y-1">
                          {Object.entries(item.recordA.mapped_data || {})
                            .filter(([k]) => !k.startsWith('_') && k !== linkField)
                            .slice(0, 3)
                            .map(([k, v]) => (
                              <div key={k}>
                                <span className="text-slate-500">{k}:</span>{' '}
                                <span className="font-mono">{v !== null ? String(v) : '-'}</span>
                              </div>
                            ))}
                        </div>
                      </td>
                      <td className="bg-emerald-50/30">
                        <div className="text-xs space-y-1">
                          {Object.entries(item.recordB.mapped_data || {})
                            .filter(([k]) => !k.startsWith('_') && k !== linkField)
                            .slice(0, 3)
                            .map(([k, v]) => (
                              <div key={k}>
                                <span className="text-slate-500">{k}:</span>{' '}
                                <span className="font-mono">{v !== null ? String(v) : '-'}</span>
                              </div>
                            ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {linkedData.length > 20 && (
              <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 text-sm text-slate-500">
                Showing first 20 of {linkedData.length} linked records
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!sourceA && !sourceB && (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Link2 className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Link Your Data</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Select two data sources and a common field (like Broker ID or Agent Code) to link records together.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
