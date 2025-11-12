'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface Staff {
  id: string
  name: string
}

interface DL {
  id: string
  name: string
}

interface Site {
  id: string
  name: string
  staff: Staff[]
  dls: DL[]
}

export default function Home() {
  const [date, setDate] = useState('')
  const [sites, setSites] = useState<Site[]>([])
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [staffAttendance, setStaffAttendance] = useState<Record<string, boolean>>({})
  const [dlAttendance, setDlAttendance] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [availableStaff, setAvailableStaff] = useState<Staff[]>([])
  const [availableDls, setAvailableDls] = useState<DL[]>([])
  const [rosterLoading, setRosterLoading] = useState(false)
  const [rosterNotice, setRosterNotice] = useState<string | null>(null)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    setDate(today)

    fetchSites()
  }, [])

  const fetchSites = async () => {
    try {
      const response = await fetch('/api/sites')
      const data = await response.json()
      setSites(data)
    } catch (error) {
      console.error('Error fetching sites:', error)
      toast.error('Failed to fetch sites')
    }
  }

  const loadRoster = async (site: Site, targetDate: string) => {
    setRosterLoading(true)
    setRosterNotice(null)

    try {
      const params = new URLSearchParams({ siteId: site.id, date: targetDate })
      const response = await fetch(`/api/roster?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`Roster fetch failed with status ${response.status}`)
      }

      const data: { staffIds?: string[]; dlIds?: string[] } = await response.json()

      const staffIds = Array.isArray(data.staffIds) ? data.staffIds : []
      const dlIds = Array.isArray(data.dlIds) ? data.dlIds : []
      const hasAssignments = staffIds.length > 0 || dlIds.length > 0

      const nextStaff = hasAssignments
        ? site.staff.filter(member => staffIds.includes(member.id))
        : site.staff
      const nextDls = hasAssignments
        ? site.dls.filter(member => dlIds.includes(member.id))
        : site.dls

      setAvailableStaff(nextStaff)
      setAvailableDls(nextDls)
      setStaffAttendance(() => {
        const attendance: Record<string, boolean> = {}
        nextStaff.forEach(member => {
          attendance[member.id] = false
        })
        return attendance
      })
      setDlAttendance(() => {
        const attendance: Record<string, boolean> = {}
        nextDls.forEach(member => {
          attendance[member.id] = false
        })
        return attendance
      })

      if (!hasAssignments) {
        setRosterNotice('No roster configured for this date. Showing all members.')
      } else {
        setRosterNotice(null)
      }
    } catch (error) {
      console.error('Error loading roster:', error)
      setRosterNotice('Unable to load roster; showing all members.')
      setAvailableStaff(site.staff)
      setAvailableDls(site.dls)
      setStaffAttendance(() => {
        const attendance: Record<string, boolean> = {}
        site.staff.forEach(member => {
          attendance[member.id] = false
        })
        return attendance
      })
      setDlAttendance(() => {
        const attendance: Record<string, boolean> = {}
        site.dls.forEach(member => {
          attendance[member.id] = false
        })
        return attendance
      })
    } finally {
      setRosterLoading(false)
    }
  }

  const handleSiteChange = (siteId: string) => {
    const site = sites.find(s => s.id === siteId)
    setSelectedSite(site || null)
    setStaffAttendance({})
    setDlAttendance({})
    if (site && date) {
      setAvailableStaff(site.staff)
      setAvailableDls(site.dls)
      setRosterNotice(null)
      void loadRoster(site, date)
    } else {
      setAvailableStaff([])
      setAvailableDls([])
      setRosterNotice(null)
    }
  }

  const toggleStaffAttendance = (staffId: string) => {
    setStaffAttendance(prev => ({
      ...prev,
      [staffId]: !prev[staffId]
    }))
  }

  const toggleDlAttendance = (dlId: string) => {
    setDlAttendance(prev => ({
      ...prev,
      [dlId]: !prev[dlId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedSite) {
      toast.error('Please select a site')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          siteId: selectedSite.id,
          staffAttendance: availableStaff.map(staff => ({
            staffId: staff.id,
            present: staffAttendance[staff.id] || false,
          })),
          dlAttendance: availableDls.map(dl => ({
            dlId: dl.id,
            present: dlAttendance[dl.id] || false,
          })),
        }),
      })

      if (!response.ok) throw new Error('Failed to submit attendance')

      toast.success('Attendance submitted successfully!')
      setSelectedSite(null)
      setStaffAttendance({})
      setDlAttendance({})
      setAvailableStaff([])
      setAvailableDls([])
      setRosterNotice(null)
    } catch (error) {
      console.error('Error submitting attendance:', error)
      toast.error('Failed to submit attendance')
    } finally {
      setLoading(false)
    }
  }

  const staffPresentCount = availableStaff.filter(staff => staffAttendance[staff.id]).length
  const dlPresentCount = availableDls.filter(dl => dlAttendance[dl.id]).length

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Entoto Peacock Manpower Follow-Up Sheet</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                const newDate = e.target.value
                setDate(newDate)
                if (selectedSite) {
                  void loadRoster(selectedSite, newDate)
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Site Location</label>
            <select
              value={selectedSite?.id || ''}
              onChange={(e) => handleSiteChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="">Select a site</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
          </div>

          {selectedSite && (
            <>
              {rosterLoading && (
                <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  Updating roster...
                </div>
              )}
              {rosterNotice && (
                <div className="rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                  {rosterNotice}
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Staff Attendance</h2>
                  <span className="text-sm text-gray-600">
                    Present: {staffPresentCount} / {availableStaff.length}
                  </span>
                </div>
                {availableStaff.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {availableStaff.map(staff => (
                      <button
                        key={staff.id}
                        type="button"
                        onClick={() => toggleStaffAttendance(staff.id)}
                        disabled={rosterLoading}
                        className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                          staffAttendance[staff.id]
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400'
                        } ${rosterLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {staff.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">No staff expected for this date.</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">DL Attendance</h2>
                  <span className="text-sm text-gray-600">
                    Present: {dlPresentCount} / {availableDls.length}
                  </span>
                </div>
                {availableDls.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {availableDls.map(dl => (
                      <button
                        key={dl.id}
                        type="button"
                        onClick={() => toggleDlAttendance(dl.id)}
                        disabled={rosterLoading}
                        className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                          dlAttendance[dl.id]
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400'
                        } ${rosterLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {dl.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">No DLs expected for this date.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || rosterLoading}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Attendance'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
