import { supabase } from './supabaseClient';
import { FileSystemItem, FileType, FolderPermissions } from '../types';

const mapFile = (dbFile: any): FileSystemItem => ({
  id: dbFile.id,
  groupId: dbFile.group_id,
  parentId: dbFile.parent_id,
  name: dbFile.name,
  type: dbFile.type as FileType,
  size: dbFile.size,
  url: dbFile.url,
  createdAt: dbFile.created_at,
  createdBy: dbFile.uploader_id,
  updatedAt: dbFile.updated_at,
  permissions: {
    view: ['owner', 'admin', 'member'],
    upload: ['owner', 'admin', 'member'],
    edit: ['owner', 'admin'],
    manage: ['owner']
  }
});

const getFileType = (mimeType: string): FileType => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'unknown';
};

export const fileService = {
  async getFiles(groupId: string, parentId: string | null = null): Promise<FileSystemItem[]> {
    let query = supabase
      .from('files')
      .select('*')
      .eq('group_id', groupId);
    
    if (parentId === null) {
      query = query.is('parent_id', null);
    } else {
      query = query.eq('parent_id', parentId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapFile);
  },

  async createFolder(groupId: string, parentId: string | null, name: string, userId: string): Promise<FileSystemItem> {
    const { data, error } = await supabase
      .from('files')
      .insert({
        group_id: groupId,
        parent_id: parentId,
        uploader_id: userId,
        name,
        type: 'folder'
      })
      .select()
      .single();

    if (error) throw error;
    return mapFile(data);
  },

  async uploadFile(groupId: string, parentId: string | null, file: File, userId: string): Promise<FileSystemItem> {
    if (file.size > 50 * 1024 * 1024) {
      throw new Error("File size exceeds 50MB limit.");
    }
    const fileId = crypto.randomUUID();
    const safeName = file.name.replace(/[^\x00-\x7F]/g, "_"); 
    const storagePath = `${groupId}/${fileId}/${safeName}`;

    // 1. Upload Binary
    const { error: uploadError } = await supabase.storage
      .from('files')
      .upload(storagePath, file);

    if (uploadError) throw uploadError;

    // 2. Save Metadata
    const { data, error: dbError } = await supabase
      .from('files')
      .insert({
        id: fileId,
        group_id: groupId,
        parent_id: parentId,
        uploader_id: userId,
        name: file.name,
        type: getFileType(file.type),
        size: file.size,
        url: storagePath
      })
      .select()
      .single();

    if (dbError) {
      // Best effort cleanup on metadata failure
      await supabase.storage.from('files').remove([storagePath]);
      throw dbError;
    }

    return mapFile(data);
  },

  async deleteFileItem(itemId: string): Promise<void> {
    const { data: item, error: getError } = await supabase
      .from('files')
      .select('*')
      .eq('id', itemId)
      .single();

    if (getError) throw getError;

    if (item.type === 'folder') {
      const { count, error: countError } = await supabase
        .from('files')
        .select('*', { count: 'exact', head: true })
        .eq('parent_id', itemId);
      
      if (countError) throw countError;
      if (count && count > 0) {
        throw new Error("Please delete files inside this folder first.");
      }
    } else if (item.url) {
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove([item.url]);
      
      if (storageError) console.error("Storage delete failed:", storageError);
    }

    const { error: dbError } = await supabase
      .from('files')
      .delete()
      .eq('id', itemId);

    if (dbError) throw dbError;
  },

  async renameItem(itemId: string, newName: string): Promise<void> {
    const { error } = await supabase
      .from('files')
      .update({ name: newName, updated_at: new Date().toISOString() })
      .eq('id', itemId);
    
    if (error) throw error;
  },

  async getFileItem(itemId: string): Promise<FileSystemItem | undefined> {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('id', itemId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined; // Not found
      throw error;
    }
    return mapFile(data);
  },

  async getSignedUrl(storagePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('files')
      .createSignedUrl(storagePath, 3600); // 1 hour

    if (error) throw error;
    return data.signedUrl;
  }
};
