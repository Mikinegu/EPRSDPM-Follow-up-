'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface AttendanceRecord {
  id: string
  date: string
  site: {
    id: string
    name: string
  }
  staffAttendance: Array<{ present: boolean }>
  dlAttendance: Array<{ present: boolean }>
}

interface StaffMember {
  id: string
  name: string
  site: {
    name: string
  }
  attendance: Array<{
    present: boolean
    attendanceRecord: {
      date: string
    }
  }>
}

interface DLMember {
  id: string
  name: string
  site: {
    name: string
  }
  attendance: Array<{
    present: boolean
    attendanceRecord: {
      date: string
    }
  }>
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'forms' | 'staff' | 'dl'>('forms')
  const [formRecords, setFormRecords] = useState<AttendanceRecord[]>([])
  const [staffData, setStaffData] = useState<StaffMember[]>([])
  const [dlData, setDlData] = useState<DLMember[]>([])
  const [dateFilter, setDateFilter] = useState('')
  const [siteFilter, setSiteFilter] = useState('')
  const [sites, setSites] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchSites()
  }, [])

  useEffect(() => {
    fetchData()
  }, [activeTab, dateFilter, siteFilter])

  const fetchSites = async () => {
    try {
      const response = await fetch('/api/sites')
      const data = await response.json()
      setSites(data)
    } catch (error) {
      console.error('Error fetching sites:', error)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateFilter) params.append('date', dateFilter)
      if (siteFilter) params.append('site', siteFilter)

      if (activeTab === 'forms') {
        const response = await fetch(`/api/dashboard?${params}`)
        const data = await response.json()
        setFormRecords(data)
      } else if (activeTab === 'staff') {
        params.append('view', 'staff')
        const response = await fetch(`/api/dashboard?${params}`)
        const data = await response.json()
        setStaffData(data)
      } else if (activeTab === 'dl') {
        params.append('view', 'dl')
        const response = await fetch(`/api/dashboard?${params}`)
        const data = await response.json()
        setDlData(data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Attendance Dashboard</h1>
          <Link 
            href="/"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Back to Form
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Date</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Site</label>
              <select
                value={siteFilter}
                onChange={(e) => setSiteFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Sites</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setDateFilter('')
                  setSiteFilter('')
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          <div className="border-b border-gray-200">
            <nav className="flex space-x-4">
              <button
                onClick={() => setActiveTab('forms')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'forms'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Form List
              </button>
              <button
                onClick={() => setActiveTab('staff')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'staff'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Staff Attendance
              </button>
              <button
                onClick={() => setActiveTab('dl')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'dl'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                DL Attendance
              </button>
            </nav>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {activeTab === 'forms' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Present</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DL Present</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formRecords.map((record) => {
                      const staffPresent = record.staffAttendance.filter(a => a.present).length
                      const staffTotal = record.staffAttendance.length
                      const dlPresent = record.dlAttendance.filter(a => a.present).length
                      const dlTotal = record.dlAttendance.length

                      return (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.site.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className="text-green-600 font-medium">{staffPresent}</span> / {staffTotal}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className="text-green-600 font-medium">{dlPresent}</span> / {dlTotal}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {formRecords.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No attendance records found
                  </div>
                )}
              </div>
            )}

            {activeTab === 'staff' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance History</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {staffData.map((staff) => (
                      <tr key={staff.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{staff.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{staff.site.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {staff.attendance.length === 0 ? (
                            <span className="text-gray-500">No records</span>
                          ) : (
                            <div className="space-y-1">
                              {staff.attendance.slice(0, 5).map((record, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <span className="text-gray-600">{record.attendanceRecord.date}:</span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    record.present ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {record.present ? 'Present' : 'Absent'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {staffData.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No staff records found
                  </div>
                )}
              </div>
            )}

            {activeTab === 'dl' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DL Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance History</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dlData.map((dl) => (
                      <tr key={dl.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dl.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{dl.site.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {dl.attendance.length === 0 ? (
                            <span className="text-gray-500">No records</span>
                          ) : (
                            <div className="space-y-1">
                              {dl.attendance.slice(0, 5).map((record, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <span className="text-gray-600">{record.attendanceRecord.date}:</span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    record.present ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {record.present ? 'Present' : 'Absent'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {dlData.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No DL records found
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
