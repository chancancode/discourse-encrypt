import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";
import ModalFunctionality from "discourse/mixins/modal-functionality";
import { reload } from "discourse/plugins/discourse-encrypt/lib/discourse";

export default Ember.Controller.extend(ModalFunctionality, {
  onShow() {
    this.setProperties({
      inProgress: false,
      everything: true
    });
  },

  actions: {
    reset() {
      this.set("inProgress", true);
      ajax("/encrypt/reset", {
        type: "POST",
        data: {
          user_id: this.get("model.id"),
          everything: this.everything
        }
      })
        .then(() => {
          this.appEvents.trigger("encrypt:status-changed");
          reload();
        })
        .catch(popupAjaxError);
    }
  }
});
