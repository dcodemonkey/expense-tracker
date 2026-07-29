import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import {
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
  MapPin,
  ExternalLink,
  Receipt,
  Search,
  Users,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface AdminUser {
  id: number
  email: string
  full_name: string | null
  phone_number: string | null
  role: string
  is_active: boolean
  is_verified: boolean
  last_location: string | null
  latitude: number | null
  longitude: number | null
  last_location_updated_at: string | null
  created_at: string | null
  transaction_count: number
}

export default function AdminUsers() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const queryClient = useQueryClient()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUserTxns, setSelectedUserTxns] = useState<{ userId: number; email: string } | null>(null)

  // Fetch all users list for Admin
  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ['admin-users-list'],
    queryFn: async () => {
      const res = await adminApi.getUsers()
      return res.data
    },
    enabled: isAdmin,
  })

  // Fetch transactions for selected user drilldown
  const { data: userTxns = [], isLoading: isLoadingTxns } = useQuery({
    queryKey: ['admin-user-transactions', selectedUserTxns?.userId],
    queryFn: async () => {
      if (!selectedUserTxns) return []
      const res = await adminApi.getUserTransactions(selectedUserTxns.userId)
      return res.data
    },
    enabled: !!selectedUserTxns && isAdmin,
  })

  // Mutation: Update Role (Grant/Revoke Admin)
  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) => adminApi.updateRole(userId, role),
    onSuccess: () => {
      toast.success('User permissions updated successfully')
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] })
    },
    onError: () => {
      toast.error('Failed to update user permissions')
    },
  })

  // Mutation: Update Active Status (Block/Activate Account)
  const statusMutation = useMutation({
    mutationFn: ({ userId, is_active }: { userId: number; is_active: boolean }) =>
      adminApi.updateStatus(userId, is_active),
    onSuccess: () => {
      toast.success('User account status updated')
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] })
    },
    onError: () => {
      toast.error('Failed to update account status')
    },
  })

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Shield className="w-16 h-16 text-flame animate-bounce" />
        <h2 className="text-2xl font-bold text-text-hi">Access Restricted</h2>
        <p className="text-text-lo max-w-md">
          You must have Administrator privileges to access the User Management & Permissions Console.
        </p>
      </div>
    )
  }

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.phone_number && u.phone_number.includes(searchTerm))
  )

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-7 h-7 text-mint" />
            <h1 className="text-2xl sm:text-3xl font-bold text-text-hi font-display">User Management & Permissions</h1>
          </div>
          <p className="text-sm text-text-lo mt-1">
            Admin Portal • Inspect user profiles, update permissions, and audit activity.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-lo" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-2 border border-hairline rounded-xl text-sm text-text-hi placeholder-text-lo focus:outline-none focus:border-mint transition-colors"
          />
        </div>
      </div>

      {/* Stats Quick Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-surface-2 border border-hairline rounded-2xl">
          <span className="text-xs text-text-lo font-medium block">Total Users</span>
          <span className="text-2xl font-bold text-text-hi font-display">{users.length}</span>
        </div>
        <div className="p-4 bg-surface-2 border border-hairline rounded-2xl">
          <span className="text-xs text-text-lo font-medium block">Administrators</span>
          <span className="text-2xl font-bold text-mint font-display">
            {users.filter((u) => u.role === 'admin').length}
          </span>
        </div>
        <div className="p-4 bg-surface-2 border border-hairline rounded-2xl">
          <span className="text-xs text-text-lo font-medium block">Active Accounts</span>
          <span className="text-2xl font-bold text-emerald-400 font-display">
            {users.filter((u) => u.is_active).length}
          </span>
        </div>
        <div className="p-4 bg-surface-2 border border-hairline rounded-2xl">
          <span className="text-xs text-text-lo font-medium block">Verified Emails</span>
          <span className="text-2xl font-bold text-amber font-display">
            {users.filter((u) => u.is_verified).length}
          </span>
        </div>
      </div>

      {/* Main Users Table */}
      <div className="bg-surface-2 border border-hairline rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-text-lo space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-mint/20 border-t-mint mx-auto" />
            <p className="text-sm">Loading platform users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-text-lo">No users found matching your search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-hairline bg-surface-3/50 text-xs font-semibold text-text-lo uppercase tracking-wider">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Role & Permission</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4 text-center">Transactions</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline/60">
                {filteredUsers.map((u) => {
                  const mapsUrl = u.latitude && u.longitude ? `https://www.google.com/maps?q=${u.latitude},${u.longitude}` : null

                  return (
                    <tr key={u.id} className="hover:bg-surface-3/30 transition-colors">
                      {/* Name & Email */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-mint-soft text-mint font-bold flex items-center justify-center text-sm shrink-0">
                            {(u.full_name || u.email).substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-text-hi flex items-center gap-1.5">
                              {u.full_name || 'Unnamed User'}
                              {u.is_verified && (
                                <span className="text-[10px] px-1.5 py-0.2 bg-mint-soft text-mint rounded font-semibold">
                                  Verified
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-text-lo font-mono">{u.email}</div>
                            {u.phone_number && <div className="text-[11px] text-text-lo">{u.phone_number}</div>}
                          </div>
                        </div>
                      </td>

                      {/* Role & Permissions Toggle */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border ${
                              u.role === 'admin'
                                ? 'bg-mint-soft text-mint border-mint/30'
                                : 'bg-surface-3 text-text-lo border-hairline'
                            }`}
                          >
                            <Shield className="w-3.5 h-3.5" />
                            {u.role.toUpperCase()}
                          </span>

                          <button
                            onClick={() =>
                              roleMutation.mutate({
                                userId: u.id,
                                role: u.role === 'admin' ? 'user' : 'admin',
                              })
                            }
                            disabled={roleMutation.isPending}
                            className="px-2 py-1 text-[11px] font-medium text-text-lo hover:text-text-hi bg-surface-3 hover:bg-surface-1 border border-hairline rounded-lg transition-colors"
                            title="Click to toggle Admin / User role"
                          >
                            {u.role === 'admin' ? 'Make User' : 'Grant Admin'}
                          </button>
                        </div>
                      </td>

                      {/* Account Status Toggle */}
                      <td className="py-4 px-4">
                        <button
                          onClick={() =>
                            statusMutation.mutate({
                              userId: u.id,
                              is_active: !u.is_active,
                            })
                          }
                          disabled={statusMutation.isPending}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                            u.is_active
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-flame-soft text-flame border-flame/30 hover:bg-flame/20'
                          }`}
                        >
                          {u.is_active ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                          {u.is_active ? 'Active' : 'Blocked'}
                        </button>
                      </td>

                      {/* Location Indicator */}
                      <td className="py-4 px-4">
                        {u.last_location ? (
                          <div className="flex items-center gap-1.5 text-xs text-text-hi max-w-[180px]">
                            <MapPin className="w-3.5 h-3.5 text-mint shrink-0" />
                            <span className="truncate" title={u.last_location}>
                              {u.last_location}
                            </span>
                            {mapsUrl && (
                              <a
                                href={mapsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-mint hover:underline shrink-0"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-text-lo italic">No location recorded</span>
                        )}
                      </td>

                      {/* Transaction Count */}
                      <td className="py-4 px-4 text-center">
                        <span className="px-2.5 py-1 bg-surface-3 text-text-hi rounded-xl text-xs font-mono font-bold">
                          {u.transaction_count}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => setSelectedUserTxns({ userId: u.id, email: u.email })}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-mint-soft hover:bg-mint/20 text-mint text-xs font-semibold rounded-xl border border-mint/30 transition-colors"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          View Txns
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Transactions Modal */}
      {selectedUserTxns && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-2 border border-hairline rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-hairline flex items-center justify-between bg-surface-3/50">
              <div>
                <h3 className="text-lg font-bold text-text-hi font-display flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-mint" />
                  User Transactions: {selectedUserTxns.email}
                </h3>
                <p className="text-xs text-text-lo mt-0.5">Admin inspection modal</p>
              </div>
              <button
                onClick={() => setSelectedUserTxns(null)}
                className="p-1.5 text-text-lo hover:text-text-hi rounded-lg hover:bg-surface-3 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
              {isLoadingTxns ? (
                <div className="p-8 text-center text-text-lo">Loading user transactions...</div>
              ) : userTxns.length === 0 ? (
                <div className="p-8 text-center text-text-lo">This user has no recorded transactions.</div>
              ) : (
                <div className="space-y-2">
                  {userTxns.map((tx: any) => (
                    <div
                      key={tx.id}
                      className="p-3 bg-surface-3/60 border border-hairline/60 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-text-hi">
                          {tx.merchant_name || tx.description || 'Transaction'}
                        </div>
                        <div className="text-text-lo font-mono">
                          {tx.transaction_date} • {tx.type.toUpperCase()}
                        </div>
                      </div>
                      <div
                        className={`font-bold font-mono text-sm ${
                          tx.type === 'expense' ? 'text-flame' : 'text-emerald-400'
                        }`}
                      >
                        {tx.type === 'expense' ? '-' : '+'}₹{parseFloat(tx.amount).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-hairline flex justify-end">
              <button
                onClick={() => setSelectedUserTxns(null)}
                className="px-4 py-2 bg-surface-3 hover:bg-surface-1 text-text-hi text-xs font-semibold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
