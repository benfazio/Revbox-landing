import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Database, 
  Plus, 
  Settings, 
  Trash2, 
  Upload,
  FileSpreadsheet,
  ArrowRight
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DataSourcesPage() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [uploadDialog, setUploadDialog] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  });

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const response = await axios.get(`${API}/carriers`);
      setSources(response.data);
    } catch (error) {
      toast.error('Failed to fetch data sources');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/carriers`, {
        ...formData,
        primary_key_fields: [],
        field_mappings: {}
      });
      toast.success('Data source created');
      fetchSources();
      setShowDialog(false);
      setFormData({ name: '', code: '', description: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create source');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}" and all its uploaded data?`)) return;
    try {
      await axios.delete(`${API}/carriers/${id}`);
      toast.success('Data source deleted');
      fetchSources();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!uploadDialog || acceptedFiles.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', acceptedFiles[0]);
    formData.append('carrier_id', uploadDialog.id);

    try {
      const response = await axios.post(`${API}/uploads`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(`Uploaded ${response.data.total_records} records to staging`);
      if (response.data.conflict_count > 0) {
        toast.warning(`${response.data.conflict_count} potential conflicts detected`);
      }
      setUploadDialog(null);
      fetchSources();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [uploadDialog]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    disabled: uploading
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div data-testid="data-sources-page" className="min-h-screen">
      <header className="bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Data Sources</h1>
          <p className="text-sm text-slate-500 mt-1">Configure your data sources and field mappings</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="btn-primary" data-testid="add-source-btn">
          <Plus className="w-4 h-4 mr-2" />
          Add Source
        </Button>
      </header>

      <div className="p-8">
        {sources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sources.map((source) => (
              <div 
                key={source.id} 
                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
                data-testid={`source-card-${source.code}`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Database className="w-6 h-6 text-slate-600" />
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setUploadDialog(source)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        data-testid={`upload-to-${source.code}`}
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(source.id, source.name)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        data-testid={`delete-source-${source.code}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-lg text-slate-900">{source.name}</h3>
                  <p className="text-sm text-slate-500 font-mono mt-1">{source.code}</p>
                  
                  {source.description && (
                    <p className="text-sm text-slate-600 mt-3 line-clamp-2">{source.description}</p>
                  )}

                  <div className="mt-4 flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {Object.keys(source.field_mappings || {}).length} mappings
                    </Badge>
                    {source.header_row && (
                      <Badge variant="outline" className="text-xs">
                        Header: Row {source.header_row}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
                  <Link 
                    to={`/sources/${source.id}`}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                    data-testid={`configure-source-${source.code}`}
                  >
                    <Settings className="w-4 h-4" />
                    Configure Mappings
                    <ArrowRight className="w-3 h-3 ml-auto" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
            <Database className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No data sources yet</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
              Add your first data source to start importing and managing your data.
            </p>
            <Button onClick={() => setShowDialog(true)} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Data Source
            </Button>
          </div>
        )}
      </div>

      {/* Add Source Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Data Source</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Source Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Foremost Signature"
                required
                data-testid="source-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Source Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '_') })}
                placeholder="e.g., FOREMOST_SIG"
                required
                className="font-mono"
                data-testid="source-code-input"
              />
              <p className="text-xs text-slate-500">Unique identifier for this source</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description..."
                data-testid="source-desc-input"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="btn-primary" data-testid="save-source-btn">
                Create Source
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={!!uploadDialog} onOpenChange={() => setUploadDialog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload to {uploadDialog?.name}</DialogTitle>
          </DialogHeader>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'
            }`}
            data-testid="upload-dropzone"
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="flex flex-col items-center">
                <div className="spinner mb-3" />
                <p className="text-sm text-slate-600">Processing file...</p>
              </div>
            ) : (
              <>
                <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-sm text-slate-700 font-medium mb-1">
                  {isDragActive ? 'Drop the file here' : 'Drag & drop a file'}
                </p>
                <p className="text-xs text-slate-500">
                  Excel (.xlsx, .xls), PDF, or CSV
                </p>
              </>
            )}
          </div>
          <p className="text-xs text-slate-500 text-center">
            Data will be imported to staging for review before approval
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
