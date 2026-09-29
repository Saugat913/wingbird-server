import { schema } from "../../db/db";
import { BadRequestError, InternalServerError, NotFoundError } from "../../error";
import { AppsRepository } from "./apps.repository";

export class AppService {
  constructor(private appRepo: AppsRepository,
    private maxAppsPerUser: number
  ) { }

  async create(data: {
    name: string;
    userId: string;
  }): Promise<schema.App> {
    const currentCount = await this.appRepo.countByUserId(data.userId);
    if (currentCount >= this.maxAppsPerUser) {
      throw new BadRequestError(`Beta limit reached: Maximum of ${this.maxAppsPerUser} apps per user allowed.`);
    }
    const app = await this.appRepo.create(data);
    if (!app) {
      throw new InternalServerError("Failed to create the app");
    }
    return app;
  }

  async getAll(userId: string): Promise<schema.App[]> {
    return this.appRepo.getAll(userId);
  }

  async delete(id: string, userId: string) {
    const deleted = await this.appRepo.delete(id, userId);
    if (!deleted) {
      throw new NotFoundError("App");
    }
  }
}
