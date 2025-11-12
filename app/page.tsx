'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'

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

  const handleSiteChange = (siteId: string) => {
    const site = sites.find(s => s.id === siteId)
    setSelectedSite(site || null)
    setStaffAttendance({})
    setDlAttendance({})
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
          staffAttendance: selectedSite.staff.map(staff => ({
            staffId: staff.id,
            present: staffAttendance[staff.id] || false,
          })),
          dlAttendance: selectedSite.dls.map(dl => ({
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
    } catch (error) {
      console.error('Error submitting attendance:', error)
      toast.error('Failed to submit attendance')
    } finally {
      setLoading(false)
    }
  }

  const staffPresentCount = selectedSite?.staff.filter(s => staffAttendance[s.id]).length || 0
  const dlPresentCount = selectedSite?.dls.filter(d => dlAttendance[d.id]).length || 0

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Entoto Peacock Manpower Follow-Up Sheet</h1>
          <Link 
            href="/dashboard"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Dashboard
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
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
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Staff Attendance</h2>
                  <span className="text-sm text-gray-600">
                    Present: {staffPresentCount} / {selectedSite.staff.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {selectedSite.staff.map(staff => (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => toggleStaffAttendance(staff.id)}
                      className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                        staffAttendance[staff.id]
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {staff.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">DL Attendance</h2>
                  <span className="text-sm text-gray-600">
                    Present: {dlPresentCount} / {selectedSite.dls.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {selectedSite.dls.map(dl => (
                    <button
                      key={dl.id}
                      type="button"
                      onClick={() => toggleDlAttendance(dl.id)}
                      className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                        dlAttendance[dl.id]
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {dl.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
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
