import React, {useEffect, useRef, useState} from 'react';
import {secureRequest} from '../../../services/secureRequest';

interface ImportedBackup {id:string;filename:string;legacy:boolean;verified:boolean;files:number;driver:string;backup_date:string|null;tested:boolean;test_tables?:number;test_expires_at?:string;restored_at?:string}
export default function ImportBackup({onClose,backupId}:{onClose:()=>void;backupId?:number}) {
  const [file,setFile]=useState<File|null>(null);
  const [backup,setBackup]=useState<ImportedBackup|null>(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [confirm,setConfirm]=useState('');
  const [password,setPassword]=useState('');
  const [understand,setUnderstand]=useState(false);
  const [restored,setRestored]=useState(false);
  const lock=useRef(false);
  const [history,setHistory]=useState<ImportedBackup[]>([]);
  async function signInAgain() {
    if ('caches' in window) await caches.delete('nstp-api-get').catch(()=>false);
    for (const key of ['token','nstp_token','user','nstp_user']) localStorage.removeItem(key);
    window.location.assign('/login');
  }
  useEffect(()=>{let mounted=true;secureRequest('/superadmin/backups/imports').then(result=>{if(mounted)setHistory(result.data||[]);}).catch(()=>{});return()=>{mounted=false;};},[]);
  useEffect(()=>{if(!backupId)return;let mounted=true;lock.current=true;setBusy(true);secureRequest(`/superadmin/backups/${backupId}/prepare-import`,'POST').then(result=>{if(mounted){setBackup(result.data);setMessage(result.message);}}).catch(error=>{if(mounted)setMessage(error.message);}).finally(()=>{lock.current=false;if(mounted)setBusy(false);});return()=>{mounted=false;};},[backupId]);
  async function run(kind:'upload'|'test'|'restore') {
    if(lock.current)return;
    if(kind==='upload'&&(!file||!file.name.toLowerCase().endsWith('.zip')||file.size>100*1024*1024)){setMessage('Choose a ZIP file up to 100 MB.');return;}
    if(kind==='restore'&&(!understand||confirm!=='RESTORE'||!password)){setMessage('Confirm replacement, type RESTORE, and enter your Super Admin password.');return;}
    lock.current=true;setBusy(true);setMessage('');
    try {
      if(kind==='upload') {
        const body=new FormData();body.append('backup',file!);
        const result=await secureRequest('/superadmin/backups/imports','POST',body);setBackup(result.data);setMessage(result.message);
      } else if(backup) {
        if(kind==='test') {
          const result=await secureRequest(`/superadmin/backups/imports/${backup.id}/test`,'POST');setBackup(result.data);setMessage(result.message);
        } else {
          const result=await secureRequest(`/superadmin/backups/imports/${backup.id}/restore`,'POST',{confirmation:confirm,password});setPassword('');setRestored(true);setMessage(result.message);
        }
      }
    } catch(error:any){setMessage(error.message||'Recovery request failed.');}
    finally{lock.current=false;setBusy(false);}
  }
  return <div className="modal-overlay"><section className="modal modal-lg" role="dialog" aria-modal="true" aria-labelledby="import-backup-heading"><header className="modal-header"><h3 id="import-backup-heading">Import backup · Super Admin</h3><button type="button" disabled={busy} className="modal-close" aria-label="Close import backup" onClick={onClose}>×</button></header><div className="modal-body space-y-4">
    {!restored&&<><p>Upload an NSTP database-and-storage ZIP. Uploading does not change your current data.</p>{history.length>0&&<details><summary>Previous imports and recovery history</summary><ul className="space-y-2">{history.map(row=><li key={row.id}><button className="btn btn-secondary btn-sm" disabled={busy||!!row.restored_at} onClick={()=>{setBackup(row);setConfirm('');setPassword('');setUnderstand(false);}}>{row.filename} · {row.restored_at?'Restored':row.tested?'Tested':'Imported'}</button></li>)}</ul></details>}<label className="block">Backup ZIP (maximum 100 MB)<input type="file" accept=".zip,application/zip" disabled={busy} className="input" onChange={e=>{setFile(e.target.files?.[0]??null);setBackup(null);setMessage('');setConfirm('');setUnderstand(false);setPassword('');}}/></label><button type="button" className="btn btn-primary" disabled={busy||!file} onClick={()=>run('upload')}>Upload and verify</button>
    {backup&&<><div className="border rounded-lg p-4 space-y-2"><p className="font-semibold">{backup.filename}</p><p>Backup date: {backup.backup_date?new Date(backup.backup_date).toLocaleString():'Not recorded in this older backup'}</p><p>{backup.files} files · Database: {backup.driver}</p><p className={backup.legacy?'text-amber-700':'text-emerald-700'}>{backup.legacy?'Older backup: original integrity cannot be fully verified. Recovery testing is required.':'Archive checksums verified. Only restore backups you trust.'}</p><button type="button" className="btn btn-secondary" disabled={busy} onClick={()=>run('test')}>Test recovery in separate database</button></div>
    {backup.tested&&<div className="border border-amber-300 rounded-lg p-4 space-y-3"><p>Recovery test passed · {backup.test_tables} tables checked. Test expires: {new Date(backup.test_expires_at!).toLocaleTimeString()}.</p><p className="font-semibold">Full restore replaces database records and uploaded files. Records newer than this backup may be lost. A safety backup is created first.</p><label className="flex gap-2"><input type="checkbox" checked={understand} disabled={busy} onChange={e=>setUnderstand(e.target.checked)}/>I understand that current data will be replaced.</label><label className="block">Type RESTORE<input className="input" disabled={busy} value={confirm} onChange={e=>setConfirm(e.target.value)}/></label><label className="block">Your Super Admin password<input className="input" type="password" autoComplete="current-password" disabled={busy} value={password} onChange={e=>setPassword(e.target.value)}/></label><button type="button" className="btn btn-danger" disabled={busy||!understand||confirm!=='RESTORE'||!password} onClick={()=>run('restore')}>Create safety backup and restore</button></div>}</>}
    </>}
    {busy&&<p role="status">{confirm==='RESTORE'?'Recovery operation running. Do not refresh or submit again.':'Checking backup. Please wait…'}</p>}<p role="status" className="whitespace-pre-wrap">{message}</p>{restored&&<button type="button" className="btn btn-primary" onClick={signInAgain}>Sign in again</button>}
  </div></section></div>;
}
