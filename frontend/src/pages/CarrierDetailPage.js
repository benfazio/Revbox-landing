import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Plus, Trash2, Upload, Sparkles, Save } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STANDARD_FIELDS = [
  { value: 'policy_number', label: 'Policy Number' },
  { value: 'agent_code', label: 'Agent Code' },
  { value: 'agent_name', label: 'Agent Name' },
  { value: 'amount', label: 'Amount' },
  { value: 'commission', label: 'Commission' },
  { value: 'effective_date', label: 'Effective Date' },
  { value: 'insured_name', label: 'Insured Name' },
  { value: 'carrier_name', label: 'Carrier Name' },
  { value: 'premium', label: 'Premium' },
  { value: 'payout_amount', label: 'Payout Amount' },
  { value: 'transaction_date', label: 'Transaction Date' },
  { value: 'policy_type', label: 'Policy Type' },
];

export default function CarrierDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [carrier, setCarrier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [mappings, setMappings] = useState([]);
  const [primaryKeys, setPrimaryKeys] = useState([]);

  useEffect(() => {
    fetchCarrier();
  }, [id]);

  const fetchCarrier = async () => {
    try {
      const response = await axios.get(`${API}/carriers/${id}`);
      setCarrier(response.data);
      
      // Convert field_mappings object to array format
      const mappingsArray = Object.entries(response.data.field_mappings || {}).map(
        ([source, target]) => ({ source, target })
      );
      setMappings(mappingsArray.length > 0 ? mappingsArray : [{ source: '', target: '' }]);
      setPrimaryKeys(response.data.primary_key_fields || []);
    } catch (error) {
      toast.error('Failed to load carrier');
      navigate('/carriers');
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    setSuggesting(true);
    const formData = new FormData();
    formData.append('file', acceptedFiles[0]);

    try {
      const response = await axios.post(
        `${API}/carriers/${id}/suggest-mappings`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (response.data.mappings) {
        const suggestedMappings = Object.entries(response.data.mappings).map(
          ([source, target]) => ({ source, target })
        );
        setMappings(suggestedMappings.length > 0 ? suggestedMappings : [{ source: '', target: '' }]);
      }
      
      if (response.data.primary_keys) {
        setPrimaryKeys(response.data.primary_keys);
      }
      
      toast.success('AI suggestions applied! Review and save.');
    } catch (error) {
      toast.error('Failed to get AI suggestions');
    } finally {
      setSuggesting(false);
    }
  }, [id]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert mappings array back to object
      const fieldMappings = {};
      mappings.forEach(({ source, target }) => {
        if (source && target) {
          fieldMappings[source] = target;
        }
      });

      await axios.put(`${API}/carriers/${id}/field-mappings`, {
        field_mappings: fieldMappings,
        primary_key_fields: primaryKeys
      });

      toast.success('Field mappings saved');
    } catch (error) {
      toast.error('Failed to save mappings');
    } finally {
      setSaving(false);
    }
  };

  const addMapping = () => {
    setMappings([...mappings, { source: '', target: '' }]);
  };

  const removeMapping = (index) => {
    setMappings(mappings.filter((_, i) => i !== index));
  };

  const updateMapping = (index, field, value) => {
    const updated = [...mappings];
    updated[index][field] = value;
    setMappings(updated);
  };

  const togglePrimaryKey = (field) => {
    if (primaryKeys.includes(field)) {
      setPrimaryKeys(primaryKeys.filter(k => k !== field));
    } else {
      setPrimaryKeys([...primaryKeys, field]);
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
    <div data-testid="carrier-detail-page">
      <header className="page-header">
        <button
          onClick={() => navigate('/carriers')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Carriers
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-2xl tracking-tight text-slate-900">
              {carrier?.name}
            </h1>
            <p className="text-sm text-slate-500 font-mono mt-1">{carrier?.code}</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="btn-primary" data-testid="save-mappings-btn">
            {saving ? <div className="spinner" /> : <Save className="w-4 h-4 mr-2" />}
            Save Mappings
          </Button>
        </div>
      </header>

      <div className="p-8 space-y-8">
        {/* AI Suggestion Dropzone */}
        <div className="bg-white border border-slate-200 p-6">
          <h2 className="font-heading font-semibold text-lg text-slate-900 mb-4">
            AI Field Mapping Suggestions
          </h2>
          <div
            {...getRootProps()}
            className={`dropzone ${isDragActive ? 'active' : ''}`}
            data-testid="ai-suggest-dropzone"
          >
            <input {...getInputProps()} />
            {suggesting ? (
              <div className="flex flex-col items-center">
                <div className="spinner mb-3" />
                <p className="text-sm text-slate-600">Analyzing document...</p>
              </div>
            ) : (
              <>
                <Sparkles className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                <p className="text-sm text-slate-600 mb-1">
                  Drop a sample file to get AI-powered field mapping suggestions
                </p>
                <p className="text-xs text-slate-400">
                  Supports Excel (.xlsx) and PDF files
                </p>
              </>
            )}
          </div>
        </div>

        {/* Field Mappings */}
        <div className="bg-white border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-lg text-slate-900">
              Field Mappings
            </h2>
            <Button onClick={addMapping} variant="outline" size="sm" data-testid="add-mapping-btn">
              <Plus className="w-4 h-4 mr-1" />
              Add Mapping
            </Button>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-slate-500 uppercase tracking-wider px-3">
              <div className="col-span-5">Source Field (from carrier)</div>
              <div className="col-span-5">Target Field (standard)</div>
              <div className="col-span-1">Primary Key</div>
              <div className="col-span-1"></div>
            </div>

            {mappings.map((mapping, index) => (
              <div 
                key={index} 
                className="field-mapping-row grid grid-cols-12 gap-4 items-center"
                data-testid={`mapping-row-${index}`}
              >
                <div className="col-span-5">
                  <Input
                    value={mapping.source}
                    onChange={(e) => updateMapping(index, 'source', e.target.value)}
                    placeholder="e.g., PolicyNum"
                    className="font-mono text-sm"
                    data-testid={`mapping-source-${index}`}
                  />
                </div>
                <div className="col-span-5">
                  <Select
                    value={mapping.target}
                    onValueChange={(value) => updateMapping(index, 'target', value)}
                  >
                    <SelectTrigger data-testid={`mapping-target-${index}`}>
                      <SelectValue placeholder="Select target field" />
                    </SelectTrigger>
                    <SelectContent>
                      {STANDARD_FIELDS.map((field) => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1 flex justify-center">
                  <Checkbox
                    checked={primaryKeys.includes(mapping.target)}
                    onCheckedChange={() => mapping.target && togglePrimaryKey(mapping.target)}
                    disabled={!mapping.target}
                    data-testid={`mapping-pk-${index}`}
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  <button
                    onClick={() => removeMapping(index)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    data-testid={`remove-mapping-${index}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {mappings.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <p className="text-sm">No field mappings configured.</p>
              <p className="text-xs mt-1">Add mappings manually or use AI suggestions above.</p>
            </div>
          )}
        </div>

        {/* Primary Keys Summary */}
        {primaryKeys.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Primary Key Fields</h3>
            <div className="flex flex-wrap gap-2">
              {primaryKeys.map((key) => (
                <span key={key} className="field-badge">
                  {STANDARD_FIELDS.find(f => f.value === key)?.label || key}
                </span>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              These fields will be used to detect duplicate records and conflicts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
