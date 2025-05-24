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
import Modal from "../../../src/components/utility/Modal/Modal.vue";
import type { ShiftRecord } from "../../../src/types/types";

type CloseModalFunction = () => void;
type SaveFunction = (
  params: { start: string; end: string },
  id?: number
) => void;
type DeleteShiftFunction = (id: number) => void;

type ModalVm = InstanceType<typeof Modal> & {
  defaultFrom: string;
  defaultTo: string;
  defaultDate: string;
  handleSave: () => void;
  handleDelete: () => void;
  handleClose: () => void;
};

const MOCK_DATE_STR = "2025-05-24";
const MOCK_DATE_ISO_LOCAL_MIDNIGHT = "2025-05-24T00:00:00.000Z";

vi.useFakeTimers();

describe("Modal.vue", () => {
  let mockedCloseModal: MockInstance<CloseModalFunction>;
  let mockedSaveFunction: MockInstance<SaveFunction>;
  let mockedDeleteShift: MockInstance<DeleteShiftFunction>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(new Date(MOCK_DATE_ISO_LOCAL_MIDNIGHT));

    mockedCloseModal = vi.fn() as MockInstance<CloseModalFunction>;
    mockedSaveFunction = vi.fn() as MockInstance<SaveFunction>;
    mockedDeleteShift = vi.fn() as MockInstance<DeleteShiftFunction>;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("`getFormattedTime` correctly extracts time or returns default", () => {
    const wrapper = mount(Modal, {
      props: {
        date: new Date(MOCK_DATE_STR),
        closeModal: mockedCloseModal as unknown as CloseModalFunction,
        saveFunction: mockedSaveFunction as unknown as SaveFunction,
        deleteShift: mockedDeleteShift as unknown as DeleteShiftFunction,
      },
    });

    const vm = wrapper.vm as any;

    expect(vm.getFormattedTime("2025-01-01T09:30:15Z", "00:00")).toBe(
      "17:30:15"
    );
    expect(vm.getFormattedTime("2025-01-01T17:00:00Z", "00:00")).toBe(
      "01:00:00"
    );

    expect(vm.getFormattedTime(null, "12:00")).toBe("12:00");
    expect(vm.getFormattedTime(undefined, "12:00")).toBe("12:00");
  });

  it("`formatDate` correctly formats date to YYYY-MM-DD", () => {
    const wrapper = mount(Modal, {
      props: {
        date: new Date(MOCK_DATE_STR),
        closeModal: mockedCloseModal as unknown as CloseModalFunction,
        saveFunction: mockedSaveFunction as unknown as SaveFunction,
        deleteShift: mockedDeleteShift as unknown as DeleteShiftFunction,
      },
    });

    const vm = wrapper.vm as any;

    expect(vm.formatDate("2025-01-01T10:00:00Z")).toBe("2025-01-01");
    expect(vm.formatDate("2024-02-29")).toBe("2024-02-29");
  });

  describe("New Attendance Mode (no selectedShift)", () => {
    let wrapper: ReturnType<typeof mount>;
    let vm: ModalVm;

    beforeEach(() => {
      wrapper = mount(Modal, {
        props: {
          date: new Date(MOCK_DATE_STR),
          closeModal: mockedCloseModal as unknown as CloseModalFunction,
          saveFunction: mockedSaveFunction as unknown as SaveFunction,
          deleteShift: mockedDeleteShift as unknown as DeleteShiftFunction,
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
      expect(wrapper.find("button.bg-blue-600").exists()).toBe(true);
      expect(wrapper.find("button.bg-red-600").exists()).toBe(false);
    });

    it("initializes defaultFrom, defaultTo, defaultDate correctly", () => {
      expect(vm.defaultFrom).toBe("09:00");
      expect(vm.defaultTo).toBe("17:00");
      expect(vm.defaultDate).toBe(MOCK_DATE_STR);
    });
  });

  describe("Edit Attendance Mode (with selectedShift)", () => {
    const mockShift: ShiftRecord = {
      id: 1,
      start: "2025-05-15T10:00:00Z",
      end: "2025-05-15T18:00:00Z",
      duration: 8,
    };
    let wrapper: ReturnType<typeof mount>;
    let vm: ModalVm;

    beforeEach(() => {
      wrapper = mount(Modal, {
        props: {
          selectedShift: mockShift,
          date: new Date(MOCK_DATE_STR),
          closeModal: mockedCloseModal as unknown as CloseModalFunction,
          saveFunction: mockedSaveFunction as unknown as SaveFunction,
          deleteShift: mockedDeleteShift as unknown as DeleteShiftFunction,
        },
      });
      vm = wrapper.vm as ModalVm;
    });

    it("renders correctly with 'Edit attendance' title", () => {
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find("h2").text()).toBe(
        `Edit attendance ${mockShift.start.split("T")[0]}`
      );
      expect(wrapper.find("button.bg-red-600").exists()).toBe(true);
    });

    it("initializes defaultFrom, defaultTo, defaultDate from selectedShift", () => {
      expect(vm.defaultTo).toBe("02:00:00");
      expect(vm.defaultDate).toBe("2025-05-15");
    });
  });

  describe("Close Button", () => {
    it("calls closeModal prop when 'x' button is clicked", async () => {
      const wrapper = mount(Modal, {
        props: {
          date: new Date(MOCK_DATE_STR),
          closeModal: mockedCloseModal as unknown as CloseModalFunction,
          saveFunction: mockedSaveFunction as unknown as SaveFunction,
          deleteShift: mockedDeleteShift as unknown as DeleteShiftFunction,
        },
      });

      await wrapper.find("button.absolute.top-1.right-2").trigger("click");
      expect(mockedCloseModal).toHaveBeenCalledTimes(1);
    });

    it("calls closeModal prop when 'Close' button is clicked", async () => {
      const wrapper = mount(Modal, {
        props: {
          date: new Date(MOCK_DATE_STR),
          closeModal: mockedCloseModal as unknown as CloseModalFunction,
          saveFunction: mockedSaveFunction as unknown as SaveFunction,
          deleteShift: mockedDeleteShift as unknown as DeleteShiftFunction,
        },
      });

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
          date: new Date(MOCK_DATE_STR),
          closeModal: mockedCloseModal as unknown as CloseModalFunction,
          saveFunction: mockedSaveFunction as unknown as SaveFunction,
          deleteShift: mockedDeleteShift as unknown as DeleteShiftFunction,
        },
      });
      const vm = wrapper.vm as ModalVm;

      vm.defaultFrom = "10:00";
      vm.defaultTo = "18:00";
      vm.defaultDate = "2025-05-25";

      await wrapper
        .findAll("button.bg-blue-600")
        .filter((b) => b.text().includes("Save"))[0]
        .trigger("click");

      const expectedStartISO = new Date("2025-05-25T10:00:00").toISOString();
      const expectedEndISO = new Date("2025-05-25T18:00:00").toISOString();

      expect(mockedSaveFunction).toHaveBeenCalledTimes(1);
      expect(mockedSaveFunction).toHaveBeenCalledWith(
        {
          start: expectedStartISO,
          end: expectedEndISO,
        },
        undefined
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
          date: new Date(MOCK_DATE_STR),
          closeModal: mockedCloseModal as unknown as CloseModalFunction,
          saveFunction: mockedSaveFunction as unknown as SaveFunction,
          deleteShift: mockedDeleteShift as unknown as DeleteShiftFunction,
        },
      });
      const vm = wrapper.vm as ModalVm;

      vm.defaultFrom = "08:00";
      vm.defaultTo = "16:00";
      vm.defaultDate = "2025-05-15";

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
        mockShift.id
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
          date: new Date(MOCK_DATE_STR),
          closeModal: mockedCloseModal as unknown as CloseModalFunction,
          saveFunction: mockedSaveFunction as unknown as SaveFunction,
          deleteShift: mockedDeleteShift as unknown as DeleteShiftFunction,
        },
      });

      const deleteButton = wrapper.find(".mt-5 button.bg-red-600");

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
          date: new Date(MOCK_DATE_STR),
          closeModal: mockedCloseModal as unknown as CloseModalFunction,
          saveFunction: mockedSaveFunction as unknown as SaveFunction,
          deleteShift: mockedDeleteShift as unknown as DeleteShiftFunction,
        },
      });

      const deleteButton = wrapper.find(".mt-5.mx-auto button.bg-red-600");

      expect(deleteButton.exists()).toBe(true);
      await deleteButton.trigger("click");

      expect(mockedDeleteShift).toHaveBeenCalledTimes(1);
      expect(mockedDeleteShift).toHaveBeenCalledWith(mockShift.id);
      expect(mockedCloseModal).toHaveBeenCalledTimes(1);
    });

    it("does not call deleteShift if selectedShift is null (should be hidden anyway)", async () => {
      const wrapper = mount(Modal, {
        props: {
          date: new Date(MOCK_DATE_STR),
          closeModal: mockedCloseModal as unknown as CloseModalFunction,
          saveFunction: mockedSaveFunction as unknown as SaveFunction,
          deleteShift: mockedDeleteShift as unknown as DeleteShiftFunction,
        },
      });

      expect(wrapper.find("button.bg-red-600").exists()).toBe(false);

      const vm = wrapper.vm as ModalVm;
      vm.handleDelete();

      expect(mockedDeleteShift).not.toHaveBeenCalled();
      expect(mockedCloseModal).toHaveBeenCalledTimes(1);
    });
  });

  it("updates defaultFrom and defaultTo when input fields are changed", async () => {
    const wrapper = mount(Modal, {
      props: {
        date: new Date(MOCK_DATE_STR),
        closeModal: mockedCloseModal as unknown as CloseModalFunction,
        saveFunction: mockedSaveFunction as unknown as SaveFunction,
        deleteShift: mockedDeleteShift as unknown as DeleteShiftFunction,
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
        date: new Date(MOCK_DATE_STR),
        closeModal: mockedCloseModal as unknown as CloseModalFunction,
        saveFunction: mockedSaveFunction as unknown as SaveFunction,
        deleteShift: mockedDeleteShift as unknown as DeleteShiftFunction,
      },
    });
    const vm = wrapper.vm as ModalVm;

    const dateInput = wrapper.find<HTMLInputElement>('input[type="date"]');

    await dateInput.setValue("2026-01-01");

    expect(vm.defaultDate).toBe("2026-01-01");
  });
});
