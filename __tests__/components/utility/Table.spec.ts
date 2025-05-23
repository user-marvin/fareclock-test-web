import { mount } from "@vue/test-utils";
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  type MockInstance,
  afterEach,
} from "vitest";
import Table from "../../../src/components/utility/Table.vue";
import Modal from "../../../src/components/utility/Modal/Modal.vue";
import { calendarData } from "../../../src/constant/constant";

const MOCK_DATE = new Date("2025-05-24T12:00:00Z");
const MOCK_YEAR = MOCK_DATE.getFullYear();
const MOCK_MONTH = MOCK_DATE.getMonth();
type SaveFunction = (
  params: { start: string; end: string },
  id?: number
) => void;
type DeleteShiftFunction = (id: number) => void;
vi.useFakeTimers();

describe("Table.vue", () => {
  let wrapper: ReturnType<typeof mount>;
  let mockedSaveFunction: MockInstance;
  let mockedDeleteShift: MockInstance;

  type TableVm = InstanceType<typeof Table> & {
    state: {
      currentYear: number;
      currentMonth: number;
      calendarDays: { date: Date; current: boolean }[];
      showModal: boolean;
      selectedDate: Date | null;
      selectedShift: any | null;
    };
    nextMonth: () => void;
    prevMonth: () => void;
    createEntry: (date: Date, selectedShift?: any) => void;
    updateCalendarDays: () => void;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(MOCK_DATE);

    mockedSaveFunction = vi.fn();
    mockedDeleteShift = vi.fn();

    wrapper = mount(Table, {
      props: {
        saveFunction: mockedSaveFunction as unknown as SaveFunction,
        shiftRecord: [],
        deleteShift: mockedDeleteShift as unknown as DeleteShiftFunction,
      },
      global: {
        stubs: {
          Modal: Modal,
        },
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders correctly and displays the calendar grid", () => {
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.findAll("button").length).toBeGreaterThanOrEqual(2);
    expect(wrapper.find(".grid.grid-cols-7").exists()).toBe(true);
    expect(wrapper.find(".grid.grid-cols-7 > div:nth-child(1)").text()).toBe(
      calendarData.days[0]
    );
    expect(wrapper.findAll(".h-40.p-2").length).toBe(
      calendarData.weeks * calendarData.days.length
    );
  });

  it("initializes state with current month and year", () => {
    const vm = wrapper.vm as TableVm;
    expect(vm.state.currentYear).toBe(MOCK_YEAR);
    expect(vm.state.currentMonth).toBe(MOCK_MONTH);
  });

  it("generates correct calendar days for the current month", () => {
    const vm = wrapper.vm as TableVm;
    expect(vm.state.calendarDays.length).toBe(35);
    expect(vm.state.calendarDays[0].date.getDate()).toBe(28);
    expect(vm.state.calendarDays[0].date.getMonth()).toBe(3);
    expect(vm.state.calendarDays[0].current).toBe(false);

    const firstDayOfMay = vm.state.calendarDays.find(
      (day) => day.date.getDate() === 1 && day.current
    );
    expect(firstDayOfMay?.date.getMonth()).toBe(4);
    expect(firstDayOfMay).toBeDefined();
  });

  it("navigates to the next month correctly", async () => {
    const vm = wrapper.vm as TableVm;
    await wrapper.find("button:last-of-type").trigger("click");
    expect(vm.state.currentMonth).toBe(MOCK_MONTH + 1);
    expect(vm.state.currentYear).toBe(MOCK_YEAR);

    for (let i = 0; i < 7; i++) {
      await wrapper.find("button:last-of-type").trigger("click");
    }
    expect(vm.state.currentMonth).toBe(0);
    expect(vm.state.currentYear).toBe(MOCK_YEAR + 1);
  });

  it("navigates to the previous month correctly", async () => {
    const vm = wrapper.vm as TableVm;
    await wrapper.find("button:first-of-type").trigger("click");
    expect(vm.state.currentMonth).toBe(MOCK_MONTH - 1);
    expect(vm.state.currentYear).toBe(MOCK_YEAR);

    for (let i = 0; i < 4; i++) {
      await wrapper.find("button:first-of-type").trigger("click");
    }
    expect(vm.state.currentMonth).toBe(11);
    expect(vm.state.currentYear).toBe(MOCK_YEAR - 1);
  });

  it("emits 'update:modelValue' with new month and year on month change", async () => {
    expect(wrapper.emitted("update:modelValue")).toHaveLength(1);
    expect(wrapper.emitted("update:modelValue")![0][0]).toBe("May 2025");

    await wrapper.find("button:last-of-type").trigger("click");
    expect(wrapper.emitted("update:modelValue")).toHaveLength(2);
    expect(wrapper.emitted("update:modelValue")![1][0]).toBe("June 2025");

    await wrapper.find("button:first-of-type").trigger("click");
    expect(wrapper.emitted("update:modelValue")).toHaveLength(3);
    expect(wrapper.emitted("update:modelValue")![2][0]).toBe("May 2025");
  });

  describe("Modal Interaction", () => {
    it("opens modal with correct date when 'New Attendance' is clicked", async () => {
      const vm = wrapper.vm as TableVm;
      const firstCurrentDayCell = wrapper
        .findAll(".h-40.p-2")
        .find((div) => div.classes("bg-white"));
      const newAttendanceButton = firstCurrentDayCell!.find(
        "div.border.border-gray-400.text-sm.cursor-pointer"
      );
      await newAttendanceButton.trigger("click");
      expect(vm.state.showModal).toBe(true);
      expect(vm.state.selectedDate).toEqual(expect.any(Date));
      expect(vm.state.selectedShift).toBeNull();
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
          start: "2025-05-15T09:00:00Z",
          end: "2025-05-15T17:00:00Z",
          duration: 8,
        },
      ];

      wrapper = mount(Table, {
        props: {
          saveFunction: mockedSaveFunction as unknown as SaveFunction,
          shiftRecord: mockShiftRecords,
          deleteShift: mockedDeleteShift as unknown as DeleteShiftFunction,
        },
        global: {
          stubs: {
            Modal: Modal,
          },
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 0));

      const vm = wrapper.vm as TableVm;
      const shiftDisplayDiv = wrapper.find("div.named-attendance");

      expect(shiftDisplayDiv.exists()).toBe(true);
      expect(shiftDisplayDiv.text()).toContain("Marvin Villamar - [8hrs]");

      await shiftDisplayDiv.trigger("click");

      expect(vm.state.showModal).toBe(true);
      expect(vm.state.selectedDate).toEqual(expect.any(Date));
      expect(vm.state.selectedShift).toEqual(mockShiftRecords[0]);

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

      await newAttendanceButton.trigger("click");
      expect(vm.state.showModal).toBe(true);
      expect(wrapper.findComponent(Modal).exists()).toBe(true);

      (wrapper.findComponent(Modal).props().closeModal as Function)();

      await wrapper.vm.$nextTick();

      expect(vm.state.showModal).toBe(false);
      expect(wrapper.findComponent(Modal).exists()).toBe(false);
    });
  });

  it("displays existing shifts on the correct calendar days", async () => {
    const mockShiftRecords = [
      {
        id: 1,
        start: "2025-05-10T09:00:00Z",
        end: "2025-05-10T17:00:00Z",
        duration: 8,
      },
      {
        id: 2,
        start: "2025-05-20T10:00:00Z",
        end: "2025-05-20T18:00:00Z",
        duration: 8,
      },
    ];

    wrapper = mount(Table, {
      props: {
        saveFunction: mockedSaveFunction as unknown as SaveFunction,
        shiftRecord: mockShiftRecords,
        deleteShift: mockedDeleteShift as unknown as DeleteShiftFunction,
      },
      global: {
        stubs: {
          Modal: true,
        },
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    const may10thCell = wrapper.findAll(".h-40.p-2").find((cell) => {
      const dateText = cell.find(".font-bold").text();
      return dateText === "10" && cell.classes("bg-red-100");
    });

    expect(may10thCell).toBeDefined();
    expect(may10thCell?.text()).toContain("Marvin Villamar - [8hrs]");

    const may20thCell = wrapper.findAll(".h-40.p-2").find((cell) => {
      const dateText = cell.find(".font-bold").text();
      return dateText === "20" && cell.classes("bg-white");
    });
    expect(may20thCell).toBeDefined();
    expect(may20thCell?.text()).toContain("Marvin Villamar - [8hrs]");

    const may11thCell = wrapper.findAll(".h-40.p-2").find((cell) => {
      const dateText = cell.find(".font-bold").text();
      return dateText === "11";
    });
    expect(may11thCell?.text()).not.toContain("Marvin Villamar");
  });
});
