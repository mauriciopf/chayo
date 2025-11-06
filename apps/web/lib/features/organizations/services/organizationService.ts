import type { Organization, TeamMember } from './organization/types'
import { getOrganizationById, updateOrganizationName } from './organization/OrganizationManager'
import { getUserOrganizations } from './organization/UserOrganizationManager'

export class OrganizationService {
  async getOrganizationById(id: string): Promise<Organization | null> {
    return getOrganizationById(id)
  }

  async updateOrganizationName(id: string, name: string): Promise<boolean> {
    return updateOrganizationName(id, name)
  }

  async getUserOrganizations(userId: string): Promise<Organization[]> {
    return getUserOrganizations(userId)
  }
}

export const organizationService = new OrganizationService()
