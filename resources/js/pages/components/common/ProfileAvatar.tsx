import React, { useEffect, useState } from 'react';

export default function ProfileAvatar({ src, firstName, lastName, className = '' }: {
  src?: string | null; firstName?: string; lastName?: string; className?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || 'U';
  return <div className={`relative overflow-hidden rounded-full flex-shrink-0 bg-gold-100 text-navy-900 flex items-center justify-center font-semibold ${className}`}>
    <span aria-hidden={!!src && !failed}>{initials}</span>
    {src && !failed && <img src={src} alt={`${firstName ?? ''} ${lastName ?? ''}`.trim() || 'Profile photo'}
      className="absolute inset-0 h-full w-full object-cover" onError={() => setFailed(true)} />}
  </div>;
}
