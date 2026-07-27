import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Tags } from 'lucide-react'
import { categoriesApi } from '../lib/api'
import { Category } from '../types'
import {
  Card,
  Button,
  Input,
  Field,
  Select,
  Modal,
  EmptyState,
  Skeleton,
} from '../components/ui'

interface FormState {
  name: string
  icon: string
  color: string
  parent_id: string
}

const EMPTY_FORM: FormState = { name: '', icon: '', color: '#3DE1B0', parent_id: '' }

export default function Categories() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  })

  const categories: Category[] = categoriesData?.data || []

  const createMutation = useMutation({
    mutationFn: (data: { name: string; icon?: string; color?: string; parent_id?: number }) =>
      categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      closeForm()
    },
    onError: (error: any) => alert(error.response?.data?.detail || 'Failed to create category'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<{ name: string; icon: string; color: string; parent_id: number; is_active: boolean }> }) =>
      categoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      closeForm()
    },
    onError: (error: any) => alert(error.response?.data?.detail || 'Failed to update category'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setDeleteTarget(null)
    },
    onError: (error: any) => alert(error.response?.data?.detail || 'Failed to delete category'),
  })

  // Sync the form fields whenever the modal opens for create or edit.
  useEffect(() => {
    if (!formOpen) return
    if (editing) {
      setForm({
        name: editing.name,
        icon: editing.icon || '',
        color: editing.color || '#3DE1B0',
        parent_id: editing.parent_id ? String(editing.parent_id) : '',
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [formOpen, editing])

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (category: Category) => {
    setEditing(category)
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditing(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parentId = form.parent_id ? parseInt(form.parent_id) : undefined
    if (editing) {
      updateMutation.mutate({
        id: editing.id,
        data: {
          name: form.name,
          icon: form.icon || undefined,
          color: form.color || undefined,
          parent_id: parentId,
          is_active: true,
        },
      })
    } else {
      createMutation.mutate({
        name: form.name,
        icon: form.icon || undefined,
        color: form.color || undefined,
        parent_id: parentId,
      })
    }
  }

  const topLevelCategories = categories.filter((c) => !c.parent_id)
  const subCategories = categories.filter((c) => c.parent_id)
  const isSaving = createMutation.isPending || updateMutation.isPending

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-text-hi">Categories</h1>
          <p className="text-sm text-text-lo">Manage your transaction categories</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Tags className="h-6 w-6 text-text-lo" />}
            title="No categories yet"
            description="Create your first category to start organizing transactions"
            action={
              <Button onClick={openCreate} className="mt-2">
                <Plus className="h-4 w-4" />
                Add Category
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topLevelCategories.map((category) => {
            const children = subCategories.filter((c) => c.parent_id === category.id)
            return (
              <Card key={category.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="grid place-items-center w-11 h-11 rounded-xl text-lg shrink-0"
                      style={{ backgroundColor: `${category.color || '#3DE1B0'}22` }}
                    >
                      <span>{category.icon || '🏷️'}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: category.color || '#3DE1B0' }}
                        />
                        <p className="font-medium text-text-hi truncate">{category.name}</p>
                      </div>
                      <p className="text-xs text-text-lo mt-0.5">
                        {category.is_default ? 'Default' : 'Custom'} • {children.length} sub
                        {children.length === 1 ? 'category' : 'categories'}
                      </p>
                    </div>
                  </div>
                  {!category.is_default && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(category)}
                        className="p-1.5 rounded-lg text-text-lo hover:text-text-hi hover:bg-white/5"
                        aria-label="Edit category"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(category)}
                        className="p-1.5 rounded-lg text-text-lo hover:text-flame hover:bg-flame-soft"
                        aria-label="Delete category"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {children.length > 0 && (
                  <div className="mt-4 pl-4 border-l border-hairline space-y-2">
                    {children.map((child) => (
                      <div key={child.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: child.color || '#8B7CFF' }}
                          />
                          <span className="text-sm text-text-hi truncate">
                            {child.icon} {child.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => openEdit(child)}
                            className="p-1 rounded text-text-lo hover:text-text-hi hover:bg-white/5"
                            aria-label="Edit subcategory"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          {!child.is_default && (
                            <button
                              onClick={() => setDeleteTarget(child)}
                              className="p-1 rounded text-text-lo hover:text-flame hover:bg-flame-soft"
                              aria-label="Delete subcategory"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? 'Edit Category' : 'Add Category'}
        footer={
          <>
            <Button variant="secondary" onClick={closeForm} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" form="category-form" loading={isSaving}>
              {editing ? 'Save' : 'Add Category'}
            </Button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
          <Field label="Name" htmlFor="cat-name">
            <Input
              id="cat-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Groceries"
              required
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Icon (emoji)" htmlFor="cat-icon">
              <Input
                id="cat-icon"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                maxLength={2}
                placeholder="🛒"
              />
            </Field>
            <Field label="Color" htmlFor="cat-color">
              <input
                id="cat-color"
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="input h-11 w-full cursor-pointer p-1"
              />
            </Field>
          </div>
          <Field label="Parent Category (optional)" htmlFor="cat-parent">
            <Select
              id="cat-parent"
              value={form.parent_id}
              onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
            >
              <option value="">None (Top Level)</option>
              {topLevelCategories
                .filter((c) => c.id !== editing?.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </Select>
          </Field>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete category"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              loading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-lo">
          Are you sure you want to delete{' '}
          <span className="font-medium text-text-hi">{deleteTarget?.name}</span>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
