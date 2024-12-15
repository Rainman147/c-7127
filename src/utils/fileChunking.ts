export const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

export const createChunks = (file: File, chunkSize: number = CHUNK_SIZE) => {
  const chunks: Blob[] = [];
  let start = 0;

  while (start < file.size) {
    const end = Math.min(start + chunkSize, file.size);
    chunks.push(file.slice(start, end));
    start = end;
  }

  return {
    chunks,
    totalChunks: chunks.length,
    totalSize: file.size
  };
};

export const calculateProgress = (uploadedChunks: number, totalChunks: number) => {
  return Math.round((uploadedChunks / totalChunks) * 100);
};