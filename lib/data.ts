"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/toast";
import { supabaseBrowser } from "./supabase/client";

export type Row = Record<string, unknown> & { id: string };

// Turns database error text into something a person can act on.
export function friendlyError(error: { message?: string; code?: string } | null | undefined): Error {
  const message = error?.message ?? "";
  if (error?.code === "23503") return new Error("This is still in use elsewhere, so it can't be removed.");
  if (error?.code === "23505") return new Error("You already have one of those.");
  if (error?.code === "23514") {
    return new Error(
      /long_number|payee|notes|name/.test(message)
        ? "That looks like a card or account number. Serein never stores those."
        : "One of those values is not allowed.",
    );
  }
  if (error?.code === "42501") return new Error("Your session has locked. Answer your security question again.");
  return new Error(message || "Something went wrong.");
}

export interface ListOptions {
  select?: string;
  filters?: [string, string, unknown][];
  order?: [string, { ascending?: boolean; nullsFirst?: boolean }?][];
  limit?: number;
  enabled?: boolean;
}

export function useRows<T = Row>(table: string, options: ListOptions = {}) {
  const { select = "*", filters = [], order = [], limit, enabled = true } = options;
  return useQuery({
    queryKey: [table, "list", select, filters, order, limit],
    enabled,
    queryFn: async () => {
      let query = supabaseBrowser().from(table).select(select);
      for (const [column, operator, value] of filters) {
        query = query.filter(column, operator, value as string);
      }
      for (const [column, sort] of order) {
        query = query.order(column, sort);
      }
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw friendlyError(error);
      return (data ?? []) as T[];
    },
  });
}

export function useRpc<T = Row[]>(name: string, args?: Record<string, unknown>, enabled = true) {
  return useQuery({
    queryKey: ["rpc", name, args],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabaseBrowser().rpc(name, args);
      if (error) throw friendlyError(error);
      return data as T;
    },
  });
}

// Everything derived from one table lives under the "rpc" key, so after any write
// the charts and totals simply refetch.
export function invalidateTable(client: QueryClient, table: string) {
  void client.invalidateQueries({ queryKey: [table] });
  void client.invalidateQueries({ queryKey: ["rpc"] });
}

export function useSave(table: string, options: { successMessage?: string; alsoInvalidate?: string[] } = {}) {
  const client = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const { id, ...rest } = values;
      const query = id
        ? supabaseBrowser().from(table).update(rest).eq("id", id as string).select().single()
        : supabaseBrowser().from(table).insert(rest).select().single();
      const { data, error } = await query;
      if (error) throw friendlyError(error);
      return data as Row;
    },
    onSuccess: () => {
      invalidateTable(client, table);
      options.alsoInvalidate?.forEach((name) => invalidateTable(client, name));
      if (options.successMessage) toast(options.successMessage);
    },
    onError: (error) => toast(error.message, { tone: "error" }),
  });
}

export function useRemove(table: string, options: { alsoInvalidate?: string[]; successMessage?: string } = {}) {
  const client = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseBrowser().from(table).delete().eq("id", id);
      if (error) throw friendlyError(error);
    },
    onSuccess: () => {
      invalidateTable(client, table);
      options.alsoInvalidate?.forEach((name) => invalidateTable(client, name));
      toast(options.successMessage ?? "Deleted");
    },
    onError: (error) => toast(error.message, { tone: "error" }),
  });
}

export function useRpcAction<A extends Record<string, unknown>>(
  name: string,
  options: { invalidate?: string[]; successMessage?: string } = {},
) {
  const client = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (args: A) => {
      const { data, error } = await supabaseBrowser().rpc(name, args);
      if (error) throw friendlyError(error);
      return data;
    },
    onSuccess: () => {
      options.invalidate?.forEach((table) => invalidateTable(client, table));
      void client.invalidateQueries({ queryKey: ["rpc"] });
      if (options.successMessage) toast(options.successMessage);
    },
    onError: (error) => toast(error.message, { tone: "error" }),
  });
}
