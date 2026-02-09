import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DEBUG_QK } from "@/features/debug/api/queryKeys";
import {
  deleteStoreRow,
  listStoreRows,
  listStoresInfo,
  putStoreRow,
} from "@/features/debug/api/debugDb";
import {
  DEBUG_PRIMARY_KEY_FIELD,
  type DebugRow,
  type StoreInfo,
  type StoreName,
  type StorePrimaryKeyField,
} from "@/features/debug/types";

const PAGE_SIZE = 10;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPrimaryKeyField(storeName: StoreName): StorePrimaryKeyField {
  return DEBUG_PRIMARY_KEY_FIELD[storeName];
}

export interface UseDebugDbResult {
  pageSize: number;

  selectedStore: StoreName;
  primaryKeyField: StorePrimaryKeyField;
  offset: number;

  storesInfo: StoreInfo[];
  storesLoading: boolean;

  storeRows: DebugRow[];
  dataLoading: boolean;

  editKey: string | null;
  editData: string;
  isUpdating: boolean;
  isDeleting: boolean;

  setEditData: (next: string) => void;
  selectStore: (storeName: StoreName) => void;
  prevPage: () => void;
  nextPage: () => void;

  startEdit: (row: DebugRow) => void;
  cancelEdit: () => void;
  saveEdit: () => Promise<{ ok: true } | { ok: false; error: string }>;
  deleteRow: (primaryKey: string) => Promise<void>;
}

export function useDebugDb(): UseDebugDbResult {
  const queryClient = useQueryClient();

  const [selectedStore, setSelectedStore] = useState<StoreName>("plants");
  const [offset, setOffset] = useState(0);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editData, setEditData] = useState<string>("");

  const primaryKeyField = useMemo(() => getPrimaryKeyField(selectedStore), [selectedStore]);

  const { data: storesInfo = [], isLoading: storesLoading } = useQuery({
    queryKey: DEBUG_QK.storesInfo(),
    queryFn: listStoresInfo,
  });

  const { data: storeRows = [], isLoading: dataLoading } = useQuery({
    queryKey: DEBUG_QK.storeData(selectedStore, offset, PAGE_SIZE),
    queryFn: () => listStoreRows({ storeName: selectedStore, offset, limit: PAGE_SIZE }),
  });

  const updateMutation = useMutation({
    mutationFn: async (vars: { storeName: StoreName; value: unknown }) => {
      await putStoreRow(vars);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEBUG_QK.all() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (vars: { storeName: StoreName; primaryKey: string }) => {
      await deleteStoreRow({ storeName: vars.storeName, primaryKey: vars.primaryKey });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEBUG_QK.all() });
    },
  });

  const cancelEdit = () => {
    setEditKey(null);
    setEditData("");
  };

  const selectStore = (storeName: StoreName) => {
    setSelectedStore(storeName);
    setOffset(0);
    cancelEdit();
  };

  const prevPage = () => {
    setOffset((curr) => Math.max(0, curr - PAGE_SIZE));
  };

  const nextPage = () => {
    setOffset((curr) => curr + PAGE_SIZE);
  };

  const startEdit = (row: DebugRow) => {
    setEditKey(row.primaryKey);
    setEditData(JSON.stringify(row.value, null, 2));
  };

  const saveEdit = async (): Promise<{ ok: true } | { ok: false; error: string }> => {
    if (!editKey) return { ok: false, error: "편집 중인 항목이 없습니다." };

    let parsed: unknown;
    try {
      parsed = JSON.parse(editData);
    } catch {
      return { ok: false, error: "JSON 형식이 잘못되었습니다." };
    }

    if (!isRecord(parsed)) {
      return { ok: false, error: "JSON은 객체 형태여야 합니다." };
    }

    const valueToSave: Record<string, unknown> = {
      ...parsed,
      [primaryKeyField]: editKey,
    };

    await updateMutation.mutateAsync({ storeName: selectedStore, value: valueToSave });
    cancelEdit();
    return { ok: true };
  };

  const deleteRow = async (primaryKey: string): Promise<void> => {
    await deleteMutation.mutateAsync({ storeName: selectedStore, primaryKey });
  };

  return {
    pageSize: PAGE_SIZE,
    selectedStore,
    primaryKeyField,
    offset,
    storesInfo,
    storesLoading,
    storeRows,
    dataLoading,
    editKey,
    editData,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    setEditData,
    selectStore,
    prevPage,
    nextPage,
    startEdit,
    cancelEdit,
    saveEdit,
    deleteRow,
  };
}
