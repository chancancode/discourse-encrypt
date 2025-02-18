import { base64ToBuffer } from "discourse/plugins/discourse-encrypt/lib/base64";
import { getMetadata } from "discourse/plugins/discourse-encrypt/lib/uploads";
import { module, test } from "qunit";

const TEST_IMG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const SITE_SETTINGS = { max_image_width: 100, max_image_height: 100 };

module("discourse-encrypt:lib:uploadHandler", function () {
  test("getMetadata - image file", async function (assert) {
    const file = new File([base64ToBuffer(TEST_IMG_BASE64)], "test.png", {
      type: "image/png",
    });
    const data = await getMetadata(file, SITE_SETTINGS);
    assert.equal(data.original_filename, "test.png");
    assert.equal(data.width, 1);
    assert.equal(data.height, 1);
    assert.equal(data.thumbnail_width, 1);
    assert.equal(data.thumbnail_height, 1);
    assert.ok(data.url);
  });

  test("getMetadata - other file", async function (assert) {
    const file = new File(["test"], "test.txt", { type: "text/plain" });
    const data = await getMetadata(file, SITE_SETTINGS);
    assert.equal(data.original_filename, "test.txt");
  });
});
