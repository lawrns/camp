
interface UploadProgressProps {
  progress: number; // 0-100
  fileName?: string;
}

export function UploadProgress({ progress, fileName }: UploadProgressProps) {
  return (
    <div className="phoenix-upload-container">
      {fileName && <div className="phoenix-upload-filename">Uploading {fileName}...</div>}
      <div className="phoenix-upload-progress">
        <div className={`phoenix-upload-progress-bar w-[${progress}%]`} />
      </div>
      <div className="phoenix-upload-percent">{progress}%</div>
    </div>
  );
}
