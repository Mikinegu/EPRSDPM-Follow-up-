'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

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
  siteId: string
  site: {
    id: string
    name: string
  }
  attendance?: Array<{
    present: boolean
    attendanceRecord: {
      date: string
    }
  }>
}

interface DLMember {
  id: string
  name: string
  siteId: string
  site: {
    id: string
    name: string
  }
  attendance?: Array<{
    present: boolean
    attendanceRecord: {
      date: string
    }
  }>
}

interface Site {
  id: string
  name: string
  staff?: StaffMember[]
  dls?: DLMember[]
}

export default function AdminPanel() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'records' | 'staff' | 'dl' | 'sites'>('records')
  const [formRecords, setFormRecords] = useState<AttendanceRecord[]>([])
  const [staffData, setStaffData] = useState<StaffMember[]>([])
  const [dlData, setDlData] = useState<DLMember[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [dateFilter, setDateFilter] = useState('')
  const [siteFilter, setSiteFilter] = useState('')
  const [loading, setLoading] = useState(false)

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [formData, setFormData] = useState({ name: '', siteId: '' })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSites()
    }
  }, [status])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData()
    }
  }, [activeTab, dateFilter, siteFilter, status])

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

      if (activeTab === 'records') {
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
      } else if (activeTab === 'sites') {
        await fetchSites()
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!formData.name) {
      toast.error('Name is required')
      return
    }

    if ((activeTab === 'staff' || activeTab === 'dl') && !formData.siteId) {
      toast.error('Site is required')
      return
    }

    setLoading(true)
    try {
      const endpoint = activeTab === 'staff' ? '/api/admin/staff' : activeTab === 'dl' ? '/api/admin/dl' : '/api/admin/sites'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to add item')

      toast.success(`${activeTab === 'staff' ? 'Staff' : activeTab === 'dl' ? 'DL' : 'Site'} added successfully!`)
      setShowAddModal(false)
      setFormData({ name: '', siteId: '' })
      fetchData()
      fetchSites()
    } catch (error) {
      toast.error('Failed to add item')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!formData.name) {
      toast.error('Name is required')
      return
    }

    setLoading(true)
    try {
      const endpoint = activeTab === 'staff' ? '/api/admin/staff' : activeTab === 'dl' ? '/api/admin/dl' : '/api/admin/sites'
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, id: editingItem.id }),
      })

      if (!response.ok) throw new Error('Failed to update item')

      toast.success(`${activeTab === 'staff' ? 'Staff' : activeTab === 'dl' ? 'DL' : 'Site'} updated successfully!`)
      setEditingItem(null)
      setFormData({ name: '', siteId: '' })
      fetchData()
      fetchSites()
    } catch (error) {
      toast.error('Failed to update item')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    setLoading(true)
    try {
      const endpoint = activeTab === 'staff' ? '/api/admin/staff' : activeTab === 'dl' ? '/api/admin/dl' : '/api/admin/sites'
      const response = await fetch(`${endpoint}?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete item')

      toast.success(`${activeTab === 'staff' ? 'Staff' : activeTab === 'dl' ? 'DL' : 'Site'} deleted successfully!`)
      fetchData()
      fetchSites()
    } catch (error) {
      toast.error('Failed to delete item')
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setFormData({ name: '', siteId: '' })
    setEditingItem(null)
    setShowAddModal(true)
  }

  const openEditModal = (item: any) => {
    setFormData({ name: item.name, siteId: item.siteId || '' })
    setEditingItem(item)
    setShowAddModal(true)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-sm text-gray-600 mt-1">Welcome, {session?.user?.name}</p>
          </div>
          <div className="flex gap-2">
            <Link 
              href="/"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Attendance Form
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {(activeTab === 'records' || activeTab === 'staff' || activeTab === 'dl') && (
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
          )}

          <div className="border-b border-gray-200">
            <nav className="flex space-x-4">
              <button
                onClick={() => setActiveTab('records')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'records'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Attendance Records
              </button>
              <button
                onClick={() => setActiveTab('staff')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'staff'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Staff Management
              </button>
              <button
                onClick={() => setActiveTab('dl')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'dl'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                DL Management
              </button>
              <button
                onClick={() => setActiveTab('sites')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'sites'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Site Management
              </button>
            </nav>
          </div>
        </div>

        {(activeTab === 'staff' || activeTab === 'dl' || activeTab === 'sites') && (
          <div className="mb-4">
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Add {activeTab === 'staff' ? 'Staff' : activeTab === 'dl' ? 'DL' : 'Site'}
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {activeTab === 'records' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff Present</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DL Present</th>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {staffData.map((staff) => (
                      <tr key={staff.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{staff.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{staff.site.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <button
                            onClick={() => openEditModal(staff)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(staff.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {staffData.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No staff members found
                  </div>
                )}
              </div>
            )}

            {activeTab === 'dl' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dlData.map((dl) => (
                      <tr key={dl.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dl.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{dl.site.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <button
                            onClick={() => openEditModal(dl)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(dl.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {dlData.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No DL workers found
                  </div>
                )}
              </div>
            )}

            {activeTab === 'sites' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Site Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff Count</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DL Count</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sites.map((site) => (
                      <tr key={site.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{site.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{site.staff?.length || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{site.dls?.length || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <button
                            onClick={() => openEditModal(site)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(site.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {sites.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No sites found
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">
              {editingItem ? 'Edit' : 'Add'} {activeTab === 'staff' ? 'Staff' : activeTab === 'dl' ? 'DL' : 'Site'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter name"
                />
              </div>
              {(activeTab === 'staff' || activeTab === 'dl') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Site</label>
                  <select
                    value={formData.siteId}
                    onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a site</option>
                    {sites.map(site => (
                      <option key={site.id} value={site.id}>{site.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={editingItem ? handleEdit : handleAdd}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {editingItem ? 'Update' : 'Add'}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setEditingItem(null)
                  setFormData({ name: '', siteId: '' })
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
