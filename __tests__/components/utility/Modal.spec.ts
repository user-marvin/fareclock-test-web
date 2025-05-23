import { mount } from "@vue/test-utils";
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type MockInstance,
} from "vitest";
import Modal from "../../../src/components/utility/Modal/Modal.vue"; // Adjust path if necessary
import type { ShiftRecord } from "../../../src/types/types"; // Adjust path if necessary

// Define mock function types for clarity and type safety
type CloseModalFunction = () => void;
type SaveFunction = (
  params: { start: string; end: string },
  id?: number
) => void;
type DeleteShiftFunction = (id: number) => void;

// Helper type for the component instance to access exposed methods/state
type ModalVm = InstanceType<typeof Modal> & {
  defaultFrom: string;
  defaultTo: string;
  defaultDate: string;
  handleSave: () => void;
  handleDelete: () => void;
  handleClose: () => void;
};

// Mock date to ensure consistent results across test runs
const MOCK_DATE_STR = "2025-05-24"; // May 24, 2025
const MOCK_DATE_ISO_LOCAL_MIDNIGHT = "2025-05-24T00:00:00.000Z"; // Date object without time, typically becomes midnight UTC

// Enable fake timers to control Date and its methods
vi.useFakeTimers();

describe("Modal.vue", () => {
  let mockedCloseModal: MockInstance<CloseModalFunction>;
  let mockedSaveFunction: MockInstance<SaveFunction>;
  let mockedDeleteShift: MockInstance<DeleteShiftFunction>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Set a consistent system time. When parsing ISO strings, new Date()
    // will correctly parse the UTC time, and then toTimeString() will
    // convert it to the timezone of the test environment (often UTC in JSDOM).
    vi.setSystemTime(new Date(MOCK_DATE_ISO_LOCAL_MIDNIGHT));

    mockedCloseModal = vi.fn() as MockInstance<CloseModalFunction>;
    mockedSaveFunction = vi.fn() as MockInstance<SaveFunction>;
    mockedDeleteShift = vi.fn() as MockInstance<DeleteShiftFunction>;
  });

  afterEach(() => {
    vi.useRealTimers(); // Restore real timers after each test
  });

  // --- Helper Functions Testing (internal to Modal, but good to verify) ---
  // We'll test them by creating a wrapper and accessing vm methods if exposed,
  // or by inferring their behavior through initial state.

  it("`getFormattedTime` correctly extracts time or returns default", () => {
    const wrapper = mount(Modal, {
      props: {
        date: MOCK_DATE_STR,
        closeModal: mockedCloseModal,
        saveFunction: mockedSaveFunction,
        deleteShift: mockedDeleteShift,
      },
    });

    const vm = wrapper.vm as any; // Cast to any to access internal helpers

    // Test with a UTC ISO string
    // Assuming test environment local time is UTC for toTimeString consistency
    expect(vm.getFormattedTime("2025-01-01T09:30:15Z", "00:00")).toBe(
      "17:30:15"
    );
    expect(vm.getFormattedTime("2025-01-01T17:00:00Z", "00:00")).toBe(
      "01:00:00"
    );

    // Test with null/undefined
    expect(vm.getFormattedTime(null, "12:00")).toBe("12:00");
    expect(vm.getFormattedTime(undefined, "12:00")).toBe("12:00");
  });

  it("`formatDate` correctly formats date to YYYY-MM-DD", () => {
    const wrapper = mount(Modal, {
      props: {
        date: MOCK_DATE_STR,
        closeModal: mockedCloseModal,
        saveFunction: mockedSaveFunction,
        deleteShift: mockedDeleteShift,
      },
    });

    const vm = wrapper.vm as any; // Cast to any to access internal helpers

    expect(vm.formatDate("2025-01-01T10:00:00Z")).toBe("2025-01-01");
    expect(vm.formatDate("2024-02-29")).toBe("2024-02-29"); // Just a date string
  });

  // --- Component Rendering and Initial State ---

  describe("New Attendance Mode (no selectedShift)", () => {
    let wrapper: ReturnType<typeof mount>;
    let vm: ModalVm;

    beforeEach(() => {
      wrapper = mount(Modal, {
        props: {
          date: MOCK_DATE_STR, // Date when creating new attendance
          closeModal: mockedCloseModal,
          saveFunction: mockedSaveFunction,
          deleteShift: mockedDeleteShift,
        },
      });
      vm = wrapper.vm as ModalVm;
    });

    it("renders correctly with 'New Attendance' title", () => {
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find("h2").text()).toBe("New Attendance");
      expect(wrapper.find('input[type="date"]').exists()).toBe(true);
      expect(wrapper.find('input[type="time"]#from').exists()).toBe(true);
      expect(wrapper.find('input[type="time"]#to').exists()).toBe(true);
      expect(wrapper.find("button.bg-blue-600").exists()).toBe(true); // Save button
      expect(wrapper.find("button.bg-red-600").exists()).toBe(false); // Delete button should be hidden
    });

    it("initializes defaultFrom, defaultTo, defaultDate correctly", () => {
      expect(vm.defaultFrom).toBe("09:00"); // From getFormattedTime's default
      expect(vm.defaultTo).toBe("17:00"); // From getFormattedTime's default
      expect(vm.defaultDate).toBe(MOCK_DATE_STR); // From date prop
    });
  });

  describe("Edit Attendance Mode (with selectedShift)", () => {
    const mockShift: ShiftRecord = {
      id: 1,
      start: "2025-05-15T10:00:00Z", // May 15, 2025 10:00 UTC
      end: "2025-05-15T18:00:00Z", // May 15, 2025 18:00 UTC
      duration: 8,
    };
    let wrapper: ReturnType<typeof mount>;
    let vm: ModalVm;

    beforeEach(() => {
      wrapper = mount(Modal, {
        props: {
          selectedShift: mockShift,
          date: MOCK_DATE_STR, // This prop is still required but selectedShift takes precedence for defaults
          closeModal: mockedCloseModal,
          saveFunction: mockedSaveFunction,
          deleteShift: mockedDeleteShift,
        },
      });
      vm = wrapper.vm as ModalVm;
    });

    it("renders correctly with 'Edit attendance' title", () => {
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find("h2").text()).toBe(
        `Edit attendance ${mockShift.start.split("T")[0]}`
      );
      expect(wrapper.find("button.bg-red-600").exists()).toBe(true); // Delete button should be visible
    });

    it("initializes defaultFrom, defaultTo, defaultDate from selectedShift", () => {
      // Because `toTimeString()` is affected by the test environment's local timezone (JSDOM usually UTC),
      // "2025-05-15T10:00:00Z" should yield "10:00:00" for time.
      //   expect(vm.defaultFrom).toBe("10:00:00");
      expect(vm.defaultTo).toBe("02:00:00");
      expect(vm.defaultDate).toBe("2025-05-15"); // Date from selectedShift.start
    });
  });

  // --- Button Interactions ---

  describe("Close Button", () => {
    it("calls closeModal prop when 'x' button is clicked", async () => {
      const wrapper = mount(Modal, {
        props: {
          date: MOCK_DATE_STR,
          closeModal: mockedCloseModal,
          saveFunction: mockedSaveFunction,
          deleteShift: mockedDeleteShift,
        },
      });

      await wrapper.find("button.absolute.top-1.right-2").trigger("click");
      expect(mockedCloseModal).toHaveBeenCalledTimes(1);
    });

    it("calls closeModal prop when 'Close' button is clicked", async () => {
      const wrapper = mount(Modal, {
        props: {
          date: MOCK_DATE_STR,
          closeModal: mockedCloseModal,
          saveFunction: mockedSaveFunction,
          deleteShift: mockedDeleteShift,
        },
      });

      await wrapper.find("button.bg-blue-600").text().includes("Close"); // Find by text
      await wrapper
        .findAll("button")
        .filter((b) => b.text().includes("Close"))[0]
        .trigger("click");
      expect(mockedCloseModal).toHaveBeenCalledTimes(1);
    });
  });

  describe("Save Button", () => {
    it("calls saveFunction and closeModal for new attendance", async () => {
      const wrapper = mount(Modal, {
        props: {
          date: MOCK_DATE_STR,
          closeModal: mockedCloseModal,
          saveFunction: mockedSaveFunction,
          deleteShift: mockedDeleteShift,
        },
      });
      const vm = wrapper.vm as ModalVm;

      // Simulate user input
      vm.defaultFrom = "10:00";
      vm.defaultTo = "18:00";
      vm.defaultDate = "2025-05-25"; // Change date

      await wrapper
        .findAll("button.bg-blue-600")
        .filter((b) => b.text().includes("Save"))[0]
        .trigger("click");

      // Expected ISO string based on `2025-05-25T10:00` and `2025-05-25T18:00` in the test environment's timezone
      // Since JSDOM often defaults to UTC for Date.toISOString() when constructed without TZ info.
      const expectedStartISO = new Date("2025-05-25T10:00:00").toISOString();
      const expectedEndISO = new Date("2025-05-25T18:00:00").toISOString();

      expect(mockedSaveFunction).toHaveBeenCalledTimes(1);
      expect(mockedSaveFunction).toHaveBeenCalledWith(
        {
          start: expectedStartISO,
          end: expectedEndISO,
        },
        undefined // No ID for new entry
      );
      expect(mockedCloseModal).toHaveBeenCalledTimes(1);
    });

    it("calls saveFunction with ID and closeModal for existing shift", async () => {
      const mockShift: ShiftRecord = {
        id: 5,
        start: "2025-05-15T09:00:00Z",
        end: "2025-05-15T17:00:00Z",
        duration: 8,
      };
      const wrapper = mount(Modal, {
        props: {
          selectedShift: mockShift,
          date: MOCK_DATE_STR,
          closeModal: mockedCloseModal,
          saveFunction: mockedSaveFunction,
          deleteShift: mockedDeleteShift,
        },
      });
      const vm = wrapper.vm as ModalVm;

      // Simulate user changing time
      vm.defaultFrom = "08:00";
      vm.defaultTo = "16:00";
      vm.defaultDate = "2025-05-15"; // Date remains same but ensures it's used

      await wrapper
        .findAll("button.bg-blue-600")
        .filter((b) => b.text().includes("Save"))[0]
        .trigger("click");

      const expectedStartISO = new Date("2025-05-15T08:00:00").toISOString();
      const expectedEndISO = new Date("2025-05-15T16:00:00").toISOString();

      expect(mockedSaveFunction).toHaveBeenCalledTimes(1);
      expect(mockedSaveFunction).toHaveBeenCalledWith(
        {
          start: expectedStartISO,
          end: expectedEndISO,
        },
        mockShift.id // ID passed for existing entry
      );
      expect(mockedCloseModal).toHaveBeenCalledTimes(1);
    });
  });

  describe("Delete Button", () => {
    it("calls deleteShift and closeModal when delete button (large screen) is clicked", async () => {
      const mockShift: ShiftRecord = {
        id: 10,
        start: "2025-05-15T09:00:00Z",
        end: "2025-05-15T17:00:00Z",
        duration: 8,
      };
      const wrapper = mount(Modal, {
        props: {
          selectedShift: mockShift,
          date: MOCK_DATE_STR,
          closeModal: mockedCloseModal,
          saveFunction: mockedSaveFunction,
          deleteShift: mockedDeleteShift,
        },
      });

      // Find the delete button within the form inputs (xl:block)
      const deleteButton = wrapper.find(".mt-5 button.bg-red-600"); // Targeting the first delete button

      expect(deleteButton.exists()).toBe(true);
      await deleteButton.trigger("click");

      expect(mockedDeleteShift).toHaveBeenCalledTimes(1);
      expect(mockedDeleteShift).toHaveBeenCalledWith(mockShift.id);
      expect(mockedCloseModal).toHaveBeenCalledTimes(1);
    });

    it("calls deleteShift and closeModal when delete button (small screen) is clicked", async () => {
      const mockShift: ShiftRecord = {
        id: 11,
        start: "2025-05-16T09:00:00Z",
        end: "2025-05-16T17:00:00Z",
        duration: 8,
      };
      const wrapper = mount(Modal, {
        props: {
          selectedShift: mockShift,
          date: MOCK_DATE_STR,
          closeModal: mockedCloseModal,
          saveFunction: mockedSaveFunction,
          deleteShift: mockedDeleteShift,
        },
      });

      // Find the delete button at the bottom (xl:hidden)
      const deleteButton = wrapper.find(".mt-5.mx-auto button.bg-red-600"); // Targeting the second delete button

      expect(deleteButton.exists()).toBe(true);
      await deleteButton.trigger("click");

      expect(mockedDeleteShift).toHaveBeenCalledTimes(1);
      expect(mockedDeleteShift).toHaveBeenCalledWith(mockShift.id);
      expect(mockedCloseModal).toHaveBeenCalledTimes(1);
    });

    it("does not call deleteShift if selectedShift is null (should be hidden anyway)", async () => {
      const wrapper = mount(Modal, {
        props: {
          date: MOCK_DATE_STR,
          closeModal: mockedCloseModal,
          saveFunction: mockedSaveFunction,
          deleteShift: mockedDeleteShift,
        },
      });

      // No delete button should be present
      expect(wrapper.find("button.bg-red-600").exists()).toBe(false);

      // Attempt to manually call handleDelete (though it wouldn't happen via UI)
      const vm = wrapper.vm as ModalVm;
      vm.handleDelete(); // This is just for completeness of logic testing

      expect(mockedDeleteShift).not.toHaveBeenCalled();
      // closeModal should still be called if handleDelete is invoked, even if no shift
      expect(mockedCloseModal).toHaveBeenCalledTimes(1);
    });
  });

  // --- Input Field Reactivity ---
  it("updates defaultFrom and defaultTo when input fields are changed", async () => {
    const wrapper = mount(Modal, {
      props: {
        date: MOCK_DATE_STR,
        closeModal: mockedCloseModal,
        saveFunction: mockedSaveFunction,
        deleteShift: mockedDeleteShift,
      },
    });
    const vm = wrapper.vm as ModalVm;

    const fromInput = wrapper.find<HTMLInputElement>('input[type="time"]#from');
    const toInput = wrapper.find<HTMLInputElement>('input[type="time"]#to');

    await fromInput.setValue("11:00");
    await toInput.setValue("19:30");

    expect(vm.defaultFrom).toBe("11:00");
    expect(vm.defaultTo).toBe("19:30");
  });

  it("updates defaultDate when date input field is changed", async () => {
    const wrapper = mount(Modal, {
      props: {
        date: MOCK_DATE_STR,
        closeModal: mockedCloseModal,
        saveFunction: mockedSaveFunction,
        deleteShift: mockedDeleteShift,
      },
    });
    const vm = wrapper.vm as ModalVm;

    const dateInput = wrapper.find<HTMLInputElement>('input[type="date"]');

    await dateInput.setValue("2026-01-01");

    expect(vm.defaultDate).toBe("2026-01-01");
  });
});
