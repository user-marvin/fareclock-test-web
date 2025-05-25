import { mount } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Timezone from "../../../src/components/timezone/Timezone.vue";
import Dropdown from "../../../src/components/utility/Dropdown.vue";
import * as request from "../../../src/server/request";
import Swal from "sweetalert2";
import { AxiosResponse } from "axios";

vi.mock("sweetalert2", () => ({
  default: {
    fire: vi.fn(),
    close: vi.fn(),
    showLoading: vi.fn(),
  },
}));

vi.mock("../../../src/server/request", () => ({
  timezone: vi.fn(),
}));

describe("Timezone.vue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("component render correctly and displays initial state", async () => {
    vi.mocked(request.timezone).mockResolvedValueOnce({
      status: 200,
      data: "",
      statusText: "OK",
      headers: {},
      config: {},
    } as AxiosResponse);

    const wrapper = mount(Timezone, {
      global: {
        stubs: {
          Dropdown: true,
        },
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.findComponent(Dropdown).exists()).toBe(true);
    expect(wrapper.find("button").text()).toBe("Save");
  });

  it("fetches and sets default timezone on mount", async () => {
    const mockTimezone = "Europe/London";
    vi.mocked(request.timezone).mockResolvedValueOnce({
      status: 200,
      data: mockTimezone,
      statusText: "OK",
      headers: {},
      config: {},
    } as AxiosResponse);

    const wrapper = mount(Timezone, {
      global: {
        stubs: {
          Dropdown: true,
        },
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(wrapper.vm.defaultTimezone).toBe(mockTimezone);
    expect(request.timezone).toHaveBeenCalledWith("GET");
  });

  it("displays error message if no timezone is selected on save", async () => {
    vi.mocked(request.timezone).mockResolvedValueOnce({
      status: 200,
      data: "",
      statusText: "OK",
      headers: {},
      config: {},
    } as AxiosResponse);

    const wrapper = mount(Timezone, {
      global: {
        stubs: {
          Dropdown: true,
        },
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    await wrapper.find("button").trigger("click");

    expect(wrapper.find(".text-red-500").exists()).toBe(true);
    expect(wrapper.find(".text-red-500").text()).toBe(
      "Please select a timezone."
    );
    expect(request.timezone).not.toHaveBeenCalledWith(
      "PUT",
      expect.any(Object)
    );
  });

  it("saves the selected timezone successfully", async () => {
    const selectedTimezone = "Asia/Manila";
    vi.mocked(request.timezone)
      .mockResolvedValueOnce({
        status: 200,
        data: "",
        statusText: "OK",
        headers: {},
        config: {},
      } as AxiosResponse)
      .mockResolvedValueOnce({
        status: 200,
        data: selectedTimezone,
        statusText: "OK",
        headers: {},
        config: {},
      } as AxiosResponse);

    const wrapper = mount(Timezone, {
      global: {
        stubs: {
          Dropdown: {
            template:
              '<select @change="$emit(\'update:modelValue\', $event.target.value)"><option value="">Select Timezone</option><option value="Asia/Manila">Asia/Manila</option></select>',
            props: ["data", "placeholder", "modelValue"],
            emits: ["update:modelValue"],
          },
        },
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    await wrapper
      .findComponent(Dropdown)
      .vm.$emit("update:modelValue", selectedTimezone);
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.defaultTimezone).toBe(selectedTimezone);

    await wrapper.find("button").trigger("click");
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(request.timezone).toHaveBeenCalledWith("PUT", {
      timezone: selectedTimezone,
    });

    expect(Swal.fire).toHaveBeenCalledWith({
      title: `Timezone saved successfully: ${selectedTimezone}`,
      icon: "success",
      draggable: false,
    });

    expect(wrapper.find(".text-red-500").exists()).toBe(false);
  });

  it("displays error message on failed timezone save", async () => {
    const selectedTimezone = "America/New_York";
    vi.mocked(request.timezone)
      .mockResolvedValueOnce({
        status: 200,
        data: "",
        statusText: "OK",
        headers: {},
        config: {},
      } as AxiosResponse)
      .mockRejectedValueOnce(new Error("Network error"));

    const wrapper = mount(Timezone, {
      global: {
        stubs: {
          Dropdown: {
            template:
              '<select @change="$emit(\'update:modelValue\', $event.target.value)"><option value="">Select Timezone</option><option value="America/New_York">America/New_York</option></select>',
            props: ["data", "placeholder", "modelValue"],
            emits: ["update:modelValue"],
          },
        },
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    await wrapper
      .findComponent(Dropdown)
      .vm.$emit("update:modelValue", selectedTimezone);
    await wrapper.vm.$nextTick();

    await wrapper.find("button").trigger("click");
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(request.timezone).toHaveBeenCalledWith("PUT", {
      timezone: selectedTimezone,
    });

    expect(wrapper.find(".text-red-500").exists()).toBe(true);
    expect(wrapper.find(".text-red-500").text()).toBe("Error saving timezone.");
  });

  it("handles error during initial timezone fetch", async () => {
    vi.mocked(request.timezone).mockRejectedValueOnce(new Error("Fetch error"));

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const wrapper = mount(Timezone, {
      global: {
        stubs: {
          Dropdown: true,
        },
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(wrapper.vm.defaultTimezone).toBe("");
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error fetching timezone:",
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});
