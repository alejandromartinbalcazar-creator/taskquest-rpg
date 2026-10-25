import { DungeonFloor, Player, Task } from '../types';
import { supabase } from './supabaseClient';

export interface CloudSaveSnapshot {
  schemaVersion: 1;
  player: Player;
  tasks: Task[];
  dungeons: DungeonFloor[];
}

export interface CloudSaveRecord {
  saveData: CloudSaveSnapshot;
  revision: number;
  updatedAt: string;
}

interface CloudSaveRow {
  save_data: CloudSaveSnapshot;
  revision: number;
  updated_at: string;
}

function getClient() {
  if (!supabase) throw new Error('La sincronización todavía no está configurada.');
  return supabase;
}

function toRecord(row: CloudSaveRow): CloudSaveRecord {
  return {
    saveData: row.save_data,
    revision: row.revision,
    updatedAt: row.updated_at,
  };
}

export async function loadCloudSave(userId: string): Promise<CloudSaveRecord | null> {
  const { data, error } = await getClient()
    .from('focusmission_saves')
    .select('save_data, revision, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ? toRecord(data as CloudSaveRow) : null;
}

export async function createCloudSave(
  userId: string,
  saveData: CloudSaveSnapshot,
): Promise<CloudSaveRecord> {
  const { data, error } = await getClient()
    .from('focusmission_saves')
    .insert({
      user_id: userId,
      save_data: saveData,
      schema_version: saveData.schemaVersion,
      revision: 1,
    })
    .select('save_data, revision, updated_at')
    .single();

  if (error) throw error;
  return toRecord(data as CloudSaveRow);
}

export async function updateCloudSave(
  userId: string,
  saveData: CloudSaveSnapshot,
  expectedRevision: number,
): Promise<CloudSaveRecord | null> {
  const { data, error } = await getClient()
    .from('focusmission_saves')
    .update({
      save_data: saveData,
      schema_version: saveData.schemaVersion,
      revision: expectedRevision + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('revision', expectedRevision)
    .select('save_data, revision, updated_at')
    .maybeSingle();

  if (error) throw error;
  return data ? toRecord(data as CloudSaveRow) : null;
}
