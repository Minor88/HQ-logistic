
import React, { useState } from "react";
import { Folder, File, Upload, Download, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface FileItem {
  id: string;
  name: string;
  type: "file" | "folder";
  parentId: string | null;
  size?: number;
  lastModified?: Date;
}

interface FileExplorerProps {
  entityId: string;
  entityType: "shipment" | "request";
  canUpload?: boolean;
  canDownload?: boolean;
  canDelete?: boolean;
  canCreateFolder?: boolean;
  readOnly?: boolean;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  entityId,
  entityType,
  canUpload = true,
  canDownload = true,
  canDelete = true,
  canCreateFolder = true,
  readOnly = false,
}) => {
  const [files, setFiles] = useState<FileItem[]>([
    // Sample files for demonstration
    { id: "folder1", name: "Documents", type: "folder", parentId: null },
    { id: "folder2", name: "Images", type: "folder", parentId: null },
    { id: "file1", name: "invoice.pdf", type: "file", parentId: null, size: 1024 * 1024 },
    { id: "file2", name: "contract.docx", type: "file", parentId: null, size: 512 * 1024 },
    { id: "file3", name: "specifications.xlsx", type: "file", parentId: "folder1", size: 2048 * 1024 },
    { id: "file4", name: "photo.jpg", type: "file", parentId: "folder2", size: 3072 * 1024 },
  ]);
  
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [showNewFolderInput, setShowNewFolderInput] = useState<boolean>(false);

  // Get files and folders in the current directory
  const currentItems = files.filter(file => file.parentId === currentFolder);
  const folders = currentItems.filter(item => item.type === "folder");
  const fileItems = currentItems.filter(item => item.type === "file");

  // Handle file selection
  const toggleFileSelection = (id: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedFiles(newSelection);
  };

  // Handle folder navigation
  const navigateToFolder = (folderId: string | null) => {
    setCurrentFolder(folderId);
    setSelectedFiles(new Set());
  };

  // Get breadcrumb navigation
  const getBreadcrumb = () => {
    const breadcrumb: { id: string | null; name: string }[] = [
      { id: null, name: "Root" },
    ];

    let current = currentFolder;
    while (current !== null) {
      const folder = files.find(f => f.id === current);
      if (folder) {
        breadcrumb.unshift({ id: folder.id, name: folder.name });
        current = folder.parentId;
      } else {
        break;
      }
    }

    return breadcrumb;
  };

  // Create a new folder
  const createFolder = () => {
    if (!newFolderName.trim()) {
      toast.error("Folder name cannot be empty");
      return;
    }

    const newFolder: FileItem = {
      id: `folder${Date.now()}`,
      name: newFolderName,
      type: "folder",
      parentId: currentFolder,
    };

    setFiles([...files, newFolder]);
    setNewFolderName("");
    setShowNewFolderInput(false);
    toast.success("Folder created successfully");
  };

  // Delete selected files
  const deleteSelected = () => {
    // In a real app, you would make API calls here
    const newFiles = files.filter(file => !selectedFiles.has(file.id));
    setFiles(newFiles);
    setSelectedFiles(new Set());
    toast.success("Files deleted successfully");
  };

  // Format bytes to readable size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  // Upload file handler (simulated)
  const uploadFile = () => {
    // In a real app, you would handle file upload here
    toast.success("File upload completed");
  };

  // Download selected files (simulated)
  const downloadSelected = () => {
    // In a real app, you would handle file download here
    toast.success("Files downloaded successfully");
  };

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      {/* Navigation and actions */}
      <div className="border-b px-4 py-3 flex items-center justify-between bg-gray-50">
        <div className="flex items-center space-x-2 overflow-x-auto whitespace-nowrap">
          {getBreadcrumb().map((item, index) => (
            <React.Fragment key={item.id || "root"}>
              {index > 0 && <span className="text-gray-400">/</span>}
              <button
                className={`px-2 py-1 rounded hover:bg-gray-100 ${
                  item.id === currentFolder ? "font-semibold" : ""
                }`}
                onClick={() => navigateToFolder(item.id)}
              >
                {item.name}
              </button>
            </React.Fragment>
          ))}
        </div>
        
        <div className="flex items-center space-x-2">
          {canUpload && !readOnly && (
            <Button variant="outline" size="sm" onClick={uploadFile} className="gap-1">
              <Upload className="h-4 w-4" />
              <span>Upload</span>
            </Button>
          )}
          
          {canDownload && selectedFiles.size > 0 && (
            <Button variant="outline" size="sm" onClick={downloadSelected} className="gap-1">
              <Download className="h-4 w-4" />
              <span>Download</span>
            </Button>
          )}
          
          {canDelete && selectedFiles.size > 0 && !readOnly && (
            <Button variant="outline" size="sm" onClick={deleteSelected} className="gap-1 text-red-500 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </Button>
          )}
          
          {canCreateFolder && !readOnly && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewFolderInput(true)}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              <span>New Folder</span>
            </Button>
          )}
        </div>
      </div>

      {/* New folder input */}
      {showNewFolderInput && (
        <div className="p-3 border-b bg-gray-50 flex items-center gap-2">
          <Input
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="w-60"
          />
          <Button size="sm" onClick={createFolder}>Create</Button>
          <Button size="sm" variant="outline" onClick={() => setShowNewFolderInput(false)}>
            Cancel
          </Button>
        </div>
      )}

      {/* File and folder list */}
      <div className="p-4">
        {folders.length === 0 && fileItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            This folder is empty
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {/* Folders */}
            {folders.map((folder) => (
              <div
                key={folder.id}
                className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                  selectedFiles.has(folder.id) ? "border-apple-purple bg-purple-50" : ""
                }`}
                onClick={() => {
                  if (!readOnly) {
                    toggleFileSelection(folder.id);
                  }
                }}
                onDoubleClick={() => navigateToFolder(folder.id)}
              >
                <Folder className="h-10 w-10 text-yellow-500" />
                <div className="truncate">
                  <div className="font-medium truncate">{folder.name}</div>
                  <div className="text-xs text-gray-500">Folder</div>
                </div>
              </div>
            ))}

            {/* Files */}
            {fileItems.map((file) => (
              <div
                key={file.id}
                className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                  selectedFiles.has(file.id) ? "border-apple-purple bg-purple-50" : ""
                }`}
                onClick={() => {
                  if (!readOnly) {
                    toggleFileSelection(file.id);
                  }
                }}
              >
                <File className="h-10 w-10 text-blue-500" />
                <div className="truncate">
                  <div className="font-medium truncate">{file.name}</div>
                  <div className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
