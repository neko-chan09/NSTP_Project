import React from 'react';
import {useQuery} from '@tanstack/react-query';
import {secureRequest} from '../../../services/secureRequest';
import {getCurrentUserId} from '../../../lib/token';
export default function DirectoryFilters({course,section,onCourse,onSection}:{course:string;section:string;onCourse:(v:string)=>void;onSection:(v:string)=>void}) {
 const query=useQuery({queryKey:['directory-options',getCurrentUserId()],queryFn:()=>secureRequest('/directory/options'),staleTime:0});
 return <div className="flex flex-wrap gap-3"><label>Course<select className="input" value={course} onChange={e=>onCourse(e.target.value)}><option value="">All courses</option>{query.data?.data.courses.map((v:string)=><option key={v}>{v}</option>)}</select></label><label>Section<select className="input" value={section} onChange={e=>onSection(e.target.value)}><option value="">All sections</option>{query.data?.data.sections.map((v:string)=><option key={v}>{v}</option>)}</select></label>{query.error&&<button type="button" className="btn btn-secondary" onClick={()=>query.refetch()}>Retry filters</button>}</div>
}
