import { mount } from "@vue/test-utils";
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  type MockInstance,
} from "vitest";
import Table from "../../../src/components/utility/Table.vue"; // Adjust path if necessary
import Modal from "../../../src/components/utility/Modal/Modal.vue"; // Adjust path if necessary
import { calendarData } from "../../../src/constant/constant"; // Adjust path if necessary

// Mock `Date` to control the current date for consistent calendar generation
const MOCK_DATE = new Date("2025-05-24T12:00:00Z"); // May 24, 2025 (a Friday)
const MOCK_YEAR = MOCK_DATE.getFullYear(); // 2025
const MOCK_MONTH = MOCK_DATE.getMonth(); // 4 (May)
type SaveFunction = (
  params: { start: string; end: string },
  id?: number
) => void;
type DeleteShiftFunction = (id: number) => void;
vi.useFakeTimers(); // Enable fake timers to control Date

describe("Table.vue", () => {
  let wrapper: ReturnType<typeof mount>;
  let mockedSaveFunction: MockInstance<SaveFunction>;
  let mockedDeleteShift: MockInstance<DeleteShiftFunction>;

  // Cast wrapper.vm to 'any' to access exposed properties
  type TableVm = InstanceType<typeof Table> & {
    state: {
      currentYear: number;
      currentMonth: number;
      calendarDays: { date: Date; current: boolean }[];
      showModal: boolean;
      selectedDate: Date | null;
      selectedShift: any | null; // Using any for ShiftRecord due to external type
    };
    nextMonth: () => void;
    prevMonth: () => void;
    createEntry: (date: Date, selectedShift?: any) => void;
    updateCalendarDays: () => void;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(MOCK_DATE); // Set the current system time for each test

    mockedSaveFunction = vi.fn();
    mockedDeleteShift = vi.fn();

    wrapper = mount(Table, {
      props: {
        saveFunction: mockedSaveFunction,
        shiftRecord: [],
        deleteShift: mockedDeleteShift,
      },
      global: {
        stubs: {
          // We need to render the Modal fully for it to test its interaction
          // If Modal itself has heavy dependencies, you might stub those within Modal's own test file.
          Modal: Modal,
        },
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers(); // Restore real timers after each test
  });

  it("renders correctly and displays the calendar grid", () => {
    expect(wrapper.exists()).toBe(true);

    // Check for month navigation buttons
    expect(wrapper.findAll("button").length).toBeGreaterThanOrEqual(2); // Prev & Next
    expect(wrapper.find(".grid.grid-cols-7").exists()).toBe(true); // Calendar grid
    expect(wrapper.find(".grid.grid-cols-7 > div:nth-child(1)").text()).toBe(
      calendarData.days[0]
    ); // Check first day of week header

    // Check for initial calendar days display (should be 42 cells)
    expect(wrapper.findAll(".h-40.p-2").length).toBe(
      calendarData.weeks * calendarData.days.length
    );
  });

  it("initializes state with current month and year", () => {
    const vm = wrapper.vm as TableVm;
    expect(vm.state.currentYear).toBe(MOCK_YEAR);
    expect(vm.state.currentMonth).toBe(MOCK_MONTH); // May is 4 (0-indexed)
  });

  it("generates correct calendar days for the current month", () => {
    const vm = wrapper.vm as TableVm;
    expect(vm.state.calendarDays.length).toBe(35); // 6 weeks * 7 days

    // Verify a day from previous month is correct (e.g., April 28)
    expect(vm.state.calendarDays[0].date.getDate()).toBe(28);
    expect(vm.state.calendarDays[0].date.getMonth()).toBe(3); // April
    expect(vm.state.calendarDays[0].current).toBe(false);

    // Verify the first day of the current month (May 1st)
    const firstDayOfMay = vm.state.calendarDays.find(
      (day) => day.date.getDate() === 1 && day.current
    );
    expect(firstDayOfMay?.date.getMonth()).toBe(4); // May
    expect(firstDayOfMay).toBeDefined();
  });

  it("navigates to the next month correctly", async () => {
    const vm = wrapper.vm as TableVm;
    await wrapper.find("button:last-of-type").trigger("click"); // Click the next month button

    expect(vm.state.currentMonth).toBe(MOCK_MONTH + 1); // Should be June (5)
    expect(vm.state.currentYear).toBe(MOCK_YEAR);

    // Click until December, then to next year
    for (let i = 0; i < 7; i++) {
      await wrapper.find("button:last-of-type").trigger("click");
    } // Should now be January of next year

    expect(vm.state.currentMonth).toBe(0); // January
    expect(vm.state.currentYear).toBe(MOCK_YEAR + 1); // 2026
  });

  it("navigates to the previous month correctly", async () => {
    const vm = wrapper.vm as TableVm;
    await wrapper.find("button:first-of-type").trigger("click"); // Click the previous month button

    expect(vm.state.currentMonth).toBe(MOCK_MONTH - 1); // Should be April (3)
    expect(vm.state.currentYear).toBe(MOCK_YEAR);

    // Click until January, then to previous year
    for (let i = 0; i < 4; i++) {
      await wrapper.find("button:first-of-type").trigger("click");
    } // Should now be December of previous year

    expect(vm.state.currentMonth).toBe(11); // December
    expect(vm.state.currentYear).toBe(MOCK_YEAR - 1); // 2024
  });

  it("emits 'update:modelValue' with new month and year on month change", async () => {
    // Initial emit on mount
    expect(wrapper.emitted("update:modelValue")).toHaveLength(1);
    expect(wrapper.emitted("update:modelValue")![0][0]).toBe("May 2025");

    await wrapper.find("button:last-of-type").trigger("click"); // Next month (June)
    expect(wrapper.emitted("update:modelValue")).toHaveLength(2);
    expect(wrapper.emitted("update:modelValue")![1][0]).toBe("June 2025");

    await wrapper.find("button:first-of-type").trigger("click"); // Previous month (May again)
    expect(wrapper.emitted("update:modelValue")).toHaveLength(3);
    expect(wrapper.emitted("update:modelValue")![2][0]).toBe("May 2025");
  });

  describe("Modal Interaction", () => {
    it("opens modal with correct date when 'New Attendance' is clicked", async () => {
      const vm = wrapper.vm as TableVm;
      const firstCurrentDayCell = wrapper
        .findAll(".h-40.p-2")
        .find((div) => div.classes("bg-white")); // Find a day cell for the current month

      expect(firstCurrentDayCell).toBeDefined();

      const newAttendanceButton = firstCurrentDayCell!.find(
        "div.border.border-gray-400.text-sm.cursor-pointer"
      );
      expect(newAttendanceButton.text()).toContain("New Attendance");

      await newAttendanceButton.trigger("click");

      expect(vm.state.showModal).toBe(true);
      expect(vm.state.selectedDate).toEqual(expect.any(Date));
      expect(vm.state.selectedShift).toBeNull(); // Should be null for new entry

      // Check if the Modal component is now visible
      expect(wrapper.findComponent(Modal).exists()).toBe(true);
      expect(wrapper.findComponent(Modal).props().date).toEqual(
        vm.state.selectedDate
      );
      expect(wrapper.findComponent(Modal).props().selectedShift).toBeNull();
    });

    it("opens modal with correct shift data when an existing shift is clicked", async () => {
      const mockShiftRecords = [
        {
          id: 1,
          start: "2025-05-15T09:00:00Z", // May 15, 2025
          end: "2025-05-15T17:00:00Z",
          duration: 8,
        },
      ];

      // Re-mount with shiftRecord prop
      wrapper = mount(Table, {
        props: {
          saveFunction: mockedSaveFunction,
          shiftRecord: mockShiftRecords,
          deleteShift: mockedDeleteShift,
        },
        global: {
          stubs: {
            Modal: Modal,
          },
        },
      });

      // Wait for re-render with new prop
      await new Promise((resolve) => setTimeout(resolve, 0));

      const vm = wrapper.vm as TableVm;
      const shiftDisplayDiv = wrapper.find("div.named-attendance");

      expect(shiftDisplayDiv.exists()).toBe(true);
      expect(shiftDisplayDiv.text()).toContain("Marvin Villamar - [8hrs]");

      await shiftDisplayDiv.trigger("click");

      expect(vm.state.showModal).toBe(true);
      expect(vm.state.selectedDate).toEqual(expect.any(Date)); // Date of the clicked shift
      expect(vm.state.selectedShift).toEqual(mockShiftRecords[0]); // Should be the clicked shift

      expect(wrapper.findComponent(Modal).exists()).toBe(true);
      expect(wrapper.findComponent(Modal).props().selectedShift).toEqual(
        mockShiftRecords[0]
      );
    });

    it("closes the modal when closeModal prop is called (from Modal)", async () => {
      const vm = wrapper.vm as TableVm;
      const firstCurrentDayCell = wrapper
        .findAll(".h-40.p-2")
        .find((div) => div.classes("bg-white"));
      const newAttendanceButton = firstCurrentDayCell!.find(
        "div.border.border-gray-400.text-sm.cursor-pointer"
      );

      await newAttendanceButton.trigger("click"); // Open modal
      expect(vm.state.showModal).toBe(true);
      expect(wrapper.findComponent(Modal).exists()).toBe(true);

      // Simulate Modal calling its closeModal prop
      (wrapper.findComponent(Modal).props().closeModal as Function)();

      // Wait for next tick for reactivity
      await wrapper.vm.$nextTick();

      expect(vm.state.showModal).toBe(false);
      expect(wrapper.findComponent(Modal).exists()).toBe(false); // Modal should be removed from DOM
    });
  });

  it("displays existing shifts on the correct calendar days", async () => {
    const mockShiftRecords = [
      {
        id: 1,
        start: "2025-05-10T09:00:00Z", // May 10, 2025 (Saturday)
        end: "2025-05-10T17:00:00Z",
        duration: 8,
      },
      {
        id: 2,
        start: "2025-05-20T10:00:00Z", // May 20, 2025 (Tuesday)
        end: "2025-05-20T18:00:00Z",
        duration: 8,
      },
    ];

    // Re-mount with the shiftRecord prop
    wrapper = mount(Table, {
      props: {
        saveFunction: mockedSaveFunction,
        shiftRecord: mockShiftRecords,
        deleteShift: mockedDeleteShift,
      },
      global: {
        stubs: {
          Modal: true, // Stub Modal for this test as we're only checking display
        },
      },
    });

    // Wait for reactivity and rendering
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Find the cell for May 10th
    const may10thCell = wrapper.findAll(".h-40.p-2").find((cell) => {
      const dateText = cell.find(".font-bold").text();
      return (
        dateText === "10" && cell.classes("bg-red-100") // May 10 is a Saturday
      );
    });

    expect(may10thCell).toBeDefined();
    expect(may10thCell?.text()).toContain("Marvin Villamar - [8hrs]");

    // Find the cell for May 20th
    const may20thCell = wrapper.findAll(".h-40.p-2").find((cell) => {
      const dateText = cell.find(".font-bold").text();
      return (
        dateText === "20" && cell.classes("bg-white") // May 20 is a Tuesday
      );
    });
    expect(may20thCell).toBeDefined();
    expect(may20thCell?.text()).toContain("Marvin Villamar - [8hrs]");

    // Ensure shifts are not displayed on incorrect days
    const may11thCell = wrapper.findAll(".h-40.p-2").find((cell) => {
      const dateText = cell.find(".font-bold").text();
      return dateText === "11";
    });
    expect(may11thCell?.text()).not.toContain("Marvin Villamar"); // Should not contain a shift
  });
});
