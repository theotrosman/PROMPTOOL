import { useEffect, useState, useRef } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import { useAuth } from './hooks/useAuth'
import { useAdmin } from './hooks/useAdmin'
import { supabase } from './supabaseClient'

function AdminApp() {
  const { user, loading: authLoading } = useAuth()
  const { isAdmin, loading: adminLoading } = useAdmin(user?.id)
  const [selectedTable, setSelectedTable] = useState('usuarios')
  const [tableData, setTableData] = useState([])
  const [columns, setColumns] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingRow, setEditingRow] = useState(null)
  const [editValues, setEditValues] = useState({})
  const hasRedirected = useRef(false)

  const tables = ['usuarios', 'imagenes_ia', 'intentos']

  useEffect(() => {
    if (authLoading || adminLoading) return
    if (hasRedirected.current) return
    if (!user || !isAdmin) {
      hasRedirected.current = true
      window.location.href = '/'
    }
  }, [user, isAdmin, authLoading, adminLoading])

  useEffect(() => {
    if (!authLoading && !adminLoading && user && isAdmin) {
      fetchTableData()
    }
  }, [selectedTable, authLoading, adminLoading, isAdmin])

  // PKs reales por tabla
  const TABLE_PKS = {
    usuarios: 'id_usuario',
    imagenes_ia: 'id_imagen',
    intentos: 'id_intento',
  }

  // Columna de sort por tabla
  const TABLE_SORT = {
    usuarios: 'fecha_registro',
    imagenes_ia: 'fecha',
    intentos: 'fecha_hora',
  }

  const fetchTableData = async () => {
    setLoading(true)
    try {
      const sortCol = TABLE_SORT[selectedTable] || TABLE_PKS[selectedTable]
      const { data, error } = await supabase
        .from(selectedTable)
        .select('*')
        .order(sortCol, { ascending: false })
        .limit(200)

      if (error) throw error

      if (data && data.length > 0) {
        setColumns(Object.keys(data[0]))
        setTableData(data)
      } else {
        setTableData([])
        setColumns([])
      }
    } catch (error) {
      console.error('Error fetching table data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (row) => {
    setEditingRow(row)
    setEditValues({ ...row })
  }

  const handleSave = async () => {
    try {
      const pk = TABLE_PKS[selectedTable]
      const { error } = await supabase
        .from(selectedTable)
        .update(editValues)
        .eq(pk, editingRow[pk])
      if (error) throw error
      setEditingRow(null)
      fetchTableData()
    } catch (error) {
      alert('Error al actualizar: ' + error.message)
    }
  }

  const handleDelete = async (row) => {
    if (!confirm('¿Eliminar este registro?')) return
    try {
      const pk = TABLE_PKS[selectedTable]
      const { error } = await supabase
        .from(selectedTable)
        .delete()
        .eq(pk, row[pk])
      if (error) throw error
      fetchTableData()
    } catch (error) {
      alert('Error al eliminar: ' + error.message)
    }
  }

  const renderCellValue = (value) => {
    if (value === null) return <span className="text-slate-400 italic">null</span>
    if (typeof value === 'boolean') return value ? '✓' : '✗'
    if (typeof value === 'object') return JSON.stringify(value)
    if (String(value).length > 60) return String(value).substring(0, 60) + '...'
    return String(value)
  }

  // Mostrar spinner mientras cargan auth o admin
  if (authLoading || adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
      </div>
    )
  }

  // Si no es admin, no renderizar nada (la redirección ya está en el useEffect)
  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header />

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-slate-900">Panel de Administración</h1>
            <span className="rounded-full bg-purple-100 px-4 py-1.5 text-sm font-semibold text-purple-700">
              Admin
            </span>
          </div>

          {/* Selector de tablas */}
          <div className="flex gap-3 flex-wrap">
            {tables.map((table) => (
              <button
                key={table}
                onClick={() => setSelectedTable(table)}
                className={`rounded-xl px-6 py-3 text-sm font-semibold transition ${
                  selectedTable === table
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {table}
              </button>
            ))}
          </div>

          {/* Tabla de datos */}
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                {selectedTable} <span className="text-slate-400 font-normal text-base">({tableData.length} registros)</span>
              </h2>
              <button
                onClick={fetchTableData}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Recargar
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
              </div>
            ) : tableData.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                No hay datos en esta tabla
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      {columns.map((col) => (
                        <th key={col} className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                      <th className="px-4 py-3 font-semibold text-slate-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                        {columns.map((col) => (
                          <td key={col} className="px-4 py-3 text-slate-600">
                            {editingRow && editingRow[columns[0]] === row[columns[0]] ? (
                              <input
                                type="text"
                                value={editValues[col] ?? ''}
                                onChange={(e) => setEditValues({ ...editValues, [col]: e.target.value })}
                                className="w-full min-w-[80px] rounded border border-slate-300 px-2 py-1 text-sm"
                              />
                            ) : (
                              renderCellValue(row[col])
                            )}
                          </td>
                        ))}
                        <td className="px-4 py-3">
                          {editingRow && editingRow[columns[0]] === row[columns[0]] ? (
                            <div className="flex gap-2">
                              <button
                                onClick={handleSave}
                                className="rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                              >
                                Guardar
                              </button>
                              <button
                                onClick={() => setEditingRow(null)}
                                className="rounded bg-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-400"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(row)}
                                className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleDelete(row)}
                                className="rounded bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700"
                              >
                                Eliminar
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default AdminApp
