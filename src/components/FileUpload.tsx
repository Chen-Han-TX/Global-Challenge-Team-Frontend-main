import React, { useCallback } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isLoading?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  isLoading = false,
}) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        onFileUpload(files[0]);
      }
    },
    [onFileUpload]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileUpload(files[0]);
    }
  };

  return (
    <div className="card mb-6">
      <div className="flex items-center gap-3 mb-4">
        <FileSpreadsheet className="w-6 h-6 text-primary-600" />
        <h2 className="text-xl font-semibold">Upload Transaction Data</h2>
      </div>

      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">Drag & drop your Excel file here</p>
        <p className="text-gray-500 text-sm mb-4">
          Supports .xlsx, .xls, and .csv formats
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <label className="btn-primary cursor-pointer">
            <input
              type="file"
              className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              disabled={isLoading}
            />
            {isLoading ? "Uploading..." : "Browse Files"}
          </label>
          <button
            className="btn-secondary"
            onClick={() => {
              /* Load sample data */
            }}
          >
            Use Sample Data
          </button>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        <p>
          Upload your bank transaction data to see the enrichment in action.
        </p>
        <p>The data should match the format described in the project plan.</p>
      </div>
    </div>
  );
};

export default FileUpload;
