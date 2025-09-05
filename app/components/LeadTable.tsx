'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useLeads, Lead, LeadFilters } from '../context/LeadContext';

type SortField = keyof Lead | '';
type SortDirection = 'asc' | 'desc';

interface LeadTableProps {
  filters?: LeadFilters;
  onLeadClick?: (lead: Lead) => void;
  selectedLeads?: Set<string>;
  onLeadSelection?: (leadId: string, checked: boolean) => void;
  selectAll?: boolean;
  onSelectAll?: (checked: boolean) => void;
  leads?: Lead[]; // Allow passing custom leads array
  showActions?: boolean; // Show action buttons
  actionButtons?: (lead: Lead) => React.ReactNode; // Custom action buttons
  emptyMessage?: string; // Custom empty message
  className?: string; // Additional CSS classes
}

function LeadTable({ 
  filters = {}, 
  onLeadClick, 
  selectedLeads = new Set(), 
  onLeadSelection, 
  selectAll = false, 
  onSelectAll,
  leads: customLeads,
  showActions = false,
  actionButtons,
  emptyMessage = "No leads found matching the current filters.",
  className = ""
}: LeadTableProps) {
  const { leads: contextLeads, getFilteredLeads } = useLeads();
  const [sortField, setSortField] = useState<SortField>('');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  // Use custom leads if provided, otherwise use context leads
  const leads = customLeads || contextLeads;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (dropdownOpen) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);
  
  // Get filtered leads
  const filteredLeads = useMemo(() => {
    if (customLeads) {
      // If custom leads are provided, return them as is (no filtering)
      return customLeads;
    }
    return getFilteredLeads(filters);
  }, [getFilteredLeads, filters, leads, customLeads]);
  
  // Sort leads based on current sort field and direction
  const sortedLeads = useMemo(() => {
    if (!sortField) return filteredLeads;
    
    return [...filteredLeads].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === undefined || bValue === undefined) return 0;
      
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else {
        comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredLeads, sortField, sortDirection]);
  
  console.log('LeadTable - sorted leads:', sortedLeads);
  
  // Handle column header click for sorting
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);
  
  // Render sort indicator
  const renderSortIndicator = useCallback((field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  }, [sortField, sortDirection]);
  
  // Format date for display in DD-MM-YYYY format
  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return '';
    
    // If already in DD-MM-YYYY format, return as is
    if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
      return dateString;
    }
    
    // If it's a Date object or ISO string, convert to DD-MM-YYYY
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // Return original if invalid
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}-${month}-${year}`;
    } catch {
      return dateString; // Return original if conversion fails
    }
  }, []);
  
  // Get status color
  const getStatusColor = useCallback((status: Lead['status']) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'CNR': return 'bg-orange-100 text-orange-800';
      case 'Busy': return 'bg-yellow-100 text-yellow-800';
      case 'Follow-up': return 'bg-purple-100 text-purple-800';
      case 'Deal Close': return 'bg-green-100 text-green-800';
      case 'Work Alloted': return 'bg-indigo-100 text-indigo-800';
      case 'Hotlead': return 'bg-red-100 text-red-800';
      case 'Mandate Sent': return 'bg-teal-100 text-teal-800';
      case 'Documentation': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  // Calculate column span for empty state
  const getColumnSpan = () => {
    let span = 10; // Base columns: KVA, Connection Date, Consumer Number, Company, Client Name, Discom, Mobile Number, Status, Last Activity, Next Follow-up
    if (onLeadSelection) span += 1; // Add checkbox column
    if (showActions) span += 1; // Add actions column
    return span;
  };

  return (
    <div className={`overflow-x-auto shadow-md rounded-lg relative ${className}`}>
      <table className="min-w-full divide-y divide-gray-200 bg-white">
        <thead className="bg-gray-50">
          <tr>
            {onLeadSelection && (
              <th scope="col" className="px-0.5 py-3 text-left w-10">
                <div className="w-8 h-8 flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    ref={(input) => {
                      if (input) {
                        const selectedCount = selectedLeads ? selectedLeads.size : 0;
                        input.indeterminate = selectedCount > 0 && selectedCount < filteredLeads.length;
                      }
                    }}
                    onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    aria-label="Select all leads"
                  />
                </div>
              </th>
            )}
            <th 
              scope="col" 
              className="px-0.5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-12"
              onClick={() => handleSort('kva')}
            >
              KVA{renderSortIndicator('kva')}
            </th>
            <th 
              scope="col" 
              className="px-0.5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-20"
              onClick={() => handleSort('connectionDate')}
            >
              Connection Date{renderSortIndicator('connectionDate')}
            </th>
            <th 
              scope="col" 
              className="px-0.5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-16"
              onClick={() => handleSort('consumerNumber')}
            >
              Consumer Number{renderSortIndicator('consumerNumber')}
            </th>
            <th 
              scope="col" 
              className="px-0.5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-28"
              onClick={() => handleSort('company')}
            >
              Company{renderSortIndicator('company')}
            </th>
            <th 
              scope="col" 
              className="px-0.5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-24"
              onClick={() => handleSort('clientName')}
            >
              Client Name{renderSortIndicator('clientName')}
            </th>
            <th 
              scope="col" 
              className="px-0.5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-12"
              onClick={() => handleSort('discom')}
            >
              Discom{renderSortIndicator('discom')}
            </th>
            <th 
              scope="col" 
              className="px-0.5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-16"
              onClick={() => handleSort('mobileNumber')}
            >
              Mobile Number{renderSortIndicator('mobileNumber')}
            </th>
            <th 
              scope="col" 
              className="px-0.5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-16"
              onClick={() => handleSort('status')}
            >
              Status{renderSortIndicator('status')}
            </th>
            <th 
              scope="col" 
              className="px-0.5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-18"
              onClick={() => handleSort('lastActivityDate')}
            >
              Last Activity{renderSortIndicator('lastActivityDate')}
            </th>
            <th 
              scope="col" 
              className="px-0.5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-18"
              onClick={() => handleSort('followUpDate')}
            >
              Next Follow-up{renderSortIndicator('followUpDate')}
            </th>
            {showActions && (
              <th scope="col" className="px-0.5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedLeads.length > 0 ? (
            sortedLeads.map((lead) => (
              <tr 
                key={lead.id} 
                className="cursor-pointer hover:bg-gray-50 transition-colors duration-150"
                onClick={() => onLeadClick && onLeadClick(lead)}
              >
                {onLeadSelection && (
                  <td className="px-0.5 py-2 whitespace-nowrap">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selectedLeads.has(lead.id)}
                        onChange={(e) => onLeadSelection && onLeadSelection(lead.id, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        aria-label={`Select lead ${lead.kva}`}
                      />
                    </div>
                  </td>
                )}
                <td className="px-0.5 py-2 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{lead.kva}</div>
                </td>
                <td className="px-0.5 py-2 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{lead.connectionDate}</div>
                </td>
                <td className="px-0.5 py-2 whitespace-nowrap">
                  <div className="text-sm text-gray-500 max-w-16 truncate">{lead.consumerNumber}</div>
                </td>
                <td className="px-0.5 py-2 whitespace-nowrap">
                  <div className="text-sm text-gray-500 max-w-28 truncate" title={lead.company}>{lead.company}</div>
                </td>
                <td className="px-0.5 py-2 whitespace-nowrap">
                  <div className="text-sm text-gray-500 max-w-24 truncate" title={lead.clientName}>{lead.clientName}</div>
                </td>
                <td className="px-0.5 py-2 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{lead.discom || 'N/A'}</div>
                </td>
                <td className="px-0.5 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 max-w-16 truncate">
                    {(lead.mobileNumbers?.find(m => m.isMain)?.number || lead.mobileNumber)?.replace(/-/g, '') || ''}
                  </div>
                </td>
                <td className="px-0.8 py-2 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-0.5 py-2 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{formatDate(lead.lastActivityDate)}</div>
                </td>
                <td className="px-0.5 py-2 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{formatDate(lead.followUpDate)}</div>
                </td>
                {showActions && (
                  <td className="px-0.5 py-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    {actionButtons && actionButtons(lead)}
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={getColumnSpan()} className="px-0.5 py-2 text-center text-sm text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default LeadTable;