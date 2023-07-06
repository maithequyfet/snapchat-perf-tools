/* eslint-disable react/jsx-key */
import { ClassAttributes, HTMLAttributes, HTMLProps, useEffect, useMemo, useRef } from 'react';
import { useTable as useReactTable, useRowSelect, useSortBy, usePagination, Column, Hooks } from 'react-table';

function IndeterminateCheckbox({
  indeterminate,
  className = '',
  ...rest
}: { indeterminate?: boolean } & HTMLProps<HTMLInputElement>) {
  const ref = useRef<HTMLInputElement>(null!);

  useEffect(() => {
    if (typeof indeterminate === 'boolean') {
      ref.current.indeterminate = !rest.checked && indeterminate;
    }
  }, [indeterminate, rest.checked]);

  return <input type="checkbox" ref={ref} className={className + ' checkbox'} {...rest} />;
}

const pageSizeOptions = [10, 20, 50, 100, 200];

interface Props<T extends object> {
  columns: Column<T>[];
  data: T[];
  sortBy?: { id: string; desc: boolean }[];
}

function useTable<T extends object>({ columns, data, sortBy }: Props<T>) {
  const selectHook = (hooks: Hooks<T>) => {
    hooks.visibleColumns.push((columns) => [
      {
        id: 'selection',
        Header: ({ getToggleAllPageRowsSelectedProps }: any) => (
          <div className="flex justify-center">
            <IndeterminateCheckbox {...getToggleAllPageRowsSelectedProps()} />
          </div>
        ),
        Cell: ({ row }: any) => (
          <div className="flex justify-center">
            <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
          </div>
        ),
      },
      ...columns,
    ]);
  };

  const options = useMemo(
    () => ({
      columns,
      data,
      initialState: { sortBy },
      autoResetPage: false,
      autoResetExpanded: false,
      autoResetGroupBy: false,
      autoResetSelectedRows: false,
      autoResetSortBy: false,
      autoResetFilters: false,
      autoResetRowState: false,
    }),
    [columns, data, sortBy],
  ) as any;

  const tableInstance = useReactTable(options, useSortBy, usePagination, useRowSelect, selectHook) as any;

  const {
    page,
    canNextPage,
    canPreviousPage,
    getTableProps,
    getTableBodyProps,
    headerGroups,
    nextPage,
    prepareRow,
    previousPage,
    setPageSize,
    selectedFlatRows,
    state: { selectedRowIds, pageIndex, pageSize },
  } = tableInstance;

  return {
    selectedFlatRows: selectedFlatRows.map((d: { original: any }) => d.original),
    selectedRowIds,
    renderTable: () => (
      <div className="overflow-x-auto w-full">
        <table className="table table-compact table-zebra w-full" {...getTableProps()}>
          <thead>
            {headerGroups.map(
              (headerGroup: {
                getHeaderGroupProps: () => JSX.IntrinsicAttributes &
                  ClassAttributes<HTMLTableRowElement> &
                  HTMLAttributes<HTMLTableRowElement>;
                headers: any[];
              }) => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map((column: any) => (
                    <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                      {column.render('Header')}
                      <span>{column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}</span>
                    </th>
                  ))}
                </tr>
              ),
            )}
          </thead>
          <tbody {...getTableBodyProps()}>
            {page.map((row: any) => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()}>
                  {row.cells.map((cell: any) => {
                    return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="p-4 flex gap-2 justify-end bg-stone-300">
          <div className="btn-group">
            <button className="btn btn-sm" onClick={previousPage} disabled={!canPreviousPage}>
              «
            </button>
            <button className="btn btn-sm">Page {pageIndex + 1}</button>
            <button className="btn btn-sm" onClick={nextPage} disabled={!canNextPage}>
              »
            </button>
          </div>
          <select
            className="select select-sm"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
            }}
          >
            {pageSizeOptions.map((pageSize: number) => (
              <option key={pageSize} value={pageSize}>
                {`Show ${pageSize} items`}
              </option>
            ))}
          </select>
        </div>
      </div>
    ),
  };
}

export default useTable;
