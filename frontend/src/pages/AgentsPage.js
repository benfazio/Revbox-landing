import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Users, Plus, Edit2, Trash2, DollarSign } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AgentsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    agent_code: '',
    email: '',
    phone: '',
    address: '',
    commission_rate: 0
  });

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await axios.get(`${API}/agents`);
      setAgents(response.data);
    } catch (error) {
      toast.error('Failed to fetch agents');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAgent) {
        await axios.put(`${API}/agents/${editingAgent.id}`, formData);
        toast.success('Agent updated');
      } else {
        await axios.post(`${API}/agents`, formData);
        toast.success('Agent created');
      }
      fetchAgents();
      closeDialog();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save agent');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this agent?')) return;
    try {
      await axios.delete(`${API}/agents/${id}`);
      toast.success('Agent deleted');
      fetchAgents();
    } catch (error) {
      toast.error('Failed to delete agent');
    }
  };

  const openDialog = (agent = null) => {
    if (agent) {
      setEditingAgent(agent);
      setFormData({
        name: agent.name,
        agent_code: agent.agent_code,
        email: agent.email,
        phone: agent.phone,
        address: agent.address,
        commission_rate: agent.commission_rate
      });
    } else {
      setEditingAgent(null);
      setFormData({
        name: '',
        agent_code: '',
        email: '',
        phone: '',
        address: '',
        commission_rate: 0
      });
    }
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingAgent(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div data-testid="agents-page">
      <header className="page-header flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl tracking-tight text-slate-900">Agents</h1>
          <p className="text-sm text-slate-500 mt-1">Manage agent records and payouts</p>
        </div>
        <Button onClick={() => openDialog()} className="btn-primary" data-testid="add-agent-btn">
          <Plus className="w-4 h-4 mr-2" />
          Add Agent
        </Button>
      </header>

      <div className="p-8">
        {agents.length > 0 ? (
          <div className="data-table-container">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>Agent Code</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Commission Rate</th>
                  <th>Total Payouts</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.id} data-testid={`agent-row-${agent.agent_code}`}>
                    <td className="font-mono font-medium">{agent.agent_code}</td>
                    <td className="font-medium text-slate-900">{agent.name}</td>
                    <td>{agent.email || '-'}</td>
                    <td>{agent.phone || '-'}</td>
                    <td>{agent.commission_rate}%</td>
                    <td className="font-mono">
                      <span className="flex items-center gap-1 text-emerald-600">
                        <DollarSign className="w-3 h-3" />
                        {agent.total_payouts.toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openDialog(agent)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          data-testid={`edit-agent-${agent.agent_code}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(agent.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          data-testid={`delete-agent-${agent.agent_code}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Users className="empty-state-icon" />
            <p className="empty-state-title">No agents yet</p>
            <p className="empty-state-description">Add agents to track payouts and commissions</p>
            <Button onClick={() => openDialog()} className="btn-primary mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Add Agent
            </Button>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md" aria-describedby="agent-dialog-desc">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingAgent ? 'Edit Agent' : 'Add New Agent'}
            </DialogTitle>
            <p id="agent-dialog-desc" className="sr-only">
              {editingAgent ? 'Edit agent details' : 'Create a new agent record'}
            </p>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Smith"
                  required
                  data-testid="agent-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agent_code">Agent Code</Label>
                <Input
                  id="agent_code"
                  value={formData.agent_code}
                  onChange={(e) => setFormData({ ...formData, agent_code: e.target.value })}
                  placeholder="AGT001"
                  required
                  className="font-mono"
                  data-testid="agent-code-input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="agent@example.com"
                data-testid="agent-email-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  data-testid="agent-phone-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                <Input
                  id="commission_rate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
                  data-testid="agent-commission-input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St, City, State"
                data-testid="agent-address-input"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" className="btn-primary" data-testid="save-agent-btn">
                {editingAgent ? 'Update' : 'Create'} Agent
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
