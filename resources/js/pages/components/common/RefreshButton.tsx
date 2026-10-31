// src/components/common/RefreshButton.tsx
import React from 'react';

interface RefreshButtonProps {
  onRefresh: () => void;
  isLoading?: boolean;
  label?: string;
  className?: string;
  disabled?: boolean;    // ← add this
}

const RefreshButton: React.FC<RefreshButtonProps> = ({
  onRefresh,
  isLoading = false,
  label = 'Refresh',
  className = '',
  disabled = false,      // ← add this
}) => {
  return (
    <button
      className={`btn btn-secondary ${className}`}
      onClick={onRefresh}
      disabled={isLoading || disabled}     // ← add "|| disabled"
      title="Refresh data"
    >
      <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-sync'}`} />
      {isLoading ? 'Refreshing...' : label}
    </button>
  );
};

export default RefreshButton;