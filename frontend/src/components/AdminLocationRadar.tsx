import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usersApi } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { Modal, Badge } from './ui'
import { Radar, MapPin, ExternalLink, RefreshCw, UserCheck, Landmark } from 'lucide-react'
import { formatDateTime } from '../lib/utils'
import type { User } from '../types'

export default function AdminLocationRadar() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [openModal, setOpenModal] = useState(false)

  const { data: allUsersData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-all-user-locations'],
    queryFn: async () => {
      const res = await usersApi.getAllLocations()
      return (res.data || []) as User[]
    },
    enabled: isAdmin && openModal,
    refetchInterval: openModal ? 15000 : false, // Auto-refresh radar every 15s when modal is open
  })

  if (!isAdmin) return null

  const users = allUsersData || []
  const activeLocationsCount = users.filter((u) => u.last_location).length

  return (
    <>
      <button
        onClick={() => setOpenModal(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-soft hover:bg-violet/20 text-violet rounded-xl text-xs font-semibold border border-violet/30 transition-all shadow-sm cursor-pointer"
        title="Admin Live Users Location Radar"
      >
        <Radar className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
        <span className="hidden sm:inline">Radar</span>
        <span className="bg-violet/20 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-violet">
          {activeLocationsCount}
        </span>
      </button>

      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title="📡 All Users Live Location Radar"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-surface-2 border border-hairline rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mint opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-mint"></span>
              </span>
              <span className="text-text-hi font-medium">
                Tracking {activeLocationsCount} of {users.length} registered user(s) live
              </span>
            </div>
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="px-2.5 py-1 bg-surface-3 hover:bg-surface border border-hairline rounded-lg text-text-hi flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-mint ${isRefetching ? 'animate-spin' : ''}`} />
              {isRefetching ? 'Refreshing…' : 'Refresh Radar'}
            </button>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-text-lo text-sm animate-pulse">
              Scanning GPS frequencies for active users…
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-text-lo text-sm">
              No registered users found in database.
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {users.map((u) => {
                const mapsUrl = u.latitude && u.longitude ? `https://www.google.com/maps?q=${u.latitude},${u.longitude}` : null
                const rawLoc = u.last_location || ''
                const hasLandmark = rawLoc.includes('(Near:')
                const cityArea = hasLandmark ? rawLoc.split('(Near:')[0].trim() : rawLoc
                const landmarkText = hasLandmark ? rawLoc.split('(Near:')[1].replace(')', '').trim() : null

                return (
                  <div
                    key={u.id}
                    className="p-4 border border-hairline rounded-2xl bg-surface-2 hover:border-mint/30 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="grid place-items-center w-10 h-10 rounded-xl bg-violet-soft text-violet font-bold text-sm">
                          {u.full_name ? u.full_name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-text-hi text-sm">
                              {u.full_name || 'User'}
                            </h3>
                            <Badge tone={u.role === 'admin' ? 'primary' : 'gray'}>
                              {u.role.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-xs text-text-lo">{u.email}</p>
                        </div>
                      </div>

                      {mapsUrl ? (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shrink-0 shadow-sm"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Track on Maps
                        </a>
                      ) : (
                        <span className="text-xs text-text-lo bg-surface-3 px-2.5 py-1 rounded-lg">
                          No GPS Signal
                        </span>
                      )}
                    </div>

                    {u.last_location ? (
                      <div className="space-y-2 pt-2 border-t border-hairline/60">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="text-mint font-medium flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-mint" />
                            {cityArea}
                          </span>
                          {u.latitude && u.longitude && (
                            <span className="text-text-lo font-mono text-[11px]">
                              ({Number(u.latitude).toFixed(5)}, {Number(u.longitude).toFixed(5)})
                            </span>
                          )}
                          {u.last_location_updated_at && (
                            <span className="text-text-lo text-[11px] ml-auto">
                              Pinged: {formatDateTime(u.last_location_updated_at)}
                            </span>
                          )}
                        </div>

                        {/* Separate Landmark Badge */}
                        {landmarkText && (
                          <div className="flex items-center gap-1.5 text-xs text-amber bg-amber-soft/30 px-2.5 py-1 rounded-lg border border-amber/20 w-fit font-medium">
                            <Landmark className="w-3.5 h-3.5 text-amber shrink-0" />
                            <span>Nearby Landmark: {landmarkText}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-text-lo/70 pt-2 border-t border-hairline/60 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 opacity-50" />
                        User registered (GPS tracking pending 1st transaction)
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
