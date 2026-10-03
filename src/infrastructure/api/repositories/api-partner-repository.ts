import type { Partner } from "@/domain/entities";
import type { PartnerRepository } from "@/domain/repositories";
import { apiGet } from "../http-client";
import type { PartnerDto } from "../dto";
import { mapPartner } from "../mappers";

export class ApiPartnerRepository implements PartnerRepository {
  async getAll(): Promise<Partner[]> {
    const data = await apiGet<PartnerDto[]>("/public/partners");
    return data.map(mapPartner);
  }
}
