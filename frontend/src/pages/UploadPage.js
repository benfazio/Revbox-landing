import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
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
import { Upload, FileText, CheckCircle, AlertCircle, Clock, FileSpreadsheet } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StatusBadge = ({ status }) => {
  const config = {
    processing: { class: 'status-processing', icon: Clock },
    completed: { class: 'status-completed', icon: CheckCircle },
    error: { class: 'status-error', icon: AlertCircle },
  };
  const { class: className, icon: Icon } = config[status] || config.processing;

  return (
    <Badge variant="outline" className={`${className} text-xs font-medium flex items-center gap-1`}>
      <Icon className="w-3 h-3" />
      {status}
    </Badge>
  );
};

export default function UploadPage() {
  const [carriers, setCarriers] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [selectedCarrier, setSelectedCarrier] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [carriersRes, uploadsRes] = await Promise.all([
        axios.get(`${API}/carriers`),
        axios.get(`${API}/uploads`)
      ]);
      setCarriers(carriersRes.data);
      setUploads(uploadsRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!selectedCarrier) {
      toast.error('Please select a carrier first');
      return;
    }

    if (acceptedFiles.length === 0) return;

    setUploading(true);
    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('carrier_id', selectedCarrier);

    try {
      const response = await axios.post(`${API}/uploads`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(`Processed ${response.data.total_records} records`);
      
      if (response.data.conflict_count > 0) {
        toast.warning(`${response.data.conflict_count} conflicts detected`);
      }

      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [selectedCarrier]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    disabled: !selectedCarrier || uploading
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div data-testid="upload-page">
      <header className="page-header">
        <h1 className="font-heading font-bold text-2xl tracking-tight text-slate-900">Upload Center</h1>
        <p className="text-sm text-slate-500 mt-1">Upload carrier reports for processing</p>
      </header>

      <div className="p-8 space-y-8">
        {/* Upload Section */}
        <div className="bg-white border border-slate-200 p-6">
          <h2 className="font-heading font-semibold text-lg text-slate-900 mb-4">
            Upload Carrier Report
          </h2>

          {/* Carrier Selection */}
          <div className="mb-6">
            <label className="form-label mb-2 block">Select Carrier</label>
            <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
              <SelectTrigger className="w-full max-w-md" data-testid="carrier-select">
                <SelectValue placeholder="Choose a carrier..." />
              </SelectTrigger>
              <SelectContent>
                {carriers.map((carrier) => (
                  <SelectItem key={carrier.id} value={carrier.id}>
                    {carrier.name} ({carrier.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {carriers.length === 0 && (
              <p className="text-sm text-amber-600 mt-2">
                No carriers configured. Please add a carrier first.
              </p>
            )}
          </div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`dropzone ${isDragActive ? 'active' : ''} ${!selectedCarrier ? 'opacity-50 cursor-not-allowed' : ''}`}
            data-testid="upload-dropzone"
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="flex flex-col items-center">
                <div className="spinner mb-3" />
                <p className="text-sm text-slate-600">Processing file...</p>
                <p className="text-xs text-slate-400 mt-1">This may take a moment for large files</p>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-base text-slate-700 font-medium mb-1">
                  {isDragActive ? 'Drop the file here' : 'Drag & drop a file here'}
                </p>
                <p className="text-sm text-slate-500 mb-3">
                  or click to browse
                </p>
                <div className="flex items-center gap-2 justify-center text-xs text-slate-400">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Excel (.xlsx, .xls), PDF, or CSV</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Recent Uploads */}
        <div className="bg-white border border-slate-200">
          <div className="px-4 py-3 border-b border-slate-200">
            <h2 className="font-heading font-semibold text-slate-900">Recent Uploads</h2>
          </div>

          {uploads.length > 0 ? (
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Carrier</th>
                  <th>Records</th>
                  <th>Conflicts</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {uploads.map((upload) => (
                  <tr key={upload.id} data-testid={`upload-row-${upload.id}`}>
                    <td>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="font-mono text-xs truncate max-w-[200px]">
                          {upload.filename}
                        </span>
                      </div>
                    </td>
                    <td>{upload.carrier_name}</td>
                    <td className="font-mono">{upload.total_records}</td>
                    <td>
                      {upload.conflict_count > 0 ? (
                        <span className="text-red-600 font-medium">{upload.conflict_count}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td><StatusBadge status={upload.status} /></td>
                    <td className="text-xs text-slate-500">
                      {new Date(upload.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <Upload className="empty-state-icon" />
              <p className="empty-state-title">No uploads yet</p>
              <p className="empty-state-description">Upload your first carrier report above</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
