import { beforeEach, describe, expect, it, mock } from "bun:test";

mock.module("@/stores/http", () => ({
  fetchApi: mock(),
}));

const { useAdminDashboardStore } = await import("@/stores/admin-dashboard.store");
const { fetchApi } = await import("@/stores/http");

describe("AdminDashboardStore", () => {
  beforeEach(() => {
    useAdminDashboardStore.setState({
      overview: null,
      isLoading: false,
      error: null,
    });
    (fetchApi as any).mockReset();
  });

  it("fetchOverview stores payload on success", async () => {
    (fetchApi as any).mockResolvedValue({
      totalOrders: 5,
      totalRevenue: 25000,
      pendingOrders: 2,
      lowStockVariants: 1,
      activeDiscounts: 1,
      recentOrders: [],
      statusBreakdown: [],
    });

    await useAdminDashboardStore.getState().fetchOverview();

    const state = useAdminDashboardStore.getState();
    expect(state.overview?.totalOrders).toBe(5);
    expect(state.error).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it("fetchOverview sets static error message on failure", async () => {
    (fetchApi as any).mockRejectedValue(new Error("Network down"));

    await useAdminDashboardStore.getState().fetchOverview();

    const state = useAdminDashboardStore.getState();
    expect(state.overview).toBeNull();
    expect(state.error).toBe("Unable to load admin dashboard overview.");
    expect(state.isLoading).toBe(false);
  });
});
