import { defineStore } from 'pinia'
import { ref } from 'vue'
import { storage } from '@/utils/storage'
import { generateProjects } from '@/utils/mock'
import type { Project } from '@/types'

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>(storage.get<Project[]>('projects') || generateProjects())

  function saveProjects(): void {
    storage.set('projects', projects.value)
  }

  function getProjectById(id: string): Project | undefined {
    return projects.value.find(proj => proj.id === id)
  }

  function getAllProjects(): Project[] {
    return projects.value
  }

  function initProjects(): void {
    const saved = storage.get<Project[]>('projects')
    if (!saved || saved.length === 0) {
      projects.value = generateProjects()
      saveProjects()
    } else {
      projects.value = saved
    }
  }

  return {
    projects,
    getProjectById,
    getAllProjects,
    initProjects
  }
})
