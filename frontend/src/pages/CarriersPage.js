import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Building2, Plus, Settings, Trash2, ArrowRight } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CarriersPage() {
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    primary_key_fields: [],
    field_mappings: {}
  });

  useEffect(() => {
    fetchCarriers();
  }, []);

  const fetchCarriers = async () => {
    try {
      const response = await axios.get(`${API}/carriers`);
      setCarriers(response.data);
    } catch (error) {
      toast.error('Failed to fetch carriers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCarrier) {
        await axios.put(`${API}/carriers/${editingCarrier.id}`, formData);
        toast.success('Carrier updated');
      } else {
        await axios.post(`${API}/carriers`, formData);
        toast.success('Carrier created');
      }
      fetchCarriers();
      closeDialog();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save carrier');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this carrier? This cannot be undone.')) return;
    try {
      await axios.delete(`${API}/carriers/${id}`);
      toast.success('Carrier deleted');
      fetchCarriers();
    } catch (error) {
      toast.error('Failed to delete carrier');
    }
  };

  const openDialog = (carrier = null) => {
    if (carrier) {
      setEditingCarrier(carrier);
      setFormData({
        name: carrier.name,
        code: carrier.code,
        description: carrier.description,
        primary_key_fields: carrier.primary_key_fields,
        field_mappings: carrier.field_mappings
      });
    } else {
      setEditingCarrier(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        primary_key_fields: [],
        field_mappings: {}
      });
    }
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingCarrier(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div data-testid="carriers-page">
      <header className="page-header flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl tracking-tight text-slate-900">Carriers</h1>
          <p className="text-sm text-slate-500 mt-1">Manage insurance carriers and field mappings</p>
        </div>
        <Button onClick={() => openDialog()} className="btn-primary" data-testid="add-carrier-btn">
          <Plus className="w-4 h-4 mr-2" />
          Add Carrier
        </Button>
      </header>

      <div className="p-8">
        {carriers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {carriers.map((carrier) => (
              <div 
                key={carrier.id} 
                className="bg-white border border-slate-200 p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-200"
                data-testid={`carrier-card-${carrier.code}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-md flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-slate-600" />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openDialog(carrier)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                      data-testid={`edit-carrier-${carrier.code}`}
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(carrier.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      data-testid={`delete-carrier-${carrier.code}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-heading font-semibold text-lg text-slate-900">{carrier.name}</h3>
                <p className="text-sm text-slate-500 font-mono mt-1">{carrier.code}</p>
                
                {carrier.description && (
                  <p className="text-sm text-slate-600 mt-3 line-clamp-2">{carrier.description}</p>
                )}

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      {Object.keys(carrier.field_mappings).length} field mappings
                    </span>
                    <Link 
                      to={`/carriers/${carrier.id}`}
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                      data-testid={`view-carrier-${carrier.code}`}
                    >
                      Configure <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Building2 className="empty-state-icon" />
            <p className="empty-state-title">No carriers yet</p>
            <p className="empty-state-description">Add your first insurance carrier to start processing reports</p>
            <Button onClick={() => openDialog()} className="btn-primary mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Add Carrier
            </Button>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingCarrier ? 'Edit Carrier' : 'Add New Carrier'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Carrier Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., State Farm"
                required
                data-testid="carrier-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Carrier Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., STFM"
                required
                className="font-mono"
                data-testid="carrier-code-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this carrier..."
                rows={3}
                data-testid="carrier-description-input"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" className="btn-primary" data-testid="save-carrier-btn">
                {editingCarrier ? 'Update' : 'Create'} Carrier
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
