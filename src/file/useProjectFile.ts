import { useCallback, useEffect, useRef, useState } from "react";
import type { Project } from "../model/types";
import {
  loadProjectFromPath,
  pickOpenLocation,
  pickSaveLocation,
  saveProjectToPath,
  deleteRecoveryFile,
} from "./io";
import { createAutosave } from "./autosave";
import { addRecentFile, getRecentFiles } from "./recentFiles";
import { compareProjectVersion, ProjectParseError } from "./project";

export interface UseProjectFileOptions {
  project: Project;
  loadProject: (project: Project, readOnly?: boolean) => void;
  /** Blank-project factory for File > New (section 8's flow: pick a location, then autosave starts). */
  createBlankProject: () => Project;
  /** Synchronous discard confirmation, shown only when there are unsaved changes. */
  confirmDiscard: (title: string) => boolean;
  /** Section 17: the current project is a newer file version — save is refused while this holds. */
  readOnly: boolean;
}

export interface UseProjectFile {
  projectPath: string | null;
  fileName: string;
  dirty: boolean;
  recentFiles: string[];
  error: string | null;
  versionWarning: string | null;
  dismissError: () => void;
  newProject: () => void;
  /** Welcome screen (section 16): loads the bundled example project instead of a blank one. */
  openExample: (example: Project) => void;
  /** Resolves to whether a project was opened (a path was picked) — welcome screen needs this to know whether to leave the welcome screen. */
  openProject: () => Promise<boolean>;
  openRecent: (path: string) => Promise<void>;
  saveProject: () => Promise<void>;
  saveProjectAs: () => Promise<void>;
}

function fileNameFromPath(path: string | null): string | null {
  if (!path) return null;
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1];
}

/**
 * Wires the file persistence layer (io.ts / autosave.ts / recentFiles.ts, all written in step
 * 4 but never connected to the UI until now) to real File menu actions: New / Open / Recent /
 * Save / Save as, a dirty flag for the title, and autosave-to-recovery-file once a location
 * exists (section 8's flow, section 17's crash recovery).
 */
export function useProjectFile({
  project,
  loadProject,
  createBlankProject,
  confirmDiscard,
  readOnly,
}: UseProjectFileOptions): UseProjectFile {
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(project));
  const [recentFiles, setRecentFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [versionWarning, setVersionWarning] = useState<string | null>(null);

  const projectRef = useRef(project);
  projectRef.current = project;
  const projectPathRef = useRef<string | null>(null);
  projectPathRef.current = projectPath;
  const savedSnapshotRef = useRef(savedSnapshot);
  savedSnapshotRef.current = savedSnapshot;
  const readOnlyRef = useRef(readOnly);
  readOnlyRef.current = readOnly;

  const dirty = JSON.stringify(project) !== savedSnapshot;

  const refreshRecentFiles = useCallback(() => {
    getRecentFiles().then(setRecentFiles).catch(() => setRecentFiles([]));
  }, []);

  useEffect(() => {
    refreshRecentFiles();
  }, [refreshRecentFiles]);

  const autosaveRef = useRef(
    createAutosave({
      getProject: () => projectRef.current,
      isDirty: () => JSON.stringify(projectRef.current) !== savedSnapshotRef.current,
      getProjectPath: () => projectPathRef.current,
      onError: (autosaveError) => setError(String(autosaveError)),
    }),
  );

  useEffect(() => {
    const autosave = autosaveRef.current;
    autosave.start();
    return () => autosave.stop();
  }, []);

  const openPath = useCallback(
    async (path: string) => {
      try {
        const loaded = await loadProjectFromPath(path);
        const compatibility = compareProjectVersion(loaded.version);
        setVersionWarning(compatibility === "newer" ? loaded.version : null);
        loadProject(loaded, compatibility === "newer");
        setProjectPath(path);
        setSavedSnapshot(JSON.stringify(loaded));
        setError(null);
        await addRecentFile(path);
        refreshRecentFiles();
      } catch (cause) {
        const message = cause instanceof ProjectParseError ? cause.message : String(cause);
        setError(message);
      }
    },
    [loadProject, refreshRecentFiles],
  );

  const newProject = useCallback(() => {
    if (dirty && !confirmDiscard(projectRef.current.title)) return;
    const blank = createBlankProject();
    loadProject(blank);
    setProjectPath(null);
    setSavedSnapshot(JSON.stringify(blank));
    setVersionWarning(null);
    setError(null);
  }, [confirmDiscard, createBlankProject, dirty, loadProject]);

  const openExample = useCallback(
    (example: Project) => {
      if (dirty && !confirmDiscard(projectRef.current.title)) return;
      loadProject(example);
      setProjectPath(null);
      setSavedSnapshot(JSON.stringify(example));
      setVersionWarning(null);
      setError(null);
    },
    [confirmDiscard, dirty, loadProject],
  );

  const openProject = useCallback(async () => {
    if (dirty && !confirmDiscard(projectRef.current.title)) return false;
    const path = await pickOpenLocation();
    if (!path) return false;
    await openPath(path);
    return true;
  }, [confirmDiscard, dirty, openPath]);

  const openRecent = useCallback(
    async (path: string) => {
      if (dirty && !confirmDiscard(projectRef.current.title)) return;
      await openPath(path);
    },
    [confirmDiscard, dirty, openPath],
  );

  const saveAs = useCallback(async () => {
    if (readOnlyRef.current) {
      setError("READ_ONLY_SAVE");
      return;
    }
    const defaultName = `${projectRef.current.title || "untitled"}.t2s`;
    const path = await pickSaveLocation(defaultName);
    if (!path) return;
    try {
      await saveProjectToPath(projectRef.current, path);
      setProjectPath(path);
      setSavedSnapshot(JSON.stringify(projectRef.current));
      setError(null);
      await addRecentFile(path);
      refreshRecentFiles();
    } catch (cause) {
      setError(String(cause));
    }
  }, [refreshRecentFiles]);

  const saveProject = useCallback(async () => {
    if (readOnlyRef.current) {
      setError("READ_ONLY_SAVE");
      return;
    }
    if (!projectPathRef.current) {
      await saveAs();
      return;
    }
    try {
      await saveProjectToPath(projectRef.current, projectPathRef.current);
      await deleteRecoveryFile(projectPathRef.current);
      setSavedSnapshot(JSON.stringify(projectRef.current));
      setError(null);
    } catch (cause) {
      setError(String(cause));
    }
  }, [saveAs]);

  return {
    projectPath,
    fileName: fileNameFromPath(projectPath) ?? "",
    dirty,
    recentFiles,
    error,
    versionWarning,
    dismissError: () => setError(null),
    newProject,
    openExample,
    openProject,
    openRecent,
    saveProject,
    saveProjectAs: saveAs,
  };
}
