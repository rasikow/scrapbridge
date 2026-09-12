import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, FolderTree, Ruler, MapPin } from 'lucide-react'
import { DashboardShell } from '@/components/layout/dashboard/DashboardShell'
import { PageHeader } from '@/components/shared/PageHeader'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  MATERIAL_CATEGORIES, UNITS, LOCATIONS,
  addMaterialCategory, deleteMaterialCategory, addUnit, deleteUnit, addLocation, deleteLocation,
} from '@/data/materials'

const SWATCH_PALETTE = ['#C1793F', '#6B7A82', '#3F7D74', '#8C4A2F', '#B8964A', '#5B9683', '#8C5E7A', '#4E8CA6']

function useForceUpdate() {
  const [, setTick] = useState(0)
  return () => setTick((t) => t + 1)
}

export default function CategoryManagementPage() {
  const forceUpdate = useForceUpdate()
  const [newCategory, setNewCategory] = useState({ label: '', unit: 'kg' })
  const [newUnit, setNewUnit] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null) // { kind, value }

  function submitCategory(e) {
    e.preventDefault()
    if (!newCategory.label.trim()) return
    const id = newCategory.label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
    try {
      addMaterialCategory({
        id,
        label: newCategory.label.trim(),
        swatch: SWATCH_PALETTE[MATERIAL_CATEGORIES.length % SWATCH_PALETTE.length],
        unit: newCategory.unit,
      })
      setNewCategory({ label: '', unit: 'kg' })
      forceUpdate()
      toast.success('Material category added')
    } catch (err) {
      toast.error(err.message)
    }
  }

  function submitUnit(e) {
    e.preventDefault()
    if (!newUnit.trim()) return
    addUnit(newUnit.trim())
    setNewUnit('')
    forceUpdate()
    toast.success('Unit added')
  }

  function submitLocation(e) {
    e.preventDefault()
    if (!newLocation.trim()) return
    addLocation(newLocation.trim())
    setNewLocation('')
    forceUpdate()
    toast.success('Location added')
  }

  function confirmDelete() {
    const { kind, value } = deleteTarget
    if (kind === 'category') deleteMaterialCategory(value)
    if (kind === 'unit') deleteUnit(value)
    if (kind === 'location') deleteLocation(value)
    setDeleteTarget(null)
    forceUpdate()
    toast.success('Removed')
  }

  return (
    <DashboardShell showSearch={false}>
      <PageHeader icon={FolderTree} eyebrow="Marketplace configuration" title="Category management" subtitle="Changes here apply instantly across the marketplace filters and seller listing forms." />

      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories"><FolderTree className="mr-1.5 size-3.5" /> Material Categories</TabsTrigger>
          <TabsTrigger value="units"><Ruler className="mr-1.5 size-3.5" /> Units</TabsTrigger>
          <TabsTrigger value="locations"><MapPin className="mr-1.5 size-3.5" /> Locations</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle>Material categories</CardTitle>
              <CardDescription>The materials buyers can browse and sellers can list under.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitCategory} className="mb-5 flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[180px]">
                  <Label htmlFor="newCategoryLabel">New category name</Label>
                  <Input id="newCategoryLabel" placeholder="e.g. Tyre Waste" value={newCategory.label} onChange={(e) => setNewCategory((c) => ({ ...c, label: e.target.value }))} />
                </div>
                <Button type="submit" variant="copper"><Plus className="size-4" /> Add category</Button>
              </form>
              <div className="divide-y divide-paper-200">
                {MATERIAL_CATEGORIES.map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-2.5">
                    <span className="flex items-center gap-2.5 text-sm text-ink-900">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: m.swatch }} />
                      {m.label}
                      <span className="font-mono-data text-xs text-ink-300">{m.id}</span>
                    </span>
                    <button onClick={() => setDeleteTarget({ kind: 'category', value: m.id, label: m.label })} className="rounded-full p-1.5 text-ink-300 hover:bg-signal-down/10 hover:text-signal-down">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="units">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Units of measure</CardTitle>
              <CardDescription>Used across product listings and orders.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitUnit} className="mb-5 flex items-end gap-3">
                <div className="flex-1">
                  <Label htmlFor="newUnit">New unit</Label>
                  <Input id="newUnit" placeholder="e.g. cubic meter" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} />
                </div>
                <Button type="submit" variant="copper"><Plus className="size-4" /></Button>
              </form>
              <div className="flex flex-wrap gap-2">
                {UNITS.map((u) => (
                  <span key={u} className="flex items-center gap-1.5 rounded-full border border-paper-300 bg-paper-100 py-1 pl-3 pr-1.5 text-sm text-ink-700">
                    {u}
                    <button onClick={() => setDeleteTarget({ kind: 'unit', value: u, label: u })} className="rounded-full p-1 text-ink-300 hover:bg-signal-down/10 hover:text-signal-down">
                      <Trash2 className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Warehouse locations</CardTitle>
              <CardDescription>Where sellers can list materials from.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitLocation} className="mb-5 flex items-end gap-3">
                <div className="flex-1">
                  <Label htmlFor="newLocation">New location</Label>
                  <Input id="newLocation" placeholder="e.g. Cape Town, South Africa" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} />
                </div>
                <Button type="submit" variant="copper"><Plus className="size-4" /></Button>
              </form>
              <div className="flex flex-wrap gap-2">
                {LOCATIONS.map((l) => (
                  <span key={l} className="flex items-center gap-1.5 rounded-full border border-paper-300 bg-paper-100 py-1 pl-3 pr-1.5 text-sm text-ink-700">
                    {l}
                    <button onClick={() => setDeleteTarget({ kind: 'location', value: l, label: l })} className="rounded-full p-1 text-ink-300 hover:bg-signal-down/10 hover:text-signal-down">
                      <Trash2 className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove "{deleteTarget?.label}"?</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
