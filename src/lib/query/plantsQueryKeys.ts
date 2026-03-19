export const PLANTS_QK = {
  all: () => ["plants"] as const,

  list: () => ["plants", "list"] as const,
  detail: (plantId: string) => ["plants", "detail", plantId] as const,

  taskRules: (plantId?: string) =>
    plantId
      ? (["plants", "taskRules", plantId] as const)
      : (["plants", "taskRules"] as const),

  dueTasks: () => ["plants", "dueTasks"] as const,
  photos: (plantId: string) => ["plants", "photos", plantId] as const,

  status: (plantId: string) => ["plants", "status", plantId] as const,
  statusAll: () => ["plants", "status", "all"] as const,
  statusStats: () => ["plants", "status", "stats"] as const,
} as const;
