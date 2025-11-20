'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'

type MemberRole = 'staff' | 'dl' | 'skilled'

interface SiteOption {
  id: string
  name: string
  staff: Array<{ id: string; name: string; isActive: boolean }>
  dls: Array<{ id: string; name: string; isActive: boolean }>
  skilled: Array<{ id: string; name: string; isActive: boolean }>
}

interface AttendanceRecord {
  id: string
  date: string
  site: {
    id: string
    name: string
  }
  staffAttendance: Array<{ present: boolean }>
  dlAttendance: Array<{ present: boolean }>
  skilledAttendance: Array<{ present: boolean }>
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

interface SkilledMember {
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

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'forms' | 'staff' | 'dl' | 'skilled'>('forms')
  const [formRecords, setFormRecords] = useState<AttendanceRecord[]>([])
  const [staffData, setStaffData] = useState<StaffMember[]>([])
  const [dlData, setDlData] = useState<DLMember[]>([])
  const [skilledData, setSkilledData] = useState<SkilledMember[]>([])
  const [dateFilter, setDateFilter] = useState('')
  const [siteFilter, setSiteFilter] = useState('')
  const [sites, setSites] = useState<SiteOption[]>([])
  const [loading, setLoading] = useState(false)
  const [rosterDate, setRosterDate] = useState<string>(() => new Date().toISOString().split('T')[0])
  const [rosterSiteId, setRosterSiteId] = useState('')
  const [rosterStaffSelection, setRosterStaffSelection] = useState<Record<string, boolean>>({})
  const [rosterDlSelection, setRosterDlSelection] = useState<Record<string, boolean>>({})
  const [rosterSkilledSelection, setRosterSkilledSelection] = useState<Record<string, boolean>>({})
  const [rosterLoading, setRosterLoading] = useState(false)
  const [rosterSaving, setRosterSaving] = useState(false)
  const [rosterError, setRosterError] = useState<string | null>(null)
  const [rosterSuccess, setRosterSuccess] = useState<string | null>(null)
  const [memberSiteId, setMemberSiteId] = useState('')
  const [memberRole, setMemberRole] = useState<MemberRole>('staff')
  const [memberNamesInput, setMemberNamesInput] = useState('')
  const [memberSaving, setMemberSaving] = useState(false)
  const [memberError, setMemberError] = useState<string | null>(null)
  const [memberSuccess, setMemberSuccess] = useState<string | null>(null)
  const [memberUpdatingId, setMemberUpdatingId] = useState<string | null>(null)
  const [exportStartDate, setExportStartDate] = useState<string>(
    () => new Date(new Date().setDate(new Date().getDate() - 29)).toISOString().split('T')[0],
  )
  const [exportEndDate, setExportEndDate] = useState<string>(() => new Date().toISOString().split('T')[0])
  const [exportSiteId, setExportSiteId] = useState('')
  const [exporting, setExporting] = useState(false)
  const selectedRosterSite = useMemo(
    () => sites.find(site => site.id === rosterSiteId) ?? null,
    [sites, rosterSiteId],
  )
  const selectedMemberSite = useMemo(
    () => sites.find(site => site.id === memberSiteId) ?? null,
    [sites, memberSiteId],
  )
  const rosterActiveStaff = useMemo(
    () => (selectedRosterSite ? selectedRosterSite.staff.filter(member => member.isActive) : []),
    [selectedRosterSite],
  )
  const rosterActiveDls = useMemo(
    () => (selectedRosterSite ? selectedRosterSite.dls.filter(member => member.isActive) : []),
    [selectedRosterSite],
  )
  const rosterActiveSkilled = useMemo(
    () => (selectedRosterSite ? selectedRosterSite.skilled.filter(member => member.isActive) : []),
    [selectedRosterSite],
  )
  const rosterStaffSelectedCount = useMemo(() => {
    return rosterActiveStaff.reduce(
      (count, staff) => count + (rosterStaffSelection[staff.id] ? 1 : 0),
      0,
    )
  }, [rosterActiveStaff, rosterStaffSelection])
  const rosterDlSelectedCount = useMemo(() => {
    return rosterActiveDls.reduce(
      (count, dl) => count + (rosterDlSelection[dl.id] ? 1 : 0),
      0,
    )
  }, [rosterActiveDls, rosterDlSelection])
  const rosterSkilledSelectedCount = useMemo(() => {
    return rosterActiveSkilled.reduce(
      (count, skilled) => count + (rosterSkilledSelection[skilled.id] ? 1 : 0),
      0,
    )
  }, [rosterActiveSkilled, rosterSkilledSelection])
  useEffect(() => {
    fetchSites()
  }, [])

  useEffect(() => {
    if (!sites.length) return

    if (!rosterSiteId || !sites.some(site => site.id === rosterSiteId)) {
      setRosterSiteId(sites[0].id)
    }
    if (!memberSiteId || !sites.some(site => site.id === memberSiteId)) {
      setMemberSiteId(sites[0].id)
    }
    if (!exportSiteId || !sites.some(site => site.id === exportSiteId)) {
      setExportSiteId(sites[0].id)
    }
  }, [sites, rosterSiteId, memberSiteId, exportSiteId])

  useEffect(() => {
    fetchData()
  }, [activeTab, dateFilter, siteFilter])

  useEffect(() => {
    if (!rosterSiteId || !rosterDate || !selectedRosterSite) return

    const load = async () => {
      await fetchRoster(rosterSiteId, rosterDate, selectedRosterSite)
    }

    void load()
  }, [rosterSiteId, rosterDate, selectedRosterSite])

  const handleExport = async () => {
    if (!exportSiteId) {
      alert('Please select a site to export.')
      return
    }

    setExporting(true)

    const downloadFile = async (role: MemberRole) => {
      try {
        const params = new URLSearchParams({
          role,
          siteId: exportSiteId,
          startDate: exportStartDate,
          endDate: exportEndDate,
        })
        const response = await fetch(`/api/export?${params.toString()}`)
        if (!response.ok) {
          throw new Error(`Failed to download ${role} file`)
        }
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const contentDisposition = response.headers.get('content-disposition')
        let filename = `${role}_attendance.xlsx`
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?(.+)"?/)
          if (match && match[1]) {
            filename = match[1]
          }
        }
        a.download = filename
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
      } catch (error) {
        console.error(`Export error for ${role}:`, error)
        alert(`Failed to export ${role} data. Please try again.`)
      }
    }

    await downloadFile('staff')
    await new Promise((resolve) => setTimeout(resolve, 500)) // Brief pause between downloads
    await downloadFile('dl')
    await new Promise((resolve) => setTimeout(resolve, 500))
    await downloadFile('skilled')

    setExporting(false)
  }

  const fetchSites = async () => {
    try {
      const response = await fetch('/api/admin/members?includeInactive=true')
      const data = await response.json()
      setSites(data.sites ?? [])
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
      } else if (activeTab === 'skilled') {
        params.append('view', 'skilled')
        const response = await fetch(`/api/dashboard?${params}`)
        const data = await response.json()
        setSkilledData(data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const buildSelectionMap = (
    items: Array<{ id: string }>,
    selectedIds?: string[] | null,
  ) => {
    return items.reduce<Record<string, boolean>>((acc, item) => {
      if (Array.isArray(selectedIds)) {
        acc[item.id] = selectedIds.includes(item.id)
      } else {
        acc[item.id] = true
      }
      return acc
    }, {})
  }

  const fetchRoster = async (siteId: string, date: string, site: SiteOption) => {
    setRosterLoading(true)
    setRosterError(null)
    setRosterSuccess(null)

    try {
      const params = new URLSearchParams({ siteId, date })
      const response = await fetch(`/api/roster?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`Failed to load roster: ${response.status}`)
      }

      const data: { staffIds?: string[]; dlIds?: string[]; skilledIds?: string[] } = await response.json()
      const activeStaff = (site.staff ?? []).filter(member => member.isActive)
      const activeDls = (site.dls ?? []).filter(member => member.isActive)
      const activeSkilled = (site.skilled ?? []).filter(member => member.isActive)

      setRosterStaffSelection(buildSelectionMap(activeStaff, data.staffIds ?? null))
      setRosterDlSelection(buildSelectionMap(activeDls, data.dlIds ?? null))
      setRosterSkilledSelection(buildSelectionMap(activeSkilled, data.skilledIds ?? null))
    } catch (error) {
      console.error('Error fetching roster:', error)
      setRosterError('Failed to load roster; defaulting to all members.')
      const activeStaff = (site.staff ?? []).filter(member => member.isActive)
      const activeDls = (site.dls ?? []).filter(member => member.isActive)
      const activeSkilled = (site.skilled ?? []).filter(member => member.isActive)
      setRosterStaffSelection(buildSelectionMap(activeStaff, null))
      setRosterDlSelection(buildSelectionMap(activeDls, null))
      setRosterSkilledSelection(buildSelectionMap(activeSkilled, null))
    } finally {
      setRosterLoading(false)
    }
  }

  const toggleRosterStaff = (staffId: string) => {
    setRosterStaffSelection(prev => ({
      ...prev,
      [staffId]: !prev[staffId],
    }))
  }

  const toggleRosterDl = (dlId: string) => {
    setRosterDlSelection(prev => ({
      ...prev,
      [dlId]: !prev[dlId],
    }))
  }

  const toggleRosterSkilled = (skilledId: string) => {
    setRosterSkilledSelection(prev => ({
      ...prev,
      [skilledId]: !prev[skilledId],
    }))
  }

  const resetRosterSelections = () => {
    setRosterStaffSelection(buildSelectionMap(rosterActiveStaff, null))
    setRosterDlSelection(buildSelectionMap(rosterActiveDls, null))
    setRosterSkilledSelection(buildSelectionMap(rosterActiveSkilled, null))
    setRosterError(null)
    setRosterSuccess(null)
  }

  const handleRosterSave = async () => {
    if (!selectedRosterSite || !rosterSiteId || !rosterDate) return

    setRosterSaving(true)
    setRosterError(null)
    setRosterSuccess(null)

    try {
      const staffIds = Object.entries(rosterStaffSelection)
        .filter(([, present]) => present)
        .map(([id]) => id)

      const dlIds = Object.entries(rosterDlSelection)
        .filter(([, present]) => present)
        .map(([id]) => id)

      const skilledIds = Object.entries(rosterSkilledSelection)
        .filter(([, present]) => present)
        .map(([id]) => id)

      const response = await fetch('/api/roster', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: rosterSiteId,
          date: rosterDate,
          staffIds,
          dlIds,
          skilledIds,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to save roster: ${response.status}`)
      }

      setRosterSuccess('Roster updated successfully.')
    } catch (error) {
      console.error('Error saving roster:', error)
      setRosterError('Failed to save roster changes.')
    } finally {
      setRosterSaving(false)
    }
  }

  const handleMemberSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setMemberError(null)
    setMemberSuccess(null)

    const names = memberNamesInput
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0)

    if (!memberSiteId || names.length === 0) {
      setMemberError('Enter at least one name and select a site.')
      return
    }

    setMemberSaving(true)

    try {
      const response = await fetch('/api/admin/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          members: names.map(name => ({
            name,
            role: memberRole,
            siteId: memberSiteId,
          })),
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error ?? `Failed with status ${response.status}`)
      }

      setMemberSuccess(`Added ${names.length} ${memberRole} member(s).`)
      setMemberNamesInput('')
      await fetchSites()
    } catch (error) {
      console.error('Error adding members:', error)
      setMemberError('Failed to add members.')
    } finally {
      setMemberSaving(false)
    }
  }

  const toggleMemberStatus = async (memberId: string, role: MemberRole, isActive: boolean) => {
    setMemberError(null)
    setMemberSuccess(null)
    setMemberUpdatingId(memberId)

    try {
      const response = await fetch('/api/admin/members', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberId,
          role,
          isActive,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error ?? `Failed with status ${response.status}`)
      }

      setMemberSuccess(`Member ${isActive ? 'activated' : 'deactivated'} successfully.`)
      await fetchSites()
    } catch (error) {
      console.error('Error updating member status:', error)
      setMemberError('Failed to update member status.')
    } finally {
      setMemberUpdatingId(null)
    }
  }

  const deleteMember = async (memberId: string, role: MemberRole, memberName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${memberName}"? This action cannot be undone and will also delete all their attendance records.`)) {
      return
    }

    setMemberError(null)
    setMemberSuccess(null)
    setMemberUpdatingId(memberId)

    try {
      const params = new URLSearchParams({ memberId, role })
      const response = await fetch(`/api/admin/members?${params.toString()}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error ?? `Failed with status ${response.status}`)
      }

      setMemberSuccess(`Member "${memberName}" deleted successfully.`)
      await fetchSites()
    } catch (error) {
      console.error('Error deleting member:', error)
      setMemberError('Failed to delete member.')
    } finally {
      setMemberUpdatingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 text-center">
          <Image
            src="/logo.jpg"
            alt="Entoto Peacock Logo"
            width={550}
            height={110}
            priority
            className="mx-auto"
          />
        </div>
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Back to Form
            </Link>
            <form
              action="/api/auth/logout"
              method="post"
              className="inline"
              onSubmit={async (event) => {
                event.preventDefault()
                await fetch('/api/auth/logout', { method: 'POST' })
                window.location.href = '/admin/login'
              }}
            >
              <button
                type="submit"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Log out
              </button>
            </form>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Export Attendance Data</h2>
              <p className="text-sm text-gray-500">
                Download attendance records as Excel files for a selected site and date range.
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Site</label>
              <select
                value={exportSiteId}
                onChange={(e) => setExportSiteId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={exportStartDate}
                onChange={(e) => setExportStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-1 flex items-end justify-end">
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting || !exportSiteId}
                className="w-full px-5 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {exporting ? 'Exporting...' : 'Export Attendance'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Member Management</h2>
              <p className="text-sm text-gray-500">Add or update people for each site and assign their role.</p>
            </div>
          </div>

          <form onSubmit={handleMemberSubmit} className="grid gap-4 md:grid-cols-3 mb-4">
            <div className="min-w-[200px] md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Site</label>
              <select
                value={memberSiteId}
                onChange={(e) => setMemberSiteId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {sites.map(site => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-1">
              <span className="block text-sm font-medium text-gray-700 mb-2">Role</span>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="memberRole"
                    value="staff"
                    checked={memberRole === 'staff'}
                    onChange={() => setMemberRole('staff')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  Staff
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="memberRole"
                    value="dl"
                    checked={memberRole === 'dl'}
                    onChange={() => setMemberRole('dl')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  DL
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="memberRole"
                    value="skilled"
                    checked={memberRole === 'skilled'}
                    onChange={() => setMemberRole('skilled')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  Skilled
                </label>
              </div>
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Names (one per line)</label>
              <textarea
                value={memberNamesInput}
                onChange={(e) => setMemberNamesInput(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`e.g.\nJohn Doe\nJane Smith`}
              />
            </div>

            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={memberSaving}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {memberSaving ? 'Saving...' : 'Add Members'}
              </button>
            </div>
          </form>

          {memberError && (
            <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {memberError}
            </div>
          )}
          {memberSuccess && (
            <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {memberSuccess}
            </div>
          )}

          {selectedMemberSite ? (
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Staff</h3>
                <div className="space-y-3">
                  {selectedMemberSite.staff.length === 0 && (
                    <p className="text-sm text-gray-500">No staff members yet.</p>
                  )}
                  {selectedMemberSite.staff.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        <p className={`text-xs font-medium ${member.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleMemberStatus(member.id, 'staff', !member.isActive)}
                          disabled={memberUpdatingId === member.id}
                          className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                            member.isActive
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          } ${memberUpdatingId === member.id ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          {member.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteMember(member.id, 'staff', member.name)}
                          disabled={memberUpdatingId === member.id}
                          className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 ${
                            memberUpdatingId === member.id ? 'opacity-70 cursor-not-allowed' : ''
                          }`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">DLs</h3>
                <div className="space-y-3">
                  {selectedMemberSite.dls.length === 0 && (
                    <p className="text-sm text-gray-500">No DL members yet.</p>
                  )}
                  {selectedMemberSite.dls.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        <p className={`text-xs font-medium ${member.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleMemberStatus(member.id, 'dl', !member.isActive)}
                          disabled={memberUpdatingId === member.id}
                          className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                            member.isActive
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          } ${memberUpdatingId === member.id ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          {member.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteMember(member.id, 'dl', member.name)}
                          disabled={memberUpdatingId === member.id}
                          className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 ${
                            memberUpdatingId === member.id ? 'opacity-70 cursor-not-allowed' : ''
                          }`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Skilled</h3>
                <div className="space-y-3">
                  {selectedMemberSite.skilled.length === 0 && (
                    <p className="text-sm text-gray-500">No skilled members yet.</p>
                  )}
                  {selectedMemberSite.skilled.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        <p className={`text-xs font-medium ${member.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleMemberStatus(member.id, 'skilled', !member.isActive)}
                          disabled={memberUpdatingId === member.id}
                          className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                            member.isActive
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          } ${memberUpdatingId === member.id ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          {member.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteMember(member.id, 'skilled', member.name)}
                          disabled={memberUpdatingId === member.id}
                          className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 ${
                            memberUpdatingId === member.id ? 'opacity-70 cursor-not-allowed' : ''
                          }`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Select a site to manage members.</p>
          )}
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
              <button
                onClick={() => setActiveTab('skilled')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'skilled'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Skilled Attendance
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skilled Present</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formRecords.map((record) => {
                      const staffPresent = (record.staffAttendance || []).filter(a => a.present).length
                      const staffTotal = (record.staffAttendance || []).length
                      const dlPresent = (record.dlAttendance || []).filter(a => a.present).length
                      const dlTotal = (record.dlAttendance || []).length
                      const skilledPresent = (record.skilledAttendance || []).filter(a => a.present).length
                      const skilledTotal = (record.skilledAttendance || []).length

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
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className="text-green-600 font-medium">{skilledPresent}</span> / {skilledTotal}
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

            {activeTab === 'skilled' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skilled Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance History</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {skilledData.map((skilled) => (
                      <tr key={skilled.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{skilled.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{skilled.site.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {skilled.attendance.length === 0 ? (
                            <span className="text-gray-500">No records</span>
                          ) : (
                            <div className="space-y-1">
                              {skilled.attendance.slice(0, 5).map((record, index) => (
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
                {skilledData.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No Skilled records found
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

