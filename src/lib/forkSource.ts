const repository = "https://github.com/eli-w-king/skola";
const revision = import.meta.env.VITE_SOURCE_REVISION;

export const forkSource = revision
  ? `${repository}/tree/${encodeURIComponent(revision)}`
  : repository;
