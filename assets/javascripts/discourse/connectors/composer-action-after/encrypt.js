import { computed, defineProperty } from "@ember/object";
import {
  ENCRYPT_ACTIVE,
  ENCRYPT_DISABLED,
  getEncryptionStatus,
} from "discourse/plugins/discourse-encrypt/lib/discourse";
import I18n from "I18n";

export default {
  setupComponent(args, component) {
    const { currentUser } = component;

    component.setProperties({
      encryptStatus: getEncryptionStatus(currentUser),

      listener() {
        component.set("encryptStatus", getEncryptionStatus(currentUser));
      },

      didInsertElement() {
        this._super(...arguments);
        this.appEvents.on("encrypt:status-changed", this, this.listener);
      },

      willDestroyElement() {
        this._super(...arguments);
        this.appEvents.off("encrypt:status-changed", this, this.listener);
      },
    });

    defineProperty(
      component,
      "isEncryptEnabled",
      computed("encryptStatus", () => this.encryptStatus !== ENCRYPT_DISABLED)
    );

    defineProperty(
      component,
      "isEncryptActive",
      computed("encryptStatus", () => this.encryptStatus === ENCRYPT_ACTIVE)
    );

    // Whether the encrypt controls should be displayed or not
    //
    // These are displayed only for new topics or already encrypted topics.
    defineProperty(
      component,
      "showEncryptControls",
      computed(
        "model.isNew",
        "model.creatingPrivateMessage",
        "model.topic.encrypted_title",
        () => {
          return (
            (this.model.isNew && this.model.creatingPrivateMessage) ||
            (this.model.topic && this.model.topic.encrypted_title)
          );
        }
      )
    );

    // Whether the user can encrypt the current message or not.
    //
    // This is true usually when an encrypt error is set:
    //  - the user does not have a key for the current topic
    //  - one of the recipients is a group
    //  - one of the recipients did not enable encrypt
    defineProperty(
      component,
      "canEncrypt",
      computed("model.encryptError", () => {
        return !this.model.encryptError;
      })
    );

    // Whether the user can disable encryption for the current message or not.
    //
    // A user cannot disable encryption when replying to an already encrypted
    // private message.
    defineProperty(
      component,
      "canDisableEncrypt",
      computed("model.topic.encrypted_title", () => {
        return !(this.model.topic && this.model.topic.encrypted_title);
      })
    );

    // Whether the encryption checkbox is disabled or not.
    defineProperty(
      component,
      "disabled",
      computed("model.isEncrypted", "canEncrypt", "canDisableEncrypt", () => {
        return this.model.isEncrypted
          ? !this.canDisableEncrypt
          : !this.canEncrypt;
      })
    );

    defineProperty(
      component,
      "title",
      computed("model.isEncrypted", "model.encryptError", () => {
        if (this.model.encryptError) {
          return this.model.encryptError;
        } else if (this.model.isEncrypted) {
          return I18n.t("encrypt.checkbox.checked");
        } else {
          return I18n.t("encrypt.checkbox.unchecked");
        }
      })
    );
  },

  actions: {
    clicked() {
      if (!this.disabled) {
        this.model.setProperties({
          isEncrypted: !this.model.isEncrypted,
          isEncryptedChanged: true,
          showEncryptError: !this.model.isEncrypted,
          deleteAfterMinutes: null,
          deleteAfterMinutesLabel: null,
        });
      } else {
        this.model.set("showEncryptError", !this.model.showEncryptError);
      }
    },

    timerClicked(actionId, args) {
      if (actionId) {
        this.model.setProperties({
          deleteAfterMinutes: actionId,
          deleteAfterMinutesLabel: args?.name,
        });
      } else {
        this.model.setProperties({
          deleteAfterMinutes: null,
          deleteAfterMinutesLabel: null,
        });
      }
    },
  },
};
