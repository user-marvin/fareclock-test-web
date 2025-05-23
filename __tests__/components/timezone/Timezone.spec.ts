import { mount } from "@vue/test-utils";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Timezone from "../../../src/components/timezone/Timezone.vue";
import Dropdown from "../../../src/components/utility/Dropdown.vue";
import * as request from "../../../src/server/request";
import Swal from "sweetalert2";
import { AxiosResponse } from "axios";

// Mock sweetalert2
vi.mock("sweetalert2", () => ({
  default: {
    fire: vi.fn(),
  },
}));

// Mock the request module
vi.mock("../../../src/server/request", () => ({
  timezone: vi.fn(),
}));

describe("Timezone.vue", () => {
  beforeEach(() => {
    // Reset mocks before each test
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
          Dropdown: true, // Stub Dropdown component
        },
      },
    });

    // Wait for onMounted to complete
    await new Promise((resolve) => setTimeout(resolve, 0)); // Await next tick

    // Check if the component renders
    expect(wrapper.exists()).toBe(true);

    // Verify Dropdown is rendered
    expect(wrapper.findComponent(Dropdown).exists()).toBe(true);

    // Verify Save button is present
    expect(wrapper.find("button").text()).toBe("Save");
  });

  it("fetches and sets default timezone on mount", async () => {
    const mockTimezone = "Europe/London";
    vi.mocked(request.timezone).mockResolvedValueOnce({
      status: 200,
      data: mockTimezone,
      statusText: "OK", // Add this
      headers: {}, // Add this (can be an empty object)
      config: {}, // Add this (can be an empty object)
    } as AxiosResponse);

    const wrapper = mount(Timezone, {
      global: {
        stubs: {
          Dropdown: true,
        },
      },
    });

    // Wait for the onMounted hook to execute and the async operation to complete
    await new Promise((resolve) => setTimeout(resolve, 0)); // Await next tick

    // Access the exposed defaultTimezone ref
    expect(wrapper.vm.defaultTimezone).toBe(mockTimezone);
    expect(request.timezone).toHaveBeenCalledWith("GET");
  });

  it("displays error message if no timezone is selected on save", async () => {
    // Mock initial GET request
    vi.mocked(request.timezone).mockResolvedValueOnce({
      status: 200,
      data: "",
      statusText: "OK", // Add this
      headers: {}, // Add this (can be an empty object)
      config: {}, // Add this (can be an empty object)
    } as AxiosResponse);

    const wrapper = mount(Timezone, {
      global: {
        stubs: {
          Dropdown: true,
        },
      },
    });

    // Wait for onMounted
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Simulate clicking the save button without selecting a timezone
    await wrapper.find("button").trigger("click");

    // Check if the error message is displayed
    expect(wrapper.find(".text-red-500").exists()).toBe(true);
    expect(wrapper.find(".text-red-500").text()).toBe(
      "Please select a timezone."
    );
    expect(request.timezone).not.toHaveBeenCalledWith(
      "PUT",
      expect.any(Object)
    ); // Ensure PUT request was not made
  });

  it("saves the selected timezone successfully", async () => {
    const selectedTimezone = "Asia/Manila";
    vi.mocked(request.timezone)
      .mockResolvedValueOnce({
        status: 200,
        data: "",
        statusText: "OK", // Add this
        headers: {}, // Add this (can be an empty object)
        config: {}, // Add this (can be an empty object)
      } as AxiosResponse) // Mock initial GET
      .mockResolvedValueOnce({
        status: 200,
        data: selectedTimezone,
        statusText: "OK", // Add this
        headers: {}, // Add this (can be an empty object)
        config: {}, // Add this (can be an empty object)
      } as AxiosResponse); // Mock PUT success

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

    // Wait for onMounted
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Simulate selecting a timezone from the dropdown
    // Since Dropdown is a stub, we need to manually update the v-model
    await wrapper
      .findComponent(Dropdown)
      .vm.$emit("update:modelValue", selectedTimezone);
    await wrapper.vm.$nextTick(); // Wait for Vue to react to the v-model update

    expect(wrapper.vm.defaultTimezone).toBe(selectedTimezone);

    // Simulate clicking the save button
    await wrapper.find("button").trigger("click");

    // Wait for the async save operation to complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Verify the PUT request was made with the correct data
    expect(request.timezone).toHaveBeenCalledWith("PUT", {
      timezone: selectedTimezone,
    });

    // Verify Swal.fire was called on success
    expect(Swal.fire).toHaveBeenCalledWith({
      title: `Timezone saved successfully: ${selectedTimezone}`,
      icon: "success",
      draggable: false,
    });

    // Check if error message is no longer visible
    expect(wrapper.find(".text-red-500").exists()).toBe(false);
  });

  it("displays error message on failed timezone save", async () => {
    const selectedTimezone = "America/New_York";
    vi.mocked(request.timezone)
      .mockResolvedValueOnce({
        status: 200,
        data: "",
        statusText: "OK", // Add this
        headers: {}, // Add this (can be an empty object)
        config: {}, // Add this (can be an empty object)
      } as AxiosResponse) // Mock initial GET
      .mockRejectedValueOnce(new Error("Network error")); // Mock PUT failure

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

    // Wait for onMounted
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Simulate selecting a timezone
    await wrapper
      .findComponent(Dropdown)
      .vm.$emit("update:modelValue", selectedTimezone);
    await wrapper.vm.$nextTick();

    // Simulate clicking the save button
    await wrapper.find("button").trigger("click");

    // Wait for the async save operation to complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Verify the PUT request was attempted
    expect(request.timezone).toHaveBeenCalledWith("PUT", {
      timezone: selectedTimezone,
    });

    // Verify Swal.fire was NOT called
    expect(Swal.fire).not.toHaveBeenCalled();

    // Check if the error message is displayed
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

    // Wait for the onMounted hook to execute and the async operation to complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Verify that defaultTimezone remains empty
    expect(wrapper.vm.defaultTimezone).toBe("");

    // Verify that the error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error fetching timezone:",
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore(); // Restore console.error
  });
});
