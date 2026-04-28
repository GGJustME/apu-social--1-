
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { FileSystemItem, User, FolderPermissions, UserRole } from '../types';
import { api } from '../services/api';
import { 
  Folder, FileText, Image as ImageIcon, Film, Music, Box, MoreVertical, 
  ChevronRight, Home, Upload, FolderPlus, Search, ArrowLeft, Trash2, 
  Edit2, Eye, Shield, Check, X, Lock, Download 
} from 'lucide-react';

interface FileExplorerProps {
  groupId: string;
  currentUser: User;
  userRole: UserRole; // 'owner' | 'admin' | 'member'
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ groupId, currentUser, userRole }) => {
  const [currentPath, setCurrentPath] = useState<FileSystemItem[]>([]);
  const [items, setItems] = useState<FileSystemItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [permissionModalItem, setPermissionModalItem] = useState<FileSystemItem | null>(null);
  const [previewItem, setPreviewItem] = useState<FileSystemItem | null>(null);
  
  // Actions
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [renameItemId, setRenameItemId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  
  const currentFolder = currentPath.length > 0 ? currentPath[currentPath.length - 1] : null;
  const currentFolderId = currentFolder ? currentFolder.id : null;

  // --- Permission Helpers ---
  const getEffectivePermissions = (item: FileSystemItem | null): FolderPermissions => {
    // If no item (root), defaults apply. 
    // In a real app, root permissions might be fetched from Group settings.
    return item?.permissions || {
      view: ['owner', 'admin', 'member'],
      upload: ['owner', 'admin', 'member'],
      edit: ['owner', 'admin'],
      manage: ['owner']
    };
  };

  const currentPermissions = getEffectivePermissions(currentFolder);

  const canView = (item: FileSystemItem) => item.permissions.view.includes(userRole);
  const canUpload = currentPermissions.upload.includes(userRole);
  const canEdit = (item: FileSystemItem) => item.permissions.edit.includes(userRole);
  const canManage = (item: FileSystemItem) => item.permissions.manage.includes(userRole);

  const refreshFiles = async () => {
    setLoading(true);
    const files = await api.getFiles(groupId, currentFolderId);
    setItems(files);
    setLoading(false);
  };

  useEffect(() => {
    refreshFiles();
    setSelectedItem(null);
  }, [groupId, currentFolderId]);

  const handleNavigate = (folder: FileSystemItem) => {
    if (!canView(folder)) {
      alert("Access Denied: You do not have permission to view this folder.");
      return;
    }
    setCurrentPath([...currentPath, folder]);
  };

  const handleNavigateUp = () => {
    if (currentPath.length === 0) return;
    setCurrentPath(currentPath.slice(0, -1));
  };

  const handleBreadcrumbClick = (index: number) => {
    setCurrentPath(currentPath.slice(0, index + 1));
  };

  const handleCreateFolder = async (name: string) => {
    if (!name.trim()) return;
    // Inherit permissions from parent by default
    await api.createFolder(groupId, currentFolderId, name, currentUser.id, currentPermissions);
    setIsNewFolderModalOpen(false);
    refreshFiles();
  };

  const handleUpload = async (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      await api.uploadFile(groupId, currentFolderId, files[i], currentUser.id, currentPermissions);
    }
    setIsUploadModalOpen(false);
    refreshFiles();
  };

  const handleDelete = async (item: FileSystemItem) => {
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      await api.deleteFileItem(item.id);
      refreshFiles();
    }
  };

  const handleRename = async () => {
    if (renameItemId && renameValue.trim()) {
      await api.renameItem(renameItemId, renameValue);
      setRenameItemId(null);
      refreshFiles();
    }
  };

  // --- Icon Helper ---
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'folder': return <Folder className="text-yellow-400 fill-yellow-400" size={40} />;
      case 'pdf': return <FileText className="text-red-500" size={40} />;
      case 'image': return <ImageIcon className="text-blue-500" size={40} />;
      case 'video': return <Film className="text-purple-500" size={40} />;
      case 'audio': return <Music className="text-pink-500" size={40} />;
      default: return <Box className="text-gray-400" size={40} />;
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '--';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // --- Filtered items ---
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) && canView(item)
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      
      {/* 1. Top Bar */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4 justify-between shrink-0 shadow-sm z-10">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 overflow-hidden text-sm">
          <button 
            onClick={() => setCurrentPath([])}
            className={`p-1.5 rounded hover:bg-gray-100 ${currentPath.length === 0 ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}
          >
            <Home size={18} />
          </button>
          {currentPath.map((folder, idx) => (
            <React.Fragment key={folder.id}>
              <ChevronRight size={14} className="text-slate-400" />
              <button 
                onClick={() => handleBreadcrumbClick(idx)}
                className={`px-2 py-1 rounded hover:bg-gray-100 max-w-[120px] truncate ${idx === currentPath.length - 1 ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}
              >
                {folder.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
           <div className="relative hidden md:block">
              <input 
                type="text" 
                placeholder="Search files..." 
                className="pl-9 pr-4 py-1.5 bg-gray-100 border-transparent focus:bg-white focus:ring-2 focus:ring-nexus-500/20 rounded-md text-sm w-48 transition-all"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-2.5 top-2 text-gray-400" size={14} />
           </div>
        </div>
      </div>

      {/* 2. Toolbar */}
      <div className="h-12 bg-gray-50 border-b border-gray-200 flex items-center px-4 gap-2 shrink-0">
        <button 
          onClick={handleNavigateUp} 
          disabled={currentPath.length === 0}
          className="p-2 text-slate-600 hover:bg-gray-200 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="h-6 w-px bg-gray-300 mx-2" />
        
        <button 
            onClick={() => setIsNewFolderModalOpen(true)}
            disabled={!canUpload}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-slate-700 text-xs font-medium rounded-md hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
            <FolderPlus size={16} className="text-yellow-500" /> New Folder
        </button>
        <button 
            onClick={() => setIsUploadModalOpen(true)}
            disabled={!canUpload}
            className="flex items-center gap-2 px-3 py-1.5 bg-nexus-600 text-white text-xs font-medium rounded-md hover:bg-nexus-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
        >
            <Upload size={16} /> Upload
        </button>
        
        {currentFolder && canManage(currentFolder) && (
            <button 
                onClick={() => setPermissionModalItem(currentFolder)}
                className="ml-auto flex items-center gap-2 px-3 py-1.5 text-slate-600 text-xs font-medium rounded-md hover:bg-gray-200 transition-colors"
            >
                <Shield size={16} /> Permissions
            </button>
        )}
      </div>

      {/* 3. Main Content Area */}
      <div 
        className="flex-1 overflow-y-auto p-4"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
            e.preventDefault();
            if (canUpload) handleUpload(e.dataTransfer.files);
        }}
      >
        {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400">Loading...</div>
        ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 border-2 border-dashed border-gray-200 rounded-xl m-4">
                <Box size={48} className="mb-2 opacity-20" />
                <p>This folder is empty</p>
                {canUpload && <p className="text-xs">Drag and drop files here to upload</p>}
            </div>
        ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredItems.map(item => (
                    <div 
                        key={item.id}
                        onClick={() => setSelectedItem(item.id)}
                        onDoubleClick={() => item.type === 'folder' ? handleNavigate(item) : setPreviewItem(item)}
                        className={`group relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col items-center text-center gap-3
                            ${selectedItem === item.id 
                                ? 'bg-nexus-50 border-nexus-200 shadow-md ring-1 ring-nexus-200' 
                                : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
                            }`}
                    >
                        <div className="relative">
                            {getFileIcon(item.type)}
                            {/* Role Badge if special permission */}
                            {!item.permissions.view.includes('member') && (
                                <div className="absolute -top-1 -right-2 bg-amber-100 text-amber-700 p-0.5 rounded-full border border-amber-200" title="Restricted Access">
                                    <Lock size={10} />
                                </div>
                            )}
                        </div>

                        {renameItemId === item.id ? (
                            <input 
                                autoFocus
                                className="w-full text-xs text-center border border-nexus-300 rounded px-1 py-0.5 outline-none focus:ring-2 focus:ring-nexus-500/20"
                                value={renameValue}
                                onChange={e => setRenameValue(e.target.value)}
                                onBlur={handleRename}
                                onKeyDown={e => e.key === 'Enter' && handleRename()}
                                onClick={e => e.stopPropagation()}
                            />
                        ) : (
                            <div className="w-full">
                                <p className="text-sm font-medium text-slate-700 truncate w-full" title={item.name}>{item.name}</p>
                                <p className="text-[10px] text-slate-400 mt-1">{item.type === 'folder' ? 'Folder' : formatSize(item.size)}</p>
                            </div>
                        )}

                        {/* Hover Menu */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="relative group/menu">
                                <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700">
                                    <MoreVertical size={14} />
                                </button>
                                {/* Dropdown */}
                                <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-20 hidden group-hover/menu:block">
                                    <button onClick={(e) => { e.stopPropagation(); item.type === 'folder' ? handleNavigate(item) : setPreviewItem(item); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2">
                                        <Eye size={12} /> Open
                                    </button>
                                    {canEdit(item) && (
                                        <button onClick={(e) => { e.stopPropagation(); setRenameItemId(item.id); setRenameValue(item.name); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2">
                                            <Edit2 size={12} /> Rename
                                        </button>
                                    )}
                                    {canManage(item) && (
                                        <button onClick={(e) => { e.stopPropagation(); setPermissionModalItem(item); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2">
                                            <Shield size={12} /> Permissions
                                        </button>
                                    )}
                                    {canEdit(item) && (
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(item); }} className="w-full text-left px-3 py-2 text-xs hover:bg-red-50 text-red-600 flex items-center gap-2">
                                            <Trash2 size={12} /> Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* 1. New Folder Modal */}
      {isNewFolderModalOpen && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-80 animate-in zoom-in-95">
                  <h3 className="text-lg font-bold mb-4">New Folder</h3>
                  <form onSubmit={(e) => { 
                      e.preventDefault(); 
                      const target = e.target as typeof e.target & { folderName: { value: string } };
                      handleCreateFolder(target.folderName.value);
                   }}>
                      <input name="folderName" autoFocus className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:ring-2 focus:ring-nexus-500/20 outline-none" placeholder="Folder Name" />
                      <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setIsNewFolderModalOpen(false)} className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-md">Cancel</button>
                          <button type="submit" className="px-3 py-1.5 text-sm bg-nexus-600 text-white rounded-md hover:bg-nexus-700">Create</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* 2. Upload Modal */}
      {isUploadModalOpen && (
           <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
             <div className="bg-white rounded-xl shadow-2xl p-6 w-96 animate-in zoom-in-95">
                 <h3 className="text-lg font-bold mb-2">Upload Files</h3>
                 <p className="text-sm text-gray-500 mb-4">Select files to upload to <span className="font-semibold">{currentFolder?.name || 'Home'}</span></p>
                 
                 <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-gray-400 mb-4 hover:bg-gray-50 hover:border-nexus-400 transition-colors cursor-pointer relative">
                    <input 
                        type="file" 
                        multiple 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={(e) => e.target.files && handleUpload(e.target.files)}
                    />
                    <Upload size={32} className="mb-2" />
                    <span className="text-sm">Click to browse or drag files</span>
                 </div>
                 
                 <div className="flex justify-end">
                     <button onClick={() => setIsUploadModalOpen(false)} className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-md">Cancel</button>
                 </div>
             </div>
           </div>
      )}

      {/* 3. Permission Modal */}
      {permissionModalItem && (
        <PermissionModal 
            item={permissionModalItem} 
            onClose={() => setPermissionModalItem(null)} 
            onSave={(perms) => {
                api.updateFilePermissions(permissionModalItem.id, perms);
                setPermissionModalItem(null);
                refreshFiles();
            }} 
        />
      )}

      {/* 4. Preview Modal */}
      {previewItem && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
                  <div className="h-14 border-b border-gray-100 flex items-center justify-between px-4 shrink-0">
                      <div className="flex items-center gap-3">
                        {getFileIcon(previewItem.type)}
                        <div>
                            <h3 className="font-bold text-gray-900">{previewItem.name}</h3>
                            <p className="text-xs text-gray-500">{formatSize(previewItem.size)} • {new Date(previewItem.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Download">
                            <Download size={20} />
                        </button>
                        <button onClick={() => setPreviewItem(null)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                            <X size={20} />
                        </button>
                      </div>
                  </div>
                  <div className="flex-1 bg-gray-100 flex items-center justify-center overflow-auto p-4">
                      {previewItem.type === 'image' && previewItem.url ? (
                          <img src={previewItem.url} alt={previewItem.name} className="max-w-full max-h-full object-contain shadow-lg" />
                      ) : previewItem.type === 'pdf' ? (
                          <div className="text-gray-500 flex flex-col items-center">
                              <FileText size={64} className="mb-2" />
                              <p>PDF Preview Placeholder</p>
                          </div>
                      ) : (
                          <div className="text-gray-500 flex flex-col items-center">
                              <Box size={64} className="mb-2" />
                              <p>Preview not available for this file type</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

// --- Permission Modal Component ---
const PermissionModal: React.FC<{
    item: FileSystemItem, 
    onClose: () => void, 
    onSave: (p: FolderPermissions) => void 
}> = ({ item, onClose, onSave }) => {
    const [perms, setPerms] = useState<FolderPermissions>(item.permissions);

    const toggle = (action: keyof FolderPermissions, role: UserRole) => {
        setPerms(prev => {
            const currentRoles = prev[action];
            const hasRole = currentRoles.includes(role);
            return {
                ...prev,
                [action]: hasRole ? currentRoles.filter(r => r !== role) : [...currentRoles, role]
            };
        });
    };

    const isChecked = (action: keyof FolderPermissions, role: UserRole) => perms[action].includes(role);

    return (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-[500px] animate-in zoom-in-95">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Shield className="text-nexus-600" /> Permissions
                        </h3>
                        <p className="text-sm text-gray-500">Manage access for "{item.name}"</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
                </div>

                <div className="border rounded-lg overflow-hidden mb-6">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium">
                            <tr>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3 text-center">View</th>
                                <th className="px-4 py-3 text-center">Upload</th>
                                <th className="px-4 py-3 text-center">Edit</th>
                                <th className="px-4 py-3 text-center">Manage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {['owner', 'admin', 'member'].map((role) => (
                                <tr key={role} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium capitalize flex items-center gap-2">
                                        {role === 'owner' && <Lock size={12} className="text-gray-400" />} {role}
                                    </td>
                                    {(['view', 'upload', 'edit', 'manage'] as const).map(action => (
                                        <td key={action} className="px-4 py-3 text-center">
                                            <input 
                                                type="checkbox"
                                                disabled={role === 'owner'} // Owners always have full access usually
                                                checked={role === 'owner' ? true : isChecked(action, role as UserRole)}
                                                onChange={() => toggle(action, role as UserRole)}
                                                className="rounded text-nexus-600 focus:ring-nexus-500"
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">Cancel</button>
                    <button onClick={() => onSave(perms)} className="px-4 py-2 text-sm bg-nexus-600 text-white rounded-lg hover:bg-nexus-700 shadow-sm">Save Changes</button>
                </div>
            </div>
        </div>
    );
};
