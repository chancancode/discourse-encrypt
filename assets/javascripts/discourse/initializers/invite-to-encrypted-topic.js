import { ajax } from "discourse/lib/ajax";
import { withPluginApi } from "discourse/lib/plugin-api";
import {
  ENCRYPT_ACTIVE,
  getEncryptionStatus,
  getTopicKey,
  getUserIdentities,
  hasTopicKey,
} from "discourse/plugins/discourse-encrypt/lib/discourse";
import { exportKey } from "discourse/plugins/discourse-encrypt/lib/protocol";
import I18n from "I18n";
import { Promise } from "rsvp";

export default {
  name: "invite-to-encrypted-topic",

  initialize(container) {
    const currentUser = container.lookup("current-user:main");
    if (getEncryptionStatus(currentUser) !== ENCRYPT_ACTIVE) {
      return;
    }

    withPluginApi("0.11.3", (api) => {
      api.modifyClass("model:topic", {
        pluginId: "invite-to-encrypted-topic",

        createInvite(user, group_ids, custom_message) {
          // TODO: https://github.com/emberjs/ember.js/issues/15291
          let { _super } = this;
          if (!hasTopicKey(this.id)) {
            return _super.call(this, ...arguments);
          }

          return Promise.all([getTopicKey(this.id), getUserIdentities([user])])
            .then(([key, identities]) =>
              exportKey(key, identities[user].encryptPublic)
            )
            .then((key) => {
              ajax(`/t/${this.id}/invite`, {
                type: "POST",
                data: { user, key, group_ids, custom_message },
              });
            })
            .catch((username) => {
              const dialog = container.lookup("service:dialog");
              dialog.alert(
                I18n.t("encrypt.composer.user_has_no_key", { username })
              );
              return Promise.reject(username);
            });
        },
      });
    });
  },
};
