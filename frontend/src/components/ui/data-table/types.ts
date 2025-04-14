
export interface DataTableColumn<T> {
  key: keyof T | string;
  header: string;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  filterOptions?: { label: string; value: string }[];
  width?: string;
}
