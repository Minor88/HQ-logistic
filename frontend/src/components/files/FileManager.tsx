import React, { useState, useEffect, useRef } from 'react';
import { Folder, File, Upload, Download, Trash2, Plus, FolderOpen, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import fileService, { ShipmentFile, ShipmentFolder, FilesResponse } from '@/services/fileService';

interface FileManagerProps {
  shipmentId: string | number;
  readOnly?: boolean;
  onClose?: () => void;
}

export default function FileManager({ shipmentId, readOnly = false, onClose }: FileManagerProps) {
  // Состояние для файлов и папок
  const [files, setFiles] = useState<ShipmentFile[]>([]);
  const [folders, setFolders] = useState<ShipmentFolder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<ShipmentFolder | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Загрузка файлов при первом рендере
  useEffect(() => {
    loadFiles();
  }, [shipmentId]);
  
  // Функция загрузки файлов
  const loadFiles = async () => {
    setLoading(true);
    try {
      const data = await fileService.getShipmentFiles(shipmentId);
      setFiles(data.files || []);
      setFolders(data.folders || []);
      setCurrentFolder(null);
    } catch (error) {
      console.error('Ошибка при загрузке файлов:', error);
      toast.error('Не удалось загрузить файлы');
    } finally {
      setLoading(false);
    }
  };
  
  // Функция загрузки файлов из конкретной папки
  const loadFolderFiles = async (folder: ShipmentFolder) => {
    setLoading(true);
    try {
      // Теперь файлы уже содержатся в папке, так что дополнительный запрос не нужен
      setCurrentFolder(folder);
      setLoading(false);
    } catch (error) {
      console.error('Ошибка при загрузке файлов из папки:', error);
      toast.error('Не удалось загрузить файлы из папки');
      setLoading(false);
    }
  }
  
  // Создание новой папки
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('Введите название папки');
      return;
    }
    
    try {
      const folder = await fileService.createFolder(shipmentId, newFolderName);
      setFolders([...folders, folder]);
      setNewFolderName('');
      setShowNewFolderInput(false);
      toast.success('Папка успешно создана');
    } catch (error) {
      console.error('Ошибка при создании папки:', error);
      toast.error('Не удалось создать папку');
    }
  };
  
  // Удаление папки
  const handleDeleteFolder = async (folderId: number) => {
    if (!window.confirm('Вы действительно хотите удалить эту папку и все её содержимое?')) {
      return;
    }
    
    try {
      await fileService.deleteFolder(shipmentId, folderId);
      setFolders(folders.filter(folder => folder.id !== folderId));
      // Удаляем также файлы из этой папки из локального состояния
      setFiles(files.filter(file => file.folder !== folderId));
      toast.success('Папка успешно удалена');
    } catch (error) {
      console.error('Ошибка при удалении папки:', error);
      toast.error('Не удалось удалить папку');
    }
  };
  
  // Удаление файла
  const handleDeleteFile = async (fileId: number) => {
    if (!window.confirm('Вы действительно хотите удалить этот файл?')) {
      return;
    }
    
    try {
      await fileService.deleteFile(shipmentId, fileId);
      
      // Если мы в папке, удаляем файл из текущей папки
      if (currentFolder) {
        // Обновляем текущую папку
        const updatedFolder = {
          ...currentFolder,
          files: currentFolder.files.filter(file => file.id !== fileId)
        };
        setCurrentFolder(updatedFolder);
        
        // Обновляем список папок с обновленной папкой
        setFolders(prevFolders => 
          prevFolders.map(folder => 
            folder.id === currentFolder.id ? updatedFolder : folder
          )
        );
      } else {
        // Иначе удаляем из корневых файлов
        setFiles(files.filter(file => file.id !== fileId));
      }
      
      toast.success('Файл успешно удален');
    } catch (error) {
      console.error('Ошибка при удалении файла:', error);
      toast.error('Не удалось удалить файл');
    }
  };
  
  // Загрузка файлов
  const handleUploadFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    try {
      const filesArray = Array.from(selectedFiles);
      const uploadedFiles = await fileService.uploadFiles(
        shipmentId, 
        filesArray, 
        currentFolder?.id
      );
      
      console.log('Загруженные файлы:', uploadedFiles);
      
      // Если мы в папке, добавляем файлы в текущую папку
      if (currentFolder) {
        // Обновляем текущую папку
        const updatedFolder = {
          ...currentFolder,
          files: [...currentFolder.files, ...uploadedFiles]
        };
        setCurrentFolder(updatedFolder);
        
        // Обновляем список папок с обновленной папкой
        setFolders(prevFolders => 
          prevFolders.map(folder => 
            folder.id === currentFolder.id ? updatedFolder : folder
          )
        );
      } else {
        // Иначе добавляем в корневые файлы
        setFiles(prevFiles => [...prevFiles, ...uploadedFiles]);
      }
      
      toast.success('Файлы успешно загружены');
      
      // Сбрасываем инпут
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Ошибка при загрузке файлов:', error);
      toast.error('Не удалось загрузить файлы');
    }
  };
  
  // Скачивание файла
  const handleDownloadFile = (fileId: number, fileName: string) => {
    fileService.downloadFile(shipmentId, fileId, fileName);
  };
  
  // Скачивание всех файлов
  const handleDownloadAllFiles = () => {
    fileService.downloadAllFiles(shipmentId);
  };
  
  // Открытие папки
  const handleOpenFolder = (folder: ShipmentFolder) => {
    // Теперь нам не нужно загружать файлы отдельно, они уже есть в папке
    setCurrentFolder(folder);
  };
  
  // Возврат к корневой директории
  const handleGoBack = () => {
    setCurrentFolder(null);
    // При возврате в корневую директорию обновляем список файлов и папок
    loadFiles();
  };
  
  // Получение файлов текущей директории
  const currentFiles = currentFolder 
    ? currentFolder.files // Используем файлы из папки напрямую
    : files.filter(file => file.folder === null);
  
  // Форматирование размера файла
  const formatFileSize = (size: number): string => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  // Получение иконки для типа файла
  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension || '')) {
      return <div className="h-10 w-10 bg-pink-100 text-pink-700 flex items-center justify-center rounded">IMG</div>;
    }
    
    if (['doc', 'docx', 'odt', 'rtf'].includes(extension || '')) {
      return <div className="h-10 w-10 bg-blue-100 text-blue-700 flex items-center justify-center rounded">DOC</div>;
    }
    
    if (['xls', 'xlsx', 'csv'].includes(extension || '')) {
      return <div className="h-10 w-10 bg-green-100 text-green-700 flex items-center justify-center rounded">XLS</div>;
    }
    
    if (['pdf'].includes(extension || '')) {
      return <div className="h-10 w-10 bg-red-100 text-red-700 flex items-center justify-center rounded">PDF</div>;
    }
    
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension || '')) {
      return <div className="h-10 w-10 bg-yellow-100 text-yellow-700 flex items-center justify-center rounded">ZIP</div>;
    }
    
    return <File className="h-10 w-10 text-gray-500" />;
  };
  
  // Получение даты в формате ДД.ММ.ГГ
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear().toString().slice(-2)}`;
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-medium">
            {currentFolder ? `Папка: ${currentFolder.name}` : 'Файлы отправления'}
          </h3>
          {currentFolder && (
            <Button variant="ghost" size="sm" onClick={handleGoBack}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Назад
            </Button>
          )}
        </div>
        
        {!readOnly && (
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowNewFolderInput(true)}
              disabled={showNewFolderInput}
            >
              <Plus className="h-4 w-4 mr-1" />
              Папка
            </Button>
            
            <label htmlFor="file-upload" className="cursor-pointer">
              <Button size="sm" variant="outline" asChild>
                <div>
                  <Upload className="h-4 w-4 mr-1" />
                  Загрузить
                </div>
              </Button>
              <input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleUploadFiles}
              />
            </label>
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadAllFiles}
              disabled={files.length === 0}
            >
              <Download className="h-4 w-4 mr-1" />
              Скачать все
            </Button>
          </div>
        )}
      </div>
      
      {showNewFolderInput && (
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Название папки"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="max-w-xs"
          />
          <Button size="sm" onClick={handleCreateFolder}>Создать</Button>
          <Button size="sm" variant="outline" onClick={() => setShowNewFolderInput(false)}>Отмена</Button>
        </div>
      )}
      
      {loading ? (
        <div className="py-8 text-center text-gray-500">Загрузка файлов...</div>
      ) : (
        <div>
          {!currentFolder && folders.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Папки</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="flex items-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer group"
                  >
                    <FolderOpen className="h-6 w-6 text-yellow-500 mr-2" />
                    <div className="flex-1" onClick={() => handleOpenFolder(folder)}>
                      <div className="font-medium">{folder.name}</div>
                      <div className="text-xs text-gray-500">
                        Создал: {folder.created_by_name}, {formatDate(folder.created_at)}
                      </div>
                    </div>
                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteFolder(folder.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Файлы</h4>
            {currentFiles.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                {currentFolder ? `В папке "${currentFolder.name}" нет файлов` : 'Нет файлов'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {currentFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 group"
                  >
                    {getFileIcon(file.file)}
                    <div className="flex-1 ml-2">
                      <div className="font-medium truncate">{file.file}</div>
                      <div className="text-xs text-gray-500 flex flex-wrap gap-1">
                        <span>Загрузил: {file.uploaded_by_name}</span>
                        <span>{formatDate(file.uploaded_at)}</span>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadFile(file.id, file.file)}
                      >
                        <Download className="h-4 w-4 text-gray-500" />
                      </Button>
                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteFile(file.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 