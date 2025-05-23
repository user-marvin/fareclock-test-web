import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import Dashboard from "../../../src/components/Dashboard.vue";
import Shift from "../../../src/components/shift/Shift.vue";

describe("Index.vue", () => {
  it("renders the Shift component", () => {
    const wrapper = mount(Dashboard, {
      global: {
        stubs: {
          Shift: true,
        },
      },
    });

    // Assert that the Dashboard component itself is rendered
    expect(wrapper.exists()).toBe(true);

    // Assert that the Shift component is rendered
    expect(wrapper.findComponent(Shift).exists()).toBe(true);
  });
});
