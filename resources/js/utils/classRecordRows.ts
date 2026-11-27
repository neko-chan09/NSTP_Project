export const attendanceStatuses = ['all', 'present', 'late', 'absent', 'excused', 'not_recorded'] as const;
export type RecordStatus = typeof attendanceStatuses[number];
export const attendanceLabel = (value: string) => ({all:'All', present:'Present', late:'Late', absent:'Absent', excused:'Excused', not_recorded:'Not recorded'}[value] ?? value);
export interface RosterStudent {id:number; student_id:string; course?:string; section?:string; user?:{first_name?:string;last_name?:string;middle_name?:string}}
export interface RecordLog {id:number;student_id:number;attendance_mark?:string;status?:string;review_status?:string;check_in_at?:string|null;check_out_at?:string|null;time_in_received_at?:string|null;time_out_received_at?:string|null;credited_hours?:number|string|null}
export function classRecordRows(students:RosterStudent[], logs:RecordLog[]){
  const byStudent = new Map<number,RecordLog>();
  for(const log of logs){const previous=byStudent.get(Number(log.student_id));if(!previous||log.id>previous.id)byStudent.set(Number(log.student_id),log);}
  return students.map(student=>{const log=byStudent.get(Number(student.id));return {student,log,status:log?(log.attendance_mark||log.status||'not_recorded'):'not_recorded'};});
}
export function filterClassRecordRows(rows:ReturnType<typeof classRecordRows>,search:string,status:RecordStatus){
  const words=search.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return rows.filter(row=>{
    const {student}=row;const text=[student.student_id,student.user?.first_name,student.user?.middle_name,student.user?.last_name].filter(Boolean).join(' ').toLocaleLowerCase();
    return (status==='all'||row.status===status)&&words.every(word=>text.includes(word));
  });
}
