import { PrismaClient, Prisma } from '@prisma';

export abstract class PrismaRepository<TModelName extends Prisma.ModelName = any> {
  protected static prisma: PrismaClient;

  public static setPrismaClient(prisma: PrismaClient): void {
    PrismaRepository.prisma = prisma;
  }

  protected get prisma(): PrismaClient {
    if (!PrismaRepository.prisma) {
      throw new Error('Prisma client not initialized. Call PrismaRepository.setPrismaClient() first.');
    }
    return PrismaRepository.prisma;
  }

  protected get model(): any {
    if (!this.modelName) {
      throw new Error('Model name not defined');
    }
    return this.prisma[this.modelName as keyof PrismaClient] as any;
  }

  protected abstract modelName?: TModelName;

  protected async transaction<T>(fn: (prisma: Omit<PrismaClient, '$on' | '$connect' | '$disconnect' | '$transaction' | '$extends'>) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  protected handleError(error: unknown): never {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown database error');
  }

  protected async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
