'use client';

// ============================================================
// Project Session Context Provider
// Persists active project in session/localStorage and syncs across
// intelligence pages, sidebar, project wizard, and chat.
// ============================================================
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import type { MonitoringProject, CreateProjectInput } from '@/types';

const STORAGE_KEY_ACTIVE_PROJECT = 'nexora_active_project_id';

interface ProjectContextValue {
  projects: MonitoringProject[];
  activeProjectId: string | null;
  activeProject: MonitoringProject | null;
  loading: boolean;
  setActiveProjectId: (id: string | null) => void;
  createAndActivateProject: (input: CreateProjectInput) => Promise<MonitoringProject>;
  deleteProjectAndSync: (projectId: string) => Promise<void>;
  refreshProjects: () => Promise<MonitoringProject[]>;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { getToken, user } = useAuth();
  const [projects, setProjects] = useState<MonitoringProject[]>([]);
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize active project from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_PROJECT);
      if (saved) {
        setActiveProjectIdState(saved);
      }
    }
  }, []);

  const setActiveProjectId = useCallback((id: string | null) => {
    setActiveProjectIdState(id);
    if (typeof window !== 'undefined') {
      if (id) {
        localStorage.setItem(STORAGE_KEY_ACTIVE_PROJECT, id);
      } else {
        localStorage.removeItem(STORAGE_KEY_ACTIVE_PROJECT);
      }
    }
  }, []);

  // Fetch all user projects from backend
  const refreshProjects = useCallback(async (): Promise<MonitoringProject[]> => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return [];
    }

    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return [];

      const res = await fetch('/api/intelligence/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.projects)) {
        const fetched: MonitoringProject[] = data.projects;
        setProjects(fetched);

        // Auto-select project if current activeProjectId is invalid or empty
        if (fetched.length > 0) {
          const currentValid = activeProjectId && fetched.some((p) => p.id === activeProjectId);
          if (!currentValid) {
            const defaultId = fetched[0].id;
            setActiveProjectIdState(defaultId);
            if (typeof window !== 'undefined') {
              localStorage.setItem(STORAGE_KEY_ACTIVE_PROJECT, defaultId);
            }
          }
        } else {
          setActiveProjectIdState(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY_ACTIVE_PROJECT);
          }
        }
        return fetched;
      }
      return [];
    } catch {
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, getToken, activeProjectId]);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  // Create project, save in DB, store in project session, and trigger initial run
  const createAndActivateProject = useCallback(
    async (input: CreateProjectInput): Promise<MonitoringProject> => {
      const token = await getToken();
      if (!token) throw new Error('Authentication required.');

      const response = await fetch('/api/intelligence/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
      });

      const data = await response.json();
      if (!data.success || !data.project) {
        throw new Error(data.error || 'Failed to create monitoring project.');
      }

      const newProj: MonitoringProject = data.project;

      // 1. Update project list and session
      setProjects((prev) => [newProj, ...prev.filter((p) => p.id !== newProj.id)]);
      setActiveProjectId(newProj.id);

      // 2. Trigger asynchronous ingestion run for the new project
      fetch(`/api/intelligence/projects/${newProj.id}/run`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});

      return newProj;
    },
    [getToken, setActiveProjectId]
  );

  // Delete project and update session
  const deleteProjectAndSync = useCallback(
    async (projectId: string) => {
      const token = await getToken();
      if (!token) return;

      await fetch(`/api/intelligence/projects/${projectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      setProjects((prev) => {
        const remaining = prev.filter((p) => p.id !== projectId);
        if (activeProjectId === projectId) {
          const nextId = remaining.length > 0 ? remaining[0].id : null;
          setActiveProjectId(nextId);
        }
        return remaining;
      });
    },
    [getToken, activeProjectId, setActiveProjectId]
  );

  const activeProject = projects.find((p) => p.id === activeProjectId) || null;

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProjectId,
        activeProject,
        loading,
        setActiveProjectId,
        createAndActivateProject,
        deleteProjectAndSync,
        refreshProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectSession() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjectSession must be used within a ProjectProvider');
  }
  return context;
}
