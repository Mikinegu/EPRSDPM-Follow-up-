'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import Image from 'next/image'

interface Member {
  id: string
  name: string
}

interface Site {
  id: string
  name: string
  staff: Member[]
  dls: Member[]
  skilled: Member[]
}

export default function Home() {
  const [date, setDate] = useState('')
  const [sites, setSites] = useState<Site[]>([])
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [staffAttendance, setStaffAttendance] = useState<Record<string, boolean>>({})
  const [dlAttendance, setDlAttendance] = useState<Record<string, boolean>>({})
  const [skilledAttendance, setSkilledAttendance] = useState<Record<string, boolean>>({})
  const [overtimeHours, setOvertimeHours] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [availableStaff, setAvailableStaff] = useState<Member[]>([])
  const [availableDls, setAvailableDls] = useState<Member[]>([])
  const [availableSkilled, setAvailableSkilled] = useState<Member[]>([])
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

      const data: { staffIds?: string[]; dlIds?: string[]; skilledIds?: string[] } = await response.json()

      const staffIds = Array.isArray(data.staffIds) ? data.staffIds : []
      const dlIds = Array.isArray(data.dlIds) ? data.dlIds : []
      const skilledIds = Array.isArray(data.skilledIds) ? data.skilledIds : []
      const hasAssignments = staffIds.length > 0 || dlIds.length > 0 || skilledIds.length > 0

      const nextStaff = hasAssignments
        ? site.staff.filter(member => staffIds.includes(member.id))
        : site.staff
      const nextDls = hasAssignments
        ? site.dls.filter(member => dlIds.includes(member.id))
        : site.dls
      const nextSkilled = hasAssignments
        ? site.skilled.filter(member => skilledIds.includes(member.id))
        : site.skilled

      setAvailableStaff(nextStaff)
      setAvailableDls(nextDls)
      setAvailableSkilled(nextSkilled)
      setOvertimeHours({})
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
      setSkilledAttendance(() => {
        const attendance: Record<string, boolean> = {}
        nextSkilled.forEach(member => {
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
      setAvailableSkilled(site.skilled)
      setOvertimeHours({})
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
      setSkilledAttendance(() => {
        const attendance: Record<string, boolean> = {}
        site.skilled.forEach(member => {
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
    setSkilledAttendance({})
    setOvertimeHours({})
    if (site && date) {
      setAvailableStaff(site.staff)
      setAvailableDls(site.dls)
      setAvailableSkilled(site.skilled)
      setRosterNotice(null)
      void loadRoster(site, date)
    } else {
      setAvailableStaff([])
      setAvailableDls([])
      setAvailableSkilled([])
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

  const handleOvertimeChange = (memberId: string, value: string) => {
    setOvertimeHours(prev => ({
      ...prev,
      [memberId]: Number(value),
    }))
  }

  const toggleSkilledAttendance = (skilledId: string) => {
    setSkilledAttendance(prev => ({
      ...prev,
      [skilledId]: !prev[skilledId]
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
            overtimeHours: overtimeHours[staff.id] || 0,
          })),
          dlAttendance: availableDls.map(dl => ({
            dlId: dl.id,
            present: dlAttendance[dl.id] || false,
            overtimeHours: overtimeHours[dl.id] || 0,
          })),
          skilledAttendance: availableSkilled.map(skilled => ({
            skilledId: skilled.id,
            present: skilledAttendance[skilled.id] || false,
            overtimeHours: overtimeHours[skilled.id] || 0,
          })),
        }),
      })

      if (!response.ok) throw new Error('Failed to submit attendance')

      toast.success('Attendance submitted successfully!')
      setSelectedSite(null)
      setStaffAttendance({})
      setDlAttendance({})
      setSkilledAttendance({})
      setOvertimeHours({})
      setAvailableStaff([])
      setAvailableDls([])
      setAvailableSkilled([])
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
  const skilledPresentCount = availableSkilled.filter(skilled => skilledAttendance[skilled.id]).length

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 text-center">
          <Image
            src="/logo.jpg"
            alt="Entoto Peacock Logo"
            width={650}
            height={125}
            priority
            className="mx-auto"
          />
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
          Entoto peacock river side development project
          </h1>
          <h1 className="mt-4 text-3xl font-bold text-gray-900"> manpower follow up sheet</h1>
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
                  <div className="space-y-3">
                    {availableStaff.map((staff) => (
                      <label
                        key={staff.id}
                        className="flex items-center justify-between p-4 rounded-lg transition-colors cursor-pointer bg-white border-2 border-gray-300 has-[:checked]:bg-green-50 has-[:checked]:border-green-500"
                      >
                        <span className="font-medium text-gray-800">{staff.name}</span>
                        <div className="flex items-center gap-4">
                          <input
                            type="number"
                            value={overtimeHours[staff.id] || ''}
                            onChange={(e) => handleOvertimeChange(staff.id, e.target.value)}
                            disabled={!staffAttendance[staff.id]}
                            className="w-20 px-2 py-1 border border-gray-300 rounded-md disabled:opacity-50"
                            placeholder="OT"
                          />
                          <input
                            type="checkbox"
                            checked={staffAttendance[staff.id] || false}
                            onChange={() => toggleStaffAttendance(staff.id)}
                            disabled={rosterLoading}
                            className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-70 disabled:cursor-not-allowed"
                          />
                        </div>
                      </label>
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
                  <div className="space-y-3">
                    {availableDls.map((dl) => (
                      <label
                        key={dl.id}
                        className="flex items-center justify-between p-4 rounded-lg transition-colors cursor-pointer bg-white border-2 border-gray-300 has-[:checked]:bg-green-50 has-[:checked]:border-green-500"
                      >
                        <span className="font-medium text-gray-800">{dl.name}</span>
                        <div className="flex items-center gap-4">
                          <input
                            type="number"
                            value={overtimeHours[dl.id] || ''}
                            onChange={(e) => handleOvertimeChange(dl.id, e.target.value)}
                            disabled={!dlAttendance[dl.id]}
                            className="w-20 px-2 py-1 border border-gray-300 rounded-md disabled:opacity-50"
                            placeholder="OT"
                          />
                          <input
                            type="checkbox"
                            checked={dlAttendance[dl.id] || false}
                            onChange={() => toggleDlAttendance(dl.id)}
                            disabled={rosterLoading}
                            className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-70 disabled:cursor-not-allowed"
                          />
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">No DLs expected for this date.</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Skilled Attendance</h2>
                  <span className="text-sm text-gray-600">
                    Present: {skilledPresentCount} / {availableSkilled.length}
                  </span>
                </div>
                {availableSkilled.length > 0 ? (
                  <div className="space-y-3">
                    {availableSkilled.map((skilled) => (
                      <label
                        key={skilled.id}
                        className="flex items-center justify-between p-4 rounded-lg transition-colors cursor-pointer bg-white border-2 border-gray-300 has-[:checked]:bg-green-50 has-[:checked]:border-green-500"
                      >
                        <span className="font-medium text-gray-800">{skilled.name}</span>
                        <div className="flex items-center gap-4">
                          <input
                            type="number"
                            value={overtimeHours[skilled.id] || ''}
                            onChange={(e) => handleOvertimeChange(skilled.id, e.target.value)}
                            disabled={!skilledAttendance[skilled.id]}
                            className="w-20 px-2 py-1 border border-gray-300 rounded-md disabled:opacity-50"
                            placeholder="OT"
                          />
                          <input
                            type="checkbox"
                            checked={skilledAttendance[skilled.id] || false}
                            onChange={() => toggleSkilledAttendance(skilled.id)}
                            disabled={rosterLoading}
                            className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-70 disabled:cursor-not-allowed"
                          />
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">No skilled workers expected for this date.</p>
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
