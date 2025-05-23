import { mount } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach, MockInstance } from "vitest";
import Shift from "../../../src/components/shift/Shift.vue";
import Table from "../../../src/components/utility/Table.vue";
import Timezone from "../../../src/components/timezone/Timezone.vue";
import Swal, { SweetAlertOptions, SweetAlertResult } from "sweetalert2";
import * as request from "../../../src/server/request";
import { AxiosResponse } from "axios";

vi.mock("sweetalert2", () => ({
  default: {
    fire: vi.fn(),
  },
}));

type SwalFireSignature = ((
  options: SweetAlertOptions
) => Promise<SweetAlertResult>) &
  ((title?: string, html?: string, icon?: string) => Promise<SweetAlertResult>);

const mockedSwalFire: MockInstance<SwalFireSignature> = Swal.fire as any;

vi.mock("../../../src/server/request", () => ({
  shift: vi.fn(),
}));

const mockedShift = request.shift as MockInstance;

describe("Shift.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedShift.mockReset();
    mockedSwalFire.mockReset();

    mockedSwalFire.mockImplementation(async (options) => {
      await Promise.resolve();
      return { isConfirmed: true, isDenied: false, isDismissed: false };
    });
  });

  const mockInitialGet = () => {
    mockedShift.mockResolvedValueOnce({
      status: 200,
      data: [],
      statusText: "OK",
      headers: {},
      config: {},
    } as AxiosResponse);
  };

  it("renders correctly and displays initial components and month/year", async () => {
    mockInitialGet();
    const wrapper = mount(Shift, {
      global: {
        stubs: {
          Timezone: true,
          Table: true,
        },
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.findComponent(Timezone).exists()).toBe(true);
    expect(wrapper.findComponent(Table).exists()).toBe(true);
    const currentMonthYear = new Date().toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    expect(wrapper.find("h1").text()).toBe(currentMonthYear);
  });

  it("calls getShift on mounted and updates shiftRecord", async () => {
    const mockShiftRecords = [
      { id: 1, start: "2025-01-01T09:00:00Z", end: "2025-01-01T17:00:00Z" },
      { id: 2, start: "2025-01-02T10:00:00Z", end: "2025-01-02T18:00:00Z" },
    ];

    mockedShift.mockResolvedValueOnce({
      status: 200,
      data: mockShiftRecords,
      statusText: "OK",
      headers: {},
      config: {},
    } as AxiosResponse);

    const wrapper = mount(Shift, {
      global: {
        stubs: {
          Timezone: true,
          Table: true,
        },
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockedShift).toHaveBeenCalledWith("GET");
    expect((wrapper.vm as any).shiftRecord).toEqual(mockShiftRecords);
  });

  it("handles error during initial getShift fetch", async () => {
    const errorMessage = "Failed to fetch shifts";
    mockedShift.mockRejectedValueOnce({
      response: {
        data: {
          message: errorMessage,
        },
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config: {},
      },
    });

    const wrapper = mount(Shift, {
      global: {
        stubs: {
          Timezone: true,
          Table: true,
        },
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockedShift).toHaveBeenCalledTimes(1);
    expect(mockedShift).toHaveBeenCalledWith("GET");

    expect(mockedSwalFire).toHaveBeenCalledWith({
      title: `Error: ${errorMessage}`,
      icon: "error",
      draggable: false,
    });
    expect((wrapper.vm as any).shiftRecord).toEqual([]);
  });

  describe("handleSave (POST)", () => {
    it("saves a new shift successfully and re-fetches data", async () => {
      mockInitialGet();
      const newShiftParams = {
        start: "2025-02-01T08:00:00Z",
        end: "2025-02-01T16:00:00Z",
      };
      const returnedShift = { id: 3, ...newShiftParams };

      mockedShift.mockResolvedValueOnce({
        status: 201,
        data: returnedShift,
        statusText: "Created",
        headers: {},
        config: {},
      } as AxiosResponse);

      const updatedShiftRecords = [returnedShift];
      mockedShift.mockResolvedValueOnce({
        status: 200,
        data: updatedShiftRecords,
        statusText: "OK",
        headers: {},
        config: {},
      } as AxiosResponse);

      const wrapper = mount(Shift, {
        global: { stubs: { Timezone: true, Table: true } },
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
      await (wrapper.vm as any).handleSave(newShiftParams);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockedShift).toHaveBeenCalledTimes(3);
      expect(mockedShift).toHaveBeenCalledWith("POST", newShiftParams);
      expect(mockedShift).toHaveBeenNthCalledWith(3, "GET");
      expect(mockedSwalFire).toHaveBeenCalledWith({
        title: `Shift saved successfully`,
        icon: "success",
        draggable: false,
      });
      expect((wrapper.vm as any).shiftRecord).toEqual(updatedShiftRecords);
    });

    it("handles error during new shift save", async () => {
      mockInitialGet();
      const newShiftParams = {
        start: "2025-02-01T08:00:00Z",
        end: "2025-02-01T16:00:00Z",
      };
      const errorMessage = "Failed to save shift";

      mockedShift.mockRejectedValueOnce({
        response: {
          data: {
            message: errorMessage,
          },
          status: 400,
          statusText: "Bad Request",
          headers: {},
          config: {},
        },
      });

      const wrapper = mount(Shift, {
        global: { stubs: { Timezone: true, Table: true } },
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
      await (wrapper.vm as any).handleSave(newShiftParams);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockedShift).toHaveBeenCalledTimes(2);
      expect(mockedShift).toHaveBeenCalledWith("POST", newShiftParams);
      expect(mockedSwalFire).toHaveBeenCalledWith({
        title: `Error: ${errorMessage}`,
        icon: "error",
        draggable: false,
      });
    });
  });

  describe("handleSave (PUT)", () => {
    it("updates an existing shift successfully and re-fetches data", async () => {
      mockInitialGet();
      const existingShiftId = 1;
      const updatedShiftParams = {
        start: "2025-03-01T07:00:00Z",
        end: "2025-03-01T15:00:00Z",
      };

      mockedShift.mockResolvedValueOnce({
        status: 200,
        data: { id: existingShiftId, ...updatedShiftParams },
        statusText: "OK",
        headers: {},
        config: {},
      } as AxiosResponse);

      const finalShiftRecords = [
        { id: existingShiftId, ...updatedShiftParams },
      ];
      mockedShift.mockResolvedValueOnce({
        status: 200,
        data: finalShiftRecords,
        statusText: "OK",
        headers: {},
        config: {},
      } as AxiosResponse);

      const wrapper = mount(Shift, {
        global: { stubs: { Timezone: true, Table: true } },
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
      await (wrapper.vm as any).handleSave(updatedShiftParams, existingShiftId);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockedShift).toHaveBeenCalledTimes(3);
      expect(mockedShift).toHaveBeenCalledWith(
        "PUT",
        updatedShiftParams,
        existingShiftId
      );
      expect(mockedShift).toHaveBeenNthCalledWith(3, "GET");
      expect(mockedSwalFire).toHaveBeenCalledWith({
        title: `Shift updated successfully`,
        icon: "success",
        draggable: false,
      });
      expect((wrapper.vm as any).shiftRecord).toEqual(finalShiftRecords);
    });

    it("handles error during existing shift update", async () => {
      mockInitialGet();
      const existingShiftId = 1;
      const updatedShiftParams = {
        start: "2025-03-01T07:00:00Z",
        end: "2025-03-01T15:00:00Z",
      };
      const errorMessage = "Failed to update shift";

      mockedShift.mockRejectedValueOnce({
        response: {
          data: {
            message: errorMessage,
          },
          status: 400,
          statusText: "Bad Request",
          headers: {},
          config: {},
        },
      });

      const wrapper = mount(Shift, {
        global: { stubs: { Timezone: true, Table: true } },
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
      await (wrapper.vm as any).handleSave(updatedShiftParams, existingShiftId);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockedShift).toHaveBeenCalledTimes(2);
      expect(mockedShift).toHaveBeenCalledWith(
        "PUT",
        updatedShiftParams,
        existingShiftId
      );
      expect(mockedSwalFire).toHaveBeenCalledWith({
        title: `Error: ${errorMessage}`,
        icon: "error",
        draggable: false,
      });
    });
  });

  describe("deleteShift", () => {
    it("deletes a shift successfully and re-fetches data", async () => {
      mockInitialGet();
      const shiftToDeleteId = 1;

      mockedShift.mockResolvedValueOnce({
        status: 204,
        data: null,
        statusText: "No Content",
        headers: {},
        config: {},
      } as AxiosResponse);

      const remainingShiftRecords = [{ id: 2, start: "...", end: "..." }];
      mockedShift.mockResolvedValueOnce({
        status: 200,
        data: remainingShiftRecords,
        statusText: "OK",
        headers: {},
        config: {},
      } as AxiosResponse);

      const wrapper = mount(Shift, {
        global: { stubs: { Timezone: true, Table: true } },
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
      await (wrapper.vm as any).deleteShift(shiftToDeleteId);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockedShift).toHaveBeenCalledTimes(3);
      expect(mockedShift).toHaveBeenCalledWith("DELETE", {}, shiftToDeleteId);
      expect(mockedShift).toHaveBeenNthCalledWith(3, "GET");
      expect(mockedSwalFire).toHaveBeenCalledWith({
        title: `Shift deleted successfully`,
        icon: "success",
        draggable: false,
      });
      expect((wrapper.vm as any).shiftRecord).toEqual(remainingShiftRecords);
    });

    it("handles error during shift deletion", async () => {
      mockInitialGet();
      const shiftToDeleteId = 1;
      const errorMessage = "Failed to delete shift";

      mockedShift.mockRejectedValueOnce({
        response: {
          data: {
            message: errorMessage,
          },
          status: 400,
          statusText: "Bad Request",
          headers: {},
          config: {},
        },
      });

      const wrapper = mount(Shift, {
        global: { stubs: { Timezone: true, Table: true } },
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
      await (wrapper.vm as any).deleteShift(shiftToDeleteId);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockedShift).toHaveBeenCalledTimes(2);
      expect(mockedShift).toHaveBeenCalledWith("DELETE", {}, shiftToDeleteId);
      expect(mockedSwalFire).toHaveBeenCalledWith({
        title: `Error: ${errorMessage}`,
        icon: "error",
        draggable: false,
      });
    });
  });
});
