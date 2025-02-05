import TaskLabel from "./TaskLabel.vue";

describe("TaskLabel.cy.tsx", () => {
  it("playground", () => {
    const trashSelector = "[data-testid=clear-label]"
    const onDeleteSpy = cy.spy().as("deleteSpy")
    cy.mount(<div class="space-y-4 m-20">
      <TaskLabel 
        value="High Priority" 
        color="red"
        onDelete={onDeleteSpy}
      >

      </TaskLabel>
      <TaskLabel value="Medium Priority" color="violet"></TaskLabel>
      <TaskLabel value="Meh" color="darkyellow"></TaskLabel>
    </div>)
      .get(trashSelector)
      .first()
      .click()
      .get("@deleteSpy")
      .should("have.been.called");
  })
})