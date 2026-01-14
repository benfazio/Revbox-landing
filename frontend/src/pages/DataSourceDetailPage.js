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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ArrowLeft, Plus, Trash2, Save, Eye, PlusCircle } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Standard fields + will be combined with custom fields
const STANDARD_FIELDS = [
  { value: 'policy_number', label: 'Policy Number' },
  { value: 'agent_code', label: 'Agent Code / Agency ID' },
  { value: 'agent_name', label: 'Agent Name / Agency Name' },
  { value: 'broker_id', label: 'Broker ID' },
  { value: 'broker_name', label: 'Broker Name' },
  { value: 'amount', label: 'Amount' },
  { value: 'commission', label: 'Commission' },
  { value: 'premium', label: 'Premium / Total WP' },
  { value: 'new_wp', label: 'New Written Premium' },
  { value: 'earned', label: 'Earned Premium' },
  { value: 'incurred', label: 'Incurred' },
  { value: 'loss_ratio', label: 'Loss Ratio' },
  { value: 'effective_date', label: 'Effective Date' },
  { value: 'insured_name', label: 'Insured Name' },
  { value: 'policy_type', label: 'Policy Type / LOB' },
  { value: 'state', label: 'State' },
  { value: 'pg_code', label: 'PG Code / Parent Code' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone / Mobile' },
  { value: 'address', label: 'Address / Street' },
  { value: 'city', label: 'City' },
  { value: 'zip', label: 'Zip Code' },
  { value: 'quotes', label: 'Quotes' },
  { value: 'policies', label: 'Policies' },
  { value: 'pif', label: 'Policies In Force' },
];

export default function DataSourceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [source, setSource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mappings, setMappings] = useState([]);
  const [primaryKeys, setPrimaryKeys] = useState([]);
  const [headerRow, setHeaderRow] = useState('');
  const [dataStartRow, setDataStartRow] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [customFields, setCustomFields] = useState([]);
  const [showAddFieldDialog, setShowAddFieldDialog] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');

  useEffect(() => {
    fetchSource();
    fetchCustomFields();
  }, [id]);

  const fetchSource = async () => {
    try {
      const response = await axios.get(`${API}/carriers/${id}`);
      setSource(response.data);
      
      const mappingsArray = Object.entries(response.data.field_mappings || {}).map(
        ([source, target]) => ({ source, target })
      );
      setMappings(mappingsArray.length > 0 ? mappingsArray : [{ source: '', target: '' }]);
      setPrimaryKeys(response.data.primary_key_fields || []);
      setHeaderRow(response.data.header_row?.toString() || '');
      setDataStartRow(response.data.data_start_row?.toString() || '');
    } catch (error) {
      toast.error('Failed to load data source');
      navigate('/sources');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomFields = async () => {
    try {
      const response = await axios.get(`${API}/custom-fields`);
      setCustomFields(response.data);
    } catch (error) {
      console.error('Failed to fetch custom fields');
    }
  };

  const allFields = [
    ...STANDARD_FIELDS,
    ...customFields.map(f => ({ value: f.field_name, label: `${f.field_label} (custom)` }))
  ];

  const onDropPreview = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    const formData = new FormData();
    formData.append('file', acceptedFiles[0]);

    try {
      const response = await axios.post(`${API}/uploads/preview`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPreviewData(response.data);
      setHeaderRow(response.data.suggested_header_row?.toString() || '1');
      setDataStartRow(response.data.suggested_data_start_row?.toString() || '2');
      toast.success('File preview loaded');
    } catch (error) {
      toast.error('Failed to preview file');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropPreview,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  });

  const handleSuggestMappings = () => {
    if (!previewData) {
      toast.error('Upload a sample file first');
      return;
    }
    
    const headerRowData = previewData.preview_rows.find(r => r.row_number === parseInt(headerRow));
    if (headerRowData) {
      const suggestedMappings = headerRowData.values
        .filter(v => v)
        .map(sourceField => {
          const normalized = sourceField.toLowerCase().replace(/[_\s]+/g, '');
          let targetField = '';
          
          if (normalized.includes('agency') && normalized.includes('id')) targetField = 'agent_code';
          else if (normalized.includes('agency') && normalized.includes('name')) targetField = 'agent_name';
          else if (normalized.includes('broker') && normalized.includes('id')) targetField = 'broker_id';
          else if (normalized.includes('broker') && normalized.includes('name')) targetField = 'broker_name';
          else if (normalized.includes('agent') && normalized.includes('code')) targetField = 'agent_code';
          else if (normalized.includes('agent') && normalized.includes('name')) targetField = 'agent_name';
          else if (normalized === 'agency' || normalized === 'agencycode') targetField = 'agent_code';
          else if (normalized === 'name') targetField = 'agent_name';
          else if (normalized.includes('pgcode') || normalized.includes('parentcode')) targetField = 'pg_code';
          else if (normalized.includes('newwp') || normalized.includes('newwritten')) targetField = 'new_wp';
          else if (normalized.includes('totwp') || normalized.includes('totalwp')) targetField = 'premium';
          else if (normalized.includes('earned')) targetField = 'earned';
          else if (normalized.includes('incurred')) targetField = 'incurred';
          else if (normalized.includes('lossratio')) targetField = 'loss_ratio';
          else if (normalized.includes('lob') || normalized.includes('policytype')) targetField = 'policy_type';
          else if (normalized.includes('state')) targetField = 'state';
          else if (normalized.includes('email')) targetField = 'email';
          else if (normalized.includes('phone') || normalized.includes('mobile')) targetField = 'phone';
          
          return { source: sourceField, target: targetField };
        });
      
      setMappings(suggestedMappings.length > 0 ? suggestedMappings : [{ source: '', target: '' }]);
      toast.success('Mappings suggested based on column headers');
    }
  };

  const handleAddCustomField = async () => {
    if (!newFieldName || !newFieldLabel) {
      toast.error('Please enter both field name and label');
      return;
    }
    
    try {
      await axios.post(`${API}/custom-fields?field_name=${encodeURIComponent(newFieldName)}&field_label=${encodeURIComponent(newFieldLabel)}`);
      toast.success('Custom field added');
      fetchCustomFields();
      setShowAddFieldDialog(false);
      setNewFieldName('');
      setNewFieldLabel('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add field');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fieldMappings = {};
      mappings.forEach(({ source, target }) => {
        if (source && target) {
          fieldMappings[source] = target;
        }
      });

      await axios.put(`${API}/carriers/${id}`, {
        name: source.name,
        code: source.code,
        description: source.description || '',
        primary_key_fields: primaryKeys,
        field_mappings: fieldMappings,
        header_row: headerRow ? parseInt(headerRow) : null,
        data_start_row: dataStartRow ? parseInt(dataStartRow) : null
      });

      toast.success('Configuration saved');
    } catch (error) {
      toast.error('Failed to save');
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
    <div data-testid="source-detail-page" className="min-h-screen">
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <button
          onClick={() => navigate('/sources')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sources
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{source?.name}</h1>
            <p className="text-sm text-slate-500 font-mono">{source?.code}</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="btn-primary" data-testid="save-config-btn">
            {saving ? <div className="spinner" /> : <Save className="w-4 h-4 mr-2" />}
            Save Configuration
          </Button>
        </div>
      </header>

      <div className="p-8 space-y-6">
        {/* File Preview Section */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">File Structure Preview</h2>
            <p className="text-sm text-slate-500">Upload a sample file to preview structure</p>
          </div>
          <div className="p-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'
              }`}
              data-testid="preview-dropzone"
            >
              <input {...getInputProps()} />
              <Eye className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-sm text-slate-600">Drop a sample Excel file to preview</p>
            </div>

            {previewData && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-4">
                    <div>
                      <Label className="text-xs">Header Row</Label>
                      <Input
                        type="number"
                        value={headerRow}
                        onChange={(e) => setHeaderRow(e.target.value)}
                        className="w-24 font-mono"
                        min="1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Data Starts At</Label>
                      <Input
                        type="number"
                        value={dataStartRow}
                        onChange={(e) => setDataStartRow(e.target.value)}
                        className="w-24 font-mono"
                        min="1"
                      />
                    </div>
                  </div>
                  <Button onClick={handleSuggestMappings} variant="outline">
                    Suggest Mappings
                  </Button>
                </div>

                <div className="border rounded-lg overflow-auto max-h-64">
                  <table className="w-full data-grid text-xs">
                    <tbody>
                      {previewData.preview_rows.map((row) => (
                        <tr 
                          key={row.row_number}
                          className={
                            row.row_number === parseInt(headerRow) ? 'bg-blue-100 font-semibold' :
                            row.row_number === parseInt(dataStartRow) ? 'bg-emerald-100' : ''
                          }
                        >
                          <td className="w-12 text-center text-slate-400 border-r bg-slate-50">{row.row_number}</td>
                          {row.values.slice(0, 12).map((val, idx) => (
                            <td key={idx} className="truncate max-w-24 px-2">{val || '-'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Field Mappings */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Field Mappings</h2>
              <p className="text-sm text-slate-500">Map source columns to standard fields</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowAddFieldDialog(true)} variant="outline" size="sm">
                <PlusCircle className="w-4 h-4 mr-1" />
                Add Custom Field
              </Button>
              <Button onClick={addMapping} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Mapping
              </Button>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-slate-500 uppercase tracking-wider px-3">
                <div className="col-span-5">Source Column</div>
                <div className="col-span-5">Maps To</div>
                <div className="col-span-1 text-center">Key</div>
                <div className="col-span-1"></div>
              </div>

              {mappings.map((mapping, index) => (
                <div 
                  key={index} 
                  className="grid grid-cols-12 gap-4 items-center p-3 bg-slate-50 rounded-lg"
                >
                  <div className="col-span-5">
                    <Input
                      value={mapping.source}
                      onChange={(e) => updateMapping(index, 'source', e.target.value)}
                      placeholder="Source column name"
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="col-span-5">
                    <Select
                      value={mapping.target}
                      onValueChange={(value) => updateMapping(index, 'target', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {allFields.map((field) => (
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
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      onClick={() => removeMapping(index)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {primaryKeys.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Primary Key Fields</h3>
                <div className="flex flex-wrap gap-2">
                  {primaryKeys.map((key) => (
                    <span key={key} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-mono">
                      {allFields.find(f => f.value === key)?.label || key}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Used to detect duplicates and link records
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Custom Field Dialog */}
      <Dialog open={showAddFieldDialog} onOpenChange={setShowAddFieldDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Custom Field</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Field Name (system)</Label>
              <Input
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value.toLowerCase().replace(/\s/g, '_'))}
                placeholder="e.g., ytd_premium"
                className="font-mono"
              />
              <p className="text-xs text-slate-500">Lowercase, no spaces (used in exports)</p>
            </div>
            <div className="space-y-2">
              <Label>Display Label</Label>
              <Input
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                placeholder="e.g., YTD Premium"
              />
              <p className="text-xs text-slate-500">How it appears in the UI</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddFieldDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCustomField} className="btn-primary">
              Add Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
