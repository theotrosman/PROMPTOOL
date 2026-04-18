import { useLang } from '../contexts/LangContext'

const ConfigModal = ({ open, mode, difficulty, availableDiffs = [], onClose, onSave, onModeChange, onDifficultyChange }) => {
  const { t } = useLang()
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-slate-500">{t('settings')}</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">{t('configTitle')}</h2>
          </div>
          <button type="button" onClick={onClose}
            className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
            {t('close')}
          </button>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="space-y-3 rounded-[1.75rem] border border-slate-200/70 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">{t('mode')}</p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="radio" name="config-mode" value="daily" checked={mode === 'daily'}
                  onChange={(e) => onModeChange(e.target.value)} className="h-4 w-4 text-slate-900" />
                {t('daily')}
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="radio" name="config-mode" value="random" checked={mode === 'random'}
                  onChange={(e) => onModeChange(e.target.value)} className="h-4 w-4 text-slate-900" />
                {t('random')}
              </label>
            </div>
            <p className="text-xs text-slate-500 italic">
              {mode === 'daily' ? t('dailyDesc') : t('randomDesc')}
            </p>
          </div>

          <div className="space-y-3 rounded-[1.75rem] border border-slate-200/70 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">{t('difficulty')}</p>
            {mode === 'daily' ? (
              <p className="text-xs text-slate-500 italic py-3">{t('dailyNoFilter')}</p>
            ) : availableDiffs.length > 0 ? (
              <select value={difficulty} onChange={(e) => onDifficultyChange(e.target.value)}
                className="w-full rounded-[1.25rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400">
                {availableDiffs.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            ) : (
              <p className="text-xs text-slate-400 italic py-3">{t('loading')}</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose}
            className="rounded-[1.25rem] border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
            {t('cancel')}
          </button>
          <button type="button" onClick={onSave}
            className="rounded-[1.25rem] bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
            {t('saveChanges')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfigModal
