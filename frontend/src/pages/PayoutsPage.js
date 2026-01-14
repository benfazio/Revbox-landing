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
import { DollarSign, Check, TrendingUp } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StatusBadge = ({ status }) => {
  const statusClasses = {
    pending: 'status-pending',
    completed: 'status-completed'
  };

  return (
    <Badge variant="outline" className={`${statusClasses[status] || 'status-pending'} text-xs font-medium`}>
      {status}
    </Badge>
  );
};

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, [statusFilter, agentFilter]);

  const fetchData = async () => {
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (agentFilter !== 'all') params.agent_id = agentFilter;

      const [payoutsRes, agentsRes] = await Promise.all([
        axios.get(`${API}/payouts`, { params }),
        axios.get(`${API}/agents`)
      ]);
      setPayouts(payoutsRes.data);
      setAgents(agentsRes.data);
    } catch (error) {
      toast.error('Failed to fetch payouts');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (payoutId) => {
    try {
      await axios.put(`${API}/payouts/${payoutId}/complete`);
      toast.success('Payout marked as completed');
      fetchData();
    } catch (error) {
      toast.error('Failed to update payout');
    }
  };

  // Calculate totals
  const totals = payouts.reduce(
    (acc, p) => ({
      amount: acc.amount + p.amount,
      commission: acc.commission + p.commission,
      pending: acc.pending + (p.status === 'pending' ? p.amount : 0)
    }),
    { amount: 0, commission: 0, pending: 0 }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div data-testid="payouts-page">
      <header className="page-header">
        <h1 className="font-heading font-bold text-2xl tracking-tight text-slate-900">Payouts</h1>
        <p className="text-sm text-slate-500 mt-1">Track and manage agent payouts</p>
      </header>

      <div className="p-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="metric-value text-emerald-600">
                  ${totals.amount.toLocaleString()}
                </p>
                <p className="metric-label">Total Amount</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-md flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="metric-value text-blue-600">
                  ${totals.commission.toLocaleString()}
                </p>
                <p className="metric-label">Total Commission</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-md flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="metric-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="metric-value text-amber-600">
                  ${totals.pending.toLocaleString()}
                </p>
                <p className="metric-label">Pending Payouts</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-md flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="payout-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger className="w-48" data-testid="payout-agent-filter">
              <SelectValue placeholder="Agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {agents.map(agent => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Payouts Table */}
        {payouts.length > 0 ? (
          <div className="data-table-container">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Carrier</th>
                  <th>Policy #</th>
                  <th>Amount</th>
                  <th>Commission</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <tr key={payout.id} data-testid={`payout-row-${payout.id}`}>
                    <td className="font-medium text-slate-900">{payout.agent_name}</td>
                    <td>{payout.carrier_name}</td>
                    <td className="font-mono text-xs">{payout.policy_number || '-'}</td>
                    <td className="font-mono text-emerald-600">
                      ${payout.amount.toLocaleString()}
                    </td>
                    <td className="font-mono text-blue-600">
                      ${payout.commission.toLocaleString()}
                    </td>
                    <td><StatusBadge status={payout.status} /></td>
                    <td className="text-xs text-slate-500">
                      {new Date(payout.payout_date).toLocaleDateString()}
                    </td>
                    <td>
                      {payout.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleComplete(payout.id)}
                          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          data-testid={`complete-payout-${payout.id}`}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Complete
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <DollarSign className="empty-state-icon" />
            <p className="empty-state-title">No payouts</p>
            <p className="empty-state-description">
              Generate payouts from validated records in Data Review
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
