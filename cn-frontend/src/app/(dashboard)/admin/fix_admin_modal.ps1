
$path = "c:\Proyectos\node\Proyecto-CN_Edcucation\cn-frontend\src\app\(dashboard)\admin\page.tsx"
$content = Get-Content $path -Raw

# Reparar el bloque del modal de confirmación
$oldBlock = '               <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-50 dark:border-slate-800 flex gap-3">
                  {confirmModal.type === ''delete'' ? (
                    <>
                     <button 
                       onClick={() => setConfirmModal({...confirmModal, open: false})}
                       className="flex-1 py-3 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-2xl text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                     >
                       Cancelar
                     </button>
                     </button>
                     <button 
                       onClick={() => {
                         confirmModal.action?.()
                         setConfirmModal({...confirmModal, open: false})
                       }}
                       className={`flex-1 py-3 px-4 text-white font-bold rounded-2xl text-sm transition-all shadow-lg ${
                         confirmModal.title.includes(''Bloquear'') 
                         ? ''bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'' 
                         : ''bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20''
                       }`}
                     >
                       {confirmModal.title.includes(''Bloquear'') ? ''Sí, Bloquear'' : 
                        confirmModal.title.includes(''Aprobar'') ? ''Aprobar Ahora'' : ''Sí, Restaurar''}
                     </button>


                    </>
                  ) : ('

$newBlock = '               <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-50 dark:border-slate-800 flex gap-3">
                  {(confirmModal.type === ''delete'' || confirmModal.title.includes(''Aprobar'')) ? (
                    <>
                     <button 
                       onClick={() => setConfirmModal({...confirmModal, open: false})}
                       className="flex-1 py-3 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-2xl text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                     >
                       Cancelar
                     </button>
                     <button 
                       onClick={() => {
                         confirmModal.action?.()
                         setConfirmModal({...confirmModal, open: false})
                       }}
                       className={`flex-1 py-3 px-4 text-white font-bold rounded-2xl text-sm transition-all shadow-lg ${
                         confirmModal.title.includes(''Bloquear'') 
                         ? ''bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'' 
                         : ''bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20''
                       }`}
                     >
                       {confirmModal.title.includes(''Bloquear'') ? ''Sí, Bloquear'' : 
                        confirmModal.title.includes(''Aprobar'') ? ''Aprobar Ahora'' : ''Sí, Restaurar''}
                     </button>
                    </>
                  ) : ('

$content = $content.Replace($oldBlock, $newBlock)
Set-Content $path $content
