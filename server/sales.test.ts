import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

// ─── Mock do módulo de banco de dados ────────────────────────────────────────

vi.mock("./db", () => ({
  createSaleRecord: vi.fn().mockResolvedValue(42),
  getSaleRecordById: vi.fn(),
  getSaleRecordsBySeller: vi.fn().mockResolvedValue([]),
  getSaleRecordsByStatus: vi.fn().mockResolvedValue([]),
  getDocumentsBySaleRecord: vi.fn().mockResolvedValue([]),
  updateSaleRecordStatus: vi.fn().mockResolvedValue(undefined),
  getUserById: vi.fn(),
  updateUserRole: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn(),
  getDb: vi.fn().mockResolvedValue(null),
}));

import * as db from "./db";

// ─── Helpers de contexto ──────────────────────────────────────────────────────

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    openId: "test-open-id",
    name: "Test User",
    email: "test@example.com",
    loginMethod: "google",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
}

function makeCtx(user: User | null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe("sales.create", () => {
  it("permite que vendedor crie um registro", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser({ role: "vendedor" })));
    const result = await caller.sales.create({ licensePlate: "ABC1234" });
    expect(result).toEqual({ id: 42 });
    expect(db.createSaleRecord).toHaveBeenCalledWith(
      expect.objectContaining({ licensePlate: "ABC1234", status: "aguardando_financeiro" })
    );
  });

  it("bloqueia usuário sem papel de vendedor", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser({ role: "financeiro" })));
    await expect(caller.sales.create({ licensePlate: "XYZ9999" })).rejects.toThrow();
  });

  it("bloqueia usuário não autenticado", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(caller.sales.create({ licensePlate: "XYZ9999" })).rejects.toThrow();
  });

  it("normaliza a placa para maiúsculas", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser({ role: "vendedor" })));
    await caller.sales.create({ licensePlate: "abc-1234" });
    expect(db.createSaleRecord).toHaveBeenCalledWith(
      expect.objectContaining({ licensePlate: "ABC-1234" })
    );
  });
});

describe("sales.approveFinanceiro", () => {
  beforeEach(() => {
    vi.mocked(db.getSaleRecordById).mockResolvedValue({
      id: 1,
      licensePlate: "ABC1234",
      status: "aguardando_financeiro",
      sellerId: 99,
      sellerName: "Vendedor Teste",
      rejectionReason: null,
      rejectedBy: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as any);
  });

  it("financeiro pode aprovar registro aguardando_financeiro", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser({ role: "financeiro" })));
    const result = await caller.sales.approveFinanceiro({ id: 1 });
    expect(result).toEqual({ success: true });
    expect(db.updateSaleRecordStatus).toHaveBeenCalledWith(1, "aguardando_administrativo");
  });

  it("vendedor não pode aprovar como financeiro", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser({ role: "vendedor" })));
    await expect(caller.sales.approveFinanceiro({ id: 1 })).rejects.toThrow();
  });

  it("retorna erro se registro não existe", async () => {
    vi.mocked(db.getSaleRecordById).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(makeCtx(makeUser({ role: "financeiro" })));
    await expect(caller.sales.approveFinanceiro({ id: 999 })).rejects.toThrow("Registro não encontrado");
  });

  it("retorna erro se registro não está no status correto", async () => {
    vi.mocked(db.getSaleRecordById).mockResolvedValueOnce({
      id: 1, status: "aguardando_administrativo",
    } as any);
    const caller = appRouter.createCaller(makeCtx(makeUser({ role: "financeiro" })));
    await expect(caller.sales.approveFinanceiro({ id: 1 })).rejects.toThrow();
  });
});

describe("sales.rejectFinanceiro", () => {
  beforeEach(() => {
    vi.mocked(db.getSaleRecordById).mockResolvedValue({
      id: 1,
      status: "aguardando_financeiro",
    } as any);
  });

  it("financeiro pode reprovar com motivo", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser({ role: "financeiro" })));
    const result = await caller.sales.rejectFinanceiro({ id: 1, reason: "Documentação incompleta" });
    expect(result).toEqual({ success: true });
    expect(db.updateSaleRecordStatus).toHaveBeenCalledWith(1, "reprovado", {
      rejectionReason: "Documentação incompleta",
      rejectedBy: "financeiro",
    });
  });

  it("rejeita motivo vazio", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser({ role: "financeiro" })));
    await expect(caller.sales.rejectFinanceiro({ id: 1, reason: "" })).rejects.toThrow();
  });
});

describe("sales.approveAdministrativo", () => {
  beforeEach(() => {
    vi.mocked(db.getSaleRecordById).mockResolvedValue({
      id: 1,
      status: "aguardando_administrativo",
    } as any);
  });

  it("administrativo pode liberar entrega", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser({ role: "administrativo" })));
    const result = await caller.sales.approveAdministrativo({ id: 1 });
    expect(result).toEqual({ success: true });
    expect(db.updateSaleRecordStatus).toHaveBeenCalledWith(1, "liberado_para_entrega");
  });

  it("financeiro não pode aprovar como administrativo", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser({ role: "financeiro" })));
    await expect(caller.sales.approveAdministrativo({ id: 1 })).rejects.toThrow();
  });
});

describe("sales.rejectAdministrativo", () => {
  beforeEach(() => {
    vi.mocked(db.getSaleRecordById).mockResolvedValue({
      id: 1,
      status: "aguardando_administrativo",
    } as any);
  });

  it("administrativo pode reprovar com motivo", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser({ role: "administrativo" })));
    const result = await caller.sales.rejectAdministrativo({ id: 1, reason: "Documentação inválida" });
    expect(result).toEqual({ success: true });
    expect(db.updateSaleRecordStatus).toHaveBeenCalledWith(1, "reprovado", {
      rejectionReason: "Documentação inválida",
      rejectedBy: "administrativo",
    });
  });

  it("rejeita motivo vazio", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser({ role: "administrativo" })));
    await expect(caller.sales.rejectAdministrativo({ id: 1, reason: "" })).rejects.toThrow();
  });
});

describe("sales.listMine", () => {
  it("vendedor pode listar seus registros", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser({ role: "vendedor", id: 5 })));
    const result = await caller.sales.listMine();
    expect(Array.isArray(result)).toBe(true);
    expect(db.getSaleRecordsBySeller).toHaveBeenCalledWith(5);
  });

  it("financeiro não pode listar registros do vendedor", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser({ role: "financeiro" })));
    await expect(caller.sales.listMine()).rejects.toThrow();
  });
});

describe("sales.getById", () => {
  it("vendedor só pode ver seus próprios registros", async () => {
    vi.mocked(db.getSaleRecordById).mockResolvedValueOnce({
      id: 1,
      sellerId: 99, // outro vendedor
      status: "aguardando_financeiro",
    } as any);
    const caller = appRouter.createCaller(makeCtx(makeUser({ role: "vendedor", id: 1 })));
    await expect(caller.sales.getById({ id: 1 })).rejects.toThrow();
  });

  it("financeiro pode ver qualquer registro", async () => {
    vi.mocked(db.getSaleRecordById).mockResolvedValueOnce({
      id: 1,
      sellerId: 99,
      status: "aguardando_financeiro",
    } as any);
    const caller = appRouter.createCaller(makeCtx(makeUser({ role: "financeiro" })));
    const result = await caller.sales.getById({ id: 1 });
    expect(result).toBeDefined();
  });
});
