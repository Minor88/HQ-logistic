
import React, { useState } from "react";
import { 
  ArrowDown, 
  ArrowUp, 
  Search, 
  Filter, 
  RefreshCcw, 
  Download, 
  Plus 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableColumn } from "./types";

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  onRowClick?: (row: T) => void;
  searchable?: boolean;
  filterable?: boolean;
  onSearch?: (value: string) => void;
  onAdd?: () => void;
  onExport?: () => void;
  onResetFilters?: () => void;
  title?: string;
  actions?: React.ReactNode;
  isLoading?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  searchable = true,
  filterable = true,
  onSearch,
  onAdd,
  onExport,
  onResetFilters,
  title,
  actions,
  isLoading = false,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Handle sorting
  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    
    if (sortConfig && sortConfig.key === key) {
      direction = sortConfig.direction === "asc" ? "desc" : "asc";
    }
    
    setSortConfig({ key, direction });
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch?.(value);
  };

  // Sort data if sort config exists
  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data;
    
    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {title && <h2 className="text-xl font-semibold">{title}</h2>}
        
        <div className="flex items-center gap-3">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10 w-64"
              />
            </div>
          )}
          
          {filterable && onResetFilters && (
            <Button variant="outline" onClick={onResetFilters} className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              <span>Reset</span>
            </Button>
          )}
          
          {onExport && (
            <Button variant="outline" onClick={onExport} className="gap-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          )}
          
          {onAdd && (
            <Button onClick={onAdd} className="gap-2 bg-apple-purple hover:bg-apple-purple/90">
              <Plus className="h-4 w-4" />
              <span>Add New</span>
            </Button>
          )}
          
          {actions}
        </div>
      </div>
      
      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="apple-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th 
                    key={column.key as string} 
                    className={column.sortable ? "cursor-pointer select-none" : ""}
                    onClick={column.sortable ? () => handleSort(column.key as string) : undefined}
                  >
                    <div className="flex items-center gap-2">
                      <span>{column.header}</span>
                      {column.sortable && sortConfig?.key === column.key && (
                        sortConfig.direction === "asc" 
                          ? <ArrowUp className="h-4 w-4" />
                          : <ArrowDown className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-8">
                    Loading...
                  </td>
                </tr>
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-8">
                    No data available
                  </td>
                </tr>
              ) : (
                sortedData.map((row, index) => (
                  <tr 
                    key={index} 
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={onRowClick ? "cursor-pointer" : ""}
                  >
                    {columns.map((column) => (
                      <td key={`${index}-${column.key as string}`}>
                        {column.cell ? column.cell(row) : row[column.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
